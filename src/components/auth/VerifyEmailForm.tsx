import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout from './AuthLayout'

interface VerifyEmailFormProps {
  email: string
  onNavigate: (view: 'signin' | 'signup' | 'verify' | 'forgot') => void
}

export default function VerifyEmailForm({ email, onNavigate }: VerifyEmailFormProps) {
  const { resendVerification } = useAuth()
  
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const handleResend = async () => {
    if (countdown > 0) return
    
    setResending(true)
    const { error } = await resendVerification(email)
    setResending(false)
    
    if (!error) {
      setResent(true)
      setCountdown(60)
      
      // Countdown timer
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  return (
    <AuthLayout 
      title="Verify Your Email" 
      subtitle={`We sent a verification link to ${email}`}
    >
      <div className="text-center space-y-6">
        {/* Email icon */}
        <div className="text-6xl">📧</div>
        
        {/* Instructions */}
        <p 
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Click the link in your email to verify your account. 
          If you don't see it, check your spam folder.
        </p>

        {/* Success message */}
        {resent && (
          <div 
            className="px-4 py-3 rounded-lg text-sm"
            style={{ 
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              color: 'var(--success)'
            }}
          >
            Verification email sent!
          </div>
        )}

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={resending || countdown > 0}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending 
            ? 'Sending...' 
            : countdown > 0 
              ? `Resend in ${countdown}s` 
              : "Didn't receive it? Resend email"
          }
        </button>

        {/* Divider */}
        <div 
          className="border-t my-6"
          style={{ borderColor: 'var(--border-primary)' }}
        />

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
