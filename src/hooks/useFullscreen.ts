import { useState, useEffect, useCallback } from 'react'

export interface UseFullscreenResult {
  isFullscreen: boolean
  toggleFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
}

export function useFullscreen(): UseFullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  // Sync state with HTML5 / Electron fullscreen change events
  useEffect(() => {
    if (window.electronAPI) {
      // Fetch initial fullscreen state (starts as true in Electron BrowserWindow)
      window.electronAPI.isFullscreen().then((val) => {
        setIsFullscreen(val)
      })

      // Listen to Electron window fullscreen changes
      const unsubscribe = window.electronAPI.onFullscreenChange((val) => {
        setIsFullscreen(val)
      })

      return () => {
        unsubscribe()
      }
    } else {
      // Fallback for browser-only testing environments
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement)
      }

      document.addEventListener('fullscreenchange', handleFullscreenChange)
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
      }
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (window.electronAPI) {
        window.electronAPI.toggleFullscreen()
      } else {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen()
        } else {
          await document.exitFullscreen()
        }
      }
    } catch (err) {
      console.error('Failed to toggle fullscreen mode:', err)
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (window.electronAPI) {
        window.electronAPI.exitFullscreen()
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
      }
    } catch (err) {
      console.error('Failed to exit fullscreen mode:', err)
    }
  }, [])

  return {
    isFullscreen,
    toggleFullscreen,
    exitFullscreen,
  }
}
