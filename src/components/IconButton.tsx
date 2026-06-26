import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../utils/cn'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  active?: boolean
  variant?: 'default' | 'danger' | 'success'
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  active = false,
  variant = 'default',
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        // Base styling: Touch-friendly (h-14 min-w-[70px] or px-4), flex center
        "flex flex-col items-center justify-center h-14 px-4 rounded-xl transition-all duration-200 cursor-pointer select-none",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
        
        // Variant logic
        variant === 'default' && [
          "bg-[#22242b] text-[#9ca3af] hover:bg-[#2d303b] hover:text-[#f3f4f6]",
          active && "bg-indigo-600 text-white hover:bg-indigo-500 hover:text-white"
        ],
        variant === 'success' && [
          "bg-[#22242b] text-emerald-400 hover:bg-[#2d303b]",
          active && "bg-emerald-600 text-white hover:bg-emerald-500 hover:text-white"
        ],
        variant === 'danger' && [
          "bg-[#22242b] text-rose-400 hover:bg-[#2d303b]",
          active && "bg-rose-600 text-white hover:bg-rose-500 hover:text-white"
        ],
        
        // Disabled logic
        disabled && "opacity-40 cursor-not-allowed hover:bg-[#22242b] hover:text-current",
        
        className
      )}
      {...props}
    >
      <Icon className="w-5.5 h-5.5 stroke-[2]" />
      <span className="text-[11px] font-bold mt-1 tracking-wide">{label}</span>
    </button>
  )
}
