import { useState } from 'react'
import SignUpForm from './SignUpForm'
import SignInForm from './SignInForm'
import VerifyEmailForm from './VerifyEmailForm'
import ForgotPasswordForm from './ForgotPasswordForm'
import { TermsOfService } from '../legal/TermsOfService'
import { PrivacyPolicy } from '../legal/PrivacyPolicy'

type AuthView = 'signin' | 'signup' | 'verify' | 'forgot'
type LegalModal = 'tos' | 'privacy' | null

interface AuthScreenProps {
  onAuthenticated: () => void
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [view, setView] = useState<AuthView>('signin')
  const [pendingEmail, setPendingEmail] = useState('')
  const [legalModal, setLegalModal] = useState<LegalModal>(null)

  const handleNavigate = (newView: AuthView, email?: string) => {
    if (email) {
      setPendingEmail(email)
    }
    setView(newView)
  }

  // Legal Modal
  const LegalModalComponent = () => {
    if (!legalModal) return null
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.7)' }}
        onClick={() => setLegalModal(null)}
      >
        <div 
          className="relative max-h-[90vh] overflow-auto rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setLegalModal(null)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            ✕
          </button>
          {legalModal === 'tos' ? <TermsOfService /> : <PrivacyPolicy />}
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (view) {
      case 'signup':
        return (
          <SignUpForm 
            onNavigate={handleNavigate}
            onShowTos={() => setLegalModal('tos')}
            onShowPrivacy={() => setLegalModal('privacy')}
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

  return (
    <>
      {renderView()}
      <LegalModalComponent />
    </>
  )
}
