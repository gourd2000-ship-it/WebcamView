import React from 'react'
import { CameraSelector } from './CameraSelector'
import { MicrophoneSelector } from './MicrophoneSelector'
import { Maximize, RotateCw, Shield, RefreshCw, Video } from 'lucide-react'

interface StatusBarProps {
  devices: MediaDeviceInfo[]
  selectedDeviceId: string
  onSelectDevice: (deviceId: string) => void
  audioDevices: MediaDeviceInfo[]
  selectedAudioDeviceId: string
  onSelectAudioDevice: (deviceId: string) => void
  zoom: number
  rotation: number
  isFlipped: boolean
  isFrozen: boolean
  isFullscreen: boolean
  isLoading: boolean
  isRecording: boolean
  recordingTime: number
}

export const StatusBar: React.FC<StatusBarProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  audioDevices,
  selectedAudioDeviceId,
  onSelectAudioDevice,
  zoom,
  rotation,
  isFlipped,
  isFrozen,
  isFullscreen,
  isLoading,
  isRecording,
  recordingTime,
}) => {
  const formatTime = (seconds: number): string => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }
  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-[#1a1c22] border-b border-[#2e3039] select-none shrink-0 z-10">
      {/* Device Selection & Status */}
      <div className="flex items-center space-x-3">
        <CameraSelector
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={onSelectDevice}
          disabled={isLoading}
        />
        <MicrophoneSelector
          audioDevices={audioDevices}
          selectedAudioDeviceId={selectedAudioDeviceId}
          onSelectAudioDevice={onSelectAudioDevice}
          disabled={isLoading}
        />
        {isLoading && (
          <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
        )}
      </div>

      {/* Center Transform State Badges */}
      <div className="flex items-center space-x-2 text-xs font-semibold">
        {/* Zoom Ratio */}
        <span className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#22242b] border border-[#2e3039] text-gray-300">
          <Maximize className="w-3.5 h-3.5" />
          <span>배율: {Math.round(zoom * 100)}%</span>
        </span>

        {/* Rotation */}
        <span className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#22242b] border border-[#2e3039] text-gray-300">
          <RotateCw className="w-3.5 h-3.5" />
          <span>회전: {rotation}°</span>
        </span>

        {/* Flip Status */}
        {isFlipped && (
          <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            좌우반전
          </span>
        )}

        {/* Freeze Status */}
        {isFrozen && (
          <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            화면 정지됨
          </span>
        )}

        {/* Record Status */}
        {isRecording && (
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
            <Video className="w-3.5 h-3.5 text-rose-500" />
            <span>녹화 중 ({formatTime(recordingTime)})</span>
          </span>
        )}
      </div>

      {/* Right App Tag (Local Mode indicator) */}
      <div className="flex items-center space-x-2">
        {isFullscreen && (
          <span className="px-2.5 py-1 text-[11px] rounded bg-gray-800 text-gray-400 border border-gray-700">
            전체화면 모드 (Esc로 종료)
          </span>
        )}
        <span className="flex items-center space-x-1 px-2.5 py-1 text-[11px] rounded-full bg-[#111215] text-[#9ca3af] border border-[#2e3039]">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>안전한 로컬</span>
        </span>
      </div>
    </header>
  )
}
