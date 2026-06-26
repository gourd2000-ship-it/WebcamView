import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveCapture: (arrayBuffer: ArrayBuffer, fileName: string) => 
    ipcRenderer.invoke('save-capture', arrayBuffer, fileName),
})
