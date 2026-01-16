/**
 * Jett Error Capture Plugin
 * Detects, categorizes, and helps auto-fix build/runtime errors
 * 
 * Error Categories:
 * - npm: Module not found, version conflicts, peer deps
 * - typescript: Type errors, missing imports, syntax
 * - vite: Build failures, missing deps, config issues
 * - runtime: React errors, undefined variables, crashes
 */

// Error types
export type ErrorCategory = 'npm' | 'typescript' | 'vite' | 'runtime' | 'unknown'

export interface DetectedError {
  category: ErrorCategory
  type: string
  message: string
  file?: string
  line?: number
  column?: number
  suggestion?: string
  autoFixable: boolean
  rawOutput: string
}

export interface ErrorAnalysis {
  errors: DetectedError[]
  summary: string
  hasAutoFixable: boolean
  fixPrompt?: string
}

// Error patterns with regex and extraction logic
const ERROR_PATTERNS: Array<{
  category: ErrorCategory
  type: string
  pattern: RegExp
  extract: (match: RegExpMatchArray, raw: string) => Partial<DetectedError>
  autoFixable: boolean
}> = [
  // NPM Errors
  {
    category: 'npm',
    type: 'module_not_found',
    pattern: /npm ERR! 404 Not Found[^]*?'([^']+)'/i,
    extract: (match) => ({
      message: `Package '${match[1]}' not found`,
      suggestion: `Check package name spelling or try a different version`
    }),
    autoFixable: true
  },
  {
    category: 'npm',
    type: 'peer_dependency',
    pattern: /npm WARN peer dep missing: ([^,]+)/i,
    extract: (match) => ({
      message: `Missing peer dependency: ${match[1]}`,
      suggestion: `Install the missing peer dependency`
    }),
    autoFixable: true
  },
  {
    category: 'npm',
    type: 'version_conflict',
    pattern: /npm ERR! ERESOLVE[^]*?Could not resolve dependency/i,
    extract: () => ({
      message: 'Dependency version conflict',
      suggestion: 'Try using --legacy-peer-deps or update package versions'
    }),
    autoFixable: true
  },
  {
    category: 'npm',
    type: 'enoent',
    pattern: /npm ERR! enoent ENOENT[^]*?'([^']+)'/i,
    extract: (match) => ({
      message: `File not found: ${match[1]}`,
      suggestion: 'Check file paths and ensure package.json exists'
    }),
    autoFixable: false
  },

  // TypeScript Errors
  {
    category: 'typescript',
    type: 'type_error',
    pattern: /error TS(\d+): (.+)\n\s*(\d+)\s*\|/,
    extract: (match, raw) => {
      const fileMatch = raw.match(/([^\s]+\.tsx?)\((\d+),(\d+)\)/)
      return {
        message: `TS${match[1]}: ${match[2]}`,
        file: fileMatch?.[1],
        line: fileMatch ? parseInt(fileMatch[2]) : parseInt(match[3]),
        column: fileMatch ? parseInt(fileMatch[3]) : undefined
      }
    },
    autoFixable: true
  },
  {
    category: 'typescript',
    type: 'cannot_find_module',
    pattern: /Cannot find module '([^']+)'/,
    extract: (match) => ({
      message: `Cannot find module '${match[1]}'`,
      suggestion: `Install the module: npm install ${match[1]}`
    }),
    autoFixable: true
  },
  {
    category: 'typescript',
    type: 'cannot_find_name',
    pattern: /Cannot find name '([^']+)'/,
    extract: (match) => ({
      message: `Cannot find name '${match[1]}'`,
      suggestion: `Import or define '${match[1]}'`
    }),
    autoFixable: true
  },
  {
    category: 'typescript',
    type: 'property_not_exist',
    pattern: /Property '([^']+)' does not exist on type '([^']+)'/,
    extract: (match) => ({
      message: `Property '${match[1]}' does not exist on type '${match[2]}'`,
      suggestion: `Add the property to the type or use type assertion`
    }),
    autoFixable: true
  },
  {
    category: 'typescript',
    type: 'missing_return',
    pattern: /A function whose declared type is neither 'void' nor 'any' must return a value/,
    extract: () => ({
      message: 'Function missing return statement',
      suggestion: 'Add a return statement or change return type to void'
    }),
    autoFixable: true
  },

  // Vite/Build Errors
  {
    category: 'vite',
    type: 'syntax_error',
    pattern: /SyntaxError: (.+)\n\s*at ([^\s]+):(\d+):(\d+)/,
    extract: (match) => ({
      message: `Syntax error: ${match[1]}`,
      file: match[2],
      line: parseInt(match[3]),
      column: parseInt(match[4])
    }),
    autoFixable: true
  },
  {
    category: 'vite',
    type: 'failed_resolve',
    pattern: /\[vite\][^]*?Failed to resolve import "([^"]+)" from "([^"]+)"/,
    extract: (match) => ({
      message: `Failed to resolve import '${match[1]}'`,
      file: match[2],
      suggestion: `Check import path or install missing package`
    }),
    autoFixable: true
  },
  {
    category: 'vite',
    type: 'build_failed',
    pattern: /error during build:\n(.+)/,
    extract: (match) => ({
      message: `Build failed: ${match[1]}`
    }),
    autoFixable: true
  },
  {
    category: 'vite',
    type: 'transform_failed',
    pattern: /\[plugin:vite:react-babel\] (.+)\n\s*([^\s]+):(\d+):(\d+)/,
    extract: (match) => ({
      message: match[1],
      file: match[2],
      line: parseInt(match[3]),
      column: parseInt(match[4])
    }),
    autoFixable: true
  },

  // Runtime Errors
  {
    category: 'runtime',
    type: 'undefined_variable',
    pattern: /ReferenceError: ([^\s]+) is not defined/,
    extract: (match) => ({
      message: `'${match[1]}' is not defined`,
      suggestion: `Import or define '${match[1]}'`
    }),
    autoFixable: true
  },
  {
    category: 'runtime',
    type: 'cannot_read_property',
    pattern: /TypeError: Cannot read propert(?:y|ies) (?:of|'([^']+)')? (?:of )?(\w+)/,
    extract: (match) => ({
      message: `Cannot read property of ${match[2] || 'undefined'}`,
      suggestion: 'Add null/undefined check before accessing property'
    }),
    autoFixable: true
  },
  {
    category: 'runtime',
    type: 'is_not_a_function',
    pattern: /TypeError: ([^\s]+) is not a function/,
    extract: (match) => ({
      message: `'${match[1]}' is not a function`,
      suggestion: 'Check that the value is a function before calling it'
    }),
    autoFixable: true
  },
  {
    category: 'runtime',
    type: 'react_hooks_error',
    pattern: /Invalid hook call|Hooks can only be called inside of the body of a function component/,
    extract: () => ({
      message: 'Invalid React hook call',
      suggestion: 'Ensure hooks are called at the top level of a function component'
    }),
    autoFixable: true
  },
  {
    category: 'runtime',
    type: 'react_key_error',
    pattern: /Each child in a list should have a unique "key" prop/,
    extract: () => ({
      message: 'Missing key prop in list',
      suggestion: 'Add a unique key prop to each item in the list'
    }),
    autoFixable: true
  }
]

/**
 * Analyze error output and extract structured errors
 */
export function analyzeErrors(output: string): ErrorAnalysis {
  const errors: DetectedError[] = []
  
  // Strip ANSI codes for cleaner matching
  const cleanOutput = output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
  
  for (const pattern of ERROR_PATTERNS) {
    const match = cleanOutput.match(pattern.pattern)
    if (match) {
      const extracted = pattern.extract(match, cleanOutput)
      errors.push({
        category: pattern.category,
        type: pattern.type,
        message: extracted.message || 'Unknown error',
        file: extracted.file,
        line: extracted.line,
        column: extracted.column,
        suggestion: extracted.suggestion,
        autoFixable: pattern.autoFixable,
        rawOutput: output.slice(0, 500) // Truncate for prompt efficiency
      })
    }
  }
  
  // If no patterns matched but output contains error keywords
  if (errors.length === 0 && /error|Error|ERROR|failed|Failed|FAILED/i.test(cleanOutput)) {
    errors.push({
      category: 'unknown',
      type: 'unrecognized',
      message: extractErrorMessage(cleanOutput),
      autoFixable: true,
      rawOutput: output.slice(0, 500)
    })
  }
  
  const hasAutoFixable = errors.some(e => e.autoFixable)
  
  return {
    errors,
    summary: generateSummary(errors),
    hasAutoFixable,
    fixPrompt: hasAutoFixable ? generateFixPrompt(errors) : undefined
  }
}

/**
 * Extract a readable error message from raw output
 */
function extractErrorMessage(output: string): string {
  // Try to find the most relevant error line
  const lines = output.split('\n')
  
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('error') && !lower.includes('0 errors')) {
      return line.trim().slice(0, 200)
    }
  }
  
  // Return first non-empty line as fallback
  return lines.find(l => l.trim().length > 10)?.trim().slice(0, 200) || 'Unknown error'
}

/**
 * Generate human-readable summary of errors
 */
function generateSummary(errors: DetectedError[]): string {
  if (errors.length === 0) return 'No errors detected'
  if (errors.length === 1) return errors[0].message
  
  const byCategory: Record<string, number> = {}
  for (const e of errors) {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1
  }
  
  const parts = Object.entries(byCategory).map(([cat, count]) => 
    `${count} ${cat} error${count > 1 ? 's' : ''}`
  )
  
  return parts.join(', ')
}

/**
 * Generate a prompt for AI to fix the errors
 */
function generateFixPrompt(errors: DetectedError[]): string {
  const errorDescriptions = errors.map(e => {
    let desc = `- ${e.category.toUpperCase()}: ${e.message}`
    if (e.file) desc += ` (in ${e.file}`
    if (e.line) desc += `:${e.line}`
    if (e.file) desc += ')'
    if (e.suggestion) desc += `\n  Suggestion: ${e.suggestion}`
    return desc
  }).join('\n')
  
  return `Fix the following error(s):

${errorDescriptions}

Instructions:
1. Analyze each error and determine the root cause
2. Fix the issue in the relevant file(s)
3. If a module is missing, add it to package.json and import it
4. Ensure the fix doesn't break other functionality
5. Output ONLY the files that need to be modified

Output each file in this exact format:
---FILE-START path="src/path/to/file.tsx"---
// complete file contents with fix applied
---FILE-END---`
}

/**
 * Check if output contains errors
 */
export function hasErrors(output: string): boolean {
  const cleanOutput = output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
  
  // Check for explicit error indicators
  if (/npm ERR!|error TS\d+|SyntaxError|TypeError|ReferenceError/i.test(cleanOutput)) {
    return true
  }
  
  // Check for build failure
  if (/build failed|failed to compile|error during build/i.test(cleanOutput)) {
    return true
  }
  
  // Check for Vite errors
  if (/\[vite\].*error|\[plugin:.*\] error/i.test(cleanOutput)) {
    return true
  }
  
  return false
}

/**
 * Categorize an error for display
 */
export function categorizeError(error: DetectedError): {
  icon: string
  color: string
  label: string
} {
  switch (error.category) {
    case 'npm':
      return { icon: '📦', color: '#f59e0b', label: 'Package' }
    case 'typescript':
      return { icon: '🔷', color: '#3b82f6', label: 'TypeScript' }
    case 'vite':
      return { icon: '⚡', color: '#8b5cf6', label: 'Build' }
    case 'runtime':
      return { icon: '🔥', color: '#ef4444', label: 'Runtime' }
    default:
      return { icon: '❓', color: '#6b7280', label: 'Unknown' }
  }
}

/**
 * Get quick fix suggestion for common errors
 */
export function getQuickFix(error: DetectedError): string | null {
  switch (error.type) {
    case 'module_not_found':
    case 'cannot_find_module':
      const moduleName = error.message.match(/'([^']+)'/)?.[1]
      return moduleName ? `npm install ${moduleName}` : null
    
    case 'peer_dependency':
      const peerDep = error.message.match(/: (.+)$/)?.[1]
      return peerDep ? `npm install ${peerDep}` : null
    
    case 'version_conflict':
      return 'npm install --legacy-peer-deps'
    
    default:
      return null
  }
}

// AI Prompt for complex error fixing
export const AI_ERROR_FIX_PROMPT = `You are an expert at debugging React + TypeScript + Vite applications.

When given an error, you:
1. Identify the root cause (not just the symptom)
2. Provide a complete fix that won't break other code
3. Consider edge cases
4. Use best practices (proper imports, types, etc.)

Common fixes:
- Missing import: Add the import statement
- Type error: Fix the type or add proper typing
- Module not found: Add to package.json dependencies
- Syntax error: Fix the syntax issue
- Hook error: Move hook to top level of component
- Key error: Add unique key to list items

Always output complete files with the fix applied.`
