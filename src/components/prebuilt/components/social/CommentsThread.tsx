/**
 * CommentsThread - Pre-built Comments/Discussion Component
 * 
 * Features:
 * - Nested replies (1 level deep)
 * - Add/edit/delete comments
 * - Like comments
 * - Timestamps
 * - User avatars
 */

import { useState } from 'react'

interface User {
  id: string
  name: string
  avatar?: string
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: string
  likes: number
  likedBy: string[]
  replies?: Comment[]
}

interface CommentsThreadProps {
  comments?: Comment[]
  onCommentsChange?: (comments: Comment[]) => void
  currentUser?: User
  maxDepth?: number
  placeholder?: string
}

const IconHeart = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const IconReply = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 17 4 12 9 7" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

export default function CommentsThread({
  comments: initialComments = [],
  onCommentsChange,
  currentUser = { id: 'user-1', name: 'You' },
  maxDepth = 1,
  placeholder = 'Write a comment...'
}: CommentsThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const updateComments = (newComments: Comment[]) => {
    setComments(newComments)
    onCommentsChange?.(newComments)
  }

  const formatTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const addComment = () => {
    if (!newComment.trim()) return
    const comment: Comment = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      replies: []
    }
    updateComments([comment, ...comments])
    setNewComment('')
  }

  const addReply = (parentId: string) => {
    if (!replyText.trim()) return
    const reply: Comment = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: []
    }
    updateComments(comments.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c))
    setReplyText('')
    setReplyingTo(null)
  }

  const toggleLike = (commentId: string, parentId?: string) => {
    const toggle = (c: Comment): Comment => {
      const hasLiked = c.likedBy.includes(currentUser.id)
      return { ...c, likes: hasLiked ? c.likes - 1 : c.likes + 1, likedBy: hasLiked ? c.likedBy.filter(id => id !== currentUser.id) : [...c.likedBy, currentUser.id] }
    }
    if (parentId) {
      updateComments(comments.map(c => c.id === parentId ? { ...c, replies: c.replies?.map(r => r.id === commentId ? toggle(r) : r) } : c))
    } else {
      updateComments(comments.map(c => c.id === commentId ? toggle(c) : c))
    }
  }

  const deleteComment = (commentId: string, parentId?: string) => {
    if (parentId) {
      updateComments(comments.map(c => c.id === parentId ? { ...c, replies: c.replies?.filter(r => r.id !== commentId) } : c))
    } else {
      updateComments(comments.filter(c => c.id !== commentId))
    }
  }

  const CommentItem = ({ comment, depth = 0, parentId }: { comment: Comment; depth?: number; parentId?: string }) => {
    const isOwn = comment.userId === currentUser.id
    const hasLiked = comment.likedBy.includes(currentUser.id)

    return (
      <div className={`flex gap-3 ${depth > 0 ? 'ml-10 mt-3' : ''}`}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
          {comment.userAvatar ? <img src={comment.userAvatar} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(comment.userName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{comment.userName}</span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={() => toggleLike(comment.id, parentId)} className={`flex items-center gap-1 text-xs ${hasLiked ? 'text-red-400' : ''}`} style={{ color: hasLiked ? undefined : 'var(--text-tertiary)' }}>
              <IconHeart filled={hasLiked} /> {comment.likes > 0 && comment.likes}
            </button>
            {depth < maxDepth && (
              <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <IconReply /> Reply
              </button>
            )}
            {isOwn && (
              <button onClick={() => deleteComment(comment.id, parentId)} className="text-xs hover:text-red-400" style={{ color: 'var(--text-tertiary)' }}>
                <IconTrash />
              </button>
            )}
          </div>
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addReply(comment.id)} placeholder="Write a reply..." className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} autoFocus />
              <button onClick={() => addReply(comment.id)} disabled={!replyText.trim()} className="px-3 py-2 rounded-lg text-sm bg-blue-600 text-white disabled:opacity-50">Reply</button>
            </div>
          )}
          {comment.replies?.map(reply => <CommentItem key={reply.id} comment={reply} depth={depth + 1} parentId={comment.id} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Comments {comments.length > 0 && `(${comments.length})`}</h2>
      </div>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
            {getInitials(currentUser.name)}
          </div>
          <div className="flex-1 flex gap-2">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} placeholder={placeholder} className="flex-1 px-4 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            <button onClick={addComment} disabled={!newComment.trim()} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white disabled:opacity-50">Post</button>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No comments yet. Be the first!</div>
        ) : comments.map(comment => <CommentItem key={comment.id} comment={comment} />)}
      </div>
    </div>
  )
}
