/**
 * Variety Storage Service
 *
 * Handles all localStorage operations for the variety/seed tracking data.
 */

import {
  VarietyData,
  StoredVariety,
  NewVariety,
  VarietyUpdate,
  StorageResult,
  SeedStatus,
  VARIETY_STORAGE_KEY,
  VARIETY_SCHEMA_VERSION,
} from '@/types/variety-data'
import { generateId } from '@/lib/utils/id'

// ============ CORE STORAGE OPERATIONS ============

/**
 * Load variety data from localStorage
 */
export function loadVarietyData(): StorageResult<VarietyData> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    const stored = localStorage.getItem(VARIETY_STORAGE_KEY)

    if (!stored) {
      return { success: false, error: 'No data found' }
    }

    let data: unknown
    try {
      data = JSON.parse(stored)
    } catch {
      return { success: false, error: 'Corrupted data: invalid JSON' }
    }

    if (!validateVarietyData(data)) {
      return { success: false, error: 'Invalid data schema' }
    }

    // Migrate seedsByYear from boolean to SeedStatus if needed
    const parsedData = data as VarietyData
    parsedData.varieties = parsedData.varieties.map(v => ({
      ...v,
      seedsByYear: migrateSeedsByYear(v.seedsByYear as Record<number, boolean | SeedStatus>)
    }))

    return { success: true, data: parsedData }
  } catch (error) {
    console.error('Failed to load variety data:', error)
    return { success: false, error: 'Failed to load stored data' }
  }
}

/**
 * Save variety data to localStorage
 */
export function saveVarietyData(data: VarietyData): StorageResult<void> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    const dataToSave: VarietyData = {
      ...data,
      meta: {
        ...data.meta,
        updatedAt: new Date().toISOString(),
      },
    }

    localStorage.setItem(VARIETY_STORAGE_KEY, JSON.stringify(dataToSave))
    return { success: true }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      return { success: false, error: 'Storage quota exceeded' }
    }
    console.error('Failed to save variety data:', error)
    return { success: false, error: 'Failed to save data' }
  }
}

/**
 * Initialize variety storage - load existing or create fresh
 */
export function initializeVarietyStorage(): StorageResult<VarietyData> {
  const loadResult = loadVarietyData()

  if (loadResult.success && loadResult.data) {
    return loadResult
  }

  const freshData = createEmptyVarietyData()
  const saveResult = saveVarietyData(freshData)

  if (!saveResult.success) {
    return { success: false, error: 'Failed to save initial data' }
  }

  return { success: true, data: freshData }
}

/**
 * Create an empty VarietyData structure
 */
export function createEmptyVarietyData(): VarietyData {
  const now = new Date().toISOString()
  return {
    version: VARIETY_SCHEMA_VERSION,
    varieties: [],
    meta: {
      createdAt: now,
      updatedAt: now,
    },
  }
}

// ============ CRUD OPERATIONS ============

/**
 * Add a new variety
 */
export function addVariety(data: VarietyData, variety: NewVariety): VarietyData {
  const newVariety: StoredVariety = {
    id: generateId('variety'),
    plantId: variety.plantId,
    name: variety.name,
    supplier: variety.supplier,
    price: variety.price,
    notes: variety.notes,
    yearsUsed: [],
    plannedYears: variety.plannedYears || [],
    seedsByYear: {},  // Initialize empty - user will mark seeds per year
  }

  return {
    ...data,
    varieties: [...data.varieties, newVariety],
  }
}

/**
 * Update an existing variety
 */
export function updateVariety(
  data: VarietyData,
  id: string,
  updates: VarietyUpdate
): VarietyData {
  return {
    ...data,
    varieties: data.varieties.map(v =>
      v.id === id ? { ...v, ...updates } : v
    ),
  }
}

/**
 * Remove a variety
 */
export function removeVariety(data: VarietyData, id: string): VarietyData {
  return {
    ...data,
    varieties: data.varieties.filter(v => v.id !== id),
  }
}

// ============ YEAR PLANNING ============

/**
 * Toggle whether a variety is planned for a specific year
 */
export function togglePlannedYear(
  data: VarietyData,
  varietyId: string,
  year: number
): VarietyData {
  return {
    ...data,
    varieties: data.varieties.map(v => {
      if (v.id !== varietyId) return v

      const hasYear = v.plannedYears.includes(year)
      return {
        ...v,
        plannedYears: hasYear
          ? v.plannedYears.filter(y => y !== year)
          : [...v.plannedYears, year].sort((a, b) => a - b),
      }
    }),
  }
}

/**
 * Get varieties planned for a specific year (either used or planned)
 */
export function getVarietiesForYear(data: VarietyData, year: number): StoredVariety[] {
  return data.varieties.filter(
    v => v.yearsUsed.includes(year) || v.plannedYears.includes(year)
  )
}

// ============ HAVE SEEDS (PER-YEAR) ============

/**
 * Cycle seed status for a variety in a specific year
 * Cycles: none → ordered → have → none
 */
export function toggleHaveSeedsForYear(
  data: VarietyData,
  varietyId: string,
  year: number
): VarietyData {
  return {
    ...data,
    varieties: data.varieties.map(v => {
      if (v.id !== varietyId) return v

      const current = v.seedsByYear[year] || 'none'

      // Cycle to next state
      const next: Record<SeedStatus, SeedStatus> = {
        'none': 'ordered',
        'ordered': 'have',
        'have': 'none'
      }

      const nextState = next[current]

      // Remove entry when cycling back to 'none'
      if (nextState === 'none') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [year]: _, ...rest } = v.seedsByYear
        return { ...v, seedsByYear: rest }
      }

      return {
        ...v,
        seedsByYear: { ...v.seedsByYear, [year]: nextState }
      }
    }),
  }
}

/**
 * Check if user has seeds for a variety in a specific year
 * Returns true ONLY for 'have' status
 */
export function hasSeedsForYear(variety: StoredVariety, year: number): boolean {
  return variety.seedsByYear?.[year] === 'have'
}

/**
 * Check if variety needs seeds for a specific year
 * Returns true for 'none' or 'ordered' status
 */
export function needsSeedsForYear(variety: StoredVariety, year: number): boolean {
  const status = variety.seedsByYear?.[year] || 'none'
  return status === 'none' || status === 'ordered'
}

/**
 * Get varieties that have seeds for a specific year
 */
export function getVarietiesWithSeedsForYear(data: VarietyData, year: number): StoredVariety[] {
  return data.varieties.filter(v => hasSeedsForYear(v, year))
}

/**
 * Get varieties that need seeds for a specific year
 * (planned or used but don't have seeds)
 */
export function getVarietiesNeedingSeedsForYear(data: VarietyData, year: number): StoredVariety[] {
  return data.varieties.filter(v =>
    (v.plannedYears.includes(year) || v.yearsUsed.includes(year)) &&
    needsSeedsForYear(v, year)
  )
}

// ============ QUERIES ============

/**
 * Get varieties for a specific vegetable
 */
export function getVarietiesByVegetable(
  data: VarietyData,
  plantId: string
): StoredVariety[] {
  return data.varieties.filter(v => v.plantId === plantId)
}

/**
 * Get unique list of suppliers
 */
export function getSuppliers(data: VarietyData): string[] {
  const suppliers = data.varieties
    .map(v => v.supplier)
    .filter((s): s is string => s !== undefined)
  return [...new Set(suppliers)].sort()
}

/**
 * Calculate total spend for varieties used or planned in a specific year
 */
export function getTotalSpendForYear(data: VarietyData, year: number): number {
  return data.varieties
    .filter(v =>
      (v.yearsUsed.includes(year) || v.plannedYears.includes(year)) &&
      v.price !== undefined
    )
    .reduce((sum, v) => sum + (v.price || 0), 0)
}

// ============ VALIDATION ============

/**
 * Migrate seedsByYear from boolean to SeedStatus
 * Handles backward compatibility with old data format
 * Note: 'none' status is represented by absence in the record
 */
function migrateSeedsByYear(
  seedsByYear: Record<number, boolean | SeedStatus>
): Record<number, SeedStatus> {
  const migrated: Record<number, SeedStatus> = {}

  for (const [year, value] of Object.entries(seedsByYear)) {
    if (typeof value === 'boolean') {
      // Only keep 'have' status, discard false values (represented by absence)
      if (value) {
        migrated[parseInt(year)] = 'have'
      }
    } else if (value !== 'none') {
      // Keep existing SeedStatus values, but remove 'none' entries
      migrated[parseInt(year)] = value
    }
  }

  return migrated
}

/**
 * Validate that data conforms to VarietyData schema
 */
function validateVarietyData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  if (typeof obj.version !== 'number') return false
  if (!Array.isArray(obj.varieties)) return false
  if (!obj.meta || typeof obj.meta !== 'object') return false

  const meta = obj.meta as Record<string, unknown>
  if (typeof meta.createdAt !== 'string') return false
  if (typeof meta.updatedAt !== 'string') return false

  return true
}

/**
 * Check if error is a quota exceeded error
 */
function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    if (error.code === 22 || error.name === 'QuotaExceededError') return true
    if (error.code === 1014 || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') return true
  }
  return false
}

