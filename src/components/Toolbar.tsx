import React, { useState, useRef, useEffect } from 'react'
import { IconButton } from './IconButton'
import {
  Camera,
  FlipHorizontal,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pause,
  Play,
  Maximize2,
  Minimize2,
  Power,
  PowerOff,
  SlidersHorizontal,
  LogOut,
  Lock,
  Unlock,
  Video,
  VideoOff,
  FolderOpen
} from 'lucide-react'

interface ToolbarProps {
  isCameraActive: boolean
  onToggleCameraActive: () => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onRotate: () => void
  isFlipped: boolean
  onToggleFlip: () => void
  isFrozen: boolean
  onToggleFreeze: () => void
  onCapture: () => void
  isCapturing: boolean
  isFullscreen: boolean
  onToggleFullscreen: () => void
  isFilterOpen: boolean
  onToggleFilter: () => void
  onQuitApp: () => void
  isAutoFocusSupported: boolean
  isFocusLocked: boolean
  onToggleFocusLock: () => void
  isRecording: boolean
  onToggleRecord: () => void
  onOpenFolder: (type: 'capture' | 'record') => void
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isCameraActive,
  onToggleCameraActive,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onRotate,
  isFlipped,
  onToggleFlip,
  isFrozen,
  onToggleFreeze,
  onCapture,
  isCapturing,
  isFullscreen,
  onToggleFullscreen,
  isFilterOpen,
  onToggleFilter,
  onQuitApp,
  isAutoFocusSupported,
  isFocusLocked,
  onToggleFocusLock,
  isRecording,
  onToggleRecord,
  onOpenFolder,
}) => {
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsFolderMenuOpen(false)
      }
    }
    if (isFolderMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFolderMenuOpen])

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[#1a1c22] border-t border-[#2e3039] select-none shrink-0 z-10 gap-4">
      {/* Left: Camera Power ON/OFF & Focus Lock */}
      <div className="flex items-center space-x-2">
        <IconButton
          icon={isCameraActive ? PowerOff : Power}
          label={isCameraActive ? "카메라 끄기" : "카메라 켜기"}
          onClick={onToggleCameraActive}
          variant={isCameraActive ? "danger" : "success"}
          active={isCameraActive}
        />
        {isAutoFocusSupported && (
          <IconButton
            icon={isFocusLocked ? Lock : Unlock}
            label={isFocusLocked ? "초점 고정됨" : "초점 고정"}
            onClick={onToggleFocusLock}
            disabled={!isCameraActive}
            active={isFocusLocked}
            variant="default"
          />
        )}
      </div>

      {/* Center: Viewer operations (Flipping, Rotating, Zooming, Filtering) */}
      <div className="flex items-center space-x-2 bg-[#111215] p-1.5 rounded-2xl border border-[#2e3039]">
        <IconButton
          icon={FlipHorizontal}
          label="좌우반전 (M)"
          onClick={onToggleFlip}
          disabled={!isCameraActive}
          active={isFlipped}
        />
        <IconButton
          icon={RotateCw}
          label="회전 (R)"
          onClick={onRotate}
          disabled={!isCameraActive}
        />
        <div className="h-10 w-[1px] bg-[#2e3039] mx-1" />
        <IconButton
          icon={ZoomIn}
          label="확대 (+)"
          onClick={onZoomIn}
          disabled={!isCameraActive || zoom >= 5}
        />
        <IconButton
          icon={ZoomOut}
          label="축소 (-)"
          onClick={onZoomOut}
          disabled={!isCameraActive || zoom <= 1}
        />
        <IconButton
          icon={RotateCcw}
          label="초기화 (0)"
          onClick={onZoomReset}
          disabled={!isCameraActive}
        />
        <div className="h-10 w-[1px] bg-[#2e3039] mx-1" />
        <IconButton
          icon={SlidersHorizontal}
          label="화질 보정"
          onClick={onToggleFilter}
          disabled={!isCameraActive}
          active={isFilterOpen}
        />
      </div>

      {/* Right: Screen Freeze, Capture and Fullscreen */}
      <div className="flex items-center space-x-2">
        <IconButton
          icon={isFrozen ? Play : Pause}
          label={isFrozen ? "일시정지 해제 (Space)" : "화면 정지 (Space)"}
          onClick={onToggleFreeze}
          disabled={!isCameraActive}
          active={isFrozen}
          variant={isFrozen ? "success" : "default"}
        />
        <IconButton
          icon={Camera}
          label={isCapturing ? "저장 중..." : "캡처 저장 (C)"}
          onClick={onCapture}
          disabled={!isCameraActive || isCapturing}
          active={isCapturing}
          variant="success"
        />
        <IconButton
          icon={isRecording ? VideoOff : Video}
          label={isRecording ? "녹화 중지 (W)" : "비디오 녹화 (W)"}
          onClick={onToggleRecord}
          disabled={!isCameraActive}
          active={isRecording}
          variant={isRecording ? "danger" : "default"}
        />
        <div className="relative" ref={menuRef}>
          <IconButton
            icon={FolderOpen}
            label="저장 폴더"
            onClick={() => setIsFolderMenuOpen(!isFolderMenuOpen)}
            active={isFolderMenuOpen}
          />
          {isFolderMenuOpen && (
            <div className="absolute bottom-16 right-0 bg-[#1a1c22] border border-[#2e3039] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col min-w-[160px] gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                type="button"
                onClick={() => {
                  onOpenFolder('capture')
                  setIsFolderMenuOpen(false)
                }}
                className="flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-emerald-600/20 hover:text-emerald-400 rounded-lg transition-all cursor-pointer text-left w-full border border-transparent hover:border-emerald-500/30"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>캡처 폴더 열기</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenFolder('record')
                  setIsFolderMenuOpen(false)
                }}
                className="flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-indigo-600/20 hover:text-indigo-400 rounded-lg transition-all cursor-pointer text-left w-full border border-transparent hover:border-indigo-500/30"
              >
                <Video className="w-4 h-4 text-indigo-400" />
                <span>녹화 폴더 열기</span>
              </button>
            </div>
          )}
        </div>
        <IconButton
          icon={isFullscreen ? Minimize2 : Maximize2}
          label={isFullscreen ? "전체화면 종료" : "전체화면 (F)"}
          onClick={onToggleFullscreen}
          disabled={!isCameraActive}
          active={isFullscreen}
        />
        <IconButton
          icon={LogOut}
          label="프로그램 종료"
          onClick={onQuitApp}
          variant="danger"
        />
      </div>
    </div>
  )
}
