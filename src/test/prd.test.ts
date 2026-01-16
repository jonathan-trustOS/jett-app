import { describe, it, expect } from 'vitest'

function extractPrd(response: string): string | null {
  const match = response.match(/---PRD-START---([\s\S]*?)---PRD-END---/)
  return match ? match[1].trim() : null
}

function extractTasks(response: string): string[] | null {
  const match = response.match(/---TASKS-START---([\s\S]*?)---TASKS-END---/)
  if (!match) return null
  return match[1].trim().split('\n').filter(line => line.trim())
}

describe('PRD Extraction', () => {
  const mockResponse = `
---PRD-START---
# Habit Tracker

## Overview
A simple habit tracking app.
---PRD-END---

---TASKS-START---
1. Set up React project
2. Create database schema
3. Build main screen
---TASKS-END---

Ready to start building?
`

  it('extracts PRD content', () => {
    const prd = extractPrd(mockResponse)
    expect(prd).toContain('# Habit Tracker')
  })

  it('returns null when no PRD', () => {
    expect(extractPrd('Hello world')).toBeNull()
  })

  it('extracts tasks', () => {
    const tasks = extractTasks(mockResponse)
    expect(tasks).toHaveLength(3)
  })

  it('returns null when no tasks', () => {
    expect(extractTasks('Hello world')).toBeNull()
  })
})