import { useState, useEffect, useRef, useCallback } from 'react'
import { generateRecordFileName } from '../utils/fileName'

export interface UseRecordResult {
  isRecording: boolean
  recordingTime: number // 초 단위 경과 시간
  startRecording: (stream: MediaStream | null) => void
  stopRecording: () => Promise<{ success: boolean; filePath?: string; error?: string } | null>
}

export function useRecord(): UseRecordResult {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerIdRef = useRef<any>(null)
  
  // startRecording
  const startRecording = useCallback((stream: MediaStream | null) => {
    if (!stream) {
      console.warn('Cannot start recording: stream is null')
      return
    }

    chunksRef.current = []
    setRecordingTime(0)

    try {
      let options = { mimeType: 'video/webm;codecs=vp9' }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' }
      }

      const recorder = new MediaRecorder(stream, options)
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.start(1000) // 1초 단위로 안전하게 청크 추출
      mediaRecorderRef.current = recorder
      setIsRecording(true)

      // 타이머 가동
      timerIdRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start MediaRecorder:', error)
    }
  }, [])

  // stopRecording
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return null
    }

    return new Promise<{ success: boolean; filePath?: string; error?: string }>((resolve) => {
      const recorder = mediaRecorderRef.current!
      
      recorder.onstop = async () => {
        setIsRecording(false)
        if (timerIdRef.current) {
          clearInterval(timerIdRef.current)
          timerIdRef.current = null
        }

        try {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' })
          chunksRef.current = []
          
          if (blob.size === 0) {
            resolve({ success: false, error: '녹화된 비디오 데이터가 존재하지 않습니다.' })
            return
          }

          const arrayBuffer = await blob.arrayBuffer()
          const fileName = generateRecordFileName()

          if (!window.electronAPI) {
            resolve({ success: false, error: 'Electron API가 로드되지 않았습니다. 브라우저 환경에서는 저장이 불가합니다.' })
            return
          }

          const result = await window.electronAPI.saveRecord(arrayBuffer, fileName)
          resolve(result)
        } catch (err: any) {
          console.error('Recording save failed:', err)
          resolve({ success: false, error: err.message || '녹화 파일 저장 중 오류가 발생했습니다.' })
        }
      }

      recorder.stop()
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
  }
}
