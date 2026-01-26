/**
 * Tabs - Pre-built Tabbed Interface Component
 * 
 * Features:
 * - Horizontal/vertical orientation
 * - Controlled/uncontrolled modes
 * - Disabled tabs
 * - Badges
 */

import { useState } from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
  content?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills' | 'underline'
  children?: React.ReactNode
}

export default function Tabs({ tabs, activeTab, onTabChange, orientation = 'horizontal', variant = 'default', children }: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || '')
  const currentTab = activeTab ?? internalActive

  const handleTabClick = (tabId: string) => {
    if (!activeTab) setInternalActive(tabId)
    onTabChange?.(tabId)
  }

  const getTabStyles = (isActive: boolean, isDisabled: boolean) => {
    if (isDisabled) return { color: 'var(--text-tertiary)', cursor: 'not-allowed' }
    
    if (variant === 'pills') {
      return {
        background: isActive ? 'var(--bg-primary)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
      }
    }
    
    if (variant === 'underline') {
      return {
        borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
      }
    }
    
    return {
      background: isActive ? 'var(--bg-primary)' : 'transparent',
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent'
    }
  }

  const tabListClass = orientation === 'vertical' 
    ? 'flex flex-col gap-1' 
    : 'flex gap-1'

  const containerClass = orientation === 'vertical'
    ? 'flex gap-4'
    : 'flex flex-col'

  return (
    <div className={containerClass}>
      {/* Tab list */}
      <div 
        className={`${tabListClass} ${variant === 'pills' ? 'p-1 rounded-lg' : ''}`}
        style={variant === 'pills' ? { background: 'var(--bg-secondary)' } : { borderBottom: variant !== 'underline' ? '1px solid var(--border-primary)' : undefined }}
        role="tablist"
      >
        {tabs.map(tab => {
          const isActive = tab.id === currentTab
          const styles = getTabStyles(isActive, !!tab.disabled)

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                variant === 'pills' ? 'rounded-md' : ''
              } ${!tab.disabled ? 'hover:bg-white/5' : ''}`}
              style={styles}
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-600/20 text-blue-400">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 p-4" role="tabpanel">
        {children || tabs.find(t => t.id === currentTab)?.content}
      </div>
    </div>
  )
}
