/**
 * Unit tests for variety-storage.ts
 *
 * Covers: loading/saving, CRUD operations,
 * year planning, and query functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  loadVarietyData,
  saveVarietyData,
  initializeVarietyStorage,
  createEmptyVarietyData,
  addVariety,
  updateVariety,
  removeVariety,
  togglePlannedYear,
  getVarietiesForYear,
  toggleHaveSeedsForYear,
  hasSeedsForYear,
  getVarietiesByVegetable,
  getSuppliers,
  getTotalSpendForYear,
} from '@/services/variety-storage'
import { VarietyData, VARIETY_SCHEMA_VERSION } from '@/types/variety-data'

function createValidVarietyData(overrides: Partial<VarietyData> = {}): VarietyData {
  return {
    version: VARIETY_SCHEMA_VERSION,
    varieties: [],
    meta: {
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    ...overrides,
  }
}

describe('Load and Save', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('returns error when no data exists', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)

    const result = loadVarietyData()

    expect(result.success).toBe(false)
    expect(result.error).toBe('No data found')
  })

  it('returns error for invalid JSON', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('not valid json {{{')

    const result = loadVarietyData()

    expect(result.success).toBe(false)
    expect(result.error).toBe('Corrupted data: invalid JSON')
  })

  it('loads valid data successfully', () => {
    const validData = createValidVarietyData()
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(validData))

    const result = loadVarietyData()

    expect(result.success).toBe(true)
    expect(result.data).toEqual(validData)
  })

  it('saves data and updates timestamp', () => {
    const data = createValidVarietyData()
    vi.mocked(localStorage.setItem).mockImplementation(() => {})

    const result = saveVarietyData(data)

    expect(result.success).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalled()

    const savedData = JSON.parse(
      vi.mocked(localStorage.setItem).mock.calls[0][1]
    )
    expect(savedData.meta.updatedAt).not.toBe(data.meta.updatedAt)
  })

  it('handles quota exceeded error', () => {
    const data = createValidVarietyData()
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError')
    Object.defineProperty(quotaError, 'code', { value: 22 })
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw quotaError })

    const result = saveVarietyData(data)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Storage quota exceeded')
  })
})

describe('Initialization', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('initializes with empty data when no stored data exists', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockImplementation(() => {})

    const result = initializeVarietyStorage()

    expect(result.success).toBe(true)
    expect(result.data?.varieties.length).toBe(0)
    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('returns existing data if already stored', () => {
    const existingData = createValidVarietyData({
      varieties: [{ id: 'test-1', plantId: 'peas', name: 'Test Pea', plannedYears: [], seedsByYear: {} }],
    })
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(existingData))

    const result = initializeVarietyStorage()

    expect(result.success).toBe(true)
    expect(result.data?.varieties.length).toBe(1)
  })
})

describe('CRUD Operations', () => {
  it('adds a new variety', () => {
    const data = createValidVarietyData()

    const updated = addVariety(data, {
      plantId: 'peas',
      name: 'New Pea Variety',
      supplier: 'Test Supplier',
      price: 2.99,
    })

    expect(updated.varieties.length).toBe(1)
    expect(updated.varieties[0].name).toBe('New Pea Variety')
    expect(updated.varieties[0].plantId).toBe('peas')
    expect(updated.varieties[0].supplier).toBe('Test Supplier')
    expect(updated.varieties[0].id).toContain('variety-')
    expect(updated.varieties[0].plannedYears).toEqual([])
  })

  it('adds variety with initial planned years', () => {
    const data = createValidVarietyData()

    const updated = addVariety(data, {
      plantId: 'carrots',
      name: 'Nantes',
      plannedYears: [2025, 2026],
    })

    expect(updated.varieties[0].plannedYears).toEqual([2025, 2026])
  })

  it('updates an existing variety', () => {
    const data = createValidVarietyData({
      varieties: [{
        id: 'v-1',
        plantId: 'peas',
        name: 'Original Name',
        plannedYears: [],
        seedsByYear: {},
      }],
    })

    const updated = updateVariety(data, 'v-1', {
      name: 'Updated Name',
      notes: 'New notes',
    })

    expect(updated.varieties[0].name).toBe('Updated Name')
    expect(updated.varieties[0].notes).toBe('New notes')
  })

  it('removes a variety', () => {
    const data = createValidVarietyData({
      varieties: [
        { id: 'v-1', plantId: 'peas', name: 'Variety 1', plannedYears: [], seedsByYear: {} },
        { id: 'v-2', plantId: 'beans', name: 'Variety 2', plannedYears: [], seedsByYear: {} },
      ],
    })

    const updated = removeVariety(data, 'v-1')

    expect(updated.varieties.length).toBe(1)
    expect(updated.varieties[0].id).toBe('v-2')
  })
})

describe('Year Planning', () => {
  it('toggles planned year on', () => {
    const data = createValidVarietyData({
      varieties: [{
        id: 'v-1',
        plantId: 'peas',
        name: 'Peas',
        plannedYears: [],
        seedsByYear: {},
      }],
    })

    const updated = togglePlannedYear(data, 'v-1', 2025)

    expect(updated.varieties[0].plannedYears).toEqual([2025])
  })

  it('toggles planned year off', () => {
    const data = createValidVarietyData({
      varieties: [{
        id: 'v-1',
        plantId: 'peas',
        name: 'Peas',
        plannedYears: [2025],
        seedsByYear: {},
      }],
    })

    const updated = togglePlannedYear(data, 'v-1', 2025)

    expect(updated.varieties[0].plannedYears).toEqual([])
  })

  it('maintains sorted planned years', () => {
    const data = createValidVarietyData({
      varieties: [{
        id: 'v-1',
        plantId: 'peas',
        name: 'Peas',
        plannedYears: [2027],
        seedsByYear: {},
      }],
    })

    const updated = togglePlannedYear(data, 'v-1', 2025)

    expect(updated.varieties[0].plannedYears).toEqual([2025, 2027])
  })

  it('gets varieties for year including both used and planned', () => {
    const data = createValidVarietyData({
      varieties: [
        { id: 'v-1', plantId: 'peas', name: 'Used in 2024', plannedYears: [2024], seedsByYear: {} },
        { id: 'v-2', plantId: 'beans', name: 'Planned for 2025', plannedYears: [2025], seedsByYear: {} },
        { id: 'v-3', plantId: 'carrots', name: 'Both', plannedYears: [2025], seedsByYear: {} },
        { id: 'v-4', plantId: 'onions', name: 'Neither', plannedYears: [], seedsByYear: {} },
      ],
    })

    const for2024 = getVarietiesForYear(data, 2024)
    const for2025 = getVarietiesForYear(data, 2025)

    expect(for2024.map(v => v.id)).toEqual(['v-1'])
    expect(for2025.map(v => v.id)).toEqual(['v-2', 'v-3'])
  })
})

describe('Have Seeds (Per Year)', () => {
  it('toggles have seeds to ordered for a specific year', () => {
    const data = createValidVarietyData({
      varieties: [{ id: 'v-1', plantId: 'peas', name: 'Peas', plannedYears: [], seedsByYear: {} }],
    })

    const updated = toggleHaveSeedsForYear(data, 'v-1', 2026)

    expect(updated.varieties[0].seedsByYear).toEqual({ 2026: 'ordered' })
  })

  it('cycles seed status through states', () => {
    const data = createValidVarietyData({
      varieties: [{ id: 'v-1', plantId: 'peas', name: 'Peas', plannedYears: [], seedsByYear: {} }],
    })

    // none -> ordered
    const updated1 = toggleHaveSeedsForYear(data, 'v-1', 2026)
    expect(updated1.varieties[0].seedsByYear).toEqual({ 2026: 'ordered' })

    // ordered -> have
    const updated2 = toggleHaveSeedsForYear(updated1, 'v-1', 2026)
    expect(updated2.varieties[0].seedsByYear).toEqual({ 2026: 'have' })

    // have -> none (removes entry)
    const updated3 = toggleHaveSeedsForYear(updated2, 'v-1', 2026)
    expect(updated3.varieties[0].seedsByYear).toEqual({})
  })

  it('checks if seeds exist for a year', () => {
    const variety = { id: 'v-1', plantId: 'peas', name: 'Peas', yearsUsed: [], plannedYears: [], seedsByYear: { 2026: 'have' as const, 2027: 'have' as const } }

    expect(hasSeedsForYear(variety, 2026)).toBe(true)
    expect(hasSeedsForYear(variety, 2027)).toBe(true)
    expect(hasSeedsForYear(variety, 2025)).toBe(false)
  })
})

describe('Query Functions', () => {
  it('gets varieties by vegetable', () => {
    const data = createValidVarietyData({
      varieties: [
        { id: 'v-1', plantId: 'peas', name: 'Pea 1', plannedYears: [], seedsByYear: {} },
        { id: 'v-2', plantId: 'peas', name: 'Pea 2', plannedYears: [], seedsByYear: {} },
        { id: 'v-3', plantId: 'beans', name: 'Bean 1', plannedYears: [], seedsByYear: {} },
      ],
    })

    const peas = getVarietiesByVegetable(data, 'peas')

    expect(peas.length).toBe(2)
    expect(peas.map(v => v.name)).toEqual(['Pea 1', 'Pea 2'])
  })

  it('gets unique sorted suppliers', () => {
    const data = createValidVarietyData({
      varieties: [
        { id: 'v-1', plantId: 'peas', name: 'Pea 1', supplier: 'Supplier B', plannedYears: [], seedsByYear: {} },
        { id: 'v-2', plantId: 'beans', name: 'Bean 1', supplier: 'Supplier A', plannedYears: [], seedsByYear: {} },
        { id: 'v-3', plantId: 'carrots', name: 'Carrot 1', supplier: 'Supplier B', plannedYears: [], seedsByYear: {} },
        { id: 'v-4', plantId: 'onions', name: 'Onion 1', plannedYears: [], seedsByYear: {} },
      ],
    })

    const suppliers = getSuppliers(data)

    expect(suppliers).toEqual(['Supplier A', 'Supplier B'])
  })

  it('calculates total spend for year', () => {
    const data = createValidVarietyData({
      varieties: [
        { id: 'v-1', plantId: 'peas', name: 'Pea 1', price: 2.99, plannedYears: [2024], seedsByYear: {} },
        { id: 'v-2', plantId: 'beans', name: 'Bean 1', price: 3.50, plannedYears: [2024], seedsByYear: {} },
        { id: 'v-3', plantId: 'carrots', name: 'Carrot 1', price: 1.99, plannedYears: [2025], seedsByYear: {} },
        { id: 'v-4', plantId: 'onions', name: 'Onion 1', plannedYears: [2024], seedsByYear: {} },
      ],
    })

    const spend2024 = getTotalSpendForYear(data, 2024)
    const spend2025 = getTotalSpendForYear(data, 2025)

    expect(spend2024).toBeCloseTo(6.49)
    expect(spend2025).toBeCloseTo(1.99)
  })

  it('returns zero for year with no spending', () => {
    const data = createValidVarietyData()

    const spend = getTotalSpendForYear(data, 2024)

    expect(spend).toBe(0)
  })
})

describe('Create Empty Data', () => {
  it('creates valid empty structure', () => {
    const empty = createEmptyVarietyData()

    expect(empty.version).toBe(VARIETY_SCHEMA_VERSION)
    expect(empty.varieties).toEqual([])
    expect(empty.meta.createdAt).toBeDefined()
    expect(empty.meta.updatedAt).toBeDefined()
  })
})
