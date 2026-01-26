/**
 * KanbanBoard - Pre-built Kanban Board Component
 * 
 * Features:
 * - Multiple columns (e.g., Todo, In Progress, Done)
 * - Add/edit/delete cards
 * - Move cards between columns
 * - Card colors/labels
 * - Collapsible columns
 * 
 * Customization via props:
 * - columns: Column definitions with cards
 * - onColumnsChange: Callback when data changes
 * - allowAddColumn: Allow adding new columns
 */

import { useState } from 'react'

// ============================================
// TYPES
// ============================================

interface Card {
  id: string
  title: string
  description?: string
  color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
  createdAt: string
}

interface Column {
  id: string
  title: string
  cards: Card[]
}

interface KanbanBoardProps {
  columns?: Column[]
  onColumnsChange?: (columns: Column[]) => void
  allowAddColumn?: boolean
}

// ============================================
// ICONS
// ============================================

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconMoreVertical = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
)

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

// ============================================
// DEFAULT DATA
// ============================================

const defaultColumns: Column[] = [
  { id: 'todo', title: 'To Do', cards: [] },
  { id: 'in-progress', title: 'In Progress', cards: [] },
  { id: 'done', title: 'Done', cards: [] }
]

const colorClasses: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500'
}

// ============================================
// COMPONENT
// ============================================

export default function KanbanBoard({
  columns: initialColumns = defaultColumns,
  onColumnsChange,
  allowAddColumn = true
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [addingCardTo, setAddingCardTo] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardColor, setNewCardColor] = useState<Card['color']>('blue')
  const [editingCard, setEditingCard] = useState<{ columnId: string; card: Card } | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [draggedCard, setDraggedCard] = useState<{ columnId: string; card: Card } | null>(null)
  const [dropTargetColumn, setDropTargetColumn] = useState<string | null>(null)

  const updateColumns = (newColumns: Column[]) => {
    setColumns(newColumns)
    onColumnsChange?.(newColumns)
  }

  // Card operations
  const addCard = (columnId: string) => {
    if (!newCardTitle.trim()) return
    const newCard: Card = {
      id: crypto.randomUUID(),
      title: newCardTitle.trim(),
      color: newCardColor,
      createdAt: new Date().toISOString()
    }
    updateColumns(columns.map(col =>
      col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col
    ))
    setNewCardTitle('')
    setAddingCardTo(null)
  }

  const updateCard = (columnId: string, cardId: string, updates: Partial<Card>) => {
    updateColumns(columns.map(col =>
      col.id === columnId
        ? { ...col, cards: col.cards.map(c => c.id === cardId ? { ...c, ...updates } : c) }
        : col
    ))
  }

  const deleteCard = (columnId: string, cardId: string) => {
    updateColumns(columns.map(col =>
      col.id === columnId ? { ...col, cards: col.cards.filter(c => c.id !== cardId) } : col
    ))
  }

  const moveCard = (fromColumnId: string, toColumnId: string, card: Card) => {
    if (fromColumnId === toColumnId) return
    updateColumns(columns.map(col => {
      if (col.id === fromColumnId) {
        return { ...col, cards: col.cards.filter(c => c.id !== card.id) }
      }
      if (col.id === toColumnId) {
        return { ...col, cards: [...col.cards, card] }
      }
      return col
    }))
  }

  // Column operations
  const addColumn = () => {
    if (!newColumnTitle.trim()) return
    const newColumn: Column = {
      id: crypto.randomUUID(),
      title: newColumnTitle.trim(),
      cards: []
    }
    updateColumns([...columns, newColumn])
    setNewColumnTitle('')
    setAddingColumn(false)
  }

  const updateColumnTitle = (columnId: string, title: string) => {
    updateColumns(columns.map(col =>
      col.id === columnId ? { ...col, title } : col
    ))
  }

  const deleteColumn = (columnId: string) => {
    if (!confirm('Delete this column and all its cards?')) return
    updateColumns(columns.filter(col => col.id !== columnId))
  }

  // Drag and drop handlers
  const handleDragStart = (columnId: string, card: Card) => {
    setDraggedCard({ columnId, card })
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDropTargetColumn(columnId)
  }

  const handleDragLeave = () => {
    setDropTargetColumn(null)
  }

  const handleDrop = (e: React.DragEvent, toColumnId: string) => {
    e.preventDefault()
    if (draggedCard) {
      moveCard(draggedCard.columnId, toColumnId, draggedCard.card)
    }
    setDraggedCard(null)
    setDropTargetColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedCard(null)
    setDropTargetColumn(null)
  }

  return (
    <div className="flex gap-4 p-4 overflow-x-auto min-h-[500px]" style={{ background: 'var(--bg-primary)' }}>
      {columns.map(column => (
        <div
          key={column.id}
          className={`flex-shrink-0 w-72 rounded-xl flex flex-col transition-colors ${
            dropTargetColumn === column.id ? 'ring-2 ring-blue-500' : ''
          }`}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{column.title}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}>
                {column.cards.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAddingCardTo(column.id)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <IconPlus />
              </button>
              <button
                onClick={() => deleteColumn(column.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <IconX />
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[400px]">
            {column.cards.map(card => (
              <div
                key={card.id}
                draggable
                onDragStart={() => handleDragStart(column.id, card)}
                onDragEnd={handleDragEnd}
                className={`p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
                  draggedCard?.card.id === card.id ? 'opacity-50' : ''
                }`}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
              >
                {/* Color indicator */}
                {card.color && (
                  <div className={`w-full h-1 rounded-full mb-2 ${colorClasses[card.color]}`} />
                )}
                
                {editingCard?.card.id === card.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingCard.card.title}
                      onChange={(e) => setEditingCard({ ...editingCard, card: { ...editingCard.card, title: e.target.value } })}
                      className="w-full px-2 py-1 rounded text-sm bg-transparent outline-none"
                      style={{ border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                      autoFocus
                    />
                    <textarea
                      value={editingCard.card.description || ''}
                      onChange={(e) => setEditingCard({ ...editingCard, card: { ...editingCard.card, description: e.target.value } })}
                      placeholder="Add description..."
                      className="w-full px-2 py-1 rounded text-sm bg-transparent outline-none resize-none"
                      style={{ border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateCard(column.id, card.id, editingCard.card)
                          setEditingCard(null)
                        }}
                        className="flex-1 py-1 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCard(null)}
                        className="flex-1 py-1 rounded text-sm hover:bg-white/10 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{card.title}</p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingCard({ columnId: column.id, card })}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <IconMoreVertical />
                        </button>
                        <button
                          onClick={() => deleteCard(column.id, card.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <IconX />
                        </button>
                      </div>
                    </div>
                    {card.description && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{card.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Card Form */}
            {addingCardTo === column.id && (
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
                <input
                  type="text"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addCard(column.id)
                    if (e.key === 'Escape') setAddingCardTo(null)
                  }}
                  placeholder="Card title..."
                  className="w-full px-2 py-1 rounded text-sm bg-transparent outline-none mb-2"
                  style={{ border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                  autoFocus
                />
                <div className="flex items-center gap-2 mb-2">
                  {Object.keys(colorClasses).map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCardColor(color as Card['color'])}
                      className={`w-5 h-5 rounded-full ${colorClasses[color]} ${newCardColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addCard(column.id)}
                    disabled={!newCardTitle.trim()}
                    className="flex-1 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors"
                  >
                    Add Card
                  </button>
                  <button
                    onClick={() => setAddingCardTo(null)}
                    className="px-3 py-1.5 rounded text-sm hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Card Button (when not adding) */}
          {addingCardTo !== column.id && (
            <button
              onClick={() => setAddingCardTo(column.id)}
              className="m-2 p-2 rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <IconPlus /> Add a card
            </button>
          )}
        </div>
      ))}

      {/* Add Column */}
      {allowAddColumn && (
        <div className="flex-shrink-0 w-72">
          {addingColumn ? (
            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addColumn()
                  if (e.key === 'Escape') setAddingColumn(false)
                }}
                placeholder="Column title..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-2"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={addColumn}
                  disabled={!newColumnTitle.trim()}
                  className="flex-1 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors"
                >
                  Add Column
                </button>
                <button
                  onClick={() => setAddingColumn(false)}
                  className="px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className="w-full p-4 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-white/5 transition-colors"
              style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border-primary)', color: 'var(--text-tertiary)' }}
            >
              <IconPlus /> Add Column
            </button>
          )}
        </div>
      )}
    </div>
  )
}
