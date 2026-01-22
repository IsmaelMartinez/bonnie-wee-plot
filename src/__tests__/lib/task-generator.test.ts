import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateTasksForMonth,
  generateDateBasedTasks,
  generateSuccessionReminders,
  getUrgency
} from '@/lib/task-generator'
import { Area, Planting } from '@/types/unified-allotment'
import { Month } from '@/types/garden-planner'

// Mock the vegetable database
vi.mock('@/lib/vegetable-database', () => ({
  getVegetableById: vi.fn()
}))

// Mock date-calculator
vi.mock('@/lib/date-calculator', () => ({
  getGerminationDays: vi.fn().mockReturnValue({ min: 7, max: 14 })
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

  describe('getUrgency', () => {
    it('should return overdue for negative days', () => {
      expect(getUrgency(-3)).toBe('overdue')
      expect(getUrgency(-1)).toBe('overdue')
    })

    it('should return today for zero days', () => {
      expect(getUrgency(0)).toBe('today')
    })

    it('should return this-week for 1-7 days', () => {
      expect(getUrgency(1)).toBe('this-week')
      expect(getUrgency(7)).toBe('this-week')
    })

    it('should return upcoming for 8-14 days', () => {
      expect(getUrgency(8)).toBe('upcoming')
      expect(getUrgency(14)).toBe('upcoming')
    })

    it('should return later for more than 14 days', () => {
      expect(getUrgency(15)).toBe('later')
      expect(getUrgency(30)).toBe('later')
    })
  })

  describe('generateDateBasedTasks', () => {
    it('should generate harvest task when expectedHarvestStart is within 7 days', () => {
      const today = new Date('2025-06-10')
      const planting: Planting = {
        id: 'p1',
        plantId: 'lettuce',
        expectedHarvestStart: '2025-06-15',
        expectedHarvestEnd: '2025-06-30'
      }

      mockGetVegetableById.mockReturnValue({
        id: 'lettuce',
        name: 'Lettuce',
        category: 'leafy-greens',
        planting: {
          harvestMonths: [5, 6, 7, 8, 9],
          sowIndoorsMonths: [3, 4],
          sowOutdoorsMonths: [4, 5, 6],
          transplantMonths: []
        }
      })

      const tasks = generateDateBasedTasks(
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        today
      )

      expect(tasks).toHaveLength(1)
      expect(tasks[0].generatedType).toBe('harvest')
      expect(tasks[0].urgency).toBe('this-week')
      expect(tasks[0].daysRemaining).toBe(5)
      expect(tasks[0].calculatedFrom).toBe('actual-date')
    })

    it('should mark task as overdue when past expectedHarvestStart', () => {
      const today = new Date('2025-06-18')
      const planting: Planting = {
        id: 'p1',
        plantId: 'lettuce',
        expectedHarvestStart: '2025-06-15',
        expectedHarvestEnd: '2025-06-30'
      }

      mockGetVegetableById.mockReturnValue({
        id: 'lettuce',
        name: 'Lettuce',
        category: 'leafy-greens',
        planting: {
          harvestMonths: [6],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [4, 5],
          transplantMonths: []
        }
      })

      const tasks = generateDateBasedTasks(
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        today
      )

      expect(tasks).toHaveLength(1)
      expect(tasks[0].urgency).toBe('overdue')
      expect(tasks[0].daysRemaining).toBe(-3)
      expect(tasks[0].priority).toBe('high')
    })

    it('should not generate harvest task for already harvested plantings', () => {
      const today = new Date('2025-06-15')
      const planting: Planting = {
        id: 'p1',
        plantId: 'lettuce',
        expectedHarvestStart: '2025-06-10',
        expectedHarvestEnd: '2025-06-25',
        actualHarvestStart: '2025-06-12' // Already harvested
      }

      mockGetVegetableById.mockReturnValue({
        id: 'lettuce',
        name: 'Lettuce',
        category: 'leafy-greens',
        planting: {
          harvestMonths: [6],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [],
          transplantMonths: []
        }
      })

      const tasks = generateDateBasedTasks(
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        today
      )

      expect(tasks).toHaveLength(0)
    })

    it('should generate transplant reminder for indoor sowings', () => {
      const today = new Date('2025-04-20')
      const planting: Planting = {
        id: 'p1',
        plantId: 'tomato',
        sowDate: '2025-04-01',
        sowMethod: 'indoor'
        // No transplantDate yet
      }

      mockGetVegetableById.mockReturnValue({
        id: 'tomato',
        name: 'Tomato',
        category: 'solanaceae',
        planting: {
          harvestMonths: [7, 8, 9],
          sowIndoorsMonths: [3, 4],
          sowOutdoorsMonths: [],
          transplantMonths: [5, 6]
        }
      })

      const tasks = generateDateBasedTasks(
        [{ planting, areaId: 'bed-b', areaName: 'Bed B' }],
        today
      )

      const transplantTasks = tasks.filter(t => t.generatedType === 'transplant')
      expect(transplantTasks).toHaveLength(1)
      expect(transplantTasks[0].calculatedFrom).toBe('actual-date')
      expect(transplantTasks[0].notes).toContain('Seedlings')
    })
  })

  describe('generateSuccessionReminders', () => {
    it('should generate succession sowing reminder when last sowing is old enough', () => {
      const today = new Date('2025-06-15')
      const planting: Planting = {
        id: 'p1',
        plantId: 'lettuce',
        sowDate: '2025-05-20' // 26 days ago
      }

      mockGetVegetableById.mockReturnValue({
        id: 'lettuce',
        name: 'Lettuce',
        category: 'leafy-greens',
        planting: {
          harvestMonths: [5, 6, 7, 8],
          sowIndoorsMonths: [3, 4],
          sowOutdoorsMonths: [4, 5, 6, 7],
          transplantMonths: []
        }
      })

      const tasks = generateSuccessionReminders(
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        today
      )

      expect(tasks).toHaveLength(1)
      expect(tasks[0].generatedType).toBe('succession')
      expect(tasks[0].description).toContain('Succession sow')
      expect(tasks[0].notes).toContain('26 days ago')
    })

    it('should not generate succession reminder for non-succession crops', () => {
      const today = new Date('2025-06-15')
      const planting: Planting = {
        id: 'p1',
        plantId: 'tomato', // Not a succession crop
        sowDate: '2025-03-15' // Long ago
      }

      mockGetVegetableById.mockReturnValue({
        id: 'tomato',
        name: 'Tomato',
        category: 'solanaceae',
        planting: {
          harvestMonths: [7, 8, 9],
          sowIndoorsMonths: [3, 4],
          sowOutdoorsMonths: [],
          transplantMonths: [5, 6]
        }
      })

      const tasks = generateSuccessionReminders(
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        today
      )

      expect(tasks).toHaveLength(0)
    })

    it('should not generate succession reminder outside sowing season', () => {
      const today = new Date('2025-11-15') // November - outside sowing season for lettuce
      const planting: Planting = {
        id: 'p1',
        plantId: 'lettuce',
        sowDate: '2025-09-15' // 61 days ago
      }

      mockGetVegetableById.mockReturnValue({
        id: 'lettuce',
        name: 'Lettuce',
        category: 'leafy-greens',
        planting: {
          harvestMonths: [5, 6, 7, 8],
          sowIndoorsMonths: [3, 4],
          sowOutdoorsMonths: [4, 5, 6, 7], // Not in November
          transplantMonths: []
        }
      })

      const tasks = generateSuccessionReminders(
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        today
      )

      expect(tasks).toHaveLength(0)
    })
  })

  describe('date-based vs month-based integration', () => {
    it('should prefer date-based tasks over month-based for same planting', () => {
      const today = new Date('2025-06-10')
      const planting: Planting = {
        id: 'p1',
        plantId: 'peas',
        varietyName: 'Kelvedon Wonder',
        sowDate: '2025-03-15',
        expectedHarvestStart: '2025-06-12',
        expectedHarvestEnd: '2025-06-30'
      }

      mockGetVegetableById.mockReturnValue({
        id: 'peas',
        name: 'Peas',
        category: 'legumes',
        planting: {
          harvestMonths: [6, 7, 8],
          sowIndoorsMonths: [3, 4],
          sowOutdoorsMonths: [4, 5],
          transplantMonths: [5, 6]
        }
      })

      const tasks = generateTasksForMonth(
        6 as Month,
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        [],
        today
      )

      const harvestTasks = tasks.filter(t => t.generatedType === 'harvest')
      expect(harvestTasks).toHaveLength(1)
      expect(harvestTasks[0].calculatedFrom).toBe('actual-date')
      expect(harvestTasks[0].daysRemaining).toBe(2)
    })

    it('should fall back to month-based for plantings without dates', () => {
      const today = new Date('2025-06-10')
      const planting: Planting = {
        id: 'p1',
        plantId: 'peas'
        // No sowDate or expectedHarvestStart
      }

      mockGetVegetableById.mockReturnValue({
        id: 'peas',
        name: 'Peas',
        category: 'legumes',
        planting: {
          harvestMonths: [6, 7, 8],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [],
          transplantMonths: []
        }
      })

      const tasks = generateTasksForMonth(
        6 as Month,
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        [],
        today
      )

      const harvestTasks = tasks.filter(t => t.generatedType === 'harvest')
      expect(harvestTasks).toHaveLength(1)
      expect(harvestTasks[0].calculatedFrom).toBe('calendar-month')
    })
  })
})
