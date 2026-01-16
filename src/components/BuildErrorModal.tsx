/**
 * Build Error Modal
 * Displays categorized build/runtime errors with auto-fix options
 */

import { useState } from 'react'

// Types matching error-capture plugin
interface DetectedError {
  category: 'npm' | 'typescript' | 'vite' | 'runtime' | 'unknown'
  type: string
  message: string
  file?: string
  line?: number
  column?: number
  suggestion?: string
  autoFixable: boolean
  rawOutput: string
}

interface ErrorAnalysis {
  errors: DetectedError[]
  summary: string
  hasAutoFixable: boolean
  fixPrompt?: string
}

interface BuildErrorModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: ErrorAnalysis | null
  onAutoFix: () => Promise<void>
  onRetry: () => void
  onViewTerminal: () => void
  onSkip?: () => void
  isFixing?: boolean
}

export default function BuildErrorModal({
  isOpen,
  onClose,
  analysis,
  onAutoFix,
  onRetry,
  onViewTerminal,
  onSkip,
  isFixing = false
}: BuildErrorModalProps) {
  const [expandedError, setExpandedError] = useState<number | null>(null)

  if (!isOpen || !analysis) return null

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'npm': return '📦'
      case 'typescript': return '🔷'
      case 'vite': return '⚡'
      case 'runtime': return '🔥'
      default: return '❓'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'npm': return '#f59e0b'      // amber
      case 'typescript': return '#3b82f6' // blue
      case 'vite': return '#8b5cf6'      // purple
      case 'runtime': return '#ef4444'   // red
      default: return '#6b7280'          // gray
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'npm': return 'Package Error'
      case 'typescript': return 'Type Error'
      case 'vite': return 'Build Error'
      case 'runtime': return 'Runtime Error'
      default: return 'Unknown Error'
    }
  }

  const formatErrorType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col border border-[var(--border-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] font-semibold text-lg">Build Error</h2>
              <p className="text-[var(--text-secondary)] text-sm">{analysis.summary}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-secondary)]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Error List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {analysis.errors.map((error, index) => (
            <div
              key={index}
              className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-primary)]"
            >
              {/* Error Header */}
              <button
                className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-slate-750 transition-colors"
                onClick={() => setExpandedError(expandedError === index ? null : index)}
              >
                <span 
                  className="text-xl mt-0.5"
                  style={{ filter: `drop-shadow(0 0 4px ${getCategoryColor(error.category)})` }}
                >
                  {getCategoryIcon(error.category)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: `${getCategoryColor(error.category)}20`,
                        color: getCategoryColor(error.category)
                      }}
                    >
                      {getCategoryLabel(error.category)}
                    </span>
                    {error.autoFixable && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        Auto-fixable
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-primary)] font-medium truncate">{error.message}</p>
                  {error.file && (
                    <p className="text-[var(--text-secondary)] text-sm mt-1 font-mono">
                      {error.file}
                      {error.line && `:${error.line}`}
                      {error.column && `:${error.column}`}
                    </p>
                  )}
                </div>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none"
                  className={`text-[var(--text-secondary)] transition-transform ${expandedError === index ? 'rotate-180' : ''}`}
                >
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Expanded Details */}
              {expandedError === index && (
                <div className="px-4 pb-4 pt-2 border-t border-[var(--border-primary)] space-y-3">
                  {/* Error Type */}
                  <div>
                    <span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider">Error Type</span>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{formatErrorType(error.type)}</p>
                  </div>

                  {/* Suggestion */}
                  {error.suggestion && (
                    <div className="bg-[var(--bg-primary)]/50 rounded-lg p-3 border border-[var(--border-secondary)]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400">💡</span>
                        <span className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Suggestion</span>
                      </div>
                      <p className="text-slate-200 text-sm">{error.suggestion}</p>
                    </div>
                  )}

                  {/* Raw Output Preview */}
                  {error.rawOutput && (
                    <div>
                      <span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider">Raw Output</span>
                      <pre className="mt-1 text-xs text-[var(--text-secondary)] bg-slate-950 rounded-lg p-3 overflow-x-auto max-h-32 overflow-y-auto font-mono">
                        {error.rawOutput.slice(0, 300)}
                        {error.rawOutput.length > 300 && '...'}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* No Errors (shouldn't happen, but just in case) */}
          {analysis.errors.length === 0 && (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              <p>No specific errors detected.</p>
              <p className="text-sm mt-1">Check the terminal for more details.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[var(--border-primary)] flex items-center justify-between gap-3">
          <button
            onClick={onViewTerminal}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm flex items-center gap-2 transition-colors"
          >
            <span>📟</span>
            View Terminal
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            >
              🔄 Retry
            </button>

            {onSkip && (
              <button
                onClick={onSkip}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors border border-[var(--border-primary)]"
              >
                ⏭️ Skip Task
              </button>
            )}

            {analysis.hasAutoFixable && (
              <button
                onClick={onAutoFix}
                disabled={isFixing}
                className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                {isFixing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Fixing...
                  </>
                ) : (
                  <>
                    ✨ Auto-Fix
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
