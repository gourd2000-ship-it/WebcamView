import { useState, useEffect, useCallback, useRef } from 'react'
import { stopStream } from '../utils/stream'
import { createVirtualCameraStream } from '../utils/virtualCamera'

export interface UseCameraResult {
  devices: MediaDeviceInfo[]
  selectedDeviceId: string
  setSelectedDeviceId: (id: string) => void
  isCameraActive: boolean
  setIsCameraActive: (active: boolean) => void
  stream: MediaStream | null
  isFrozen: boolean
  setIsFrozen: (frozen: boolean) => void
  frozenDataUrl: string | null
  setFrozenDataUrl: (url: string | null) => void
  isLoading: boolean
  error: string | null
  setError: (err: string | null) => void
  requestPermission: () => Promise<void>
  isAutoFocusSupported: boolean
  isFocusLocked: boolean
  toggleFocusLock: () => Promise<boolean>
  focusDistance: number
  focusDistanceRange: { min: number; max: number; step: number } | null
  isFocusDistanceSupported: boolean
  setManualFocusDistance: (value: number) => Promise<boolean>
}

export function useCamera(): UseCameraResult {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  // Freeze States
  const [isFrozen, setIsFrozen] = useState<boolean>(false)
  const [frozenDataUrl, setFrozenDataUrl] = useState<string | null>(null)
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isAutoFocusSupported, setIsAutoFocusSupported] = useState<boolean>(false)
  const [isFocusLocked, setIsFocusLocked] = useState<boolean>(false)
  const [focusDistance, setFocusDistance] = useState<number>(0)
  const [focusDistanceRange, setFocusDistanceRange] = useState<{ min: number; max: number; step: number } | null>(null)
  const [isFocusDistanceSupported, setIsFocusDistanceSupported] = useState<boolean>(false)

  // Track active stream ref to prevent closure conflicts
  const activeStreamRef = useRef<MediaStream | null>(null)

  // Helper to enumerate video devices
  const refreshDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput')
      
      const virtualDevice: MediaDeviceInfo = {
        deviceId: 'virtual-camera',
        groupId: 'virtual',
        kind: 'videoinput',
        label: '가상 카메라 (시뮬레이터) 🧪',
        toJSON: () => ({})
      }

      const combinedDevices = [...videoDevices, virtualDevice]
      setDevices(combinedDevices)
      
      // Auto-select first device if none is selected
      if (combinedDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(combinedDevices[0].deviceId)
      }
    } catch (err) {
      console.error('Failed to enumerate devices:', err)
      setError('카메라 장치 목록을 불러오는 데 실패했습니다.')
    }
  }, [selectedDeviceId])

  // Request permission explicitly
  const requestPermission = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Stop temp stream tracks immediately
      tempStream.getTracks().forEach((track) => track.stop())
      await refreshDevices()
    } catch (err: any) {
      console.error('Camera permission request failed:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('카메라 접근 권한이 거부되었습니다. Windows 설정이나 브라우저 설정에서 웹캠 사용 권한을 확인하세요.')
      } else {
        setError('카메라 장치를 초기화하지 못했습니다. 장치가 연결되어 있거나 사용 중인지 확인해 주세요.')
      }
      await refreshDevices()
    } finally {
      setIsLoading(false)
    }
  }, [refreshDevices])

  // Enumerate devices on mount
  useEffect(() => {
    refreshDevices()
  }, [refreshDevices])

  // Manage Stream lifecycle based on selectedDeviceId and isCameraActive
  useEffect(() => {
    let active = true

    async function toggleStream() {
      // If camera is turned off or no device is selected, clean up
      if (!isCameraActive || !selectedDeviceId) {
        if (activeStreamRef.current) {
          stopStream(activeStreamRef.current)
          activeStreamRef.current = null
          setStream(null)
        }
        setIsFrozen(false)
        setFrozenDataUrl(null)
        return
      }

      setIsLoading(true)
      setError(null)

      // Stop previous stream before opening a new one
      if (activeStreamRef.current) {
        stopStream(activeStreamRef.current)
        activeStreamRef.current = null
        setStream(null)
      }

      try {
        let newStream: MediaStream

        if (selectedDeviceId === 'virtual-camera') {
          newStream = createVirtualCameraStream()
        } else {
          const constraints: MediaStreamConstraints = {
            video: {
              deviceId: { exact: selectedDeviceId },
              // ideal resolution for document reading
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          }
          newStream = await navigator.mediaDevices.getUserMedia(constraints)
        }
        
        if (active) {
          activeStreamRef.current = newStream
          setStream(newStream)
        } else {
          stopStream(newStream)
        }
      } catch (err: any) {
        console.error('Failed to get camera stream:', err)
        if (active) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('카메라 권한이 거부되었습니다. 웹캠 권한을 허용해 주세요.')
          } else {
            setError('카메라가 다른 앱에서 점유되어 있거나 사용할 수 없는 상태입니다.')
          }
          setIsCameraActive(false)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    toggleStream()

    return () => {
      active = false
    }
  }, [selectedDeviceId, isCameraActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        stopStream(activeStreamRef.current)
      }
    }
  }, [])

  // Reset focus lock state when stream changes
  useEffect(() => {
    setIsFocusLocked(false)
    setIsFocusDistanceSupported(false)
    setFocusDistanceRange(null)
    setFocusDistance(0)
  }, [stream])

  // Detect auto focus and focus distance support
  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        try {
          const capabilities = (typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {}) as any
          setIsAutoFocusSupported(
            !!(capabilities.focusMode && 
               capabilities.focusMode.includes('continuous') && 
               capabilities.focusMode.includes('manual'))
          )
          
          const isDistSupported = !!(capabilities.focusDistance)
          setIsFocusDistanceSupported(isDistSupported)
          if (isDistSupported) {
            setFocusDistanceRange({
              min: capabilities.focusDistance.min,
              max: capabilities.focusDistance.max,
              step: capabilities.focusDistance.step || 1
            })
            
            // Sync current setting
            const settings = (typeof videoTrack.getSettings === 'function' ? videoTrack.getSettings() : {}) as any
            if (typeof settings.focusDistance === 'number') {
              setFocusDistance(settings.focusDistance)
            } else {
              setFocusDistance((capabilities.focusDistance.min + capabilities.focusDistance.max) / 2)
            }
          } else {
            setFocusDistanceRange(null)
            setFocusDistance(0)
          }
        } catch (e) {
          console.error('Error reading video capabilities:', e)
          setIsAutoFocusSupported(false)
          setIsFocusDistanceSupported(false)
          setFocusDistanceRange(null)
          setFocusDistance(0)
        }
      } else {
        setIsAutoFocusSupported(false)
        setIsFocusDistanceSupported(false)
        setFocusDistanceRange(null)
        setFocusDistance(0)
      }
    } else {
      setIsAutoFocusSupported(false)
      setIsFocusDistanceSupported(false)
      setFocusDistanceRange(null)
      setFocusDistance(0)
    }
  }, [stream])

  const toggleFocusLock = useCallback(async () => {
    if (!stream) return false
    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return false

    try {
      const capabilities = (typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {}) as any
      if (!capabilities.focusMode || 
          !capabilities.focusMode.includes('manual') || 
          !capabilities.focusMode.includes('continuous')) {
        return false
      }

      const nextLockState = !isFocusLocked
      // Set focusMode to 'manual' to lock it, or 'continuous' to unlock (autofocus)
      await videoTrack.applyConstraints({
        advanced: [{ focusMode: nextLockState ? 'manual' : 'continuous' } as any]
      })
      
      setIsFocusLocked(nextLockState)
      return true
    } catch (err) {
      console.error('Failed to toggle focus lock:', err)
      return false
    }
  }, [stream, isFocusLocked])

  const setManualFocusDistance = useCallback(async (value: number) => {
    if (!stream) return false
    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return false

    try {
      await videoTrack.applyConstraints({
        advanced: [{ focusMode: 'manual', focusDistance: value } as any]
      })
      setFocusDistance(value)
      return true
    } catch (err) {
      console.error('Failed to set manual focus distance:', err)
      return false
    }
  }, [stream])

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    isCameraActive,
    setIsCameraActive,
    stream,
    isFrozen,
    setIsFrozen,
    frozenDataUrl,
    setFrozenDataUrl,
    isLoading,
    error,
    setError,
    requestPermission,
    isAutoFocusSupported,
    isFocusLocked,
    toggleFocusLock,
    focusDistance,
    focusDistanceRange,
    isFocusDistanceSupported,
    setManualFocusDistance,
  }
}
