import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  const displays = screen.getAllDisplays()
  const primaryDisplay = screen.getPrimaryDisplay()

  // 메인 디스플레이가 아닌 보조 디스플레이 탐색
  const externalDisplay = displays.find((display) => {
    return display.id !== primaryDisplay.id
  })

  const windowOptions: any = {
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
  }

  // 보조 디스플레이가 감지되면 해당 모니터 영역으로 창 좌표 이동
  if (externalDisplay) {
    windowOptions.x = externalDisplay.bounds.x
    windowOptions.y = externalDisplay.bounds.y
  }

  mainWindow = new BrowserWindow(windowOptions)

  // In development, load the Vite dev server URL.
  // In production, load the built index.html.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 시작 시 확실하게 전체화면이 적용되도록 명시적 호출 추가
  mainWindow.setFullScreen(true)

  // 1순위 보안 조치: 렌더러 내부에서 신뢰하지 않는 외부 페이지로의 강제 이동 차단
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url)
    if (parsedUrl.origin !== process.env.VITE_DEV_SERVER_URL && parsedUrl.protocol !== 'file:') {
      event.preventDefault()
    }
  })

  // 1순위 보안 조치: 외부 웹 링크 클릭 시 일렉트론 내부가 아닌 시스템 기본 웹 브라우저로 오픈
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

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
    // 2순위 보안 조치: DoS 방지를 위한 최대 업로드 파일 크기 제한 (15MB)
    const MAX_CAPTURE_SIZE = 15 * 1024 * 1024
    if (arrayBuffer.byteLength > MAX_CAPTURE_SIZE) {
      return { success: false, error: '허용된 이미지 용량(15MB)을 초과했습니다.' }
    }

    // 2순위 보안 조치: 임의 파일 저장 및 조작 방지를 위해 PNG 이미지 포맷 유효성 검사 (Magic Bytes 체크)
    if (arrayBuffer.byteLength < 4) {
      return { success: false, error: '유효하지 않은 파일 데이터입니다.' }
    }
    const headerView = new Uint8Array(arrayBuffer.slice(0, 4))
    if (headerView[0] !== 0x89 || headerView[1] !== 0x50 || headerView[2] !== 0x4E || headerView[3] !== 0x47) {
      return { success: false, error: '올바르지 않은 이미지 포맷입니다. (PNG 파일만 허용)' }
    }

    const picturesPath = app.getPath('pictures')
    const saveDir = path.join(picturesPath, 'WebcamViewer')
    
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true })
    }

    // 경로 탐색(Path Traversal) 공격을 방지하기 위해 파일의 순수 이름만 추출
    const safeFileName = path.basename(fileName)
    const filePath = path.join(saveDir, safeFileName)
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

// IPC channel for exiting the app
ipcMain.on('quit-app', () => {
  app.quit()
})
