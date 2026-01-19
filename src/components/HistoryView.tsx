/**
 * History View - Version management for published apps
 */

import { useState } from 'react'
import { PublishedVersion, formatVersionDate } from './historyUtils'
import PublishModal from './PublishModal'
import RestoreModal from './RestoreModal'

// Icons
const IconMapPin = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const IconRocket = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
)

interface HistoryViewProps {
  projectPath: string
  projectName: string
  versions: PublishedVersion[]
  onVersionsChange: (versions: PublishedVersion[]) => void
}

export default function HistoryView({
  projectPath,
  projectName,
  versions,
  onVersionsChange
}: HistoryViewProps) {
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<PublishedVersion | null>(null)

  const handleRestore = (version: PublishedVersion) => {
    setSelectedVersion(version)
    setShowRestoreModal(true)
  }

  const latestVersion = versions[0]

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
        <div>
          <div className="flex items-center gap-2">
          <IconMapPin size={16} className="text-red-500" />
            <span className="text-[var(--text-primary)] font-medium">Current Draft</span>
          </div>
          <span className="text-[var(--text-secondary)] text-sm">Last edited recently</span>
        </div>
        <button
          onClick={() => setShowPublishModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors flex items-center gap-2"
        >
          <IconRocket size={14} /> Publish
        </button>
      </div>

      {/* Versions List */}
      <div className="flex-1 overflow-y-auto p-6">
        {versions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-[var(--text-primary)] font-medium mb-2">No published versions yet</h3>
            <p className="text-[var(--text-secondary)] text-sm">
              Click Publish to deploy your app and save a version
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {index === 0 && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Live
                        </span>
                      )}
                      <span className="text-[var(--text-primary)] font-medium">
                        {version.description || 'Published version'}
                      </span>
                    </div>
                    <div className="text-[var(--text-secondary)] text-sm">
                      {formatVersionDate(version.published_at)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a
                      href={version.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      View ↗
                    </a>
                    {index > 0 && (
                      <button
                        onClick={() => handleRestore(version)}
                        className="px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
                
                {version.screenshot && (
                  <div className="mt-3">
                    <img
                      src={version.screenshot}
                      alt="Version preview"
                      className="w-full max-w-md rounded-lg border border-[var(--border-primary)]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishModal
          projectPath={projectPath}
          projectName={projectName}
          versions={versions}
          onClose={() => setShowPublishModal(false)}
          onPublished={(newVersions, url) => {
            onVersionsChange(newVersions)
            setShowPublishModal(false)
          }}
        />
      )}

      {/* Restore Modal */}
      {showRestoreModal && selectedVersion && (
        <RestoreModal
          projectPath={projectPath}
          projectName={projectName}
          version={selectedVersion}
          versions={versions}
          onClose={() => {
            setShowRestoreModal(false)
            setSelectedVersion(null)
          }}
          onRestored={(newVersions) => {
            onVersionsChange(newVersions)
            setShowRestoreModal(false)
            setSelectedVersion(null)
          }}
        />
      )}
    </div>
  )
}
