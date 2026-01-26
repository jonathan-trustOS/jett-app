/**
 * Jett Testing Module
 * Playwright-based functional testing for generated apps
 */

// Lazy load to avoid bundling issues
let chromium: any = null

function getChromium() {
  if (!chromium) {
    try {
      // Use require for Electron main process compatibility
      const playwright = require('playwright')
      chromium = playwright.chromium
      console.log('Playwright chromium loaded:', !!chromium)
    } catch (e: any) {
      console.error('Playwright load failed:', e.message)
    }
  }
  return chromium
}
import { validateTestCode } from './security'

// ============================================================================
// TYPES
// ============================================================================

export interface TestResult {
  passed: boolean
  error?: string
  screenshot?: string  // Base64 of failure state
  duration: number
  logs: string[]
}

export interface TestConfig {
  baseUrl: string
  timeout: number
  retries: number
  headless: boolean
}

const DEFAULT_CONFIG: TestConfig = {
  baseUrl: 'http://localhost:5174',
  timeout: 30000,
  retries: 3,
  headless: true,
}

// ============================================================================
// BROWSER MANAGEMENT
// ============================================================================

let browser: Browser | null = null

/**
 * Initialize Playwright browser
 */
export async function initPlaywright(): Promise<void> {
  if (!browser) {
    const chr = await getChromium()
    browser = await chr.launch({ 
      headless: DEFAULT_CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    console.log('Playwright browser initialized')
  }
}

/**
 * Close Playwright browser
 */
export async function closePlaywright(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
    console.log('Playwright browser closed')
  }
}

/**
 * Check if Playwright is ready
 */
export function isPlaywrightReady(): boolean {
  return browser !== null
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

/**
 * Run a Playwright test
 * @param testCode - The test code to execute
 * @param config - Test configuration
 */
export async function runTest(
  testCode: string,
  config: Partial<TestConfig> = {}
): Promise<TestResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const start = Date.now()
  const logs: string[] = []

  // Validate test code before execution
  const validation = validateTestCode(testCode)
  if (!validation.valid) {
    return {
      passed: false,
      error: `Test validation failed: ${validation.error}`,
      duration: Date.now() - start,
      logs: [`SECURITY: ${validation.error}`],
    }
  }

  // Ensure browser is initialized
  if (!browser) {
    await initPlaywright()
  }

  let context: BrowserContext | null = null
  let page: Page | null = null

  try {
    // Create isolated context for this test
    context = await browser!.newContext({
      viewport: { width: 1280, height: 720 },
    })
    
    page = await context.newPage()

    // Capture console logs
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`)
    })

    // Capture page errors
    page.on('pageerror', error => {
      logs.push(`[error] ${error.message}`)
    })

    // Set timeout
    page.setDefaultTimeout(finalConfig.timeout)

    // Navigate to base URL first
    await page.goto(finalConfig.baseUrl, { waitUntil: 'networkidle' })
    logs.push(`Navigated to ${finalConfig.baseUrl}`)

    // Execute the test code in Node context with page available
    // Using Function constructor to run Playwright commands
    const testFunction = new Function('page', `
      return (async () => {
        ${testCode}
      })()
    `)
    
    await testFunction(page)
    logs.push('Test completed successfully')

    return {
      passed: true,
      duration: Date.now() - start,
      logs,
    }

  } catch (error: any) {
    // Capture screenshot on failure
    let screenshot: string | undefined

    if (page) {
      try {
        const buffer = await page.screenshot({ 
          type: 'jpeg', 
          quality: 50,
          fullPage: false 
        })
        screenshot = buffer.toString('base64')
      } catch (screenshotError) {
        logs.push(`Failed to capture screenshot: ${screenshotError}`)
      }
    }

    return {
      passed: false,
      error: error.message || String(error),
      screenshot,
      duration: Date.now() - start,
      logs,
    }

  } finally {
    // Clean up
    if (context) {
      await context.close()
    }
  }
}

/**
 * Run a test with retries
 */
export async function runTestWithRetries(
  testCode: string,
  config: Partial<TestConfig> = {}
): Promise<TestResult & { attempts: number }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastResult: TestResult | null = null

  for (let attempt = 1; attempt <= finalConfig.retries; attempt++) {
    lastResult = await runTest(testCode, config)

    if (lastResult.passed) {
      return { ...lastResult, attempts: attempt }
    }

    // Wait before retry
    if (attempt < finalConfig.retries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }

  return { ...lastResult!, attempts: finalConfig.retries }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a URL is accessible
 */
export async function checkUrlAccessible(url: string, timeout: number = 5000): Promise<boolean> {
  if (!browser) {
    await initPlaywright()
  }

  const context = await browser!.newContext()
  const page = await context.newPage()

  try {
    page.setDefaultTimeout(timeout)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    return true
  } catch {
    return false
  } finally {
    await context.close()
  }
}

/**
 * Wait for dev server to be ready
 */
export async function waitForDevServer(
  url: string = 'http://localhost:5174',
  maxWaitMs: number = 30000
): Promise<boolean> {
  const start = Date.now()
  
  while (Date.now() - start < maxWaitMs) {
    if (await checkUrlAccessible(url, 2000)) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return false
}

/**
 * Take a screenshot of a URL
 */
export async function takeScreenshot(
  url: string,
  options: { fullPage?: boolean; quality?: number } = {}
): Promise<string | null> {
  if (!browser) {
    await initPlaywright()
  }

  const context = await browser!.newContext()
  const page = await context.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle' })
    const buffer = await page.screenshot({
      type: 'jpeg',
      quality: options.quality ?? 50,
      fullPage: options.fullPage ?? false,
    })
    return buffer.toString('base64')
  } catch (error) {
    console.error('Screenshot failed:', error)
    return null
  } finally {
    await context.close()
  }
}

export default {
  initPlaywright,
  closePlaywright,
  isPlaywrightReady,
  runTest,
  runTestWithRetries,
  checkUrlAccessible,
  waitForDevServer,
  takeScreenshot,
}
