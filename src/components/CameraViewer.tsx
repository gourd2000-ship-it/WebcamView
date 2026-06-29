import React from 'react'
import { EmptyState } from './EmptyState'
import { AnnotationCanvas } from './AnnotationCanvas'
import type { DrawingPath } from './AnnotationCanvas'
import { cn } from '../utils/cn'

interface CameraViewerProps {
  viewerRef: React.RefObject<HTMLVideoElement | HTMLImageElement | null>
  stream: MediaStream | null
  isCameraActive: boolean
  isFrozen: boolean
  frozenDataUrl: string | null
  zoom: number
  rotation: number
  isFlipped: boolean
  panX: number
  panY: number
  isDragging: boolean
  isFullscreen: boolean
  error: string | null
  onRequestPermission: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
  
  // Annotation Props
  activeTool: 'select' | 'pen' | 'highlighter' | 'eraser' | 'line' | 'rect' | 'circle' | 'arrow'
  brushColor: string
  brushSize: number
  paths: DrawingPath[]
  setPaths: React.Dispatch<React.SetStateAction<DrawingPath[]>>
  annotationCanvasRef: React.RefObject<HTMLCanvasElement | null>
}

export const CameraViewer: React.FC<CameraViewerProps> = ({
  viewerRef,
  stream,
  isCameraActive,
  isFrozen,
  frozenDataUrl,
  zoom,
  rotation,
  isFlipped,
  panX,
  panY,
  isDragging,
  isFullscreen,
  error,
  onRequestPermission,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  
  activeTool,
  brushColor,
  brushSize,
  paths,
  setPaths,
  annotationCanvasRef,
}) => {
  const [canvasWidth, setCanvasWidth] = React.useState(1920)
  const [canvasHeight, setCanvasHeight] = React.useState(1080)

  // Bind MediaStream to video element srcObject
  React.useEffect(() => {
    if (viewerRef.current && viewerRef.current instanceof HTMLVideoElement) {
      if (stream && !isFrozen) {
        viewerRef.current.srcObject = stream
      } else {
        viewerRef.current.srcObject = null
      }
    }
  }, [viewerRef, stream, isFrozen, isCameraActive])

  // Track actual media dimensions to keep annotation canvas scaled exactly 1:1
  React.useEffect(() => {
    const el = viewerRef.current
    if (!el || !isCameraActive) return

    const updateSize = () => {
      if (el instanceof HTMLVideoElement) {
        if (el.videoWidth > 0 && el.videoHeight > 0) {
          setCanvasWidth(el.videoWidth)
          setCanvasHeight(el.videoHeight)
        }
      } else if (el instanceof HTMLImageElement) {
        if (el.naturalWidth > 0 && el.naturalHeight > 0) {
          setCanvasWidth(el.naturalWidth)
          setCanvasHeight(el.naturalHeight)
        }
      }
    }

    if (el instanceof HTMLVideoElement) {
      el.addEventListener('loadedmetadata', updateSize)
      updateSize()
      return () => el.removeEventListener('loadedmetadata', updateSize)
    } else {
      el.addEventListener('load', updateSize)
      updateSize()
      return () => el.removeEventListener('load', updateSize)
    }
  }, [viewerRef, stream, isFrozen, isCameraActive])

  // Compute transform style string
  const transformStyle = {
    transform: `translate(${panX}px, ${panY}px) rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1}) scale(${zoom})`,
    transformOrigin: 'center center',
  }

  // Disable transitions while dragging for instant responsive feedback
  const transitionClass = isDragging ? 'transition-none' : 'transition-transform duration-200 ease-out'
  
  // Cursor switches to crosshair for drawing, grab for panning, default otherwise
  const isDrawingActive = activeTool !== 'select'
  const cursorClass = isDrawingActive
    ? 'cursor-default' // Handled by AnnotationCanvas child
    : (isDragging ? 'cursor-grabbing' : (zoom > 1 ? 'cursor-grab' : 'cursor-default'))

  return (
    <div className="flex-1 relative flex items-center justify-center bg-[#111215] overflow-hidden select-none">
      {!isCameraActive ? (
        <EmptyState error={error} onRequestPermission={onRequestPermission} />
      ) : (
        <div className={cn("w-full h-full flex items-center justify-center", isFullscreen ? "p-0" : "p-4")}>
          <div
            onMouseDown={isDrawingActive ? undefined : onMouseDown}
            onMouseMove={isDrawingActive ? undefined : onMouseMove}
            onMouseUp={isDrawingActive ? undefined : onMouseUp}
            onMouseLeave={isDrawingActive ? undefined : onMouseUp}
            className={cn(
              "relative w-full h-full flex items-center justify-center overflow-hidden bg-[#08090b]",
              isFullscreen ? "rounded-none border-0" : "rounded-2xl border border-[#2e3039]",
              cursorClass
            )}
          >
            {isFrozen && frozenDataUrl ? (
              <img
                ref={viewerRef as React.RefObject<HTMLImageElement | null>}
                src={frozenDataUrl}
                alt="Frozen frame"
                style={transformStyle}
                className={cn(
                  "pointer-events-none",
                  isFullscreen ? "w-full h-full object-cover" : "max-w-full max-h-full object-contain",
                  transitionClass
                )}
              />
            ) : (
              <video
                ref={viewerRef as React.RefObject<HTMLVideoElement | null>}
                autoPlay
                playsInline
                muted
                style={transformStyle}
                className={cn(
                  "pointer-events-none",
                  isFullscreen ? "w-full h-full object-cover" : "max-w-full max-h-full object-contain",
                  transitionClass
                )}
              />
            )}

            {/* Annotation Canvas Overlay Layer (Same exact size and transform) */}
            <AnnotationCanvas
              canvasRef={annotationCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
              tool={activeTool === 'select' ? 'pen' : activeTool}
              color={brushColor}
              thickness={brushSize}
              isDrawingModeActive={isDrawingActive}
              paths={paths}
              setPaths={setPaths}
              isCameraActive={isCameraActive}
              style={transformStyle}
              className={cn(
                isFullscreen ? "w-full h-full object-cover" : "max-w-full max-h-full object-contain",
                transitionClass
              )}
            />

            {/* Indicator overlays */}
            {isFrozen && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold shadow-lg uppercase tracking-wider animate-pulse z-20">
                화면 정지됨 (Space)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
