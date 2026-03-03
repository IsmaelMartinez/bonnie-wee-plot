/**
 * Planting Operations
 *
 * CRUD operations for plantings within seasons, plus garden event operations.
 * Also includes area season helpers (getAreaSeason, notes, rotation group updates).
 */

import {
  AllotmentData,
  AreaSeason,
  Planting,
  NewPlanting,
  PlantingUpdate,
  AreaNote,
  NewAreaNote,
  AreaNoteUpdate,
  GardenEvent,
  NewGardenEvent,
  GridPosition,
} from '@/types/unified-allotment'
import { RotationGroup } from '@/types/garden-planner'
import { generateId } from '@/lib/utils'
import { getSeasonByYear } from './season-operations'

// ============ AREA SEASON OPERATIONS ============

/**
 * Get a specific area's season data (v10)
 */
export function getAreaSeason(
  data: AllotmentData,
  year: number,
  areaId: string
): AreaSeason | undefined {
  const season = getSeasonByYear(data, year)
  return season?.areas?.find(a => a.areaId === areaId)
}

/**
 * @deprecated Use getAreaSeason instead. Kept for backward compatibility.
 */
export function getBedSeason(
  data: AllotmentData,
  year: number,
  bedId: string
): AreaSeason | undefined {
  return getAreaSeason(data, year, bedId)
}

/**
 * Ensure an AreaSeason exists for a given area in a season.
 * If it doesn't exist, creates a new one with empty plantings.
 * Used by functions that modify season data to handle historical seasons
 * that may not have all areas populated.
 */
function ensureAreaSeasonExists(
  areas: AreaSeason[] | undefined,
  areaId: string,
  rotationGroup?: RotationGroup
): AreaSeason[] {
  const areasArray = areas || []
  const existing = areasArray.find(a => a.areaId === areaId)
  if (existing) {
    return areasArray
  }
  return [...areasArray, { areaId, rotationGroup, plantings: [] }]
}

/**
 * Update an area's rotation group for a season (v10)
 */
export function updateAreaRotationGroup(
  data: AllotmentData,
  year: number,
  areaId: string,
  rotationGroup: RotationGroup
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      const existingArea = season.areas?.find(a => a.areaId === areaId)

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: existingArea
          ? (season.areas || []).map(area =>
              area.areaId === areaId
                ? { ...area, rotationGroup }
                : area
            )
          : [...(season.areas || []), { areaId, rotationGroup, plantings: [] }],
      }
    }),
  }
}

/**
 * @deprecated Use updateAreaRotationGroup instead
 */
export function updateBedRotationGroup(
  data: AllotmentData,
  year: number,
  bedId: string,
  rotationGroup: RotationGroup
): AllotmentData {
  return updateAreaRotationGroup(data, year, bedId, rotationGroup)
}

/**
 * Update grid position for a specific area in a specific year (v14)
 * Used for per-year layouts where each year can have different positions
 */
export function updateAreaSeasonPosition(
  data: AllotmentData,
  year: number,
  areaId: string,
  position: GridPosition
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      const existingArea = season.areas?.find(a => a.areaId === areaId)

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: existingArea
          ? (season.areas || []).map(area =>
              area.areaId === areaId
                ? { ...area, gridPosition: position }
                : area
            )
          : [...(season.areas || []), { areaId, plantings: [], gridPosition: position }],
      }
    }),
  }
}

// ============ PLANTING OPERATIONS ============

/**
 * Generate a unique ID for a planting
 */
export function generatePlantingId(): string {
  return generateId('planting')
}

/**
 * Add a planting to an area in a season (v10)
 */
export function addPlanting(
  data: AllotmentData,
  year: number,
  areaId: string,
  planting: NewPlanting
): AllotmentData {
  const newPlanting: Planting = {
    ...planting,
    id: generatePlantingId(),
  }

  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      // Ensure the AreaSeason exists before adding planting
      const areasWithTarget = ensureAreaSeasonExists(season.areas, areaId)

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: areasWithTarget.map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            plantings: [...area.plantings, newPlanting],
          }
        }),
      }
    }),
  }
}

/**
 * Add multiple plantings to an area in a season (v10)
 * This performs a single state update for all plantings, avoiding stale closure issues
 */
export function addPlantings(
  data: AllotmentData,
  year: number,
  areaId: string,
  plantings: NewPlanting[]
): AllotmentData {
  if (plantings.length === 0) return data

  const newPlantings: Planting[] = plantings.map(planting => ({
    ...planting,
    id: generatePlantingId(),
  }))

  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      // Ensure the AreaSeason exists before adding plantings
      const areasWithTarget = ensureAreaSeasonExists(season.areas, areaId)

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: areasWithTarget.map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            plantings: [...area.plantings, ...newPlantings],
          }
        }),
      }
    }),
  }
}

/**
 * Update a planting (v10)
 */
export function updatePlanting(
  data: AllotmentData,
  year: number,
  areaId: string,
  plantingId: string,
  updates: PlantingUpdate
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: (season.areas || []).map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            plantings: area.plantings.map(p =>
              p.id === plantingId ? { ...p, ...updates } : p
            ),
          }
        }),
      }
    }),
  }
}

/**
 * Remove a planting (v10)
 */
export function removePlanting(
  data: AllotmentData,
  year: number,
  areaId: string,
  plantingId: string
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: (season.areas || []).map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            plantings: area.plantings.filter(p => p.id !== plantingId),
          }
        }),
      }
    }),
  }
}

/**
 * Get all plantings for an area in a season (v10)
 */
export function getPlantingsForArea(
  data: AllotmentData,
  year: number,
  areaId: string
): Planting[] {
  const areaSeason = getAreaSeason(data, year, areaId)
  return areaSeason?.plantings || []
}

/**
 * @deprecated Use getPlantingsForArea instead
 */
export function getPlantingsForBed(
  data: AllotmentData,
  year: number,
  bedId: string
): Planting[] {
  return getPlantingsForArea(data, year, bedId)
}

// ============ AREA NOTE OPERATIONS ============

/**
 * Generate a unique ID for an area note
 */
export function generateAreaNoteId(): string {
  return generateId('note')
}

/** @deprecated Use generateAreaNoteId */
export function generateBedNoteId(): string {
  return generateAreaNoteId()
}

/**
 * Get all notes for an area in a season (v10)
 */
export function getAreaNotes(
  data: AllotmentData,
  year: number,
  areaId: string
): AreaNote[] {
  const areaSeason = getAreaSeason(data, year, areaId)
  return areaSeason?.notes || []
}

/** @deprecated Use getAreaNotes */
export function getBedNotes(
  data: AllotmentData,
  year: number,
  bedId: string
): AreaNote[] {
  return getAreaNotes(data, year, bedId)
}

/**
 * Add a note to an area in a season (v10)
 */
export function addAreaNote(
  data: AllotmentData,
  year: number,
  areaId: string,
  note: NewAreaNote
): AllotmentData {
  const now = new Date().toISOString()
  const newNote: AreaNote = {
    ...note,
    id: generateAreaNoteId(),
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      // Ensure the AreaSeason exists before adding note
      const areasWithTarget = ensureAreaSeasonExists(season.areas, areaId)

      return {
        ...season,
        updatedAt: now,
        areas: areasWithTarget.map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            notes: [...(area.notes || []), newNote],
          }
        }),
      }
    }),
  }
}

/** @deprecated Use addAreaNote */
export function addBedNote(
  data: AllotmentData,
  year: number,
  bedId: string,
  note: NewAreaNote
): AllotmentData {
  return addAreaNote(data, year, bedId, note)
}

/**
 * Update an area note (v10)
 */
export function updateAreaNote(
  data: AllotmentData,
  year: number,
  areaId: string,
  noteId: string,
  updates: AreaNoteUpdate
): AllotmentData {
  const now = new Date().toISOString()

  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: now,
        areas: (season.areas || []).map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            notes: (area.notes || []).map(note =>
              note.id === noteId
                ? { ...note, ...updates, updatedAt: now }
                : note
            ),
          }
        }),
      }
    }),
  }
}

/** @deprecated Use updateAreaNote */
export function updateBedNote(
  data: AllotmentData,
  year: number,
  bedId: string,
  noteId: string,
  updates: AreaNoteUpdate
): AllotmentData {
  return updateAreaNote(data, year, bedId, noteId, updates)
}

/**
 * Remove an area note (v10)
 */
export function removeAreaNote(
  data: AllotmentData,
  year: number,
  areaId: string,
  noteId: string
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: (season.areas || []).map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            notes: (area.notes || []).filter(note => note.id !== noteId),
          }
        }),
      }
    }),
  }
}

/** @deprecated Use removeAreaNote */
export function removeBedNote(
  data: AllotmentData,
  year: number,
  bedId: string,
  noteId: string
): AllotmentData {
  return removeAreaNote(data, year, bedId, noteId)
}

// ============ GARDEN EVENTS OPERATIONS ============

/**
 * Get all garden events
 */
export function getGardenEvents(data: AllotmentData): GardenEvent[] {
  return data.gardenEvents || []
}

/**
 * Get garden events for a specific date range
 */
export function getGardenEventsInRange(
  data: AllotmentData,
  startDate: string,
  endDate: string
): GardenEvent[] {
  return (data.gardenEvents || []).filter(event => {
    return event.date >= startDate && event.date <= endDate
  })
}

/**
 * Add a garden event
 */
export function addGardenEvent(
  data: AllotmentData,
  event: NewGardenEvent
): AllotmentData {
  const now = new Date().toISOString()
  const newEvent: GardenEvent = {
    ...event,
    id: generateId('event'),
    createdAt: now,
  }

  return {
    ...data,
    gardenEvents: [...(data.gardenEvents || []), newEvent],
    meta: {
      ...data.meta,
      updatedAt: now,
    },
  }
}

/**
 * Remove a garden event
 */
export function removeGardenEvent(
  data: AllotmentData,
  eventId: string
): AllotmentData {
  return {
    ...data,
    gardenEvents: (data.gardenEvents || []).filter(e => e.id !== eventId),
    meta: {
      ...data.meta,
      updatedAt: new Date().toISOString(),
    },
  }
}
