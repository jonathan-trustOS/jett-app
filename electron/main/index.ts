import { app, BrowserWindow, ipcMain, webContents } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

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

// Navigate context window to URL
ipcMain.handle('navigate-context', async (_event, url: string) => {
  console.log('Navigate to:', url)
  return { success: true, url }
})

// Capture screenshot from webview
ipcMain.handle('capture-webview-screenshot', async (_event, webContentsId: number) => {
  try {
    const wc = webContents.fromId(webContentsId)
    if (!wc) {
      console.error('WebContents not found:', webContentsId)
      return null
    }
    
    const image = await wc.capturePage()
    const dataUrl = image.toDataURL()
    console.log('Screenshot captured, size:', dataUrl.length)
    return dataUrl
  } catch (error) {
    console.error('Screenshot capture failed:', error)
    return null
  }
})

// Get webview info
ipcMain.handle('get-webview-info', async (_event, webContentsId: number) => {
  try {
    const wc = webContents.fromId(webContentsId)
    if (!wc) return null
    
    return {
      url: wc.getURL(),
      title: wc.getTitle(),
    }
  } catch (error) {
    console.error('Get webview info failed:', error)
    return null
  }
})
