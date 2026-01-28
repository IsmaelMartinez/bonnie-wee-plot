/**
 * Unit tests for variety-queries.ts
 *
 * Tests computed queries for variety usage from plantings data.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeVarietyName,
  getVarietyUsedYears,
  getVarietiesForYear,
} from '@/lib/variety-queries'
import type { AllotmentData, Planting, SeasonRecord } from '@/types/unified-allotment'

function createMinimalAllotmentData(overrides: Partial<AllotmentData> = {}): AllotmentData {
  return {
    version: 12,
    meta: {
      name: 'Test Allotment',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    layout: {
      areas: [],
    },
    seasons: [],
    currentYear: 2025,
    varieties: [],
    ...overrides,
  }
}

function createPlanting(plantId: string, varietyName: string, id = 'p1'): Planting {
  return {
    id,
    plantId,
    varietyName,
  }
}

function createSeasonRecord(year: number, plantings: { areaId: string; plantings: Planting[] }[]): SeasonRecord {
  return {
    year,
    status: 'historical',
    areas: plantings.map(p => ({
      areaId: p.areaId,
      plantings: p.plantings,
    })),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }
}

describe('normalizeVarietyName', () => {
  it('trims whitespace', () => {
    expect(normalizeVarietyName('  Kelvedon Wonder  ')).toBe('kelvedon wonder')
  })

  it('converts to lowercase', () => {
    expect(normalizeVarietyName('Nantes 2')).toBe('nantes 2')
  })

  it('handles empty string', () => {
    expect(normalizeVarietyName('')).toBe('')
  })

  it('handles undefined', () => {
    expect(normalizeVarietyName(undefined)).toBe('')
  })
})

describe('getVarietyUsedYears', () => {
  it('returns empty array when variety not found in any planting', () => {
    const data = createMinimalAllotmentData({
      varieties: [
        {
          id: 'v1',
          plantId: 'pea',
          name: 'Kelvedon Wonder',
          seedsByYear: {},
        },
      ],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('tomato', 'San Marzano', 'p1')],
          },
        ]),
      ],
    })

    const years = getVarietyUsedYears('v1', data)
    expect(years).toEqual([])
  })

  it('returns years when plantId and varietyName match exactly', () => {
    const data = createMinimalAllotmentData({
      varieties: [
        {
          id: 'v1',
          plantId: 'pea',
          name: 'Kelvedon Wonder',
          seedsByYear: {},
        },
      ],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('pea', 'Kelvedon Wonder', 'p1')],
          },
        ]),
        createSeasonRecord(2025, [
          {
            areaId: 'bed-b',
            plantings: [createPlanting('pea', 'Kelvedon Wonder', 'p2')],
          },
        ]),
      ],
    })

    const years = getVarietyUsedYears('v1', data)
    expect(years).toEqual([2024, 2025])
  })

  it('matches with normalized variety names (case-insensitive, trimmed)', () => {
    const data = createMinimalAllotmentData({
      varieties: [
        {
          id: 'v1',
          plantId: 'pea',
          name: 'Kelvedon Wonder',
          seedsByYear: {},
        },
      ],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('pea', '  KELVEDON WONDER  ', 'p1')],
          },
        ]),
        createSeasonRecord(2025, [
          {
            areaId: 'bed-b',
            plantings: [createPlanting('pea', 'kelvedon wonder', 'p2')],
          },
        ]),
      ],
    })

    const years = getVarietyUsedYears('v1', data)
    expect(years).toEqual([2024, 2025])
  })

  it('does not match if plantId differs', () => {
    const data = createMinimalAllotmentData({
      varieties: [
        {
          id: 'v1',
          plantId: 'pea',
          name: 'Kelvedon Wonder',
          seedsByYear: {},
        },
      ],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('bean', 'Kelvedon Wonder', 'p1')], // Different plantId
          },
        ]),
      ],
    })

    const years = getVarietyUsedYears('v1', data)
    expect(years).toEqual([])
  })

  it('does not match if varietyName differs', () => {
    const data = createMinimalAllotmentData({
      varieties: [
        {
          id: 'v1',
          plantId: 'pea',
          name: 'Kelvedon Wonder',
          seedsByYear: {},
        },
      ],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('pea', 'Nantes 2', 'p1')], // Different variety
          },
        ]),
      ],
    })

    const years = getVarietyUsedYears('v1', data)
    expect(years).toEqual([])
  })

  it('handles plantings without varietyName', () => {
    const data = createMinimalAllotmentData({
      varieties: [
        {
          id: 'v1',
          plantId: 'pea',
          name: 'Kelvedon Wonder',
          seedsByYear: {},
        },
      ],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [{ id: 'p1', plantId: 'pea' }], // No varietyName
          },
        ]),
      ],
    })

    const years = getVarietyUsedYears('v1', data)
    expect(years).toEqual([])
  })

  it('returns sorted unique years', () => {
    const data = createMinimalAllotmentData({
      varieties: [
        {
          id: 'v1',
          plantId: 'pea',
          name: 'Kelvedon Wonder',
          seedsByYear: {},
        },
      ],
      seasons: [
        createSeasonRecord(2023, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('pea', 'Kelvedon Wonder', 'p1')],
          },
        ]),
        createSeasonRecord(2025, [
          {
            areaId: 'bed-b',
            plantings: [
              createPlanting('pea', 'Kelvedon Wonder', 'p2'),
              createPlanting('pea', 'Kelvedon Wonder', 'p3'), // Duplicate year
            ],
          },
        ]),
        createSeasonRecord(2024, [
          {
            areaId: 'bed-c',
            plantings: [createPlanting('pea', 'Kelvedon Wonder', 'p4')],
          },
        ]),
      ],
    })

    const years = getVarietyUsedYears('v1', data)
    expect(years).toEqual([2023, 2024, 2025])
  })

  it('handles variety not in varieties array', () => {
    const data = createMinimalAllotmentData({
      varieties: [],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('pea', 'Kelvedon Wonder', 'p1')],
          },
        ]),
      ],
    })

    const years = getVarietyUsedYears('v1', data)
    expect(years).toEqual([])
  })

  it('handles multiple areas in same season', () => {
    const data = createMinimalAllotmentData({
      varieties: [
        {
          id: 'v1',
          plantId: 'pea',
          name: 'Kelvedon Wonder',
          seedsByYear: {},
        },
      ],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('pea', 'Kelvedon Wonder', 'p1')],
          },
          {
            areaId: 'bed-b',
            plantings: [createPlanting('pea', 'Kelvedon Wonder', 'p2')],
          },
        ]),
      ],
    })

    const years = getVarietyUsedYears('v1', data)
    expect(years).toEqual([2024]) // Should deduplicate year
  })
})

describe('getVarietiesForYear', () => {
  it('returns empty array when no varieties used in year', () => {
    const data = createMinimalAllotmentData({
      varieties: [
        {
          id: 'v1',
          plantId: 'pea',
          name: 'Kelvedon Wonder',
          seedsByYear: {},
        },
      ],
      seasons: [],
    })

    const varieties = getVarietiesForYear(2024, data)
    expect(varieties).toEqual([])
  })

  it('returns varieties used in the specified year', () => {
    const v1 = {
      id: 'v1',
      plantId: 'pea',
      name: 'Kelvedon Wonder',
      seedsByYear: {},
    }
    const v2 = {
      id: 'v2',
      plantId: 'tomato',
      name: 'San Marzano',
      seedsByYear: {},
    }
    const v3 = {
      id: 'v3',
      plantId: 'carrot',
      name: 'Nantes 2',
      seedsByYear: {},
    }

    const data = createMinimalAllotmentData({
      varieties: [v1, v2, v3],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [
              createPlanting('pea', 'Kelvedon Wonder', 'p1'),
              createPlanting('tomato', 'San Marzano', 'p2'),
            ],
          },
        ]),
        createSeasonRecord(2025, [
          {
            areaId: 'bed-b',
            plantings: [createPlanting('carrot', 'Nantes 2', 'p3')],
          },
        ]),
      ],
    })

    const varieties2024 = getVarietiesForYear(2024, data)
    expect(varieties2024.map(v => v.id)).toEqual(['v1', 'v2'])

    const varieties2025 = getVarietiesForYear(2025, data)
    expect(varieties2025.map(v => v.id)).toEqual(['v3'])
  })

  it('handles normalized variety name matching', () => {
    const v1 = {
      id: 'v1',
      plantId: 'pea',
      name: 'Kelvedon Wonder',
      seedsByYear: {},
    }

    const data = createMinimalAllotmentData({
      varieties: [v1],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('pea', '  KELVEDON WONDER  ', 'p1')],
          },
        ]),
      ],
    })

    const varieties = getVarietiesForYear(2024, data)
    expect(varieties.map(v => v.id)).toEqual(['v1'])
  })

  it('does not return varieties with mismatched plantId', () => {
    const v1 = {
      id: 'v1',
      plantId: 'pea',
      name: 'Kelvedon Wonder',
      seedsByYear: {},
    }

    const data = createMinimalAllotmentData({
      varieties: [v1],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('bean', 'Kelvedon Wonder', 'p1')], // Different plantId
          },
        ]),
      ],
    })

    const varieties = getVarietiesForYear(2024, data)
    expect(varieties).toEqual([])
  })

  it('returns unique varieties even if used in multiple areas', () => {
    const v1 = {
      id: 'v1',
      plantId: 'pea',
      name: 'Kelvedon Wonder',
      seedsByYear: {},
    }

    const data = createMinimalAllotmentData({
      varieties: [v1],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('pea', 'Kelvedon Wonder', 'p1')],
          },
          {
            areaId: 'bed-b',
            plantings: [createPlanting('pea', 'Kelvedon Wonder', 'p2')],
          },
        ]),
      ],
    })

    const varieties = getVarietiesForYear(2024, data)
    expect(varieties).toEqual([v1])
  })

  it('returns varieties with seedsByYear entry even without plantings', () => {
    const v1 = {
      id: 'v1',
      plantId: 'pea',
      name: 'Kelvedon Wonder',
      seedsByYear: { 2024: 'ordered' },
    }
    const v2 = {
      id: 'v2',
      plantId: 'tomato',
      name: 'San Marzano',
      seedsByYear: { 2025: 'have' }, // Different year
    }
    const v3 = {
      id: 'v3',
      plantId: 'carrot',
      name: 'Nantes 2',
      seedsByYear: {}, // No seedsByYear entries
    }

    const data = createMinimalAllotmentData({
      varieties: [v1, v2, v3],
      seasons: [], // No plantings at all
    })

    // Only v1 should be returned for 2024 (has seedsByYear entry for that year)
    const varieties2024 = getVarietiesForYear(2024, data)
    expect(varieties2024.map(v => v.id)).toEqual(['v1'])

    // Only v2 should be returned for 2025
    const varieties2025 = getVarietiesForYear(2025, data)
    expect(varieties2025.map(v => v.id)).toEqual(['v2'])

    // No varieties for 2026
    const varieties2026 = getVarietiesForYear(2026, data)
    expect(varieties2026).toEqual([])
  })

  it('returns varieties from both seedsByYear and plantings without duplicates', () => {
    const v1 = {
      id: 'v1',
      plantId: 'pea',
      name: 'Kelvedon Wonder',
      seedsByYear: { 2024: 'have' }, // Has seedsByYear entry
    }

    const data = createMinimalAllotmentData({
      varieties: [v1],
      seasons: [
        createSeasonRecord(2024, [
          {
            areaId: 'bed-a',
            plantings: [createPlanting('pea', 'Kelvedon Wonder', 'p1')], // Also has planting
          },
        ]),
      ],
    })

    // Should return v1 only once, not duplicated
    const varieties = getVarietiesForYear(2024, data)
    expect(varieties).toEqual([v1])
  })
})
