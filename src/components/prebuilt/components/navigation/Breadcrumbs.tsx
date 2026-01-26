/**
 * Breadcrumbs - Pre-built Breadcrumb Navigation Component
 * 
 * Features:
 * - Automatic truncation for long paths
 * - Custom separators
 * - Icon support
 * - Current page highlighting
 * - Responsive collapse
 * 
 * Customization via props:
 * - items: Breadcrumb items array
 * - separator: Custom separator element
 * - maxItems: Max visible items before truncation
 */

import { useState } from 'react'

// ============================================
// TYPES
// ============================================

interface BreadcrumbItem {
  id: string
  label: string
  href?: string
  icon?: React.ReactNode
  onClick?: () => void
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  maxItems?: number
  onNavigate?: (item: BreadcrumbItem) => void
}

// ============================================
// ICONS
// ============================================

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconMoreHorizontal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
)

// ============================================
// COMPONENT
// ============================================

export default function Breadcrumbs({
  items,
  separator,
  maxItems = 4,
  onNavigate
}: BreadcrumbsProps) {
  const [showHidden, setShowHidden] = useState(false)

  const handleClick = (item: BreadcrumbItem, e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault()
      item.onClick()
    }
    onNavigate?.(item)
  }

  // Calculate visible items
  const needsTruncation = items.length > maxItems
  
  let visibleItems: BreadcrumbItem[]
  let hiddenItems: BreadcrumbItem[] = []

  if (needsTruncation && !showHidden) {
    // Show first item, ellipsis, and last (maxItems - 2) items
    const lastItemsCount = maxItems - 2
    visibleItems = [
      items[0],
      ...items.slice(-lastItemsCount)
    ]
    hiddenItems = items.slice(1, -lastItemsCount)
  } else {
    visibleItems = items
  }

  const defaultSeparator = (
    <span style={{ color: 'var(--text-tertiary)' }}>
      <IconChevronRight />
    </span>
  )

  const renderItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
    const content = (
      <span className="flex items-center gap-1.5">
        {item.icon}
        <span>{item.label}</span>
      </span>
    )

    if (isLast) {
      return (
        <span 
          key={item.id}
          className="font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {content}
        </span>
      )
    }

    if (item.href) {
      return (
        <a
          key={item.id}
          href={item.href}
          onClick={(e) => handleClick(item, e)}
          className="hover:underline transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          {content}
        </a>
      )
    }

    return (
      <button
        key={item.id}
        onClick={(e) => handleClick(item, e)}
        className="hover:underline transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        {content}
      </button>
    )
  }

  return (
    <nav 
      className="flex items-center gap-2 text-sm"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1
          const isFirst = index === 0
          const showEllipsisAfter = isFirst && needsTruncation && !showHidden

          return (
            <li key={item.id} className="flex items-center gap-2">
              {renderItem(item, index, isLast)}
              
              {/* Ellipsis dropdown */}
              {showEllipsisAfter && (
                <>
                  {separator || defaultSeparator}
                  <div className="relative">
                    <button
                      onClick={() => setShowHidden(true)}
                      className="p-1 rounded hover:bg-white/5 transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      aria-label="Show hidden items"
                    >
                      <IconMoreHorizontal />
                    </button>
                    
                    {/* Hidden items dropdown */}
                    {showHidden && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setShowHidden(false)}
                        />
                        <div 
                          className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg z-20 min-w-[150px]"
                          style={{ 
                            background: 'var(--bg-secondary)', 
                            border: '1px solid var(--border-primary)'
                          }}
                        >
                          {hiddenItems.map(hiddenItem => (
                            <button
                              key={hiddenItem.id}
                              onClick={(e) => {
                                handleClick(hiddenItem, e)
                                setShowHidden(false)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {hiddenItem.icon}
                              {hiddenItem.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
              
              {!isLast && !showEllipsisAfter && (separator || defaultSeparator)}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ============================================
// HELPER: Create breadcrumbs from path
// ============================================

export function pathToBreadcrumbs(
  path: string,
  homeLabel: string = 'Home'
): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean)
  
  const items: BreadcrumbItem[] = [
    { id: 'home', label: homeLabel, href: '/', icon: <IconHome /> }
  ]

  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    items.push({
      id: segment,
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: currentPath
    })
  })

  return items
}
