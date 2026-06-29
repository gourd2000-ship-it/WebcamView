import React from 'react'
import { EmptyState } from './EmptyState'
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
}) => {
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

  // Compute transform style string
  // translate is first so it translates in parent screen coordinate system
  const transformStyle = {
    transform: `translate(${panX}px, ${panY}px) rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1}) scale(${zoom})`,
    transformOrigin: 'center center',
  }

  // Disable transitions while dragging for instant responsive feedback
  const transitionClass = isDragging ? 'transition-none' : 'transition-transform duration-200 ease-out'
  const cursorClass = isDragging ? 'cursor-grabbing' : (zoom > 1 ? 'cursor-grab' : 'cursor-default')

  return (
    <div className="flex-1 relative flex items-center justify-center bg-[#111215] overflow-hidden select-none">
      {!isCameraActive ? (
        <EmptyState error={error} onRequestPermission={onRequestPermission} />
      ) : (
        <div className={cn("w-full h-full flex items-center justify-center", isFullscreen ? "p-0" : "p-4")}>
          <div
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
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
