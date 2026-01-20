/**
 * AI Prompts for Jett Build System
 * Centralized prompt management with dynamic context injection
 */

// ============================================
// DATABASE CONFIGURATIONS
// ============================================

// Check if Supabase is configured
export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = localStorage.getItem('supabase_url')
  const anonKey = localStorage.getItem('supabase_anon_key')
  
  if (url && anonKey) {
    return { url, anonKey }
  }
  return null
}

// Check if Convex is configured
export function getConvexConfig(): { url: string } | null {
  const url = localStorage.getItem('convex_url')
  
  if (url) {
    return { url }
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

// Generate Convex context for prompts
function getConvexContext(): string {
  const config = getConvexConfig()
  
  if (!config) {
    return ''
  }
  
  return `

CONVEX DATABASE AVAILABLE:
The user has configured Convex for real-time data persistence. When the app needs to store or retrieve data:

- Install: npm install convex
- Create convex/ folder with schema.ts and functions
- Initialize in lib/convex.ts:
  import { ConvexProvider, ConvexReactClient } from "convex/react"
  const convex = new ConvexReactClient('${config.url}')
- Wrap app in <ConvexProvider client={convex}>
- Use useQuery() and useMutation() hooks for data operations
- Define schema in convex/schema.ts
- Create queries in convex/[table].ts files

When building features that need data persistence:
- Generate the Convex client setup
- Create schema definitions with proper types
- Use optimistic updates for better UX
- Include loading states with useQuery
- Convex handles real-time sync automatically`
}

// Get combined database context
function getDatabaseContext(): string {
  const supabase = getSupabaseContext()
  const convex = getConvexContext()
  
  // If both configured, prefer the one most recently set (or Supabase as default)
  if (supabase && convex) {
    return supabase + '\n\nNote: Convex is also configured but Supabase will be used as the primary database.'
  }
  
  return supabase || convex
}

// ============================================
// COMPLETION SIGNALS
// ============================================

// Completion signal markers for structured AI responses
export const COMPLETION_MARKERS = {
  SUCCESS: '---TASK-COMPLETE---',
  FAILED: '---TASK-FAILED',
  // Pattern: ---TASK-FAILED reason="error message"---
}

// Parse completion signal from AI response
export function parseCompletionSignal(response: string): {
  complete: boolean
  success: boolean
  reason?: string
} {
  // Check for success
  if (response.includes(COMPLETION_MARKERS.SUCCESS)) {
    return { complete: true, success: true }
  }
  
  // Check for failure with reason
  const failMatch = response.match(/---TASK-FAILED\s+reason="([^"]+)"---/)
  if (failMatch) {
    return { complete: true, success: false, reason: failMatch[1] }
  }
  
  // Check for failure without reason
  if (response.includes(COMPLETION_MARKERS.FAILED)) {
    return { complete: true, success: false, reason: 'Unknown error' }
  }
  
  // No completion signal found - infer from file output
  return { complete: false, success: false }
}

// ============================================
// SYSTEM PROMPT
// ============================================

// Base system prompt for code generation
export function getSystemPrompt(): string {
  const databaseContext = getDatabaseContext()
  
  return `You are a code generator. Output files using this EXACT format:

---FILE-START path="filepath"---
file content
---FILE-END---

RULES:
- Use React 18 + TypeScript + Tailwind CSS
- Dark theme (gray-800/900 backgrounds, gray-100 text)
- Import types from '@/types'
- Import shared UI from '@/components/ui'
- Every file must be complete and runnable
${databaseContext}

COMPLETION SIGNALS:
After generating all files for a task, you MUST end your response with ONE of:

If successful:
---TASK-COMPLETE---

If you cannot complete the task:
---TASK-FAILED reason="brief explanation"---

Always include a completion signal. This helps track build progress.`
}

// Check if any database is configured
export function shouldSuggestDatabase(): boolean {
  return getSupabaseConfig() !== null || getConvexConfig() !== null
}

// Get which database is configured
export function getConfiguredDatabase(): 'supabase' | 'convex' | null {
  if (getSupabaseConfig()) return 'supabase'
  if (getConvexConfig()) return 'convex'
  return null
}

// ============================================
// MODEL ROUTING
// ============================================

/**
 * Model routing for cost optimization
 * Uses cheaper/faster models for templated tasks, premium models for complex reasoning
 */
export type BuildStepType = 'contracts' | 'shell' | 'shared' | 'module' | 'integration' | 'simplify'

interface ModelConfig {
  provider: string
  model: string
}

// Get the appropriate model for a build step type
export function getModelForStep(
  stepType: BuildStepType,
  defaultProvider: string,
  defaultModel: string
): ModelConfig {
  // Check if cheaper models are enabled
  const useCheaperModels = getBuildSettings().useCheaperModels
  
  if (!useCheaperModels) {
    return { provider: defaultProvider, model: defaultModel }
  }
  
  // Templated/simple tasks - use Haiku (fast, cheap)
  const simpleSteps: BuildStepType[] = ['contracts', 'shell', 'shared', 'integration']
  
  if (simpleSteps.includes(stepType)) {
    // Use Haiku for simple templated tasks
    if (defaultProvider === 'anthropic') {
      return { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' }
    }
    // For OpenRouter, use a cheaper model
    if (defaultProvider === 'openrouter') {
      return { provider: 'openrouter', model: 'anthropic/claude-haiku-4.5' }
    }
  }
  
  // Complex tasks (module building, simplification) - use default (usually Sonnet)
  return { provider: defaultProvider, model: defaultModel }
}

// ============================================
// BUILD SETTINGS
// ============================================

/**
 * Build settings - stored in localStorage
 */
interface BuildSettings {
  maxIterations: number      // Max auto-fix attempts (default 3)
  useCheaperModels: boolean  // Use Haiku for simple steps
  writeProgressLog: boolean  // Write PROGRESS.md during build
}

const DEFAULT_BUILD_SETTINGS: BuildSettings = {
  maxIterations: 3,
  useCheaperModels: true,
  writeProgressLog: true
}

export function getBuildSettings(): BuildSettings {
  try {
    const saved = localStorage.getItem('jett-build-settings')
    if (saved) {
      return { ...DEFAULT_BUILD_SETTINGS, ...JSON.parse(saved) }
    }
  } catch (e) {}
  return DEFAULT_BUILD_SETTINGS
}

export function saveBuildSettings(settings: Partial<BuildSettings>): void {
  const current = getBuildSettings()
  const updated = { ...current, ...settings }
  localStorage.setItem('jett-build-settings', JSON.stringify(updated))
}
