import React from 'react'
import { Mic } from 'lucide-react'

interface MicrophoneSelectorProps {
  audioDevices: MediaDeviceInfo[]
  selectedAudioDeviceId: string
  onSelectAudioDevice: (deviceId: string) => void
  disabled?: boolean
}

export const MicrophoneSelector: React.FC<MicrophoneSelectorProps> = ({
  audioDevices,
  selectedAudioDeviceId,
  onSelectAudioDevice,
  disabled = false,
}) => {
  return (
    <div className="flex items-center space-x-2 bg-[#22242b] border border-[#2e3039] rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50">
      <Mic className="w-4 h-4 text-gray-400" />
      <select
        value={selectedAudioDeviceId}
        onChange={(e) => onSelectAudioDevice(e.target.value)}
        disabled={disabled}
        className="bg-transparent text-sm font-semibold text-gray-200 outline-none cursor-pointer pr-4 disabled:opacity-50 disabled:cursor-not-allowed max-w-[200px] truncate"
      >
        <option value="" className="bg-[#1a1c22]">마이크 사용 안 함 (무음)</option>
        {audioDevices.map((device) => (
          <option key={device.deviceId} value={device.deviceId} className="bg-[#1a1c22]">
            {device.label || `마이크 (${device.deviceId.slice(0, 5)})`}
          </option>
        ))}
      </select>
    </div>
  )
}
