import { useState, useCallback, useRef } from 'react'
import type React from 'react'

export interface UseViewerTransformResult {
  zoom: number
  rotation: number
  isFlipped: boolean
  panX: number
  panY: number
  isDragging: boolean
  zoomIn: () => void
  zoomOut: () => void
  rotate: () => void
  toggleFlip: () => void
  resetTransform: () => void
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUp: () => void
}

export function useViewerTransform(): UseViewerTransformResult {
  const [zoom, setZoom] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [isFlipped, setIsFlipped] = useState<boolean>(false)
  const [panX, setPanX] = useState<number>(0)
  const [panY, setPanY] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const startDragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

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

  // Reset all transforms and panning
  const resetTransform = useCallback(() => {
    setZoom(1.0)
    setRotation(0)
    setIsFlipped(false)
    setPanX(0)
    setPanY(0)
  }, [])

  // Mouse Drag to Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only initiate dragging with the primary (left) button
    if (e.button !== 0) return
    e.preventDefault()
    startDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX,
      panY,
    }
    setIsDragging(true)
  }, [panX, panY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!startDragRef.current) return
    
    // Safety check: if left mouse button is released outside target
    if (e.buttons !== 1) {
      startDragRef.current = null
      setIsDragging(false)
      return
    }

    e.preventDefault()
    const dx = e.clientX - startDragRef.current.x
    const dy = e.clientY - startDragRef.current.y
    setPanX(startDragRef.current.panX + dx)
    setPanY(startDragRef.current.panY + dy)
  }, [])

  const handleMouseUp = useCallback(() => {
    startDragRef.current = null
    setIsDragging(false)
  }, [])

  return {
    zoom,
    rotation,
    isFlipped,
    panX,
    panY,
    isDragging,
    zoomIn,
    zoomOut,
    rotate,
    toggleFlip,
    resetTransform,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
