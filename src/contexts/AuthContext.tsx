import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, UserProfile } from '../lib/supabase'

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
      
      // Try by email first (more reliable for our setup)
      if (email) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single()

        if (!error && data) {
          console.log('Profile found:', data.subscription_status)
          setState(prev => ({ ...prev, profile: data as UserProfile }))
          return
        }
        console.log('Profile fetch by email failed:', error?.message)
      }

      // Fallback to ID
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        console.log('Profile found by ID:', data.subscription_status)
        setState(prev => ({ ...prev, profile: data as UserProfile }))
      } else {
        console.log('Profile fetch by ID failed:', error?.message)
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
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
          console.log('Session found for:', session.user.email)
          // Set user immediately - don't wait for profile
          setState({
            user: session.user,
            profile: null, // Will be filled in by background fetch
            session,
            loading: false,
            initialized: true
          })
          // Fetch profile in background
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

        if (session?.user) {
          // Set user immediately
          setState(prev => ({
            ...prev,
            user: session.user,
            session,
            loading: false,
            initialized: true
          }))
          // Fetch profile in background
          fetchProfileInBackground(session.user.id, session.user.email || undefined)
        } else {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: true
          })
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
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    setState(prev => ({ ...prev, loading: false }))
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }))
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setState(prev => ({ ...prev, loading: false }))
    return { error }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
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
  
  // If profile hasn't loaded yet, assume active (don't block the user)
  const status = profile?.subscription_status || 'active'
  
  const isActive = status === 'active'
  const isTrialing = status === 'trialing'
  const isPastDue = status === 'past_due'
  const isCancelled = status === 'cancelled'
  
  const canUseApp = isActive || isTrialing || isPastDue || !profile // Allow if profile not loaded
  
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
