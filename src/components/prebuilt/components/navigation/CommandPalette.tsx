/**
 * CommandPalette - Pre-built Command Palette Component (⌘K)
 * 
 * Features:
 * - Keyboard shortcut activation (⌘K / Ctrl+K)
 * - Fuzzy search
 * - Grouped commands
 * - Keyboard navigation
 * - Recent commands
 * - Icons and shortcuts display
 * 
 * Customization via props:
 * - commands: Array of command objects
 * - placeholder: Search placeholder
 * - hotkey: Activation hotkey
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'

// ============================================
// TYPES
// ============================================

interface Command {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string
  group?: string
  onSelect: () => void
  keywords?: string[]
}

interface CommandPaletteProps {
  commands: Command[]
  placeholder?: string
  hotkey?: string
  recentIds?: string[]
  onRecentChange?: (ids: string[]) => void
}

// ============================================
// ICONS
// ============================================

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconCommand = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  </svg>
)

const IconCornerDownLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 10 4 15 9 20" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
)

// ============================================
// HELPERS
// ============================================

// Simple fuzzy match
const fuzzyMatch = (text: string, query: string): boolean => {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  
  let queryIndex = 0
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++
    }
  }
  
  return queryIndex === queryLower.length
}

// ============================================
// COMPONENT
// ============================================

export default function CommandPalette({
  commands,
  placeholder = 'Search commands...',
  hotkey = 'k',
  recentIds = [],
  onRecentChange
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query) {
      // Show recent first, then all
      const recentCommands = recentIds
        .map(id => commands.find(c => c.id === id))
        .filter(Boolean) as Command[]
      
      const otherCommands = commands.filter(c => !recentIds.includes(c.id))
      
      return [
        ...(recentCommands.length > 0 ? [{ group: 'Recent', items: recentCommands }] : []),
        ...groupCommands(otherCommands)
      ]
    }

    const matches = commands.filter(cmd => {
      const searchText = [cmd.label, cmd.description, ...(cmd.keywords || [])].join(' ')
      return fuzzyMatch(searchText, query)
    })

    return groupCommands(matches)
  }, [commands, query, recentIds])

  // Group commands by their group property
  const groupCommands = (cmds: Command[]) => {
    const groups: Record<string, Command[]> = {}
    const ungrouped: Command[] = []

    cmds.forEach(cmd => {
      if (cmd.group) {
        if (!groups[cmd.group]) groups[cmd.group] = []
        groups[cmd.group].push(cmd)
      } else {
        ungrouped.push(cmd)
      }
    })

    return [
      ...Object.entries(groups).map(([group, items]) => ({ group, items })),
      ...(ungrouped.length > 0 ? [{ group: 'Commands', items: ungrouped }] : [])
    ]
  }

  // Flatten for keyboard navigation
  const flatCommands = useMemo(() => {
    return filteredCommands.flatMap(g => g.items)
  }, [filteredCommands])

  // Open/close handlers
  const open = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
  }, [])

  // Select command
  const selectCommand = useCallback((command: Command) => {
    command.onSelect()
    close()

    // Update recent
    if (onRecentChange) {
      const newRecent = [command.id, ...recentIds.filter(id => id !== command.id)].slice(0, 5)
      onRecentChange(newRecent)
    }
  }, [close, recentIds, onRecentChange])

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === hotkey) {
        e.preventDefault()
        if (isOpen) {
          close()
        } else {
          open()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hotkey, isOpen, open, close])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (flatCommands[selectedIndex]) {
            selectCommand(flatCommands[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          close()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, flatCommands, selectCommand, close])

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) {
    return null
  }

  let commandIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={close}
      />

      {/* Palette */}
      <div 
        className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
      >
        {/* Search input */}
        <div 
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>
            <IconSearch />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd 
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}
          >
            esc
          </kbd>
        </div>

        {/* Commands list */}
        <div 
          ref={listRef}
          className="max-h-80 overflow-auto py-2"
        >
          {flatCommands.length === 0 ? (
            <div className="px-4 py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
              No commands found
            </div>
          ) : (
            filteredCommands.map((group, groupIndex) => (
              <div key={group.group || groupIndex}>
                {/* Group header */}
                <div 
                  className="px-4 py-2 text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {group.group}
                </div>

                {/* Commands */}
                {group.items.map((command) => {
                  const index = commandIndex++
                  const isSelected = selectedIndex === index

                  return (
                    <button
                      key={command.id}
                      data-index={index}
                      onClick={() => selectCommand(command)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-blue-600/20' : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Icon */}
                      {command.icon && (
                        <span 
                          className="flex-shrink-0"
                          style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                        >
                          {command.icon}
                        </span>
                      )}

                      {/* Label & Description */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {command.label}
                        </div>
                        {command.description && (
                          <div 
                            className="text-sm truncate"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {command.description}
                          </div>
                        )}
                      </div>

                      {/* Shortcut */}
                      {command.shortcut && (
                        <kbd 
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs flex-shrink-0"
                          style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}
                        >
                          {command.shortcut}
                        </kbd>
                      )}

                      {/* Enter indicator when selected */}
                      {isSelected && (
                        <span className="text-blue-400">
                          <IconCornerDownLeft />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-between px-4 py-2 text-xs"
          style={{ borderTop: '1px solid var(--border-primary)', color: 'var(--text-tertiary)' }}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)' }}>↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)' }}>↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)' }}>↵</kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <IconCommand />
            <span>{hotkey.toUpperCase()}</span>
            to toggle
          </span>
        </div>
      </div>
    </div>
  )
}
