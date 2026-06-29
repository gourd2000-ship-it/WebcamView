import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    fullscreen: true, // Default to OS Fullscreen on startup!
    webPreferences: {
      // Compiled files are placed in dist-electron/ as ESM (.mjs)
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    autoHideMenuBar: true,
  })

  // In development, load the Vite dev server URL.
  // In production, load the built index.html.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 시작 시 확실하게 전체화면이 적용되도록 명시적 호출 추가
  mainWindow.setFullScreen(true)

  // OS-level Fullscreen Event Listeners to keep React in sync
  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-change', true)
  })

  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-change', false)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC channel for saving captured PNG
ipcMain.handle('save-capture', async (event, arrayBuffer: ArrayBuffer, fileName: string) => {
  try {
    const picturesPath = app.getPath('pictures')
    const saveDir = path.join(picturesPath, 'WebcamViewer')
    
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true })
    }

    const filePath = path.join(saveDir, fileName)
    const buffer = Buffer.from(arrayBuffer)
    
    await fs.promises.writeFile(filePath, buffer)
    return { success: true, filePath }
  } catch (error: any) {
    console.error('Failed to save capture:', error)
    return { success: false, error: error.message }
  }
})

// IPC channels for Fullscreen management
ipcMain.handle('is-fullscreen', () => {
  return mainWindow?.isFullScreen() || false
})

ipcMain.on('toggle-fullscreen', () => {
  if (mainWindow) {
    const next = !mainWindow.isFullScreen()
    mainWindow.setFullScreen(next)
  }
})

ipcMain.on('exit-fullscreen', () => {
  if (mainWindow && mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false)
  }
})
