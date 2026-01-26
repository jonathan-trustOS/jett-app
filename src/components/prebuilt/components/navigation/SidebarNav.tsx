/**
 * SidebarNav - Pre-built Sidebar Navigation Component
 * 
 * Features:
 * - Collapsible sidebar
 * - Nested menu items
 * - Icons support
 * - Active state
 * - Badges/counts
 * - Footer section
 * - Mobile responsive
 * 
 * Customization via props:
 * - items: Navigation items array
 * - logo: Logo element
 * - footer: Footer content
 * - collapsed: Initial collapsed state
 */

import { useState } from 'react'

// ============================================
// TYPES
// ============================================

interface NavItem {
  id: string
  label: string
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  badge?: string | number
  children?: NavItem[]
  divider?: boolean
}

interface SidebarNavProps {
  items: NavItem[]
  logo?: React.ReactNode
  footer?: React.ReactNode
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  activeId?: string
  onNavigate?: (item: NavItem) => void
}

// ============================================
// ICONS
// ============================================

const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

// ============================================
// COMPONENT
// ============================================

export default function SidebarNav({
  items,
  logo,
  footer,
  collapsed: initialCollapsed = false,
  onCollapsedChange,
  activeId,
  onNavigate
}: SidebarNavProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const handleNavigate = (item: NavItem) => {
    if (item.onClick) {
      item.onClick()
    }
    onNavigate?.(item)
    setMobileOpen(false)
  }

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    if (item.divider) {
      return (
        <div 
          key={item.id} 
          className="my-2 mx-3"
          style={{ borderTop: '1px solid var(--border-primary)' }}
        />
      )
    }

    const isActive = activeId === item.id
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else {
              handleNavigate(item)
            }
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
            isActive 
              ? 'bg-blue-600/20 text-blue-400' 
              : 'hover:bg-white/5'
          }`}
          style={{ 
            paddingLeft: collapsed ? undefined : `${12 + depth * 16}px`,
            color: isActive ? undefined : 'var(--text-secondary)'
          }}
        >
          {/* Icon */}
          {item.icon && (
            <span className={`flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`}>
              {item.icon}
            </span>
          )}

          {/* Label */}
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              
              {/* Badge */}
              {item.badge !== undefined && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    background: isActive ? 'rgba(59, 130, 246, 0.3)' : 'var(--bg-primary)',
                    color: isActive ? 'white' : 'var(--text-tertiary)'
                  }}
                >
                  {item.badge}
                </span>
              )}

              {/* Expand arrow */}
              {hasChildren && (
                <span 
                  className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <IconChevronDown />
                </span>
              )}
            </>
          )}
        </button>

        {/* Children */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div 
        className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4`}
        style={{ borderBottom: '1px solid var(--border-primary)' }}
      >
        {!collapsed && logo}
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors hidden lg:block"
          style={{ color: 'var(--text-secondary)' }}
        >
          {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {items.map(item => renderNavItem(item))}
      </nav>

      {/* Footer */}
      {footer && !collapsed && (
        <div 
          className="p-4"
          style={{ borderTop: '1px solid var(--border-primary)' }}
        >
          {footer}
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 rounded-lg lg:hidden"
        style={{ 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--border-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <IconMenu />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-16' : 'w-64'}`}
        style={{ 
          background: 'var(--bg-secondary)', 
          borderRight: '1px solid var(--border-primary)'
        }}
      >
        {sidebarContent}
      </aside>

      {/* Spacer for content */}
      <div 
        className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      />
    </>
  )
}
