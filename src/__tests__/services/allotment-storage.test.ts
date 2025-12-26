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
} from '@/services/allotment-storage'
import { AllotmentData, CURRENT_SCHEMA_VERSION } from '@/types/unified-allotment'

// Helper to create valid test data
function createValidAllotmentData(overrides: Partial<AllotmentData> = {}): AllotmentData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    currentYear: 2025,
    meta: {
      name: 'Test Allotment',
      location: 'Test Location',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    layout: {
      beds: [
        { id: 'A', name: 'Bed A', status: 'rotation', rotationGroup: 'legumes', gridPosition: { startRow: 0, startCol: 0, endRow: 1, endCol: 1 }, description: 'Test bed' },
      ],
      permanentPlantings: [],
      infrastructure: [],
    },
    seasons: [
      {
        year: 2025,
        status: 'current',
        beds: [{ bedId: 'A', rotationGroup: 'brassicas', plantings: [] }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ],
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
      seasons: [{ year: 'not a number' as unknown as number, status: 'historical', beds: [], createdAt: '', updatedAt: '' }]
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
    const dataWithoutVersion = { currentYear: 2025, meta: { name: 'Test' }, layout: { beds: [], permanentPlantings: [], infrastructure: [] }, seasons: [] }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dataWithoutVersion))
    
    const result = loadAllotmentData()
    
    expect(result.success).toBe(true)
    expect(result.data?.version).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('repairs missing meta.name with default', () => {
    const dataWithoutMetaName = {
      version: 1,
      currentYear: 2025,
      meta: { location: 'Test' },
      layout: { beds: [], permanentPlantings: [], infrastructure: [] },
      seasons: []
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dataWithoutMetaName))
    
    const result = loadAllotmentData()
    
    expect(result.success).toBe(true)
    expect(result.data?.meta.name).toBe('My Allotment')
  })

  it('repairs missing layout arrays with empty arrays', () => {
    const dataWithPartialLayout = {
      version: 1,
      currentYear: 2025,
      meta: { name: 'Test' },
      layout: { beds: [] },
      seasons: []
    }
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(dataWithPartialLayout))
    
    const result = loadAllotmentData()
    
    expect(result.success).toBe(true)
    expect(result.data?.layout.permanentPlantings).toEqual([])
    expect(result.data?.layout.infrastructure).toEqual([])
  })

  it('repairs invalid seasons array with empty array', () => {
    const dataWithInvalidSeasons = { 
      version: 1, 
      currentYear: 2025, 
      meta: { name: 'Test' }, 
      layout: { beds: [], permanentPlantings: [], infrastructure: [] }, 
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

  it('migrates from legacy data if no existing data', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockImplementation(() => {})
    
    const result = initializeStorage()
    
    expect(result.success).toBe(true)
    expect(result.data?.meta.name).toBe('My Edinburgh Allotment')
    expect(localStorage.setItem).toHaveBeenCalled()
  })
})
