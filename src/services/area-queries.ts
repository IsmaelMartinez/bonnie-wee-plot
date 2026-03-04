/**
 * Area Queries
 *
 * Read-only query functions for areas, plus legacy compatibility wrappers.
 * Also includes rotation history queries.
 */

import {
  AllotmentData,
  Area,
  AreaKind,
  AllotmentItemRef,
} from '@/types/unified-allotment'
import {
  RotationGroup,
  PermanentPlanting,
  InfrastructureItem,
  PhysicalBedId,
} from '@/types/garden-planner'

// ============ AREA HELPER FUNCTIONS (v10) ============

/**
 * Get an area by ID, shortId, or name from the unified areas array.
 * Matches in order: exact ID, shortId (case-insensitive), name (case-insensitive).
 * This allows AI tools to use human-readable identifiers like "A" or "Bed A".
 */
export function getAreaById(data: AllotmentData, idOrName: string): Area | undefined {
  const areas = data.layout.areas?.filter(a => !a.isArchived) || []

  // Try exact ID match first (backward compatible)
  const byId = areas.find(a => a.id === idOrName)
  if (byId) return byId

  // Try shortId match (case-insensitive)
  const lowerInput = idOrName.toLowerCase().trim()
  const byShortId = areas.find(a => a.shortId?.toLowerCase().trim() === lowerInput)
  if (byShortId) return byShortId

  // Try name match (case-insensitive)
  return areas.find(a => a.name.toLowerCase().trim() === lowerInput)
}

/**
 * Get all areas (non-archived)
 */
export function getAllAreas(data: AllotmentData): Area[] {
  return data.layout.areas?.filter(a => !a.isArchived) || []
}

/**
 * Get areas by kind
 */
export function getAreasByKind(data: AllotmentData, kind: AreaKind): Area[] {
  return data.layout.areas?.filter(a => a.kind === kind && !a.isArchived) || []
}

/**
 * Get rotation beds (areas with kind='rotation-bed')
 */
export function getRotationBeds(data: AllotmentData): Area[] {
  return getAreasByKind(data, 'rotation-bed')
}

/**
 * Get all beds (rotation and perennial)
 */
export function getAllBeds(data: AllotmentData): Area[] {
  return data.layout.areas?.filter(a =>
    (a.kind === 'rotation-bed' || a.kind === 'perennial-bed') && !a.isArchived
  ) || []
}

/**
 * Get permanent areas (trees, berries, herbs)
 */
export function getPermanentAreas(data: AllotmentData): Area[] {
  return data.layout.areas?.filter(a =>
    (a.kind === 'tree' || a.kind === 'berry' || a.kind === 'herb' || a.kind === 'perennial-bed') && !a.isArchived
  ) || []
}

/**
 * Get infrastructure areas
 */
export function getInfrastructureAreas(data: AllotmentData): Area[] {
  return getAreasByKind(data, 'infrastructure')
}

/**
 * Check if an area is a rotation bed
 */
export function isRotationBed(area: Area): boolean {
  return area.kind === 'rotation-bed'
}

/**
 * Check if an area can have plantings
 */
export function canHavePlantings(area: Area): boolean {
  return area.canHavePlantings
}

// ============ LEGACY COMPATIBILITY FUNCTIONS ============

/**
 * @deprecated Use getAllBeds instead
 * Get beds from unified areas array - backward compatibility wrapper
 */
export function getBedsFromAreas(data: AllotmentData): import('@/types/garden-planner').PhysicalBed[] {
  return getAllBeds(data).map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    status: a.kind === 'rotation-bed' ? 'rotation' : 'perennial',
    rotationGroup: a.rotationGroup,
    gridPosition: a.gridPosition ? {
      startRow: a.gridPosition.y,
      startCol: a.gridPosition.x,
      endRow: a.gridPosition.y + a.gridPosition.h - 1,
      endCol: a.gridPosition.x + a.gridPosition.w - 1,
    } : undefined,
  }))
}

/**
 * @deprecated Use getPermanentAreas instead
 * Get permanent plantings - backward compatibility wrapper
 */
export function getPermanentPlantingsFromAreas(data: AllotmentData): PermanentPlanting[] {
  return getPermanentAreas(data)
    .filter(a => a.primaryPlant) // Only areas with a primary plant
    .map(a => ({
      id: a.id,
      name: a.name,
      type: a.kind === 'tree' ? 'fruit-tree' :
            a.kind === 'berry' ? 'berry' :
            a.kind === 'herb' ? 'herb' : 'perennial-veg',
      plantId: a.primaryPlant?.plantId,
      variety: a.primaryPlant?.variety,
      plantedYear: a.primaryPlant?.plantedYear,
      notes: a.description,
      gridPosition: a.gridPosition ? {
        row: a.gridPosition.y,
        col: a.gridPosition.x,
      } : undefined,
    }))
}

/**
 * @deprecated Use getInfrastructureAreas instead
 * Get infrastructure - backward compatibility wrapper
 */
export function getInfrastructureFromAreas(data: AllotmentData): InfrastructureItem[] {
  return getInfrastructureAreas(data).map(a => ({
    id: a.id,
    type: a.infrastructureSubtype || 'other',
    name: a.name,
    gridPosition: a.gridPosition ? {
      startRow: a.gridPosition.y,
      startCol: a.gridPosition.x,
      endRow: a.gridPosition.y + a.gridPosition.h - 1,
      endCol: a.gridPosition.x + a.gridPosition.w - 1,
    } : undefined,
  }))
}

/**
 * @deprecated Use getAreaById directly - v10 no longer uses type discriminator
 */
export function getBedAreaById(data: AllotmentData, bedId: string): Area | undefined {
  const area = getAreaById(data, bedId)
  return area && (area.kind === 'rotation-bed' || area.kind === 'perennial-bed') ? area : undefined
}

/**
 * @deprecated Use getAreaById directly
 */
export function getPermanentAreaById(data: AllotmentData, id: string): Area | undefined {
  const area = getAreaById(data, id)
  return area && (area.kind === 'tree' || area.kind === 'berry' || area.kind === 'herb' || area.kind === 'perennial-bed') ? area : undefined
}

/**
 * @deprecated Use getAreaById directly
 */
export function getInfrastructureAreaById(data: AllotmentData, id: string): Area | undefined {
  const area = getAreaById(data, id)
  return area?.kind === 'infrastructure' ? area : undefined
}

/**
 * @deprecated v10 uses 'area' type only
 * Resolved item from an AllotmentItemRef
 */
export type ResolvedItem =
  | { type: 'area'; item: Area }
  | null

/**
 * @deprecated Use getAreaById directly
 * Resolve an AllotmentItemRef to the actual item data
 */
export function resolveItemRef(data: AllotmentData, ref: AllotmentItemRef): ResolvedItem {
  const area = getAreaById(data, ref.id)
  return area ? { type: 'area', item: area } : null
}

/**
 * @deprecated Use getPermanentAreas instead
 * Get a permanent planting by ID - backward compatibility wrapper
 */
export function getPermanentPlantingById(
  data: AllotmentData,
  id: string
): PermanentPlanting | undefined {
  const area = getPermanentAreaById(data, id)
  if (!area) return undefined

  // Convert v10 Area to legacy PermanentPlanting
  const kindToType: Record<string, PermanentPlanting['type']> = {
    'tree': 'fruit-tree',
    'berry': 'berry',
    'herb': 'herb',
    'perennial-bed': 'perennial-veg',
  }
  return {
    id: area.id,
    name: area.name,
    type: kindToType[area.kind] || 'perennial-veg',
    plantId: area.primaryPlant?.plantId,
    variety: area.primaryPlant?.variety,
    plantedYear: area.primaryPlant?.plantedYear,
    notes: area.description,
    gridPosition: area.gridPosition ? {
      row: area.gridPosition.y,
      col: area.gridPosition.x,
    } : undefined,
  }
}

/**
 * @deprecated Use getInfrastructureAreas instead
 * Get an infrastructure item by ID - backward compatibility wrapper
 */
export function getInfrastructureById(
  data: AllotmentData,
  id: string
): InfrastructureItem | undefined {
  const area = getInfrastructureAreaById(data, id)
  if (!area) return undefined

  // Convert v10 Area to legacy InfrastructureItem
  return {
    id: area.id,
    type: area.infrastructureSubtype || 'other',
    name: area.name,
    gridPosition: area.gridPosition ? {
      startRow: area.gridPosition.y,
      startCol: area.gridPosition.x,
      endRow: area.gridPosition.y + area.gridPosition.h - 1,
      endCol: area.gridPosition.x + area.gridPosition.w - 1,
    } : undefined,
  }
}

/**
 * @deprecated Use getAreaById instead
 * Get a bed by ID - backward compatibility wrapper
 */
export function getBedById(
  data: AllotmentData,
  bedId: PhysicalBedId
): import('@/types/garden-planner').PhysicalBed | undefined {
  const area = getBedAreaById(data, bedId)
  if (!area) return undefined

  // Convert v10 Area to legacy PhysicalBed
  return {
    id: area.id as PhysicalBedId,
    name: area.name,
    description: area.description,
    status: area.kind === 'rotation-bed' ? 'rotation' : 'perennial',
    rotationGroup: area.rotationGroup,
    gridPosition: area.gridPosition ? {
      startRow: area.gridPosition.y,
      startCol: area.gridPosition.x,
      endRow: area.gridPosition.y + area.gridPosition.h - 1,
      endCol: area.gridPosition.x + area.gridPosition.w - 1,
    } : undefined,
  }
}

/**
 * @deprecated Use getAreasByKind instead
 * Get beds by status - backward compatibility wrapper
 */
export function getBedsByStatus(
  data: AllotmentData,
  status: import('@/types/garden-planner').BedStatus
): import('@/types/garden-planner').PhysicalBed[] {
  const bedAreas = getAllBeds(data)
  const targetKind = status === 'rotation' ? 'rotation-bed' : 'perennial-bed'
  return bedAreas
    .filter(area => area.kind === targetKind)
    .map(area => ({
      id: area.id as PhysicalBedId,
      name: area.name,
      description: area.description,
      status: status,
      rotationGroup: area.rotationGroup,
      gridPosition: area.gridPosition ? {
        startRow: area.gridPosition.y,
        startCol: area.gridPosition.x,
        endRow: area.gridPosition.y + area.gridPosition.h - 1,
        endCol: area.gridPosition.x + area.gridPosition.w - 1,
      } : undefined,
    }))
}

/**
 * @deprecated Use getAreasByKind(data, 'rotation-bed') instead
 * Get all rotation beds as legacy PhysicalBed format - backward compatibility wrapper
 */
export function getRotationBedsLegacy(
  data: AllotmentData
): import('@/types/garden-planner').PhysicalBed[] {
  const rotationAreas = getAreasByKind(data, 'rotation-bed')
  return rotationAreas
    .map(area => ({
      id: area.id as PhysicalBedId,
      name: area.name,
      description: area.description,
      status: 'rotation' as const,
      rotationGroup: area.rotationGroup,
      gridPosition: area.gridPosition ? {
        startRow: area.gridPosition.y,
        startCol: area.gridPosition.x,
        endRow: area.gridPosition.y + area.gridPosition.h - 1,
        endCol: area.gridPosition.x + area.gridPosition.w - 1,
      } : undefined,
    }))
}

// ============ ROTATION HISTORY ============

/**
 * Get rotation history for an area across all years
 */
export function getRotationHistory(
  data: AllotmentData,
  areaId: string
): Array<{ year: number; group: RotationGroup }> {
  return data.seasons
    .map(season => {
      const areaSeason = season.areas.find(a => a.areaId === areaId)
      return areaSeason?.rotationGroup
        ? { year: season.year, group: areaSeason.rotationGroup }
        : null
    })
    .filter((item): item is { year: number; group: RotationGroup } => item !== null)
    .sort((a, b) => b.year - a.year)
}

/**
 * Get the last N years of rotation for an area
 */
export function getRecentRotation(
  data: AllotmentData,
  areaId: string,
  years: number = 3
): RotationGroup[] {
  return getRotationHistory(data, areaId)
    .slice(0, years)
    .map(h => h.group)
}
