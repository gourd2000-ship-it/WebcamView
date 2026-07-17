import { useEffect } from 'react'

interface KeyboardShortcutsProps {
  onToggleFreeze: () => void
  onToggleFullscreen: () => void
  onToggleFlip: () => void
  onRotate: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onCapture: () => void
  onExitFullscreen: () => void
  isCameraActive: boolean
  onToggleRecord?: () => void
  
  // Annotation drawing board shortcuts
  onSelectTool?: (tool: 'select' | 'pen' | 'highlighter' | 'eraser' | 'line' | 'rect' | 'circle' | 'arrow') => void
  onUndo?: () => void
  onClearAll?: () => void
}

export function useKeyboardShortcuts({
  onToggleFreeze,
  onToggleFullscreen,
  onToggleFlip,
  onRotate,
  onZoomIn,
  onZoomOut,
  onReset,
  onCapture,
  onExitFullscreen,
  isCameraActive,
  onToggleRecord,
  onSelectTool,
  onUndo,
  onClearAll,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore keyboard shortcuts if the user is typing in an input, textarea, or select element
      const activeEl = document.activeElement as HTMLElement | null
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const code = event.code

      // Esc (Exit Fullscreen)
      if (key === 'escape') {
        event.preventDefault()
        onExitFullscreen()
        return
      }

      // Check for Ctrl+Z or Cmd+Z (Undo)
      if ((event.ctrlKey || event.metaKey) && key === 'z') {
        event.preventDefault()
        if (onUndo) onUndo()
        return
      }

      // Check for Delete (Clear All)
      if (key === 'delete') {
        event.preventDefault()
        if (onClearAll) onClearAll()
        return
      }

      // F (Toggle Fullscreen)
      if (key === 'f') {
        event.preventDefault()
        if (isCameraActive) {
          onToggleFullscreen()
        }
        return
      }

      // Other actions require camera to be active
      if (!isCameraActive) return

      switch (key) {
        case 'w': // Record Video Toggle (W)
          event.preventDefault()
          if (onToggleRecord) onToggleRecord()
          break
        case ' ': // Space
        case 'spacebar':
          event.preventDefault()
          onToggleFreeze()
          break
        case 'm': // Flip
          event.preventDefault()
          onToggleFlip()
          break
        case 'r': // Rotate
          event.preventDefault()
          onRotate()
          break
        case '0': // Reset everything
          event.preventDefault()
          onReset()
          break
        case 'c': // Capture
          event.preventDefault()
          onCapture()
          break
        case '+':
        case '=': // Zoom In
          event.preventDefault()
          onZoomIn()
          break
        case '-': // Zoom Out
          event.preventDefault()
          onZoomOut()
          break
        
        // Drawing tools keyboard mapping
        case 'v': // Select pointer (navigation)
          event.preventDefault()
          if (onSelectTool) onSelectTool('select')
          break
        case 'p': // Regular Pen
          event.preventDefault()
          if (onSelectTool) onSelectTool('pen')
          break
        case 'h': // Highlighter
          event.preventDefault()
          if (onSelectTool) onSelectTool('highlighter')
          break
        case 'e': // Eraser
          event.preventDefault()
          if (onSelectTool) onSelectTool('eraser')
          break
        case 'l': // Straight Line
          event.preventDefault()
          if (onSelectTool) onSelectTool('line')
          break
        case 's': // Square/Rectangle
          event.preventDefault()
          if (onSelectTool) onSelectTool('rect')
          break
        case 'o': // Circle (Oval)
          event.preventDefault()
          if (onSelectTool) onSelectTool('circle')
          break
        case 'a': // Arrow
          event.preventDefault()
          if (onSelectTool) onSelectTool('arrow')
          break
        case 'z': // Single 'z' key triggers undo
          event.preventDefault()
          if (onUndo) onUndo()
          break

        default:
          // Check event code for Space specifically
          if (code === 'Space') {
            event.preventDefault()
            onToggleFreeze()
          }
          break
      }
    }

    // Bind capturing phase to override elements default keys
    document.addEventListener('keydown', handleKeyDown, true)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [
    onToggleFreeze,
    onToggleFullscreen,
    onToggleFlip,
    onRotate,
    onZoomIn,
    onZoomOut,
    onReset,
    onCapture,
    onExitFullscreen,
    isCameraActive,
    onToggleRecord,
    onSelectTool,
    onUndo,
    onClearAll,
  ])
}
