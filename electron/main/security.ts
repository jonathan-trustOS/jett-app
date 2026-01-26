/**
 * Jett Security Module
 * Path validation, rate limiting, and permission checks
 */

import path from 'path'
import { app } from 'electron'

// ============================================================================
// PATH VALIDATION
// ============================================================================

const HOME = app.getPath('home')

const ALLOWED_PATHS = [
  path.join(HOME, 'Documents', 'Jett'),
  path.join(HOME, '.config', 'jett'),
  // Also allow the app's userData directory
  app.getPath('userData'),
]

/**
 * Validate that a file path is within allowed directories
 * Prevents path traversal attacks
 */
export function validatePath(filePath: string): boolean {
  try {
    const resolved = path.resolve(filePath)
    return ALLOWED_PATHS.some(allowed => resolved.startsWith(allowed))
  } catch {
    return false
  }
}

/**
 * Sanitize a path by removing traversal attempts
 */
export function sanitizePath(filePath: string): string {
  return filePath
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .replace(/\\/g, '/')
}

/**
 * Validate project name (alphanumeric, hyphens, underscores only)
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: 'Project name is required' }
  }
  if (name.length > 50) {
    return { valid: false, error: 'Project name too long (max 50 characters)' }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { valid: false, error: 'Project name can only contain letters, numbers, hyphens, and underscores' }
  }
  if (name.includes('..')) {
    return { valid: false, error: 'Invalid project name' }
  }
  return { valid: true }
}

/**
 * Sanitize string for safe shell execution
 */
export function sanitizeForShell(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, '')
}

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  timestamps: number[]
}

const rateLimiter = new Map<string, RateLimitEntry>()

/**
 * Check if an operation is rate limited
 * @param operation - Unique identifier for the operation
 * @param maxPerMinute - Maximum allowed calls per minute
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(operation: string, maxPerMinute: number = 60): boolean {
  const now = Date.now()
  const entry = rateLimiter.get(operation) || { timestamps: [] }
  
  // Remove timestamps older than 1 minute
  entry.timestamps = entry.timestamps.filter(t => now - t < 60000)
  
  if (entry.timestamps.length >= maxPerMinute) {
    return false // Rate limited
  }
  
  entry.timestamps.push(now)
  rateLimiter.set(operation, entry)
  return true
}

/**
 * Get remaining calls for an operation
 */
export function getRateLimitRemaining(operation: string, maxPerMinute: number = 60): number {
  const now = Date.now()
  const entry = rateLimiter.get(operation)
  
  if (!entry) return maxPerMinute
  
  const recent = entry.timestamps.filter(t => now - t < 60000)
  return Math.max(0, maxPerMinute - recent.length)
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate PRD content
 */
export function validatePRDContent(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (content.length > 50000) {
    errors.push('Content too long (max 50,000 characters)')
  }
  
  // Check for suspicious patterns (potential XSS or injection)
  const suspicious = /<script|javascript:|data:|onclick|onerror|onload/i
  if (suspicious.test(content)) {
    errors.push('Invalid content detected')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validate test code before execution
 * Prevents malicious code in AI-generated tests
 */
export function validateTestCode(code: string): { valid: boolean; error?: string } {
  // Check for dangerous patterns
  const dangerous = /eval\s*\(|new\s+Function|import\s*\(|require\s*\(|fetch\s*\(|XMLHttpRequest|WebSocket|Worker|localStorage|sessionStorage|document\.cookie/i
  
  if (dangerous.test(code)) {
    return { valid: false, error: 'Test code contains disallowed operations' }
  }
  
  // Whitelist allowed Playwright page methods
  const ALLOWED_PAGE_METHODS = [
    'goto', 'fill', 'click', 'type', 'press',
    'waitForSelector', 'waitForTimeout', 'waitForURL',
    'textContent', 'innerText', 'innerHTML',
    'isVisible', 'isEnabled', 'isChecked',
    'screenshot', 'url', 'title',
    'locator', 'getByRole', 'getByText', 'getByLabel',
    'evaluate' // Allow but will be further restricted
  ]
  
  // Extract page method calls
  const methodCalls = code.match(/page\.(\w+)/g) || []
  
  for (const call of methodCalls) {
    const method = call.replace('page.', '')
    if (!ALLOWED_PAGE_METHODS.includes(method)) {
      return { valid: false, error: `Disallowed page method: ${method}` }
    }
  }
  
  return { valid: true }
}

// ============================================================================
// SECURITY WRAPPER FOR IPC HANDLERS
// ============================================================================

/**
 * Wrap a file operation handler with path validation
 */
export function withPathValidation<T>(
  handler: (filePath: string, ...args: any[]) => Promise<T>
): (filePath: string, ...args: any[]) => Promise<T> {
  return async (filePath: string, ...args: any[]) => {
    if (!validatePath(filePath)) {
      throw new Error(`Access denied: Path not allowed - ${filePath}`)
    }
    return handler(filePath, ...args)
  }
}

/**
 * Wrap an API operation with rate limiting
 */
export function withRateLimit<T>(
  operation: string,
  maxPerMinute: number,
  handler: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
  return async (...args: any[]) => {
    if (!checkRateLimit(operation, maxPerMinute)) {
      const remaining = getRateLimitRemaining(operation, maxPerMinute)
      throw new Error(`Rate limited: Too many requests. Try again in ${60 - remaining} seconds.`)
    }
    return handler(...args)
  }
}

export default {
  validatePath,
  sanitizePath,
  validateProjectName,
  sanitizeForShell,
  checkRateLimit,
  getRateLimitRemaining,
  validatePRDContent,
  validateTestCode,
  withPathValidation,
  withRateLimit,
}
