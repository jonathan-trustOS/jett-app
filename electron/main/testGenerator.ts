/**
 * Jett Test Generator Module
 * AI prompts for generating Playwright tests
 */

// ============================================================================
// TEST TEMPLATES
// ============================================================================

const TEST_TEMPLATES: Record<string, string> = {
  form: `
Write a Playwright test for the form you just created.
The test should:
1. Navigate to the page containing the form
2. Fill in all required fields with realistic test data
3. Submit the form
4. Verify the expected outcome (redirect, success message, or data update)

Keep the test simple and focused on core functionality.
`,

  button: `
Write a Playwright test for the button/action you just created.
The test should:
1. Navigate to the page with the button
2. Click the button
3. Verify the expected outcome (state change, modal appears, navigation occurs)

Keep the test simple and focused on core functionality.
`,

  list: `
Write a Playwright test for the list/data display you just created.
The test should:
1. Navigate to the page
2. Verify items are displayed
3. Test basic interactions if applicable (click item, filter, sort)

Keep the test simple and focused on core functionality.
`,

  auth: `
Write a Playwright test for the authentication flow.
The test should:
1. Navigate to the login/signup page
2. Fill in test credentials
3. Submit the form
4. Verify redirect to authenticated area OR proper error handling

Use test credentials: email="test@example.com", password="TestPass123!"
`,

  navigation: `
Write a Playwright test for the navigation you just created.
The test should:
1. Start at the home/landing page
2. Click the navigation element
3. Verify the correct page loads

Keep the test simple and focused on core functionality.
`,

  modal: `
Write a Playwright test for the modal/dialog you just created.
The test should:
1. Navigate to the page with the modal trigger
2. Click to open the modal
3. Verify modal content is visible
4. Close the modal (if applicable)
5. Verify modal is dismissed

Keep the test simple and focused on core functionality.
`,

  crud: `
Write a Playwright test for the create/read/update/delete operation.
The test should:
1. Navigate to the relevant page
2. Create a new item with test data
3. Verify the item appears in the list/display
4. (Optional) Update or delete if the UI supports it

Keep the test simple and focused on core functionality.
`,
}

// ============================================================================
// TASK TYPE INFERENCE
// ============================================================================

/**
 * Infer the type of task from its description
 */
export function inferTaskType(description: string): string {
  const lower = description.toLowerCase()

  // Check patterns in order of specificity
  if (lower.includes('login') || lower.includes('signup') || lower.includes('sign in') || lower.includes('sign up') || lower.includes('auth')) {
    return 'auth'
  }
  if (lower.includes('form') || lower.includes('input') || lower.includes('submit')) {
    return 'form'
  }
  if (lower.includes('modal') || lower.includes('dialog') || lower.includes('popup')) {
    return 'modal'
  }
  if (lower.includes('list') || lower.includes('table') || lower.includes('display') || lower.includes('show')) {
    return 'list'
  }
  if (lower.includes('nav') || lower.includes('menu') || lower.includes('link') || lower.includes('route')) {
    return 'navigation'
  }
  if (lower.includes('create') || lower.includes('add') || lower.includes('edit') || lower.includes('delete') || lower.includes('update')) {
    return 'crud'
  }

  // Default to button (most generic)
  return 'button'
}

// ============================================================================
// PROMPT GENERATION
// ============================================================================

/**
 * Generate a test prompt for the AI based on the task
 */
export function getTestPrompt(taskDescription: string, taskType?: string): string {
  const type = taskType || inferTaskType(taskDescription)
  const template = TEST_TEMPLATES[type] || TEST_TEMPLATES.button

  return `
You just completed this task: "${taskDescription}"

${template}

The app runs at http://localhost:5174.

IMPORTANT RULES:
- Write ONLY the test code, no explanations
- Use page.goto(), page.fill(), page.click(), page.waitForSelector()
- Use assertions like: await expect(page.locator('...')).toBeVisible()
- Keep selectors simple: prefer [data-testid], [name], button text, input labels
- Test code must be self-contained (no imports needed)

Format your response as:
\`\`\`playwright
// Your test code here
\`\`\`
`
}

/**
 * Generate a test prompt with additional context
 */
export function getTestPromptWithContext(
  taskDescription: string,
  context: {
    filesCreated?: string[]
    filesModified?: string[]
    previousTasks?: string[]
  }
): string {
  const type = inferTaskType(taskDescription)
  const template = TEST_TEMPLATES[type] || TEST_TEMPLATES.button

  let contextSection = ''

  if (context.filesCreated?.length) {
    contextSection += `\nFiles created: ${context.filesCreated.join(', ')}`
  }
  if (context.filesModified?.length) {
    contextSection += `\nFiles modified: ${context.filesModified.join(', ')}`
  }
  if (context.previousTasks?.length) {
    contextSection += `\nPrevious tasks completed: ${context.previousTasks.slice(-3).join(', ')}`
  }

  return `
You just completed this task: "${taskDescription}"
${contextSection}

${template}

The app runs at http://localhost:5174.

IMPORTANT RULES:
- Write ONLY the test code, no explanations
- Use page.goto(), page.fill(), page.click(), page.waitForSelector()
- Use assertions like: await expect(page.locator('...')).toBeVisible()
- Keep selectors simple: prefer [data-testid], [name], button text, input labels
- Test code must be self-contained (no imports needed)

Format your response as:
\`\`\`playwright
// Your test code here
\`\`\`
`
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Extract test code from AI response
 */
export function extractTestCode(aiResponse: string): string | null {
  // Try playwright code block first
  const playwrightMatch = aiResponse.match(/```playwright\n([\s\S]*?)```/)
  if (playwrightMatch) {
    return playwrightMatch[1].trim()
  }

  // Try generic code block
  const codeMatch = aiResponse.match(/```(?:typescript|javascript|ts|js)?\n([\s\S]*?)```/)
  if (codeMatch) {
    return codeMatch[1].trim()
  }

  // Try to find test-like code without code blocks
  const testMatch = aiResponse.match(/((?:await\s+)?page\.[^`]+)/s)
  if (testMatch) {
    return testMatch[1].trim()
  }

  return null
}

/**
 * Validate extracted test code has required structure
 */
export function validateTestStructure(testCode: string): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check for page interaction
  if (!testCode.includes('page.')) {
    issues.push('Test must include page interactions (page.goto, page.click, etc.)')
  }

  // Check for some form of navigation or action
  if (!testCode.includes('goto') && !testCode.includes('click') && !testCode.includes('fill')) {
    issues.push('Test should include navigation or user actions')
  }

  // Warn if no assertions (not blocking, just a warning)
  if (!testCode.includes('expect') && !testCode.includes('waitFor')) {
    issues.push('Warning: Test has no assertions or wait conditions')
  }

  return {
    valid: issues.filter(i => !i.startsWith('Warning')).length === 0,
    issues,
  }
}

// ============================================================================
// FIX PROMPT GENERATION
// ============================================================================

/**
 * Generate a prompt to fix a failed test
 */
export function getFixPrompt(
  originalTask: string,
  testCode: string,
  error: string,
  screenshot?: string
): string {
  return `
The test for "${originalTask}" failed with this error:

ERROR: ${error}

ORIGINAL TEST CODE:
\`\`\`
${testCode}
\`\`\`

${screenshot ? 'A screenshot of the failure state is attached.' : ''}

Please fix the code to make this test pass. Common issues:
- Selector not found: Update selector to match actual DOM
- Timeout: Add waitForSelector before interactions
- Element not interactable: Wait for element to be visible/enabled
- Wrong URL: Check the actual route

Respond with the FIXED code only:
\`\`\`playwright
// Fixed test code here
\`\`\`
`
}

export default {
  inferTaskType,
  getTestPrompt,
  getTestPromptWithContext,
  extractTestCode,
  validateTestStructure,
  getFixPrompt,
}
