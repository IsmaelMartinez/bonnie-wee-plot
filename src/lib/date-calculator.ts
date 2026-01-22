/**
 * Date Calculator Module
 *
 * Provides dynamic date calculations for planting schedules based on
 * actual sowing dates, methods, and vegetable database information.
 *
 * Key functions:
 * - calculatePlantingDates: Forward calculation from sow date to harvest
 * - calculateSowDateForHarvest: Backward calculation from target harvest
 * - validateSowDate: Check if sow date is within recommended window
 * - getFallFactorDays: Scotland-specific fall adjustment
 */

import { Vegetable, VegetableCategory } from '@/types/garden-planner'
import { SowMethod, Planting } from '@/types/unified-allotment'

// ============ CONSTANTS ============

/**
 * Days added to growth period for fall/winter sowings in Scotland
 * Due to shorter days, lower light levels, and cooler temperatures
 */
const FALL_FACTOR_DAYS = 14

/**
 * Months considered "fall" for growth rate adjustment
 * August through October in Scotland
 */
const FALL_MONTHS = [8, 9, 10]

/**
 * Germination time estimates by category (days)
 * Used when starting from seed indoors
 */
const GERMINATION_DAYS: Partial<Record<VegetableCategory, { min: number; max: number }>> = {
  'leafy-greens': { min: 5, max: 10 },
  'root-vegetables': { min: 10, max: 21 },
  'brassicas': { min: 5, max: 10 },
  'legumes': { min: 7, max: 14 },
  'solanaceae': { min: 7, max: 14 },
  'cucurbits': { min: 5, max: 10 },
  'alliums': { min: 10, max: 14 },
  'herbs': { min: 7, max: 21 },
}

/**
 * Default germination days if category not found
 */
const DEFAULT_GERMINATION_DAYS = { min: 7, max: 14 }

/**
 * Typical transplant hardening/establishment period (days)
 */
const TRANSPLANT_ESTABLISHMENT_DAYS = { min: 7, max: 14 }

// ============ TYPES ============

/**
 * Input for calculating planting dates
 */
export interface CalculatePlantingDatesInput {
  /** ISO date string when seeds were sown */
  sowDate: string
  /** How the planting was started */
  sowMethod: SowMethod
  /** Vegetable definition from database */
  vegetable: Vegetable
  /** ISO date string when transplanted (required for indoor starts) */
  transplantDate?: string
}

/**
 * Calculated planting dates result
 */
export interface CalculatedPlantingDates {
  /** ISO date - earliest expected harvest */
  expectedHarvestStart: string
  /** ISO date - latest expected harvest */
  expectedHarvestEnd: string
  /** Explanation of calculation */
  calculation: string
}

/**
 * Input for backward calculation (target harvest to sow date)
 */
export interface CalculateSowDateInput {
  /** ISO date string for target harvest */
  targetHarvestDate: string
  /** How the planting will be started */
  sowMethod: SowMethod
  /** Vegetable definition from database */
  vegetable: Vegetable
}

/**
 * Calculated sow date result
 */
export interface CalculatedSowDate {
  /** ISO date - recommended sow date */
  recommendedSowDate: string
  /** ISO date - transplant date (if indoor start) */
  transplantDate?: string
  /** Explanation of calculation */
  calculation: string
}

/**
 * Validation result for sow date
 */
export interface SowDateValidation {
  /** Whether the sow date is within recommended window */
  isValid: boolean
  /** Warning messages (non-blocking issues) */
  warnings: string[]
  /** Error messages (blocking issues) */
  errors: string[]
  /** Suggested alternative dates if invalid */
  suggestions?: {
    earliestRecommended?: string
    latestRecommended?: string
  }
}

// ============ HELPER FUNCTIONS ============

/**
 * Parse ISO date string to Date object
 * Uses explicit parsing to avoid timezone issues with date-only strings
 */
function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month is 0-indexed in JS Date
}

/**
 * Format Date object to ISO date string (YYYY-MM-DD)
 * Uses local time parts to match parseDate behavior
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Subtract days from a date
 */
function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days)
}

/**
 * Get the month (1-12) from a date
 */
function getMonth(date: Date): number {
  return date.getMonth() + 1
}

/**
 * Check if date falls in fall months
 */
function isFallSowing(date: Date): boolean {
  return FALL_MONTHS.includes(getMonth(date))
}

/**
 * Get germination days for a vegetable category
 */
export function getGerminationDays(category: VegetableCategory): { min: number; max: number } {
  return GERMINATION_DAYS[category] || DEFAULT_GERMINATION_DAYS
}

/**
 * Get fall factor adjustment in days
 * Returns additional days needed for fall/winter growth
 */
export function getFallFactorDays(sowDate: string): number {
  const date = parseDate(sowDate)
  return isFallSowing(date) ? FALL_FACTOR_DAYS : 0
}

// ============ CORE CALCULATION FUNCTIONS ============

/**
 * Calculate expected harvest dates from sow date
 *
 * Calculation depends on sow method:
 * - outdoor: sowDate + daysToHarvest
 * - indoor: transplantDate + (daysToHarvest - germination days)
 * - transplant-purchased: transplantDate + (daysToHarvest - germination - establishment)
 *
 * Fall factor is added for August-October sowings in Scotland
 */
export function calculatePlantingDates(
  input: CalculatePlantingDatesInput
): CalculatedPlantingDates {
  const { sowDate, sowMethod, vegetable, transplantDate } = input
  const { daysToHarvest } = vegetable.planting
  const germination = getGerminationDays(vegetable.category)
  const fallFactor = getFallFactorDays(sowDate)

  let baseDate: Date
  let daysMin: number
  let daysMax: number
  let calculationExplanation: string

  switch (sowMethod) {
    case 'outdoor': {
      // Direct sow: full days to harvest from sow date
      baseDate = parseDate(sowDate)
      daysMin = daysToHarvest.min + fallFactor
      daysMax = daysToHarvest.max + fallFactor
      calculationExplanation = `Direct sown ${sowDate}: ${daysToHarvest.min}-${daysToHarvest.max} days to harvest`
      if (fallFactor > 0) {
        calculationExplanation += ` (+${fallFactor} days fall adjustment)`
      }
      break
    }

    case 'indoor': {
      // Started indoors: germination already happened, count from transplant
      if (!transplantDate) {
        // If no transplant date, estimate from sow date + germination + hardening
        const estimatedTransplant = addDays(
          parseDate(sowDate),
          germination.max + TRANSPLANT_ESTABLISHMENT_DAYS.max
        )
        baseDate = estimatedTransplant
        daysMin = daysToHarvest.min - germination.min + fallFactor
        daysMax = daysToHarvest.max - germination.max + fallFactor
        calculationExplanation = `Started indoors ${sowDate}, estimated transplant ~${formatDate(estimatedTransplant)}`
      } else {
        baseDate = parseDate(transplantDate)
        daysMin = daysToHarvest.min - germination.min + fallFactor
        daysMax = daysToHarvest.max - germination.max + fallFactor
        calculationExplanation = `Started indoors ${sowDate}, transplanted ${transplantDate}`
      }
      if (fallFactor > 0) {
        calculationExplanation += ` (+${fallFactor} days fall adjustment)`
      }
      break
    }

    case 'transplant-purchased': {
      // Purchased as transplant: skip germination, shorter establishment
      const effectiveDate = transplantDate || sowDate
      baseDate = parseDate(effectiveDate)
      // Purchased transplants are typically more mature
      daysMin = Math.max(daysToHarvest.min - germination.max - TRANSPLANT_ESTABLISHMENT_DAYS.min, 14) + fallFactor
      daysMax = daysToHarvest.max - germination.min + fallFactor
      calculationExplanation = `Purchased transplant planted ${effectiveDate}`
      if (fallFactor > 0) {
        calculationExplanation += ` (+${fallFactor} days fall adjustment)`
      }
      break
    }

    default:
      throw new Error(`Unknown sow method: ${sowMethod}`)
  }

  // Ensure minimum days is positive
  daysMin = Math.max(daysMin, 7)
  daysMax = Math.max(daysMax, daysMin)

  return {
    expectedHarvestStart: formatDate(addDays(baseDate, daysMin)),
    expectedHarvestEnd: formatDate(addDays(baseDate, daysMax)),
    calculation: calculationExplanation,
  }
}

/**
 * Calculate recommended sow date to achieve target harvest date
 * Works backwards from harvest to determine when to sow
 */
export function calculateSowDateForHarvest(
  input: CalculateSowDateInput
): CalculatedSowDate {
  const { targetHarvestDate, sowMethod, vegetable } = input
  const { daysToHarvest } = vegetable.planting
  const germination = getGerminationDays(vegetable.category)

  const targetDate = parseDate(targetHarvestDate)

  // Use average of min/max for target calculation
  const avgDaysToHarvest = Math.round((daysToHarvest.min + daysToHarvest.max) / 2)

  let recommendedSowDate: Date
  let transplantDate: Date | undefined
  let calculationExplanation: string

  switch (sowMethod) {
    case 'outdoor': {
      // Direct sow: subtract full days to harvest
      recommendedSowDate = subtractDays(targetDate, avgDaysToHarvest)
      calculationExplanation = `Target harvest ${targetHarvestDate}: sow ~${avgDaysToHarvest} days earlier`
      break
    }

    case 'indoor': {
      // Indoor: need to account for germination and transplant timing
      const avgGermination = Math.round((germination.min + germination.max) / 2)
      const growingDays = avgDaysToHarvest - avgGermination
      transplantDate = subtractDays(targetDate, growingDays)
      recommendedSowDate = subtractDays(
        transplantDate,
        avgGermination + TRANSPLANT_ESTABLISHMENT_DAYS.max
      )
      calculationExplanation = `Target harvest ${targetHarvestDate}: sow indoors, transplant ~${formatDate(transplantDate)}`
      break
    }

    case 'transplant-purchased': {
      // Purchased transplant: shorter lead time
      const avgGermination = Math.round((germination.min + germination.max) / 2)
      const daysFromTransplant = avgDaysToHarvest - avgGermination - TRANSPLANT_ESTABLISHMENT_DAYS.min
      recommendedSowDate = subtractDays(targetDate, Math.max(daysFromTransplant, 14))
      calculationExplanation = `Target harvest ${targetHarvestDate}: plant purchased transplant`
      break
    }

    default:
      throw new Error(`Unknown sow method: ${sowMethod}`)
  }

  // Check if calculated date is in fall - may need earlier sowing
  const fallFactor = isFallSowing(recommendedSowDate) ? FALL_FACTOR_DAYS : 0
  if (fallFactor > 0) {
    recommendedSowDate = subtractDays(recommendedSowDate, fallFactor)
    calculationExplanation += ` (adjusted ${fallFactor} days earlier for fall sowing)`
  }

  return {
    recommendedSowDate: formatDate(recommendedSowDate),
    transplantDate: transplantDate ? formatDate(transplantDate) : undefined,
    calculation: calculationExplanation,
  }
}

/**
 * Validate a sow date against the vegetable's recommended sowing window
 * Returns warnings for suboptimal dates and errors for impossible dates
 */
export function validateSowDate(
  sowDate: string,
  sowMethod: SowMethod,
  vegetable: Vegetable
): SowDateValidation {
  const date = parseDate(sowDate)
  const month = getMonth(date)
  const { planting } = vegetable

  const warnings: string[] = []
  const errors: string[] = []
  let isValid = true

  // Determine which months are valid for this sow method
  const validMonths = sowMethod === 'indoor'
    ? planting.sowIndoorsMonths
    : planting.sowOutdoorsMonths

  // If no recommended months, allow any date but warn
  if (validMonths.length === 0 && sowMethod !== 'transplant-purchased') {
    warnings.push(`No recommended ${sowMethod} sowing months defined for ${vegetable.name}`)
    return { isValid: true, warnings, errors }
  }

  // For purchased transplants, check transplant months
  if (sowMethod === 'transplant-purchased') {
    if (planting.transplantMonths.length > 0 && !planting.transplantMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)) {
      warnings.push(
        `${vegetable.name} is typically transplanted in months ${planting.transplantMonths.join(', ')}, not ${month}`
      )
    }
    return { isValid: true, warnings, errors }
  }

  // Check if month is in recommended window
  if (!validMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)) {
    isValid = false
    const methodText = sowMethod === 'indoor' ? 'sowing indoors' : 'direct sowing'
    errors.push(
      `${vegetable.name} is typically best for ${methodText} in months ${validMonths.join(', ')}, not ${month}`
    )

    // Calculate suggestions
    const suggestions: SowDateValidation['suggestions'] = {}

    // Find nearest valid month
    const sortedMonths = [...validMonths].sort((a, b) => a - b)
    if (sortedMonths.length > 0) {
      const year = date.getFullYear()
      suggestions.earliestRecommended = `${year}-${String(sortedMonths[0]).padStart(2, '0')}-01`
      suggestions.latestRecommended = `${year}-${String(sortedMonths[sortedMonths.length - 1]).padStart(2, '0')}-15`
    }

    return { isValid, warnings, errors, suggestions }
  }

  // Add fall factor warning
  if (isFallSowing(date)) {
    warnings.push(
      `Fall sowing in ${vegetable.name} - expect ~${FALL_FACTOR_DAYS} extra days to harvest due to shorter days`
    )
  }

  return { isValid, warnings, errors }
}

/**
 * Calculate and populate expected harvest dates for a planting
 * Returns a new Planting object with expectedHarvestStart/End filled in
 */
export function populateExpectedHarvest(
  planting: Planting,
  vegetable: Vegetable
): Planting {
  // If no sow date or method, can't calculate
  if (!planting.sowDate) {
    return planting
  }

  const sowMethod = planting.sowMethod || 'outdoor'

  try {
    const calculated = calculatePlantingDates({
      sowDate: planting.sowDate,
      sowMethod,
      vegetable,
      transplantDate: planting.transplantDate,
    })

    return {
      ...planting,
      expectedHarvestStart: calculated.expectedHarvestStart,
      expectedHarvestEnd: calculated.expectedHarvestEnd,
    }
  } catch {
    // If calculation fails, return original planting
    return planting
  }
}
