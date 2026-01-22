/**
 * Unit tests for allotment-storage.ts
 *
 * Essential tests only: schema validation, data repair, and quota handling.
 * Simple CRUD operations are covered by E2E tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  loadAllotmentData,
  saveAllotmentData,
  initializeStorage,
  addArea,
} from '@/services/allotment-storage'
import { AllotmentData, CURRENT_SCHEMA_VERSION, Area } from '@/types/unified-allotment'

// Use actual current year to avoid auto-update logic during tests
const TEST_CURRENT_YEAR = new Date().getFullYear()

// Helper to create valid test data (v10 schema)
function createValidAllotmentData(overrides: Partial<AllotmentData> = {}): AllotmentData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    currentYear: TEST_CURRENT_YEAR,
    meta: {
      name: 'Test Allotment',
      location: 'Test Location',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    layout: {
      areas: [
        {
          id: 'bed-a',
          kind: 'rotation-bed',
          name: 'Bed A',
          rotationGroup: 'legumes',
          gridPosition: { x: 0, y: 0, w: 2, h: 2 },
          canHavePlantings: true,
        },
        {
          id: 'apple-tree',
          kind: 'tree',
          name: 'Apple Tree',
          primaryPlant: { plantId: 'apple-tree', variety: 'Bramley', plantedYear: 2020 },
          gridPosition: { x: 2, y: 0, w: 1, h: 1 },
          canHavePlantings: true,
        },
      ],
    },
    seasons: [
      {
        year: TEST_CURRENT_YEAR,
        status: 'current',
        areas: [{ areaId: 'bed-a', rotationGroup: 'brassicas', plantings: [] }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ],
    varieties: [],
    ...overrides,
  }
}

describe('Schema Validation', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('returns error when no data exists', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)

    const result = loadAllotmentData()

    expect(result.success).toBe(false)
    expect(result.error).toBe('No data found')
  })

  it('returns error for invalid JSON', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('not valid json {{{')

    const result = loadAllotmentData()

    expect(result.success).toBe(false)
    expect(result.error).toBe('Corrupted data: invalid JSON')
  })

  it('returns error for null data', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('null')

    const result = loadAllotmentData()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid data schema')
  })

  it('returns error for non-object data', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('"string"')

    const result = loadAllotmentData()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid data schema')
  })

  it('loads valid data successfully', () => {
    const validData = createValidAllotmentData()
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(validData))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data).toEqual(validData)
  })

  it('validates season structure and rejects invalid year', () => {
    const dataWithBadSeason = createValidAllotmentData({
      seasons: [{ year: 'not a number' as unknown as number, status: 'historical', areas: [], createdAt: '', updatedAt: '' }]
    })
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dataWithBadSeason))

    const result = loadAllotmentData()

    // Validation should catch this - repair should filter out bad seasons
    expect(result.success === false || result.data?.seasons.length === 0).toBe(true)
  })
})

describe('Data Repair', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('repairs missing version field with default', () => {
    const dataWithoutVersion = { currentYear: TEST_CURRENT_YEAR, meta: { name: 'Test' }, layout: { areas: [] }, seasons: [] }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dataWithoutVersion))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data?.version).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('repairs missing meta.name with default', () => {
    const dataWithoutMetaName = {
      version: 1,
      currentYear: TEST_CURRENT_YEAR,
      meta: { location: 'Test' },
      layout: { areas: [] },
      seasons: []
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dataWithoutMetaName))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data?.meta.name).toBe('My Allotment')
  })

  it('repairs missing layout.areas with empty array', () => {
    const dataWithPartialLayout = {
      version: 1,
      currentYear: TEST_CURRENT_YEAR,
      meta: { name: 'Test' },
      layout: {}, // Missing areas
      seasons: []
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dataWithPartialLayout))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data?.layout.areas).toBeDefined()
  })

  it('repairs invalid seasons array with empty array', () => {
    const dataWithInvalidSeasons = {
      version: 1,
      currentYear: TEST_CURRENT_YEAR,
      meta: { name: 'Test' },
      layout: { areas: [] },
      seasons: 'not an array'
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dataWithInvalidSeasons))

    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data?.seasons).toEqual([])
  })
})

describe('Quota Handling', () => {
  beforeEach(() => {
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('handles quota exceeded error gracefully', () => {
    const data = createValidAllotmentData()
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError')
    Object.defineProperty(quotaError, 'code', { value: 22 })
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw quotaError })

    const result = saveAllotmentData(data)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Storage quota exceeded')
  })

  it('handles Firefox quota error code', () => {
    const data = createValidAllotmentData()
    const quotaError = new DOMException('Quota reached', 'NS_ERROR_DOM_QUOTA_REACHED')
    Object.defineProperty(quotaError, 'code', { value: 1014 })
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw quotaError })

    const result = saveAllotmentData(data)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Storage quota exceeded')
  })
})

describe('Legacy Migration', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('creates empty allotment data if no existing data', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockImplementation(() => {})

    const result = initializeStorage()

    expect(result.success).toBe(true)
    expect(result.data?.meta.name).toBe('My Allotment')
    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('initialized data uses v10 unified areas (empty start)', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockImplementation(() => {})

    const result = initializeStorage()

    expect(result.success).toBe(true)
    expect(result.data?.layout.areas).toBeDefined()
    expect(Array.isArray(result.data?.layout.areas)).toBe(true)
    // Fresh install starts with no areas - users add via UI
    expect(result.data?.layout.areas.length).toBe(0)
  })

  it('seasons use areas array not beds', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockImplementation(() => {})

    const result = initializeStorage()

    expect(result.success).toBe(true)
    if (result.data?.seasons && result.data.seasons.length > 0) {
      const season = result.data.seasons[0]
      expect(season.areas).toBeDefined()
      expect(Array.isArray(season.areas)).toBe(true)
    }
  })
})

describe('addArea() temporal backfilling', () => {
  it('backfills AreaSeason only to years >= createdYear', () => {
    const data: AllotmentData = {
      version: 10,
      meta: { name: 'Test', location: '', createdAt: '', updatedAt: '' },
      layout: { areas: [] },
      seasons: [
        { year: 2020, status: 'historical', areas: [], createdAt: '', updatedAt: '' },
        { year: 2021, status: 'historical', areas: [], createdAt: '', updatedAt: '' },
        { year: 2022, status: 'historical', areas: [], createdAt: '', updatedAt: '' },
        { year: 2023, status: 'current', areas: [], createdAt: '', updatedAt: '' }
      ],
      currentYear: 2023,
      maintenanceTasks: [],
      varieties: []
    }

    const newArea: Omit<Area, 'id' | 'createdAt'> = {
      kind: 'rotation-bed',
      name: 'New Bed',
      description: '',
      rotationGroup: 'legumes',
      createdYear: 2022,
      isArchived: false,
      canHavePlantings: true
    }

    const result = addArea(data, newArea)

    // Should not backfill to 2020 and 2021
    expect(result.data!.seasons[0].areas).toHaveLength(0)
    expect(result.data!.seasons[1].areas).toHaveLength(0)

    // Should backfill to 2022 and 2023
    expect(result.data!.seasons[2].areas).toHaveLength(1)
    expect(result.data!.seasons[3].areas).toHaveLength(1)
  })

  it('does not backfill to years before createdYear', () => {
    const data: AllotmentData = {
      version: 10,
      meta: { name: 'Test', location: '', createdAt: '', updatedAt: '' },
      layout: { areas: [] },
      seasons: [
        { year: 2020, status: 'historical', areas: [], createdAt: '', updatedAt: '' },
        { year: 2025, status: 'current', areas: [], createdAt: '', updatedAt: '' }
      ],
      currentYear: TEST_CURRENT_YEAR,
      maintenanceTasks: [],
      varieties: []
    }

    const newArea: Omit<Area, 'id' | 'createdAt'> = {
      kind: 'rotation-bed',
      name: 'Future Bed',
      createdYear: 2025,
      description: '',
      rotationGroup: 'brassicas',
      isArchived: false,
      canHavePlantings: true
    }

    const result = addArea(data, newArea)

    expect(result.data!.seasons[0].areas).toHaveLength(0)
    expect(result.data!.seasons[1].areas).toHaveLength(1)
  })

  it('keeps createdYear undefined when not specified (area exists in all years)', () => {
    const currentYear = new Date().getFullYear()
    const data: AllotmentData = {
      version: 10,
      meta: { name: 'Test', location: '', createdAt: '', updatedAt: '' },
      layout: { areas: [] },
      seasons: [
        { year: currentYear - 1, status: 'historical', areas: [], createdAt: '', updatedAt: '' },
        { year: currentYear, status: 'current', areas: [], createdAt: '', updatedAt: '' }
      ],
      currentYear: currentYear,
      maintenanceTasks: [],
      varieties: []
    }

    const newArea: Omit<Area, 'id' | 'createdAt'> = {
      kind: 'perennial-bed',
      name: 'No Year Bed',
      description: '',
      isArchived: false,
      canHavePlantings: true
    }

    const result = addArea(data, newArea)

    // createdYear stays undefined - means area exists in all years
    const addedArea = result.data!.layout.areas[0]
    expect(addedArea.createdYear).toBeUndefined()

    // Should backfill to ALL seasons since createdYear is undefined
    expect(result.data!.seasons[0].areas).toHaveLength(1) // Historical year
    expect(result.data!.seasons[1].areas).toHaveLength(1) // Current year
  })

  it('only backfills to years >= createdYear with activeYears when specified', () => {
    const data: AllotmentData = {
      version: 10,
      meta: { name: 'Test', location: '', createdAt: '', updatedAt: '' },
      layout: { areas: [] },
      seasons: [
        { year: 2020, status: 'historical', areas: [], createdAt: '', updatedAt: '' },
        { year: 2021, status: 'historical', areas: [], createdAt: '', updatedAt: '' },
        { year: 2022, status: 'historical', areas: [], createdAt: '', updatedAt: '' },
        { year: 2023, status: 'current', areas: [], createdAt: '', updatedAt: '' }
      ],
      currentYear: 2023,
      maintenanceTasks: [],
      varieties: []
    }

    const newArea: Omit<Area, 'id' | 'createdAt'> = {
      kind: 'rotation-bed',
      name: 'Selective Bed',
      description: '',
      rotationGroup: 'roots',
      createdYear: 2020,
      activeYears: [2021, 2023], // Only active in specific years
      isArchived: false,
      canHavePlantings: true
    }

    const result = addArea(data, newArea)

    // Should only backfill to years in activeYears
    expect(result.data!.seasons[0].areas).toHaveLength(0) // 2020 - not in activeYears
    expect(result.data!.seasons[1].areas).toHaveLength(1) // 2021 - in activeYears
    expect(result.data!.seasons[2].areas).toHaveLength(0) // 2022 - not in activeYears
    expect(result.data!.seasons[3].areas).toHaveLength(1) // 2023 - in activeYears
  })

  it('backfills with correct rotation group for rotation beds', () => {
    const data: AllotmentData = {
      version: 10,
      meta: { name: 'Test', location: '', createdAt: '', updatedAt: '' },
      layout: { areas: [] },
      seasons: [{ year: 2023, status: 'current', areas: [], createdAt: '', updatedAt: '' }],
      currentYear: 2023,
      maintenanceTasks: [],
      varieties: []
    }

    const newArea: Omit<Area, 'id' | 'createdAt'> = {
      kind: 'rotation-bed',
      name: 'Rotation Bed',
      description: '',
      rotationGroup: 'brassicas',
      createdYear: 2023,
      isArchived: false,
      canHavePlantings: true
    }

    const result = addArea(data, newArea)

    const areaSeason = result.data!.seasons[0].areas[0]
    expect(areaSeason.rotationGroup).toBe('brassicas')
  })
})

describe('v11 to v12 migration', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('should rename harvestDate to actualHarvestStart', () => {
    const v11Data = createValidAllotmentData({
      version: 11,
      seasons: [{
        year: TEST_CURRENT_YEAR,
        status: 'current',
        areas: [{
          areaId: 'bed-a',
          rotationGroup: 'legumes',
          plantings: [{
            id: 'p1',
            plantId: 'peas',
            harvestDate: '2025-07-15'  // Old field name
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any]
        }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }]
    })

    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v11Data))
    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    expect(result.data?.version).toBe(12)
    const planting = result.data?.seasons[0].areas[0].plantings[0]
    expect(planting?.actualHarvestStart).toBe('2025-07-15')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((planting as any).harvestDate).toBeUndefined()
  })

  it('should default sowMethod to outdoor when sowDate exists', () => {
    const v11Data = createValidAllotmentData({
      version: 11,
      seasons: [{
        year: TEST_CURRENT_YEAR,
        status: 'current',
        areas: [{
          areaId: 'bed-a',
          rotationGroup: 'legumes',
          plantings: [{
            id: 'p1',
            plantId: 'peas',
            sowDate: '2025-04-15'
          }]
        }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }]
    })

    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v11Data))
    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    const planting = result.data?.seasons[0].areas[0].plantings[0]
    expect(planting?.sowMethod).toBe('outdoor')
  })

  it('should not set sowMethod when sowDate is missing', () => {
    const v11Data = createValidAllotmentData({
      version: 11,
      seasons: [{
        year: TEST_CURRENT_YEAR,
        status: 'current',
        areas: [{
          areaId: 'bed-a',
          rotationGroup: 'legumes',
          plantings: [{
            id: 'p1',
            plantId: 'peas'
            // No sowDate
          }]
        }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }]
    })

    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v11Data))
    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    const planting = result.data?.seasons[0].areas[0].plantings[0]
    expect(planting?.sowMethod).toBeUndefined()
  })

  it('should preserve all other planting fields', () => {
    const v11Data = createValidAllotmentData({
      version: 11,
      seasons: [{
        year: TEST_CURRENT_YEAR,
        status: 'current',
        areas: [{
          areaId: 'bed-a',
          rotationGroup: 'legumes',
          plantings: [{
            id: 'p1',
            plantId: 'peas',
            varietyName: 'Kelvedon Wonder',
            sowDate: '2025-04-15',
            transplantDate: '2025-05-20',
            success: 'good',
            notes: 'Test notes',
            quantity: 24
          }]
        }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }]
    })

    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(v11Data))
    const result = loadAllotmentData()

    expect(result.success).toBe(true)
    const planting = result.data?.seasons[0].areas[0].plantings[0]
    expect(planting?.varietyName).toBe('Kelvedon Wonder')
    expect(planting?.sowDate).toBe('2025-04-15')
    expect(planting?.transplantDate).toBe('2025-05-20')
    expect(planting?.success).toBe('good')
    expect(planting?.notes).toBe('Test notes')
    expect(planting?.quantity).toBe(24)
    expect(planting?.sowMethod).toBe('outdoor')
  })
})
