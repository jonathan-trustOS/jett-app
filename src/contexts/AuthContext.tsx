import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, UserProfile, STORAGE_KEY } from '../lib/supabase'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  initialized: boolean
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  resendVerification: (email: string) => Promise<{ error: AuthError | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mirror session to electron-store (for persistence across app restarts)
async function mirrorToElectronStore(session: Session | null) {
  if (!window.jett?.auth?.setSession) return
  
  try {
    if (session) {
      // Store the full session object (same format Supabase uses)
      await window.jett.auth.setSession(STORAGE_KEY, JSON.stringify(session))
      console.log('✓ Session mirrored to electron-store')
    } else {
      await window.jett.auth.removeSession(STORAGE_KEY)
      console.log('✓ Session removed from electron-store')
    }
  } catch (err) {
    console.warn('Failed to mirror session to electron-store:', err)
  }
}

// Restore session from electron-store to localStorage (called once on init)
async function restoreFromElectronStore(): Promise<boolean> {
  if (!window.jett?.auth?.getSession) return false
  
  try {
    // Check if localStorage already has a session
    const existingSession = localStorage.getItem(STORAGE_KEY)
    if (existingSession) {
      console.log('Session already in localStorage')
      return true
    }
    
    // Try to restore from electron-store
    const stored = await window.jett.auth.getSession(STORAGE_KEY)
    if (stored) {
      // Copy to localStorage so Supabase can find it
      localStorage.setItem(STORAGE_KEY, stored)
      console.log('✓ Session restored from electron-store to localStorage')
      return true
    }
    
    return false
  } catch (err) {
    console.warn('Failed to restore from electron-store:', err)
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    initialized: false
  })

  // Fetch profile - non-blocking, updates state when done
  const fetchProfileInBackground = async (userId: string, email?: string) => {
    try {
      console.log('Fetching profile for:', email || userId)
      
      // Try by email first
      if (email) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle()

        if (!error && data) {
          console.log('Profile found:', data.subscription_status)
          setState(prev => ({ ...prev, profile: data as UserProfile }))
          return
        }
        if (error) {
          console.log('Profile fetch by email error:', error.message)
        } else {
          console.log('No profile found for email')
        }
      }

      // Fallback to ID
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!error && data) {
        console.log('Profile found by ID:', data.subscription_status)
        setState(prev => ({ ...prev, profile: data as UserProfile }))
      } else if (error) {
        console.log('Profile fetch by ID error:', error.message)
      } else {
        console.log('No profile found for ID - continuing without profile')
      }
    } catch (err) {
      console.error('Profile fetch exception:', err)
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // STEP 1: Restore session from electron-store to localStorage
        await restoreFromElectronStore()
        
        // STEP 2: Now Supabase can find it in localStorage
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Session error:', error)
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: true
          })
          return
        }

        if (session?.user) {
          console.log('✓ Session found for:', session.user.email)
          setState({
            user: session.user,
            profile: null,
            session,
            loading: false,
            initialized: true
          })
          fetchProfileInBackground(session.user.id, session.user.email || undefined)
        } else {
          console.log('No session found')
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: true
          })
        }
      } catch (err) {
        console.error('Auth init error:', err)
        if (mounted) {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: true
          })
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        
        if (!mounted) return

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Mirror to electron-store for persistence
          await mirrorToElectronStore(session)
          
          if (session?.user) {
            setState(prev => ({
              ...prev,
              user: session.user,
              session,
              loading: false,
              initialized: true
            }))
            fetchProfileInBackground(session.user.id, session.user.email || undefined)
          }
        } else if (event === 'SIGNED_OUT') {
          // Only trust explicit sign outs
          console.log('Ignoring SIGNED_OUT event from listener')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Auth methods
  const signUp = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }))
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    // Mirror session to electron-store
    if (data.session) {
      await mirrorToElectronStore(data.session)
    }

    // Record ToS acceptance timestamp
    if (!error && data.user) {
      try {
        await supabase
          .from('profiles')
          .update({ tos_accepted_at: new Date().toISOString() })
          .eq('id', data.user.id)
        console.log('✓ ToS acceptance recorded')
      } catch (tosError) {
        console.warn('Failed to record ToS acceptance:', tosError)
        // Don't fail signup if ToS update fails
      }
    }

    setState(prev => ({ ...prev, loading: false }))
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }))
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    // Mirror session to electron-store
    if (data.session) {
      await mirrorToElectronStore(data.session)
    }

    setState(prev => ({ ...prev, loading: false }))
    return { error }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    // Clear from electron-store
    await mirrorToElectronStore(null)
    
    await supabase.auth.signOut()
    setState({
      user: null,
      profile: null,
      session: null,
      loading: false,
      initialized: true
    })
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    })
    return { error }
  }

  const refreshProfile = async () => {
    if (state.user) {
      await fetchProfileInBackground(state.user.id, state.user.email || undefined)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        resendVerification,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook to check subscription status
export function useSubscription() {
  const { profile } = useAuth()
  
  const status = profile?.subscription_status || 'active'
  
  const isActive = status === 'active'
  const isTrialing = status === 'trialing'
  const isPastDue = status === 'past_due'
  const isCancelled = status === 'cancelled'
  
  const canUseApp = isActive || isTrialing || isPastDue || !profile
  
  const trialDaysLeft = profile?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return {
    isActive,
    isTrialing,
    isPastDue,
    isCancelled,
    canUseApp,
    trialDaysLeft,
    status: profile?.subscription_status || null
  }
}
