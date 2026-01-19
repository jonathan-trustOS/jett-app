/**
 * Publish Modal - Deploy to Vercel and save version
 */

import { useState } from 'react'
import { PublishedVersion, publishVersion } from './historyUtils'

interface PublishModalProps {
  projectPath: string
  projectName: string
  versions: PublishedVersion[]
  onClose: () => void
  onPublished: (versions: PublishedVersion[], url: string) => void
}

export default function PublishModal({
  projectPath,
  projectName,
  versions,
  onClose,
  onPublished
}: PublishModalProps) {
  const [description, setDescription] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ url: string } | null>(null)

  const handlePublish = async () => {
    setIsPublishing(true)
    setError(null)

    // Check for Vercel token first
  const vercelToken = localStorage.getItem('vercel_token')
  if (!vercelToken) {
    window.jett?.openExternal?.('https://vercel.com/account/tokens')
    setError('No Vercel token. Add one in Settings → API tab.')
    setIsPublishing(false)
    return
    
  }
    try {
      const result = await publishVersion(
        projectPath,
        projectName,
        description || 'Published version',
        versions
      )
      
      setSuccess({ url: result.url })
      onPublished(result.allVersions, result.url)
    } catch (err: any) {
      console.error('Publish failed:', err)
      setError(err.message || 'Failed to publish')
    } finally {
      setIsPublishing(false)
    }
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isPublishing) {
      e.preventDefault()
      handlePublish()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-[var(--border-primary)]">
        {/* Success State */}
        {success ? (
          <div className="p-6 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">
              Published!
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Your app is now live
            </p>
            <a
              href={success.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors mb-3"
            >
              View App ↗
            </a>
            <button
              onClick={onClose}
              className="block w-full py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
              <h2 className="text-[var(--text-primary)] font-semibold text-lg">
                Publish Version
              </h2>
              <button
                onClick={onClose}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <span className="text-xl">✕</span>
                    <div>
                      <div className="font-medium">Publish Failed</div>
                      <div className="text-sm opacity-80">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Version Note (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What changed in this version?"
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="text-sm text-[var(--text-secondary)] mb-4">
                This will deploy your app to Vercel and save a snapshot you can restore later.
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-primary)]">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>Publish 🚀</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
