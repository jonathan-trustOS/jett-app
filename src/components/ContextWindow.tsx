import { useEffect, useRef, useState, useCallback } from 'react'
import { useContextStore, ClickContext } from '../stores/contextStore'

interface ContextWindowProps {
  url: string
  label: string
  onNavigate: (url: string) => void
}

export default function ContextWindow({ label }: ContextWindowProps) {
  const webviewRef = useRef<HTMLWebViewElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('https://example.com')
  const [urlInput, setUrlInput] = useState('https://example.com')
  const [webContentsId, setWebContentsId] = useState<number | null>(null)
  
  const { addClickContext, setCapturing, isCapturing } = useContextStore()

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const handleDomReady = () => {
      // @ts-ignore
      const id = webview.getWebContentsId?.()
      if (id) setWebContentsId(id)
    }

    const handleDidStartLoading = () => setIsLoading(true)
    const handleDidStopLoading = () => setIsLoading(false)
    const handleDidNavigate = (e: Event) => {
      const event = e as CustomEvent & { url: string }
      setCurrentUrl(event.url)
      setUrlInput(event.url)
    }

    webview.addEventListener('dom-ready', handleDomReady)
    webview.addEventListener('did-start-loading', handleDidStartLoading)
    webview.addEventListener('did-stop-loading', handleDidStopLoading)
    webview.addEventListener('did-navigate', handleDidNavigate)

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady)
      webview.removeEventListener('did-start-loading', handleDidStartLoading)
      webview.removeEventListener('did-stop-loading', handleDidStopLoading)
      webview.removeEventListener('did-navigate', handleDidNavigate)
    }
  }, [])

  const navigateToUrl = () => {
    const webview = webviewRef.current
    if (!webview) return
    
    let targetUrl = urlInput.trim()
    if (!targetUrl) return
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }
    
    // @ts-ignore
    webview.loadURL(targetUrl)
  }

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') navigateToUrl()
  }

  const captureScreenshot = useCallback(async () => {
    if (!webContentsId || !window.jett) return
    
    setCapturing(true)
    try {
      const screenshot = await window.jett.captureWebviewScreenshot(webContentsId)
      
      if (screenshot) {
        const info = await window.jett.getWebviewInfo(webContentsId)
        const context: ClickContext = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          url: info?.url || currentUrl,
          pageTitle: info?.title || '',
          screenshot,
          clickTarget: { tagName: 'CAPTURE', text: 'Manual capture', x: 0, y: 0 },
          viewportSize: { width: 800, height: 600 }
        }
        addClickContext(context)
      }
    } finally {
      setCapturing(false)
    }
  }, [webContentsId, currentUrl, setCapturing, addClickContext])

  return (
    <div className="flex flex-col h-full">
      <div className="bg-jett-surface border-b border-jett-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-jett-muted">Context:</span>
            <span className="text-sm font-medium">{label}</span>
            {isLoading && <span className="text-xs text-jett-accent animate-pulse">Loading...</span>}
            <button
              onClick={captureScreenshot}
              disabled={isCapturing || !webContentsId}
              className="ml-4 px-2 py-1 text-xs bg-jett-accent text-white rounded hover:bg-jett-accent/80 disabled:opacity-50"
            >
              {isCapturing ? '📸...' : '📸 Capture'}
            </button>
          </div>
        </div>
        
        <div className="mt-2 flex space-x-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            className="flex-1 bg-jett-bg border border-jett-border rounded px-3 py-1.5 text-xs text-jett-text focus:outline-none focus:border-jett-accent"
            placeholder="Enter URL..."
          />
          <button
            onClick={navigateToUrl}
            className="px-3 py-1.5 text-xs bg-jett-border text-jett-text rounded hover:bg-jett-accent"
          >
            Go
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white relative">
        <webview
          ref={webviewRef}
          src="https://example.com"
          className="absolute inset-0 w-full h-full"
          // @ts-ignore
          allowpopups="true"
          // @ts-ignore
          partition="persist:jett"
        />
      </div>
    </div>
  )
}