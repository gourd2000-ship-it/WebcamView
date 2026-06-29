export interface ElectronAPI {
  saveCapture: (arrayBuffer: ArrayBuffer, fileName: string) => Promise<{
    success: boolean
    filePath?: string
    error?: string
  }>
  isFullscreen: () => Promise<boolean>
  toggleFullscreen: () => void
  exitFullscreen: () => void
  onFullscreenChange: (callback: (val: boolean) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
