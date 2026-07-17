import { useState, useEffect, useRef } from 'react'
import { StatusBar } from './components/StatusBar'
import { CameraViewer } from './components/CameraViewer'
import { Toolbar } from './components/Toolbar'
import { AnnotationToolbar } from './components/AnnotationToolbar'
import type { AnnotationTool } from './components/AnnotationToolbar'
import { useCamera } from './hooks/useCamera'
import { useViewerTransform } from './hooks/useViewerTransform'
import { useFullscreen } from './hooks/useFullscreen'
import { useCapture } from './hooks/useCapture'
import { useRecord } from './hooks/useRecord'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { cn } from './utils/cn'
import { CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'

function App() {
  const {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    audioDevices,
    selectedAudioDeviceId,
    setSelectedAudioDeviceId,
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
    isAutoFocusSupported,
    isFocusLocked,
    toggleFocusLock,
    focusDistance,
    focusDistanceRange,
    isFocusDistanceSupported,
    setManualFocusDistance,
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

  // Record Hook
  const { isRecording, recordingTime, startRecording, stopRecording } = useRecord()

  // Custom Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Fullscreen controls visibility
  const [showControls, setShowControls] = useState<boolean>(true)

  // Annotation drawing board states
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select')
  const [brushColor, setBrushColor] = useState<string>('#ef4444')
  const [brushSize, setBrushSize] = useState<number>(6)
  const [paths, setPaths] = useState<any[]>([])

  // Image Adjustment Filter States
  const [brightness, setBrightness] = useState<number>(100)
  const [contrast, setContrast] = useState<number>(100)
  const [isInverted, setIsInverted] = useState<boolean>(false)
  const [isGrayscale, setIsGrayscale] = useState<boolean>(false)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false)

  const annotationCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewerRef = useRef<HTMLVideoElement | HTMLImageElement | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Handlers
  const handleSelectDevice = (id: string) => {
    setSelectedDeviceId(id)
  }

  const handleToggleRecord = async () => {
    if (!isRecording) {
      if (!isCameraActive || !stream) {
        showToast('카메라가 활성화되어 있지 않아 녹화할 수 없습니다.', 'error')
        return
      }
      startRecording(stream)
      showToast('비디오 녹화를 시작합니다.', 'success')
    } else {
      showToast('녹화를 중지하고 파일을 저장하는 중...', 'success')
      const result = await stopRecording()
      if (result && result.success) {
        const fileName = result.filePath?.split(/\/|\\/).pop() || 'video.webm'
        showToast(`성공적으로 녹화 저장되었습니다: ${fileName}`, 'success')
      } else if (result) {
        showToast(`녹화 저장 실패: ${result.error}`, 'error')
      }
    }
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

  // Real capture and save handler (incorporating annotations and image filters)
  const handleCapture = async () => {
    if (!viewerRef.current || !isCameraActive) return

    const result = await capture(
      viewerRef.current,
      zoom,
      rotation,
      isFlipped,
      annotationCanvasRef.current,
      { brightness, contrast, isInverted, isGrayscale }
    )
    
    if (result.success) {
      const fileName = result.filePath?.split(/\/|\\/).pop() || 'image.png'
      showToast(`성공적으로 저장되었습니다: ${fileName}`, 'success')
    } else {
      showToast(`저장 실패: ${result.error}`, 'error')
    }
  }

  const handleOpenFolder = async (type: 'capture' | 'record') => {
    if (window.electronAPI && window.electronAPI.openFolder) {
      const result = await window.electronAPI.openFolder(type)
      if (!result.success) {
        showToast(`폴더 열기 실패: ${result.error}`, 'error')
      }
    } else {
      showToast('지원되지 않는 환경입니다.', 'error')
    }
  }

  // Undo / Clear All actions for Annotation
  const handleUndo = () => {
    setPaths((prev) => prev.slice(0, prev.length - 1))
  }

  const handleClearAll = () => {
    setPaths([])
  }

  // Reset all transforms, annotations, and filters
  const handleResetEverything = () => {
    resetTransform()
    setActiveTool('select')
    setBrightness(100)
    setContrast(100)
    setIsInverted(false)
    setIsGrayscale(false)
  }

  // Global Keyboard Shortcuts Binding
  useKeyboardShortcuts({
    onToggleFreeze: handleToggleFreeze,
    onToggleFullscreen: toggleFullscreen,
    onToggleFlip: toggleFlip,
    onRotate: rotate,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onReset: handleResetEverything,
    onCapture: handleCapture,
    onExitFullscreen: exitFullscreen,
    isCameraActive,
    onToggleRecord: handleToggleRecord,
    onSelectTool: setActiveTool,
    onUndo: handleUndo,
    onClearAll: handleClearAll,
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

  // Clear drawing board and close filters when camera device or activity changes
  useEffect(() => {
    setPaths([])
    setActiveTool('select')
    setIsFilterPanelOpen(false)
    setBrightness(100)
    setContrast(100)
    setIsInverted(false)
    setIsGrayscale(false)
  }, [selectedDeviceId, isCameraActive])

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
          audioDevices={audioDevices}
          selectedAudioDeviceId={selectedAudioDeviceId}
          onSelectAudioDevice={setSelectedAudioDeviceId}
          zoom={zoom}
          rotation={rotation}
          isFlipped={isFlipped}
          isFrozen={isFrozen}
          isFullscreen={isFullscreen}
          isLoading={isLoading}
          isRecording={isRecording}
          recordingTime={recordingTime}
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
        
        activeTool={activeTool}
        brushColor={brushColor}
        brushSize={brushSize}
        paths={paths}
        setPaths={setPaths}
        annotationCanvasRef={annotationCanvasRef}

        brightness={brightness}
        contrast={contrast}
        isInverted={isInverted}
        isGrayscale={isGrayscale}
      />

      {/* Floating Annotation Drawing Toolbar */}
      <AnnotationToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        color={brushColor}
        setColor={setBrushColor}
        thickness={brushSize}
        setThickness={setBrushSize}
        onUndo={handleUndo}
        onClearAll={handleClearAll}
        isCameraActive={isCameraActive}
        isVisible={showControls}
      />

      {/* Image Adjustments Floating Slider Panel */}
      {isFilterPanelOpen && isCameraActive && (
        <div
          className={cn(
            "absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-80 p-5 rounded-2xl bg-[#1a1c22]/95 border border-[#2e3039] shadow-2xl backdrop-blur-md transition-opacity duration-300 flex flex-col space-y-4",
            isFullscreen && (showControls ? "opacity-100" : "opacity-0 pointer-events-none duration-500")
          )}
        >
          <div className="flex items-center justify-between border-b border-[#2e3039] pb-2">
            <h4 className="text-xs font-bold text-gray-300 tracking-wider uppercase">화질 보정 필터</h4>
            <button
              onClick={() => {
                setBrightness(100)
                setContrast(100)
                setIsInverted(false)
                setIsGrayscale(false)
              }}
              title="필터 초기화"
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Brightness Slider */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-400">
              <span>밝기</span>
              <span className="text-indigo-400">{brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full h-1.5 bg-[#111215] rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-[#2e3039]"
            />
          </div>

          {/* Contrast Slider */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-400">
              <span>대비</span>
              <span className="text-indigo-400">{contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full h-1.5 bg-[#111215] rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-[#2e3039]"
            />
          </div>

          {/* Invert & Grayscale Toggles */}
          <div className="flex space-x-2 pt-1">
            <button
              onClick={() => setIsInverted(!isInverted)}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                isInverted
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                  : "bg-[#111215] border-[#2e3039] text-gray-400 hover:text-white hover:bg-[#252830]"
              )}
            >
              색상 반전
            </button>
            <button
              onClick={() => setIsGrayscale(!isGrayscale)}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                isGrayscale
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                  : "bg-[#111215] border-[#2e3039] text-gray-400 hover:text-white hover:bg-[#252830]"
              )}
            >
              흑백 모드
            </button>
          </div>
        </div>
      )}

      {/* Bottom control bar Wrapper */}
      <div
        className={cn(
          "shrink-0 transition-opacity duration-300",
          isFullscreen && "absolute bottom-0 left-0 w-full z-30 bg-[#1a1c22]/85 backdrop-blur-md shadow-lg",
          isFullscreen && (showControls ? "opacity-100" : "opacity-0 pointer-events-none")
        )}
      >
        {/* Manual Focus Distance Slider Control */}
        {isCameraActive && isFocusDistanceSupported && isFocusLocked && focusDistanceRange && (
          <div className="flex items-center space-x-4 px-8 py-3 bg-[#111215]/95 border-b border-[#2e3039] text-[#9ca3af]">
            <span className="text-xs font-bold shrink-0">초점 미세 조절</span>
            <input
              type="range"
              min={focusDistanceRange.min}
              max={focusDistanceRange.max}
              step={focusDistanceRange.step}
              value={focusDistance}
              onChange={(e) => setManualFocusDistance(parseFloat(e.target.value))}
              className="flex-1 accent-indigo-500 bg-[#22242b] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-mono w-10 text-right shrink-0">{focusDistance}</span>
            <button
              onClick={() => {
                setManualFocusDistance((focusDistanceRange.min + focusDistanceRange.max) / 2)
              }}
              className="text-[10px] px-2 py-1 rounded bg-[#22242b] hover:bg-[#2d303b] text-gray-300 transition cursor-pointer"
            >
              기본값
            </button>
          </div>
        )}

        <Toolbar
          isCameraActive={isCameraActive}
          onToggleCameraActive={handleToggleCameraActive}
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={handleResetEverything}
          onRotate={rotate}
          isFlipped={isFlipped}
          onToggleFlip={toggleFlip}
          isFrozen={isFrozen}
          onToggleFreeze={handleToggleFreeze}
          onCapture={handleCapture}
          isCapturing={isCapturing}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isFilterOpen={isFilterPanelOpen}
          onToggleFilter={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          onQuitApp={() => {
            if (window.electronAPI && window.electronAPI.quitApp) {
              window.electronAPI.quitApp()
            }
          }}
          isAutoFocusSupported={isAutoFocusSupported}
          isFocusLocked={isFocusLocked}
          onToggleFocusLock={async () => {
            const success = await toggleFocusLock()
            if (success) {
              showToast(!isFocusLocked ? '초점을 고정했습니다.' : '자동 초점으로 전환했습니다.', 'success')
            } else {
              showToast('초점 상태 변경에 실패했습니다.', 'error')
            }
          }}
          isRecording={isRecording}
          onToggleRecord={handleToggleRecord}
          onOpenFolder={handleOpenFolder}
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
