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
  const actualMimeTypeRef = useRef<string>('video/webm')
  
  // startRecording
  const startRecording = useCallback((stream: MediaStream | null) => {
    if (!stream) {
      console.warn('Cannot start recording: stream is null')
      return
    }

    chunksRef.current = []
    setRecordingTime(0)

    try {
      // 윈도우 미디어 플레이어 및 타 플레이어 호환성이 높은 코덱 우선순위 리스트
      const candidates = [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm'
      ]

      let options: MediaRecorderOptions = {}
      let selectedType = 'video/webm'

      for (const mime of candidates) {
        if (MediaRecorder.isTypeSupported(mime)) {
          options = { mimeType: mime }
          selectedType = mime
          break
        }
      }

      console.log('Using Recorder MIME type:', selectedType)
      actualMimeTypeRef.current = selectedType

      const recorder = new MediaRecorder(stream, options)
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.start(1000) // 1초 단위로 청크 추출
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

    // 캡처 비동기 스냅샷 시점의 녹음 시간 복사
    const durationSec = recordingTime

    return new Promise<{ success: boolean; filePath?: string; error?: string }>((resolve) => {
      const recorder = mediaRecorderRef.current!
      
      recorder.onstop = async () => {
        setIsRecording(false)
        if (timerIdRef.current) {
          clearInterval(timerIdRef.current)
          timerIdRef.current = null
        }

        try {
          const mime = actualMimeTypeRef.current
          const isMp4 = mime.includes('mp4')
          const outputMime = isMp4 ? 'video/mp4' : 'video/webm'
          
          let blob = new Blob(chunksRef.current, { type: outputMime })
          chunksRef.current = []
          
          if (blob.size === 0) {
            resolve({ success: false, error: '녹화된 비디오 데이터가 존재하지 않습니다.' })
            return
          }

          let arrayBuffer = await blob.arrayBuffer()

          // WebM 형식으로 저장된 경우에만 재생시간(Duration) 메타데이터 정정 적용
          if (!isMp4 && durationSec > 0) {
            try {
              const { fixWebmDuration } = await import('../utils/webmFix')
              arrayBuffer = fixWebmDuration(arrayBuffer, durationSec * 1000)
            } catch (fixErr) {
              console.warn('Failed to fix WebM duration:', fixErr)
            }
          }

          const ext = isMp4 ? 'mp4' : 'webm'
          const fileName = generateRecordFileName(ext)

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
  }, [recordingTime])

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
