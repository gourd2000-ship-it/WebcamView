export interface ElectronAPI {
  saveCapture: (arrayBuffer: ArrayBuffer, fileName: string) => Promise<{
    success: boolean
    filePath?: string
    error?: string
  }>
  saveRecord: (arrayBuffer: ArrayBuffer, fileName: string) => Promise<{
    success: boolean
    filePath?: string
    error?: string
  }>
  openFolder: (type: 'capture' | 'record') => Promise<{
    success: boolean
    error?: string
  }>
  isFullscreen: () => Promise<boolean>
  toggleFullscreen: () => void
  exitFullscreen: () => void
  quitApp: () => void
  onFullscreenChange: (callback: (val: boolean) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
