/**
 * Variety Storage Service
 *
 * Handles all localStorage operations for the variety/seed tracking data.
 * Follows the same patterns as allotment-storage.ts.
 */

import {
  VarietyData,
  StoredVariety,
  NewVariety,
  VarietyUpdate,
  StorageResult,
  VARIETY_STORAGE_KEY,
  VARIETY_SCHEMA_VERSION,
} from '@/types/variety-data'
import { generateId } from '@/lib/utils/id'
import { myVarieties } from '@/data/my-varieties'

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

    return { success: true, data: data as VarietyData }
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
 * Initialize variety storage with migration from legacy data if needed
 */
export function initializeVarietyStorage(): StorageResult<VarietyData> {
  const loadResult = loadVarietyData()

  if (loadResult.success && loadResult.data) {
    return loadResult
  }

  // No existing data - check for legacy migration
  if (needsLegacyMigration()) {
    const migratedData = migrateFromLegacy()
    const saveResult = saveVarietyData(migratedData)

    if (!saveResult.success) {
      return { success: false, error: 'Failed to save migrated data' }
    }

    return { success: true, data: migratedData }
  }

  // No legacy data either - create fresh
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
    haveSeeds: [],
    meta: {
      createdAt: now,
      updatedAt: now,
    },
  }
}

/**
 * Check if migration from legacy my-varieties.ts is needed
 */
export function needsLegacyMigration(): boolean {
  // Legacy data exists if myVarieties has entries
  return myVarieties.length > 0
}

/**
 * Migrate from legacy my-varieties.ts data
 * Also imports existing haveSeeds from old localStorage key
 */
export function migrateFromLegacy(): VarietyData {
  const now = new Date().toISOString()

  const varieties: StoredVariety[] = myVarieties.map(legacy => ({
    id: legacy.id,
    vegetableId: legacy.vegetableId,
    name: legacy.name,
    supplier: legacy.supplier,
    price: legacy.price,
    notes: legacy.notes,
    yearsUsed: legacy.yearsUsed,
    plannedYears: [],
  }))

  // Import existing haveSeeds from old storage key
  let haveSeeds: string[] = []
  try {
    const oldHaveSeeds = localStorage.getItem('community-allotment-seeds-have')
    if (oldHaveSeeds) {
      const parsed = JSON.parse(oldHaveSeeds)
      if (Array.isArray(parsed)) {
        // Only keep IDs that exist in our varieties
        const validIds = new Set(varieties.map(v => v.id))
        haveSeeds = parsed.filter((id): id is string =>
          typeof id === 'string' && validIds.has(id)
        )
      }
    }
  } catch {
    // Ignore errors, start with empty haveSeeds
  }

  return {
    version: VARIETY_SCHEMA_VERSION,
    varieties,
    haveSeeds,
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
    vegetableId: variety.vegetableId,
    name: variety.name,
    supplier: variety.supplier,
    price: variety.price,
    notes: variety.notes,
    yearsUsed: [],
    plannedYears: variety.plannedYears || [],
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
    haveSeeds: data.haveSeeds.filter(seedId => seedId !== id),
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

// ============ HAVE SEEDS ============

/**
 * Toggle whether user has seeds for a variety
 */
export function toggleHaveSeeds(data: VarietyData, varietyId: string): VarietyData {
  const hasSeeds = data.haveSeeds.includes(varietyId)
  return {
    ...data,
    haveSeeds: hasSeeds
      ? data.haveSeeds.filter(id => id !== varietyId)
      : [...data.haveSeeds, varietyId],
  }
}

// ============ QUERIES ============

/**
 * Get varieties for a specific vegetable
 */
export function getVarietiesByVegetable(
  data: VarietyData,
  vegetableId: string
): StoredVariety[] {
  return data.varieties.filter(v => v.vegetableId === vegetableId)
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
 * Calculate total spend for varieties used in a specific year
 */
export function getTotalSpendForYear(data: VarietyData, year: number): number {
  return data.varieties
    .filter(v => v.yearsUsed.includes(year) && v.price !== undefined)
    .reduce((sum, v) => sum + (v.price || 0), 0)
}

// ============ VALIDATION ============

/**
 * Validate that data conforms to VarietyData schema
 */
function validateVarietyData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  if (typeof obj.version !== 'number') return false
  if (!Array.isArray(obj.varieties)) return false
  if (!Array.isArray(obj.haveSeeds)) return false
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
