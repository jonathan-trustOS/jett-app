/**
 * Figma Import Modal
 * Import designs from Figma to generate PRD
 */

import { useState } from 'react'
import {
  extractFileKey,
  fetchFigmaFile,
  parseFigmaFile,
  generatePRDFromDesign,
  ParsedDesign
} from '../services/figma'

interface FigmaImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (prd: any) => void
}

export default function FigmaImportModal({ isOpen, onClose, onImport }: FigmaImportModalProps) {
  const [figmaUrl, setFigmaUrl] = useState('')
  const [figmaToken, setFigmaToken] = useState(() => localStorage.getItem('figma-token') || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ParsedDesign | null>(null)
  const [step, setStep] = useState<'input' | 'preview'>('input')

  if (!isOpen) return null

  const handleFetch = async () => {
    setError(null)
    
    // Validate URL
    const fileKey = extractFileKey(figmaUrl)
    if (!fileKey) {
      setError('Invalid Figma URL. Please paste a valid Figma file link.')
      return
    }
    
    // Validate token
    if (!figmaToken.trim()) {
      setError('Please enter your Figma Personal Access Token.')
      return
    }
    
    // Save token for future use
    localStorage.setItem('figma-token', figmaToken)
    
    setIsLoading(true)
    
    try {
      const file = await fetchFigmaFile(fileKey, figmaToken)
      const parsed = parseFigmaFile(file)
      setPreview(parsed)
      setStep('preview')
    } catch (err: any) {
      if (err.message.includes('403')) {
        setError('Access denied. Check your Figma token and file permissions.')
      } else if (err.message.includes('404')) {
        setError('File not found. Check the URL and try again.')
      } else {
        setError(err.message || 'Failed to fetch Figma file.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    if (!preview) return
    
    const prd = generatePRDFromDesign(preview)
    onImport(prd)
    onClose()
  }

  const handleBack = () => {
    setStep('input')
    setPreview(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col border border-[var(--border-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 38 57" fill="none">
                <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
                <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
                <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
                <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
                <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] font-semibold text-lg">Import from Figma</h2>
              <p className="text-[var(--text-secondary)] text-sm">
                {step === 'input' ? 'Paste your Figma file URL' : 'Review imported design'}
              </p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' ? (
            <div className="space-y-6">
              {/* Figma URL */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Figma File URL
                </label>
                <input
                  type="url"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/..."
                  className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Paste the URL from your browser when viewing a Figma file
                </p>
              </div>

              {/* Figma Token */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Figma Access Token
                </label>
                <input
                  type="password"
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  placeholder="figd_..."
                  className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Get your token from Figma → Settings → Personal Access Tokens
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* How it works */}
              <div className="p-4 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border-secondary)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">How it works</h4>
                <ol className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex gap-2">
                    <span className="text-purple-400">1.</span>
                    Jett reads your Figma file structure
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-400">2.</span>
                    Extracts colors, typography, and components
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-400">3.</span>
                    Generates a PRD matching your design
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-400">4.</span>
                    Builds a working app from the PRD
                  </li>
                </ol>
              </div>
            </div>
          ) : preview && (
            <div className="space-y-6">
              {/* Design Name */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/>
                    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/>
                    <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/>
                    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/>
                    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-[var(--text-primary)] font-semibold text-lg">{preview.name}</h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    {preview.screens.length} screen{preview.screens.length !== 1 ? 's' : ''} • 
                    {preview.components.length} component{preview.components.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Colors */}
              {preview.colors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {preview.colors.map((color, i) => (
                      <div 
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] rounded-lg"
                      >
                        <div 
                          className="w-5 h-5 rounded-full border border-[var(--border-secondary)]"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs text-[var(--text-secondary)]">{color.hex}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">{color.usage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Typography */}
              {preview.typography.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Typography</h4>
                  <div className="space-y-2">
                    {preview.typography.slice(0, 5).map((type, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] rounded-lg"
                      >
                        <span 
                          className="text-[var(--text-primary)]"
                          style={{ 
                            fontSize: `${Math.min(type.size, 24)}px`,
                            fontWeight: type.weight
                          }}
                        >
                          {type.name}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {type.font} • {type.size}px • {type.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Screens */}
              {preview.screens.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Screens</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {preview.screens.slice(0, 4).map((screen, i) => (
                      <div 
                        key={i}
                        className="p-3 bg-[var(--bg-secondary)] rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[var(--text-primary)] text-sm font-medium truncate">{screen.name}</span>
                          <span className="text-xs text-[var(--text-tertiary)]">{screen.width}×{screen.height}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                          {screen.elements.slice(0, 5).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Components */}
              {preview.components.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Components</h4>
                  <div className="flex flex-wrap gap-2">
                    {preview.components.slice(0, 10).map((comp, i) => (
                      <div 
                        key={i}
                        className="px-3 py-1.5 bg-[var(--bg-secondary)] rounded-full text-xs"
                      >
                        <span className="text-[var(--text-secondary)]">{comp.name}</span>
                        <span className="text-[var(--text-tertiary)] ml-1">({comp.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-primary)] flex justify-between">
          {step === 'preview' ? (
            <>
              <button
                onClick={handleBack}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-400 text-[var(--text-primary)] font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Import Design
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFetch}
                disabled={isLoading || !figmaUrl.trim()}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-400 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed text-[var(--text-primary)] font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Fetching...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Fetch Design
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
