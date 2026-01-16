import { useRef, useState, useEffect } from 'react'
import { useContextStore } from '../stores/contextStore'

interface ContextWindowProps {
  url: string
  onNavigate: (url: string) => void
  previewPort?: number | null
  isServerRunning?: boolean
  isStartingServer?: boolean
  onStartPreview?: () => void
  onStopPreview?: () => void
  onCaptureReady?: (captureFn: () => Promise<string | null>) => void
}

type Tab = 'context' | 'preview'

export default function ContextWindow({ 
  url, 
  onNavigate, 
  previewPort,
  isServerRunning = false,
  isStartingServer = false,
  onStartPreview,
  onStopPreview,
  onCaptureReady
}: ContextWindowProps) {
  const webviewRef = useRef<HTMLWebViewElement>(null)
  const [inputUrl, setInputUrl] = useState(url)
  const [activeTab, setActiveTab] = useState<Tab>('context')
  const { setLastScreenshot } = useContextStore()

  const previewUrl = previewPort ? `http://localhost:${previewPort}` : null

  useEffect(() => {
    if (isServerRunning && previewUrl) {
      setActiveTab('preview')
    }
  }, [isServerRunning, previewUrl])

  const currentUrl = activeTab === 'preview' && previewUrl ? previewUrl : url

  useEffect(() => {
    if (activeTab === 'context') {
      setInputUrl(url)
    } else if (previewUrl) {
      setInputUrl(previewUrl)
    }
  }, [activeTab, url, previewUrl])

  const handleCapture = async (): Promise<string | null> => {
    const webview = webviewRef.current
    if (!webview) return null

    try {
      const webContentsId = webview.getWebContentsId()
      const screenshot = await window.jett.captureWebviewScreenshot(webContentsId)
      if (screenshot) {
        setLastScreenshot(screenshot)
        return screenshot
      }
    } catch (error) {
      console.error('Capture failed:', error)
    }
    return null
  }

  // Expose capture function to parent when webview is ready
  useEffect(() => {
    const webview = webviewRef.current
    if (webview && onCaptureReady) {
      const onReady = () => {
        console.log('Webview ready, exposing capture')
        onCaptureReady(handleCapture)
      }
      webview.addEventListener('dom-ready', onReady)
      // Also call immediately in case already ready
      if (webview.getWebContentsId) {
        onCaptureReady(handleCapture)
      }
      return () => webview.removeEventListener('dom-ready', onReady)
    }
  }, []) // Empty deps - only run once on mount

  const handleGo = () => {
    let finalUrl = inputUrl
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }
    if (activeTab === 'context') {
      onNavigate(finalUrl)
    }
    if (webviewRef.current) {
      webviewRef.current.loadURL(finalUrl)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGo()
    }
  }

  const handleRefresh = () => {
    if (webviewRef.current) {
      webviewRef.current.reload()
    }
  }

  return (
    <div className="flex flex-col h-full bg-jett-bg">
      {/* Tab Header */}
      <div className="h-10 bg-jett-surface border-b border-jett-border flex items-center justify-between px-3">
        <div className="flex bg-jett-bg rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('context')}
            className={`px-3 py-1 text-xs rounded ${activeTab === 'context' ? 'bg-jett-surface text-jett-text' : 'text-jett-muted hover:text-jett-text'}`}
          >
            Context
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 ${activeTab === 'preview' ? 'bg-jett-surface text-jett-text' : 'text-jett-muted hover:text-jett-text'}`}
          >
            {isServerRunning && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
            Preview
          </button>
        </div>
        <button
          onClick={handleCapture}
          className="bg-jett-accent hover:bg-jett-accent/90 text-white px-3 py-1 rounded text-xs"
        >
          📸 Capture
        </button>
      </div>

      {/* URL Bar */}
      <div className="h-10 bg-jett-surface border-b border-jett-border flex items-center px-3 gap-2">
        {activeTab === 'preview' && (
          <>
            {isServerRunning ? (
              <button
                onClick={onStopPreview}
                className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                title="Stop server"
              >
                ■
              </button>
            ) : (
              <button
                onClick={onStartPreview}
                disabled={isStartingServer}
                className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                title="Start server"
              >
                {isStartingServer ? '...' : '▶'}
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={!isServerRunning}
              className="px-2 py-1 text-xs rounded text-jett-muted hover:text-jett-text disabled:opacity-50"
              title="Refresh"
            >
              ↻
            </button>
          </>
        )}
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={activeTab === 'preview'}
          className={`flex-1 bg-jett-bg border border-jett-border rounded px-3 py-1.5 text-sm ${activeTab === 'preview' ? 'text-jett-muted' : ''}`}
          placeholder="https://example.com"
        />
        {activeTab === 'context' && (
          <button
            onClick={handleGo}
            className="bg-jett-border hover:bg-jett-muted/20 px-3 py-1.5 rounded text-sm"
          >
            Go
          </button>
        )}
      </div>

      {/* Webview or Empty State */}
      <div className="flex-1 relative">
        {activeTab === 'preview' && !isServerRunning ? (
          <div className="absolute inset-0 flex items-center justify-center bg-jett-bg">
            <div className="text-center">
              <p className="text-4xl mb-4">🚀</p>
              <p className="text-jett-muted mb-4">Complete Task 1 to see your app here</p>
              {onStartPreview && (
                <button
                  onClick={onStartPreview}
                  disabled={isStartingServer}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50"
                >
                  {isStartingServer ? 'Starting...' : '▶ Start Preview'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <webview
            ref={webviewRef}
            src={currentUrl}
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>
    </div>
  )
}