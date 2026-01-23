/**
 * Computed queries for variety usage from plantings data
 *
 * Instead of storing yearsUsed in StoredVariety, we compute it
 * dynamically from actual plantings in the allotment data.
 */

import type { AllotmentData, StoredVariety } from '@/types/unified-allotment'

/**
 * Normalize variety name for matching (trim, collapse whitespace, lowercase)
 */
export function normalizeVarietyName(name: string | undefined): string {
  if (!name) return ''
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
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
 * Get all varieties used or planned for a specific year
 *
 * Includes varieties that:
 * - Have plantings in the given year
 * - Have the year in their plannedYears array
 *
 * @param year - Year to filter by
 * @param allotmentData - Complete allotment data
 * @returns Array of varieties for that year
 */
export function getVarietiesForYear(
  year: number,
  allotmentData: AllotmentData
): StoredVariety[] {
  const matchingVarietyIds = new Set<string>()

  // Find the season for this year (may not exist for future planned years)
  const season = allotmentData.seasons.find(s => s.year === year)

  // Build a set of normalized (plantId, varietyName) keys from plantings in this year
  const plantingKeys = new Set<string>()
  if (season) {
    for (const area of season.areas) {
      for (const planting of area.plantings) {
        if (!planting.varietyName) continue
        const normalizedPlantingVarietyName = normalizeVarietyName(planting.varietyName)
        if (!normalizedPlantingVarietyName) continue
        const key = `${planting.plantId}::${normalizedPlantingVarietyName}`
        plantingKeys.add(key)
      }
    }
  }

  // Match varieties by plantings OR by plannedYears
  for (const variety of allotmentData.varieties) {
    // Check if planned for this year
    if (variety.plannedYears?.includes(year)) {
      matchingVarietyIds.add(variety.id)
      continue
    }

    // Check if used in plantings this year
    const normalizedVarietyName = normalizeVarietyName(variety.name)
    if (normalizedVarietyName) {
      const key = `${variety.plantId}::${normalizedVarietyName}`
      if (plantingKeys.has(key)) {
        matchingVarietyIds.add(variety.id)
      }
    }
  }

  // Return matching varieties
  return allotmentData.varieties.filter(v => matchingVarietyIds.has(v.id))
}
