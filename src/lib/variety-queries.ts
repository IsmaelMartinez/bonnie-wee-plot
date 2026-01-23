/**
 * Computed queries for variety usage from plantings data
 *
 * Instead of storing yearsUsed in StoredVariety, we compute it
 * dynamically from actual plantings in the allotment data.
 */

import type { AllotmentData, StoredVariety } from '@/types/unified-allotment'

/**
 * Normalize variety name for matching (trim, lowercase)
 */
export function normalizeVarietyName(name: string | undefined): string {
  if (!name) return ''
  return name.trim().toLowerCase()
}

/**
 * Get all years a variety was actually used (from plantings)
 *
 * Matches plantings by:
 * - plantId must match exactly
 * - varietyName must match (normalized: trim, lowercase)
 *
 * @param varietyId - ID of the variety to check
 * @param allotmentData - Complete allotment data
 * @returns Sorted array of unique years
 */
export function getVarietyUsedYears(
  varietyId: string,
  allotmentData: AllotmentData
): number[] {
  // Find the variety
  const variety = allotmentData.varieties.find(v => v.id === varietyId)
  if (!variety) return []

  const normalizedVarietyName = normalizeVarietyName(variety.name)
  const years = new Set<number>()

  // Scan all seasons for matching plantings
  for (const season of allotmentData.seasons) {
    for (const area of season.areas) {
      for (const planting of area.plantings) {
        // Match by plantId AND normalized varietyName
        if (
          planting.plantId === variety.plantId &&
          normalizeVarietyName(planting.varietyName) === normalizedVarietyName
        ) {
          years.add(season.year)
        }
      }
    }
  }

  return Array.from(years).sort((a, b) => a - b)
}

/**
 * Get all varieties used in a specific year (from plantings)
 *
 * @param year - Year to filter by
 * @param allotmentData - Complete allotment data
 * @returns Array of varieties used in that year
 */
export function getVarietiesForYear(
  year: number,
  allotmentData: AllotmentData
): StoredVariety[] {
  const usedVarietyIds = new Set<string>()

  // Find the season for this year
  const season = allotmentData.seasons.find(s => s.year === year)
  if (!season) return []

  // Collect all plantings for this year
  const plantingsInYear: Array<{ plantId: string; varietyName: string }> = []
  for (const area of season.areas) {
    for (const planting of area.plantings) {
      if (planting.varietyName) {
        plantingsInYear.push({
          plantId: planting.plantId,
          varietyName: planting.varietyName,
        })
      }
    }
  }

  // Match varieties to plantings
  for (const variety of allotmentData.varieties) {
    const normalizedVarietyName = normalizeVarietyName(variety.name)

    for (const planting of plantingsInYear) {
      if (
        planting.plantId === variety.plantId &&
        normalizeVarietyName(planting.varietyName) === normalizedVarietyName
      ) {
        usedVarietyIds.add(variety.id)
        break // Only add once per variety
      }
    }
  }

  // Return matching varieties
  return allotmentData.varieties.filter(v => usedVarietyIds.has(v.id))
}
