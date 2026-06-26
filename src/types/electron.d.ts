export interface ElectronAPI {
  saveCapture: (arrayBuffer: ArrayBuffer, fileName: string) => Promise<{
    success: boolean
    filePath?: string
    error?: string
  }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
