# NotificationCenter Component

A dropdown notification panel with bell icon, unread badge, and notification list with actions.

## Features

- Bell icon trigger with unread count badge
- Dropdown panel with notification list
- Read/unread states with visual distinction
- Mark as read on click or explicit action
- Mark all as read
- Delete notifications
- Empty state
- Grouped by time (Today, Yesterday, Earlier)
- Click outside to close
- Keyboard navigation

## Props

```typescript
interface NotificationCenterProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onDelete: (id: string) => void
  onNotificationClick?: (notification: Notification) => void
  maxHeight?: string  // Default: '400px'
  className?: string
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'comment' | 'update'
  title: string
  message: string
  timestamp: Date | string
  read: boolean
  href?: string  // Optional link
  avatar?: string  // Optional avatar URL
  sender?: string  // Optional sender name
}
```

## Implementation

```tsx
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'comment' | 'update'
  title: string
  message: string
  timestamp: Date | string
  read: boolean
  href?: string
  avatar?: string
  sender?: string
}

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onDelete: (id: string) => void
  onNotificationClick?: (notification: Notification) => void
  maxHeight?: string
  className?: string
}

// Format relative time (outside component to avoid recreation)
function formatTime(timestamp: Date | string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Type icons (constant, outside component)
const NOTIFICATION_ICONS: Record<Notification['type'], JSX.Element> = {
  info: (
    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  mention: (
    <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  ),
  comment: (
    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  update: (
    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

export default function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onNotificationClick,
  maxHeight = '400px',
  className = ''
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length,
    [notifications]
  )

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Group notifications by date (memoized)
  const grouped = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const groups: { label: string; items: Notification[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Earlier', items: [] }
    ]

    notifications.forEach(item => {
      const date = new Date(item.timestamp)
      date.setHours(0, 0, 0, 0)

      if (date.getTime() === today.getTime()) {
        groups[0].items.push(item)
      } else if (date.getTime() === yesterday.getTime()) {
        groups[1].items.push(item)
      } else {
        groups[2].items.push(item)
      }
    })

    return groups.filter(g => g.items.length > 0)
  }, [notifications])

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      onMarkRead(notification.id)
    }
    onNotificationClick?.(notification)
    if (notification.href) {
      // Use callback if provided, otherwise fall back to navigation
      window.location.href = notification.href
    }
  }, [onMarkRead, onNotificationClick])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-red-500 rounded-full" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div 
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            ) : (
              <div>
                {grouped.map(group => (
                  <div key={group.label}>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {group.label}
                      </span>
                    </div>
                    {group.items.map(notification => (
                      <div
                        key={notification.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNotificationClick(notification)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleNotificationClick(notification)
                          }
                        }}
                        className={`
                          relative flex gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer
                          hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                          transition-colors
                          ${!notification.read ? 'bg-blue-50/50' : ''}
                        `}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <>
                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true" />
                            <span className="sr-only">Unread notification</span>
                          </>
                        )}

                        {/* Icon or Avatar */}
                        <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                          {notification.avatar ? (
                            <img 
                              src={notification.avatar} 
                              alt="" 
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              {NOTIFICATION_ICONS[notification.type]}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-gray-900`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-start gap-1">
                          {!notification.read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onMarkRead(notification.id)
                              }}
                              aria-label="Mark as read"
                              className="p-1 rounded hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(notification.id)
                            }}
                            aria-label="Delete notification"
                            className="p-1 rounded hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button 
                type="button" 
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

## Usage Example

```tsx
import NotificationCenter from './NotificationCenter'

function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'mention',
      title: 'Jane mentioned you',
      message: 'Hey @you, can you review this PR?',
      timestamp: new Date(),
      read: false,
      sender: 'Jane',
      avatar: '/avatars/jane.jpg'
    },
    {
      id: '2',
      type: 'success',
      title: 'Build completed',
      message: 'Your deployment to production was successful.',
      timestamp: new Date(Date.now() - 3600000),
      read: false
    },
    {
      id: '3',
      type: 'comment',
      title: 'New comment on your post',
      message: 'Great article! I especially liked the part about...',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      href: '/posts/123#comment-456'
    }
  ])

  const handleMarkRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <header className="flex items-center justify-between px-4 py-2">
      <Logo />
      <NotificationCenter
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDelete={handleDelete}
        onNotificationClick={(n) => console.log('Clicked:', n)}
      />
    </header>
  )
}
```

## Notification Types

| Type | Icon Color | Use Case |
|------|------------|----------|
| `info` | Blue | General information |
| `success` | Green | Completed actions |
| `warning` | Yellow | Caution/attention |
| `error` | Red | Failed operations |
| `mention` | Purple | User mentions (@user) |
| `comment` | Gray | Comments on content |
| `update` | Indigo | System/app updates |

## Accessibility

- Bell button has `aria-label` with unread count
- `aria-expanded` indicates dropdown state
- `aria-haspopup="true"` indicates popup behavior
- Dropdown has `role="dialog"` and `aria-label`
- Escape key closes dropdown
- Focus returns to bell button on close
- Action buttons have `aria-label` descriptions

## Customization Points

| Aspect | How to customize |
|--------|------------------|
| Width | Change `w-96` class |
| Max height | Modify `maxHeight` prop |
| Colors | Update icon colors in getIcon |
| Badge | Modify badge styles |
| Grouping | Adjust groupNotifications logic |
| Time format | Modify formatTime function |
