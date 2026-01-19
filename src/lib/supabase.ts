import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://crmimpveipjwwaqicwxx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybWltcHZlaXBqd3dhcWljd3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjkzMTUsImV4cCI6MjA4Mzk0NTMxNX0.nAzzSLvMkJxGr2kmrbeN5G3t8QRYMP10TA6fM61EHdY'

// Storage key used by Supabase
export const STORAGE_KEY = 'sb-crmimpveipjwwaqicwxx-auth-token'

// Use default localStorage - NO async storage adapter
// Async storage adapters break Supabase's internal session management
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
    // storage: NOT specified = uses localStorage (sync, works properly)
  }
})

// User profile type
export interface UserProfile {
  id: string
  email: string
  subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'incomplete'
  trial_ends_at: string | null
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export { supabaseUrl, supabaseAnonKey }
