import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTasksForMonth } from '@/lib/task-generator'
import { Area, Planting } from '@/types/unified-allotment'
import { Month } from '@/types/garden-planner'

// Mock the vegetable database
vi.mock('@/lib/vegetable-database', () => ({
  getVegetableById: vi.fn()
}))

import { getVegetableById } from '@/lib/vegetable-database'

const mockGetVegetableById = getVegetableById as ReturnType<typeof vi.fn>

describe('task-generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateTasksForMonth', () => {
    it('should generate harvest tasks when current month is in harvestMonths', () => {
      const planting: Planting = {
        id: 'planting-1',
        plantId: 'peas',
        varietyName: 'Kelvedon Wonder'
      }

      const plantingsWithContext = [
        { planting, areaId: 'bed-a', areaName: 'Bed A' }
      ]

      mockGetVegetableById.mockReturnValue({
        id: 'peas',
        name: 'Peas',
        planting: {
          harvestMonths: [6, 7, 8],
          sowIndoorsMonths: [3, 4],
          sowOutdoorsMonths: [4, 5],
          transplantMonths: [5, 6]
        }
      })

      const tasks = generateTasksForMonth(7 as Month, plantingsWithContext, [])

      const harvestTasks = tasks.filter(t => t.generatedType === 'harvest')
      expect(harvestTasks).toHaveLength(1)
      expect(harvestTasks[0].description).toBe('Harvest Peas (Kelvedon Wonder)')
      expect(harvestTasks[0].priority).toBe('high')
    })

    it('should generate sow indoors tasks when current month is in sowIndoorsMonths', () => {
      const planting: Planting = {
        id: 'planting-1',
        plantId: 'tomato'
      }

      const plantingsWithContext = [
        { planting, areaId: 'bed-b', areaName: 'Bed B' }
      ]

      mockGetVegetableById.mockReturnValue({
        id: 'tomato',
        name: 'Tomato',
        planting: {
          harvestMonths: [7, 8, 9],
          sowIndoorsMonths: [3, 4],
          sowOutdoorsMonths: [],
          transplantMonths: [5, 6]
        }
      })

      const tasks = generateTasksForMonth(3 as Month, plantingsWithContext, [])

      const sowTasks = tasks.filter(t => t.generatedType === 'sow-indoors')
      expect(sowTasks).toHaveLength(1)
      expect(sowTasks[0].description).toBe('Sow Tomato indoors')
      expect(sowTasks[0].priority).toBe('medium')
    })

    it('should generate pruning tasks for perennial areas with maintenance info', () => {
      const area: Area = {
        id: 'apple-tree',
        name: 'Apple Tree',
        kind: 'tree',
        canHavePlantings: true,
        primaryPlant: {
          plantId: 'apple-tree',
          variety: 'Bramley'
        }
      }

      mockGetVegetableById.mockReturnValue({
        id: 'apple-tree',
        name: 'Apple Tree',
        planting: {
          harvestMonths: [9, 10],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [],
          transplantMonths: []
        },
        maintenance: {
          pruneMonths: [12, 1, 2],
          feedMonths: [3],
          notes: ['Winter prune when dormant']
        }
      })

      const tasks = generateTasksForMonth(1 as Month, [], [area])

      const pruneTasks = tasks.filter(t => t.generatedType === 'prune')
      expect(pruneTasks).toHaveLength(1)
      expect(pruneTasks[0].description).toBe('Prune Apple Tree (Bramley)')
      expect(pruneTasks[0].notes).toBe('Winter prune when dormant')
    })

    it('should generate feeding tasks for perennial areas', () => {
      const area: Area = {
        id: 'raspberry',
        name: 'Raspberry Patch',
        kind: 'berry',
        canHavePlantings: true,
        primaryPlant: {
          plantId: 'raspberry'
        }
      }

      mockGetVegetableById.mockReturnValue({
        id: 'raspberry',
        name: 'Raspberry',
        planting: {
          harvestMonths: [7, 8],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [],
          transplantMonths: []
        },
        maintenance: {
          feedMonths: [3],
          pruneMonths: [2, 8]
        }
      })

      const tasks = generateTasksForMonth(3 as Month, [], [area])

      const feedTasks = tasks.filter(t => t.generatedType === 'feed')
      expect(feedTasks).toHaveLength(1)
      expect(feedTasks[0].description).toBe('Feed Raspberry Patch')
      expect(feedTasks[0].priority).toBe('low')
    })

    it('should return empty array when no tasks match current month', () => {
      const planting: Planting = {
        id: 'planting-1',
        plantId: 'garlic'
      }

      const plantingsWithContext = [
        { planting, areaId: 'bed-a', areaName: 'Bed A' }
      ]

      mockGetVegetableById.mockReturnValue({
        id: 'garlic',
        name: 'Garlic',
        planting: {
          harvestMonths: [7, 8],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [10, 11],
          transplantMonths: []
        }
      })

      const tasks = generateTasksForMonth(4 as Month, plantingsWithContext, [])

      expect(tasks).toHaveLength(0)
    })

    it('should deduplicate tasks for the same plant', () => {
      const planting1: Planting = { id: 'p1', plantId: 'peas' }
      const planting2: Planting = { id: 'p2', plantId: 'peas' }

      const plantingsWithContext = [
        { planting: planting1, areaId: 'bed-a', areaName: 'Bed A' },
        { planting: planting2, areaId: 'bed-b', areaName: 'Bed B' }
      ]

      mockGetVegetableById.mockReturnValue({
        id: 'peas',
        name: 'Peas',
        planting: {
          harvestMonths: [7],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [],
          transplantMonths: []
        }
      })

      const tasks = generateTasksForMonth(7 as Month, plantingsWithContext, [])

      // Should only have one harvest task despite two plantings
      const harvestTasks = tasks.filter(t => t.generatedType === 'harvest')
      expect(harvestTasks).toHaveLength(1)
    })

    it('should sort tasks by priority (high first)', () => {
      const planting: Planting = { id: 'p1', plantId: 'peas' }

      const plantingsWithContext = [
        { planting, areaId: 'bed-a', areaName: 'Bed A' }
      ]

      const area: Area = {
        id: 'raspberry',
        name: 'Raspberry Patch',
        kind: 'berry',
        canHavePlantings: true,
        primaryPlant: { plantId: 'raspberry' }
      }

      mockGetVegetableById.mockImplementation((id: string) => {
        if (id === 'peas') {
          return {
            id: 'peas',
            name: 'Peas',
            planting: {
              harvestMonths: [7],
              sowIndoorsMonths: [],
              sowOutdoorsMonths: [],
              transplantMonths: []
            }
          }
        }
        if (id === 'raspberry') {
          return {
            id: 'raspberry',
            name: 'Raspberry',
            planting: {
              harvestMonths: [7],
              sowIndoorsMonths: [],
              sowOutdoorsMonths: [],
              transplantMonths: []
            },
            maintenance: {
              feedMonths: [7]
            }
          }
        }
        return undefined
      })

      const tasks = generateTasksForMonth(7 as Month, plantingsWithContext, [area])

      // Harvest (high priority) should come before feed (low priority)
      expect(tasks[0].priority).toBe('high')
      expect(tasks[tasks.length - 1].priority).toBe('low')
    })

    it('should handle unknown vegetables gracefully', () => {
      const planting: Planting = { id: 'p1', plantId: 'unknown-veg' }

      const plantingsWithContext = [
        { planting, areaId: 'bed-a', areaName: 'Bed A' }
      ]

      mockGetVegetableById.mockReturnValue(undefined)

      const tasks = generateTasksForMonth(7 as Month, plantingsWithContext, [])

      expect(tasks).toHaveLength(0)
    })
  })
})
