import { useState, FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout from './AuthLayout'

interface ForgotPasswordFormProps {
  onNavigate: (view: 'signin' | 'signup' | 'verify' | 'forgot') => void
}

export default function ForgotPasswordForm({ onNavigate }: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await resetPassword(email)
    
    setLoading(false)
    
    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <AuthLayout 
        title="Check Your Email" 
        subtitle={`We sent a password reset link to ${email}`}
      >
        <div className="text-center space-y-6">
          {/* Email icon */}
          <div className="text-6xl">📧</div>
          
          {/* Instructions */}
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Click the link in your email to reset your password. 
            The link will expire in 1 hour.
          </p>

          {/* Back to sign in */}
          <button
            onClick={() => onNavigate('signin')}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium"
          >
            ← Back to sign in
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout 
      title="Forgot Password" 
      subtitle="Enter your email to reset your password"
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
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      {/* Back to sign in */}
      <p 
        className="mt-6 text-center text-sm"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Remember your password?{' '}
        <button
          onClick={() => onNavigate('signin')}
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Sign in
        </button>
      </p>
    </AuthLayout>
  )
}
