import { useState, useRef } from 'react'
import { StatusBar } from './components/StatusBar'
import { CameraViewer } from './components/CameraViewer'
import { Toolbar } from './components/Toolbar'
import { useCamera } from './hooks/useCamera'
import { useViewerTransform } from './hooks/useViewerTransform'
import { useFullscreen } from './hooks/useFullscreen'

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

  // Viewer Transformation Custom Hook
  const {
    zoom,
    rotation,
    isFlipped,
    zoomIn,
    zoomOut,
    rotate,
    toggleFlip,
    resetTransform,
  } = useViewerTransform()

  // Fullscreen Custom Hook
  const {
    isFullscreen,
    toggleFullscreen,
  } = useFullscreen()
  
  // App Capturing State (will move to useCapture hook in next phase)
  const [isCapturing, setIsCapturing] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)

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
      if (videoRef.current) {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = videoRef.current.videoWidth || 640
          canvas.height = videoRef.current.videoHeight || 480
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
            const dataUrl = canvas.toDataURL('image/png')
            setFrozenDataUrl(dataUrl)
            setIsFrozen(true)
          }
        } catch (e) {
          console.error('Failed to freeze frame:', e)
        }
      }
    }
  }

  const handleCapture = () => {
    setIsCapturing(true)
    setTimeout(() => setIsCapturing(false), 800)
  }

  return (
    <div className="flex-1 flex flex-col justify-between h-full bg-[#111215] text-[#f3f4f6]">
      {/* Top Status Bar & Device Selector */}
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

      {/* Main View Area */}
      <CameraViewer
        videoRef={videoRef}
        stream={stream}
        isCameraActive={isCameraActive}
        isFrozen={isFrozen}
        frozenDataUrl={frozenDataUrl}
        zoom={zoom}
        rotation={rotation}
        isFlipped={isFlipped}
        error={error}
        onRequestPermission={requestPermission}
      />

      {/* Bottom control bar */}
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
  )
}

export default App
