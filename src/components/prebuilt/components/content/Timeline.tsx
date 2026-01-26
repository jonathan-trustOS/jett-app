/**
 * Timeline - Pre-built Timeline/Activity Feed Component
 * 
 * Features:
 * - Vertical timeline display
 * - Different event types with icons
 * - Timestamps
 * - Collapsible details
 * - Add new entries
 * 
 * Customization via props:
 * - items: Timeline items array
 * - onItemsChange: Callback when items change
 * - allowAdd: Allow adding new items
 * - types: Custom event types with icons/colors
 */

import { useState } from 'react'

// ============================================
// TYPES
// ============================================

interface TimelineItem {
  id: string
  type: string
  title: string
  description?: string
  timestamp: string
  metadata?: Record<string, any>
}

interface TimelineType {
  label: string
  color: string
  icon: React.ReactNode
}

interface TimelineProps {
  items?: TimelineItem[]
  onItemsChange?: (items: TimelineItem[]) => void
  allowAdd?: boolean
  types?: Record<string, TimelineType>
  title?: string
}

// ============================================
// DEFAULT ICONS
// ============================================

const IconCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="6" />
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconMessage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ============================================
// DEFAULT TYPES
// ============================================

const defaultTypes: Record<string, TimelineType> = {
  default: { label: 'Event', color: 'bg-gray-500', icon: <IconCircle /> },
  completed: { label: 'Completed', color: 'bg-green-500', icon: <IconCheck /> },
  comment: { label: 'Comment', color: 'bg-blue-500', icon: <IconMessage /> },
  milestone: { label: 'Milestone', color: 'bg-yellow-500', icon: <IconStar /> },
  alert: { label: 'Alert', color: 'bg-red-500', icon: <IconAlert /> },
  user: { label: 'User Activity', color: 'bg-purple-500', icon: <IconUser /> }
}

// ============================================
// COMPONENT
// ============================================

export default function Timeline({
  items: initialItems = [],
  onItemsChange,
  allowAdd = true,
  types = defaultTypes,
  title = 'Activity'
}: TimelineProps) {
  const [items, setItems] = useState<TimelineItem[]>(initialItems)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ type: 'default', title: '', description: '' })
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const updateItems = (newItems: TimelineItem[]) => {
    setItems(newItems)
    onItemsChange?.(newItems)
  }

  const addItem = () => {
    if (!newItem.title.trim()) return
    const item: TimelineItem = {
      id: crypto.randomUUID(),
      type: newItem.type,
      title: newItem.title.trim(),
      description: newItem.description.trim() || undefined,
      timestamp: new Date().toISOString()
    }
    updateItems([item, ...items])
    setNewItem({ type: 'default', title: '', description: '' })
    setShowAddForm(false)
  }

  const deleteItem = (id: string) => {
    updateItems(items.filter(item => item.id !== id))
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now'
    // Less than 1 hour
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    // Less than 24 hours
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    // Less than 7 days
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  const getType = (typeName: string): TimelineType => {
    return types[typeName] || types.default || defaultTypes.default
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {allowAdd && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
          >
            <IconPlus /> Add
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="space-y-3">
            <select
              value={newItem.type}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            >
              {Object.entries(types).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="What happened?"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              autoFocus
            />
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Add details (optional)..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={addItem}
                disabled={!newItem.title.trim()}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm disabled:opacity-50 transition-colors"
              >
                Add Entry
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Items */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
            No activity yet
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div 
              className="absolute left-[15px] top-0 bottom-0 w-0.5"
              style={{ background: 'var(--border-primary)' }}
            />
            
            {items.map((item, index) => {
              const type = getType(item.type)
              const isExpanded = expandedItems.has(item.id)
              
              return (
                <div key={item.id} className={`relative flex gap-4 ${index < items.length - 1 ? 'pb-6' : ''}`}>
                  {/* Icon */}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${type.color}`}>
                    {type.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 group">
                    <div 
                      className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
                      onClick={() => item.description && toggleExpand(item.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                              {type.label}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </div>
                          <p className="font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                            {item.title}
                          </p>
                          {item.description && (
                            <p 
                              className={`text-sm mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {item.description}
                            </p>
                          )}
                          {item.description && item.description.length > 100 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(item.id)
                              }}
                              className="text-xs mt-1 hover:underline"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteItem(item.id)
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all"
                        >
                          <IconX />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
