import { useState, useCallback } from 'react'

export interface UseViewerTransformResult {
  zoom: number
  rotation: number
  isFlipped: boolean
  zoomIn: () => void
  zoomOut: () => void
  rotate: () => void
  toggleFlip: () => void
  resetTransform: () => void
}

export function useViewerTransform(): UseViewerTransformResult {
  const [zoom, setZoom] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [isFlipped, setIsFlipped] = useState<boolean>(false)

  // Zoom In: Max 500% (5.0)
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(parseFloat((prev + 0.1).toFixed(1)), 5.0))
  }, [])

  // Zoom Out: Min 100% (1.0)
  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(parseFloat((prev - 0.1).toFixed(1)), 1.0))
  }, [])

  // Rotate Clockwise: 0 -> 90 -> 180 -> 270 -> 0
  const rotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360)
  }, [])

  // Toggle Flip (Horizontal Mirror)
  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  // Reset to default
  const resetTransform = useCallback(() => {
    setZoom(1.0)
    setRotation(0)
    setIsFlipped(false)
  }, [])

  return {
    zoom,
    rotation,
    isFlipped,
    zoomIn,
    zoomOut,
    rotate,
    toggleFlip,
    resetTransform,
  }
}
