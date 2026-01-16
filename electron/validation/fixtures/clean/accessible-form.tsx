/**
 * CLEAN FIXTURE: Accessible Form
 * 
 * This component should have ZERO critical issues.
 * Tests for false positives.
 * 
 * Checks passed:
 * ✓ All inputs have associated labels
 * ✓ Uses proper form semantics
 * ✓ Has visible focus indicators
 * ✓ Error messages are properly associated
 * ✓ Submit button is properly labeled
 * ✓ Uses tinted colors (not pure black/white)
 */

import { useState } from 'react'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

export default function LoginForm() {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Form submission logic
    setIsSubmitting(false)
  }
  
  return (
    <form 
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto p-6 bg-slate-900 rounded-xl"
      aria-label="Login form"
    >
      {/* Email field with proper label association */}
      <div>
        <label 
          htmlFor="email"
          className="block text-sm font-medium text-slate-200 mb-1"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="
            w-full px-3 py-2 
            bg-slate-800 text-slate-100 
            border border-slate-600 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            placeholder-slate-400
          "
          placeholder="you@example.com"
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={errors.email ? 'true' : 'false'}
          required
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
            {errors.email}
          </p>
        )}
      </div>
      
      {/* Password field with proper label association */}
      <div>
        <label 
          htmlFor="password"
          className="block text-sm font-medium text-slate-200 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="
            w-full px-3 py-2 
            bg-slate-800 text-slate-100 
            border border-slate-600 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          "
          aria-describedby={errors.password ? 'password-error' : undefined}
          aria-invalid={errors.password ? 'true' : 'false'}
          required
          minLength={8}
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-400" role="alert">
            {errors.password}
          </p>
        )}
      </div>
      
      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="
          w-full py-2 px-4
          bg-indigo-600 hover:bg-indigo-500 
          text-slate-50 font-medium
          rounded-lg
          transition-colors duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
