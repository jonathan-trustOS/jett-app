/**
 * AI Prompts for Jett Build System
 * Centralized prompt management with dynamic context injection
 */

// Check if Supabase is configured
export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = localStorage.getItem('supabase_url')
  const anonKey = localStorage.getItem('supabase_anon_key')
  
  if (url && anonKey) {
    return { url, anonKey }
  }
  return null
}

// Generate Supabase context for prompts
function getSupabaseContext(): string {
  const config = getSupabaseConfig()
  
  if (!config) {
    return ''
  }
  
  return `

SUPABASE DATABASE AVAILABLE:
The user has configured Supabase for data persistence. When the app needs to store or retrieve data:

- Import: import { createClient } from '@supabase/supabase-js'
- Initialize client in a lib/supabase.ts file:
  const supabase = createClient('${config.url}', '${config.anonKey}')
  export { supabase }
- Use supabase.from('table').select/insert/update/delete for data operations
- Assume tables will be created by the user in Supabase dashboard
- Include TypeScript types that match the database schema
- Use React Query or simple useState for data fetching patterns

When building features that need data persistence (user data, saved items, settings, etc.):
- Generate the Supabase client setup
- Create typed database operations
- Include loading and error states
- Add helpful comments about which tables need to be created`
}

// Base system prompt for code generation
export function getSystemPrompt(): string {
  const supabaseContext = getSupabaseContext()
  
  return `You are a code generator. Output files using this EXACT format:

---FILE-START path="filepath"---
file content
---FILE-END---

RULES:
- Use React 18 + TypeScript + Tailwind CSS
- Dark theme (gray-800/900 backgrounds, gray-100 text)
- Import types from '@/types'
- Import shared UI from '@/components/ui'
- Every file must be complete and runnable${supabaseContext}`
}

// Check if database features should be suggested
export function shouldSuggestDatabase(): boolean {
  return getSupabaseConfig() !== null
}
