import { useContextStore } from '../stores/contextStore'

export default function ContextDebugPanel() {
  const { clickHistory, lastScreenshot, isCapturing } = useContextStore()
  
  if (clickHistory.length === 0 && !lastScreenshot) {
    return (
      <div className="p-4 text-sm text-jett-muted">
        <p>Click anywhere in the context window to capture.</p>
        <p className="mt-2 text-xs">Screenshots and click data will appear here.</p>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Context Captures</h3>
        {isCapturing && (
          <span className="text-xs text-green-500 animate-pulse">Capturing...</span>
        )}
      </div>
      
      {/* Recent clicks */}
      <div className="space-y-3">
        {clickHistory.map((ctx) => (
          <div 
            key={ctx.id} 
            className="bg-jett-bg border border-jett-border rounded-lg overflow-hidden"
          >
            {/* Screenshot thumbnail */}
            {ctx.screenshot && (
              <img 
                src={ctx.screenshot} 
                alt="Screenshot" 
                className="w-full h-24 object-cover object-top"
              />
            )}
            
            {/* Click info */}
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono bg-jett-surface px-1 rounded">
                  {ctx.clickTarget.tagName}
                </span>
                <span className="text-xs text-jett-muted">
                  {new Date(ctx.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {ctx.clickTarget.text && (
                <p className="text-xs text-jett-muted truncate">
                  "{ctx.clickTarget.text}"
                </p>
              )}
              
              <p className="text-xs text-jett-muted truncate">
                {ctx.url}
              </p>
              
              <div className="text-xs text-jett-muted">
                Click: ({ctx.clickTarget.x}, {ctx.clickTarget.y})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
