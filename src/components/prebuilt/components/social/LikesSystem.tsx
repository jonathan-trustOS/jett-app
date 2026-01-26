/**
 * LikesSystem - Pre-built Reactions/Likes Component
 * 
 * Features:
 * - Like button with count
 * - Multiple reaction types (optional)
 * - Animated interactions
 * - Who liked tooltip
 */

import { useState } from 'react'

interface LikesSystemProps {
  initialCount?: number
  initialLiked?: boolean
  onLike?: (liked: boolean, count: number) => void
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'simple' | 'reactions'
  reactions?: string[]
}

const IconHeart = ({ filled, size }: { filled?: boolean; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const IconThumbUp = ({ filled, size }: { filled?: boolean; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
)

const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡']

export default function LikesSystem({
  initialCount = 0,
  initialLiked = false,
  onLike,
  showCount = true,
  size = 'md',
  variant = 'simple',
  reactions = DEFAULT_REACTIONS
}: LikesSystemProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [selectedReaction, setSelectedReaction] = useState<string | null>(initialLiked ? reactions[0] : null)
  const [showReactions, setShowReactions] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20
  const buttonPadding = size === 'sm' ? 'px-2 py-1' : size === 'lg' ? 'px-4 py-2' : 'px-3 py-1.5'
  const fontSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

  const handleLike = () => {
    const newLiked = !liked
    const newCount = newLiked ? count + 1 : count - 1
    
    setLiked(newLiked)
    setCount(newCount)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
    
    if (!newLiked) setSelectedReaction(null)
    onLike?.(newLiked, newCount)
  }

  const handleReaction = (reaction: string) => {
    const wasLiked = liked
    const newLiked = selectedReaction !== reaction
    
    setSelectedReaction(newLiked ? reaction : null)
    setLiked(newLiked)
    setCount(prev => {
      if (!wasLiked && newLiked) return prev + 1
      if (wasLiked && !newLiked) return prev - 1
      return prev
    })
    setShowReactions(false)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
    
    onLike?.(newLiked, newLiked ? count + 1 : count - 1)
  }

  if (variant === 'reactions') {
    return (
      <div className="relative inline-block">
        {/* Reactions popup */}
        {showReactions && (
          <div 
            className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-full shadow-lg"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
          >
            {reactions.map(reaction => (
              <button
                key={reaction}
                onClick={() => handleReaction(reaction)}
                className={`text-xl hover:scale-125 transition-transform ${selectedReaction === reaction ? 'scale-125' : ''}`}
              >
                {reaction}
              </button>
            ))}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => liked ? handleLike() : setShowReactions(!showReactions)}
          onMouseEnter={() => !liked && setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
          className={`flex items-center gap-2 ${buttonPadding} rounded-full transition-all ${
            liked ? 'bg-blue-600/20' : 'hover:bg-white/10'
          } ${isAnimating ? 'scale-110' : ''}`}
          style={{ border: '1px solid var(--border-primary)' }}
        >
          {selectedReaction ? (
            <span className="text-lg">{selectedReaction}</span>
          ) : (
            <IconThumbUp filled={liked} size={iconSize} />
          )}
          {showCount && (
            <span className={fontSize} style={{ color: liked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {count}
            </span>
          )}
        </button>
      </div>
    )
  }

  // Simple variant
  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-2 ${buttonPadding} rounded-full transition-all ${
        liked ? 'text-red-400' : ''
      } ${isAnimating ? 'scale-110' : ''}`}
      style={{ 
        background: liked ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
        border: '1px solid var(--border-primary)',
        color: liked ? undefined : 'var(--text-secondary)'
      }}
    >
      <span className={`transition-transform ${isAnimating ? 'scale-125' : ''}`}>
        <IconHeart filled={liked} size={iconSize} />
      </span>
      {showCount && (
        <span className={fontSize}>{count}</span>
      )}
    </button>
  )
}
