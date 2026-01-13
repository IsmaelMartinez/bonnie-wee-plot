/**
 * Unit tests for temporal helper functions in allotment-storage.ts
 *
 * Tests the three temporal helper functions:
 * - wasAreaActiveInYear()
 * - getAreasForYear()
 * - getAreaActiveRange()
 *
 * Coverage includes backward compatibility, edge cases, and temporal metadata handling.
 */

import { describe, it, expect } from 'vitest'
import { Area, AllotmentData, CURRENT_SCHEMA_VERSION } from '@/types/unified-allotment'
import {
  wasAreaActiveInYear,
  getAreasForYear,
  getAreaActiveRange,
  validatePlantingForYear,
} from '@/services/allotment-storage'

// ============ HELPER FUNCTIONS ============

function createMockArea(overrides: Partial<Area> = {}): Area {
  return {
    id: 'test-area',
    name: 'Test Area',
    kind: 'rotation-bed',
    canHavePlantings: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function createMockAllotmentData(areas: Area[] = []): AllotmentData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    currentYear: 2025,
    meta: {
      name: 'Test Allotment',
      location: 'Test Location',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2025-01-13T00:00:00.000Z',
    },
    layout: {
      areas,
    },
    seasons: [
      { year: 2023, status: 'historical', areas: [], createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      { year: 2024, status: 'historical', areas: [], createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      { year: 2025, status: 'current', areas: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-13T00:00:00.000Z' },
      { year: 2026, status: 'planned', areas: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
    ],
    varieties: [],
  }
}

// ============ TESTS: wasAreaActiveInYear ============

describe('wasAreaActiveInYear()', () => {
  describe('backward compatibility - no temporal metadata', () => {
    it('returns true for areas with no temporal metadata (archival status is separate concern)', () => {
      const area = createMockArea()
      // No createdYear, retiredYear, or activeYears

      expect(wasAreaActiveInYear(area, 2023)).toBe(true)
      expect(wasAreaActiveInYear(area, 2024)).toBe(true)
      expect(wasAreaActiveInYear(area, 2025)).toBe(true)
      expect(wasAreaActiveInYear(area, 2026)).toBe(true)
    })

    it('still returns true for archived areas (archival is filtered by getAllAreas)', () => {
      const area = createMockArea({ isArchived: true })
      // Note: wasAreaActiveInYear only checks temporal metadata (createdYear/retiredYear/activeYears)
      // It does NOT check isArchived - that's handled by getAllAreas() wrapper

      expect(wasAreaActiveInYear(area, 2023)).toBe(true)
      expect(wasAreaActiveInYear(area, 2025)).toBe(true)
    })

    it('returns true for areas with createdYear even if archived (temporal check only)', () => {
      const area = createMockArea({
        createdYear: 2023,
        isArchived: true,
      })
      // wasAreaActiveInYear only checks temporal range, not archival status

      expect(wasAreaActiveInYear(area, 2024)).toBe(true)
    })
  })

  describe('createdYear only', () => {
    it('returns false for years before createdYear', () => {
      const area = createMockArea({ createdYear: 2024 })

      expect(wasAreaActiveInYear(area, 2022)).toBe(false)
      expect(wasAreaActiveInYear(area, 2023)).toBe(false)
    })

    it('returns true from createdYear onward', () => {
      const area = createMockArea({ createdYear: 2024 })

      expect(wasAreaActiveInYear(area, 2024)).toBe(true)
      expect(wasAreaActiveInYear(area, 2025)).toBe(true)
      expect(wasAreaActiveInYear(area, 2026)).toBe(true)
      expect(wasAreaActiveInYear(area, 2050)).toBe(true)
    })

    it('ignores isArchived - only checks temporal range', () => {
      const area = createMockArea({
        createdYear: 2024,
        isArchived: true,
      })
      // wasAreaActiveInYear only checks temporal metadata

      expect(wasAreaActiveInYear(area, 2024)).toBe(true)
      expect(wasAreaActiveInYear(area, 2025)).toBe(true)
    })
  })

  describe('retiredYear only', () => {
    it('returns true for years up to retiredYear', () => {
      const area = createMockArea({ retiredYear: 2024 })

      expect(wasAreaActiveInYear(area, 2022)).toBe(true)
      expect(wasAreaActiveInYear(area, 2023)).toBe(true)
    })

    it('returns false from retiredYear onward', () => {
      const area = createMockArea({ retiredYear: 2024 })

      expect(wasAreaActiveInYear(area, 2024)).toBe(false)
      expect(wasAreaActiveInYear(area, 2025)).toBe(false)
      expect(wasAreaActiveInYear(area, 2050)).toBe(false)
    })

    it('excludes year before creation with undefined createdYear', () => {
      const area = createMockArea({ retiredYear: 2024 })

      expect(wasAreaActiveInYear(area, 1900)).toBe(true) // Before year 0
      expect(wasAreaActiveInYear(area, 0)).toBe(true)
    })
  })

  describe('both createdYear and retiredYear', () => {
    it('returns true only within the range (including createdYear, excluding retiredYear)', () => {
      const area = createMockArea({
        createdYear: 2024,
        retiredYear: 2026,
      })

      expect(wasAreaActiveInYear(area, 2023)).toBe(false)
      expect(wasAreaActiveInYear(area, 2024)).toBe(true)
      expect(wasAreaActiveInYear(area, 2025)).toBe(true)
      expect(wasAreaActiveInYear(area, 2026)).toBe(false)
      expect(wasAreaActiveInYear(area, 2027)).toBe(false)
    })

    it('handles single-year areas (createdYear = retiredYear)', () => {
      const area = createMockArea({
        createdYear: 2024,
        retiredYear: 2024,
      })

      expect(wasAreaActiveInYear(area, 2024)).toBe(false) // Retired before it could be used
      expect(wasAreaActiveInYear(area, 2023)).toBe(false)
      expect(wasAreaActiveInYear(area, 2025)).toBe(false)
    })

    it('handles createdYear > retiredYear (invalid but should handle gracefully)', () => {
      const area = createMockArea({
        createdYear: 2025,
        retiredYear: 2024,
      })

      // No year satisfies: year >= 2025 AND year < 2024
      expect(wasAreaActiveInYear(area, 2023)).toBe(false)
      expect(wasAreaActiveInYear(area, 2024)).toBe(false)
      expect(wasAreaActiveInYear(area, 2025)).toBe(false)
    })
  })

  describe('explicit activeYears list (takes precedence)', () => {
    it('returns true only for years in activeYears list', () => {
      const area = createMockArea({
        activeYears: [2022, 2024, 2025],
      })

      expect(wasAreaActiveInYear(area, 2022)).toBe(true)
      expect(wasAreaActiveInYear(area, 2023)).toBe(false)
      expect(wasAreaActiveInYear(area, 2024)).toBe(true)
      expect(wasAreaActiveInYear(area, 2025)).toBe(true)
      expect(wasAreaActiveInYear(area, 2026)).toBe(false)
    })

    it('takes precedence over createdYear and retiredYear', () => {
      const area = createMockArea({
        createdYear: 2024,
        retiredYear: 2026,
        activeYears: [2024, 2025], // Different from createdYear/retiredYear range
      })

      // activeYears should be used, not the range
      expect(wasAreaActiveInYear(area, 2023)).toBe(false)
      expect(wasAreaActiveInYear(area, 2024)).toBe(true)
      expect(wasAreaActiveInYear(area, 2025)).toBe(true)
      expect(wasAreaActiveInYear(area, 2026)).toBe(false) // Not in activeYears
    })

    it('handles empty activeYears array as no metadata', () => {
      const area = createMockArea({
        activeYears: [], // Empty = no explicit years
      })

      // Should treat as having no temporal metadata
      expect(wasAreaActiveInYear(area, 2023)).toBe(true)
      expect(wasAreaActiveInYear(area, 2024)).toBe(true)
      expect(wasAreaActiveInYear(area, 2025)).toBe(true)
    })

    it('works with activeYears regardless of archival status', () => {
      const area = createMockArea({
        activeYears: [2024],
        isArchived: true,
      })

      // wasAreaActiveInYear only checks temporal logic
      expect(wasAreaActiveInYear(area, 2024)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles year 0 correctly', () => {
      const area = createMockArea({ createdYear: 0 })

      expect(wasAreaActiveInYear(area, 0)).toBe(true)
      expect(wasAreaActiveInYear(area, 1)).toBe(true)
    })

    it('handles very large years', () => {
      const area = createMockArea({ createdYear: 9999 })

      expect(wasAreaActiveInYear(area, 9998)).toBe(false)
      expect(wasAreaActiveInYear(area, 9999)).toBe(true)
      expect(wasAreaActiveInYear(area, 10000)).toBe(true)
    })

    it('handles negative years (BC dates - probably not used but should work)', () => {
      const area = createMockArea({ createdYear: -100 })

      expect(wasAreaActiveInYear(area, -101)).toBe(false)
      expect(wasAreaActiveInYear(area, -100)).toBe(true)
      expect(wasAreaActiveInYear(area, 0)).toBe(true)
    })

    it('treats undefined createdYear as 0 (always existed)', () => {
      const area = createMockArea({
        createdYear: undefined,
        retiredYear: 2024,
      })

      expect(wasAreaActiveInYear(area, 1900)).toBe(true)
      expect(wasAreaActiveInYear(area, 2023)).toBe(true)
      expect(wasAreaActiveInYear(area, 2024)).toBe(false)
    })

    it('treats undefined retiredYear as Infinity (still exists)', () => {
      const area = createMockArea({
        createdYear: 2024,
        retiredYear: undefined,
      })

      expect(wasAreaActiveInYear(area, 2024)).toBe(true)
      expect(wasAreaActiveInYear(area, 2025)).toBe(true)
      expect(wasAreaActiveInYear(area, 9999)).toBe(true)
    })
  })
})

// ============ TESTS: getAreasForYear ============

describe('getAreasForYear()', () => {
  it('returns only areas active in the specified year', () => {
    const areas = [
      createMockArea({ id: 'area-a' }), // Always active (no temporal metadata)
      createMockArea({ id: 'area-b', createdYear: 2025 }), // Active from 2025 onward
      createMockArea({ id: 'area-c', createdYear: 2020, retiredYear: 2024 }), // Active from 2020 until (but not including) 2024
      createMockArea({ id: 'area-d', createdYear: 2024, retiredYear: 2025 }), // Active only in 2024
    ]
    const data = createMockAllotmentData(areas)

    // In 2023: area-a, area-c (2023 >= 2020 and 2023 < 2024)
    const year2023 = getAreasForYear(data, 2023)
    expect(year2023).toHaveLength(2)
    expect(year2023.map(a => a.id).sort()).toEqual(['area-a', 'area-c'])

    // In 2024: area-a, area-d (area-c retired in 2024, so not active)
    const year2024 = getAreasForYear(data, 2024)
    expect(year2024).toHaveLength(2)
    expect(year2024.map(a => a.id).sort()).toEqual(['area-a', 'area-d'])

    // In 2025: area-a, area-b (area-d retired in 2025, so not active)
    const year2025 = getAreasForYear(data, 2025)
    expect(year2025).toHaveLength(2)
    expect(year2025.map(a => a.id).sort()).toEqual(['area-a', 'area-b'])

    // In 2026: only area-a, area-b
    const year2026 = getAreasForYear(data, 2026)
    expect(year2026).toHaveLength(2)
    expect(year2026.map(a => a.id).sort()).toEqual(['area-a', 'area-b'])
  })

  it('filters out archived areas', () => {
    const areas = [
      createMockArea({ id: 'area-active', isArchived: false }),
      createMockArea({ id: 'area-archived', isArchived: true }),
    ]
    const data = createMockAllotmentData(areas)

    const result = getAreasForYear(data, 2025)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('area-active')
  })

  it('returns empty array when no areas are active in a year', () => {
    const areas = [
      createMockArea({ id: 'area-a', createdYear: 2025, retiredYear: 2026 }),
      createMockArea({ id: 'area-b', createdYear: 2026, retiredYear: 2027 }),
    ]
    const data = createMockAllotmentData(areas)

    const result = getAreasForYear(data, 2024)
    expect(result).toHaveLength(0)
  })

  it('returns all areas when they have no temporal metadata', () => {
    const areas = [
      createMockArea({ id: 'area-a' }),
      createMockArea({ id: 'area-b' }),
      createMockArea({ id: 'area-c' }),
    ]
    const data = createMockAllotmentData(areas)

    const result = getAreasForYear(data, 2025)
    expect(result).toHaveLength(3)
    expect(result.map(a => a.id)).toEqual(['area-a', 'area-b', 'area-c'])
  })

  it('returns data with getAllAreas filtering applied', () => {
    const areas = [
      createMockArea({ id: 'area-active', isArchived: false, createdYear: 2024 }),
      createMockArea({ id: 'area-archived', isArchived: true, createdYear: 2024 }),
    ]
    const data = createMockAllotmentData(areas)

    const result = getAreasForYear(data, 2024)
    // Should be 1: getAllAreas filters out archived, then year filter applied
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('area-active')
  })

  it('handles explicit activeYears with year filtering', () => {
    const areas = [
      createMockArea({
        id: 'area-a',
        activeYears: [2023, 2025, 2027], // Explicitly active in these years only
      }),
      createMockArea({
        id: 'area-b',
        createdYear: 2024,
        retiredYear: 2026, // Active in 2024 and 2025
      }),
    ]
    const data = createMockAllotmentData(areas)

    expect(getAreasForYear(data, 2024)).toHaveLength(1) // Only area-b (2024 >= 2024 && 2024 < 2026)
    expect(getAreasForYear(data, 2025)).toHaveLength(2) // area-a and area-b (both active in 2025)
    expect(getAreasForYear(data, 2023)).toHaveLength(1) // Only area-a (in activeYears)
    expect(getAreasForYear(data, 2026)).toHaveLength(0) // Neither active (area-a not in activeYears, area-b retired)
  })
})

// ============ TESTS: getAreaActiveRange ============

describe('getAreaActiveRange()', () => {
  describe('areas without temporal metadata', () => {
    it('returns null for areas with no temporal metadata', () => {
      const area = createMockArea()

      expect(getAreaActiveRange(area)).toBeNull()
    })

    it('returns null even if isArchived is set', () => {
      const area = createMockArea({ isArchived: true })

      expect(getAreaActiveRange(area)).toBeNull()
    })
  })

  describe('areas with createdYear only', () => {
    it('returns range starting from createdYear with null end', () => {
      const area = createMockArea({ createdYear: 2024 })

      const range = getAreaActiveRange(area)
      expect(range).not.toBeNull()
      expect(range?.from).toBe(2024)
      expect(range?.to).toBeNull()
    })

    it('handles createdYear with undefined retiredYear', () => {
      const area = createMockArea({
        createdYear: 2025,
        retiredYear: undefined,
      })

      const range = getAreaActiveRange(area)
      expect(range?.from).toBe(2025)
      expect(range?.to).toBeNull()
    })
  })

  describe('areas with retiredYear only', () => {
    it('returns range starting from 0 with retiredYear as end', () => {
      const area = createMockArea({
        createdYear: undefined,
        retiredYear: 2024,
      })

      const range = getAreaActiveRange(area)
      expect(range).not.toBeNull()
      expect(range?.from).toBe(0)
      expect(range?.to).toBe(2024)
    })

    it('treats missing createdYear as 0', () => {
      const area = createMockArea({ retiredYear: 2026 })

      const range = getAreaActiveRange(area)
      expect(range?.from).toBe(0)
      expect(range?.to).toBe(2026)
    })
  })

  describe('areas with both createdYear and retiredYear', () => {
    it('returns complete range', () => {
      const area = createMockArea({
        createdYear: 2024,
        retiredYear: 2026,
      })

      const range = getAreaActiveRange(area)
      expect(range).not.toBeNull()
      expect(range?.from).toBe(2024)
      expect(range?.to).toBe(2026)
    })

    it('handles createdYear = retiredYear', () => {
      const area = createMockArea({
        createdYear: 2024,
        retiredYear: 2024,
      })

      const range = getAreaActiveRange(area)
      expect(range?.from).toBe(2024)
      expect(range?.to).toBe(2024)
    })

    it('handles createdYear > retiredYear (invalid but should return range)', () => {
      const area = createMockArea({
        createdYear: 2026,
        retiredYear: 2024,
      })

      const range = getAreaActiveRange(area)
      expect(range?.from).toBe(2026)
      expect(range?.to).toBe(2024)
      // Even though invalid, function returns what it's given
    })
  })

  describe('explicit activeYears', () => {
    it('ignores activeYears - only looks at createdYear/retiredYear', () => {
      const area = createMockArea({
        createdYear: 2024,
        retiredYear: 2026,
        activeYears: [2022, 2025, 2027], // Different range
      })

      const range = getAreaActiveRange(area)
      expect(range?.from).toBe(2024) // Uses createdYear, not activeYears
      expect(range?.to).toBe(2026) // Uses retiredYear, not activeYears
    })

    it('returns null when only activeYears is set (no createdYear or retiredYear)', () => {
      const area = createMockArea({
        createdYear: undefined,
        retiredYear: undefined,
        activeYears: [2024, 2025],
      })

      expect(getAreaActiveRange(area)).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('handles year 0 correctly', () => {
      const area = createMockArea({ createdYear: 0, retiredYear: 10 })

      const range = getAreaActiveRange(area)
      expect(range?.from).toBe(0)
      expect(range?.to).toBe(10)
    })

    it('handles very large years', () => {
      const area = createMockArea({ createdYear: 9999, retiredYear: 10000 })

      const range = getAreaActiveRange(area)
      expect(range?.from).toBe(9999)
      expect(range?.to).toBe(10000)
    })

    it('distinguishes null end from undefined end', () => {
      const areaWithoutRetired = createMockArea({ createdYear: 2024 })
      const areaWithUndefinedRetired = createMockArea({
        createdYear: 2024,
        retiredYear: undefined,
      })

      const range1 = getAreaActiveRange(areaWithoutRetired)
      const range2 = getAreaActiveRange(areaWithUndefinedRetired)

      // Both should have null end
      expect(range1?.to).toBeNull()
      expect(range2?.to).toBeNull()
    })
  })
})

// ============ TESTS: validatePlantingForYear ============

describe('validatePlantingForYear()', () => {
  it('returns valid:true for areas active in the specified year', () => {
    const data = createMockAllotmentData([
      createMockArea({ id: 'bed-a', createdYear: 2020, retiredYear: 2025 })
    ])

    const result = validatePlantingForYear(data, 2022, 'bed-a')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('returns valid:false with error for areas not yet created', () => {
    const data = createMockAllotmentData([
      createMockArea({ id: 'bed-a', createdYear: 2025 })
    ])

    const result = validatePlantingForYear(data, 2020, 'bed-a')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('not active in 2020')
    expect(result.error).toContain('2025-present')
  })

  it('returns valid:false with error for retired areas', () => {
    const data = createMockAllotmentData([
      createMockArea({ id: 'bed-a', createdYear: 2020, retiredYear: 2023 })
    ])

    const result = validatePlantingForYear(data, 2024, 'bed-a')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('not active in 2024')
    expect(result.error).toContain('2020-2023')
  })

  it('returns valid:false when area does not exist', () => {
    const data = createMockAllotmentData([])

    const result = validatePlantingForYear(data, 2022, 'nonexistent')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('does not exist')
  })

  it('returns valid:true for areas without temporal metadata (backward compat)', () => {
    const data = createMockAllotmentData([
      createMockArea({ id: 'bed-a' })
    ])

    const result = validatePlantingForYear(data, 2020, 'bed-a')
    expect(result.valid).toBe(true)
  })

  it('handles edge case: year equals createdYear (should be valid)', () => {
    const data = createMockAllotmentData([
      createMockArea({ id: 'bed-a', createdYear: 2020 })
    ])

    const result = validatePlantingForYear(data, 2020, 'bed-a')
    expect(result.valid).toBe(true)
  })

  it('handles edge case: year equals retiredYear (should be invalid)', () => {
    const data = createMockAllotmentData([
      createMockArea({ id: 'bed-a', retiredYear: 2020 })
    ])

    const result = validatePlantingForYear(data, 2020, 'bed-a')
    expect(result.valid).toBe(false)
  })

  it('provides clear error message with active year range', () => {
    const data = createMockAllotmentData([
      createMockArea({ id: 'test-bed', name: 'Test Bed', createdYear: 2020, retiredYear: 2025 })
    ])

    const result = validatePlantingForYear(data, 2019, 'test-bed')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Test Bed')
    expect(result.error).toContain('2019')
    expect(result.error).toContain('2020-2025')
  })

  it('returns valid:true when area is active in a year without explicit temporal metadata', () => {
    const data = createMockAllotmentData([
      createMockArea({ id: 'bed-a', name: 'Bed A' })
    ])

    const result = validatePlantingForYear(data, 2025, 'bed-a')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('handles multiple areas and validates the correct one', () => {
    const data = createMockAllotmentData([
      createMockArea({ id: 'bed-a', createdYear: 2020, retiredYear: 2023 }),
      createMockArea({ id: 'bed-b', createdYear: 2024, retiredYear: 2026 }),
      createMockArea({ id: 'bed-c' })
    ])

    // Validate bed-a in 2024 (should be invalid - retired in 2023)
    const resultA = validatePlantingForYear(data, 2024, 'bed-a')
    expect(resultA.valid).toBe(false)

    // Validate bed-b in 2024 (should be valid)
    const resultB = validatePlantingForYear(data, 2024, 'bed-b')
    expect(resultB.valid).toBe(true)

    // Validate bed-c in 2024 (should be valid - no temporal metadata)
    const resultC = validatePlantingForYear(data, 2024, 'bed-c')
    expect(resultC.valid).toBe(true)
  })

  it('error message includes both year and area name for clarity', () => {
    const data = createMockAllotmentData([
      createMockArea({ id: 'south-bed', name: 'South Bed', createdYear: 2023, retiredYear: 2025 })
    ])

    const result = validatePlantingForYear(data, 2026, 'south-bed')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('South Bed')
    expect(result.error).toContain('2026')
  })
})
