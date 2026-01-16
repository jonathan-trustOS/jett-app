import { useState, FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout from './AuthLayout'

interface SignInFormProps {
  onNavigate: (view: 'signin' | 'signup' | 'verify' | 'forgot') => void
  onSuccess: () => void
}

export default function SignInForm({ onNavigate, onSuccess }: SignInFormProps) {
  const { signIn, loading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{ 
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)'
            }}
            placeholder="••••••••"
          />
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
