import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveCapture: (arrayBuffer: ArrayBuffer, fileName: string) => 
    ipcRenderer.invoke('save-capture', arrayBuffer, fileName),
  saveRecord: (arrayBuffer: ArrayBuffer, fileName: string) => 
    ipcRenderer.invoke('save-record', arrayBuffer, fileName),
  openFolder: (type: 'capture' | 'record') =>
    ipcRenderer.invoke('open-folder', type),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  exitFullscreen: () => ipcRenderer.send('exit-fullscreen'),
  quitApp: () => ipcRenderer.send('quit-app'),
  onFullscreenChange: (callback: (val: boolean) => void) => {
    const listener = (_: any, val: boolean) => callback(val)
    ipcRenderer.on('fullscreen-change', listener)
    return () => {
      ipcRenderer.removeListener('fullscreen-change', listener)
    }
  }
})
