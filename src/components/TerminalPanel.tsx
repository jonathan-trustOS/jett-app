import { useState } from 'react'

interface TerminalPanelProps {
  logs: string[]
}

export default function TerminalPanel({ logs }: TerminalPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className={`bg-jett-bg border-t border-jett-border ${isExpanded ? 'h-48' : 'h-10'}`}>
      <div 
        className="h-10 bg-jett-surface flex items-center justify-between px-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs">⚡</span>
          <span className="text-sm font-medium">Terminal</span>
          {logs.length > 0 && (
            <span className="text-xs text-jett-muted">({logs.length} lines)</span>
          )}
        </div>
        <span className="text-xs text-jett-muted">{isExpanded ? '▼' : '▲'}</span>
      </div>
      {isExpanded && (
        <div className="h-[calc(100%-40px)] overflow-auto p-3 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-jett-muted">Ready. Terminal output will appear here.</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-green-400">{log}</div>
            ))
          )}
        </div>
      )}
    </div>
  )
}