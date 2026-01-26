/**
 * CalendarView - Pre-built Calendar Component
 * 
 * Features:
 * - Month view with navigation
 * - Events on dates
 * - Add/edit/delete events
 * - Event colors
 * - Today highlight
 * 
 * Customization via props:
 * - events: Events array
 * - onEventsChange: Callback when events change
 * - onDateSelect: Callback when date is clicked
 */

import { useState, useMemo } from 'react'

// ============================================
// TYPES
// ============================================

interface CalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
  time?: string
  description?: string
}

interface CalendarViewProps {
  events?: CalendarEvent[]
  onEventsChange?: (events: CalendarEvent[]) => void
  onDateSelect?: (date: Date) => void
}

// ============================================
// ICONS
// ============================================

const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

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

// ============================================
// CONSTANTS
// ============================================

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const colorClasses: Record<string, { bg: string; text: string }> = {
  red: { bg: 'bg-red-500/20', text: 'text-red-400' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  pink: { bg: 'bg-pink-500/20', text: 'text-pink-400' }
}

// ============================================
// COMPONENT
// ============================================

export default function CalendarView({
  events: initialEvents = [],
  onEventsChange,
  onDateSelect
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', time: '', color: 'blue' as CalendarEvent['color'] })
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const updateEvents = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents)
    onEventsChange?.(newEvents)
  }

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const days: (Date | null)[] = []
    
    // Previous month padding
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    // Fill to complete the last row
    while (days.length % 7 !== 0) {
      days.push(null)
    }
    
    return days
  }, [currentDate])

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateKey = formatDateKey(date)
    return events.filter(e => e.date === dateKey)
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date): boolean => {
    return selectedDate === formatDateKey(date)
  }

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1))
  }

  const handleDateClick = (date: Date) => {
    const dateKey = formatDateKey(date)
    setSelectedDate(dateKey)
    setShowEventForm(false)
    setEditingEvent(null)
    onDateSelect?.(date)
  }

  const addEvent = () => {
    if (!newEvent.title.trim() || !selectedDate) return
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title: newEvent.title.trim(),
      date: selectedDate,
      time: newEvent.time || undefined,
      color: newEvent.color
    }
    updateEvents([...events, event])
    setNewEvent({ title: '', time: '', color: 'blue' })
    setShowEventForm(false)
  }

  const updateEvent = () => {
    if (!editingEvent || !editingEvent.title.trim()) return
    updateEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e))
    setEditingEvent(null)
  }

  const deleteEvent = (eventId: string) => {
    updateEvents(events.filter(e => e.id !== eventId))
  }

  const selectedDateEvents = selectedDate 
    ? events.filter(e => e.date === selectedDate)
    : []

  return (
    <div className="flex gap-4">
      {/* Calendar Grid */}
      <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Today
            </button>
            <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <IconChevronLeft />
            </button>
            <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <IconChevronRight />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          {DAYS.map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => {
            if (!date) {
              return <div key={i} className="p-2 min-h-[100px]" style={{ background: 'var(--bg-primary)' }} />
            }
            const dayEvents = getEventsForDate(date)
            return (
              <div
                key={i}
                onClick={() => handleDateClick(date)}
                className={`p-2 min-h-[100px] cursor-pointer transition-colors hover:bg-white/5 ${
                  isSelected(date) ? 'bg-blue-600/20' : ''
                }`}
                style={{ borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border-primary)' : undefined, borderBottom: '1px solid var(--border-primary)' }}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1 ${
                  isToday(date) ? 'bg-blue-600 text-white' : ''
                }`} style={{ color: isToday(date) ? undefined : 'var(--text-primary)' }}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => {
                    const colors = colorClasses[event.color || 'blue']
                    return (
                      <div
                        key={event.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate ${colors.bg} ${colors.text}`}
                      >
                        {event.time && <span className="opacity-70">{event.time} </span>}
                        {event.title}
                      </div>
                    )
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-xs px-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sidebar - Selected Date Events */}
      <div className="w-80 rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
            </h3>
            {selectedDate && (
              <button
                onClick={() => setShowEventForm(true)}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                <IconPlus />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {/* Add Event Form */}
          {showEventForm && selectedDate && (
            <div className="p-3 rounded-lg space-y-2" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                autoFocus
              />
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              />
              <div className="flex items-center gap-2">
                {Object.keys(colorClasses).map(color => (
                  <button
                    key={color}
                    onClick={() => setNewEvent({ ...newEvent, color: color as CalendarEvent['color'] })}
                    className={`w-5 h-5 rounded-full ${color === 'red' ? 'bg-red-500' : color === 'orange' ? 'bg-orange-500' : color === 'yellow' ? 'bg-yellow-500' : color === 'green' ? 'bg-green-500' : color === 'blue' ? 'bg-blue-500' : color === 'purple' ? 'bg-purple-500' : 'bg-pink-500'} ${newEvent.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={addEvent} disabled={!newEvent.title.trim()} className="flex-1 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors">
                  Add Event
                </button>
                <button onClick={() => setShowEventForm(false)} className="px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Events List */}
          {selectedDateEvents.length === 0 && !showEventForm ? (
            <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
              {selectedDate ? 'No events for this day' : 'Click a date to view events'}
            </div>
          ) : (
            selectedDateEvents.map(event => {
              const colors = colorClasses[event.color || 'blue']
              const isEditing = editingEvent?.id === event.id
              
              return (
                <div key={event.id} className={`p-3 rounded-lg ${colors.bg}`} style={{ border: '1px solid var(--border-primary)' }}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                        className="w-full px-2 py-1 rounded text-sm bg-transparent outline-none"
                        style={{ border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                      />
                      <input
                        type="time"
                        value={editingEvent.time || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                        className="w-full px-2 py-1 rounded text-sm bg-transparent outline-none"
                        style={{ border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                      />
                      <div className="flex gap-2">
                        <button onClick={updateEvent} className="flex-1 py-1 rounded text-sm bg-blue-600 text-white">Save</button>
                        <button onClick={() => setEditingEvent(null)} className="flex-1 py-1 rounded text-sm" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${colors.text}`}>{event.title}</p>
                        {event.time && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{event.time}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingEvent(event)} className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteEvent(event.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors">
                          <IconX />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
