import React from 'react'
import { CameraOff, Info } from 'lucide-react'

interface EmptyStateProps {
  error?: string | null
  onRequestPermission?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({ error, onRequestPermission }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#111215] text-[#9ca3af]">
      <div className="max-w-md w-full bg-[#1a1c22] border border-[#2e3039] rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <CameraOff className="w-12 h-12 stroke-[1.5]" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-[#f3f4f6]">카메라가 연결되지 않았습니다</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            {error || '상단 메뉴에서 카메라 장치를 선택하거나, USB 웹캠이 제대로 연결되어 있는지 확인해 주세요.'}
          </p>
        </div>

        {error && error.includes('권한') && (
          <button
            type="button"
            onClick={onRequestPermission}
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
            <span>권한 다시 요청하기</span>
          </button>
        )}
      </div>
    </div>
  )
}
