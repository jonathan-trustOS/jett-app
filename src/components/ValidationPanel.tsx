import { useState, useEffect } from 'react'

interface ValidationResult {
  criterion: string
  plugin: 'code-review' | 'memory' | 'github'
  passed: boolean
  actual: string | number
  expected: string | number
  duration?: number
  details?: string
}

interface ValidationSummary {
  timestamp: string
  passed: number
  failed: number
  total: number
  results: ValidationResult[]
}

export default function ValidationPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [summary, setSummary] = useState<ValidationSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Listen for progress updates
    window.jett.validation.onProgress((msg: string) => {
      setLogs(prev => [...prev, msg])
    })
  }, [])

  const runValidation = async () => {
    setIsRunning(true)
    setLogs([])
    setSummary(null)
    setError(null)

    try {
      const result = await window.jett.validation.runAll()
      if (result.success && result.summary) {
        setSummary(result.summary)
        if (result.logs) {
          setLogs(result.logs)
        }
      } else {
        setError(result.error || 'Unknown error')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsRunning(false)
    }
  }

  const getPluginIcon = (plugin: string) => {
    switch (plugin) {
      case 'code-review': return '📝'
      case 'memory': return '🧠'
      case 'github': return '🐙'
      case 'simplifier': return '✨'
      case 'error-capture': return '🔥'
      default: return '🔧'
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          🧪 Plugin Validation
        </h3>
        <button
          onClick={runValidation}
          disabled={isRunning}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 
                     text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isRunning ? '⏳ Running...' : 'Run Validation'}
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className={`mb-4 p-3 rounded-lg ${
          summary.failed === 0 
            ? 'bg-emerald-900/30 border border-emerald-700'
            : 'bg-amber-900/30 border border-amber-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-bold ${
              summary.failed === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {summary.passed}/{summary.total} Passed
            </span>
            <span className="text-xs text-slate-400">
              {new Date(summary.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Results by plugin */}
      {summary && (
        <div className="space-y-3 mb-4">
          {['code-review', 'simplifier', 'memory', 'github', 'error-capture'].map(plugin => {
            const pluginResults = summary.results.filter(r => r.plugin === plugin)
            if (pluginResults.length === 0) return null
            const pluginPassed = pluginResults.filter(r => r.passed).length
            const pluginTotal = pluginResults.length
            
            return (
              <div key={plugin} className="bg-slate-900 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">
                    {getPluginIcon(plugin)} {plugin.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className={`text-sm ${
                    pluginPassed === pluginTotal ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {pluginPassed}/{pluginTotal}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {pluginResults.map((result, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span className={result.passed ? 'text-emerald-400' : 'text-red-400'}>
                        {result.passed ? '✓' : '✗'}
                      </span>
                      <div className="flex-1">
                        <span className="text-slate-300">{result.criterion}</span>
                        <div className="text-slate-500">
                          actual: {result.actual} | expected: {result.expected}
                        </div>
                        {result.details && (
                          <div className="text-slate-600 italic">{result.details}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <span className="text-red-400">❌ {error}</span>
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-slate-950 rounded-lg p-2 max-h-40 overflow-y-auto">
          <div className="font-mono text-xs text-slate-400 space-y-0.5">
            {logs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
