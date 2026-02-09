/**
 * Tests for planting-utils.ts
 */

import { describe, it, expect } from 'vitest'
import {
  getRecommendedSowMethod,
  getRecommendedSowMethodForVegetable,
  getPlantingPhase,
  inferStatusFromDates,
  getSowMethodLabel,
  getSowMethodShortLabel,
} from '@/lib/planting-utils'
import { Planting } from '@/types/unified-allotment'
import { Vegetable } from '@/types/garden-planner'

describe('getRecommendedSowMethod', () => {
  it('recommends outdoor when month is in sowOutdoorsMonths', () => {
    // Lettuce: sowOutdoorsMonths: [5, 6, 7, 8]
    const result = getRecommendedSowMethod('lettuce', 6)
    expect(result.recommended).toBe('outdoor')
    expect(result.alternatives.find(a => a.method === 'outdoor')?.available).toBe(true)
  })

  it('recommends indoor when month is in sowIndoorsMonths but not outdoor', () => {
    // Lettuce: sowIndoorsMonths: [3, 4], sowOutdoorsMonths: [5, 6, 7, 8]
    const result = getRecommendedSowMethod('lettuce', 3)
    expect(result.recommended).toBe('indoor')
    expect(result.alternatives.find(a => a.method === 'indoor')?.available).toBe(true)
  })

  it('recommends outdoor when both indoor and outdoor are available', () => {
    // Spinach: sowIndoorsMonths: [3, 4], sowOutdoorsMonths: [4, 5, 8, 9]
    // Month 4 is in both
    const result = getRecommendedSowMethod('spinach', 4)
    expect(result.recommended).toBe('outdoor')
  })

  it('recommends transplant-purchased for unknown plants', () => {
    const result = getRecommendedSowMethod('unknown-plant-id', 6)
    expect(result.recommended).toBe('outdoor') // Falls back to outdoor for unknown
  })

  it('recommends closest option when current month is out of season', () => {
    // Lettuce: sowIndoorsMonths: [3, 4], sowOutdoorsMonths: [5, 6, 7, 8]
    // Month 1 (January) is out of season
    const result = getRecommendedSowMethod('lettuce', 1)
    // Should recommend indoor since March is closer to January than May
    expect(result.recommended).toBe('indoor')
    expect(result.reason).toContain('Indoor sowing starts month')
  })

  it('handles plants with both indoor and outdoor sowing', () => {
    // Broad beans: sowIndoorsMonths: [2, 3], sowOutdoorsMonths: [3, 4, 10, 11]
    // Month 3 is in both indoor and outdoor
    const result = getRecommendedSowMethod('broad-beans', 3)
    expect(result.recommended).toBe('outdoor') // Prefers outdoor when both available
    expect(result.alternatives.find(a => a.method === 'indoor')?.available).toBe(true)
    expect(result.alternatives.find(a => a.method === 'outdoor')?.available).toBe(true)
  })
})

describe('getRecommendedSowMethodForVegetable', () => {
  const mockVegetable: Vegetable = {
    id: 'test-veg',
    name: 'Test Vegetable',
    category: 'leafy-greens',
    description: 'Test',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 40 },
      depth: 1,
      difficulty: 'beginner',
      tips: []
    },
    enhancedCompanions: [],
    enhancedAvoid: []
  }

  it('recommends indoor for indoor-only months', () => {
    const result = getRecommendedSowMethodForVegetable(mockVegetable, 3)
    expect(result.recommended).toBe('indoor')
  })

  it('recommends outdoor for outdoor-only months', () => {
    const result = getRecommendedSowMethodForVegetable(mockVegetable, 6)
    expect(result.recommended).toBe('outdoor')
  })
})

describe('getPlantingPhase', () => {
  const basePlanting: Planting = {
    id: 'test-1',
    plantId: 'lettuce'
  }

  it('returns planned phase when no sow date', () => {
    const result = getPlantingPhase({ ...basePlanting, status: 'planned' })
    expect(result.phase).toBe('planned')
    expect(result.label).toBe('Planned')
    expect(result.color).toBe('gray')
  })

  it('returns germinating phase for recent indoor sowing', () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 5) // 5 days ago

    const result = getPlantingPhase({
      ...basePlanting,
      status: 'active',
      sowMethod: 'indoor',
      sowDate: recentDate.toISOString().split('T')[0]
    })
    expect(result.phase).toBe('germinating')
    expect(result.label).toBe('Germinating')
    expect(result.color).toBe('blue')
  })

  it('returns growing-indoor phase for older indoor sowing', () => {
    const olderDate = new Date()
    olderDate.setDate(olderDate.getDate() - 20) // 20 days ago

    const result = getPlantingPhase({
      ...basePlanting,
      status: 'active',
      sowMethod: 'indoor',
      sowDate: olderDate.toISOString().split('T')[0]
    })
    expect(result.phase).toBe('growing-indoor')
    expect(result.label).toBe('Growing Indoors')
    expect(result.color).toBe('blue')
  })

  it('returns ready-to-transplant for mature indoor seedlings', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 50) // 50 days ago

    const result = getPlantingPhase({
      ...basePlanting,
      status: 'active',
      sowMethod: 'indoor',
      sowDate: oldDate.toISOString().split('T')[0]
    })
    expect(result.phase).toBe('ready-to-transplant')
    expect(result.label).toBe('Ready to Transplant')
    expect(result.color).toBe('yellow')
  })

  it('returns growing phase for transplanted indoor seedlings', () => {
    const sowDate = new Date()
    sowDate.setDate(sowDate.getDate() - 50)
    const transplantDate = new Date()
    transplantDate.setDate(transplantDate.getDate() - 10)

    const result = getPlantingPhase({
      ...basePlanting,
      status: 'active',
      sowMethod: 'indoor',
      sowDate: sowDate.toISOString().split('T')[0],
      transplantDate: transplantDate.toISOString().split('T')[0]
    })
    expect(result.phase).toBe('growing')
    expect(result.label).toBe('Growing')
    expect(result.color).toBe('green')
  })

  it('returns growing phase for outdoor sowing', () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 10)

    const result = getPlantingPhase({
      ...basePlanting,
      status: 'active',
      sowMethod: 'outdoor',
      sowDate: recentDate.toISOString().split('T')[0]
    })
    expect(result.phase).toBe('growing')
    expect(result.label).toBe('Growing')
    expect(result.color).toBe('green')
  })

  it('returns ready-to-harvest when in harvest window', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 100)
    const harvestStart = new Date()
    harvestStart.setDate(harvestStart.getDate() - 5)

    const result = getPlantingPhase({
      ...basePlanting,
      status: 'active',
      sowMethod: 'outdoor',
      sowDate: pastDate.toISOString().split('T')[0],
      expectedHarvestStart: harvestStart.toISOString().split('T')[0]
    })
    expect(result.phase).toBe('ready-to-harvest')
    expect(result.label).toBe('Ready to Harvest')
    expect(result.color).toBe('yellow')
  })

  it('returns harvesting when actualHarvestStart is set', () => {
    const harvestStart = new Date()
    harvestStart.setDate(harvestStart.getDate() - 5)

    const result = getPlantingPhase({
      ...basePlanting,
      status: 'active',
      actualHarvestStart: harvestStart.toISOString().split('T')[0]
    })
    expect(result.phase).toBe('harvesting')
    expect(result.label).toBe('Harvesting')
    expect(result.color).toBe('orange')
  })

  it('returns complete when actualHarvestEnd is set', () => {
    const result = getPlantingPhase({
      ...basePlanting,
      status: 'active',
      actualHarvestStart: '2024-07-01',
      actualHarvestEnd: '2024-07-15'
    })
    expect(result.phase).toBe('complete')
    expect(result.label).toBe('Complete')
    expect(result.color).toBe('gray')
  })

  it('returns removed when status is removed', () => {
    const result = getPlantingPhase({
      ...basePlanting,
      status: 'removed'
    })
    expect(result.phase).toBe('removed')
    expect(result.label).toBe('Removed')
    expect(result.color).toBe('red')
  })
})

describe('inferStatusFromDates', () => {
  it('returns planned when no dates', () => {
    const result = inferStatusFromDates({ id: '1', plantId: 'lettuce' })
    expect(result).toBe('planned')
  })

  it('returns active when sowDate is set', () => {
    const result = inferStatusFromDates({ id: '1', plantId: 'lettuce', sowDate: '2024-03-01' })
    expect(result).toBe('active')
  })

  it('returns active when transplantDate is set', () => {
    const result = inferStatusFromDates({ id: '1', plantId: 'lettuce', transplantDate: '2024-05-01' })
    expect(result).toBe('active')
  })

  it('returns harvested when actualHarvestEnd is set', () => {
    const result = inferStatusFromDates({
      id: '1',
      plantId: 'lettuce',
      sowDate: '2024-03-01',
      actualHarvestEnd: '2024-07-15'
    })
    expect(result).toBe('harvested')
  })
})

describe('getSowMethodLabel', () => {
  it('returns correct label for indoor', () => {
    expect(getSowMethodLabel('indoor')).toBe('Started indoors')
  })

  it('returns correct label for outdoor', () => {
    expect(getSowMethodLabel('outdoor')).toBe('Direct sown')
  })

  it('returns correct label for transplant-purchased', () => {
    expect(getSowMethodLabel('transplant-purchased')).toBe('Purchased seedling')
  })
})

describe('getSowMethodShortLabel', () => {
  it('returns correct short label for indoor', () => {
    expect(getSowMethodShortLabel('indoor')).toBe('Indoors')
  })

  it('returns correct short label for outdoor', () => {
    expect(getSowMethodShortLabel('outdoor')).toBe('Outdoors')
  })

  it('returns correct short label for transplant-purchased', () => {
    expect(getSowMethodShortLabel('transplant-purchased')).toBe('Purchased')
  })
})
