/**
 * Jett Learning Database
 * Phase 1: Local SQLite-based learning system
 */

import path from 'path'
import fs from 'fs'
import { app } from 'electron'

// We'll use a simple JSON-based storage for Phase 1
// Can upgrade to better-sqlite3 in Phase 2 for vectors
const DATA_DIR = path.join(app.getPath('userData'), 'learning')
const DB_FILE = path.join(DATA_DIR, 'learning.json')

// Types
export interface ProjectContext {
  projectId: string
  tailwind: {
    colors: string[]
    components: string[]
    layout: string[]
  }
  components: {
    name: string
    file: string
    purpose: string
  }[]
  conventions: {
    stateManagement: string
    styling: string
    icons: string
  }
  fileMap: { [path: string]: string }
  updatedAt: string
}

export interface CodePattern {
  id: string
  trigger: string
  keywords: string[]
  appType: string
  code: string
  explanation: string
  useCount: number
  successCount: number
  failCount: number
  confidence: number
  source: 'extracted' | 'manual' | 'suggestion'
  createdAt: string
  lastUsedAt: string
  invalidated: boolean
}

export interface SuggestionOutcome {
  id: string
  category: string
  title: string
  description: string
  appType: string
  prdFeatures: string[]
  timesShown: number
  timesSelected: number
  timesSucceeded: number
  selectionRate: number
  successRate: number
  confidence: number
  createdAt: string
  lastShownAt: string
}

export interface LearningDatabase {
  projectContexts: { [projectId: string]: ProjectContext }
  codePatterns: CodePattern[]
  suggestionOutcomes: SuggestionOutcome[]
  metadata: {
    version: number
    createdAt: string
    lastUpdated: string
  }
}

// Initialize empty database
function createEmptyDatabase(): LearningDatabase {
  return {
    projectContexts: {},
    codePatterns: [],
    suggestionOutcomes: seedSuggestionOutcomes(),
    metadata: {
      version: 1,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  }
}

// Seed with initial suggestions
function seedSuggestionOutcomes(): SuggestionOutcome[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'seed-a11y-focus',
      category: 'Accessibility',
      title: 'Add focus states to buttons',
      description: 'Buttons lack visible focus indicators for keyboard navigation',
      appType: 'any',
      prdFeatures: [],
      timesShown: 0,
      timesSelected: 0,
      timesSucceeded: 0,
      selectionRate: 0,
      successRate: 0,
      confidence: 0.5,
      createdAt: now,
      lastShownAt: now
    },
    {
      id: 'seed-ux-loading',
      category: 'UX',
      title: 'Add loading indicators',
      description: 'No feedback when actions are processing',
      appType: 'any',
      prdFeatures: [],
      timesShown: 0,
      timesSelected: 0,
      timesSucceeded: 0,
      selectionRate: 0,
      successRate: 0,
      confidence: 0.5,
      createdAt: now,
      lastShownAt: now
    },
    {
      id: 'seed-perf-images',
      category: 'Performance',
      title: 'Optimize image loading',
      description: 'Add lazy loading for images to improve initial page load',
      appType: 'any',
      prdFeatures: [],
      timesShown: 0,
      timesSelected: 0,
      timesSucceeded: 0,
      selectionRate: 0,
      successRate: 0,
      confidence: 0.5,
      createdAt: now,
      lastShownAt: now
    },
    {
      id: 'seed-ux-keyboard',
      category: 'UX',
      title: 'Add keyboard shortcuts',
      description: 'Allow power users to navigate with keyboard',
      appType: 'any',
      prdFeatures: [],
      timesShown: 0,
      timesSelected: 0,
      timesSucceeded: 0,
      selectionRate: 0,
      successRate: 0,
      confidence: 0.4,
      createdAt: now,
      lastShownAt: now
    },
    {
      id: 'seed-polish-transitions',
      category: 'Polish',
      title: 'Add smooth transitions',
      description: 'Animations between states improve perceived quality',
      appType: 'any',
      prdFeatures: [],
      timesShown: 0,
      timesSelected: 0,
      timesSucceeded: 0,
      selectionRate: 0,
      successRate: 0,
      confidence: 0.4,
      createdAt: now,
      lastShownAt: now
    },
    {
      id: 'seed-polish-empty',
      category: 'Polish',
      title: 'Improve empty states',
      description: 'Add helpful illustrations and guidance when no data',
      appType: 'any',
      prdFeatures: [],
      timesShown: 0,
      timesSelected: 0,
      timesSucceeded: 0,
      selectionRate: 0,
      successRate: 0,
      confidence: 0.4,
      createdAt: now,
      lastShownAt: now
    },
    {
      id: 'seed-a11y-contrast',
      category: 'Accessibility',
      title: 'Improve color contrast',
      description: 'Some text may be hard to read for users with visual impairments',
      appType: 'any',
      prdFeatures: [],
      timesShown: 0,
      timesSelected: 0,
      timesSucceeded: 0,
      selectionRate: 0,
      successRate: 0,
      confidence: 0.45,
      createdAt: now,
      lastShownAt: now
    },
    {
      id: 'seed-responsive-mobile',
      category: 'Responsive',
      title: 'Improve mobile layout',
      description: 'Content may overflow on screens below 375px',
      appType: 'any',
      prdFeatures: [],
      timesShown: 0,
      timesSelected: 0,
      timesSucceeded: 0,
      selectionRate: 0,
      successRate: 0,
      confidence: 0.45,
      createdAt: now,
      lastShownAt: now
    },
    {
      id: 'seed-ux-feedback',
      category: 'UX',
      title: 'Add success/error feedback',
      description: 'Users need confirmation when actions complete',
      appType: 'any',
      prdFeatures: [],
      timesShown: 0,
      timesSelected: 0,
      timesSucceeded: 0,
      selectionRate: 0,
      successRate: 0,
      confidence: 0.5,
      createdAt: now,
      lastShownAt: now
    },
    {
      id: 'seed-perf-bundle',
      category: 'Performance',
      title: 'Optimize bundle size',
      description: 'Remove unused dependencies to improve load time',
      appType: 'any',
      prdFeatures: [],
      timesShown: 0,
      timesSelected: 0,
      timesSucceeded: 0,
      selectionRate: 0,
      successRate: 0,
      confidence: 0.35,
      createdAt: now,
      lastShownAt: now
    }
  ]
}

// Database singleton
let db: LearningDatabase | null = null

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Load database
export function loadDatabase(): LearningDatabase {
  if (db) return db
  
  ensureDataDir()
  
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8')
      db = JSON.parse(data)
      return db!
    } catch (e) {
      console.error('Failed to load learning database, creating new:', e)
    }
  }
  
  db = createEmptyDatabase()
  saveDatabase()
  return db
}

// Save database
export function saveDatabase(): void {
  if (!db) return
  
  ensureDataDir()
  db.metadata.lastUpdated = new Date().toISOString()
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

// Project Context operations
export function getProjectContext(projectId: string): ProjectContext | null {
  const db = loadDatabase()
  return db.projectContexts[projectId] || null
}

export function saveProjectContext(context: ProjectContext): void {
  const db = loadDatabase()
  db.projectContexts[context.projectId] = context
  saveDatabase()
}

export function updateProjectContext(
  projectId: string, 
  updates: Partial<ProjectContext>
): ProjectContext {
  const db = loadDatabase()
  const existing = db.projectContexts[projectId] || {
    projectId,
    tailwind: { colors: [], components: [], layout: [] },
    components: [],
    conventions: { stateManagement: '', styling: '', icons: '' },
    fileMap: {},
    updatedAt: new Date().toISOString()
  }
  
  const updated: ProjectContext = {
    ...existing,
    ...updates,
    projectId,
    updatedAt: new Date().toISOString()
  }
  
  // Merge arrays instead of replacing
  if (updates.tailwind) {
    updated.tailwind = {
      colors: [...new Set([...existing.tailwind.colors, ...(updates.tailwind.colors || [])])],
      components: [...new Set([...existing.tailwind.components, ...(updates.tailwind.components || [])])],
      layout: [...new Set([...existing.tailwind.layout, ...(updates.tailwind.layout || [])])]
    }
  }
  
  if (updates.components) {
    const existingNames = new Set(existing.components.map(c => c.name))
    const newComponents = updates.components.filter(c => !existingNames.has(c.name))
    updated.components = [...existing.components, ...newComponents]
  }
  
  db.projectContexts[projectId] = updated
  saveDatabase()
  return updated
}

// Code Pattern operations
export function addCodePattern(pattern: Omit<CodePattern, 'id' | 'createdAt' | 'lastUsedAt'>): CodePattern {
  const db = loadDatabase()
  const newPattern: CodePattern = {
    ...pattern,
    id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString()
  }
  db.codePatterns.push(newPattern)
  saveDatabase()
  return newPattern
}

export function findPatterns(options: {
  keywords?: string[]
  appType?: string
  minConfidence?: number
  limit?: number
}): CodePattern[] {
  const db = loadDatabase()
  let patterns = db.codePatterns.filter(p => !p.invalidated)
  
  if (options.minConfidence !== undefined) {
    patterns = patterns.filter(p => p.confidence >= options.minConfidence!)
  }
  
  if (options.appType && options.appType !== 'any') {
    patterns = patterns.filter(p => p.appType === 'any' || p.appType === options.appType)
  }
  
  if (options.keywords && options.keywords.length > 0) {
    const keywordSet = new Set(options.keywords.map(k => k.toLowerCase()))
    patterns = patterns.map(p => ({
      pattern: p,
      score: p.keywords.filter(k => keywordSet.has(k.toLowerCase())).length
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ pattern }) => pattern)
  }
  
  // Sort by confidence
  patterns.sort((a, b) => b.confidence - a.confidence)
  
  if (options.limit) {
    patterns = patterns.slice(0, options.limit)
  }
  
  return patterns
}

export function updatePatternConfidence(
  patternId: string, 
  success: boolean
): void {
  const db = loadDatabase()
  const pattern = db.codePatterns.find(p => p.id === patternId)
  if (!pattern) return
  
  pattern.useCount++
  if (success) {
    pattern.successCount++
  } else {
    pattern.failCount++
  }
  pattern.confidence = pattern.successCount / (pattern.successCount + pattern.failCount)
  pattern.lastUsedAt = new Date().toISOString()
  
  // Auto-invalidate if confidence drops too low
  if (pattern.confidence < 0.2 && pattern.useCount >= 5) {
    pattern.invalidated = true
  }
  
  saveDatabase()
}

// Suggestion Outcome operations
export function getSuggestionOutcomes(options: {
  appType?: string
  minConfidence?: number
  limit?: number
}): SuggestionOutcome[] {
  const db = loadDatabase()
  let suggestions = [...db.suggestionOutcomes]
  
  if (options.minConfidence !== undefined) {
    suggestions = suggestions.filter(s => s.confidence >= options.minConfidence!)
  }
  
  if (options.appType && options.appType !== 'any') {
    suggestions = suggestions.filter(s => s.appType === 'any' || s.appType === options.appType)
  }
  
  // Sort by confidence, then by successRate
  suggestions.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence
    return b.successRate - a.successRate
  })
  
  if (options.limit) {
    suggestions = suggestions.slice(0, options.limit)
  }
  
  return suggestions
}

export function recordSuggestionShown(suggestionId: string): void {
  const db = loadDatabase()
  const suggestion = db.suggestionOutcomes.find(s => s.id === suggestionId)
  if (!suggestion) return
  
  suggestion.timesShown++
  suggestion.lastShownAt = new Date().toISOString()
  recalculateSuggestionConfidence(suggestion)
  saveDatabase()
}

export function recordSuggestionSelected(
  suggestionId: string, 
  succeeded: boolean
): void {
  const db = loadDatabase()
  const suggestion = db.suggestionOutcomes.find(s => s.id === suggestionId)
  if (!suggestion) return
  
  suggestion.timesSelected++
  if (succeeded) {
    suggestion.timesSucceeded++
  }
  recalculateSuggestionConfidence(suggestion)
  saveDatabase()
}

function recalculateSuggestionConfidence(suggestion: SuggestionOutcome): void {
  suggestion.selectionRate = suggestion.timesShown > 0 
    ? suggestion.timesSelected / suggestion.timesShown 
    : 0
  suggestion.successRate = suggestion.timesSelected > 0 
    ? suggestion.timesSucceeded / suggestion.timesSelected 
    : 0
  
  // Confidence = weighted combination of selection rate and success rate
  // With a base confidence that decays as we get more data
  const dataWeight = Math.min(suggestion.timesShown / 10, 1)
  const baseConfidence = 0.5 * (1 - dataWeight)
  const dataConfidence = (suggestion.selectionRate * 0.3 + suggestion.successRate * 0.7) * dataWeight
  
  suggestion.confidence = baseConfidence + dataConfidence
}

export function addSuggestionOutcome(suggestion: Omit<SuggestionOutcome, 'id' | 'createdAt' | 'lastShownAt' | 'selectionRate' | 'successRate' | 'confidence'>): SuggestionOutcome {
  const db = loadDatabase()
  const newSuggestion: SuggestionOutcome = {
    ...suggestion,
    id: `sug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    selectionRate: 0,
    successRate: 0,
    confidence: 0.5,
    createdAt: new Date().toISOString(),
    lastShownAt: new Date().toISOString()
  }
  db.suggestionOutcomes.push(newSuggestion)
  saveDatabase()
  return newSuggestion
}

// Stats
export function getLearningStats(): {
  totalPatterns: number
  validPatterns: number
  avgPatternConfidence: number
  totalSuggestions: number
  avgSuggestionConfidence: number
  projectsLearned: number
} {
  const db = loadDatabase()
  
  const validPatterns = db.codePatterns.filter(p => !p.invalidated)
  const avgPatternConfidence = validPatterns.length > 0
    ? validPatterns.reduce((sum, p) => sum + p.confidence, 0) / validPatterns.length
    : 0
  
  const avgSuggestionConfidence = db.suggestionOutcomes.length > 0
    ? db.suggestionOutcomes.reduce((sum, s) => sum + s.confidence, 0) / db.suggestionOutcomes.length
    : 0
  
  return {
    totalPatterns: db.codePatterns.length,
    validPatterns: validPatterns.length,
    avgPatternConfidence,
    totalSuggestions: db.suggestionOutcomes.length,
    avgSuggestionConfidence,
    projectsLearned: Object.keys(db.projectContexts).length
  }
}
