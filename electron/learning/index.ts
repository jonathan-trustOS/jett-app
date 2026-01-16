/**
 * Jett Learning System
 * Phase 1: Local pattern learning with SQLite/JSON storage
 */

export {
  // Database
  loadDatabase,
  getProjectContext,
  saveProjectContext,
  updateProjectContext,
  addCodePattern,
  findPatterns,
  updatePatternConfidence,
  getSuggestionOutcomes,
  recordSuggestionShown,
  recordSuggestionSelected,
  addSuggestionOutcome,
  getLearningStats,
  type ProjectContext,
  type CodePattern,
  type SuggestionOutcome
} from './database'

export {
  // Extraction
  extractTailwindClasses,
  extractComponents,
  extractImports,
  inferConventions,
  extractKeywords,
  extractAndSavePatterns,
  formatContextForPrompt
} from './extraction'

export {
  // Suggestions
  getSmartSuggestions,
  recordSuggestionBuilt,
  refreshSuggestions,
  type Suggestion
} from './suggestions'
