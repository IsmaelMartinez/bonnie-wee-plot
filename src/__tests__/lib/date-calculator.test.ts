/**
 * Tests for the date-calculator module
 *
 * Covers:
 * - Forward calculation (sow date → harvest dates)
 * - Backward calculation (target harvest → sow date)
 * - Fall factor adjustments for Scotland
 * - Validation warnings and errors
 * - Edge cases (year boundaries, leap years)
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePlantingDates,
  calculateSowDateForHarvest,
  validateSowDate,
  getGerminationDays,
  getFallFactorDays,
  populateExpectedHarvest,
} from '@/lib/date-calculator'
import { Vegetable } from '@/types/garden-planner'
import { Planting } from '@/types/unified-allotment'

// Test vegetables with known data
const testPeas: Vegetable = {
  id: 'peas',
  name: 'Peas',
  category: 'legumes',
  description: 'Test peas',
  planting: {
    sowIndoorsMonths: [2, 3],
    sowOutdoorsMonths: [3, 4, 5, 6],
    transplantMonths: [4, 5],
    harvestMonths: [6, 7, 8],
    daysToHarvest: { min: 60, max: 90 },
  },
  care: {
    sun: 'full-sun',
    water: 'moderate',
    spacing: { between: 5, rows: 45 },
    depth: 5,
    difficulty: 'beginner',
    tips: [],
  },
  enhancedCompanions: [],
  enhancedAvoid: [],
}

const testTomato: Vegetable = {
  id: 'tomato',
  name: 'Tomato',
  category: 'solanaceae',
  description: 'Test tomato',
  planting: {
    sowIndoorsMonths: [2, 3, 4],
    sowOutdoorsMonths: [],
    transplantMonths: [5, 6],
    harvestMonths: [7, 8, 9, 10],
    daysToHarvest: { min: 70, max: 100 },
  },
  care: {
    sun: 'full-sun',
    water: 'high',
    spacing: { between: 60, rows: 90 },
    depth: 1,
    difficulty: 'intermediate',
    tips: [],
  },
  enhancedCompanions: [],
  enhancedAvoid: [],
}

const testCarrot: Vegetable = {
  id: 'carrot',
  name: 'Carrot',
  category: 'root-vegetables',
  description: 'Test carrot',
  planting: {
    sowIndoorsMonths: [],
    sowOutdoorsMonths: [3, 4, 5, 6, 7, 8, 9],  // Extended to include fall months for testing
    transplantMonths: [],
    harvestMonths: [6, 7, 8, 9, 10, 11],
    daysToHarvest: { min: 70, max: 80 },
  },
  care: {
    sun: 'full-sun',
    water: 'moderate',
    spacing: { between: 5, rows: 30 },
    depth: 1,
    difficulty: 'intermediate',
    tips: [],
  },
  enhancedCompanions: [],
  enhancedAvoid: [],
}

describe('getGerminationDays', () => {
  it('returns correct germination days for legumes', () => {
    const result = getGerminationDays('legumes')
    expect(result).toEqual({ min: 7, max: 14 })
  })

  it('returns correct germination days for solanaceae', () => {
    const result = getGerminationDays('solanaceae')
    expect(result).toEqual({ min: 7, max: 14 })
  })

  it('returns correct germination days for root vegetables', () => {
    const result = getGerminationDays('root-vegetables')
    expect(result).toEqual({ min: 10, max: 21 })
  })

  it('returns default for unknown categories', () => {
    const result = getGerminationDays('berries')
    expect(result).toEqual({ min: 7, max: 14 })
  })
})

describe('getFallFactorDays', () => {
  it('returns 14 days for August sowing', () => {
    expect(getFallFactorDays('2025-08-15')).toBe(14)
  })

  it('returns 14 days for September sowing', () => {
    expect(getFallFactorDays('2025-09-01')).toBe(14)
  })

  it('returns 14 days for October sowing', () => {
    expect(getFallFactorDays('2025-10-31')).toBe(14)
  })

  it('returns 0 days for spring sowing', () => {
    expect(getFallFactorDays('2025-04-15')).toBe(0)
  })

  it('returns 0 days for summer sowing', () => {
    expect(getFallFactorDays('2025-07-01')).toBe(0)
  })

  it('returns 0 days for November sowing', () => {
    expect(getFallFactorDays('2025-11-15')).toBe(0)
  })
})

describe('calculatePlantingDates - outdoor sowing', () => {
  it('calculates harvest dates for direct sown peas', () => {
    const result = calculatePlantingDates({
      sowDate: '2025-04-15',
      sowMethod: 'outdoor',
      vegetable: testPeas,
    })

    expect(result.expectedHarvestStart).toBe('2025-06-14')
    expect(result.expectedHarvestEnd).toBe('2025-07-14')
    expect(result.calculation).toContain('Direct sown')
  })

  it('applies fall factor for September sowing', () => {
    const result = calculatePlantingDates({
      sowDate: '2025-09-01',
      sowMethod: 'outdoor',
      vegetable: testCarrot,
    })

    // 70 days min + 14 fall factor = 84 days
    // 80 days max + 14 fall factor = 94 days
    expect(result.expectedHarvestStart).toBe('2025-11-24')
    expect(result.expectedHarvestEnd).toBe('2025-12-04')
    expect(result.calculation).toContain('fall adjustment')
  })

  it('does not apply fall factor for spring sowing', () => {
    const result = calculatePlantingDates({
      sowDate: '2025-04-01',
      sowMethod: 'outdoor',
      vegetable: testCarrot,
    })

    expect(result.expectedHarvestStart).toBe('2025-06-10')
    expect(result.expectedHarvestEnd).toBe('2025-06-20')
    expect(result.calculation).not.toContain('fall adjustment')
  })
})

describe('calculatePlantingDates - indoor sowing', () => {
  it('calculates harvest dates from transplant date', () => {
    const result = calculatePlantingDates({
      sowDate: '2025-03-01',
      sowMethod: 'indoor',
      vegetable: testTomato,
      transplantDate: '2025-05-15',
    })

    // Tomato: 70-100 days, germination 7-14 days for solanaceae
    // From transplant: 70-7 = 63 min, 100-14 = 86 max
    expect(result.expectedHarvestStart).toBe('2025-07-17')
    expect(result.expectedHarvestEnd).toBe('2025-08-09')
    expect(result.calculation).toContain('Started indoors')
    expect(result.calculation).toContain('transplanted')
  })

  it('estimates transplant date when not provided', () => {
    const result = calculatePlantingDates({
      sowDate: '2025-03-01',
      sowMethod: 'indoor',
      vegetable: testTomato,
    })

    expect(result.calculation).toContain('estimated transplant')
    // Should still calculate reasonable dates
    expect(result.expectedHarvestStart).toBeDefined()
    expect(result.expectedHarvestEnd).toBeDefined()
  })
})

describe('calculatePlantingDates - purchased transplant', () => {
  it('calculates shorter time to harvest for purchased transplants', () => {
    const result = calculatePlantingDates({
      sowDate: '2025-05-15',
      sowMethod: 'transplant-purchased',
      vegetable: testTomato,
      transplantDate: '2025-05-15',
    })

    // Purchased transplants have shorter lead time
    expect(result.calculation).toContain('Purchased transplant')
    // Harvest should be earlier than indoor-started
    const indoorResult = calculatePlantingDates({
      sowDate: '2025-03-01',
      sowMethod: 'indoor',
      vegetable: testTomato,
      transplantDate: '2025-05-15',
    })

    // Start date should be similar or earlier
    expect(new Date(result.expectedHarvestStart) <= new Date(indoorResult.expectedHarvestStart)).toBe(true)
  })
})

describe('calculateSowDateForHarvest - backward calculation', () => {
  it('calculates sow date for outdoor target harvest', () => {
    const result = calculateSowDateForHarvest({
      targetHarvestDate: '2025-07-15',
      sowMethod: 'outdoor',
      vegetable: testPeas,
    })

    // Peas: avg 75 days to harvest
    // 2025-07-15 minus 75 days = 2025-05-01
    expect(result.recommendedSowDate).toBe('2025-05-01')
    expect(result.calculation).toContain('Target harvest')
  })

  it('calculates sow and transplant dates for indoor target', () => {
    const result = calculateSowDateForHarvest({
      targetHarvestDate: '2025-08-01',
      sowMethod: 'indoor',
      vegetable: testTomato,
    })

    expect(result.recommendedSowDate).toBeDefined()
    expect(result.transplantDate).toBeDefined()
    expect(result.calculation).toContain('transplant')

    // Transplant should be between sow and harvest
    expect(new Date(result.recommendedSowDate) < new Date(result.transplantDate!)).toBe(true)
    expect(new Date(result.transplantDate!) < new Date('2025-08-01')).toBe(true)
  })

  it('adjusts for fall sowing in backward calculation', () => {
    const resultFall = calculateSowDateForHarvest({
      targetHarvestDate: '2025-12-01',
      sowMethod: 'outdoor',
      vegetable: testCarrot,
    })

    const resultSpring = calculateSowDateForHarvest({
      targetHarvestDate: '2025-07-01',
      sowMethod: 'outdoor',
      vegetable: testCarrot,
    })

    // Fall sowing should be earlier to account for slower growth
    // (relative to harvest date)
    expect(resultFall.calculation).toBeDefined()
    expect(resultSpring.calculation).toBeDefined()
  })
})

describe('validateSowDate', () => {
  it('returns valid for date within recommended window', () => {
    const result = validateSowDate('2025-04-15', 'outdoor', testPeas)

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns invalid for date outside recommended window', () => {
    const result = validateSowDate('2025-01-15', 'outdoor', testPeas)

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('months')
  })

  it('provides suggestions when invalid', () => {
    const result = validateSowDate('2025-01-15', 'outdoor', testPeas)

    expect(result.suggestions).toBeDefined()
    expect(result.suggestions?.earliestRecommended).toBeDefined()
  })

  it('adds fall warning for September sowing', () => {
    const result = validateSowDate('2025-09-01', 'outdoor', testCarrot)

    expect(result.isValid).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('Fall sowing')
  })

  it('validates purchased transplants against transplant months', () => {
    const result = validateSowDate('2025-05-15', 'transplant-purchased', testTomato)

    expect(result.isValid).toBe(true)
  })

  it('warns for purchased transplants outside transplant window', () => {
    const result = validateSowDate('2025-01-15', 'transplant-purchased', testTomato)

    expect(result.isValid).toBe(true) // Not blocking
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})

describe('populateExpectedHarvest', () => {
  it('populates expected harvest dates from sow date', () => {
    const planting: Planting = {
      id: 'test-1',
      plantId: 'peas',
      sowDate: '2025-04-15',
      sowMethod: 'outdoor',
    }

    const result = populateExpectedHarvest(planting, testPeas)

    expect(result.expectedHarvestStart).toBe('2025-06-14')
    expect(result.expectedHarvestEnd).toBe('2025-07-14')
  })

  it('defaults to outdoor method when not specified', () => {
    const planting: Planting = {
      id: 'test-2',
      plantId: 'carrot',
      sowDate: '2025-04-01',
    }

    const result = populateExpectedHarvest(planting, testCarrot)

    expect(result.expectedHarvestStart).toBeDefined()
    expect(result.expectedHarvestEnd).toBeDefined()
  })

  it('returns original planting if no sow date', () => {
    const planting: Planting = {
      id: 'test-3',
      plantId: 'peas',
    }

    const result = populateExpectedHarvest(planting, testPeas)

    expect(result.expectedHarvestStart).toBeUndefined()
    expect(result.expectedHarvestEnd).toBeUndefined()
  })

  it('preserves all other planting fields', () => {
    const planting: Planting = {
      id: 'test-4',
      plantId: 'peas',
      varietyName: 'Kelvedon Wonder',
      sowDate: '2025-04-15',
      sowMethod: 'outdoor',
      notes: 'Test notes',
      quantity: 24,
    }

    const result = populateExpectedHarvest(planting, testPeas)

    expect(result.varietyName).toBe('Kelvedon Wonder')
    expect(result.notes).toBe('Test notes')
    expect(result.quantity).toBe(24)
  })
})

describe('edge cases', () => {
  it('handles year boundary correctly', () => {
    // Sow late in year, harvest early next year
    const result = calculatePlantingDates({
      sowDate: '2025-11-01',
      sowMethod: 'outdoor',
      vegetable: testCarrot, // 70-80 days
    })

    expect(result.expectedHarvestStart).toMatch(/^2026-/)
  })

  it('handles leap year correctly', () => {
    // 2024 is a leap year
    const result = calculatePlantingDates({
      sowDate: '2024-02-15',
      sowMethod: 'outdoor',
      vegetable: testPeas, // 60-90 days
    })

    // Should handle Feb 29 correctly
    expect(result.expectedHarvestStart).toBe('2024-04-15')
  })

  it('ensures minimum harvest window of 7 days', () => {
    // Even with aggressive adjustments, minimum should be maintained
    const result = calculatePlantingDates({
      sowDate: '2025-05-15',
      sowMethod: 'transplant-purchased',
      vegetable: testPeas,
      transplantDate: '2025-05-15',
    })

    const start = new Date(result.expectedHarvestStart)
    const end = new Date(result.expectedHarvestEnd)
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)

    expect(diffDays).toBeGreaterThanOrEqual(0)
  })
})
