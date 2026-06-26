import { useState, useEffect, useCallback } from 'react'

export interface UseFullscreenResult {
  isFullscreen: boolean
  toggleFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
}

export function useFullscreen(): UseFullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  // Sync state on HTML5 fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Failed to toggle fullscreen mode:', err)
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
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
