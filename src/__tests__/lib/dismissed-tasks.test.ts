import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadDismissedTaskIds, dismissTask, restoreTask } from '@/lib/dismissed-tasks'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('dismissed-tasks', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('loadDismissedTaskIds', () => {
    it('should return empty set when no data stored', () => {
      const ids = loadDismissedTaskIds(2, 2025)
      expect(ids.size).toBe(0)
    })

    it('should return stored task IDs for matching month/year', () => {
      localStorageMock.setItem('allotment-dismissed-tasks', JSON.stringify({
        month: 2,
        year: 2025,
        taskIds: ['task-1', 'task-2'],
      }))

      const ids = loadDismissedTaskIds(2, 2025)
      expect(ids.size).toBe(2)
      expect(ids.has('task-1')).toBe(true)
      expect(ids.has('task-2')).toBe(true)
    })

    it('should return empty set and clear storage for different month', () => {
      localStorageMock.setItem('allotment-dismissed-tasks', JSON.stringify({
        month: 1,
        year: 2025,
        taskIds: ['task-1'],
      }))

      const ids = loadDismissedTaskIds(2, 2025)
      expect(ids.size).toBe(0)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('allotment-dismissed-tasks')
    })

    it('should return empty set for different year', () => {
      localStorageMock.setItem('allotment-dismissed-tasks', JSON.stringify({
        month: 2,
        year: 2024,
        taskIds: ['task-1'],
      }))

      const ids = loadDismissedTaskIds(2, 2025)
      expect(ids.size).toBe(0)
    })

    it('should handle corrupted data gracefully', () => {
      localStorageMock.setItem('allotment-dismissed-tasks', 'not-json')

      const ids = loadDismissedTaskIds(2, 2025)
      expect(ids.size).toBe(0)
    })
  })

  describe('dismissTask', () => {
    it('should add task ID to storage', () => {
      dismissTask('task-1', 3, 2025)

      const stored = JSON.parse(localStorageMock.getItem('allotment-dismissed-tasks')!)
      expect(stored.month).toBe(3)
      expect(stored.year).toBe(2025)
      expect(stored.taskIds).toContain('task-1')
    })

    it('should accumulate multiple dismissed tasks', () => {
      dismissTask('task-1', 3, 2025)
      dismissTask('task-2', 3, 2025)

      const stored = JSON.parse(localStorageMock.getItem('allotment-dismissed-tasks')!)
      expect(stored.taskIds).toHaveLength(2)
      expect(stored.taskIds).toContain('task-1')
      expect(stored.taskIds).toContain('task-2')
    })
  })

  describe('restoreTask', () => {
    it('should remove task ID from storage', () => {
      dismissTask('task-1', 3, 2025)
      dismissTask('task-2', 3, 2025)

      restoreTask('task-1', 3, 2025)

      const stored = JSON.parse(localStorageMock.getItem('allotment-dismissed-tasks')!)
      expect(stored.taskIds).toHaveLength(1)
      expect(stored.taskIds).not.toContain('task-1')
      expect(stored.taskIds).toContain('task-2')
    })

    it('should remove storage key when last task is restored', () => {
      dismissTask('task-1', 3, 2025)

      restoreTask('task-1', 3, 2025)

      // Called by restoreTask when empty
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('allotment-dismissed-tasks')
    })
  })
})
