# SurveyBuilder Component

A dynamic survey/questionnaire builder that supports multiple question types, conditional logic, and progress tracking.

## Features

- Multiple question types (text, choice, rating, scale, matrix)
- One question per page or all questions view
- Required/optional questions
- Conditional logic (show question based on previous answer)
- Progress indicator
- Response validation

## Props

```typescript
interface SurveyBuilderProps {
  survey: Survey
  onComplete: (responses: SurveyResponse[]) => Promise<void>
  mode?: 'paged' | 'all'      // One question per page or all at once
  showProgress?: boolean
  allowBack?: boolean
  className?: string
}

interface Survey {
  id: string
  title: string
  description?: string
  questions: SurveyQuestion[]
}

interface SurveyQuestion {
  id: string
  type: 'text' | 'longtext' | 'single' | 'multiple' | 'rating' | 'scale' | 'matrix'
  question: string
  description?: string
  required?: boolean
  options?: string[]              // For single/multiple choice
  ratingMax?: number              // For rating (default 5)
  scaleMin?: number               // For scale
  scaleMax?: number               // For scale
  scaleLabels?: [string, string]  // [min label, max label]
  matrixRows?: string[]           // For matrix questions
  matrixColumns?: string[]        // For matrix questions
  showIf?: {                      // Conditional logic
    questionId: string
    equals: string | string[] | number
  }
}

interface SurveyResponse {
  questionId: string
  value: string | string[] | number | Record<string, string>
}
```

## Implementation

```tsx
import { useState, useMemo } from 'react'

interface Survey {
  id: string
  title: string
  description?: string
  questions: SurveyQuestion[]
}

interface SurveyQuestion {
  id: string
  type: 'text' | 'longtext' | 'single' | 'multiple' | 'rating' | 'scale' | 'matrix'
  question: string
  description?: string
  required?: boolean
  options?: string[]
  ratingMax?: number
  scaleMin?: number
  scaleMax?: number
  scaleLabels?: [string, string]
  matrixRows?: string[]
  matrixColumns?: string[]
  showIf?: {
    questionId: string
    equals: string | string[] | number
  }
}

interface SurveyResponse {
  questionId: string
  value: string | string[] | number | Record<string, string>
}

interface SurveyBuilderProps {
  survey: Survey
  onComplete: (responses: SurveyResponse[]) => Promise<void>
  mode?: 'paged' | 'all'
  showProgress?: boolean
  allowBack?: boolean
  className?: string
}

export default function SurveyBuilder({
  survey,
  onComplete,
  mode = 'paged',
  showProgress = true,
  allowBack = true,
  className = ''
}: SurveyBuilderProps) {
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Filter questions based on conditional logic
  const visibleQuestions = useMemo(() => {
    return survey.questions.filter(q => {
      if (!q.showIf) return true
      const dependentValue = responses[q.showIf.questionId]
      const targetValue = q.showIf.equals
      
      // Handle array of possible values
      if (Array.isArray(targetValue)) {
        return targetValue.some(v => String(v) === String(dependentValue))
      }
      // Handle single value - compare as strings to handle number/string mismatch
      return String(dependentValue) === String(targetValue)
    })
  }, [survey.questions, responses])

  const currentQuestion = visibleQuestions[currentIndex]
  const totalQuestions = visibleQuestions.length
  const isLastQuestion = currentIndex === totalQuestions - 1

  const validateQuestion = (question: SurveyQuestion): boolean => {
    const value = responses[question.id]
    
    if (question.required) {
      if (value === undefined || value === '' || value === null) {
        setErrors(prev => ({ ...prev, [question.id]: 'This question is required' }))
        return false
      }
      if (Array.isArray(value) && value.length === 0) {
        setErrors(prev => ({ ...prev, [question.id]: 'Please select at least one option' }))
        return false
      }
      if (question.type === 'matrix' && question.matrixRows) {
        const missing = question.matrixRows.some(row => !value?.[row])
        if (missing) {
          setErrors(prev => ({ ...prev, [question.id]: 'Please answer all rows' }))
          return false
        }
      }
    }
    
    return true
  }

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }))
    if (errors[questionId]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }
  }

  const handleNext = () => {
    if (mode === 'paged' && currentQuestion) {
      if (!validateQuestion(currentQuestion)) return
    }
    
    if (isLastQuestion || mode === 'all') {
      handleSubmit()
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setErrors({})
    }
  }

  const handleSubmit = async () => {
    // Validate all required questions in 'all' mode
    if (mode === 'all') {
      let hasErrors = false
      for (const q of visibleQuestions) {
        if (!validateQuestion(q)) {
          hasErrors = true
        }
      }
      if (hasErrors) return
    }

    setIsSubmitting(true)
    try {
      const formattedResponses: SurveyResponse[] = Object.entries(responses).map(
        ([questionId, value]) => ({ questionId, value })
      )
      await onComplete(formattedResponses)
      setIsComplete(true)
    } catch (error: any) {
      setErrors(prev => ({ ...prev, _submit: error.message || 'Failed to submit survey' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: SurveyQuestion) => {
    const value = responses[question.id]
    const error = errors[question.id]
    const questionLabelId = `question-${question.id}`
    const inputId = `input-${question.id}`
    const errorId = `error-${question.id}`

    const questionHeader = (
      <div className="mb-4">
        <h3 id={questionLabelId} className="text-lg font-medium text-gray-900">
          {question.question}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {question.description && (
          <p className="text-gray-600 mt-1">{question.description}</p>
        )}
      </div>
    )

    switch (question.type) {
      case 'text':
        return (
          <div>
            {questionHeader}
            <input
              id={inputId}
              type="text"
              value={value || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              aria-labelledby={questionLabelId}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your answer"
            />
          </div>
        )

      case 'longtext':
        return (
          <div>
            {questionHeader}
            <textarea
              id={inputId}
              value={value || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              rows={4}
              aria-labelledby={questionLabelId}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your answer"
            />
          </div>
        )

      case 'single':
        return (
          <div>
            {questionHeader}
            <div 
              role="radiogroup" 
              aria-labelledby={questionLabelId}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className="space-y-2"
            >
              {question.options?.map(option => (
                <label
                  key={option}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    value === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'multiple':
        return (
          <div>
            {questionHeader}
            <div 
              role="group" 
              aria-labelledby={questionLabelId}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className="space-y-2"
            >
              {question.options?.map(option => {
                const selected = (value || []).includes(option)
                return (
                  <label
                    key={option}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const current = value || []
                        const updated = e.target.checked
                          ? [...current, option]
                          : current.filter((v: string) => v !== option)
                        handleResponse(question.id, updated)
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )

      case 'rating':
        const max = question.ratingMax || 5
        return (
          <div>
            {questionHeader}
            <div 
              role="radiogroup" 
              aria-labelledby={questionLabelId}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className="flex gap-2"
            >
              {Array.from({ length: max }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleResponse(question.id, num)}
                  aria-label={`Rate ${num} out of ${max}`}
                  aria-pressed={value === num}
                  className={`w-12 h-12 rounded-full text-lg font-medium transition-colors ${
                    value === num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )

      case 'scale':
        const min = question.scaleMin || 1
        const scaleMax = question.scaleMax || 10
        const labels = question.scaleLabels || ['Low', 'High']
        return (
          <div>
            {questionHeader}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-20 text-right" aria-hidden="true">{labels[0]}</span>
              <div 
                role="radiogroup" 
                aria-labelledby={questionLabelId}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className="flex gap-1 flex-1 justify-center"
              >
                {Array.from({ length: scaleMax - min + 1 }, (_, i) => min + i).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleResponse(question.id, num)}
                    aria-label={`${num}${num === min ? ` (${labels[0]})` : num === scaleMax ? ` (${labels[1]})` : ''}`}
                    aria-pressed={value === num}
                    className={`w-10 h-10 rounded text-sm font-medium transition-colors ${
                      value === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-500 w-20" aria-hidden="true">{labels[1]}</span>
            </div>
          </div>
        )

      case 'matrix':
        return (
          <div>
            {questionHeader}
            <div 
              className="overflow-x-auto"
              role="group"
              aria-labelledby={questionLabelId}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            >
              <table className="w-full">
                <thead>
                  <tr>
                    <th scope="col" className="text-left p-2 sr-only">Row</th>
                    {question.matrixColumns?.map(col => (
                      <th key={col} scope="col" className="text-center p-2 text-sm font-medium text-gray-600">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {question.matrixRows?.map(row => (
                    <tr key={row} className="border-t border-gray-100">
                      <th scope="row" className="p-2 text-gray-700 text-left font-normal">{row}</th>
                      {question.matrixColumns?.map(col => (
                        <td key={col} className="text-center p-2">
                          <input
                            type="radio"
                            name={`${question.id}-${row}`}
                            checked={(value || {})[row] === col}
                            onChange={() => {
                              const current = value || {}
                              handleResponse(question.id, { ...current, [row]: col })
                            }}
                            aria-label={`${row}: ${col}`}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      default:
        return null
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600">Your response has been recorded.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{survey.title}</h2>
        {survey.description && (
          <p className="text-gray-600 mt-1">{survey.description}</p>
        )}
      </div>

      {/* Progress */}
      {showProgress && mode === 'paged' && totalQuestions > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Questions */}
      {mode === 'paged' ? (
        <div className="min-h-[200px]">
          {currentQuestion && (
            <>
              {renderQuestion(currentQuestion)}
              {errors[currentQuestion.id] && (
                <p id={`error-${currentQuestion.id}`} className="mt-2 text-sm text-red-600" role="alert">
                  {errors[currentQuestion.id]}
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {visibleQuestions.map((q, i) => (
            <div key={q.id} className="pb-6 border-b border-gray-200 last:border-0">
              <div className="text-sm text-gray-500 mb-2">Question {i + 1}</div>
              {renderQuestion(q)}
              {errors[q.id] && (
                <p id={`error-${q.id}`} className="mt-2 text-sm text-red-600" role="alert">{errors[q.id]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Error */}
      {errors._submit && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
          {errors._submit}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {mode === 'paged' && allowBack ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={currentIndex === 0 || isSubmitting}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Back
          </button>
        ) : (
          <div />
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
          ) : isLastQuestion || mode === 'all' ? (
            'Submit'
          ) : (
            'Next'
          )}
        </button>
      </div>
    </div>
  )
}
```

## Usage Example

```tsx
const feedbackSurvey: Survey = {
  id: 'product-feedback',
  title: 'Product Feedback',
  description: 'Help us improve by sharing your experience',
  questions: [
    {
      id: 'satisfaction',
      type: 'rating',
      question: 'How satisfied are you with our product?',
      required: true,
      ratingMax: 5
    },
    {
      id: 'recommend',
      type: 'scale',
      question: 'How likely are you to recommend us?',
      description: 'On a scale of 1-10',
      required: true,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Not likely', 'Very likely']
    },
    {
      id: 'features',
      type: 'multiple',
      question: 'Which features do you use most?',
      options: ['Dashboard', 'Reports', 'API', 'Integrations', 'Mobile app'],
      required: true
    },
    {
      id: 'missing',
      type: 'single',
      question: 'Is there anything missing?',
      options: ['Yes', 'No'],
      required: true
    },
    {
      id: 'missing-details',
      type: 'longtext',
      question: 'What features would you like to see?',
      showIf: { questionId: 'missing', equals: 'Yes' }
    },
    {
      id: 'experience',
      type: 'matrix',
      question: 'Rate the following aspects',
      matrixRows: ['Ease of use', 'Performance', 'Design', 'Support'],
      matrixColumns: ['Poor', 'Fair', 'Good', 'Excellent'],
      required: true
    }
  ]
}

<SurveyBuilder
  survey={feedbackSurvey}
  onComplete={async (responses) => {
    await fetch('/api/survey', {
      method: 'POST',
      body: JSON.stringify({ surveyId: 'product-feedback', responses })
    })
  }}
  mode="paged"
  showProgress={true}
/>
```

## Question Types

| Type | Display | Value Type |
|------|---------|------------|
| text | Single-line input | `string` |
| longtext | Multi-line textarea | `string` |
| single | Radio button list | `string` |
| multiple | Checkbox list | `string[]` |
| rating | Numbered circles (1-N) | `number` |
| scale | Horizontal scale with labels | `number` |
| matrix | Grid of radio buttons | `Record<string, string>` |

## Conditional Logic

Show questions based on previous answers:

```tsx
// Show if satisfaction rating is 1 or 2
{
  id: 'follow-up',
  type: 'text',
  question: 'Please explain',
  showIf: {
    questionId: 'satisfaction',
    equals: [1, 2]  // Works with numbers
  }
}

// Show if specific option selected
{
  id: 'details',
  type: 'longtext',
  question: 'Tell us more',
  showIf: {
    questionId: 'interested',
    equals: 'Yes'  // Works with strings
  }
}
```

## Customization Points

| Aspect | How to customize |
|--------|------------------|
| Question spacing | Modify space-y-8 in all mode |
| Option styling | Edit the label classes in single/multiple |
| Rating style | Change circle to star icons |
| Scale appearance | Modify button sizes/colors |
| Matrix styling | Edit table classes |
