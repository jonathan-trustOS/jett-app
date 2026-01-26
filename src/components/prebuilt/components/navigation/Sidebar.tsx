/**
 * Sidebar - Pre-built Navigation Sidebar Component
 * 
 * Features:
 * - Collapsible sections
 * - Active state highlighting
 * - Icons support
 * - Mobile responsive
 */

import { useState } from 'react'

interface NavItem {
  id: string
  label: string
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  children?: NavItem[]
  badge?: string | number
}

interface SidebarProps {
  items: NavItem[]
  activeId?: string
  onItemClick?: (item: NavItem) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  header?: React.ReactNode
  footer?: React.ReactNode
}

const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? 'rotate-90' : ''}`}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

export default function Sidebar({ items, activeId, onItemClick, collapsed = false, onCollapsedChange, header, footer }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpandedSections(newExpanded)
  }

  const handleItemClick = (item: NavItem) => {
    if (item.children) {
      toggleSection(item.id)
    } else {
      item.onClick?.()
      onItemClick?.(item)
    }
  }

  const NavItemComponent = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    const isActive = item.id === activeId
    const isExpanded = expandedSections.has(item.id)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div>
        <button
          onClick={() => handleItemClick(item)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-white/5'
          }`}
          style={{ 
            paddingLeft: collapsed ? '12px' : `${12 + depth * 16}px`,
            color: isActive ? undefined : 'var(--text-secondary)'
          }}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-600/20 text-blue-400">
                  {item.badge}
                </span>
              )}
              {hasChildren && <IconChevron open={isExpanded} />}
            </>
          )}
        </button>

        {/* Children */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1">
            {item.children!.map(child => (
              <NavItemComponent key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      className={`flex flex-col h-full transition-all ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-primary)' }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        {!collapsed && header}
        <button onClick={() => onCollapsedChange?.(!collapsed)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
          <IconMenu />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map(item => <NavItemComponent key={item.id} item={item} />)}
      </nav>

      {/* Footer */}
      {footer && !collapsed && (
        <div className="p-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
          {footer}
        </div>
      )}
    </div>
  )
}
