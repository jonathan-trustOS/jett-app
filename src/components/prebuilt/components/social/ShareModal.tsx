/**
 * ShareModal - Pre-built Share/Social Sharing Component
 * 
 * Features:
 * - Copy link to clipboard
 * - Social media sharing (Twitter, Facebook, LinkedIn, Email)
 * - QR code (optional)
 * - Share count
 */

import { useState } from 'react'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  url?: string
  title?: string
  description?: string
  onShare?: (platform: string) => void
}

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconCopy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconTwitter = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const IconLinkedIn = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const IconEmail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

export default function ShareModal({
  open,
  onClose,
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = 'Check this out!',
  description = '',
  onShare
}: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onShare?.('copy')
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(title)
    const shareUrl = encodeURIComponent(url)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, '_blank', 'width=550,height=420')
    onShare?.('twitter')
  }

  const shareToFacebook = () => {
    const shareUrl = encodeURIComponent(url)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank', 'width=550,height=420')
    onShare?.('facebook')
  }

  const shareToLinkedIn = () => {
    const shareUrl = encodeURIComponent(url)
    const shareTitle = encodeURIComponent(title)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&title=${shareTitle}`, '_blank', 'width=550,height=420')
    onShare?.('linkedin')
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title)
    const body = encodeURIComponent(`${description}\n\n${url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    onShare?.('email')
  }

  const socialButtons = [
    { name: 'Twitter', icon: <IconTwitter />, onClick: shareToTwitter, color: 'hover:bg-black' },
    { name: 'Facebook', icon: <IconFacebook />, onClick: shareToFacebook, color: 'hover:bg-blue-600' },
    { name: 'LinkedIn', icon: <IconLinkedIn />, onClick: shareToLinkedIn, color: 'hover:bg-blue-700' },
    { name: 'Email', icon: <IconEmail />, onClick: shareViaEmail, color: 'hover:bg-gray-600' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Share</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <IconX />
          </button>
        </div>

        {/* Copy link */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Copy link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copied ? <IconCheck /> : <IconCopy />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Social buttons */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Share to social media
          </label>
          <div className="grid grid-cols-4 gap-3">
            {socialButtons.map(btn => (
              <button
                key={btn.name}
                onClick={btn.onClick}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${btn.color}`}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              >
                {btn.icon}
                <span className="text-xs">{btn.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
