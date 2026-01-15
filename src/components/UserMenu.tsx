/**
 * UserMenu - Account dropdown for Jett
 * Features: Logout, Change Password, Account Info, Manage Subscription
 */

import { useState, useRef, useEffect } from 'react'
import { useAuth, useSubscription } from '../contexts/AuthContext'

// Stripe Customer Portal - users manage subscription here
const STRIPE_CUSTOMER_PORTAL = 'https://billing.stripe.com/p/login/test_9B69AT1Bn1Tp7MQdnPb7y00'

export default function UserMenu() {
  const { user, signOut, resetPassword } = useAuth()
  const { status, isActive, isTrialing, trialDaysLeft, isPastDue } = useSubscription()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [passwordResetSent, setPasswordResetSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user?.email) return
    
    setResetError(null)
    const { error } = await resetPassword(user.email)
    
    if (error) {
      setResetError(error.message)
    } else {
      setPasswordResetSent(true)
    }
  }

  const handleManageSubscription = () => {
    // Open Stripe Customer Portal with prefilled email
    const url = new URL(STRIPE_CUSTOMER_PORTAL)
    if (user?.email) {
      url.searchParams.set('prefilled_email', user.email)
    }
    window.jett?.openExternal(url.toString())
    setIsOpen(false)
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.email) return '?'
    return user.email.charAt(0).toUpperCase()
  }

  // Get status display
  const getStatusDisplay = () => {
    if (isActive) return { text: 'Active', color: 'var(--success)', icon: '✓' }
    if (isTrialing) return { text: `Trial (${trialDaysLeft} days left)`, color: 'var(--accent-primary)', icon: '⏳' }
    if (isPastDue) return { text: 'Payment Failed', color: 'var(--error)', icon: '!' }
    return { text: status || 'Unknown', color: 'var(--text-tertiary)', icon: '?' }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-150"
        style={{ 
          background: 'var(--accent-primary)',
          color: 'white'
        }}
        title={user?.email || 'Account'}
      >
        {getInitials()}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-72 rounded-lg shadow-lg overflow-hidden z-50"
          style={{ 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)'
          }}
        >
          {/* Email Header */}
          <div 
            className="px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-primary)' }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium"
                style={{ background: 'var(--accent-primary)', color: 'white' }}
              >
                {getInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user?.email}
                </p>
                <p 
                  className="text-xs flex items-center gap-1"
                  style={{ color: statusDisplay.color }}
                >
                  <span>{statusDisplay.icon}</span>
                  {statusDisplay.text}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Change Password */}
            <button
              onClick={handleChangePassword}
              disabled={passwordResetSent}
              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
              style={{ 
                color: passwordResetSent ? 'var(--success)' : 'var(--text-primary)',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!passwordResetSent) e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              {passwordResetSent ? 'Check your email ✓' : 'Change Password'}
            </button>

            {resetError && (
              <p className="px-4 py-1 text-xs" style={{ color: 'var(--error)' }}>
                {resetError}
              </p>
            )}

            {/* Manage Subscription */}
            <button
              onClick={handleManageSubscription}
              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
              style={{ 
                color: 'var(--text-primary)',
                background: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Manage Subscription
              <svg 
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="ml-auto opacity-50"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </button>

            {/* Divider */}
            <div 
              className="my-1"
              style={{ borderTop: '1px solid var(--border-primary)' }}
            />

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
              style={{ 
                color: 'var(--error)',
                background: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
