import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://crmimpveipjwwaqicwxx.supabase.co'
const supabaseAnonKey = 'sb_publishable_Fsa_eJ592Mr10Z4cN0j5rQ_47G-YMA2'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Type for user profile (extends Supabase auth user)
export interface UserProfile {
  id: string
  email: string
  display_name?: string
  created_at: string
  updated_at: string
  subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'deleted'
  subscription_plan: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  current_period_end?: string
  trial_ends_at?: string
  loveos_tokens: number
  covenant_accepted_at?: string
}
