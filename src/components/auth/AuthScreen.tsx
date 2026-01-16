import { useState } from 'react'
import SignUpForm from './SignUpForm'
import SignInForm from './SignInForm'
import VerifyEmailForm from './VerifyEmailForm'
import ForgotPasswordForm from './ForgotPasswordForm'

type AuthView = 'signin' | 'signup' | 'verify' | 'forgot'

interface AuthScreenProps {
  onAuthenticated: () => void
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [view, setView] = useState<AuthView>('signin')
  const [pendingEmail, setPendingEmail] = useState('')

  const handleNavigate = (newView: AuthView, email?: string) => {
    if (email) {
      setPendingEmail(email)
    }
    setView(newView)
  }

  switch (view) {
    case 'signup':
      return (
        <SignUpForm 
          onNavigate={handleNavigate}
        />
      )
    case 'verify':
      return (
        <VerifyEmailForm 
          email={pendingEmail}
          onNavigate={handleNavigate}
        />
      )
    case 'forgot':
      return (
        <ForgotPasswordForm 
          onNavigate={handleNavigate}
        />
      )
    case 'signin':
    default:
      return (
        <SignInForm 
          onNavigate={handleNavigate}
          onSuccess={onAuthenticated}
        />
      )
  }
}
