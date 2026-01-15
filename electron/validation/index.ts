/**
 * Jett Plugin Validation Orchestrator
 * 
 * Validates plugin success criteria using the same execute→verify pattern
 * that Jett uses for task execution.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface ValidationResult {
  criterion: string
  plugin: 'code-review' | 'memory' | 'github'
  passed: boolean
  actual: string | number
  expected: string | number
  duration?: number
  details?: string
}

export interface ValidationSummary {
  timestamp: string
  passed: number
  failed: number
  total: number
  results: ValidationResult[]
}

// Fixture definitions with expected violations
const VIOLATION_FIXTURES = [
  { file: 'bad-fonts.tsx', category: 'design', pattern: /inter|roboto|open sans|font/i },
  { file: 'pure-black.tsx', category: 'design', pattern: /#000|#fff|pure black|pure white/i },
  { file: 'cyan-dark.tsx', category: 'design', pattern: /cyan|neon|color scheme/i },
  { file: 'nested-cards.tsx', category: 'design', pattern: /nested|card|hierarchy/i },
  { file: 'uniform-spacing.tsx', category: 'design', pattern: /spacing|rhythm|monoton/i },
  { file: 'bounce-animation.tsx', category: 'design', pattern: /bounce|elastic|spring|animation/i },
  { file: 'missing-alt.tsx', category: 'a11y', pattern: /alt|image|accessibility/i },
  { file: 'no-labels.tsx', category: 'a11y', pattern: /label|form|input/i },
  { file: 'low-contrast.tsx', category: 'a11y', pattern: /contrast|readability|color/i },
  { file: 'no-focus.tsx', category: 'a11y', pattern: /focus|keyboard|outline/i },
]

const CLEAN_FIXTURES = [
  'impeccable-button.tsx',
  'accessible-form.tsx',
]

/**
 * Run all plugin validations
 */
export async function runAllValidations(
  onProgress?: (message: string) => void
): Promise<ValidationSummary> {
  const log = onProgress || console.log
  const results: ValidationResult[] = []
  
  log('🧪 Starting plugin validation...')
  
  // Code Review Validation
  log('\n📝 Validating Code Review...')
  try {
    const codeReviewResults = await validateCodeReviewPlugin()
    results.push(...codeReviewResults)
    const passed = codeReviewResults.filter(r => r.passed).length
    log(`   ${passed}/${codeReviewResults.length} criteria passed`)
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`)
  }
  
  // Memory Validation
  log('\n🧠 Validating Memory...')
  try {
    const memoryResults = await validateMemoryPlugin()
    results.push(...memoryResults)
    const passed = memoryResults.filter(r => r.passed).length
    log(`   ${passed}/${memoryResults.length} criteria passed`)
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`)
  }
  
  // GitHub Validation
  log('\n🐙 Validating GitHub...')
  try {
    const githubResults = await validateGitHubPlugin()
    results.push(...githubResults)
    const passed = githubResults.filter(r => r.passed).length
    log(`   ${passed}/${githubResults.length} criteria passed`)
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`)
  }
  
  // Code Simplifier Validation
  log('\n✨ Validating Code Simplifier...')
  try {
    const simplifierResults = await validateCodeSimplifierPlugin()
    results.push(...simplifierResults)
    const passed = simplifierResults.filter(r => r.passed).length
    log(`   ${passed}/${simplifierResults.length} criteria passed`)
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`)
  }
  
  // Error Capture Validation
  log('\n🔥 Validating Error Capture...')
  try {
    const errorResults = await validateErrorCapturePlugin()
    results.push(...errorResults)
    const passed = errorResults.filter(r => r.passed).length
    log(`   ${passed}/${errorResults.length} criteria passed`)
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`)
  }
  
  // Summary
  const summary: ValidationSummary = {
    timestamp: new Date().toISOString(),
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    total: results.length,
    results
  }
  
  log('\n' + '═'.repeat(50))
  log(`📊 VALIDATION SUMMARY: ${summary.passed}/${summary.total} passed`)
  log('═'.repeat(50))
  
  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗'
    const status = r.passed ? '' : ' ⚠️'
    log(`${icon} [${r.plugin}] ${r.criterion}${status}`)
    log(`  actual: ${r.actual} | expected: ${r.expected}`)
  })
  
  return summary
}

/**
 * Code Review Plugin Validation
 */
async function validateCodeReviewPlugin(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []
  const fixturesDir = path.join(__dirname, 'fixtures')
  
  // Criterion 1: Reviews run in < 5 seconds
  const startTime = performance.now()
  const testFile = path.join(fixturesDir, 'violations', 'bad-fonts.tsx')
  if (fs.existsSync(testFile)) {
    const content = fs.readFileSync(testFile, 'utf-8')
    await runCodeReviewOnContent(content)
  }
  const duration = performance.now() - startTime
  
  results.push({
    criterion: 'Reviews run in < 5 seconds',
    plugin: 'code-review',
    passed: duration < 5000,
    actual: `${(duration / 1000).toFixed(2)}s`,
    expected: '< 5s',
    duration
  })
  
  // Criterion 2: Catches 80% of Impeccable violations
  let caught = 0
  const violationsDir = path.join(fixturesDir, 'violations')
  
  for (const fixture of VIOLATION_FIXTURES) {
    const filePath = path.join(violationsDir, fixture.file)
    if (!fs.existsSync(filePath)) continue
    
    const content = fs.readFileSync(filePath, 'utf-8')
    const reviewResults = await runCodeReviewOnContent(content)
    
    // Check if any result matches expected category and pattern
    const found = reviewResults.some(r => 
      r.category === fixture.category && 
      fixture.pattern.test(r.message)
    )
    if (found) caught++
  }
  
  const totalViolations = VIOLATION_FIXTURES.length
  const catchRate = totalViolations > 0 ? (caught / totalViolations) * 100 : 0
  
  results.push({
    criterion: 'Catches 80% of Impeccable violations',
    plugin: 'code-review',
    passed: catchRate >= 80,
    actual: `${catchRate.toFixed(0)}%`,
    expected: '≥ 80%',
    details: `${caught}/${totalViolations} violations detected`
  })
  
  // Criterion 3: Zero false positives on critical issues
  let falsePositives = 0
  const cleanDir = path.join(fixturesDir, 'clean')
  
  for (const file of CLEAN_FIXTURES) {
    const filePath = path.join(cleanDir, file)
    if (!fs.existsSync(filePath)) continue
    
    const content = fs.readFileSync(filePath, 'utf-8')
    const reviewResults = await runCodeReviewOnContent(content)
    
    // Count critical issues on clean code
    const critical = reviewResults.filter(r => r.severity === 'critical')
    falsePositives += critical.length
  }
  
  results.push({
    criterion: 'Zero false positives on critical issues',
    plugin: 'code-review',
    passed: falsePositives === 0,
    actual: falsePositives,
    expected: 0,
    details: falsePositives > 0 ? `Found ${falsePositives} false positives in clean code` : undefined
  })
  
  return results
}

// Code review result from AI
interface ReviewIssue {
  category: 'design' | 'a11y' | 'perf' | 'types'
  severity: 'critical' | 'warning' | 'suggestion'
  message: string
  line?: number
  suggestion?: string
}

// Run code review on content (placeholder - will call AI)
async function runCodeReviewOnContent(content: string): Promise<ReviewIssue[]> {
  // TODO: Replace with actual AI code review call
  // For now, do simple pattern matching as a baseline
  const issues: ReviewIssue[] = []
  
  // Design checks
  if (/font-family:\s*['"]?(Inter|Roboto|Open Sans)/i.test(content) ||
      /font-\['(Inter|Roboto)'\]/i.test(content)) {
    issues.push({
      category: 'design',
      severity: 'warning',
      message: 'Using Inter/Roboto font. Use Plus Jakarta Sans or Instrument Sans instead.'
    })
  }
  
  if (/#000000?['";\s]|#fff(fff)?['";\s]|bg-black|text-black|bg-white(?!-)/i.test(content)) {
    issues.push({
      category: 'design',
      severity: 'warning',
      message: 'Using pure black (#000) or white (#fff). Use tinted colors instead.'
    })
  }
  
  if (/text-cyan|border-cyan|bg-cyan|#0ff|#00fff|cyan-\d/i.test(content)) {
    issues.push({
      category: 'design',
      severity: 'suggestion',
      message: 'Cyan-on-dark color scheme looks dated. Use warm/cool tinted neutrals.'
    })
  }
  
  if (/animate-bounce|animate-pulse|elastic|spring.*damping/i.test(content)) {
    issues.push({
      category: 'design',
      severity: 'suggestion',
      message: 'Bounce/elastic animations. Use ease-out-quart for professional feel.'
    })
  }
  
  // A11y checks
  if (/<img[^>]+(?!alt=)[^>]*>|<img[^>]+alt=""|<img[^>]+alt="image"/i.test(content)) {
    issues.push({
      category: 'a11y',
      severity: 'critical',
      message: 'Missing or unhelpful alt text on images.'
    })
  }
  
  if (/<input[^>]*(?!.*id=)[^>]*>.*?(?!<label)/i.test(content) ||
      /placeholder=.*(?!.*htmlFor)/i.test(content)) {
    issues.push({
      category: 'a11y',
      severity: 'warning',
      message: 'Form inputs should have associated labels, not just placeholders.'
    })
  }
  
  if (/outline-none|outline:\s*none|outline:\s*0|focus:outline-none/i.test(content)) {
    issues.push({
      category: 'a11y',
      severity: 'critical',
      message: 'Removing focus outlines breaks keyboard navigation. Add visible focus indicators.'
    })
  }
  
  if (/text-gray-[23]00\s+bg-white|text-gray-[56]00.*bg-gray-[78]00/i.test(content)) {
    issues.push({
      category: 'a11y',
      severity: 'warning',
      message: 'Low color contrast may fail WCAG guidelines.'
    })
  }
  
  // Spacing check (heuristic: same spacing class repeated 5+ times)
  const spacingMatches = content.match(/[pm]-4/g) || []
  if (spacingMatches.length >= 5) {
    issues.push({
      category: 'design',
      severity: 'suggestion',
      message: 'Uniform spacing throughout. Use varied rhythm for visual interest.'
    })
  }
  
  // Nested cards check
  const cardDepth = (content.match(/rounded.*shadow|shadow.*rounded/g) || []).length
  const bgLayers = (content.match(/bg-(white|gray|slate)-?\d*/g) || []).length
  if (cardDepth >= 3 || bgLayers >= 4) {
    issues.push({
      category: 'design',
      severity: 'warning',
      message: 'Nested cards create visual noise. Flatten the hierarchy.'
    })
  }
  
  return issues
}

/**
 * Memory Plugin Validation
 */
async function validateMemoryPlugin(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []
  
  try {
    // Import memory plugin
    const {
      getGlobalPreferences,
      updateGlobalPreferences,
      learnFromBuild,
      clearMemory,
      getMemoryStats
    } = await import('../plugins/memory')
    
    // Criterion 1: Preferences persist
    let persisted = false
    try {
      const original = getGlobalPreferences()
      const testUpdate = { buttonStyle: 'pill' as const }
      updateGlobalPreferences(testUpdate)
      const after = getGlobalPreferences()
      persisted = after.buttonStyle === 'pill'
      
      // Restore original
      updateGlobalPreferences({ buttonStyle: original.buttonStyle })
    } catch (e) {
      persisted = false
    }
    
    results.push({
      criterion: 'Preferences persist across updates',
      plugin: 'memory',
      passed: persisted,
      actual: persisted ? 'Persisted' : 'Lost',
      expected: 'Persisted'
    })
    
    // Criterion 2: Learning from code extracts patterns
    let learned = false
    let patternsCount = 0
    try {
      const testCode = `
        <div className="flex items-center gap-4 p-6 bg-slate-800 rounded-lg">
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500">Click</button>
        </div>
      `
      const result = learnFromBuild('validation-test-project', testCode, true)
      learned = result.success
      patternsCount = result.patternsLearned
    } catch (e) {
      learned = false
    }
    
    results.push({
      criterion: 'Extracts patterns from code',
      plugin: 'memory',
      passed: learned && patternsCount > 0,
      actual: learned ? `${patternsCount} patterns` : 'Failed',
      expected: '> 0 patterns'
    })
    
    // Criterion 3: Memory can be cleared without breaking app
    let clearWorks = false
    try {
      clearMemory()
      const stats = getMemoryStats()
      clearWorks = stats.projectsWithMemory === 0
    } catch (e) {
      clearWorks = false
    }
    
    results.push({
      criterion: 'Memory can be cleared without breaking app',
      plugin: 'memory',
      passed: clearWorks,
      actual: clearWorks ? 'Works' : 'Broken',
      expected: 'Works'
    })
    
    // Criterion 4: Stats function works
    let statsWork = false
    try {
      const stats = getMemoryStats()
      statsWork = typeof stats.globalPreferencesSet === 'number' &&
                  typeof stats.projectsWithMemory === 'number'
    } catch (e) {
      statsWork = false
    }
    
    results.push({
      criterion: 'Memory stats accessible',
      plugin: 'memory',
      passed: statsWork,
      actual: statsWork ? 'Accessible' : 'Error',
      expected: 'Accessible'
    })
    
  } catch (error: any) {
    results.push({
      criterion: 'Memory plugin loads without error',
      plugin: 'memory',
      passed: false,
      actual: `Error: ${error.message}`,
      expected: 'No errors'
    })
  }
  
  return results
}

/**
 * GitHub Plugin Validation
 */
async function validateGitHubPlugin(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []
  
  try {
    // Import GitHub plugin
    const {
      isGitInstalled,
      loadGitConfig,
      saveGitConfig,
      initRepo,
      commit,
      getHistory,
      isRepoInitialized
    } = await import('../plugins/github')
    
    // Criterion 1: Git is installed
    let gitInstalled = false
    try {
      gitInstalled = await isGitInstalled()
    } catch (e) {
      gitInstalled = false
    }
    
    results.push({
      criterion: 'Git is installed on system',
      plugin: 'github',
      passed: gitInstalled,
      actual: gitInstalled ? 'Installed' : 'Not found',
      expected: 'Installed'
    })
    
    // Criterion 2: Config loads without error
    let configLoads = false
    try {
      const config = loadGitConfig()
      configLoads = config !== null && typeof config.autoCommit === 'boolean'
    } catch (e) {
      configLoads = false
    }
    
    results.push({
      criterion: 'Config loads without error',
      plugin: 'github',
      passed: configLoads,
      actual: configLoads ? 'Loaded' : 'Error',
      expected: 'Loaded'
    })
    
    // Criterion 3: Can init and commit (using temp directory)
    let commitsWork = false
    if (gitInstalled) {
      const fs = await import('fs')
      const path = await import('path')
      const os = await import('os')
      
      const testDir = path.join(os.tmpdir(), `jett-git-test-${Date.now()}`)
      
      try {
        // Create test directory
        fs.mkdirSync(testDir, { recursive: true })
        
        // Init repo
        const initResult = await initRepo(testDir)
        if (initResult.success) {
          // Create a test file
          fs.writeFileSync(path.join(testDir, 'test.txt'), 'test content')
          
          // Commit
          const commitResult = await commit(testDir, 'Test commit')
          commitsWork = commitResult.success || commitResult.message === 'No changes to commit'
          
          // Check history
          if (commitsWork) {
            const history = await getHistory(testDir, 1)
            commitsWork = history.length > 0 || commitResult.message === 'No changes to commit'
          }
        }
        
        // Cleanup
        fs.rmSync(testDir, { recursive: true, force: true })
      } catch (e) {
        // Cleanup on error
        try {
          fs.rmSync(testDir, { recursive: true, force: true })
        } catch {}
        commitsWork = false
      }
    }
    
    results.push({
      criterion: 'Can init repo and commit',
      plugin: 'github',
      passed: commitsWork,
      actual: commitsWork ? 'Works' : 'Failed',
      expected: 'Works',
      details: gitInstalled ? undefined : 'Skipped - git not installed'
    })
    
    // Criterion 4: Auth status check works
    let authCheckWorks = false
    try {
      const { isAuthenticated } = await import('../plugins/github')
      const result = isAuthenticated()
      authCheckWorks = typeof result === 'boolean'
    } catch (e) {
      authCheckWorks = false
    }
    
    results.push({
      criterion: 'Auth status check works',
      plugin: 'github',
      passed: authCheckWorks,
      actual: authCheckWorks ? 'Works' : 'Error',
      expected: 'Works'
    })
    
  } catch (error: any) {
    results.push({
      criterion: 'GitHub plugin loads without error',
      plugin: 'github',
      passed: false,
      actual: `Error: ${error.message}`,
      expected: 'No errors'
    })
  }
  
  return results
}

/**
 * Code Simplifier Plugin Validation
 */
async function validateCodeSimplifierPlugin(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []
  
  // Test code with various simplification opportunities
  const testCode = `
import axios from 'axios'
import { useState } from 'react'

const x = 5;
console.log('debug');

export default function Component() {
  const items = data.filter(item => { return item.active });
  const result = condition ? (other ? 'a' : 'b') : 'c';
  return <div>{items.length}</div>;
}
`
  
  try {
    const { simplifyCode, analyzeForSimplification } = await import('../plugins/code-simplifier')
    
    // Run analysis
    const changes = analyzeForSimplification(testCode)
    
    // Criterion 1: Detects simplification opportunities
    results.push({
      criterion: 'Detects simplification opportunities',
      plugin: 'code-review',
      passed: changes.length > 0,
      actual: `${changes.length} opportunities found`,
      expected: '> 0 opportunities'
    })
    
    // Run simplification
    const result = simplifyCode(testCode)
    
    // Criterion 2: Removes console statements
    const hasConsole = result.simplified.includes('console.log')
    results.push({
      criterion: 'Removes console statements',
      plugin: 'code-review',
      passed: !hasConsole,
      actual: hasConsole ? 'Console present' : 'Console removed',
      expected: 'Console removed'
    })
    
    // Criterion 3: Sorts imports (React first)
    const importLines = result.simplified.match(/^import\s+.*$/gm) || []
    const reactFirst = importLines.length > 0 && importLines[0].includes('react')
    results.push({
      criterion: 'Sorts imports (React first)',
      plugin: 'code-review',
      passed: reactFirst,
      actual: reactFirst ? 'React first' : 'Not sorted',
      expected: 'React first'
    })
    
    // Criterion 4: Simplifies arrow functions
    const hasUnnecessaryBraces = result.simplified.includes('=> { return')
    results.push({
      criterion: 'Simplifies arrow functions',
      plugin: 'code-review',
      passed: !hasUnnecessaryBraces,
      actual: hasUnnecessaryBraces ? 'Braces present' : 'Simplified',
      expected: 'Simplified'
    })
    
    // Criterion 5: Preserves functionality flag
    results.push({
      criterion: 'Reports functionality preserved',
      plugin: 'code-review',
      passed: result.preserved === true,
      actual: result.preserved ? 'Preserved' : 'Changed',
      expected: 'Preserved'
    })
    
  } catch (error: any) {
    results.push({
      criterion: 'Code simplifier runs without error',
      plugin: 'code-review',
      passed: false,
      actual: `Error: ${error.message}`,
      expected: 'No errors'
    })
  }
  
  return results
}

/**
 * Error Capture Plugin Validation
 */
async function validateErrorCapturePlugin(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []
  
  try {
    const { analyzeErrors, hasErrors, getQuickFix } = await import('../plugins/error-capture')
    
    // Criterion 1: Detects npm errors
    const npmErrorOutput = `npm ERR! 404 Not Found - GET https://registry.npmjs.org/nonexistent-package
npm ERR! 404 'nonexistent-package@latest' is not in this registry.`
    
    const npmAnalysis = analyzeErrors(npmErrorOutput)
    const detectsNpm = npmAnalysis.errors.some(e => e.category === 'npm')
    
    results.push({
      criterion: 'Detects npm errors',
      plugin: 'error-capture',
      passed: detectsNpm,
      actual: detectsNpm ? `Found ${npmAnalysis.errors.length} error(s)` : 'Not detected',
      expected: 'Detected'
    })
    
    // Criterion 2: Detects TypeScript errors
    const tsErrorOutput = `src/App.tsx(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
    10 |   const x: number = "hello"
       |         ^`
    
    const tsAnalysis = analyzeErrors(tsErrorOutput)
    const detectsTs = tsAnalysis.errors.some(e => e.category === 'typescript')
    
    results.push({
      criterion: 'Detects TypeScript errors',
      plugin: 'error-capture',
      passed: detectsTs,
      actual: detectsTs ? `Found ${tsAnalysis.errors.length} error(s)` : 'Not detected',
      expected: 'Detected'
    })
    
    // Criterion 3: Detects runtime errors
    const runtimeErrorOutput = `ReferenceError: myVariable is not defined
    at App (App.tsx:15:10)`
    
    const runtimeAnalysis = analyzeErrors(runtimeErrorOutput)
    const detectsRuntime = runtimeAnalysis.errors.some(e => e.category === 'runtime')
    
    results.push({
      criterion: 'Detects runtime errors',
      plugin: 'error-capture',
      passed: detectsRuntime,
      actual: detectsRuntime ? `Found ${runtimeAnalysis.errors.length} error(s)` : 'Not detected',
      expected: 'Detected'
    })
    
    // Criterion 4: Generates fix prompts
    const hasFixPrompt = npmAnalysis.hasAutoFixable && npmAnalysis.fixPrompt !== undefined
    
    results.push({
      criterion: 'Generates fix prompts for auto-fixable errors',
      plugin: 'error-capture',
      passed: hasFixPrompt,
      actual: hasFixPrompt ? 'Generated' : 'Not generated',
      expected: 'Generated'
    })
    
    // Criterion 5: hasErrors function works
    const errorOutputHasErrors = hasErrors(npmErrorOutput)
    const cleanOutputNoErrors = hasErrors('Build succeeded with 0 errors')
    
    const hasErrorsWorks = errorOutputHasErrors && !cleanOutputNoErrors
    
    results.push({
      criterion: 'hasErrors correctly identifies error output',
      plugin: 'error-capture',
      passed: hasErrorsWorks,
      actual: hasErrorsWorks ? 'Works' : 'Incorrect',
      expected: 'Works'
    })
    
  } catch (error: any) {
    results.push({
      criterion: 'Error capture plugin loads without error',
      plugin: 'error-capture',
      passed: false,
      actual: `Error: ${error.message}`,
      expected: 'No errors'
    })
  }
  
  return results
}

// Export for IPC handler
export { 
  validateCodeReviewPlugin, 
  validateMemoryPlugin, 
  validateGitHubPlugin,
  validateCodeSimplifierPlugin,
  validateErrorCapturePlugin
}
