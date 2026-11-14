import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateTasksForMonth,
  generateDateBasedTasks,
  generateSuccessionReminders,
  generateVarietyTasks,
  getUrgency,
  getTaskLabel
} from '@/lib/task-generator'
import { Area, Planting, StoredVariety } from '@/types/unified-allotment'
import { Month } from '@/types/garden-planner'

// Mock the vegetable database
vi.mock('@/lib/vegetable-database', () => ({
  getVegetableById: vi.fn()
}))

// Mock date-calculator
vi.mock('@/lib/date-calculator', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/date-calculator')>()),
  getGerminationDays: vi.fn().mockReturnValue({ min: 7, max: 14 })
}))

import { getVegetableById } from '@/lib/vegetable-database'

const mockGetVegetableById = getVegetableById as ReturnType<typeof vi.fn>

/** A local time-of-day `today`, as `new Date()` gives in the app (never UTC midnight). */
function localNoon(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 30)
}

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

    it('should not remind to sow a planting that is already sown', () => {
      // Garlic planted in October used to still show "Direct sow Garlic".
      const sown: Planting = { id: 'p-garlic', plantId: 'garlic', sowDate: '2026-10-20', sowMethod: 'outdoor', status: 'active' }

      mockGetVegetableById.mockReturnValue({
        id: 'garlic',
        name: 'Garlic',
        planting: {
          harvestMonths: [7, 8],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [10, 11],
          transplantMonths: [10, 11]
        }
      })

      const tasks = generateTasksForMonth(10 as Month, [{ planting: sown, areaId: 'bed-a', areaName: 'Bed A' }], [], localNoon('2026-10-31'))

      expect(tasks.filter(t => t.generatedType === 'sow-outdoors' || t.generatedType === 'sow-indoors' || t.generatedType === 'transplant')).toHaveLength(0)
    })

    it('should still remind to sow a planned planting of the same crop', () => {
      const planned: Planting = { id: 'p-garlic-2', plantId: 'garlic', status: 'planned' }

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

      const tasks = generateTasksForMonth(10 as Month, [{ planting: planned, areaId: 'bed-a', areaName: 'Bed A' }], [], localNoon('2026-10-31'))

      const sowTasks = tasks.filter(t => t.generatedType === 'sow-outdoors')
      expect(sowTasks).toHaveLength(1)
      expect(sowTasks[0].description).toBe('Direct sow Garlic outdoors')
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

    it('should deduplicate tasks for the same plant in the same area', () => {
      const planting1: Planting = { id: 'p1', plantId: 'peas' }
      const planting2: Planting = { id: 'p2', plantId: 'peas' }

      const plantingsWithContext = [
        { planting: planting1, areaId: 'bed-a', areaName: 'Bed A' },
        { planting: planting2, areaId: 'bed-a', areaName: 'Bed A' }
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

      // Same plant in same area should deduplicate to one task
      const harvestTasks = tasks.filter(t => t.generatedType === 'harvest')
      expect(harvestTasks).toHaveLength(1)
    })

    it('should generate separate tasks for the same plant in different areas', () => {
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

      // Same plant in different areas should generate separate tasks
      const harvestTasks = tasks.filter(t => t.generatedType === 'harvest')
      expect(harvestTasks).toHaveLength(2)
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
      const today = localNoon('2025-06-10')
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
      const today = localNoon('2025-06-18')
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
      const today = localNoon('2025-06-15')
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
      const today = localNoon('2025-04-20')
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

  // `today` carries a local time of day, as `new Date()` does in the app.
  // Run under a non-UTC TZ (e.g. TZ=America/New_York) to exercise local dates.
  describe('date-based tasks with a local time-of-day today', () => {
    const lettuce = {
      id: 'lettuce',
      name: 'Lettuce',
      category: 'leafy-greens',
      planting: {
        harvestMonths: [6],
        sowIndoorsMonths: [3, 4],
        sowOutdoorsMonths: [4, 5, 6, 7],
        transplantMonths: []
      }
    }

    it('says "today" for a harvest due today, late in the evening', () => {
      mockGetVegetableById.mockReturnValue(lettuce)
      const today = new Date(2025, 5, 15, 21, 30)
      const planting: Planting = { id: 'p1', plantId: 'lettuce', expectedHarvestStart: '2025-06-15' }

      const tasks = generateDateBasedTasks([{ planting, areaId: 'bed-a', areaName: 'Bed A' }], today)

      expect(tasks[0].daysRemaining).toBe(0)
      expect(tasks[0].urgency).toBe('today')
      expect(tasks[0].notes).toBe('Ready to harvest today in Bed A')
    })

    it('counts whole calendar days to a harvest after a DST change', () => {
      mockGetVegetableById.mockReturnValue(lettuce)
      const today = new Date(2025, 2, 5, 9, 0)
      const planting: Planting = { id: 'p1', plantId: 'lettuce', expectedHarvestStart: '2025-03-12' }

      const tasks = generateDateBasedTasks([{ planting, areaId: 'bed-a', areaName: 'Bed A' }], today)

      expect(tasks[0].daysRemaining).toBe(7)
    })

    it('dates the transplant reminder on the local calendar day', () => {
      mockGetVegetableById.mockReturnValue({ ...lettuce, id: 'tomato', name: 'Tomato', category: 'solanaceae' })
      const today = new Date(2025, 3, 20, 8, 0)
      const planting: Planting = { id: 'p1', plantId: 'tomato', sowDate: '2025-04-01', sowMethod: 'indoor' }

      const tasks = generateDateBasedTasks([{ planting, areaId: 'bed-b', areaName: 'Bed B' }], today)
      const transplant = tasks.find(t => t.generatedType === 'transplant')

      // sow + 14 germination + 7 hardening = 22 April, two days away.
      expect(transplant?.dueDate).toBe('2025-04-22')
      expect(transplant?.daysRemaining).toBe(2)
    })

    it('counts days since the last sowing on local calendar days', () => {
      mockGetVegetableById.mockReturnValue(lettuce)
      const today = new Date(2025, 5, 15, 7, 0)
      const planting: Planting = { id: 'p1', plantId: 'lettuce', sowDate: '2025-05-25' }

      const tasks = generateSuccessionReminders([{ planting, areaId: 'bed-a', areaName: 'Bed A' }], today)

      expect(tasks[0].notes).toContain('21 days ago')
    })
  })

  describe('generateSuccessionReminders', () => {
    it('should generate succession sowing reminder when last sowing is old enough', () => {
      const today = localNoon('2025-06-15')
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
      const today = localNoon('2025-06-15')
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
      const today = localNoon('2025-11-15') // November - outside sowing season for lettuce
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
      const today = localNoon('2025-06-10')
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
      const today = localNoon('2025-06-10')
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

    it('should include variety-based tasks when varieties are provided', () => {
      const today = localNoon('2025-03-15')
      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'tomato',
        name: 'Moneymaker',
        seedsByYear: { 2025: 'have' },
      }

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

      const tasks = generateTasksForMonth(
        3 as Month,
        [],
        [],
        today,
        [variety],
        2025
      )

      const sowTasks = tasks.filter(t => t.generatedType === 'sow-indoors')
      expect(sowTasks).toHaveLength(1)
      expect(sowTasks[0].description).toBe('Sow Tomato (Moneymaker) indoors')
      expect(sowTasks[0].notes).toContain('seeds ready')
    })

    it('should keep both planting-derived and variety-derived sow tasks for same crop', () => {
      const today = localNoon('2025-03-15')

      // Existing planting of peas (no sow date → generates month-based sow task)
      const planting: Planting = {
        id: 'p1',
        plantId: 'peas',
        varietyName: 'Kelvedon Wonder',
      }

      // Unplanted variety of the same crop with seeds ready
      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'peas',
        name: 'Sugar Snap',
        seedsByYear: { 2025: 'have' },
      }

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

      const tasks = generateTasksForMonth(
        3 as Month,
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        [],
        today,
        [variety],
        2025
      )

      const sowTasks = tasks.filter(t => t.generatedType === 'sow-indoors')
      expect(sowTasks).toHaveLength(2)
      expect(sowTasks.map(t => t.description)).toContain('Sow Peas indoors')
      expect(sowTasks.map(t => t.description)).toContain('Sow Peas (Sugar Snap) indoors')
    })

    it('should deduplicate sow tasks across multiple beds of the same plant', () => {
      const today = localNoon('2025-03-15')

      const plantings = [
        { planting: { id: 'p1', plantId: 'peas' } as Planting, areaId: 'bed-a', areaName: 'Bed A' },
        { planting: { id: 'p2', plantId: 'peas' } as Planting, areaId: 'bed-b', areaName: 'Bed B' },
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

      const tasks = generateTasksForMonth(3 as Month, plantings, [], today)
      const sowTasks = tasks.filter(t => t.generatedType === 'sow-indoors')
      expect(sowTasks).toHaveLength(1)
    })
  })

  describe('generateVarietyTasks', () => {
    it('should generate sow-indoors task for variety with seeds in sowing month', () => {
      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'tomato',
        name: 'Moneymaker',
        seedsByYear: { 2025: 'have' },
      }

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

      const tasks = generateVarietyTasks(3 as Month, [variety], [], 2025)

      expect(tasks).toHaveLength(1)
      expect(tasks[0].generatedType).toBe('sow-indoors')
      expect(tasks[0].description).toBe('Sow Tomato (Moneymaker) indoors')
      expect(tasks[0].notes).toContain('seeds ready')
    })

    it('should generate sow-outdoors task when only outdoor sowing is possible', () => {
      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'radish',
        name: 'French Breakfast',
        seedsByYear: { 2025: 'have' },
      }

      mockGetVegetableById.mockReturnValue({
        id: 'radish',
        name: 'Radish',
        planting: {
          harvestMonths: [5, 6, 7, 8],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [4, 5, 6, 7],
          transplantMonths: []
        }
      })

      const tasks = generateVarietyTasks(5 as Month, [variety], [], 2025)

      expect(tasks).toHaveLength(1)
      expect(tasks[0].generatedType).toBe('sow-outdoors')
      expect(tasks[0].description).toContain('Direct sow Radish')
    })

    it('should not generate task when variety already has a planting', () => {
      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'tomato',
        name: 'Moneymaker',
        seedsByYear: { 2025: 'have' },
      }

      const planting: Planting = {
        id: 'p1',
        plantId: 'tomato',
        varietyName: 'Moneymaker',
      }

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

      const tasks = generateVarietyTasks(
        3 as Month,
        [variety],
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        2025
      )

      expect(tasks).toHaveLength(0)
    })

    it('should not generate task when seeds status is not have or ordered', () => {
      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'tomato',
        name: 'Moneymaker',
        seedsByYear: { 2025: 'none' },
      }

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

      const tasks = generateVarietyTasks(3 as Month, [variety], [], 2025)

      expect(tasks).toHaveLength(0)
    })

    it('should include ordered seeds with appropriate note', () => {
      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'tomato',
        name: 'Gardeners Delight',
        seedsByYear: { 2025: 'ordered' },
      }

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

      const tasks = generateVarietyTasks(3 as Month, [variety], [], 2025)

      expect(tasks).toHaveLength(1)
      expect(tasks[0].notes).toContain('seeds ordered')
    })

    it('should not generate task outside sowing months', () => {
      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'tomato',
        name: 'Moneymaker',
        seedsByYear: { 2025: 'have' },
      }

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

      const tasks = generateVarietyTasks(7 as Month, [variety], [], 2025)

      expect(tasks).toHaveLength(0)
    })

    it('should skip archived varieties', () => {
      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'tomato',
        name: 'Moneymaker',
        seedsByYear: { 2025: 'have' },
        isArchived: true,
      }

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

      const tasks = generateVarietyTasks(3 as Month, [variety], [], 2025)

      expect(tasks).toHaveLength(0)
    })

    it('should prefer indoor sowing over outdoor when both available', () => {
      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'lettuce',
        name: 'Little Gem',
        seedsByYear: { 2025: 'have' },
      }

      mockGetVegetableById.mockReturnValue({
        id: 'lettuce',
        name: 'Lettuce',
        planting: {
          harvestMonths: [5, 6, 7, 8],
          sowIndoorsMonths: [3, 4],
          sowOutdoorsMonths: [4, 5, 6],
          transplantMonths: []
        }
      })

      // Month 4 has both indoor and outdoor
      const tasks = generateVarietyTasks(4 as Month, [variety], [], 2025)

      expect(tasks).toHaveLength(1)
      expect(tasks[0].generatedType).toBe('sow-indoors')
    })
  })

  describe('getTaskLabel', () => {
    it('should return a readable label for a task type', () => {
      expect(getTaskLabel('succession')).toBe('Succession Sow')
    })
  })

  describe('feed and water reminders', () => {
    const raspberryArea: Area = {
      id: 'raspberry-patch',
      name: 'Raspberry Patch',
      kind: 'berry',
      canHavePlantings: true,
      primaryPlant: { plantId: 'raspberry', variety: 'Glen Ample' },
    }

    const raspberryVeg = {
      id: 'raspberry',
      name: 'Raspberry',
      planting: {
        harvestMonths: [7, 8],
        sowIndoorsMonths: [],
        sowOutdoorsMonths: [],
        transplantMonths: [],
      },
      care: { water: 'moderate' as const },
      maintenance: {
        feedMonths: [3, 6],
        feedFrequencyDays: 21,
      },
    }

    it('emits a feed task with last-fed note when due', () => {
      mockGetVegetableById.mockReturnValue(raspberryVeg)

      const tasks = generateTasksForMonth(
        6 as Month,
        [],
        [raspberryArea],
        localNoon('2026-06-15'),
        [],
        2026,
        { 'raspberry-patch': { feed: 30 } }
      )

      const feedTasks = tasks.filter((t) => t.generatedType === 'feed')
      expect(feedTasks).toHaveLength(1)
      expect(feedTasks[0].notes).toContain('Last fed 30 days ago')
    })

    it('suppresses feed task when within feedFrequencyDays cadence', () => {
      mockGetVegetableById.mockReturnValue(raspberryVeg)

      const tasks = generateTasksForMonth(
        6 as Month,
        [],
        [raspberryArea],
        localNoon('2026-06-15'),
        [],
        2026,
        { 'raspberry-patch': { feed: 7 } }
      )

      const feedTasks = tasks.filter((t) => t.generatedType === 'feed')
      expect(feedTasks).toHaveLength(0)
    })

    it('names the feed type in the note and on the task when set', () => {
      const tomatoVeg = {
        id: 'tomato',
        name: 'Tomato',
        planting: {
          harvestMonths: [7, 8, 9],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [],
          transplantMonths: [],
        },
        care: { water: 'high' as const },
        maintenance: { feedMonths: [6, 7], feedFrequencyDays: 7, feedType: 'high-potash' as const },
      }
      mockGetVegetableById.mockReturnValue(tomatoVeg)

      const bed: Area = { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', canHavePlantings: true }
      const planting: Planting = { id: 'p1', plantId: 'tomato', status: 'active' }

      const tasks = generateTasksForMonth(
        7 as Month,
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        [bed],
        localNoon('2026-07-15'),
        [],
        2026,
        {}
      )

      const feedTasks = tasks.filter((t) => t.generatedType === 'feed')
      expect(feedTasks).toHaveLength(1)
      expect(feedTasks[0].feedType).toBe('high-potash')
      expect(feedTasks[0].notes).toContain('high-potash feed')
    })

    it('elevates an overdue feed to medium priority with an "Overdue" note', () => {
      const tomatoVeg = {
        id: 'tomato',
        name: 'Tomato',
        planting: {
          harvestMonths: [7, 8, 9],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [],
          transplantMonths: [],
        },
        care: { water: 'high' as const },
        maintenance: { feedMonths: [6, 7], feedFrequencyDays: 7, feedType: 'high-potash' as const },
      }
      mockGetVegetableById.mockReturnValue(tomatoVeg)

      const bed: Area = { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', canHavePlantings: true }
      const planting: Planting = { id: 'p1', plantId: 'tomato', status: 'active' }

      // 30 days since feed, cadence 7 → well past the 14-day overdue margin.
      const tasks = generateTasksForMonth(
        7 as Month,
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        [bed],
        localNoon('2026-07-15'),
        [],
        2026,
        { 'bed-a': { feed: 30 } }
      )

      const feedTasks = tasks.filter((t) => t.generatedType === 'feed')
      expect(feedTasks).toHaveLength(1)
      expect(feedTasks[0].priority).toBe('medium')
      expect(feedTasks[0].notes).toContain('Overdue')
      expect(feedTasks[0].urgency).toBe('overdue')
    })

    it('keeps a feed within the overdue margin at low priority', () => {
      const raspberryWithMargin = {
        ...raspberryVeg,
        maintenance: { feedMonths: [3, 6], feedFrequencyDays: 21 },
      }
      mockGetVegetableById.mockReturnValue(raspberryWithMargin)

      // 30 days since feed, cadence 21 → only 9 days over, under the 14-day margin.
      const tasks = generateTasksForMonth(
        6 as Month,
        [],
        [raspberryArea],
        localNoon('2026-06-15'),
        [],
        2026,
        { 'raspberry-patch': { feed: 30 } }
      )

      const feedTasks = tasks.filter((t) => t.generatedType === 'feed')
      expect(feedTasks).toHaveLength(1)
      expect(feedTasks[0].priority).toBe('low')
      expect(feedTasks[0].notes).not.toContain('Overdue')
      expect(feedTasks[0].urgency).toBeUndefined()
    })

    it('emits a feed task for a hungry annual planted in a bed (no primary plant)', () => {
      const courgetteVeg = {
        id: 'courgette',
        name: 'Courgette',
        planting: {
          harvestMonths: [7, 8, 9],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [],
          transplantMonths: [],
        },
        care: { water: 'high' as const },
        maintenance: { feedMonths: [6, 7, 8], feedFrequencyDays: 14 },
      }
      mockGetVegetableById.mockReturnValue(courgetteVeg)

      const bed: Area = {
        id: 'bed-a',
        name: 'Bed A',
        kind: 'rotation-bed',
        canHavePlantings: true,
      }
      const planting: Planting = { id: 'p1', plantId: 'courgette', status: 'active' }

      const tasks = generateTasksForMonth(
        7 as Month,
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        [bed],
        localNoon('2026-07-15'),
        [],
        2026,
        {}
      )

      const feedTasks = tasks.filter((t) => t.generatedType === 'feed')
      expect(feedTasks).toHaveLength(1)
      expect(feedTasks[0].areaId).toBe('bed-a')
      expect(feedTasks[0].description).toBe('Feed Bed A')
    })

    it('suppresses the annual feed task within the feed cadence', () => {
      const courgetteVeg = {
        id: 'courgette',
        name: 'Courgette',
        planting: {
          harvestMonths: [7, 8, 9],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [],
          transplantMonths: [],
        },
        care: { water: 'high' as const },
        maintenance: { feedMonths: [6, 7, 8], feedFrequencyDays: 14 },
      }
      mockGetVegetableById.mockReturnValue(courgetteVeg)

      const bed: Area = {
        id: 'bed-a',
        name: 'Bed A',
        kind: 'rotation-bed',
        canHavePlantings: true,
      }
      const planting: Planting = { id: 'p1', plantId: 'courgette', status: 'active' }

      const tasks = generateTasksForMonth(
        7 as Month,
        [{ planting, areaId: 'bed-a', areaName: 'Bed A' }],
        [bed],
        localNoon('2026-07-15'),
        [],
        2026,
        { 'bed-a': { feed: 5 } }
      )

      const feedTasks = tasks.filter((t) => t.generatedType === 'feed')
      expect(feedTasks).toHaveLength(0)
    })

    it('generates a water task during the watering season', () => {
      mockGetVegetableById.mockReturnValue(raspberryVeg)

      const tasks = generateTasksForMonth(
        7 as Month,
        [],
        [raspberryArea],
        localNoon('2026-07-15'),
        [],
        2026
      )

      const waterTasks = tasks.filter((t) => t.generatedType === 'water')
      expect(waterTasks).toHaveLength(1)
      expect(waterTasks[0].notes).toContain('moderate water need')
    })

    it('does not generate water tasks outside the watering season', () => {
      mockGetVegetableById.mockReturnValue(raspberryVeg)

      const tasks = generateTasksForMonth(
        12 as Month,
        [],
        [raspberryArea],
        localNoon('2026-12-15'),
        [],
        2026
      )

      const waterTasks = tasks.filter((t) => t.generatedType === 'water')
      expect(waterTasks).toHaveLength(0)
    })

    it('skips watering when recent rainfall meets the threshold', () => {
      mockGetVegetableById.mockReturnValue(raspberryVeg)

      const tasks = generateTasksForMonth(
        7 as Month,
        [],
        [raspberryArea],
        localNoon('2026-07-15'),
        [],
        2026,
        {},
        { past3DaysMm: 12, todayMm: 0, fetchedAt: '' }
      )

      const waterTasks = tasks.filter((t) => t.generatedType === 'water')
      expect(waterTasks).toHaveLength(0)
    })

    it('suppresses watering when the area was watered within its cadence', () => {
      mockGetVegetableById.mockReturnValue(raspberryVeg)

      const tasks = generateTasksForMonth(
        7 as Month,
        [],
        [raspberryArea],
        localNoon('2026-07-15'),
        [],
        2026,
        { 'raspberry-patch': { water: 1 } } // less than the moderate-default 4d cadence
      )

      const waterTasks = tasks.filter((t) => t.generatedType === 'water')
      expect(waterTasks).toHaveLength(0)
    })

    it('still emits a same-day-completed water task so it can show in Completed', () => {
      mockGetVegetableById.mockReturnValue(raspberryVeg)

      const tasks = generateTasksForMonth(
        7 as Month,
        [],
        [raspberryArea],
        localNoon('2026-07-15'),
        [],
        2026,
        { 'raspberry-patch': { water: 0 } }
      )

      const waterTasks = tasks.filter((t) => t.generatedType === 'water')
      expect(waterTasks).toHaveLength(1)
      // No "Watered today" prefix — the note should read as a generic
      // reminder so it makes sense if the user restores it from Completed.
      expect(waterTasks[0].notes).not.toContain('Watered today')
      expect(waterTasks[0].notes).not.toContain('Watered 0 days')
      expect(waterTasks[0].notes).toContain('moderate water need')
    })

    it('still emits a same-day-completed feed task so it can show in Completed', () => {
      mockGetVegetableById.mockReturnValue(raspberryVeg)

      const tasks = generateTasksForMonth(
        6 as Month,
        [],
        [raspberryArea],
        localNoon('2026-06-15'),
        [],
        2026,
        { 'raspberry-patch': { feed: 0 } }
      )

      const feedTasks = tasks.filter((t) => t.generatedType === 'feed')
      expect(feedTasks).toHaveLength(1)
      expect(feedTasks[0].notes).not.toContain('Fed today')
      expect(feedTasks[0].notes).not.toContain('Last fed 0')
      expect(feedTasks[0].notes).toContain('Apply general-purpose fertiliser')
    })
  })

  describe('soil temperature gating for sow-outdoors tasks', () => {
    const peasVeg = {
      id: 'peas',
      name: 'Peas',
      planting: {
        harvestMonths: [6, 7, 8],
        sowIndoorsMonths: [3, 4],
        sowOutdoorsMonths: [3, 4, 5],
        transplantMonths: [],
      },
    }

    const peasPlanting: Planting = {
      id: 'planting-peas',
      plantId: 'peas',
    }

    it('emits sow-outdoors task for peas when soil is warm enough (8°C)', () => {
      mockGetVegetableById.mockReturnValue(peasVeg)

      const tasks = generateTasksForMonth(
        4 as Month,
        [{ planting: peasPlanting, areaId: 'bed-a', areaName: 'Bed A' }],
        [],
        localNoon('2026-04-15'),
        [],
        2026,
        {},
        { past3DaysMm: 0, todayMm: 0, fetchedAt: '', soilTempC: 8 }
      )

      const sowOutdoors = tasks.filter((t) => t.generatedType === 'sow-outdoors')
      expect(sowOutdoors).toHaveLength(1)
      expect(sowOutdoors[0].plantId).toBe('peas')
    })

    it('suppresses sow-outdoors task for peas when soil is too cold (5°C)', () => {
      mockGetVegetableById.mockReturnValue(peasVeg)

      const tasks = generateTasksForMonth(
        4 as Month,
        [{ planting: peasPlanting, areaId: 'bed-a', areaName: 'Bed A' }],
        [],
        localNoon('2026-04-15'),
        [],
        2026,
        {},
        { past3DaysMm: 0, todayMm: 0, fetchedAt: '', soilTempC: 5 }
      )

      const sowOutdoors = tasks.filter((t) => t.generatedType === 'sow-outdoors')
      expect(sowOutdoors).toHaveLength(0)
    })

    it('emits sow-outdoors task for peas when soil temp is unavailable (fallback)', () => {
      mockGetVegetableById.mockReturnValue(peasVeg)

      const tasks = generateTasksForMonth(
        4 as Month,
        [{ planting: peasPlanting, areaId: 'bed-a', areaName: 'Bed A' }],
        [],
        localNoon('2026-04-15'),
        [],
        2026,
        {},
        null // no rainfall/soil data at all
      )

      const sowOutdoors = tasks.filter((t) => t.generatedType === 'sow-outdoors')
      expect(sowOutdoors).toHaveLength(1)
    })

    it('emits sow-outdoors task for peas when rainfall has no soilTempC field', () => {
      mockGetVegetableById.mockReturnValue(peasVeg)

      const tasks = generateTasksForMonth(
        4 as Month,
        [{ planting: peasPlanting, areaId: 'bed-a', areaName: 'Bed A' }],
        [],
        localNoon('2026-04-15'),
        [],
        2026,
        {},
        { past3DaysMm: 0, todayMm: 0, fetchedAt: '' } // no soilTempC
      )

      const sowOutdoors = tasks.filter((t) => t.generatedType === 'sow-outdoors')
      expect(sowOutdoors).toHaveLength(1)
    })

    it('does not affect sow-indoors task for peas even when soil is cold', () => {
      mockGetVegetableById.mockReturnValue(peasVeg)

      const tasks = generateTasksForMonth(
        3 as Month,
        [{ planting: peasPlanting, areaId: 'bed-a', areaName: 'Bed A' }],
        [],
        localNoon('2026-03-15'),
        [],
        2026,
        {},
        { past3DaysMm: 0, todayMm: 0, fetchedAt: '', soilTempC: 2 }
      )

      const sowIndoors = tasks.filter((t) => t.generatedType === 'sow-indoors')
      expect(sowIndoors).toHaveLength(1)
      expect(sowIndoors[0].plantId).toBe('peas')
      // outdoor should be suppressed though
      const sowOutdoors = tasks.filter((t) => t.generatedType === 'sow-outdoors')
      expect(sowOutdoors).toHaveLength(0)
    })

    it('does not gate plants without a threshold (e.g. lettuce)', () => {
      const lettuceVeg = {
        id: 'lettuce',
        name: 'Lettuce',
        planting: {
          harvestMonths: [5, 6, 7, 8],
          sowIndoorsMonths: [],
          sowOutdoorsMonths: [4, 5, 6],
          transplantMonths: [],
        },
      }
      mockGetVegetableById.mockReturnValue(lettuceVeg)

      const tasks = generateTasksForMonth(
        4 as Month,
        [{ planting: { id: 'p1', plantId: 'lettuce' }, areaId: 'bed-a', areaName: 'Bed A' }],
        [],
        localNoon('2026-04-15'),
        [],
        2026,
        {},
        { past3DaysMm: 0, todayMm: 0, fetchedAt: '', soilTempC: 0 }
      )

      const sowOutdoors = tasks.filter((t) => t.generatedType === 'sow-outdoors')
      expect(sowOutdoors).toHaveLength(1)
    })

    it('suppresses variety-driven sow-outdoors for peas when soil is too cold', () => {
      const peasVarietyOnlyVeg = {
        ...peasVeg,
        planting: {
          ...peasVeg.planting,
          sowIndoorsMonths: [], // force outdoor-only so variety task picks outdoor
        },
      }
      mockGetVegetableById.mockReturnValue(peasVarietyOnlyVeg)

      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'peas',
        name: 'Kelvedon Wonder',
        seedsByYear: { 2026: 'have' },
      }

      const tasks = generateTasksForMonth(
        4 as Month,
        [],
        [],
        localNoon('2026-04-15'),
        [variety],
        2026,
        {},
        { past3DaysMm: 0, todayMm: 0, fetchedAt: '', soilTempC: 5 }
      )

      const sowOutdoors = tasks.filter((t) => t.generatedType === 'sow-outdoors')
      expect(sowOutdoors).toHaveLength(0)
    })

    it('does not suppress variety-driven sow-indoors when soil is cold', () => {
      mockGetVegetableById.mockReturnValue(peasVeg)

      const variety: StoredVariety = {
        id: 'v1',
        plantId: 'peas',
        name: 'Kelvedon Wonder',
        seedsByYear: { 2026: 'have' },
      }

      const tasks = generateTasksForMonth(
        3 as Month,
        [],
        [],
        localNoon('2026-03-15'),
        [variety],
        2026,
        {},
        { past3DaysMm: 0, todayMm: 0, fetchedAt: '', soilTempC: 2 }
      )

      const sowIndoors = tasks.filter((t) => t.generatedType === 'sow-indoors')
      expect(sowIndoors).toHaveLength(1)
    })
  })
})
