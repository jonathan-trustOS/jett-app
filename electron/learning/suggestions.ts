/**
 * Jett Learning - Smart Suggestions
 * Generates suggestions based on learned patterns and outcomes
 */

import {
  getSuggestionOutcomes,
  recordSuggestionShown,
  recordSuggestionSelected,
  SuggestionOutcome
} from './database'

export interface Suggestion {
  id: string
  rank: 1 | 2 | 3
  category: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

// Map confidence to severity
function confidenceToSeverity(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.6) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}

// Get smart suggestions based on learned outcomes
export function getSmartSuggestions(
  appType: string = 'any',
  count: number = 3
): Suggestion[] {
  // Get top suggestions by confidence
  const outcomes = getSuggestionOutcomes({
    appType,
    minConfidence: 0.3,
    limit: count * 2 // Get more than needed for variety
  })
  
  if (outcomes.length === 0) {
    // Fallback to defaults if no data
    return getDefaultSuggestions()
  }
  
  // Select top suggestions, ensuring variety in categories
  const selected: SuggestionOutcome[] = []
  const usedCategories = new Set<string>()
  
  // First pass: get top from each category
  for (const outcome of outcomes) {
    if (!usedCategories.has(outcome.category) && selected.length < count) {
      selected.push(outcome)
      usedCategories.add(outcome.category)
    }
  }
  
  // Second pass: fill remaining slots with highest confidence
  for (const outcome of outcomes) {
    if (!selected.includes(outcome) && selected.length < count) {
      selected.push(outcome)
    }
  }
  
  // Record that these were shown
  for (const outcome of selected) {
    recordSuggestionShown(outcome.id)
  }
  
  // Convert to Suggestion format
  return selected.map((outcome, index) => ({
    id: outcome.id,
    rank: (index + 1) as 1 | 2 | 3,
    category: outcome.category,
    title: outcome.title,
    description: outcome.description,
    severity: confidenceToSeverity(outcome.confidence)
  }))
}

// Record when user selects and builds a suggestion
export function recordSuggestionBuilt(
  suggestionId: string,
  succeeded: boolean
): void {
  recordSuggestionSelected(suggestionId, succeeded)
}

// Default suggestions (used when no learned data)
function getDefaultSuggestions(): Suggestion[] {
  return [
    {
      id: 'default-1',
      rank: 1,
      category: 'Accessibility',
      title: 'Add focus states to buttons',
      description: 'Buttons lack visible focus indicators for keyboard navigation',
      severity: 'high'
    },
    {
      id: 'default-2',
      rank: 2,
      category: 'UX',
      title: 'Add loading indicators',
      description: 'No feedback when actions are processing',
      severity: 'medium'
    },
    {
      id: 'default-3',
      rank: 3,
      category: 'Polish',
      title: 'Add smooth transitions',
      description: 'Animations between states improve perceived quality',
      severity: 'low'
    }
  ]
}

// Get fresh suggestions (different from current set)
export function refreshSuggestions(
  currentIds: string[],
  appType: string = 'any',
  count: number = 3
): Suggestion[] {
  const outcomes = getSuggestionOutcomes({
    appType,
    minConfidence: 0.25,
    limit: 20 // Get a larger pool
  })
  
  // Filter out current suggestions
  const available = outcomes.filter(o => !currentIds.includes(o.id))
  
  if (available.length < count) {
    // Not enough different suggestions, include some current ones
    return getSmartSuggestions(appType, count)
  }
  
  // Select from available
  const selected = available.slice(0, count)
  
  // Record shown
  for (const outcome of selected) {
    recordSuggestionShown(outcome.id)
  }
  
  return selected.map((outcome, index) => ({
    id: outcome.id,
    rank: (index + 1) as 1 | 2 | 3,
    category: outcome.category,
    title: outcome.title,
    description: outcome.description,
    severity: confidenceToSeverity(outcome.confidence)
  }))
}
