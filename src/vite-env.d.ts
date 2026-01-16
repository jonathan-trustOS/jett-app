/// <reference types="vite/client" />

interface JettAPI {
  captureWebviewScreenshot: (id: number) => Promise<string | null>
  getWebviewInfo: (id: number) => Promise<{ url: string; title: string } | null>
  claudeApi: (apiKey: string, message: string, screenshot?: string, provider?: string) => Promise<{ success: boolean; text?: string; error?: string }>
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; path?: string; error?: string }>
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
  listFiles: () => Promise<{ success: boolean; files: string[]; error?: string }>
  getProjectDir: () => Promise<string>
  runNpmInstall: () => Promise<{ success: boolean; output?: string; error?: string }>
  startDevServer: () => Promise<{ success: boolean; port?: number; error?: string }>
  stopDevServer: () => Promise<{ success: boolean }>
  isDevServerRunning: () => Promise<{ running: boolean }>
  deployToVercel: () => Promise<{ success: boolean; url?: string; error?: string }>
  onTerminalOutput: (callback: (output: string) => void) => void
}

declare global {
  interface Window {
    jett: JettAPI
  }
}