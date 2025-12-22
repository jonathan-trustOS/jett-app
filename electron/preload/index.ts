import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('jett', {
  // Context window navigation
  navigateContext: (url: string) => ipcRenderer.invoke('navigate-context', url),
  
  // Screenshot capture from webview
  captureWebviewScreenshot: (webContentsId: number) => 
    ipcRenderer.invoke('capture-webview-screenshot', webContentsId),
  
  // Get webview info
  getWebviewInfo: (webContentsId: number) =>
    ipcRenderer.invoke('get-webview-info', webContentsId),
  
  // Platform info
  platform: process.platform,
  
  // Event listeners for main process messages
  onContextUpdate: (callback: (data: unknown) => void) => {
    ipcRenderer.on('context-update', (_event, data) => callback(data))
  },
  
  // Remove listeners
  removeContextUpdateListener: () => {
    ipcRenderer.removeAllListeners('context-update')
  }
})

// Type definitions for the exposed API
declare global {
  interface Window {
    jett: {
      navigateContext: (url: string) => Promise<{ success: boolean; url: string }>
      captureWebviewScreenshot: (webContentsId: number) => Promise<string | null>
      getWebviewInfo: (webContentsId: number) => Promise<{ url: string; title: string } | null>
      platform: string
      onContextUpdate: (callback: (data: unknown) => void) => void
      removeContextUpdateListener: () => void
    }
  }
}
