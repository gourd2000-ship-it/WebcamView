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

      // Shortcut actions should only work when camera is active
      // except for fullscreen toggling and exiting.
      const key = event.key.toLowerCase()
      const code = event.code

      // Esc (Exit Fullscreen)
      if (key === 'escape') {
        event.preventDefault()
        onExitFullscreen()
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
        case '0': // Reset
          event.preventDefault()
          onReset()
          break
        case 'c': // Capture
          event.preventDefault()
          onCapture()
          break
        case '+':
        case '=': // Zoom In (Shift + = is common on QWERTY)
          event.preventDefault()
          onZoomIn()
          break
        case '-': // Zoom Out
          event.preventDefault()
          onZoomOut()
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
  ])
}
