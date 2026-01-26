# AlertBanner Component

A full-width alert banner for important messages, typically displayed at the top of the page.

## Features

- Multiple types (info, success, warning, error)
- Dismissible with X button
- Optional action button
- Optional icon
- Sticky positioning option
- Animated entrance/exit
- Link support

## Props

```typescript
interface AlertBannerProps {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  title?: string
  dismissible?: boolean  // Default: true
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  link?: {
    label: string
    href: string
  }
  icon?: boolean  // Show type icon (default: true)
  sticky?: boolean  // Stick to top (default: false)
  className?: string
}
```

## Implementation

```tsx
import { useState, useEffect, useRef } from 'react'

interface AlertBannerProps {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  link?: {
    label: string
    href: string
  }
  icon?: boolean
  sticky?: boolean
  className?: string
}

// Type styles (constant, outside component)
const TYPE_STYLES = {
  info: {
    bg: 'bg-blue-600',
    hoverBg: 'hover:bg-blue-700',
    text: 'text-white',
    focusRing: 'focus-visible:ring-blue-300'
  },
  success: {
    bg: 'bg-green-600',
    hoverBg: 'hover:bg-green-700',
    text: 'text-white',
    focusRing: 'focus-visible:ring-green-300'
  },
  warning: {
    bg: 'bg-yellow-500',
    hoverBg: 'hover:bg-yellow-600',
    text: 'text-white',
    focusRing: 'focus-visible:ring-yellow-300'
  },
  error: {
    bg: 'bg-red-600',
    hoverBg: 'hover:bg-red-700',
    text: 'text-white',
    focusRing: 'focus-visible:ring-red-300'
  }
} as const

// Icons (constant, outside component)
const TYPE_ICONS = {
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function AlertBanner({
  type,
  message,
  title,
  dismissible = true,
  onDismiss,
  action,
  link,
  icon = true,
  sticky = false,
  className = ''
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current)
      }
    }
  }, [])

  const handleDismiss = () => {
    if (isExiting) return // Prevent double-dismiss
    setIsExiting(true)
    dismissTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, 200)
  }

  if (!isVisible) return null

  const styles = TYPE_STYLES[type]

  return (
    <div
      role="alert"
      className={`
        ${styles.bg} ${styles.text}
        ${sticky ? 'sticky top-0 z-50' : ''}
        transition-all duration-200 ease-out
        ${isExiting ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icon */}
            {icon && (
              <div className="flex-shrink-0">
                {TYPE_ICONS[type]}
              </div>
            )}

            {/* Text */}
            <div className="flex-1 min-w-0">
              {title && (
                <span className="font-semibold mr-2">{title}</span>
              )}
              <span className={title ? 'font-normal' : ''}>{message}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Action Button */}
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md
                  bg-white/20 ${styles.hoverBg} backdrop-blur-sm
                  transition-colors focus:outline-none focus-visible:ring-2 ${styles.focusRing}
                `}
              >
                {action.label}
              </button>
            )}

            {/* Link */}
            {link && (
              <a
                href={link.href}
                className={`text-sm font-medium underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 ${styles.focusRing} rounded`}
              >
                {link.label}
              </a>
            )}

            {/* Dismiss Button */}
            {dismissible && (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss alert"
                className={`p-1.5 rounded-md hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 ${styles.focusRing}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

## Usage Examples

### Basic Alert

```tsx
<AlertBanner
  type="info"
  message="We're performing scheduled maintenance tonight at 11pm EST."
/>
```

### With Title

```tsx
<AlertBanner
  type="warning"
  title="Notice:"
  message="Your subscription expires in 3 days."
/>
```

### With Action Button

```tsx
<AlertBanner
  type="success"
  message="New version available!"
  action={{
    label: 'Update Now',
    onClick: () => updateApp()
  }}
/>
```

### With Link

```tsx
<AlertBanner
  type="error"
  message="Your payment failed. Please update your billing information."
  link={{
    label: 'Update billing',
    href: '/settings/billing'
  }}
/>
```

### Sticky Banner

```tsx
<AlertBanner
  type="warning"
  message="You're viewing an archived version of this document."
  sticky={true}
  dismissible={false}
/>
```

### Non-Dismissible

```tsx
<AlertBanner
  type="error"
  title="Action Required:"
  message="Please verify your email address to continue."
  dismissible={false}
  action={{
    label: 'Resend Email',
    onClick: () => resendVerification()
  }}
/>
```

### Custom Controlled State

```tsx
function App() {
  const [showBanner, setShowBanner] = useState(true)

  if (!showBanner) return null

  return (
    <AlertBanner
      type="info"
      message="Welcome! Here's a quick tour."
      action={{
        label: 'Start Tour',
        onClick: () => startTour()
      }}
      onDismiss={() => {
        setShowBanner(false)
        localStorage.setItem('tourDismissed', 'true')
      }}
    />
  )
}
```

## Banner Types

| Type | Color | Use Case |
|------|-------|----------|
| `info` | Blue | General announcements, tips |
| `success` | Green | Completed actions, positive news |
| `warning` | Yellow | Caution, expiring items, maintenance |
| `error` | Red | Critical issues, required actions |

## Accessibility

- Container has `role="alert"` for screen reader announcements
- `role="alert"` for screen reader announcements (implicitly assertive)
- Dismiss button has `aria-label="Dismiss alert"`
- High contrast colors meet WCAG standards
- Focus visible on interactive elements

## Customization Points

| Aspect | How to customize |
|--------|------------------|
| Colors | Modify typeStyles object |
| Max width | Change `max-w-7xl` class |
| Padding | Adjust `px-4 py-3` values |
| Animation | Modify transition classes |
| Icon | Replace SVGs in typeStyles |
| Position | Use `sticky` prop or add custom positioning |

## Multiple Banners

Stack multiple banners by rendering them in sequence:

```tsx
<div className="flex flex-col">
  {banners.map(banner => (
    <AlertBanner
      key={banner.id}
      type={banner.type}
      message={banner.message}
      onDismiss={() => removeBanner(banner.id)}
    />
  ))}
</div>
```
