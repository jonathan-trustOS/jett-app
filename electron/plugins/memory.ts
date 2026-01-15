/**
 * Jett Memory Plugin
 * Persists user preferences across sessions
 * 
 * Stores:
 * - Global preferences (apply to all projects)
 * - Per-project preferences (override global)
 * - Learned patterns from builds (extracted automatically)
 */

import fs from 'fs'
import path from 'path'
import { app } from 'electron'

// Types
export interface UserPreferences {
  // Design preferences
  preferredColors: string[]      // e.g., ['#6366f1', '#22c55e']
  avoidColors: string[]          // e.g., ['#000000', '#ffffff']
  preferredFonts: string[]       // e.g., ['Geist', 'Inter']
  avoidFonts: string[]           // e.g., ['Times New Roman']
  
  // Component preferences  
  buttonStyle: 'rounded' | 'square' | 'pill'
  cardStyle: 'flat' | 'elevated' | 'bordered'
  spacing: 'compact' | 'comfortable' | 'spacious'
  
  // Animation preferences
  animations: 'none' | 'subtle' | 'playful'
  transitions: boolean
  
  // Behavior preferences
  autoSimplify: boolean          // Run simplifier after each task
  autoVerify: boolean            // Auto-verify or wait for user
  darkMode: boolean
}

export interface ProjectMemory {
  projectId: string
  overrides: Partial<UserPreferences>
  learnedPatterns: string[]      // Tailwind classes used often
  componentRegistry: {           // Components created
    name: string
    path: string
    purpose: string
  }[]
  buildHistory: {
    timestamp: string
    taskCount: number
    success: boolean
  }[]
}

export interface MemoryDatabase {
  version: number
  global: UserPreferences
  projects: { [projectId: string]: ProjectMemory }
  lastUpdated: string
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  preferredColors: [],
  avoidColors: ['#000000', '#ffffff'],  // Avoid pure black/white
  preferredFonts: [],
  avoidFonts: ['Inter', 'Roboto', 'Open Sans'],  // Per Impeccable Design
  buttonStyle: 'rounded',
  cardStyle: 'elevated',
  spacing: 'comfortable',
  animations: 'subtle',
  transitions: true,
  autoSimplify: true,
  autoVerify: true,
  darkMode: true
}

// Database path
const getDbPath = () => {
  const configDir = path.join(app.getPath('userData'), 'jett')
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
  return path.join(configDir, 'memory.json')
}

// Load database
export function loadMemory(): MemoryDatabase {
  const dbPath = getDbPath()
  
  if (fs.existsSync(dbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
      return data
    } catch {
      // Corrupted file, return default
    }
  }
  
  // Create default database
  const db: MemoryDatabase = {
    version: 1,
    global: DEFAULT_PREFERENCES,
    projects: {},
    lastUpdated: new Date().toISOString()
  }
  
  saveMemory(db)
  return db
}

// Save database
export function saveMemory(db: MemoryDatabase): void {
  const dbPath = getDbPath()
  db.lastUpdated = new Date().toISOString()
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

// Get global preferences
export function getGlobalPreferences(): UserPreferences {
  const db = loadMemory()
  return { ...DEFAULT_PREFERENCES, ...db.global }
}

// Update global preferences
export function updateGlobalPreferences(
  updates: Partial<UserPreferences>
): { success: boolean; preferences: UserPreferences } {
  const db = loadMemory()
  db.global = { ...db.global, ...updates }
  saveMemory(db)
  return { success: true, preferences: db.global }
}

// Get project memory (with global fallback)
export function getProjectMemory(projectId: string): {
  preferences: UserPreferences
  memory: ProjectMemory | null
} {
  const db = loadMemory()
  const global = { ...DEFAULT_PREFERENCES, ...db.global }
  const projectMemory = db.projects[projectId] || null
  
  if (projectMemory) {
    return {
      preferences: { ...global, ...projectMemory.overrides },
      memory: projectMemory
    }
  }
  
  return { preferences: global, memory: null }
}

// Create or update project memory
export function updateProjectMemory(
  projectId: string,
  updates: Partial<ProjectMemory>
): { success: boolean } {
  const db = loadMemory()
  
  if (!db.projects[projectId]) {
    db.projects[projectId] = {
      projectId,
      overrides: {},
      learnedPatterns: [],
      componentRegistry: [],
      buildHistory: []
    }
  }
  
  db.projects[projectId] = {
    ...db.projects[projectId],
    ...updates
  }
  
  saveMemory(db)
  return { success: true }
}

// Learn from build (extract patterns)
export function learnFromBuild(
  projectId: string,
  code: string,
  success: boolean
): { success: boolean; patternsLearned: number } {
  const db = loadMemory()
  
  if (!db.projects[projectId]) {
    db.projects[projectId] = {
      projectId,
      overrides: {},
      learnedPatterns: [],
      componentRegistry: [],
      buildHistory: []
    }
  }
  
  // Extract Tailwind classes from code
  const classRegex = /className="([^"]+)"/g
  const classes = new Set<string>()
  let match
  
  while ((match = classRegex.exec(code)) !== null) {
    match[1].split(/\s+/).forEach(cls => {
      if (cls.length > 2) classes.add(cls)
    })
  }
  
  // Add to learned patterns (avoid duplicates)
  const existing = new Set(db.projects[projectId].learnedPatterns)
  let newPatterns = 0
  
  classes.forEach(cls => {
    if (!existing.has(cls)) {
      db.projects[projectId].learnedPatterns.push(cls)
      newPatterns++
    }
  })
  
  // Keep only most recent 100 patterns
  if (db.projects[projectId].learnedPatterns.length > 100) {
    db.projects[projectId].learnedPatterns = 
      db.projects[projectId].learnedPatterns.slice(-100)
  }
  
  // Record build
  db.projects[projectId].buildHistory.push({
    timestamp: new Date().toISOString(),
    taskCount: 1,
    success
  })
  
  // Keep only last 50 builds
  if (db.projects[projectId].buildHistory.length > 50) {
    db.projects[projectId].buildHistory = 
      db.projects[projectId].buildHistory.slice(-50)
  }
  
  saveMemory(db)
  return { success: true, patternsLearned: newPatterns }
}

// Register a component
export function registerComponent(
  projectId: string,
  name: string,
  filePath: string,
  purpose: string
): { success: boolean } {
  const db = loadMemory()
  
  if (!db.projects[projectId]) {
    db.projects[projectId] = {
      projectId,
      overrides: {},
      learnedPatterns: [],
      componentRegistry: [],
      buildHistory: []
    }
  }
  
  // Check if component already registered
  const existing = db.projects[projectId].componentRegistry
    .findIndex(c => c.name === name)
  
  if (existing >= 0) {
    db.projects[projectId].componentRegistry[existing] = { name, path: filePath, purpose }
  } else {
    db.projects[projectId].componentRegistry.push({ name, path: filePath, purpose })
  }
  
  saveMemory(db)
  return { success: true }
}

// Generate context string for AI prompts
export function generateMemoryContext(projectId: string): string {
  const { preferences, memory } = getProjectMemory(projectId)
  
  const lines: string[] = ['## User Preferences (Memory)']
  
  // Colors
  if (preferences.preferredColors.length > 0) {
    lines.push(`Preferred colors: ${preferences.preferredColors.join(', ')}`)
  }
  if (preferences.avoidColors.length > 0) {
    lines.push(`Avoid colors: ${preferences.avoidColors.join(', ')}`)
  }
  
  // Fonts
  if (preferences.preferredFonts.length > 0) {
    lines.push(`Preferred fonts: ${preferences.preferredFonts.join(', ')}`)
  }
  if (preferences.avoidFonts.length > 0) {
    lines.push(`Avoid fonts: ${preferences.avoidFonts.join(', ')}`)
  }
  
  // Styles
  lines.push(`Button style: ${preferences.buttonStyle}`)
  lines.push(`Card style: ${preferences.cardStyle}`)
  lines.push(`Spacing: ${preferences.spacing}`)
  lines.push(`Animations: ${preferences.animations}`)
  
  // Project-specific patterns
  if (memory && memory.learnedPatterns.length > 0) {
    const topPatterns = memory.learnedPatterns.slice(-20)
    lines.push(`\nCommon Tailwind classes in this project: ${topPatterns.join(', ')}`)
  }
  
  // Components
  if (memory && memory.componentRegistry.length > 0) {
    lines.push('\nExisting components:')
    memory.componentRegistry.forEach(c => {
      lines.push(`- ${c.name} (${c.path}): ${c.purpose}`)
    })
  }
  
  return lines.join('\n')
}

// Clear all memory
export function clearMemory(): { success: boolean } {
  const db: MemoryDatabase = {
    version: 1,
    global: DEFAULT_PREFERENCES,
    projects: {},
    lastUpdated: new Date().toISOString()
  }
  saveMemory(db)
  return { success: true }
}

// Clear project memory
export function clearProjectMemory(projectId: string): { success: boolean } {
  const db = loadMemory()
  delete db.projects[projectId]
  saveMemory(db)
  return { success: true }
}

// Get memory stats
export function getMemoryStats(): {
  globalPreferencesSet: number
  projectsWithMemory: number
  totalPatternsLearned: number
  totalComponentsRegistered: number
} {
  const db = loadMemory()
  
  const globalSet = Object.values(db.global).filter(v => 
    Array.isArray(v) ? v.length > 0 : v !== DEFAULT_PREFERENCES[v as keyof UserPreferences]
  ).length
  
  const projectIds = Object.keys(db.projects)
  const totalPatterns = projectIds.reduce((sum, id) => 
    sum + (db.projects[id].learnedPatterns?.length || 0), 0)
  const totalComponents = projectIds.reduce((sum, id) => 
    sum + (db.projects[id].componentRegistry?.length || 0), 0)
  
  return {
    globalPreferencesSet: globalSet,
    projectsWithMemory: projectIds.length,
    totalPatternsLearned: totalPatterns,
    totalComponentsRegistered: totalComponents
  }
}
