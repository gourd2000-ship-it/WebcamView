import React from 'react'
import { EmptyState } from './EmptyState'

interface CameraViewerProps {
  viewerRef: React.RefObject<HTMLVideoElement | HTMLImageElement | null>
  stream: MediaStream | null
  isCameraActive: boolean
  isFrozen: boolean
  frozenDataUrl: string | null
  zoom: number
  rotation: number
  isFlipped: boolean
  error: string | null
  onRequestPermission: () => void
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
  error,
  onRequestPermission,
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
  // Order of transform is crucial: Mirror first, then rotate, then zoom
  const transformStyle = {
    transform: `rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1}) scale(${zoom})`,
    transformOrigin: 'center center',
  }

  return (
    <div className="flex-1 relative flex items-center justify-center bg-[#111215] overflow-hidden select-none">
      {!isCameraActive ? (
        <EmptyState error={error} onRequestPermission={onRequestPermission} />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl bg-[#08090b] border border-[#2e3039]">
            {isFrozen && frozenDataUrl ? (
              <img
                ref={viewerRef as React.RefObject<HTMLImageElement | null>}
                src={frozenDataUrl}
                alt="Frozen frame"
                style={transformStyle}
                className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out pointer-events-none"
              />
            ) : (
              <video
                ref={viewerRef as React.RefObject<HTMLVideoElement | null>}
                autoPlay
                playsInline
                muted
                style={transformStyle}
                className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out pointer-events-none"
              />
            )}

            {/* Indicator overlays */}
            {isFrozen && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold shadow-lg uppercase tracking-wider animate-pulse">
                화면 정지됨 (Space)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
