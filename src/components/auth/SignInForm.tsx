import { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout from './AuthLayout'

interface SignInFormProps {
  onNavigate: (view: 'signin' | 'signup' | 'verify' | 'forgot') => void
  onSuccess: () => void
}

// Eye icon for showing password
function EyeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

// Eye-off icon for hiding password
function EyeOffIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function SignInForm({ onNavigate, onSuccess }: SignInFormProps) {
  const { signIn, loading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Load remembered email on mount (using electron-store)
  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        if ((window as any).jett?.auth?.getRememberedEmail) {
          const savedEmail = await (window as any).jett.auth.getRememberedEmail()
          if (savedEmail) {
            setEmail(savedEmail)
          }
        }
      } catch (e) {
        console.error('Failed to load remembered email:', e)
      }
    }
    loadRememberedEmail()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      // Handle specific error cases
      if (signInError.message.includes('Email not confirmed')) {
        setError('Please verify your email before signing in.')
      } else if (signInError.message.includes('Invalid login credentials')) {
        setError('Invalid email or password.')
      } else {
        setError(signInError.message)
      }
    } else {
      // Save email for next time on successful login (using electron-store)
      try {
        if ((window as any).jett?.auth?.setRememberedEmail) {
          await (window as any).jett.auth.setRememberedEmail(email)
        }
      } catch (e) {
        console.error('Failed to save remembered email:', e)
      }
      onSuccess()
    }
  }

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to continue building"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label 
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{ 
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)'
            }}
            placeholder="you@example.com"
          />
        </div>

        {/* Password */}
        <div>
          <label 
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 pr-11 rounded-lg text-sm outline-none transition-all"
              style={{ 
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
        </div>

        {/* Forgot password link */}
        <div className="text-right">
          <button
            type="button"
            onClick={() => onNavigate('forgot')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Forgot password?
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div 
            className="px-4 py-3 rounded-lg text-sm"
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--error)'
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Sign up link */}
      <p 
        className="mt-6 text-center text-sm"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Don't have an account?{' '}
        <button
          onClick={() => onNavigate('signup')}
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Sign up
        </button>
      </p>
    </AuthLayout>
  )
}
