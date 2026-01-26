/**
 * Playwright Test Hook for Build System
 * Runs functional tests after build completes
 */

import { useState, useCallback } from 'react'

export interface TestResult {
  passed: boolean
  error?: string
  duration?: number
  logs?: string[]
}

interface UsePlaywrightTestReturn {
  isRunning: boolean
  lastResult: TestResult | null
  runSmokeTest: (baseUrl: string) => Promise<TestResult>
  runCustomTest: (testCode: string, baseUrl?: string) => Promise<TestResult>
}

/**
 * Hook for running Playwright tests from build system
 */
export function usePlaywrightTest(): UsePlaywrightTestReturn {
  const [isRunning, setIsRunning] = useState(false)
  const [lastResult, setLastResult] = useState<TestResult | null>(null)

  /**
   * Run a basic smoke test - just verify the app loads
   */
  const runSmokeTest = useCallback(async (baseUrl: string): Promise<TestResult> => {
    setIsRunning(true)
    
    const smokeTestCode = `
      // Wait for page to load
      await page.waitForSelector('body', { timeout: 10000 })
      
      // Check page has content
      const bodyText = await page.textContent('body')
      if (!bodyText || bodyText.trim().length < 10) {
        throw new Error('Page appears empty')
      }
      
      // Check no error overlays visible
      const errorOverlay = await page.locator('[class*="error"], [class*="Error"]').first()
      const hasError = await errorOverlay.isVisible().catch(() => false)
      if (hasError) {
        const errorText = await errorOverlay.textContent()
        throw new Error('Error overlay visible: ' + (errorText || 'Unknown error'))
      }
      
      // Check title exists
      const title = await page.title()
      console.log('Page title:', title)
    `
    
    try {
      const result = await window.jett.testing.run(smokeTestCode, baseUrl)
      
      const testResult: TestResult = {
        passed: result.success && result.result?.passed,
        error: result.result?.error || result.error,
        duration: result.result?.duration,
        logs: result.result?.logs
      }
      
      setLastResult(testResult)
      setIsRunning(false)
      return testResult
    } catch (error: any) {
      const testResult: TestResult = {
        passed: false,
        error: error.message
      }
      setLastResult(testResult)
      setIsRunning(false)
      return testResult
    }
  }, [])

  /**
   * Run a custom test with provided code
   */
  const runCustomTest = useCallback(async (testCode: string, baseUrl?: string): Promise<TestResult> => {
    setIsRunning(true)
    
    try {
      const result = await window.jett.testing.run(testCode, baseUrl)
      
      const testResult: TestResult = {
        passed: result.success && result.result?.passed,
        error: result.result?.error || result.error,
        duration: result.result?.duration,
        logs: result.result?.logs
      }
      
      setLastResult(testResult)
      setIsRunning(false)
      return testResult
    } catch (error: any) {
      const testResult: TestResult = {
        passed: false,
        error: error.message
      }
      setLastResult(testResult)
      setIsRunning(false)
      return testResult
    }
  }, [])

  return {
    isRunning,
    lastResult,
    runSmokeTest,
    runCustomTest
  }
}

/**
 * Generate test code for a specific feature
 */
export function generateFeatureTest(feature: {
  name: string
  route: string
  description: string
}): string {
  const testCode = `
    // Navigate to feature page
    await page.goto('${feature.route}')
    await page.waitForLoadState('networkidle')
    
    // Verify page loaded
    const content = await page.textContent('body')
    if (!content || content.length < 20) {
      throw new Error('${feature.name} page appears empty')
    }
    
    // Look for expected elements based on feature type
    ${feature.description.toLowerCase().includes('list') ? `
    // Check for list items
    const listItems = await page.locator('[class*="list"] > *, [class*="grid"] > *, ul > li, table tbody tr').count()
    console.log('Found', listItems, 'list items')
    ` : ''}
    
    ${feature.description.toLowerCase().includes('form') ? `
    // Check for form elements
    const inputs = await page.locator('input, textarea, select').count()
    console.log('Found', inputs, 'form inputs')
    ` : ''}
    
    ${feature.description.toLowerCase().includes('button') ? `
    // Check for buttons
    const buttons = await page.locator('button').count()
    console.log('Found', buttons, 'buttons')
    ` : ''}
    
    console.log('${feature.name} test passed')
  `
  
  return testCode
}

export default usePlaywrightTest
