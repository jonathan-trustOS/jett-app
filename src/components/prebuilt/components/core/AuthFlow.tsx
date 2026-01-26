/**
 * AuthFlow - Pre-built Authentication Component
 * 
 * Features:
 * - Sign up / Sign in toggle
 * - Password reset flow
 * - Form validation
 * - Loading states
 * - Error handling
 * 
 * Customization via props:
 * - appName: Your app name for branding
 * - logo: Optional logo URL
 * - onAuth: Callback with user data
 * - primaryColor: Tailwind color class (default: blue-600)
 */

import { useState } from 'react'

// ============================================
// TYPES
// ============================================

interface AuthFlowProps {
  appName?: string
  logo?: string
  primaryColor?: string
  onAuth: (user: AuthUser) => void
  onForgotPassword?: (email: string) => Promise<void>
}

interface AuthUser {
  id: string
  email: string
  name?: string
}

type AuthMode = 'signin' | 'signup' | 'forgot'

// ============================================
// COMPONENT
// ============================================

export default function AuthFlow({
  appName = 'My App',
  logo,
  primaryColor = 'blue-600',
  onAuth,
  onForgotPassword
}: AuthFlowProps) {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setName('')
    setError(null)
    setSuccess(null)
  }

  const switchMode = (newMode: AuthMode) => {
    resetForm()
    setMode(newMode)
  }

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (mode !== 'forgot' && password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      if (mode === 'forgot') {
        // Handle forgot password
        if (onForgotPassword) {
          await onForgotPassword(email)
        }
        setSuccess('Password reset link sent to your email')
        return
      }

      // Simulate API call - replace with actual auth logic
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock successful auth
      const user: AuthUser = {
        id: crypto.randomUUID(),
        email,
        name: mode === 'signup' ? name : undefined
      }

      onAuth(user)
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const buttonClass = `w-full py-3 px-4 rounded-lg font-medium text-white bg-${primaryColor} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity`

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div 
        className="w-full max-w-md rounded-2xl p-8 shadow-xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          {logo ? (
            <img src={logo} alt={appName} className="h-12 mx-auto mb-4" />
          ) : (
            <div className={`w-12 h-12 rounded-xl bg-${primaryColor} mx-auto mb-4 flex items-center justify-center`}>
              <span className="text-white text-xl font-bold">{appName.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'signin' && `Welcome back to ${appName}`}
            {mode === 'signup' && `Create your ${appName} account`}
            {mode === 'forgot' && 'Reset your password'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'signin' && 'Sign in to continue'}
            {mode === 'signup' && 'Get started for free'}
            {mode === 'forgot' && "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50"
              style={{ 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                required
              />
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                required
              />
            </div>
          )}

          {mode === 'signin' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-sm hover:underline"
                style={{ color: 'var(--text-secondary)' }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={buttonClass}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                {mode === 'signin' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Link'}
              </>
            )}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          {mode === 'signin' && (
            <>
              Don't have an account?{' '}
              <button onClick={() => switchMode('signup')} className="font-medium hover:underline" style={{ color: `var(--text-primary)` }}>
                Sign up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <button onClick={() => switchMode('signin')} className="font-medium hover:underline" style={{ color: `var(--text-primary)` }}>
                Sign in
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <>
              Remember your password?{' '}
              <button onClick={() => switchMode('signin')} className="font-medium hover:underline" style={{ color: `var(--text-primary)` }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
