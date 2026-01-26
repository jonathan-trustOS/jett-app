# SnackBar Component

A bottom-positioned notification bar with optional action button, commonly used for undo operations and brief feedback.

## Features

- Bottom-positioned overlay
- Auto-dismiss with configurable duration
- Optional action button (undo, retry, etc.)
- Queue system for multiple snackbars
- Pause on hover
- Swipe to dismiss (touch)
- Animated entrance/exit
- Multiple position options

## Props

```typescript
interface SnackBarProviderProps {
  children: React.ReactNode
  position?: 'bottom-center' | 'bottom-left' | 'bottom-right'
  maxSnackbars?: number  // Default: 1 (queues the rest)
}

interface SnackBarOptions {
  message: string
  duration?: number  // ms, default: 4000, 0 = no auto-dismiss
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

// Hook return type
interface UseSnackBar {
  show: (options: SnackBarOptions | string) => string  // Returns ID
  close: (id: string) => void
  closeAll: () => void
}
```

## Implementation

```tsx
import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react'

// Types
interface SnackBarItem {
  id: string
  message: string
  duration: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

interface SnackBarContextType {
  show: (options: SnackBarOptions | string) => string
  close: (id: string) => void
  closeAll: () => void
}

interface SnackBarOptions {
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

type Position = 'bottom-center' | 'bottom-left' | 'bottom-right'

// Context
const SnackBarContext = createContext<SnackBarContextType | null>(null)

// Generate unique ID
const generateId = () => `snackbar-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

// Position classes (constant, outside component)
const POSITION_CLASSES: Record<Position, string> = {
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  'bottom-left': 'bottom-6 left-6',
  'bottom-right': 'bottom-6 right-6'
}

// Provider Component
interface SnackBarProviderProps {
  children: React.ReactNode
  position?: Position
  maxSnackbars?: number
}

export function SnackBarProvider({
  children,
  position = 'bottom-center',
  maxSnackbars = 1
}: SnackBarProviderProps) {
  const [queue, setQueue] = useState<SnackBarItem[]>([])
  const [visible, setVisible] = useState<SnackBarItem[]>([])
  
  // Use ref to avoid stale closure in show callback
  const visibleRef = useRef(visible)
  visibleRef.current = visible

  // Process queue when visible slots open up
  useEffect(() => {
    if (queue.length > 0 && visible.length < maxSnackbars) {
      const [next, ...rest] = queue
      setQueue(rest)
      setVisible(prev => [...prev, next])
    }
  }, [queue, visible.length, maxSnackbars])

  const show = useCallback((options: SnackBarOptions | string): string => {
    const id = generateId()
    const item: SnackBarItem = typeof options === 'string'
      ? { id, message: options, duration: 4000 }
      : { id, message: options.message, duration: options.duration ?? 4000, action: options.action, onClose: options.onClose }

    // Use ref to get current visible length to avoid stale closure
    if (visibleRef.current.length < maxSnackbars) {
      setVisible(prev => [...prev, item])
    } else {
      setQueue(prev => [...prev, item])
    }

    return id
  }, [maxSnackbars])

  const close = useCallback((id: string) => {
    setVisible(prev => {
      const item = prev.find(s => s.id === id)
      if (item?.onClose) item.onClose()
      return prev.filter(s => s.id !== id)
    })
    setQueue(prev => prev.filter(s => s.id !== id))
  }, [])

  const closeAll = useCallback(() => {
    setVisible(prev => {
      prev.forEach(item => item.onClose?.())
      return []
    })
    setQueue([])
  }, [])

  // Memoize context value
  const contextValue = useMemo(() => ({
    show,
    close,
    closeAll
  }), [show, close, closeAll])

  return (
    <SnackBarContext.Provider value={contextValue}>
      {children}

      {/* SnackBar Container */}
      <div
        className={`fixed z-50 flex flex-col gap-2 ${POSITION_CLASSES[position]}`}
        role="region"
        aria-label="Notifications"
      >
        {visible.map(snackbar => (
          <SnackBarItem
            key={snackbar.id}
            snackbar={snackbar}
            onClose={() => close(snackbar.id)}
          />
        ))}
      </div>
    </SnackBarContext.Provider>
  )
}

// Individual SnackBar Component
interface SnackBarItemProps {
  snackbar: SnackBarItem
  onClose: () => void
}

function SnackBarItem({ snackbar, onClose }: SnackBarItemProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const remainingRef = useRef(snackbar.duration)
  const startTimeRef = useRef(Date.now())
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Touch swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [translateY, setTranslateY] = useState(0)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const handleClose = useCallback(() => {
    if (isExiting) return // Prevent double-close
    setIsExiting(true)
    closeTimeoutRef.current = setTimeout(onClose, 200)
  }, [onClose, isExiting])

  // Auto-dismiss timer
  useEffect(() => {
    if (snackbar.duration === 0) return

    const tick = () => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current
        remainingRef.current = snackbar.duration - elapsed

        if (remainingRef.current <= 0) {
          handleClose()
        }
      }
    }

    const interval = setInterval(tick, 100)
    return () => clearInterval(interval)
  }, [snackbar.duration, isPaused, handleClose])

  // Pause/Resume handlers
  const handleMouseEnter = () => {
    if (snackbar.duration === 0) return
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    if (snackbar.duration === 0) return
    startTimeRef.current = Date.now() - (snackbar.duration - remainingRef.current)
    setIsPaused(false)
  }

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = e.touches[0].clientY - touchStart
    if (diff > 0) {
      setTranslateY(diff)
    }
  }

  const handleTouchEnd = () => {
    if (translateY > 50) {
      handleClose()
    } else {
      setTranslateY(0)
    }
    setTouchStart(null)
  }

  const handleActionClick = () => {
    snackbar.action?.onClick()
    handleClose()
  }

  return (
    <div
      role="status"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`
        flex items-center gap-4 min-w-[300px] max-w-md px-4 py-3
        bg-gray-900 text-white rounded-lg shadow-lg
        transition-all duration-200 ease-out
        ${isExiting ? 'opacity-0' : 'opacity-100'}
      `}
      style={{ 
        transform: isExiting 
          ? 'translateY(1rem)' 
          : translateY > 0 
            ? `translateY(${translateY}px)` 
            : 'translateY(0)'
      }}
    >
      {/* Message */}
      <p className="flex-1 text-sm">{snackbar.message}</p>

      {/* Action Button */}
      {snackbar.action && (
        <button
          type="button"
          onClick={handleActionClick}
          className="flex-shrink-0 text-sm font-medium text-blue-400 hover:text-blue-300 uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
        >
          {snackbar.action.label}
        </button>
      )}

      {/* Close Button (optional, shown when no action) */}
      {!snackbar.action && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Dismiss"
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Hook
export function useSnackBar(): SnackBarContextType {
  const context = useContext(SnackBarContext)

  if (!context) {
    throw new Error('useSnackBar must be used within a SnackBarProvider')
  }

  return context
}
```

## Usage Examples

### Setup Provider

```tsx
// App.tsx or layout
import { SnackBarProvider } from './SnackBar'

function App() {
  return (
    <SnackBarProvider position="bottom-center">
      <YourApp />
    </SnackBarProvider>
  )
}
```

### Simple Message

```tsx
import { useSnackBar } from './SnackBar'

function SaveButton() {
  const { show } = useSnackBar()

  const handleSave = async () => {
    await saveData()
    show('Changes saved')
  }

  return <button onClick={handleSave}>Save</button>
}
```

### With Undo Action

```tsx
const { show } = useSnackBar()

const handleDelete = (item) => {
  const backup = { ...item }
  deleteItem(item.id)

  show({
    message: `"${item.name}" deleted`,
    duration: 6000,
    action: {
      label: 'Undo',
      onClick: () => restoreItem(backup)
    }
  })
}
```

### With Close Callback

```tsx
const { show } = useSnackBar()

show({
  message: 'Uploading file...',
  duration: 0,  // Don't auto-dismiss
  onClose: () => {
    console.log('Snackbar closed')
  }
})
```

### Programmatic Close

```tsx
const { show, close } = useSnackBar()

// Show persistent snackbar
const id = show({
  message: 'Processing...',
  duration: 0
})

// Later, close it
await processComplete()
close(id)
show('Processing complete!')
```

### Multiple Snackbars (Queued)

```tsx
// With maxSnackbars={1} (default), these queue up
const { show } = useSnackBar()

show('First message')   // Shows immediately
show('Second message')  // Queued, shows after first closes
show('Third message')   // Queued, shows after second closes
```

### Allow Multiple Visible

```tsx
// In provider setup
<SnackBarProvider position="bottom-right" maxSnackbars={3}>
  <App />
</SnackBarProvider>

// Now up to 3 can show at once
```

## Position Options

| Position | Description |
|----------|-------------|
| `bottom-center` | Centered at bottom (default) |
| `bottom-left` | Bottom left corner |
| `bottom-right` | Bottom right corner |

## Interaction Behaviors

| Interaction | Behavior |
|-------------|----------|
| Hover | Pauses auto-dismiss timer |
| Mouse leave | Resumes timer from remaining time |
| Swipe down (touch) | Dismisses if swiped > 50px |
| Action click | Executes action and dismisses |
| X click | Dismisses (when no action) |

## Accessibility

- Container has `role="region"` and `aria-label`
- Individual snackbars have `role="status"` and `aria-live="polite"`
- Action buttons are focusable
- Dismiss button has `aria-label`
- High contrast colors

## Customization Points

| Aspect | How to customize |
|--------|------------------|
| Colors | Change `bg-gray-900`, `text-blue-400` |
| Width | Modify `min-w-[300px] max-w-md` |
| Position offset | Adjust `bottom-6`, `left-6`, etc. |
| Animation | Modify transition classes |
| Swipe threshold | Change `> 50` in handleTouchEnd |
| Queue behavior | Adjust `maxSnackbars` prop |

## Comparison: Toast vs SnackBar

| Feature | Toast | SnackBar |
|---------|-------|----------|
| Position | Corners, top/bottom | Bottom only |
| Multiple | Stacks visibly | Queues (1 visible default) |
| Types | Success/error/warning/info | Single style |
| Progress | Shows time remaining | No progress |
| Best for | Status messages | Actions with undo |
| Duration | Varies by type | Fixed (4s default) |
