/**
 * Preload Script Additions for History Feature
 * 
 * Add these to your existing electron/preload.ts contextBridge.exposeInMainWorld
 */

import { contextBridge, ipcRenderer } from 'electron'

// Add to your existing contextBridge.exposeInMainWorld('electron', { ... })
const historyAPI = {
  // Capture all files in project directory
  captureFiles: (projectPath: string) => 
    ipcRenderer.invoke('history:capture-files', projectPath),
  
  // Write files from snapshot (for restore)
  writeFiles: (projectPath: string, files: Record<string, string>) => 
    ipcRenderer.invoke('history:write-files', projectPath, files),
  
  // Capture screenshot of preview
  captureScreenshot: (webviewId?: number) => 
    ipcRenderer.invoke('history:capture-screenshot', webviewId)
}

// Example of full contextBridge setup:
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, func: (...args: unknown[]) => void) => {
      ipcRenderer.on(channel, (_event, ...args) => func(...args))
    }
  },
  // ... your other APIs
  history: historyAPI
})

// TypeScript declaration for window.electron
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
        on: (channel: string, func: (...args: unknown[]) => void) => void
      }
      history: typeof historyAPI
    }
  }
}
