/**
 * Restore Modal - Restore to a previous version
 */

import { useState } from 'react'
import { PublishedVersion, restoreVersion, formatShortDate } from './historyUtils'

interface RestoreModalProps {
  projectPath: string
  projectName: string
  version: PublishedVersion
  versions: PublishedVersion[]
  onClose: () => void
  onRestored: (versions: PublishedVersion[]) => void
}

export default function RestoreModal({
  projectPath,
  projectName,
  version,
  versions,
  onClose,
  onRestored
}: RestoreModalProps) {
  const [isRestoring, setIsRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRestore = async () => {
    setIsRestoring(true)
    setError(null)

    try {
      const newVersions = await restoreVersion(
        projectPath,
        projectName,
        version.id,
        versions
      )
      onRestored(newVersions)
    } catch (err: any) {
      console.error('Restore failed:', err)
      setError(err.message || 'Failed to restore')
    } finally {
      setIsRestoring(false)
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-[var(--text-primary)] font-semibold text-lg">
            Restore Version
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
                  <div className="font-medium">Restore Failed</div>
                  <div className="text-sm opacity-80">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Version Preview */}
          <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] mb-4">
            <div className="flex items-center gap-3">
              {version.screenshot ? (
                <img
                  src={version.screenshot}
                  alt="Version preview"
                  className="w-16 h-16 rounded-lg object-cover border border-[var(--border-primary)]"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-2xl">
                  📸
                </div>
              )}
              <div>
                <div className="text-[var(--text-primary)] font-medium">
                  {version.description || 'Published version'}
                </div>
                <div className="text-[var(--text-secondary)] text-sm">
                  {formatShortDate(version.published_at)}
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-[var(--text-secondary)]">
            <p className="mb-2">
              This will replace your current code with the files from this version.
            </p>
            <p className="text-amber-400">
              ⚠️ Your current work will be saved as a backup first.
            </p>
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
            onClick={handleRestore}
            disabled={isRestoring}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isRestoring ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Restoring...
              </>
            ) : (
              <>Restore</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
