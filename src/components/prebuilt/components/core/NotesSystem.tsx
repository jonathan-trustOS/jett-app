/**
 * NotesSystem - Pre-built Notes/Notebook Component
 * 
 * Features:
 * - Create, edit, delete notes
 * - Search and filter
 * - Categories/folders
 * - Rich text (basic markdown)
 * - Auto-save
 * - Timestamps
 * 
 * Customization via props:
 * - notes: Initial notes array
 * - onNotesChange: Callback when notes change
 * - categories: Optional category list
 * - autoSave: Enable auto-save on blur
 */

import { useState, useEffect, useMemo } from 'react'

// ============================================
// TYPES
// ============================================

interface Note {
  id: string
  title: string
  content: string
  category?: string
  createdAt: string
  updatedAt: string
  pinned?: boolean
}

interface NotesSystemProps {
  notes?: Note[]
  onNotesChange?: (notes: Note[]) => void
  categories?: string[]
  autoSave?: boolean
}

// ============================================
// ICONS
// ============================================

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconPin = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.76z" />
  </svg>
)

const IconFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

// ============================================
// COMPONENT
// ============================================

export default function NotesSystem({
  notes: initialNotes = [],
  onNotesChange,
  categories = ['Personal', 'Work', 'Ideas'],
  autoSave = true
}: NotesSystemProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Edit state
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState<string | undefined>()

  // Notify parent of changes
  useEffect(() => {
    if (onNotesChange) {
      onNotesChange(notes)
    }
  }, [notes, onNotesChange])

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = [...notes]
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        note => 
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      )
    }
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(note => note.category === selectedCategory)
    }
    
    // Sort: pinned first, then by updated date
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
    
    return result
  }, [notes, searchQuery, selectedCategory])

  const createNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      category: selectedCategory || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false
    }
    
    setNotes([newNote, ...notes])
    setSelectedNote(newNote)
    setIsEditing(true)
    setEditTitle(newNote.title)
    setEditContent(newNote.content)
    setEditCategory(newNote.category)
  }

  const selectNote = (note: Note) => {
    if (isEditing && selectedNote) {
      saveNote()
    }
    setSelectedNote(note)
    setIsEditing(false)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditCategory(note.category)
  }

  const startEditing = () => {
    if (selectedNote) {
      setIsEditing(true)
      setEditTitle(selectedNote.title)
      setEditContent(selectedNote.content)
      setEditCategory(selectedNote.category)
    }
  }

  const saveNote = () => {
    if (!selectedNote) return
    
    const updatedNote: Note = {
      ...selectedNote,
      title: editTitle.trim() || 'Untitled Note',
      content: editContent,
      category: editCategory,
      updatedAt: new Date().toISOString()
    }
    
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n))
    setSelectedNote(updatedNote)
    setIsEditing(false)
  }

  const deleteNote = (noteId: string) => {
    if (!confirm('Delete this note?')) return
    
    setNotes(notes.filter(n => n.id !== noteId))
    if (selectedNote?.id === noteId) {
      setSelectedNote(null)
      setIsEditing(false)
    }
  }

  const togglePin = (noteId: string) => {
    setNotes(notes.map(n => 
      n.id === noteId ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
    ))
    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, pinned: !selectedNote.pinned })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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
    
    return date.toLocaleDateString()
  }

  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text
    return text.slice(0, length).trim() + '...'
  }

  return (
    <div 
      className="flex h-[600px] rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
    >
      {/* Sidebar - Notes List */}
      <div 
        className="w-72 flex flex-col"
        style={{ borderRight: '1px solid var(--border-primary)' }}
      >
        {/* Search & New */}
        <div className="p-3 space-y-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="relative">
            <IconSearch />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{ 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
              <IconSearch />
            </div>
          </div>
          
          <button
            onClick={createNote}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <IconPlus />
            New Note
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-3 py-2 flex gap-1 flex-wrap" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              !selectedCategory ? 'bg-blue-600 text-white' : 'hover:bg-white/5'
            }`}
            style={{ color: selectedCategory ? 'var(--text-secondary)' : undefined }}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedCategory === cat ? 'bg-blue-600 text-white' : 'hover:bg-white/5'
              }`}
              style={{ color: selectedCategory === cat ? undefined : 'var(--text-secondary)' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
              <p className="text-sm">No notes yet</p>
              <p className="text-xs mt-1">Click "New Note" to get started</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedNote?.id === note.id ? 'bg-blue-600/20' : 'hover:bg-white/5'
                }`}
                style={{ borderBottom: '1px solid var(--border-primary)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {note.pinned && (
                        <span className="text-yellow-500">
                          <IconPin filled />
                        </span>
                      )}
                      <h3 
                        className="font-medium text-sm truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {note.title}
                      </h3>
                    </div>
                    <p 
                      className="text-xs mt-1 line-clamp-2"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {truncate(note.content || 'No content', 60)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {note.category && (
                        <span 
                          className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                        >
                          <IconFolder />
                          {note.category}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content - Note Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <div 
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-primary)' }}
            >
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <select
                    value={editCategory || ''}
                    onChange={(e) => setEditCategory(e.target.value || undefined)}
                    className="px-2 py-1 rounded text-sm outline-none"
                    style={{ 
                      background: 'var(--bg-primary)', 
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">No category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  selectedNote.category && (
                    <span 
                      className="flex items-center gap-1 text-sm px-2 py-1 rounded"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                    >
                      <IconFolder />
                      {selectedNote.category}
                    </span>
                  )
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePin(selectedNote.id)}
                  className={`p-2 rounded-lg transition-colors hover:bg-white/5 ${
                    selectedNote.pinned ? 'text-yellow-500' : ''
                  }`}
                  style={{ color: selectedNote.pinned ? undefined : 'var(--text-secondary)' }}
                  title={selectedNote.pinned ? 'Unpin' : 'Pin'}
                >
                  <IconPin filled={selectedNote.pinned} />
                </button>
                <button
                  onClick={() => deleteNote(selectedNote.id)}
                  className="p-2 rounded-lg transition-colors hover:bg-red-500/10 text-red-400"
                  title="Delete"
                >
                  <IconTrash />
                </button>
                {isEditing ? (
                  <button
                    onClick={saveNote}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={startEditing}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                    style={{ border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 p-4 overflow-auto">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full text-2xl font-bold bg-transparent outline-none"
                    style={{ color: 'var(--text-primary)' }}
                    autoFocus
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={() => autoSave && saveNote()}
                    placeholder="Start writing..."
                    className="w-full h-[400px] bg-transparent outline-none resize-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
              ) : (
                <div>
                  <h1 
                    className="text-2xl font-bold mb-4"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {selectedNote.title}
                  </h1>
                  <div 
                    className="whitespace-pre-wrap"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {selectedNote.content || 'No content'}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              className="px-4 py-2 text-xs"
              style={{ borderTop: '1px solid var(--border-primary)', color: 'var(--text-tertiary)' }}
            >
              Last updated {formatDate(selectedNote.updatedAt)}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: 'var(--text-tertiary)' }}>
              <p>Select a note or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
