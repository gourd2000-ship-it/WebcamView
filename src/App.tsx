import { useState, useEffect, useRef } from 'react'
import { StatusBar } from './components/StatusBar'
import { CameraViewer } from './components/CameraViewer'
import { Toolbar } from './components/Toolbar'
import { useCamera } from './hooks/useCamera'
import { useViewerTransform } from './hooks/useViewerTransform'
import { useFullscreen } from './hooks/useFullscreen'
import { useCapture } from './hooks/useCapture'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { cn } from './utils/cn'
import { CheckCircle2, AlertCircle } from 'lucide-react'

function App() {
  const {
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
    requestPermission,
  } = useCamera()

  // Viewer Transformation Hook
  const {
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
  } = useViewerTransform()

  // Fullscreen Hook
  const {
    isFullscreen,
    toggleFullscreen,
    exitFullscreen,
  } = useFullscreen()

  // Capture Hook
  const { isCapturing, capture } = useCapture()

  // Custom Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Fullscreen controls visibility
  const [showControls, setShowControls] = useState<boolean>(true)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // viewerRef points to active video or image element
  const viewerRef = useRef<HTMLVideoElement | HTMLImageElement | null>(null)

  // Handlers
  const handleSelectDevice = (id: string) => {
    setSelectedDeviceId(id)
  }

  const handleToggleCameraActive = () => {
    if (!isCameraActive) {
      if (devices.length === 0) {
        requestPermission()
      }
      setIsCameraActive(true)
    } else {
      setIsCameraActive(false)
    }
  }

  // Freeze Snapshot Handler
  const handleToggleFreeze = () => {
    if (isFrozen) {
      setIsFrozen(false)
      setFrozenDataUrl(null)
    } else {
      if (viewerRef.current && viewerRef.current instanceof HTMLVideoElement) {
        try {
          const video = viewerRef.current
          const canvas = document.createElement('canvas')
          
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 480
          const ctx = canvas.getContext('2d')
          
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const dataUrl = canvas.toDataURL('image/png')
            setFrozenDataUrl(dataUrl)
            setIsFrozen(true)
          }
        } catch (e) {
          console.error('Failed to freeze frame:', e)
          showToast('화면 일시정지 중 오류가 발생했습니다.', 'error')
        }
      }
    }
  }

  // Real capture and save handler
  const handleCapture = async () => {
    if (!viewerRef.current || !isCameraActive) return

    // In canvas rendering, we pass panX and panY to preserve the current pan crop
    // But since the customer request did not specify if crop should be saved,
    // let's pass the transforms to capture as usual.
    const result = await capture(viewerRef.current, zoom, rotation, isFlipped)
    
    if (result.success) {
      const fileName = result.filePath?.split(/\/|\\/).pop() || 'image.png'
      showToast(`성공적으로 저장되었습니다: ${fileName}`, 'success')
    } else {
      showToast(`저장 실패: ${result.error}`, 'error')
    }
  }

  // Global Keyboard Shortcuts Binding
  useKeyboardShortcuts({
    onToggleFreeze: handleToggleFreeze,
    onToggleFullscreen: toggleFullscreen,
    onToggleFlip: toggleFlip,
    onRotate: rotate,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onReset: resetTransform,
    onCapture: handleCapture,
    onExitFullscreen: exitFullscreen,
    isCameraActive,
  })

  // Fullscreen UI Control Autohide Effect
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true)
      return
    }

    let timeoutId: any = null

    const handleMouseMove = () => {
      setShowControls(true)
      if (timeoutId) clearTimeout(timeoutId)
      
      timeoutId = setTimeout(() => {
        setShowControls(false)
      }, 2500)
    }

    document.addEventListener('mousemove', handleMouseMove)
    handleMouseMove()

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isFullscreen])

  return (
    <div className="flex-1 flex flex-col justify-between h-full bg-[#111215] text-[#f3f4f6] relative overflow-hidden">
      {/* Top Status Bar Wrapper */}
      <div
        className={cn(
          "shrink-0 transition-opacity duration-300",
          isFullscreen && "absolute top-0 left-0 w-full z-30 bg-[#1a1c22]/85 backdrop-blur-md shadow-lg",
          isFullscreen && (showControls ? "opacity-100" : "opacity-0 pointer-events-none")
        )}
      >
        <StatusBar
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={handleSelectDevice}
          zoom={zoom}
          rotation={rotation}
          isFlipped={isFlipped}
          isFrozen={isFrozen}
          isFullscreen={isFullscreen}
          isLoading={isLoading}
        />
      </div>

      {/* Main View Area */}
      <CameraViewer
        viewerRef={viewerRef}
        stream={stream}
        isCameraActive={isCameraActive}
        isFrozen={isFrozen}
        frozenDataUrl={frozenDataUrl}
        zoom={zoom}
        rotation={rotation}
        isFlipped={isFlipped}
        panX={panX}
        panY={panY}
        isDragging={isDragging}
        isFullscreen={isFullscreen}
        error={error}
        onRequestPermission={requestPermission}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Bottom control bar Wrapper */}
      <div
        className={cn(
          "shrink-0 transition-opacity duration-300",
          isFullscreen && "absolute bottom-0 left-0 w-full z-30 bg-[#1a1c22]/85 backdrop-blur-md shadow-lg",
          isFullscreen && (showControls ? "opacity-100" : "opacity-0 pointer-events-none")
        )}
      >
        <Toolbar
          isCameraActive={isCameraActive}
          onToggleCameraActive={handleToggleCameraActive}
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={resetTransform}
          onRotate={rotate}
          isFlipped={isFlipped}
          onToggleFlip={toggleFlip}
          isFrozen={isFrozen}
          onToggleFreeze={handleToggleFreeze}
          onCapture={handleCapture}
          isCapturing={isCapturing}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>

      {/* Toast Alert Notifications */}
      {toast && (
        <div className="absolute bottom-24 right-6 flex items-center space-x-3 px-4 py-3 bg-[#1a1c22] border border-[#2e3039] rounded-xl shadow-2xl z-50 animate-bounce duration-300">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-sm font-semibold text-gray-200">{toast.message}</span>
        </div>
      )}
    </div>
  )
}

export default App
