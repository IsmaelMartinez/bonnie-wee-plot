import { describe, it, expect } from 'vitest'
import {
  getCustomTasks,
  addCustomTask,
  toggleCustomTask,
  updateCustomTask,
  removeCustomTask,
} from '@/services/allotment-storage'
import { AllotmentData } from '@/types/unified-allotment'

function makeData(customTasks?: AllotmentData['customTasks']): AllotmentData {
  return {
    version: 17,
    meta: { name: 'Test', createdAt: '', updatedAt: '' },
    layout: { areas: [] },
    seasons: [],
    currentYear: 2026,
    varieties: [],
    customTasks,
  }
}

describe('custom tasks storage', () => {
  describe('getCustomTasks', () => {
    it('returns empty array when no custom tasks exist', () => {
      const data = makeData()
      expect(getCustomTasks(data)).toEqual([])
    })

    it('returns empty array when customTasks is undefined', () => {
      const data = makeData(undefined)
      expect(getCustomTasks(data)).toEqual([])
    })

    it('returns existing custom tasks', () => {
      const tasks = [
        { id: '1', description: 'Buy compost', completed: false, createdAt: '2026-03-01' },
        { id: '2', description: 'Fix fence', completed: true, createdAt: '2026-02-28', completedAt: '2026-03-01' },
      ]
      const data = makeData(tasks)
      expect(getCustomTasks(data)).toEqual(tasks)
    })
  })

  describe('addCustomTask', () => {
    it('adds a task to the beginning of the list', () => {
      const data = makeData([
        { id: 'existing', description: 'Existing task', completed: false, createdAt: '2026-03-01' },
      ])
      const result = addCustomTask(data, { description: 'New task' })
      expect(result.customTasks).toHaveLength(2)
      expect(result.customTasks![0].description).toBe('New task')
      expect(result.customTasks![0].completed).toBe(false)
      expect(result.customTasks![0].id).toContain('custom-task')
      expect(result.customTasks![1].id).toBe('existing')
    })

    it('initialises the array when customTasks is undefined', () => {
      const data = makeData(undefined)
      const result = addCustomTask(data, { description: 'First task' })
      expect(result.customTasks).toHaveLength(1)
      expect(result.customTasks![0].description).toBe('First task')
    })

    it('does not mutate the original data', () => {
      const data = makeData([])
      const result = addCustomTask(data, { description: 'Test' })
      expect(data.customTasks).toHaveLength(0)
      expect(result.customTasks).toHaveLength(1)
    })
  })

  describe('toggleCustomTask', () => {
    it('marks an incomplete task as completed', () => {
      const data = makeData([
        { id: 'task-1', description: 'Do thing', completed: false, createdAt: '2026-03-01' },
      ])
      const result = toggleCustomTask(data, 'task-1')
      expect(result.customTasks![0].completed).toBe(true)
      expect(result.customTasks![0].completedAt).toBeDefined()
    })

    it('marks a completed task as incomplete', () => {
      const data = makeData([
        { id: 'task-1', description: 'Do thing', completed: true, createdAt: '2026-03-01', completedAt: '2026-03-01' },
      ])
      const result = toggleCustomTask(data, 'task-1')
      expect(result.customTasks![0].completed).toBe(false)
      expect(result.customTasks![0].completedAt).toBeUndefined()
    })

    it('does not affect other tasks', () => {
      const data = makeData([
        { id: 'task-1', description: 'First', completed: false, createdAt: '2026-03-01' },
        { id: 'task-2', description: 'Second', completed: false, createdAt: '2026-03-01' },
      ])
      const result = toggleCustomTask(data, 'task-1')
      expect(result.customTasks![0].completed).toBe(true)
      expect(result.customTasks![1].completed).toBe(false)
    })
  })

  describe('updateCustomTask', () => {
    it('updates the description of a task', () => {
      const data = makeData([
        { id: 'task-1', description: 'Old text', completed: false, createdAt: '2026-03-01' },
      ])
      const result = updateCustomTask(data, 'task-1', 'New text')
      expect(result.customTasks![0].description).toBe('New text')
    })

    it('does not affect other fields', () => {
      const data = makeData([
        { id: 'task-1', description: 'Old', completed: true, createdAt: '2026-03-01', completedAt: '2026-03-01' },
      ])
      const result = updateCustomTask(data, 'task-1', 'Updated')
      expect(result.customTasks![0].completed).toBe(true)
      expect(result.customTasks![0].completedAt).toBe('2026-03-01')
    })
  })

  describe('removeCustomTask', () => {
    it('removes the specified task', () => {
      const data = makeData([
        { id: 'task-1', description: 'Keep', completed: false, createdAt: '2026-03-01' },
        { id: 'task-2', description: 'Remove', completed: false, createdAt: '2026-03-01' },
      ])
      const result = removeCustomTask(data, 'task-2')
      expect(result.customTasks).toHaveLength(1)
      expect(result.customTasks![0].id).toBe('task-1')
    })

    it('handles removing from empty list gracefully', () => {
      const data = makeData([])
      const result = removeCustomTask(data, 'nonexistent')
      expect(result.customTasks).toHaveLength(0)
    })
  })
})
