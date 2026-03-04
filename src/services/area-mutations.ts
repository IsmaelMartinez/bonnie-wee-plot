/**
 * Area Mutations
 *
 * CRUD operations for areas in the layout, care log operations,
 * harvest tracking, and area temporal filtering.
 */

import {
  AllotmentData,
  AreaSeason,
  Area,
  CareLogEntry,
  NewCareLogEntry,
} from '@/types/unified-allotment'
import { generateId, generateSlugId } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { getAreaById, getAllAreas } from './area-queries'
import { getAreaSeason } from './planting-operations'

// ============ UNIFIED AREA CRUD OPERATIONS (v10) ============

/**
 * Add a new area to the unified areas array
 */
export function addArea(
  data: AllotmentData,
  area: Omit<Area, 'id'>
): { data: AllotmentData; areaId: string } {
  const now = new Date().toISOString()
  // Generate ID from the area name (e.g., "Bed A" -> "bed-a")
  const existingIds = new Set(data.layout.areas?.map(a => a.id) || [])
  const id = generateSlugId(area.name, existingIds)
  const newArea: Area = {
    ...area,
    id,
    createdAt: now,
    // Keep createdYear as undefined if not specified - means area exists in all years
    createdYear: area.createdYear
  }

  const areas = data.layout.areas || []

  // Backfill AreaSeason ONLY to years where area should exist
  const updatedSeasons = data.seasons.map(season => {
    // Check if area should exist in this season
    const shouldExist = wasAreaActiveInYear(newArea, season.year)

    if (!shouldExist) {
      logger.debug('addArea: Skipping season backfill', {
        areaId: id,
        areaName: newArea.name,
        seasonYear: season.year,
        createdYear: newArea.createdYear,
        retiredYear: newArea.retiredYear,
      })
      return season
    }

    logger.debug('addArea: Backfilling season', {
      areaId: id,
      areaName: newArea.name,
      seasonYear: season.year
    })

    const newAreaSeason: AreaSeason = {
      areaId: id,
      rotationGroup: newArea.kind === 'rotation-bed' ? (newArea.rotationGroup || 'legumes') : undefined,
      plantings: [],
      notes: [],
    }

    return {
      ...season,
      areas: [...(season.areas || []), newAreaSeason],
      updatedAt: now,
    }
  })

  return {
    data: {
      ...data,
      layout: {
        ...data.layout,
        areas: [...areas, newArea],
      },
      seasons: updatedSeasons,
      meta: { ...data.meta, updatedAt: now },
    },
    areaId: id,
  }
}

/**
 * Update an existing area
 */
export function updateArea(
  data: AllotmentData,
  areaId: string,
  updates: Partial<Omit<Area, 'id'>>
): AllotmentData {
  const areas = data.layout.areas || []
  const areaIndex = areas.findIndex(a => a.id === areaId)

  if (areaIndex === -1) {
    return data
  }

  const updatedArea = { ...areas[areaIndex], ...updates }
  const newAreas = [...areas]
  newAreas[areaIndex] = updatedArea

  return {
    ...data,
    layout: {
      ...data.layout,
      areas: newAreas,
    },
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Archive an area (soft delete)
 * Preserves the area in data but marks it as archived
 */
export function archiveArea(data: AllotmentData, areaId: string): AllotmentData {
  return updateArea(data, areaId, { isArchived: true })
}

/**
 * Restore an archived area
 */
export function restoreArea(data: AllotmentData, areaId: string): AllotmentData {
  return updateArea(data, areaId, { isArchived: false })
}

/**
 * Remove an area from the unified areas array (hard delete)
 * Also removes any associated season data for this area
 */
export function removeArea(data: AllotmentData, areaId: string): AllotmentData {
  const areas = data.layout.areas || []

  // Remove area seasons for this area from all seasons
  const updatedSeasons = data.seasons.map(season => ({
    ...season,
    areas: season.areas.filter(a => a.areaId !== areaId),
  }))

  // Remove maintenance tasks for this area
  const updatedTasks = (data.maintenanceTasks || []).filter(t => t.areaId !== areaId)

  return {
    ...data,
    layout: {
      ...data.layout,
      areas: areas.filter(a => a.id !== areaId),
    },
    seasons: updatedSeasons,
    maintenanceTasks: updatedTasks,
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

// ============ CARE LOG CRUD OPERATIONS (v10) ============

/**
 * Add a care log entry for any area
 * Care logs are now stored in AreaSeason.careLogs
 */
export function addCareLogEntry(
  data: AllotmentData,
  year: number,
  areaId: string,
  entry: NewCareLogEntry
): { data: AllotmentData; entryId: string } {
  const now = new Date().toISOString()
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return { data, entryId: '' }
  }

  const id = generateId()
  const newEntry: CareLogEntry = { ...entry, id }

  const season = data.seasons[seasonIndex]
  const areas = season.areas || []
  const areaIndex = areas.findIndex(a => a.areaId === areaId)

  let updatedAreas: AreaSeason[]

  if (areaIndex === -1) {
    // Create new area season entry
    updatedAreas = [
      ...areas,
      {
        areaId,
        plantings: [],
        careLogs: [newEntry],
      },
    ]
  } else {
    // Add to existing area season
    updatedAreas = [...areas]
    updatedAreas[areaIndex] = {
      ...areas[areaIndex],
      careLogs: [...(areas[areaIndex].careLogs || []), newEntry],
    }
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    areas: updatedAreas,
    updatedAt: now,
  }

  return {
    data: {
      ...data,
      seasons: updatedSeasons,
      meta: { ...data.meta, updatedAt: now },
    },
    entryId: id,
  }
}

/**
 * Update a care log entry
 */
export function updateCareLogEntry(
  data: AllotmentData,
  year: number,
  areaId: string,
  entryId: string,
  updates: Partial<Omit<CareLogEntry, 'id'>>
): AllotmentData {
  const now = new Date().toISOString()
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return data
  }

  const season = data.seasons[seasonIndex]
  const areas = season.areas || []
  const areaIndex = areas.findIndex(a => a.areaId === areaId)

  if (areaIndex === -1) {
    return data
  }

  const careLogs = areas[areaIndex].careLogs || []
  const logIndex = careLogs.findIndex(l => l.id === entryId)

  if (logIndex === -1) {
    return data
  }

  const updatedLogs = [...careLogs]
  updatedLogs[logIndex] = { ...careLogs[logIndex], ...updates }

  const updatedAreas = [...areas]
  updatedAreas[areaIndex] = {
    ...areas[areaIndex],
    careLogs: updatedLogs,
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    areas: updatedAreas,
    updatedAt: now,
  }

  return {
    ...data,
    seasons: updatedSeasons,
    meta: { ...data.meta, updatedAt: now },
  }
}

/**
 * Remove a care log entry
 */
export function removeCareLogEntry(
  data: AllotmentData,
  year: number,
  areaId: string,
  entryId: string
): AllotmentData {
  const now = new Date().toISOString()
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return data
  }

  const season = data.seasons[seasonIndex]
  const areas = season.areas || []
  const areaIndex = areas.findIndex(a => a.areaId === areaId)

  if (areaIndex === -1) {
    return data
  }

  const updatedAreas = [...areas]
  updatedAreas[areaIndex] = {
    ...areas[areaIndex],
    careLogs: (areas[areaIndex].careLogs || []).filter(l => l.id !== entryId),
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    areas: updatedAreas,
    updatedAt: now,
  }

  return {
    ...data,
    seasons: updatedSeasons,
    meta: { ...data.meta, updatedAt: now },
  }
}

/**
 * Get care logs for an area in a specific year
 */
export function getCareLogsForArea(
  data: AllotmentData,
  year: number,
  areaId: string
): CareLogEntry[] {
  const areaSeason = getAreaSeason(data, year, areaId)
  return areaSeason?.careLogs || []
}

/**
 * Get all care logs for an area across all years
 */
export function getAllCareLogsForArea(
  data: AllotmentData,
  areaId: string
): Array<{ year: number; entry: CareLogEntry }> {
  const result: Array<{ year: number; entry: CareLogEntry }> = []

  for (const season of data.seasons) {
    const areaSeason = season.areas.find(a => a.areaId === areaId)
    if (areaSeason?.careLogs) {
      for (const entry of areaSeason.careLogs) {
        result.push({ year: season.year, entry })
      }
    }
  }

  return result.sort((a, b) => new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime())
}

/**
 * Log a harvest for any area (convenience function)
 */
export function logHarvest(
  data: AllotmentData,
  year: number,
  areaId: string,
  quantity: number,
  unit: string,
  date?: string
): { data: AllotmentData; entryId: string } {
  return addCareLogEntry(data, year, areaId, {
    type: 'harvest',
    date: date || new Date().toISOString().split('T')[0],
    quantity,
    unit,
  })
}

/**
 * Get total harvest for an area in a specific year
 */
export function getHarvestTotal(
  data: AllotmentData,
  year: number,
  areaId: string
): { quantity: number; unit: string } | null {
  const careLogs = getCareLogsForArea(data, year, areaId)
  const harvests = careLogs.filter(l => l.type === 'harvest' && l.quantity !== undefined)

  if (harvests.length === 0) {
    return null
  }

  // Assume all harvests use the same unit (use first unit found)
  const unit = harvests[0].unit || 'units'
  const total = harvests.reduce((sum, h) => sum + (h.quantity || 0), 0)

  return { quantity: total, unit }
}

/**
 * Update the harvest total for an area in a specific year
 * Sets the aggregated harvest values in AreaSeason
 */
export function updateAreaHarvestTotal(
  data: AllotmentData,
  year: number,
  areaId: string,
  quantity: number,
  unit: string
): AllotmentData {
  const now = new Date().toISOString()
  const seasonIndex = data.seasons.findIndex(s => s.year === year)
  if (seasonIndex === -1) return data

  const season = data.seasons[seasonIndex]
  const areas = season.areas || []
  const areaIndex = areas.findIndex(a => a.areaId === areaId)

  let updatedAreas: AreaSeason[]
  if (areaIndex === -1) {
    updatedAreas = [...areas, { areaId, plantings: [], harvestTotal: quantity, harvestUnit: unit }]
  } else {
    updatedAreas = [...areas]
    updatedAreas[areaIndex] = { ...areas[areaIndex], harvestTotal: quantity, harvestUnit: unit }
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = { ...season, areas: updatedAreas, updatedAt: now }

  return { ...data, seasons: updatedSeasons, meta: { ...data.meta, updatedAt: now } }
}

// ============ AREA TEMPORAL FILTERING ============

/**
 * Check if an area was active/existed in a specific year
 *
 * This function only checks temporal metadata (createdYear/retiredYear/activeYears).
 * It does NOT check isArchived - that filtering is handled by getAllAreas().
 *
 * @param area - The area to check
 * @param year - The year to check
 * @returns true if area existed in that year (based on temporal metadata only)
 */
export function wasAreaActiveInYear(area: Area, year: number): boolean {
  // Validate inputs
  if (!area || typeof area !== 'object') {
    logger.error('wasAreaActiveInYear called with invalid area', { area })
    return false
  }

  if (typeof year !== 'number' || !Number.isFinite(year) || !Number.isInteger(year)) {
    logger.error('wasAreaActiveInYear called with invalid year', {
      year,
      areaId: area.id,
      areaName: area.name
    })
    return false
  }

  // Backward compatibility: if no temporal metadata, assume always existed
  if (!area.createdYear && !area.retiredYear && !area.activeYears) {
    return true
  }

  // Explicit activeYears list takes precedence (handles edge cases)
  if (area.activeYears && area.activeYears.length > 0) {
    return area.activeYears.includes(year)
  }

  // Use createdYear/retiredYear range
  const created = area.createdYear || 0  // undefined = always existed
  const retired = area.retiredYear || Infinity  // undefined = still active

  return year >= created && year < retired
}

/**
 * Get all areas that were active in a specific year
 *
 * @param data - Allotment data
 * @param year - Year to filter by
 * @returns Areas active in that year
 */
export function getAreasForYear(data: AllotmentData, year: number): Area[] {
  return getAllAreas(data).filter(a => wasAreaActiveInYear(a, year))
}

/**
 * Get the year range an area was active
 *
 * @param area - The area
 * @returns { from: number, to: number | null } or null if always active
 */
export function getAreaActiveRange(area: Area): { from: number; to: number | null } | null {
  // Validate area input
  if (!area || typeof area !== 'object') {
    logger.error('getAreaActiveRange called with invalid area', { area: String(area) })
    return null
  }

  if (!area.createdYear && !area.retiredYear) {
    return null  // Always active
  }

  return {
    from: area.createdYear || 0,
    to: area.retiredYear || null  // null = still active
  }
}

/**
 * Validate that a planting can be added to an area in a specific year
 */
export function validatePlantingForYear(
  data: AllotmentData,
  year: number,
  areaId: string
): { valid: boolean; error?: string } {
  const area = getAreaById(data, areaId)
  if (!area) {
    logger.error('validatePlantingForYear: Area not found', { areaId, year })
    return { valid: false, error: `Area ${areaId} does not exist` }
  }

  if (!wasAreaActiveInYear(area, year)) {
    const range = getAreaActiveRange(area)
    const rangeStr = range
      ? `${range.from}-${range.to || 'present'}`
      : 'unknown (area has inconsistent temporal metadata)'

    logger.warn('validatePlantingForYear: Area not active in year', {
      areaId,
      areaName: area.name,
      year,
      activeRange: rangeStr
    })

    return {
      valid: false,
      error: `Area "${area.name}" was not active in ${year}. Active years: ${rangeStr}`
    }
  }

  logger.debug('validatePlantingForYear: Validation passed', {
    areaId,
    areaName: area.name,
    year
  })

  return { valid: true }
}
