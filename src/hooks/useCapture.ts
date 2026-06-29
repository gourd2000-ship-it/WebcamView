import { useState, useCallback } from 'react'
import { drawTransformedCanvas } from '../utils/canvas'
import { generateCaptureFileName } from '../utils/fileName'

export interface UseCaptureResult {
  isCapturing: boolean
  capture: (
    source: HTMLVideoElement | HTMLImageElement | null,
    zoom: number,
    rotation: number,
    isFlipped: boolean,
    annotationCanvas?: HTMLCanvasElement | null,
    filters?: { brightness: number; contrast: number; isInverted: boolean; isGrayscale: boolean }
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>
}

export function useCapture(): UseCaptureResult {
  const [isCapturing, setIsCapturing] = useState<boolean>(false)

  const capture = useCallback(
    async (
      source: HTMLVideoElement | HTMLImageElement | null,
      zoom: number,
      rotation: number,
      isFlipped: boolean,
      annotationCanvas: HTMLCanvasElement | null = null,
      filters = { brightness: 100, contrast: 100, isInverted: false, isGrayscale: false }
    ) => {
      if (!source) {
        return { success: false, error: '카메라 영상 소스가 없습니다.' }
      }

      setIsCapturing(true)
      try {
        // Draw the transformed frame onto canvas with annotations and filters
        const canvas = drawTransformedCanvas(source, zoom, rotation, isFlipped, annotationCanvas, filters)
        
        // Convert canvas to Blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png')
        })

        if (!blob) {
          throw new Error('Canvas conversion to Blob failed')
        }

        // Convert Blob to ArrayBuffer for IPC transmission
        const arrayBuffer = await blob.arrayBuffer()
        const fileName = generateCaptureFileName()

        // Call preload bridge IPC
        if (!window.electronAPI) {
          throw new Error('Electron API가 로드되지 않았습니다. 브라우저 모드에서는 저장이 불가합니다.')
        }

        const result = await window.electronAPI.saveCapture(arrayBuffer, fileName)
        return result
      } catch (err: any) {
        console.error('Capture failed:', err)
        return { 
          success: false, 
          error: err.message || '캡처 이미지 저장 중 알 수 없는 오류가 발생했습니다.' 
        }
      } finally {
        setIsCapturing(false)
      }
    },
    []
  )

  return {
    isCapturing,
    capture,
  }
}
