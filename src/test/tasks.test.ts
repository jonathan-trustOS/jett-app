import { describe, it, expect } from 'vitest'

interface Task {
  text: string
  completed: boolean
}

function isTaskLocked(tasks: Task[], index: number): boolean {
  if (index === 0) return false
  return !tasks[index - 1]?.completed
}

function getCompletedCount(tasks: Task[]): number {
  return tasks.filter(t => t.completed).length
}

function toggleTask(tasks: Task[], index: number): Task[] {
  return tasks.map((task, i) => 
    i === index ? { ...task, completed: !task.completed } : task
  )
}

describe('Task Logic', () => {
  const mockTasks: Task[] = [
    { text: 'Task 1', completed: false },
    { text: 'Task 2', completed: false },
    { text: 'Task 3', completed: false },
  ]

  describe('isTaskLocked', () => {
    it('first task is never locked', () => {
      expect(isTaskLocked(mockTasks, 0)).toBe(false)
    })

    it('second task is locked when first is incomplete', () => {
      expect(isTaskLocked(mockTasks, 1)).toBe(true)
    })

    it('second task is unlocked when first is complete', () => {
      const tasks = [
        { text: 'Task 1', completed: true },
        { text: 'Task 2', completed: false },
      ]
      expect(isTaskLocked(tasks, 1)).toBe(false)
    })
  })

  describe('getCompletedCount', () => {
    it('returns 0 when no tasks completed', () => {
      expect(getCompletedCount(mockTasks)).toBe(0)
    })

    it('returns correct count', () => {
      const tasks = [
        { text: 'Task 1', completed: true },
        { text: 'Task 2', completed: true },
        { text: 'Task 3', completed: false },
      ]
      expect(getCompletedCount(tasks)).toBe(2)
    })
  })

  describe('toggleTask', () => {
    it('toggles task to complete', () => {
      const result = toggleTask(mockTasks, 0)
      expect(result[0].completed).toBe(true)
    })
  })
})