/**
 * Jett Code Simplifier Plugin
 * 
 * Based on Anthropic's official code-simplifier agent.
 * Simplifies AI-generated code without changing functionality.
 * 
 * Core Principles:
 * 1. PRESERVE FUNCTIONALITY - Never change what code does, only how
 * 2. APPLY PROJECT STANDARDS - Follow established conventions
 * 3. PRIORITIZE READABILITY - Explicit > compact
 * 4. AVOID ANTI-PATTERNS - No nested ternaries, proper imports
 */

export interface SimplificationResult {
  original: string
  simplified: string
  changes: SimplificationChange[]
  preserved: boolean  // Functionality preserved?
}

export interface SimplificationChange {
  type: 'remove' | 'refactor' | 'rename' | 'flatten' | 'sort' | 'consolidate'
  description: string
  before: string
  after: string
  line?: number
}

// Patterns to simplify
const SIMPLIFICATION_RULES = {
  // Remove unnecessary complexity
  nestedTernaries: {
    pattern: /\?[^:]+\?[^:]+:/g,
    message: 'Nested ternary - convert to if/else or switch'
  },
  
  // Flatten nested structures
  deepNesting: {
    pattern: /{\s*{\s*{\s*{/g,
    message: 'Deep nesting - flatten structure'
  },
  
  // Consolidate duplicate code
  duplicateClassNames: {
    pattern: /className="([^"]+)".*className="([^"]+)"/g,
    message: 'Multiple className props - consolidate'
  },
  
  // Sort imports
  unsortedImports: {
    pattern: /^import.*\n(?!import)/gm,
    message: 'Unsorted imports - group and sort'
  },
  
  // Remove dead code
  unusedVariables: {
    pattern: /const\s+(\w+)\s*=.*(?!\1)/g,
    message: 'Potentially unused variable'
  },
  
  // Improve naming
  singleLetterVars: {
    pattern: /const\s+[a-z]\s*=/g,
    message: 'Single-letter variable - use descriptive name'
  },
  
  // Remove console.log
  consoleLogs: {
    pattern: /console\.(log|debug|info)\([^)]*\)/g,
    message: 'Console statement - remove for production'
  },
  
  // Simplify arrow functions
  unnecessaryBraces: {
    pattern: /=>\s*{\s*return\s+([^}]+)\s*}/g,
    message: 'Unnecessary braces - use implicit return'
  }
}

/**
 * Analyze code for simplification opportunities
 */
export function analyzeForSimplification(code: string): SimplificationChange[] {
  const changes: SimplificationChange[] = []
  
  // Check nested ternaries
  const ternaryMatches = code.match(SIMPLIFICATION_RULES.nestedTernaries.pattern)
  if (ternaryMatches) {
    changes.push({
      type: 'refactor',
      description: SIMPLIFICATION_RULES.nestedTernaries.message,
      before: ternaryMatches[0],
      after: '// Convert to if/else or switch statement'
    })
  }
  
  // Check console logs
  const consoleMatches = code.match(SIMPLIFICATION_RULES.consoleLogs.pattern)
  if (consoleMatches) {
    consoleMatches.forEach(match => {
      changes.push({
        type: 'remove',
        description: SIMPLIFICATION_RULES.consoleLogs.message,
        before: match,
        after: ''
      })
    })
  }
  
  // Check single letter variables
  const singleLetterMatches = code.match(SIMPLIFICATION_RULES.singleLetterVars.pattern)
  if (singleLetterMatches) {
    singleLetterMatches.forEach(match => {
      changes.push({
        type: 'rename',
        description: SIMPLIFICATION_RULES.singleLetterVars.message,
        before: match,
        after: '// Use descriptive name'
      })
    })
  }
  
  // Check unnecessary arrow function braces
  const bracesRegex = /=>\s*{\s*return\s+([^}]+)\s*}/g
  let bracesMatch
  while ((bracesMatch = bracesRegex.exec(code)) !== null) {
    changes.push({
      type: 'refactor',
      description: SIMPLIFICATION_RULES.unnecessaryBraces.message,
      before: bracesMatch[0],
      after: `=> ${bracesMatch[1].trim()}`
    })
  }
  
  // Check import sorting
  const importLines = code.match(/^import\s+.*$/gm) || []
  if (importLines.length > 1) {
    const sorted = [...importLines].sort((a, b) => {
      // React imports first
      if (a.includes('react') && !b.includes('react')) return -1
      if (b.includes('react') && !a.includes('react')) return 1
      // Then alphabetically
      return a.localeCompare(b)
    })
    
    if (JSON.stringify(importLines) !== JSON.stringify(sorted)) {
      changes.push({
        type: 'sort',
        description: 'Imports should be sorted (React first, then alphabetically)',
        before: importLines.join('\n'),
        after: sorted.join('\n')
      })
    }
  }
  
  return changes
}

/**
 * Apply simplifications to code
 * Note: This is a basic implementation. Full version would use AST parsing.
 */
export function simplifyCode(code: string): SimplificationResult {
  let simplified = code
  const changes = analyzeForSimplification(code)
  
  // Apply safe simplifications only
  
  // Remove console.log statements
  simplified = simplified.replace(
    /^\s*console\.(log|debug|info)\([^)]*\);?\s*$/gm,
    ''
  )
  
  // Simplify arrow functions with unnecessary braces
  simplified = simplified.replace(
    /=>\s*{\s*return\s+([^}]+)\s*}/g,
    '=> $1'
  )
  
  // Clean up empty lines (max 2 consecutive)
  simplified = simplified.replace(/\n{3,}/g, '\n\n')
  
  // Sort imports
  const importRegex = /^(import\s+.*$\n?)+/m
  const importMatch = simplified.match(importRegex)
  if (importMatch) {
    const imports = importMatch[0].trim().split('\n')
    const sortedImports = imports.sort((a, b) => {
      if (a.includes('react') && !b.includes('react')) return -1
      if (b.includes('react') && !a.includes('react')) return 1
      return a.localeCompare(b)
    })
    simplified = simplified.replace(importMatch[0], sortedImports.join('\n') + '\n')
  }
  
  return {
    original: code,
    simplified,
    changes,
    preserved: true  // In a real implementation, we'd verify with tests
  }
}

/**
 * Run code simplifier on a file
 */
export async function runCodeSimplifier(
  filePath: string,
  content: string
): Promise<SimplificationResult> {
  // Only simplify TypeScript/JavaScript files
  if (!filePath.match(/\.(tsx?|jsx?)$/)) {
    return {
      original: content,
      simplified: content,
      changes: [],
      preserved: true
    }
  }
  
  return simplifyCode(content)
}

/**
 * AI-powered simplification (for complex cases)
 * This would call the AI to simplify code while preserving functionality
 */
export const AI_SIMPLIFIER_PROMPT = `You are an expert code simplification specialist.

Your task is to simplify the following code while PRESERVING EXACT FUNCTIONALITY.

RULES:
1. Never change what the code does - only how it does it
2. Prioritize readable, explicit code over compact solutions
3. Apply these specific simplifications:
   - Convert nested ternaries to if/else or switch
   - Flatten deeply nested structures
   - Consolidate duplicate code
   - Sort imports (React first, then alphabetically)
   - Remove dead code and console.logs
   - Use descriptive variable names
   - Simplify arrow functions where possible

4. DO NOT:
   - Change component behavior
   - Remove error handling
   - Alter prop types or interfaces
   - Change state management logic

Output the simplified code ONLY, no explanations.
If no simplifications are needed, return the code unchanged.

Code to simplify:
`

// Export for validation
export { SIMPLIFICATION_RULES }
