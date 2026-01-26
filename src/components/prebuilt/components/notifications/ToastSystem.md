# ToastSystem Component

A stackable toast notification system with auto-dismiss, multiple types, and smooth animations.

## Features

- Multiple toast types (success, error, warning, info)
- Auto-dismiss with configurable duration
- Pause timer on hover
- Stackable with position options
- Progress bar showing time remaining
- Manual dismiss with X button
- Action button support
- Accessible with ARIA live regions

## Props

```typescript
interface ToastProviderProps {
  children: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxToasts?: number  // Max visible at once (default: 5)
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number  // ms, 0 = no auto-dismiss (default: 5000)
  action?: {
    label: string
    onClick: () => void
  }
}

// Hook return type
interface UseToast {
  toast: (options: Omit<Toast, 'id'>) => string  // Returns toast id
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}
```

## Implementation

```tsx
import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react'

// Types
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration: number
  action?: {
    label: string
    onClick: () => void
  }
  createdAt: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string
  removeToast: (id: string) => void
  removeAll: () => void
}

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

// Context
const ToastContext = createContext<ToastContextType | null>(null)

// Generate unique ID
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

// Position classes (constant, outside component)
const POSITION_CLASSES: Record<Position, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
}

// Type styles (constant, outside component)
const TYPE_STYLES = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    progressColor: 'bg-green-500'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    progressColor: 'bg-red-500'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    progressColor: 'bg-yellow-500'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    progressColor: 'bg-blue-500'
  }
} as const

// Provider Component
interface ToastProviderProps {
  children: React.ReactNode
  position?: Position
  maxToasts?: number
}

export function ToastProvider({ 
  children, 
  position = 'top-right',
  maxToasts = 5 
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'createdAt'>) => {
    const id = generateId()
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
      createdAt: Date.now()
    }
    
    setToasts(prev => {
      const updated = [newToast, ...prev]
      // Limit to maxToasts
      return updated.slice(0, maxToasts)
    })
    
    return id
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const removeAll = useCallback(() => {
    setToasts([])
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    removeAll
  }), [toasts, addToast, removeToast, removeAll])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div 
        className={`fixed z-50 flex flex-col gap-2 ${POSITION_CLASSES[position]}`}
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(toast => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Icon components (constant, outside component)
const ToastIcons = {
  success: (
    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Individual Toast Component
interface ToastItemProps {
  toast: Toast
  onDismiss: () => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(100)
  const startTimeRef = useRef<number>(Date.now())
  const remainingRef = useRef<number>(toast.duration)
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current)
      }
    }
  }, [])

  const handleDismiss = useCallback(() => {
    if (isExiting) return // Prevent double-dismiss
    setIsExiting(true)
    dismissTimeoutRef.current = setTimeout(onDismiss, 200)
  }, [onDismiss, isExiting])

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration === 0) return

    const tick = () => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current
        const remaining = Math.max(0, toast.duration - elapsed)
        remainingRef.current = remaining
        setProgress((remaining / toast.duration) * 100)

        if (remaining <= 0) {
          handleDismiss()
        }
      }
    }

    const interval = setInterval(tick, 50)
    return () => clearInterval(interval)
  }, [toast.duration, isPaused, handleDismiss])

  // Handle pause/resume
  const handleMouseEnter = () => {
    if (toast.duration === 0) return
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    if (toast.duration === 0) return
    // Adjust start time to account for paused duration
    startTimeRef.current = Date.now() - (toast.duration - remainingRef.current)
    setIsPaused(false)
  }

  const styles = TYPE_STYLES[toast.type]

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative w-80 ${styles.bg} border ${styles.border} rounded-lg shadow-lg overflow-hidden
        transform transition-all duration-200 ease-out
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {ToastIcons[toast.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
            )}
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick()
                  handleDismiss()
                }}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-black/5"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Time remaining"
        >
          <div
            className={`h-full ${styles.progressColor} opacity-50 transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Hook
export function useToast() {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const { addToast, removeToast, removeAll } = context

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    toast: (options: Omit<Toast, 'id' | 'createdAt'>) => addToast({ ...options, duration: options.duration ?? 5000 }),
    success: (title: string, message?: string) => addToast({ type: 'success', title, message, duration: 5000 }),
    error: (title: string, message?: string) => addToast({ type: 'error', title, message, duration: 7000 }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message, duration: 6000 }),
    info: (title: string, message?: string) => addToast({ type: 'info', title, message, duration: 5000 }),
    dismiss: removeToast,
    dismissAll: removeAll
  }), [addToast, removeToast, removeAll])
}
```

## Usage Example

### Setup Provider

```tsx
// App.tsx or layout
import { ToastProvider } from './ToastSystem'

function App() {
  return (
    <ToastProvider position="top-right" maxToasts={5}>
      <YourApp />
    </ToastProvider>
  )
}
```

### Using the Hook

```tsx
import { useToast } from './ToastSystem'

function SaveButton() {
  const { success, error } = useToast()

  const handleSave = async () => {
    try {
      await saveData()
      success('Saved!', 'Your changes have been saved.')
    } catch (e) {
      error('Save failed', 'Please try again.')
    }
  }

  return <button onClick={handleSave}>Save</button>
}
```

### With Action Button

```tsx
const { toast } = useToast()

const handleDelete = (item) => {
  deleteItem(item.id)
  
  toast({
    type: 'info',
    title: 'Item deleted',
    message: `"${item.name}" was removed`,
    duration: 8000,
    action: {
      label: 'Undo',
      onClick: () => restoreItem(item.id)
    }
  })
}
```

### Persistent Toast (No Auto-Dismiss)

```tsx
const { toast, dismiss } = useToast()

// Show persistent notification
const id = toast({
  type: 'warning',
  title: 'Unsaved changes',
  message: 'You have unsaved changes.',
  duration: 0  // Never auto-dismiss
})

// Later, dismiss manually
dismiss(id)
```

## Position Options

| Position | Description |
|----------|-------------|
| `top-right` | Top right corner (default) |
| `top-left` | Top left corner |
| `bottom-right` | Bottom right corner |
| `bottom-left` | Bottom left corner |
| `top-center` | Top center |
| `bottom-center` | Bottom center |

## Toast Types

| Type | Default Duration | Use Case |
|------|------------------|----------|
| `success` | 5000ms | Operation completed |
| `error` | 7000ms | Something went wrong |
| `warning` | 6000ms | Caution needed |
| `info` | 5000ms | General information |

## Accessibility

- Container has `aria-live="polite"` for screen reader announcements
- Container has `aria-live="polite"` for screen reader announcements
- Individual toasts don't need `role="alert"` since container handles announcements
- Dismiss button has `aria-label="Dismiss notification"`
- Focus management doesn't steal focus from user's current position
- Pause on hover allows users time to read

## Customization Points

| Aspect | How to customize |
|--------|------------------|
| Colors | Modify typeStyles object |
| Width | Change `w-80` class |
| Animation | Adjust transition classes |
| Icons | Replace SVGs in typeStyles |
| Progress bar | Modify bottom bar styles |
| Timing | Adjust default durations |
