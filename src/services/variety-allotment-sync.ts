/**
 * Variety-Allotment Sync Service
 *
 * Handles automatic synchronization from allotment plantings to seed varieties.
 * This is a one-way sync: plantings → varieties.
 *
 * When a planting is added in the allotment:
 * - If a matching variety exists, adds the year to its plannedYears
 * - If no matching variety exists, creates a new one
 * - Matching is done by plantId + normalized variety name
 */

import type { VarietyData, StoredVariety } from '@/types/variety-data'
import type { Planting } from '@/types/unified-allotment'
import { loadVarietyData, saveVarietyData } from './variety-storage'
import { generateId } from '@/lib/utils/id'

/**
 * Normalize variety name for matching
 * - Case-insensitive
 * - Whitespace normalized (trim + collapse multiple spaces)
 */
function normalizeVarietyName(name: string | undefined): string {
  if (!name) return ''
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Find a variety that matches the planting
 * Match criteria: plantId + normalized variety name
 */
function findMatchingVariety(
  data: VarietyData,
  planting: Planting
): StoredVariety | undefined {
  const normalizedPlantingName = normalizeVarietyName(planting.varietyName)
  if (!normalizedPlantingName) return undefined

  return data.varieties.find(
    v =>
      v.plantId === planting.plantId &&
      normalizeVarietyName(v.name) === normalizedPlantingName
  )
}

/**
 * Ensure a year is in a variety's plannedYears array
 * Avoids duplicates and respects historical records
 */
function ensureYearInPlannedYears(
  data: VarietyData,
  varietyId: string,
  year: number
): VarietyData {
  return {
    ...data,
    varieties: data.varieties.map(v => {
      if (v.id !== varietyId) return v

      // Don't add if already in plannedYears or yearsUsed
      if (v.plannedYears.includes(year) || v.yearsUsed.includes(year)) {
        return v
      }

      return {
        ...v,
        plannedYears: [...v.plannedYears, year].sort(),
      }
    }),
  }
}

/**
 * Create a new variety from a planting
 */
function createVarietyFromPlanting(
  data: VarietyData,
  planting: Planting,
  year: number
): VarietyData {
  const newVariety: StoredVariety = {
    id: generateId('variety'),
    plantId: planting.plantId,
    name: planting.varietyName!,
    supplier: undefined,
    price: undefined,
    notes: '(Auto-created from allotment planting)',
    yearsUsed: [],
    plannedYears: [year],
    seedsByYear: {},  // Initialize empty
  }

  return {
    ...data,
    varieties: [...data.varieties, newVariety],
  }
}

/**
 * Sync a planting to the variety database
 * Main entry point for the sync operation
 *
 * This function is called when a planting is added to the allotment.
 * It automatically updates or creates the corresponding variety record.
 *
 * @param planting The planting that was added
 * @param year The year the planting was added for
 */
export function syncPlantingToVariety(planting: Planting, year: number): void {
  // Skip if no variety name
  if (!planting.varietyName || !normalizeVarietyName(planting.varietyName)) {
    return
  }

  try {
    const loadResult = loadVarietyData()
    if (!loadResult.success || !loadResult.data) {
      console.error('Failed to load variety data for sync')
      return
    }

    let updatedData = loadResult.data
    const matchingVariety = findMatchingVariety(updatedData, planting)

    if (matchingVariety) {
      // Add year to existing variety
      updatedData = ensureYearInPlannedYears(
        updatedData,
        matchingVariety.id,
        year
      )
    } else {
      // Create new variety
      updatedData = createVarietyFromPlanting(updatedData, planting, year)
    }

    const saveResult = saveVarietyData(updatedData)
    if (!saveResult.success) {
      console.error('Failed to save variety data after sync')
    }
  } catch (error) {
    console.error('Unexpected error in variety sync:', error)
  }
}
