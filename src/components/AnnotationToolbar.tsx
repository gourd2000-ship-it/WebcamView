import React from 'react'
import { cn } from '../utils/cn'
import {
  MousePointer,
  PenTool,
  Highlighter,
  Eraser,
  Minus,
  Square,
  Circle,
  ArrowUpRight,
  Undo2,
  Trash2,
} from 'lucide-react'

export type AnnotationTool =
  | 'select' // Drawing mode OFF (pan active)
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'line'
  | 'rect'
  | 'circle'
  | 'arrow'

interface AnnotationToolbarProps {
  activeTool: AnnotationTool
  setActiveTool: (tool: AnnotationTool) => void
  color: string
  setColor: (color: string) => void
  thickness: number
  setThickness: (thickness: number) => void
  onUndo: () => void
  onClearAll: () => void
  isCameraActive: boolean
  isVisible: boolean // supporting autohide in fullscreen
}

const COLORS = [
  { value: '#ef4444', name: '빨강' },
  { value: '#3b82f6', name: '파랑' },
  { value: '#22c55e', name: '초록' },
  { value: '#eab308', name: '노랑' },
  { value: '#ffffff', name: '하양' },
  { value: '#09090b', name: '검정' },
]

const THICKNESSES = [
  { value: 3, name: '얇게' },
  { value: 6, name: '보통' },
  { value: 12, name: '두껍게' },
]

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  activeTool,
  setActiveTool,
  color,
  setColor,
  thickness,
  setThickness,
  onUndo,
  onClearAll,
  isCameraActive,
  isVisible,
}) => {
  if (!isCameraActive) return null

  return (
    <div
      className={cn(
        "absolute left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col space-y-5 p-3 rounded-2xl bg-[#1a1c22]/90 border border-[#2e3039] shadow-2xl backdrop-blur-md transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none duration-500"
      )}
    >
      {/* Navigation & Freehand tools */}
      <div className="flex flex-col space-y-2 border-b border-[#2e3039] pb-3">
        <button
          onClick={() => setActiveTool('select')}
          title="이동 및 선택 (V)"
          className={cn(
            "p-2.5 rounded-xl transition-colors cursor-pointer",
            activeTool === 'select'
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-[#252830] hover:text-white"
          )}
        >
          <MousePointer className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveTool('pen')}
          title="일반 펜 (P)"
          className={cn(
            "p-2.5 rounded-xl transition-colors cursor-pointer",
            activeTool === 'pen'
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-[#252830] hover:text-white"
          )}
        >
          <PenTool className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveTool('highlighter')}
          title="형광펜 (H)"
          className={cn(
            "p-2.5 rounded-xl transition-colors cursor-pointer",
            activeTool === 'highlighter'
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-[#252830] hover:text-white"
          )}
        >
          <Highlighter className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveTool('eraser')}
          title="지우개 (E)"
          className={cn(
            "p-2.5 rounded-xl transition-colors cursor-pointer",
            activeTool === 'eraser'
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-[#252830] hover:text-white"
          )}
        >
          <Eraser className="w-5 h-5" />
        </button>
      </div>

      {/* Shapes tools */}
      <div className="flex flex-col space-y-2 border-b border-[#2e3039] pb-3">
        <button
          onClick={() => setActiveTool('line')}
          title="직선 그리기 (L)"
          className={cn(
            "p-2.5 rounded-xl transition-colors cursor-pointer",
            activeTool === 'line'
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-[#252830] hover:text-white"
          )}
        >
          <Minus className="w-5 h-5 rotate-45" />
        </button>
        <button
          onClick={() => setActiveTool('rect')}
          title="직사각형 그리기 (S)"
          className={cn(
            "p-2.5 rounded-xl transition-colors cursor-pointer",
            activeTool === 'rect'
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-[#252830] hover:text-white"
          )}
        >
          <Square className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveTool('circle')}
          title="원 그리기 (O)"
          className={cn(
            "p-2.5 rounded-xl transition-colors cursor-pointer",
            activeTool === 'circle'
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-[#252830] hover:text-white"
          )}
        >
          <Circle className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveTool('arrow')}
          title="화살표 그리기 (A)"
          className={cn(
            "p-2.5 rounded-xl transition-colors cursor-pointer",
            activeTool === 'arrow'
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-[#252830] hover:text-white"
          )}
        >
          <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>

      {/* Color Palette (Disabled for eraser) */}
      <div className={cn("grid grid-cols-2 gap-1.5 border-b border-[#2e3039] pb-3", activeTool === 'eraser' && "opacity-30 pointer-events-none")}>
        {COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => setColor(c.value)}
            title={c.name}
            className={cn(
              "w-5 h-5 rounded-full border cursor-pointer transition-transform",
              color === c.value ? "scale-120 border-white" : "border-transparent",
              c.value === '#ffffff' && "border-gray-500"
            )}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      {/* Thickness picker */}
      <div className="flex flex-col space-y-2 border-b border-[#2e3039] pb-3">
        {THICKNESSES.map((t) => (
          <button
            key={t.value}
            onClick={() => setThickness(t.value)}
            title={`${t.name} 두께 (${t.value}px)`}
            className={cn(
              "flex items-center justify-center p-1 rounded transition-colors cursor-pointer text-xs font-semibold",
              thickness === t.value
                ? "bg-[#2e3039] text-indigo-400"
                : "text-gray-400 hover:text-white"
            )}
          >
            <span
              className="rounded-full bg-current"
              style={{
                width: t.value + 'px',
                height: t.value + 'px',
                maxHeight: '8px',
                maxWidth: '8px',
              }}
            />
          </button>
        ))}
      </div>

      {/* Actions (Undo & Clear All) */}
      <div className="flex flex-col space-y-2">
        <button
          onClick={onUndo}
          title="실행 취소 (Z / Ctrl+Z)"
          className="p-2.5 rounded-xl text-gray-400 hover:bg-[#252830] hover:text-white transition-colors cursor-pointer"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={onClearAll}
          title="전체 지우기 (Delete)"
          className="p-2.5 rounded-xl text-gray-400 hover:bg-rose-950/30 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
export default AnnotationToolbar
