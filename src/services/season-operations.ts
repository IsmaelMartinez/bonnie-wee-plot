/**
 * Season Operations
 *
 * CRUD operations for seasons/years within AllotmentData.
 */

import {
  AllotmentData,
  SeasonRecord,
  AreaSeason,
  NewSeasonInput,
} from '@/types/unified-allotment'
import { RotationGroup } from '@/types/garden-planner'
import { getNextRotationGroup } from '@/lib/rotation'
import { logger } from '@/lib/logger'

/**
 * Get all available years from the data
 */
export function getAvailableYears(data: AllotmentData): number[] {
  return data.seasons
    .map(s => s.year)
    .sort((a, b) => b - a) // Descending (most recent first)
}

/**
 * Get a specific season by year
 */
export function getSeasonByYear(data: AllotmentData, year: number): SeasonRecord | undefined {
  return data.seasons.find(s => s.year === year)
}

/**
 * Get the current season
 */
export function getCurrentSeason(data: AllotmentData): SeasonRecord | undefined {
  return getSeasonByYear(data, data.currentYear)
}

/**
 * Ensure data has the current year as active with a season
 * Used when loading data with a stale currentYear
 */
export function ensureCurrentYearSeason(data: AllotmentData, targetYear: number): AllotmentData {
  // Check if season already exists for the target year
  const existingSeason = data.seasons.find(s => s.year === targetYear)

  if (existingSeason) {
    // Season exists, just update currentYear
    return {
      ...data,
      currentYear: targetYear,
    }
  }

  // Need to create a new season for the target year
  // Use addSeason which handles auto-rotation
  return addSeason(data, {
    year: targetYear,
    status: 'current',
    notes: `Season ${targetYear}`,
  })
}

/**
 * Add a new season
 * Automatically rotates beds based on previous year's rotation groups
 * v10: Creates AreaSeason for all areas
 */
export function addSeason(data: AllotmentData, input: NewSeasonInput): AllotmentData {
  const now = new Date().toISOString()

  // Find previous year's season for auto-rotation and position copying
  const previousYear = input.year - 1
  const previousSeason = data.seasons.find(s => s.year === previousYear)

  // Create AreaSeason for all areas
  const areaSeasons: AreaSeason[] = (data.layout.areas || [])
    .filter(area => !area.isArchived) // Don't create seasons for archived areas
    .map(area => {
      // For rotation beds, auto-rotate based on previous year
      let rotationGroup: RotationGroup | undefined
      if (area.kind === 'rotation-bed') {
        const previousAreaSeason = previousSeason?.areas?.find(a => a.areaId === area.id)
        rotationGroup = previousAreaSeason?.rotationGroup
          ? getNextRotationGroup(previousAreaSeason.rotationGroup)
          : area.rotationGroup || 'legumes'

        logger.debug('Auto-rotate area', {
          areaId: area.id,
          year: input.year,
          previousYear,
          previousRotation: previousAreaSeason?.rotationGroup,
          newRotation: rotationGroup,
          rotated: !!previousAreaSeason?.rotationGroup
        })
      }

      // Copy grid position from previous year's AreaSeason, fallback to Area default
      const previousAreaSeason = previousSeason?.areas?.find(a => a.areaId === area.id)
      const gridPosition = previousAreaSeason?.gridPosition ?? area.gridPosition

      return {
        areaId: area.id,
        rotationGroup,
        plantings: [],
        gridPosition,
      }
    })

  const newSeason: SeasonRecord = {
    year: input.year,
    status: input.status || 'planned',
    areas: areaSeasons,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...data,
    seasons: [...data.seasons, newSeason],
    currentYear: input.year, // Switch to the new season
  }
}

/**
 * Remove a season by year
 * Cannot remove if it's the only season
 */
export function removeSeason(data: AllotmentData, year: number): AllotmentData {
  // Don't allow removing the last season
  if (data.seasons.length <= 1) {
    return data
  }

  // Use Number() to handle potential string/number type mismatch from JSON import
  const yearNum = Number(year)
  const filteredSeasons = data.seasons.filter(s => Number(s.year) !== yearNum)

  // If we removed the current year, switch to the most recent remaining year
  let newCurrentYear = data.currentYear
  if (Number(data.currentYear) === yearNum) {
    const years = filteredSeasons.map(s => Number(s.year)).sort((a, b) => b - a)
    newCurrentYear = years[0]
  }

  return {
    ...data,
    seasons: filteredSeasons,
    currentYear: newCurrentYear,
  }
}

/**
 * Update a season's metadata (notes, status)
 */
export function updateSeason(
  data: AllotmentData,
  year: number,
  updates: Partial<Pick<SeasonRecord, 'notes' | 'status'>>
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(s =>
      s.year === year
        ? { ...s, ...updates, updatedAt: new Date().toISOString() }
        : s
    ),
  }
}

/**
 * Set the current year
 */
export function setCurrentYear(data: AllotmentData, year: number): AllotmentData {
  return {
    ...data,
    currentYear: year,
  }
}
