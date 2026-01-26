/**
 * TodoList - Pre-built Todo/Task List Component
 * 
 * Features:
 * - Add/edit/delete todos
 * - Mark complete/incomplete
 * - Priority levels
 * - Due dates
 * - Filter by status
 * 
 * Customization via props:
 * - todos: Initial todos array
 * - onTodosChange: Callback when todos change
 * - showPriority: Show priority selector
 * - showDueDate: Show due date picker
 */

import { useState, useMemo } from 'react'

// ============================================
// TYPES
// ============================================

interface Todo {
  id: string
  text: string
  completed: boolean
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
}

interface TodoListProps {
  todos?: Todo[]
  onTodosChange?: (todos: Todo[]) => void
  showPriority?: boolean
  showDueDate?: boolean
  placeholder?: string
}

type FilterType = 'all' | 'active' | 'completed'

// ============================================
// ICONS
// ============================================

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconFlag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
)

// ============================================
// COMPONENT
// ============================================

export default function TodoList({
  todos: initialTodos = [],
  onTodosChange,
  showPriority = true,
  showDueDate = true,
  placeholder = 'Add a new task...'
}: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoPriority, setNewTodoPriority] = useState<Todo['priority']>('medium')
  const [newTodoDueDate, setNewTodoDueDate] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const updateTodos = (newTodos: Todo[]) => {
    setTodos(newTodos)
    onTodosChange?.(newTodos)
  }

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active': return todos.filter(t => !t.completed)
      case 'completed': return todos.filter(t => t.completed)
      default: return todos
    }
  }, [todos, filter])

  const sortedTodos = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return [...filteredTodos].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      const aPri = priorityOrder[a.priority || 'medium']
      const bPri = priorityOrder[b.priority || 'medium']
      if (aPri !== bPri) return aPri - bPri
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })
  }, [filteredTodos])

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  const addTodo = () => {
    if (!newTodoText.trim()) return
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: newTodoText.trim(),
      completed: false,
      priority: showPriority ? newTodoPriority : undefined,
      dueDate: showDueDate && newTodoDueDate ? newTodoDueDate : undefined,
      createdAt: new Date().toISOString()
    }
    updateTodos([newTodo, ...todos])
    setNewTodoText('')
    setNewTodoDueDate('')
  }

  const toggleTodo = (id: string) => {
    updateTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTodo = (id: string) => {
    updateTodos(todos.filter(t => t.id !== id))
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  const saveEdit = (id: string) => {
    if (!editText.trim()) {
      deleteTodo(id)
    } else {
      updateTodos(todos.map(t => t.id === id ? { ...t, text: editText.trim() } : t))
    }
    setEditingId(null)
    setEditText('')
  }

  const clearCompleted = () => updateTodos(todos.filter(t => !t.completed))

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Tasks</h2>
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder={placeholder}
              className="flex-1 px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            />
            {showPriority && (
              <select
                value={newTodoPriority}
                onChange={(e) => setNewTodoPriority(e.target.value as Todo['priority'])}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            )}
            {showDueDate && (
              <input
                type="date"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              />
            )}
          </div>
          <button onClick={addTodo} disabled={!newTodoText.trim()} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <IconPlus />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-4 py-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        {(['all', 'active', 'completed'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}
            style={{ color: filter === f ? undefined : 'var(--text-secondary)' }}
          >
            {f} {f === 'all' && `(${todos.length})`} {f === 'active' && `(${activeCount})`} {f === 'completed' && `(${completedCount})`}
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div className="max-h-96 overflow-auto">
        {sortedTodos.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
            {filter === 'all' ? 'No tasks yet. Add one above!' : `No ${filter} tasks`}
          </div>
        ) : (
          <ul>
            {sortedTodos.map(todo => (
              <li key={todo.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${todo.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-500 hover:border-blue-500'}`}
                >
                  {todo.completed && <IconCheck />}
                </button>
                <div className="flex-1 min-w-0">
                  {editingId === todo.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(todo.id); if (e.key === 'Escape') setEditingId(null) }}
                      onBlur={() => saveEdit(todo.id)}
                      className="w-full bg-transparent outline-none"
                      style={{ color: 'var(--text-primary)' }}
                      autoFocus
                    />
                  ) : (
                    <span onDoubleClick={() => startEdit(todo)} className={`block truncate ${todo.completed ? 'line-through' : ''}`} style={{ color: todo.completed ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                      {todo.text}
                    </span>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {showPriority && todo.priority && (
                      <span className={`flex items-center gap-1 text-xs ${getPriorityColor(todo.priority)}`}>
                        <IconFlag /> {todo.priority}
                      </span>
                    )}
                    {showDueDate && todo.dueDate && (
                      <span className={`flex items-center gap-1 text-xs ${isOverdue(todo.dueDate) && !todo.completed ? 'text-red-400' : ''}`} style={{ color: isOverdue(todo.dueDate) && !todo.completed ? undefined : 'var(--text-tertiary)' }}>
                        <IconCalendar /> {formatDueDate(todo.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteTodo(todo.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all">
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {completedCount > 0 && (
        <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{completedCount} completed</span>
          <button onClick={clearCompleted} className="text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>Clear completed</button>
        </div>
      )}
    </div>
  )
}
