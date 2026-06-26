import React from 'react'
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
  PowerOff
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
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[#1a1c22] border-t border-[#2e3039] select-none shrink-0 z-10 gap-4">
      {/* Left: Camera Power ON/OFF */}
      <div className="flex items-center">
        <IconButton
          icon={isCameraActive ? PowerOff : Power}
          label={isCameraActive ? "카메라 끄기" : "카메라 켜기"}
          onClick={onToggleCameraActive}
          variant={isCameraActive ? "danger" : "success"}
          active={isCameraActive}
        />
      </div>

      {/* Center: Viewer operations (Flipping, Rotating, Zooming) */}
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
          icon={isFullscreen ? Minimize2 : Maximize2}
          label={isFullscreen ? "전체화면 종료" : "전체화면 (F)"}
          onClick={onToggleFullscreen}
          disabled={!isCameraActive}
          active={isFullscreen}
        />
      </div>
    </div>
  )
}
