# ContactForm Component

A complete contact form with validation, loading states, and success confirmation.

## Features

- Name, email, subject, message fields
- Real-time validation with error messages
- Loading state during submission
- Success state with confirmation
- Honeypot field for basic spam protection
- Accessible labels and error announcements

## Props

```typescript
interface ContactFormProps {
  onSubmit: (data: ContactData) => Promise<void>
  recipientName?: string  // "our team" by default
  showSubject?: boolean   // true by default
  className?: string
}

interface ContactData {
  name: string
  email: string
  subject?: string
  message: string
}
```

## States

| State | Visual |
|-------|--------|
| Default | Empty form with placeholders |
| Focused | Active field highlighted |
| Error | Red border, error message below field |
| Submitting | Button shows spinner, fields disabled |
| Success | Form replaced with confirmation message |

## Implementation

```tsx
import { useState, FormEvent } from 'react'

interface ContactFormProps {
  onSubmit: (data: ContactData) => Promise<void>
  recipientName?: string
  showSubject?: boolean
  className?: string
}

interface ContactData {
  name: string
  email: string
  subject?: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
  _submit?: string
}

export default function ContactForm({ 
  onSubmit, 
  recipientName = 'our team',
  showSubject = true,
  className = ''
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (showSubject && !formData.subject?.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Honeypot check - if filled, silently "succeed"
    if (honeypot) {
      setIsSuccess(true)
      return
    }

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setIsSuccess(true)
    } catch (error) {
      setErrors(prev => ({ ...prev, _submit: 'Failed to send. Please try again.' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof ContactData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const resetForm = () => {
    setIsSuccess(false)
    setFormData({ name: '', email: '', subject: '', message: '' })
    setErrors({})
  }

  if (isSuccess) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-600">
          Thanks for reaching out. We'll get back to you soon.
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="mt-6 text-blue-600 hover:text-blue-700 font-medium"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {/* Honeypot - hidden from users, visible to bots */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Your name"
          />
          {errors.name && (
            <p id="contact-name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="contact-email-error" className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>
          )}
        </div>

        {/* Subject (optional) */}
        {showSubject && (
          <div>
            <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              value={formData.subject}
              onChange={handleChange('subject')}
              disabled={isSubmitting}
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="What's this about?"
            />
            {errors.subject && (
              <p id="contact-subject-error" className="mt-1 text-sm text-red-600" role="alert">{errors.subject}</p>
            )}
          </div>
        )}

        {/* Message */}
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="contact-message"
            value={formData.message}
            onChange={handleChange('message')}
            disabled={isSubmitting}
            rows={5}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={`Tell ${recipientName} what's on your mind...`}
          />
          {errors.message && (
            <p id="contact-message-error" className="mt-1 text-sm text-red-600" role="alert">{errors.message}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors._submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
            {errors._submit}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending...
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </div>
    </form>
  )
}
```

## Usage Example

```tsx
<ContactForm
  onSubmit={async (data) => {
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }}
  recipientName="our support team"
  showSubject={true}
/>
```

## Customization Points

| Aspect | How to customize |
|--------|------------------|
| Colors | Change Tailwind classes (blue-600, etc.) |
| Spacing | Modify space-y-4, py-3, etc. |
| Validation rules | Edit validate() function |
| Fields | Add/remove fields in formData interface |
| Success message | Edit the isSuccess return block |

## Accessibility

- All inputs have associated labels via `htmlFor`/`id`
- Error messages connected via `aria-describedby`
- Invalid state indicated via `aria-invalid`
- Error messages use `role="alert"` for screen reader announcement
- Disabled state during submission prevents double-submit
- Focus ring visible for keyboard navigation
- Honeypot field is `aria-hidden` and not in tab order
- Form uses `noValidate` to use custom validation
