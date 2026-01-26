/**
 * UserProfile - Pre-built User Profile Component
 * 
 * Features:
 * - Avatar display/upload
 * - Editable name, bio, email
 * - Save/Cancel actions
 * - Loading states
 * - Form validation
 * 
 * Customization via props:
 * - user: Current user data
 * - onSave: Callback when profile is saved
 * - onAvatarUpload: Optional avatar upload handler
 * - editable: Whether fields can be edited
 */

import { useState, useRef } from 'react'

// ============================================
// TYPES
// ============================================

interface User {
  id: string
  name: string
  email: string
  bio?: string
  avatar?: string
  joinedAt?: string
}

interface UserProfileProps {
  user: User
  onSave: (updates: Partial<User>) => Promise<void>
  onAvatarUpload?: (file: File) => Promise<string>
  editable?: boolean
}

// ============================================
// ICONS
// ============================================

const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ============================================
// COMPONENT
// ============================================

export default function UserProfile({
  user,
  onSave,
  onAvatarUpload,
  editable = true
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio || '')
  const [avatarPreview, setAvatarPreview] = useState(user.avatar)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCancel = () => {
    setName(user.name)
    setBio(user.bio || '')
    setAvatarPreview(user.avatar)
    setIsEditing(false)
    setError(null)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave({
        name: name.trim(),
        bio: bio.trim() || undefined,
        avatar: avatarPreview
      })
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    try {
      if (onAvatarUpload) {
        setIsLoading(true)
        const url = await onAvatarUpload(file)
        setAvatarPreview(url)
      } else {
        // Local preview only
        const reader = new FileReader()
        reader.onload = (e) => {
          setAvatarPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div 
      className="rounded-2xl p-6"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Profile
        </h2>
        {editable && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <IconEdit />
            Edit
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div
            onClick={handleAvatarClick}
            className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ${
              isEditing ? 'cursor-pointer hover:opacity-80' : ''
            } transition-opacity`}
            style={{ background: 'var(--bg-primary)', border: '3px solid var(--border-primary)' }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                {getInitials(name)}
              </span>
            )}
          </div>
          {isEditing && (
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white cursor-pointer hover:bg-blue-500 transition-colors"
              onClick={handleAvatarClick}
            >
              <IconCamera />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        {isEditing && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Click to change avatar
          </p>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50"
              style={{ 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
          ) : (
            <p style={{ color: 'var(--text-primary)' }}>{user.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Email
          </label>
          <p style={{ color: 'var(--text-primary)' }}>{user.email}</p>
          {isEditing && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Email cannot be changed
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Bio
          </label>
          {isEditing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              style={{ 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
          ) : (
            <p style={{ color: user.bio ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              {user.bio || 'No bio yet'}
            </p>
          )}
        </div>

        {/* Joined Date */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Member Since
          </label>
          <p style={{ color: 'var(--text-primary)' }}>{formatDate(user.joinedAt)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex gap-3 mt-6 pt-6" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors hover:bg-white/5"
            style={{ 
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <IconX />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <IconCheck />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
