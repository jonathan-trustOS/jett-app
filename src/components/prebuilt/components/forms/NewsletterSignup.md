# NewsletterSignup Component

A simple email capture form with inline validation and success state. Perfect for landing pages, footers, and sidebars.

## Features

- Single email input with submit button
- Inline or stacked layout options
- Real-time email validation
- Loading spinner during submission
- Success state with checkmark
- Error state with message
- Optional name field

## Props

```typescript
interface NewsletterSignupProps {
  onSubmit: (email: string, name?: string) => Promise<void>
  placeholder?: string
  buttonText?: string
  successMessage?: string
  layout?: 'inline' | 'stacked'
  showName?: boolean
  className?: string
}
```

## States

| State | Visual |
|-------|--------|
| Default | Input + button |
| Focused | Input has focus ring |
| Invalid | Red border, error below |
| Submitting | Button shows spinner |
| Success | Green checkmark + message |
| Error | Red error message |

## Implementation

```tsx
import { useState, FormEvent } from 'react'

interface NewsletterSignupProps {
  onSubmit: (email: string, name?: string) => Promise<void>
  placeholder?: string
  buttonText?: string
  successMessage?: string
  layout?: 'inline' | 'stacked'
  showName?: boolean
  className?: string
}

export default function NewsletterSignup({
  onSubmit,
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  successMessage = "You're subscribed!",
  layout = 'inline',
  showName = false,
  className = ''
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(email, showName ? name : undefined)
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setIsSuccess(false)
    setEmail('')
    setName('')
    setError('')
  }

  if (isSuccess) {
    return (
      <div className={`flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-2 text-green-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{successMessage}</span>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Subscribe another
        </button>
      </div>
    )
  }

  const isInline = layout === 'inline'

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <div className={isInline ? 'flex gap-2' : 'space-y-3'}>
        {showName && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            placeholder="Your name"
            aria-label="Your name"
            className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
              isInline ? 'flex-1' : 'w-full'
            }`}
          />
        )}
        
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError('')
          }}
          disabled={isSubmitting}
          placeholder={placeholder}
          required
          aria-label="Email address"
          aria-invalid={!!error}
          aria-describedby={error ? 'newsletter-error' : undefined}
          className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${isInline ? 'flex-1' : 'w-full'}`}
        />
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
            isInline ? '' : 'w-full'
          }`}
        >
          {isSubmitting ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            buttonText
          )}
        </button>
      </div>
      
      {error && (
        <p id="newsletter-error" className="mt-2 text-sm text-red-600" role="alert">{error}</p>
      )}
    </form>
  )
}
```

## Usage Examples

### Inline (Footer/Header)
```tsx
<NewsletterSignup
  onSubmit={async (email) => {
    await fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }}
  placeholder="Your email"
  buttonText="Join"
  layout="inline"
/>
```

### Stacked (Sidebar/Card)
```tsx
<NewsletterSignup
  onSubmit={subscribeToNewsletter}
  placeholder="Enter your email address"
  buttonText="Subscribe to newsletter"
  successMessage="Welcome aboard! Check your inbox."
  layout="stacked"
  showName={true}
/>
```

### With Custom Styling
```tsx
<div className="bg-gray-900 p-6 rounded-xl">
  <h3 className="text-white font-bold mb-3">Stay updated</h3>
  <NewsletterSignup
    onSubmit={subscribe}
    buttonText="Notify me"
    className="[&_input]:bg-gray-800 [&_input]:text-white [&_input]:border-gray-700"
  />
</div>
```

## Layout Comparison

### Inline Layout
```
[     Email input      ] [Subscribe]
```
Best for: Headers, footers, minimal space

### Stacked Layout
```
[     Name input       ]
[     Email input      ]
[      Subscribe       ]
```
Best for: Sidebars, cards, dedicated sections

## Customization Points

| Aspect | How to customize |
|--------|------------------|
| Colors | Change bg-blue-600, text-green-600, etc. |
| Size | Modify px-4 py-2 padding |
| Border radius | Change rounded-lg to rounded-full, etc. |
| Button style | Edit button classes |
| Success icon | Replace SVG in success state |

## Integration Examples

### With Supabase
```tsx
<NewsletterSignup
  onSubmit={async (email) => {
    const { error } = await supabase
      .from('subscribers')
      .insert({ email, subscribed_at: new Date().toISOString() })
    if (error) throw error
  }}
/>
```

### With Resend
```tsx
<NewsletterSignup
  onSubmit={async (email) => {
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
  }}
/>
```

### With Mailchimp
```tsx
<NewsletterSignup
  onSubmit={async (email, name) => {
    await fetch('/api/mailchimp', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        merge_fields: { FNAME: name } 
      })
    })
  }}
  showName={true}
/>
```
