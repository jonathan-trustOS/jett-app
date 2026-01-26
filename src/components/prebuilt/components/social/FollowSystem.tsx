/**
 * FollowSystem - Pre-built Follow/Subscribe Component
 * 
 * Features:
 * - Follow/Unfollow button
 * - Follower/Following counts
 * - User card variant
 * - Loading states
 */

import { useState } from 'react'

interface User {
  id: string
  name: string
  username?: string
  avatar?: string
  bio?: string
  followers?: number
  following?: number
  isFollowing?: boolean
}

interface FollowSystemProps {
  user: User
  onFollow?: (userId: string, isFollowing: boolean) => void
  variant?: 'button' | 'card' | 'compact'
  showCounts?: boolean
}

const IconUserPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
)

const IconUserCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
)

export default function FollowSystem({
  user,
  onFollow,
  variant = 'button',
  showCounts = true
}: FollowSystemProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false)
  const [followers, setFollowers] = useState(user.followers || 0)
  const [isLoading, setIsLoading] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const handleFollow = async () => {
    setIsLoading(true)
    
    // Optimistic update
    const newFollowing = !isFollowing
    setIsFollowing(newFollowing)
    setFollowers(prev => newFollowing ? prev + 1 : prev - 1)
    
    try {
      await onFollow?.(user.id, newFollowing)
    } catch (e) {
      // Revert on error
      setIsFollowing(!newFollowing)
      setFollowers(prev => newFollowing ? prev - 1 : prev + 1)
    }
    
    setIsLoading(false)
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const formatCount = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const FollowButton = ({ className = '' }: { className?: string }) => (
    <button
      onClick={handleFollow}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
        isFollowing
          ? isHovering
            ? 'bg-red-500/20 text-red-400 border-red-500/50'
            : 'bg-transparent border-gray-500'
          : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent'
      } ${isLoading ? 'opacity-50 cursor-wait' : ''} ${className}`}
      style={{ border: '1px solid' }}
    >
      {isFollowing ? (
        isHovering ? (
          <>Unfollow</>
        ) : (
          <><IconUserCheck /> Following</>
        )
      ) : (
        <><IconUserPlus /> Follow</>
      )}
    </button>
  )

  // Button only variant
  if (variant === 'button') {
    return <FollowButton />
  }

  // Compact variant (avatar + name + button)
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-2">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
        >
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
          {user.username && (
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>@{user.username}</p>
          )}
        </div>
        <FollowButton />
      </div>
    )
  }

  // Full card variant
  return (
    <div 
      className="rounded-2xl p-6 text-center"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
    >
      {/* Avatar */}
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-medium"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          getInitials(user.name)
        )}
      </div>

      {/* Name */}
      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</h3>
      {user.username && (
        <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>@{user.username}</p>
      )}

      {/* Bio */}
      {user.bio && (
        <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{user.bio}</p>
      )}

      {/* Stats */}
      {showCounts && (
        <div className="flex justify-center gap-6 mb-4">
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCount(followers)}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Followers</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCount(user.following || 0)}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Following</p>
          </div>
        </div>
      )}

      {/* Follow button */}
      <FollowButton className="w-full justify-center" />
    </div>
  )
}
