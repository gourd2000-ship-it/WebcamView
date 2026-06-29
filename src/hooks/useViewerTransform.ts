import { useState, useCallback, useRef, useEffect } from 'react'
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

  // Reset panning automatically when zoom returns to 1.0 or lower
  useEffect(() => {
    if (zoom <= 1.0) {
      setPanX(0)
      setPanY(0)
    }
  }, [zoom])

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
    // Only allow panning if zoom is greater than 100%
    if (zoom <= 1.0) return
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
  }, [panX, panY, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!startDragRef.current) return
    
    // Safety check: if left mouse button is released outside target
    if (e.buttons !== 1) {
      startDragRef.current = null
      setIsDragging(false)
      return
    }

    if (zoom <= 1.0) return

    e.preventDefault()
    
    const container = e.currentTarget as HTMLElement
    const mediaEl = container.querySelector('video, img') as HTMLVideoElement | HTMLImageElement | null
    
    let constrainedPanX = 0
    let constrainedPanY = 0
    
    const targetPanX = startDragRef.current.panX + (e.clientX - startDragRef.current.x)
    const targetPanY = startDragRef.current.panY + (e.clientY - startDragRef.current.y)

    if (mediaEl) {
      const W = container.clientWidth
      const H = container.clientHeight
      
      const srcW = mediaEl instanceof HTMLVideoElement ? mediaEl.videoWidth : (mediaEl as HTMLImageElement).naturalWidth || 0
      const srcH = mediaEl instanceof HTMLVideoElement ? mediaEl.videoHeight : (mediaEl as HTMLImageElement).naturalHeight || 0
      
      if (srcW > 0 && srcH > 0) {
        const videoRatio = srcW / srcH
        const containerRatio = W / H
        const isCover = mediaEl.classList.contains('object-cover')
        
        let w = W
        let h = H
        
        if (isCover) {
          if (videoRatio > containerRatio) {
            h = H
            w = H * videoRatio
          } else {
            w = W
            h = W / videoRatio
          }
        } else {
          // contain mode
          if (videoRatio > containerRatio) {
            w = W
            h = W / videoRatio
          } else {
            h = H
            w = H * videoRatio
          }
        }
        
        // Calculate visual dimensions after scaling
        const zoomedW = w * zoom
        const zoomedH = h * zoom
        
        // Calculate max pan limits to prevent exposing empty margins
        const maxPanX = zoomedW > W ? (zoomedW - W) / 2 : 0
        const maxPanY = zoomedH > H ? (zoomedH - H) / 2 : 0
        
        constrainedPanX = Math.max(-maxPanX, Math.min(maxPanX, targetPanX))
        constrainedPanY = Math.max(-maxPanY, Math.min(maxPanY, targetPanY))
      } else {
        constrainedPanX = targetPanX
        constrainedPanY = targetPanY
      }
    } else {
      constrainedPanX = targetPanX
      constrainedPanY = targetPanY
    }

    setPanX(constrainedPanX)
    setPanY(constrainedPanY)
  }, [zoom])

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
