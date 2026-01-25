/**
 * Planting Utilities
 *
 * Utilities for managing plant location, sow methods, and planting lifecycle.
 */

import { SowMethod, Planting, PlantingStatus } from '@/types/unified-allotment'
import { Vegetable, Month } from '@/types/garden-planner'
import { getVegetableById } from './vegetable-database'

// ============ SOW METHOD RECOMMENDATION ============

export interface SowMethodRecommendation {
  recommended: SowMethod
  reason: string
  alternatives: Array<{
    method: SowMethod
    available: boolean
    reason?: string
  }>
}

/**
 * Get the recommended sow method for a plant based on current month
 *
 * Logic:
 * 1. If current month is in sowIndoorsMonths (and not in sowOutdoorsMonths), recommend indoor
 * 2. If current month is in sowOutdoorsMonths (and not in sowIndoorsMonths), recommend outdoor
 * 3. If current month is in both, prefer outdoor (simpler for user)
 * 4. If current month is in neither, recommend whichever is closer in time
 * 5. transplant-purchased is always available as fallback
 */
export function getRecommendedSowMethod(
  plantId: string,
  month: number
): SowMethodRecommendation {
  const vegetable = getVegetableById(plantId)

  if (!vegetable) {
    return {
      recommended: 'outdoor',
      reason: 'Unknown plant - defaulting to outdoor',
      alternatives: [
        { method: 'outdoor', available: true },
        { method: 'indoor', available: true },
        { method: 'transplant-purchased', available: true },
      ]
    }
  }

  return getRecommendedSowMethodForVegetable(vegetable, month as Month)
}

/**
 * Get recommended sow method for a vegetable object
 */
export function getRecommendedSowMethodForVegetable(
  vegetable: Vegetable,
  month: Month
): SowMethodRecommendation {
  const { sowIndoorsMonths, sowOutdoorsMonths } = vegetable.planting

  const canSowIndoors = sowIndoorsMonths.includes(month)
  const canSowOutdoors = sowOutdoorsMonths.includes(month)
  const hasIndoorOption = sowIndoorsMonths.length > 0
  const hasOutdoorOption = sowOutdoorsMonths.length > 0

  // Build alternatives list
  const alternatives: SowMethodRecommendation['alternatives'] = [
    {
      method: 'outdoor',
      available: canSowOutdoors,
      reason: canSowOutdoors
        ? `Good for outdoor sowing in month ${month}`
        : hasOutdoorOption
          ? `Outdoor sowing available months: ${sowOutdoorsMonths.join(', ')}`
          : 'This plant is not typically direct sown outdoors'
    },
    {
      method: 'indoor',
      available: canSowIndoors,
      reason: canSowIndoors
        ? `Good for starting indoors in month ${month}`
        : hasIndoorOption
          ? `Indoor sowing available months: ${sowIndoorsMonths.join(', ')}`
          : 'This plant is not typically started indoors'
    },
    {
      method: 'transplant-purchased',
      available: true,
      reason: 'You can always plant purchased seedlings'
    },
  ]

  // Determine recommended method
  if (canSowIndoors && canSowOutdoors) {
    // Both available - prefer outdoor as simpler
    return {
      recommended: 'outdoor',
      reason: `Month ${month} is good for both indoor and outdoor sowing. Outdoor is simpler.`,
      alternatives
    }
  }

  if (canSowOutdoors) {
    return {
      recommended: 'outdoor',
      reason: `Month ${month} is ideal for direct sowing outdoors`,
      alternatives
    }
  }

  if (canSowIndoors) {
    return {
      recommended: 'indoor',
      reason: `Month ${month} is ideal for starting seeds indoors`,
      alternatives
    }
  }

  // Neither available for current month - find closest option
  if (!hasIndoorOption && !hasOutdoorOption) {
    // Perennial or unusual plant
    return {
      recommended: 'transplant-purchased',
      reason: 'This plant is typically planted as seedlings/transplants',
      alternatives
    }
  }

  // Find closest sowing window
  const closestIndoor = hasIndoorOption ? findClosestMonth(month, sowIndoorsMonths) : null
  const closestOutdoor = hasOutdoorOption ? findClosestMonth(month, sowOutdoorsMonths) : null

  if (closestIndoor !== null && closestOutdoor !== null) {
    const indoorDist = monthDistance(month, closestIndoor)
    const outdoorDist = monthDistance(month, closestOutdoor)

    if (indoorDist <= outdoorDist) {
      return {
        recommended: 'indoor',
        reason: `Not in sowing window. Indoor sowing starts month ${closestIndoor} (${indoorDist} month${indoorDist === 1 ? '' : 's'} away)`,
        alternatives
      }
    } else {
      return {
        recommended: 'outdoor',
        reason: `Not in sowing window. Outdoor sowing starts month ${closestOutdoor} (${outdoorDist} month${outdoorDist === 1 ? '' : 's'} away)`,
        alternatives
      }
    }
  }

  if (closestIndoor !== null) {
    return {
      recommended: 'indoor',
      reason: `Indoor sowing starts month ${closestIndoor}`,
      alternatives
    }
  }

  if (closestOutdoor !== null) {
    return {
      recommended: 'outdoor',
      reason: `Outdoor sowing starts month ${closestOutdoor}`,
      alternatives
    }
  }

  // Fallback
  return {
    recommended: 'transplant-purchased',
    reason: 'Consider purchasing seedlings',
    alternatives
  }
}

/**
 * Find the closest month in a list to the target month (wrapping around year)
 */
function findClosestMonth(target: number, months: Month[]): Month | null {
  if (months.length === 0) return null

  let closest = months[0]
  let minDist = monthDistance(target, closest)

  for (const m of months) {
    const dist = monthDistance(target, m)
    if (dist < minDist) {
      minDist = dist
      closest = m
    }
  }

  return closest
}

/**
 * Calculate the distance between two months (wrapping around year)
 * Returns the minimum distance going forward or backward
 */
function monthDistance(from: number, to: number): number {
  const forward = (to - from + 12) % 12
  const backward = (from - to + 12) % 12
  return Math.min(forward, backward)
}


// ============ PLANTING PHASE (DERIVED STATUS) ============

/**
 * Detailed planting phase derived from status and dates
 */
export type PlantingPhase =
  | 'planned'           // No sow date yet
  | 'germinating'       // Indoor sowing, before transplant
  | 'growing-indoor'    // Indoor, past typical germination
  | 'ready-to-transplant' // Indoor, reached transplant window
  | 'growing'           // Outdoor or transplanted, growing
  | 'ready-to-harvest'  // In harvest window
  | 'harvesting'        // Has actualHarvestStart but not end
  | 'complete'          // Harvest complete
  | 'removed'           // Explicitly removed/failed

export interface PlantingPhaseInfo {
  phase: PlantingPhase
  label: string
  description: string
  color: 'gray' | 'blue' | 'green' | 'yellow' | 'orange' | 'red'
  canAdvanceTo?: PlantingPhase[]
}

/**
 * Get the current phase of a planting based on its status and dates
 */
export function getPlantingPhase(planting: Planting, currentDate?: Date): PlantingPhaseInfo {
  const now = currentDate || new Date()
  const { status, sowMethod, sowDate, transplantDate, expectedHarvestStart, actualHarvestStart, actualHarvestEnd } = planting

  // Explicit terminal states
  if (status === 'removed') {
    return {
      phase: 'removed',
      label: 'Removed',
      description: 'This planting was removed or failed',
      color: 'red'
    }
  }

  if (status === 'harvested' || actualHarvestEnd) {
    return {
      phase: 'complete',
      label: 'Complete',
      description: 'Harvest finished',
      color: 'gray'
    }
  }

  if (actualHarvestStart) {
    return {
      phase: 'harvesting',
      label: 'Harvesting',
      description: 'Currently harvesting',
      color: 'orange',
      canAdvanceTo: ['complete']
    }
  }

  // No sow date = planned
  if (!sowDate) {
    return {
      phase: 'planned',
      label: 'Planned',
      description: 'Not yet sown',
      color: 'gray',
      canAdvanceTo: ['germinating', 'growing']
    }
  }

  const sowDateObj = new Date(sowDate)
  const transplantDateObj = transplantDate ? new Date(transplantDate) : null
  const harvestStartObj = expectedHarvestStart ? new Date(expectedHarvestStart) : null

  // Check if in harvest window
  if (harvestStartObj && now >= harvestStartObj) {
    return {
      phase: 'ready-to-harvest',
      label: 'Ready to Harvest',
      description: 'In harvest window',
      color: 'yellow',
      canAdvanceTo: ['harvesting']
    }
  }

  // Indoor sowing flow
  if (sowMethod === 'indoor') {
    // If transplanted, it's growing in the ground
    if (transplantDateObj && now >= transplantDateObj) {
      return {
        phase: 'growing',
        label: 'Growing',
        description: 'Transplanted and growing',
        color: 'green',
        canAdvanceTo: ['ready-to-harvest']
      }
    }

    // Check germination (roughly 1-3 weeks after sowing)
    const daysSinceSow = Math.floor((now.getTime() - sowDateObj.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceSow < 14) {
      return {
        phase: 'germinating',
        label: 'Germinating',
        description: 'Seeds germinating indoors',
        color: 'blue',
        canAdvanceTo: ['growing-indoor']
      }
    }

    if (daysSinceSow < 42) { // ~6 weeks
      return {
        phase: 'growing-indoor',
        label: 'Growing Indoors',
        description: 'Seedlings growing indoors',
        color: 'blue',
        canAdvanceTo: ['ready-to-transplant']
      }
    }

    return {
      phase: 'ready-to-transplant',
      label: 'Ready to Transplant',
      description: 'Seedlings ready for transplanting',
      color: 'yellow',
      canAdvanceTo: ['growing']
    }
  }

  // Outdoor sowing or transplant-purchased
  return {
    phase: 'growing',
    label: 'Growing',
    description: sowMethod === 'transplant-purchased'
      ? 'Purchased seedling growing'
      : 'Direct-sown and growing',
    color: 'green',
    canAdvanceTo: ['ready-to-harvest']
  }
}

/**
 * Infer a status from planting dates (for migration)
 */
export function inferStatusFromDates(planting: Planting): PlantingStatus {
  if (planting.actualHarvestEnd) {
    return 'harvested'
  }
  if (planting.sowDate || planting.transplantDate) {
    return 'active'
  }
  return 'planned'
}

/**
 * Get a human-readable label for a sow method
 */
export function getSowMethodLabel(method: SowMethod): string {
  switch (method) {
    case 'indoor':
      return 'Started indoors'
    case 'outdoor':
      return 'Direct sown'
    case 'transplant-purchased':
      return 'Purchased seedling'
    default:
      return method
  }
}

/**
 * Get a short label for display in compact views
 */
export function getSowMethodShortLabel(method: SowMethod): string {
  switch (method) {
    case 'indoor':
      return 'Indoors'
    case 'outdoor':
      return 'Outdoors'
    case 'transplant-purchased':
      return 'Purchased'
    default:
      return method
  }
}
