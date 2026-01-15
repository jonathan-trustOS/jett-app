import { useState, FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout from './AuthLayout'

interface SignUpFormProps {
  onNavigate: (view: 'signin' | 'signup' | 'verify' | 'forgot', email?: string) => void
}

export default function SignUpForm({ onNavigate }: SignUpFormProps) {
  const { signUp, loading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  // Password validation
  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password)
  }
  const passwordValid = Object.values(passwordRequirements).every(Boolean)
  const passwordsMatch = password === confirmPassword && confirmPassword !== ''

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordValid) {
      setError('Password does not meet requirements')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    const { error: signUpError } = await signUp(email, password)

    if (signUpError) {
      setError(signUpError.message)
    } else {
      // Pass email to verify screen
      onNavigate('verify', email)
    }
  }

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Start your 14-day free trial"
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
          
          {/* Password requirements */}
          {password && (
            <div className="mt-2 space-y-1">
              <RequirementRow met={passwordRequirements.length} text="At least 8 characters" />
              <RequirementRow met={passwordRequirements.uppercase} text="One uppercase letter" />
              <RequirementRow met={passwordRequirements.number} text="One number" />
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label 
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{ 
              background: 'var(--bg-tertiary)',
              border: confirmPassword && !passwordsMatch 
                ? '1px solid var(--error)' 
                : '1px solid var(--border-primary)',
              color: 'var(--text-primary)'
            }}
            placeholder="••••••••"
          />
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs" style={{ color: 'var(--error)' }}>
              Passwords do not match
            </p>
          )}
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
          disabled={loading || !passwordValid || !passwordsMatch}
          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Sign in link */}
      <p 
        className="mt-6 text-center text-sm"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Already have an account?{' '}
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

function RequirementRow({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span style={{ color: met ? 'var(--success)' : 'var(--text-tertiary)' }}>
        {met ? '✓' : '○'}
      </span>
      <span style={{ color: met ? 'var(--success)' : 'var(--text-tertiary)' }}>
        {text}
      </span>
    </div>
  )
}
