/**
 * Perennial Calculator Module
 *
 * Calculates lifecycle status and provides warnings for perennial plants
 * based on their planted year and the perennial info from the vegetable database.
 */

import { PerennialInfo } from '@/types/garden-planner'
import { PerennialStatus, PrimaryPlant } from '@/types/unified-allotment'

/**
 * Result of perennial status calculation
 */
export interface PerennialStatusResult {
  /** Current lifecycle status */
  status: PerennialStatus

  /** Years since planting */
  yearsPlanted: number

  /** Year when first harvest is expected (min-max range) */
  expectedFirstHarvestYear?: { min: number; max: number }

  /** Progress through establishment period (0-100) */
  establishmentProgress?: number

  /** Year when plant may start declining (if productiveYears defined) */
  expectedDeclineYear?: number

  /** Human-readable status description */
  description: string

  /** Whether plant needs replacement consideration */
  needsReplacement: boolean

  /** Replacement warning message if applicable */
  replacementWarning?: string
}

/**
 * Calculate the lifecycle status of a perennial plant
 */
export function calculatePerennialStatus(
  plantedYear: number,
  perennialInfo: PerennialInfo,
  currentYear: number,
  firstHarvestYearOverride?: number
): PerennialStatusResult {
  const yearsPlanted = currentYear - plantedYear

  // Calculate expected first harvest year
  const expectedFirstHarvestYear = {
    min: plantedYear + perennialInfo.yearsToFirstHarvest.min,
    max: plantedYear + perennialInfo.yearsToFirstHarvest.max,
  }

  // Allow override for first harvest year
  const effectiveFirstHarvestYear = firstHarvestYearOverride || expectedFirstHarvestYear.max

  // Calculate decline year if productiveYears is defined
  let expectedDeclineYear: number | undefined
  if (perennialInfo.productiveYears) {
    expectedDeclineYear = effectiveFirstHarvestYear + perennialInfo.productiveYears.max
  }

  // Determine status
  let status: PerennialStatus
  let description: string
  let needsReplacement = false
  let replacementWarning: string | undefined
  let establishmentProgress: number | undefined

  if (currentYear < effectiveFirstHarvestYear) {
    // Still establishing
    status = 'establishing'
    const yearsToGo = effectiveFirstHarvestYear - currentYear
    const totalEstablishment = perennialInfo.yearsToFirstHarvest.max
    establishmentProgress = Math.min(100, Math.round((yearsPlanted / totalEstablishment) * 100))

    if (yearsToGo === 1) {
      description = `Establishing (expect first harvest next year)`
    } else {
      description = `Establishing (Year ${yearsPlanted + 1} of ${totalEstablishment})`
    }
  } else if (expectedDeclineYear && currentYear >= expectedDeclineYear) {
    // Past productive years
    status = 'declining'
    needsReplacement = true
    const yearsOverdue = currentYear - expectedDeclineYear
    description = `Declining (${yearsOverdue + 1} years past prime)`
    replacementWarning = `This plant is past its typical productive lifespan. Consider replacing.`
  } else if (perennialInfo.productiveYears) {
    // Check if approaching decline
    const yearsUntilDecline = expectedDeclineYear! - currentYear
    const yearsProductive = currentYear - effectiveFirstHarvestYear

    if (yearsUntilDecline <= 1) {
      status = 'productive'
      needsReplacement = true
      description = `Productive (final year${yearsUntilDecline === 0 ? '' : ' approaching'})`
      replacementWarning = `This plant will reach the end of its typical productive lifespan soon. Plan for replacement.`
    } else {
      status = 'productive'
      description = `Productive (Year ${yearsProductive + 1} of ~${perennialInfo.productiveYears.max})`
    }
  } else {
    // No productiveYears defined - indefinite productive period
    status = 'productive'
    const yearsProductive = currentYear - effectiveFirstHarvestYear
    description = `Productive (${yearsProductive + 1} years)`
  }

  return {
    status,
    yearsPlanted,
    expectedFirstHarvestYear,
    establishmentProgress,
    expectedDeclineYear,
    description,
    needsReplacement,
    replacementWarning,
  }
}

/**
 * Get perennial status from a PrimaryPlant with its PerennialInfo
 */
export function getPerennialStatusFromPlant(
  primaryPlant: PrimaryPlant,
  perennialInfo: PerennialInfo,
  currentYear: number
): PerennialStatusResult | null {
  if (!primaryPlant.plantedYear) {
    return null
  }

  return calculatePerennialStatus(
    primaryPlant.plantedYear,
    perennialInfo,
    currentYear,
    primaryPlant.firstHarvestYearOverride
  )
}

/**
 * Get a short status label for display in badges
 */
export function getStatusLabel(status: PerennialStatus): string {
  switch (status) {
    case 'establishing':
      return 'Establishing'
    case 'productive':
      return 'Productive'
    case 'declining':
      return 'Declining'
    case 'removed':
      return 'Removed'
  }
}

/**
 * Get badge color classes for a status
 */
export function getStatusColorClasses(status: PerennialStatus): string {
  switch (status) {
    case 'establishing':
      return 'bg-zen-water-100 text-zen-water-700'
    case 'productive':
      return 'bg-zen-moss-100 text-zen-moss-700'
    case 'declining':
      return 'bg-zen-kitsune-100 text-zen-kitsune-700'
    case 'removed':
      return 'bg-zen-stone-200 text-zen-stone-600'
  }
}
