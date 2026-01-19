import { useState, FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout from './AuthLayout'

interface SignUpFormProps {
  onNavigate: (view: 'signin' | 'signup' | 'verify' | 'forgot', email?: string) => void
  onShowTos?: () => void
  onShowPrivacy?: () => void
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

export default function SignUpForm({ onNavigate, onShowTos, onShowPrivacy }: SignUpFormProps) {
  const { signUp, loading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tosAccepted, setTosAccepted] = useState(false)
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

    if (!tosAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy')
      return
    }

    const { error: signUpError } = await signUp(email, password)

    if (signUpError) {
      // Handle specific Supabase error messages
      if (signUpError.message.includes('already registered')) {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (signUpError.message.includes('valid email')) {
        setError('Please enter a valid email address.')
      } else if (signUpError.message.includes('password')) {
        setError('Password is too weak. Please use a stronger password.')
      } else {
        setError(signUpError.message)
      }
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
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 pr-11 rounded-lg text-sm outline-none transition-all"
              style={{ 
                background: 'var(--bg-tertiary)',
                border: confirmPassword && !passwordsMatch 
                  ? '1px solid var(--error)' 
                  : '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs" style={{ color: 'var(--error)' }}>
              Passwords do not match
            </p>
          )}
        </div>

        {/* Terms of Service & Privacy Policy Checkbox */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="tos-checkbox"
            checked={tosAccepted}
            onChange={(e) => setTosAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label 
            htmlFor="tos-checkbox"
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            I agree to the{' '}
            <button
              type="button"
              onClick={onShowTos}
              className="text-blue-400 hover:text-blue-300 font-medium underline"
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <button
              type="button"
              onClick={onShowPrivacy}
              className="text-blue-400 hover:text-blue-300 font-medium underline"
            >
              Privacy Policy
            </button>
          </label>
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
          disabled={loading || !passwordValid || !passwordsMatch || !tosAccepted}
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
