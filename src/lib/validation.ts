/**
 * Jett Validation Module (Renderer Process)
 * Input sanitization and validation for user inputs
 */

// ============================================================================
// TEXT SANITIZATION
// ============================================================================

/**
 * Basic text sanitization - removes HTML tags
 * For use when DOMPurify is not available
 */
export function sanitizeTextBasic(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

/**
 * Sanitize text using DOMPurify if available
 * Falls back to basic sanitization
 */
export function sanitizeText(input: string): string {
  try {
    // Try to use DOMPurify if it's loaded
    // @ts-ignore
    if (typeof DOMPurify !== 'undefined') {
      // @ts-ignore
      return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
    }
  } catch {
    // DOMPurify not available
  }
  
  return sanitizeTextBasic(input)
}

/**
 * Sanitize HTML content (allows safe tags)
 */
export function sanitizeHTML(input: string): string {
  try {
    // @ts-ignore
    if (typeof DOMPurify !== 'undefined') {
      // @ts-ignore
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target'],
      })
    }
  } catch {
    // DOMPurify not available
  }
  
  return sanitizeTextBasic(input)
}

// ============================================================================
// PROJECT NAME VALIDATION
// ============================================================================

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, error: 'Project name is required' }
  }
  
  if (name.length > 50) {
    return { valid: false, error: 'Project name too long (max 50 characters)' }
  }
  
  if (name.length < 2) {
    return { valid: false, error: 'Project name too short (min 2 characters)' }
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { valid: false, error: 'Only letters, numbers, hyphens, and underscores allowed' }
  }
  
  if (name.startsWith('-') || name.startsWith('_')) {
    return { valid: false, error: 'Project name cannot start with hyphen or underscore' }
  }
  
  if (name.includes('..')) {
    return { valid: false, error: 'Invalid project name' }
  }
  
  // Reserved names
  const reserved = ['con', 'prn', 'aux', 'nul', 'com1', 'lpt1', 'node_modules', 'dist', 'build']
  if (reserved.includes(name.toLowerCase())) {
    return { valid: false, error: 'This name is reserved' }
  }
  
  return { valid: true }
}

// ============================================================================
// PRD VALIDATION
// ============================================================================

export interface PRDValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate PRD content
 */
export function validatePRD(prd: {
  name?: string
  description?: string
  features?: any[]
  screens?: any[]
}): PRDValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Name validation
  if (prd.name) {
    const nameResult = validateProjectName(prd.name)
    if (!nameResult.valid) {
      errors.push(`Name: ${nameResult.error}`)
    }
  }
  
  // Description validation
  if (prd.description) {
    if (prd.description.length > 5000) {
      errors.push('Description too long (max 5,000 characters)')
    }
    
    // Check for suspicious patterns
    const suspicious = /<script|javascript:|data:|onclick|onerror|onload|eval\(/i
    if (suspicious.test(prd.description)) {
      errors.push('Description contains invalid content')
    }
  }
  
  // Features validation
  if (prd.features && Array.isArray(prd.features)) {
    if (prd.features.length > 50) {
      warnings.push('Many features detected. Consider simplifying.')
    }
    
    for (let i = 0; i < prd.features.length; i++) {
      const feature = prd.features[i]
      if (typeof feature === 'object' && feature.description) {
        if (feature.description.length > 1000) {
          errors.push(`Feature ${i + 1}: Description too long`)
        }
      }
    }
  }
  
  // Screens validation
  if (prd.screens && Array.isArray(prd.screens)) {
    if (prd.screens.length > 20) {
      warnings.push('Many screens detected. Build may take longer.')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// API KEY VALIDATION
// ============================================================================

/**
 * Validate Claude API key format
 */
export function validateClaudeApiKey(key: string): ValidationResult {
  if (!key) {
    return { valid: false, error: 'API key is required' }
  }
  
  // Claude API keys start with 'sk-ant-'
  if (!key.startsWith('sk-ant-')) {
    return { valid: false, error: 'Invalid API key format. Should start with sk-ant-' }
  }
  
  if (key.length < 40) {
    return { valid: false, error: 'API key too short' }
  }
  
  return { valid: true }
}

/**
 * Validate Vercel token format
 */
export function validateVercelToken(token: string): ValidationResult {
  if (!token) {
    return { valid: false, error: 'Vercel token is required' }
  }
  
  // Vercel tokens are typically 24+ characters
  if (token.length < 20) {
    return { valid: false, error: 'Token too short' }
  }
  
  return { valid: true }
}

/**
 * Validate Supabase URL format
 */
export function validateSupabaseUrl(url: string): ValidationResult {
  if (!url) {
    return { valid: false, error: 'Supabase URL is required' }
  }
  
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('supabase')) {
      return { valid: false, error: 'URL should be a Supabase project URL' }
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
  
  return { valid: true }
}

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Validate URL format
 */
export function validateUrl(url: string): ValidationResult {
  if (!url) {
    return { valid: false, error: 'URL is required' }
  }
  
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs allowed' }
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
  
  return { valid: true }
}

// ============================================================================
// FORM HELPERS
// ============================================================================

/**
 * Create a validated input handler for React forms
 */
export function createValidatedHandler<T>(
  validator: (value: T) => ValidationResult,
  onValid: (value: T) => void,
  onError: (error: string) => void
): (value: T) => void {
  return (value: T) => {
    const result = validator(value)
    if (result.valid) {
      onValid(value)
      onError('') // Clear error
    } else {
      onError(result.error || 'Invalid input')
    }
  }
}

/**
 * Debounced validation for real-time feedback
 */
export function createDebouncedValidator<T>(
  validator: (value: T) => ValidationResult,
  callback: (result: ValidationResult) => void,
  delay: number = 300
): (value: T) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (value: T) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      const result = validator(value)
      callback(result)
    }, delay)
  }
}

export default {
  sanitizeText,
  sanitizeTextBasic,
  sanitizeHTML,
  validateProjectName,
  validatePRD,
  validateClaudeApiKey,
  validateVercelToken,
  validateSupabaseUrl,
  validateUrl,
  createValidatedHandler,
  createDebouncedValidator,
}
