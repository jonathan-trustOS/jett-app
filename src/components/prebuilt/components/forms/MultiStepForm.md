# MultiStepForm Component

A wizard-style form with step progress indicator, validation per step, and smooth navigation between steps.

## Features

- Visual progress indicator (steps or progress bar)
- Per-step validation before advancing
- Back/Next navigation
- Step titles and descriptions
- Final review step option
- Skip optional steps

## Props

```typescript
interface MultiStepFormProps {
  steps: FormStep[]
  onComplete: (data: Record<string, any>) => Promise<void>
  showProgressBar?: boolean  // Bar vs numbered steps
  allowSkip?: boolean        // Allow skipping optional steps
  showReview?: boolean       // Show summary before submit
  className?: string
}

interface FormStep {
  id: string
  title: string
  description?: string
  fields: FormField[]
  optional?: boolean
}

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]  // For select/radio
  validation?: (value: any) => string | undefined
}
```

## Implementation

```tsx
import { useState } from 'react'

interface FormStep {
  id: string
  title: string
  description?: string
  fields: FormField[]
  optional?: boolean
}

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: (value: any) => string | undefined
}

interface MultiStepFormProps {
  steps: FormStep[]
  onComplete: (data: Record<string, any>) => Promise<void>
  showProgressBar?: boolean
  allowSkip?: boolean
  showReview?: boolean
  className?: string
}

export default function MultiStepForm({
  steps,
  onComplete,
  showProgressBar = false,
  allowSkip = false,
  showReview = true,
  className = ''
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const totalSteps = showReview ? steps.length + 1 : steps.length
  const isReviewStep = showReview && currentStep === steps.length
  const isLastStep = currentStep === totalSteps - 1

  const validateStep = (stepIndex: number): boolean => {
    const step = steps[stepIndex]
    if (!step) return true
    
    const newErrors: Record<string, string> = {}

    for (const field of step.fields) {
      const value = formData[field.name]

      // Required check - handle checkbox boolean specially
      if (field.required) {
        const isEmpty = field.type === 'checkbox' 
          ? value !== true 
          : (value === undefined || value === '' || value === null)
        
        if (isEmpty) {
          newErrors[field.name] = `${field.label} is required`
          continue
        }
      }

      // Skip validation if empty and not required
      if (value === undefined || value === '' || value === null) continue

      // Email validation
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field.name] = 'Please enter a valid email'
        continue
      }

      // Phone validation
      if (field.type === 'tel' && !/^[\d\s\-+()]+$/.test(value)) {
        newErrors[field.name] = 'Please enter a valid phone number'
        continue
      }

      // Custom validation
      if (field.validation) {
        const error = field.validation(value)
        if (error) {
          newErrors[field.name] = error
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (isReviewStep) {
      handleSubmit()
      return
    }

    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setErrors({})
    }
  }

  const handleSkip = () => {
    if (allowSkip && steps[currentStep]?.optional) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onComplete(formData)
      setIsComplete(true)
    } catch (error: any) {
      setErrors(prev => ({ ...prev, _submit: error.message || 'Something went wrong' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const formatDisplayValue = (value: any, field: FormField): string => {
    if (value === undefined || value === null || value === '') {
      return ''
    }
    if (field.type === 'checkbox') {
      return value ? 'Yes' : 'No'
    }
    if (field.type === 'select' || field.type === 'radio') {
      const option = field.options?.find(opt => opt.value === value)
      return option?.label || String(value)
    }
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return String(value)
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? ''
    const error = errors[field.name]
    const fieldId = `field-${field.name}`
    const errorId = `error-${field.name}`
    const baseInputClasses = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
      error ? 'border-red-500' : 'border-gray-300'
    }`

    switch (field.type) {
      case 'select':
        return (
          <select
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={isSubmitting}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={baseInputClasses}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )

      case 'textarea':
        return (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={isSubmitting}
            placeholder={field.placeholder}
            rows={4}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`${baseInputClasses} resize-none`}
          />
        )

      case 'checkbox':
        return (
          <label htmlFor={fieldId} className="flex items-center gap-3 cursor-pointer">
            <input
              id={fieldId}
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              disabled={isSubmitting}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">{field.placeholder || field.label}</span>
          </label>
        )

      case 'radio':
        return (
          <div 
            role="radiogroup" 
            aria-labelledby={`${fieldId}-label`}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="space-y-2"
          >
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  disabled={isSubmitting}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )

      default:
        return (
          <input
            id={fieldId}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={isSubmitting}
            placeholder={field.placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={baseInputClasses}
          />
        )
    }
  }

  // Success state
  if (isComplete) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">All Done!</h3>
        <p className="text-gray-600">Your information has been submitted successfully.</p>
      </div>
    )
  }

  const currentStepData = steps[currentStep]

  return (
    <div className={className}>
      {/* Progress Indicator */}
      {showProgressBar ? (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < currentStep
                  ? 'bg-blue-600 text-white'
                  : i === currentStep
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {i < currentStep ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < totalSteps - 1 && (
                <div className={`w-12 h-1 mx-1 transition-colors ${
                  i < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step Content */}
      {isReviewStep ? (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Your Information</h2>
          <p className="text-gray-600 mb-6">Please confirm everything looks correct.</p>
          
          <div className="space-y-4 bg-gray-50 rounded-lg p-4 mb-6">
            {steps.map(step => (
              <div key={step.id}>
                <h3 className="font-medium text-gray-900 mb-2">{step.title}</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {step.fields.map(field => (
                    <div key={field.name}>
                      <dt className="text-gray-500">{field.label}</dt>
                      <dd className="text-gray-900">
                        {formatDisplayValue(formData[field.name], field) || (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentStepData?.title}</h2>
          {currentStepData?.description && (
            <p className="text-gray-600 mb-6">{currentStepData.description}</p>
          )}

          <div className="space-y-4">
            {currentStepData?.fields.map(field => (
              <div key={field.name}>
                {field.type !== 'checkbox' && (
                  <label 
                    id={field.type === 'radio' ? `field-${field.name}-label` : undefined}
                    htmlFor={field.type !== 'radio' ? `field-${field.name}` : undefined} 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                {renderField(field)}
                {errors[field.name] && (
                  <p id={`error-${field.name}`} className="mt-1 text-sm text-red-600" role="alert">
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors._submit && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
          {errors._submit}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
          className="px-6 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="flex gap-3">
          {allowSkip && currentStepData?.optional && !isReviewStep && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="px-6 py-2 text-gray-500 hover:text-gray-700"
            >
              Skip
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </>
            ) : isLastStep ? (
              'Submit'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
```

## Usage Example

```tsx
const signupSteps: FormStep[] = [
  {
    id: 'account',
    title: 'Create your account',
    description: 'Start with your basic information',
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@example.com' },
      { name: 'password', label: 'Password', type: 'text', required: true, placeholder: '••••••••' },
    ]
  },
  {
    id: 'profile',
    title: 'Your profile',
    description: 'Tell us a bit about yourself',
    fields: [
      { name: 'firstName', label: 'First name', type: 'text', required: true },
      { name: 'lastName', label: 'Last name', type: 'text', required: true },
      { name: 'company', label: 'Company', type: 'text', placeholder: 'Optional' },
    ]
  },
  {
    id: 'preferences',
    title: 'Your preferences',
    description: 'Help us personalize your experience',
    optional: true,
    fields: [
      { 
        name: 'role', 
        label: 'Your role', 
        type: 'select',
        options: [
          { value: 'developer', label: 'Developer' },
          { value: 'designer', label: 'Designer' },
          { value: 'product', label: 'Product Manager' },
          { value: 'other', label: 'Other' },
        ]
      },
      { name: 'newsletter', label: 'Newsletter', type: 'checkbox', placeholder: 'Send me product updates' },
    ]
  }
]

<MultiStepForm
  steps={signupSteps}
  onComplete={async (data) => {
    await createAccount(data)
  }}
  showReview={true}
  allowSkip={true}
/>
```

## Step Configuration

### Field Types

| Type | Input | Notes |
|------|-------|-------|
| text | `<input type="text">` | Basic text input |
| email | `<input type="email">` | Auto-validates email format |
| tel | `<input type="tel">` | Phone number input |
| number | `<input type="number">` | Numeric input |
| select | `<select>` | Dropdown, requires options |
| textarea | `<textarea>` | Multi-line text |
| checkbox | `<input type="checkbox">` | Boolean toggle |
| radio | Multiple `<input type="radio">` | Single choice, requires options |

### Custom Validation

```tsx
{
  name: 'password',
  label: 'Password',
  type: 'text',
  required: true,
  validation: (value) => {
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter'
    if (!/[0-9]/.test(value)) return 'Password must contain a number'
    return undefined
  }
}
```

## Customization Points

| Aspect | How to customize |
|--------|------------------|
| Progress style | `showProgressBar={true}` for bar vs steps |
| Skip behavior | `allowSkip={true}` + mark steps as `optional` |
| Review step | `showReview={false}` to skip review |
| Field layout | Modify grid/flex in renderField |
