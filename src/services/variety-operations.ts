/**
 * Variety Operations
 *
 * CRUD operations for seed varieties within AllotmentData.
 */

import {
  AllotmentData,
  StoredVariety,
  NewVariety,
  VarietyUpdate,
  SeedStatus,
} from '@/types/unified-allotment'
import { generateId } from '@/lib/utils'
import {
  getVarietyUsedYears,
  getVarietiesForYear as getVarietiesForYearComputed,
} from '@/lib/variety-queries'

/**
 * Generate a unique ID for a variety
 */
export function generateVarietyId(): string {
  return generateId('variety')
}

/**
 * Get all varieties
 */
export function getVarieties(data: AllotmentData): StoredVariety[] {
  return data.varieties || []
}

/**
 * Get a variety by ID
 */
export function getVarietyById(data: AllotmentData, id: string): StoredVariety | undefined {
  return data.varieties?.find(v => v.id === id)
}

/**
 * Get varieties for a specific vegetable/plant
 */
export function getVarietiesByPlant(data: AllotmentData, plantId: string): StoredVariety[] {
  return (data.varieties || []).filter(v => v.plantId === plantId)
}

/**
 * Add a new variety
 */
export function addVariety(data: AllotmentData, variety: NewVariety): AllotmentData {
  const newVariety: StoredVariety = {
    id: generateVarietyId(),
    plantId: variety.plantId,
    name: variety.name,
    supplier: variety.supplier,
    price: variety.price,
    notes: variety.notes,
    seedsByYear: variety.seedsByYear || {},
  }

  return {
    ...data,
    varieties: [...(data.varieties || []), newVariety],
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Update an existing variety
 */
export function updateVariety(
  data: AllotmentData,
  id: string,
  updates: VarietyUpdate
): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v =>
      v.id === id ? { ...v, ...updates } : v
    ),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Remove a variety
 */
export function removeVariety(data: AllotmentData, id: string): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).filter(v => v.id !== id),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Archive a variety (soft delete)
 * Preserves planting references while hiding from UI
 */
export function archiveVariety(data: AllotmentData, id: string): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v =>
      v.id === id ? { ...v, isArchived: true } : v
    ),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Unarchive a variety (restore from archive)
 */
export function unarchiveVariety(data: AllotmentData, id: string): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v =>
      v.id === id ? { ...v, isArchived: false } : v
    ),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Get active (non-archived) varieties
 * @param includeArchived - if true, returns all varieties including archived
 */
export function getActiveVarieties(
  data: AllotmentData,
  includeArchived = false
): StoredVariety[] {
  const varieties = data.varieties || []
  if (includeArchived) {
    return varieties
  }
  return varieties.filter(v => !v.isArchived)
}

/**
 * Cycle seed status for a variety in a specific year
 * Cycles: none -> ordered -> have -> had -> none
 * Note: 'none' status is kept in seedsByYear to maintain year tracking
 */
export function toggleHaveSeedsForYear(
  data: AllotmentData,
  varietyId: string,
  year: number
): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v => {
      if (v.id !== varietyId) return v

      const current = v.seedsByYear[year] || 'none'
      const next: Record<SeedStatus, SeedStatus> = {
        'none': 'ordered',
        'ordered': 'have',
        'have': 'had',
        'had': 'none'
      }
      const nextState = next[current]

      return {
        ...v,
        seedsByYear: { ...v.seedsByYear, [year]: nextState }
      }
    }),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Remove a variety from a specific year's tracking
 */
export function removeVarietyFromYear(
  data: AllotmentData,
  varietyId: string,
  year: number
): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v => {
      if (v.id !== varietyId) return v

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [year]: _, ...rest } = v.seedsByYear
      return { ...v, seedsByYear: rest }
    }),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Add a variety to a specific year with initial status
 */
export function addVarietyToYear(
  data: AllotmentData,
  varietyId: string,
  year: number,
  status: SeedStatus = 'none'
): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v => {
      if (v.id !== varietyId) return v

      return {
        ...v,
        seedsByYear: { ...v.seedsByYear, [year]: status }
      }
    }),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Check if user has seeds for a variety in a specific year
 */
export function hasSeedsForYear(variety: StoredVariety, year: number): boolean {
  return variety.seedsByYear?.[year] === 'have'
}

/**
 * Get varieties planned or used for a specific year
 */
export function getVarietiesForYear(data: AllotmentData, year: number): StoredVariety[] {
  // Use computed query instead of yearsUsed field
  return getVarietiesForYearComputed(year, data)
}

/**
 * Get unique list of suppliers
 */
export function getSuppliers(data: AllotmentData): string[] {
  const suppliers = (data.varieties || [])
    .map(v => v.supplier)
    .filter((s): s is string => s !== undefined)
  return [...new Set(suppliers)].sort()
}

/**
 * Calculate total spend for varieties used or planned in a specific year
 */
export function getTotalSpendForYear(data: AllotmentData, year: number): number {
  const varietiesForYear = getVarietiesForYearComputed(year, data)
  return varietiesForYear
    .filter(v => v.price !== undefined)
    .reduce((sum, v) => sum + (v.price || 0), 0)
}

/**
 * Get all years that have variety data (used or tracked via seedsByYear)
 */
export function getAvailableVarietyYears(data: AllotmentData): number[] {
  const years = new Set<number>()

  // Collect years from all varieties
  for (const variety of data.varieties || []) {
    // Years where the variety is actually used in plantings
    const usedYears = getVarietyUsedYears(variety.id, data)
    usedYears.forEach(y => years.add(y))

    // Years that appear in seed status data (indicates planning/tracking)
    const seedsByYear = variety.seedsByYear || {}
    for (const yearKey of Object.keys(seedsByYear)) {
      const yearNum = Number(yearKey)
      if (!Number.isNaN(yearNum)) {
        years.add(yearNum)
      }
    }
  }

  return [...years].sort((a, b) => b - a)
}

/**
 * Get seed stats for a specific year
 */
export function getSeedsStatsForYear(
  data: AllotmentData,
  year: number
): { total: number; have: number; ordered: number; none: number } {
  const varieties = getVarietiesForYear(data, year)
  let have = 0
  let ordered = 0
  let none = 0

  for (const v of varieties) {
    const status = v.seedsByYear[year] || 'none'
    if (status === 'have') have++
    else if (status === 'ordered') ordered++
    else none++
  }

  return { total: varieties.length, have, ordered, none }
}
