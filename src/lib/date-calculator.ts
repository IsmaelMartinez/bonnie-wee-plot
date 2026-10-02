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
import { SowMethod, Planting, NewPlanting } from '@/types/unified-allotment'
import { isFrostTender } from '@/lib/hardiness'

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
 * Parse a YYYY-MM-DD string as local midnight.
 * `new Date('YYYY-MM-DD')` parses as UTC midnight, which is the previous day
 * west of UTC; always use this for stored date-only strings.
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month is 0-indexed in JS Date
}

/**
 * Format Date object to ISO date string (YYYY-MM-DD)
 * Uses local time parts to match parseDate behavior
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Add calendar days to a date (DST-safe, unlike adding 24h multiples)
 */
export function addDays(date: Date, days: number): Date {
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

const MONTH_NAME_FORMAT = new Intl.DateTimeFormat('en-GB', { month: 'long' })

/** Full English name for a month number (1-12). */
function monthName(month: number): string {
  return MONTH_NAME_FORMAT.format(new Date(2000, month - 1, 1))
}

/**
 * Whole local calendar days from `from` to `to`, ignoring time of day.
 * Rounds because a DST change makes a calendar day 23 or 25 hours long.
 */
export function differenceInDays(to: Date, from: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((parseDate(formatDate(to)).getTime() - parseDate(formatDate(from)).getTime()) / msPerDay)
}

/**
 * First and last month of a month window, reading it cyclically so a window
 * that wraps the year end ([11, 12, 1, 2, 3]) runs November to March. The
 * window starts after the longest run of missing months.
 */
export function windowBounds(months: number[]): { start: number; end: number } {
  const sorted = [...new Set(months)].sort((a, b) => a - b)
  let start = sorted[0]
  let end = sorted[sorted.length - 1]
  let largestGap = 12 - end + start - 1 // gap across the year end
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1] - 1
    if (gap > largestGap) {
      largestGap = gap
      start = sorted[i]
      end = sorted[i - 1]
    }
  }
  return { start, end }
}

/** Months of a window in cyclic order from its start, e.g. Oct, Nov, Feb, Mar. */
function cyclicOrder(months: number[]): number[] {
  const { start } = windowBounds(months)
  return [...new Set(months)].sort((a, b) => ((a - start + 12) % 12) - ((b - start + 12) % 12))
}

const nextMonth = (m: number) => (m % 12) + 1

/**
 * The next contiguous run of window months after `month`, read cyclically, so
 * the suggestion never begins before the entered date. `month` must be outside
 * the window, which guarantees a run start is reached within twelve steps.
 */
function nextRun(months: number[], month: number): { start: number; end: number } {
  const set = new Set(months)
  let start = nextMonth(month)
  while (!set.has(start)) start = nextMonth(start)
  let end = start
  while (set.has(nextMonth(end))) end = nextMonth(end)
  return { start, end }
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

export interface SowDateValidationContext {
  frostDates?: {
    lastSpring: string
    firstAutumn: string
    fetchedAt: string
  }
}

/**
 * Validate a sow date against the vegetable's recommended sowing window
 * Returns warnings for suboptimal dates and errors for impossible dates
 */
export function validateSowDate(
  sowDate: string,
  sowMethod: SowMethod,
  vegetable: Vegetable,
  context: SowDateValidationContext = {}
): SowDateValidation {
  const date = parseDate(sowDate)
  const month = getMonth(date)
  const { planting } = vegetable

  const warnings: string[] = []
  const errors: string[] = []
  let isValid = true

  // Frost-tender warning: only outdoor or transplant-out for tender crops,
  // and only when the user has cached frost dates available. Run before the
  // empty-months early return so it fires for tender crops that have no
  // recommended outdoor month at all (e.g. tomatoes).
  const frostDates = context.frostDates
  if (
    frostDates &&
    sowMethod !== 'indoor' &&
    isFrostTender(vegetable.hardiness)
  ) {
    const lastSpring = parseDate(applySowYear(frostDates.lastSpring, date))
    if (date < lastSpring) {
      warnings.push(
        `${vegetable.name} is ${vegetable.hardiness ?? 'H4'} (frost tender). Average last spring frost is ${formatHumanDate(lastSpring)} (${frostDates.lastSpring}); sowing outdoors before then risks frost damage.`
      )
    }
  }

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
        `${vegetable.name} is typically transplanted in ${cyclicOrder(planting.transplantMonths).map(monthName).join(', ')}, not ${monthName(month)}`
      )
    }
    return { isValid: true, warnings, errors }
  }

  // Check if month is in recommended window
  if (!validMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)) {
    isValid = false
    const methodText = sowMethod === 'indoor' ? 'sowing indoors' : 'direct sowing'
    errors.push(
      `${vegetable.name} is typically best for ${methodText} in ${cyclicOrder(validMonths).map(monthName).join(', ')}, not ${monthName(month)}`
    )

    // Suggest the next valid run; one that wraps the year end finishes the next year.
    const { start, end } = nextRun(validMonths, month)
    const startYear = start > month ? date.getFullYear() : date.getFullYear() + 1
    const endYear = end < start ? startYear + 1 : startYear
    const suggestions: SowDateValidation['suggestions'] = {
      earliestRecommended: formatDate(new Date(startYear, start - 1, 1)),
      latestRecommended: formatDate(new Date(endYear, end - 1, 15)),
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
 * frostDates.lastSpring is stored against the calendar year it was fetched in.
 * Re-anchor to the user's sow year so comparisons work consistently across years.
 */
function applySowYear(isoDate: string, sowDate: Date): string {
  const sowYear = sowDate.getFullYear()
  return `${sowYear}-${isoDate.slice(5)}`
}

function formatHumanDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' })
  return formatter.format(date)
}

/**
 * Calculate and populate expected harvest dates for a planting
 * Returns a new planting object with expectedHarvestStart/End filled in
 * Generic to support both Planting (with id) and NewPlanting (without id)
 */
export function populateExpectedHarvest<T extends Planting | NewPlanting>(
  planting: T,
  vegetable: Vegetable
): T {
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
    } as T
  } catch {
    // If calculation fails, return original planting
    return planting
  }
}

// ============ CROSS-YEAR SUPPORT ============

/**
 * Detect if a planting spans multiple years (e.g., garlic planted Oct, harvested Jul)
 * Returns the harvest year if different from sow year, undefined otherwise
 */
export function detectCrossYear(
  sowDate: string,
  expectedHarvestStart: string
): number | undefined {
  const sowYear = parseDate(sowDate).getFullYear()
  const harvestYear = parseDate(expectedHarvestStart).getFullYear()

  if (harvestYear > sowYear) {
    return harvestYear
  }
  return undefined
}

/**
 * Check if a planting is a cross-year planting
 */
export function isCrossYearPlanting(planting: Planting): boolean {
  if (planting.originYear && planting.harvestYear) {
    return planting.harvestYear !== planting.originYear
  }

  if (planting.sowDate && planting.expectedHarvestStart) {
    const sowYear = parseDate(planting.sowDate).getFullYear()
    const harvestYear = parseDate(planting.expectedHarvestStart).getFullYear()
    return harvestYear > sowYear
  }

  return false
}

/**
 * Populate cross-year fields (originYear, harvestYear) for a planting
 * Call this after populating expectedHarvestStart/End
 */
export function populateCrossYearFields(
  planting: Planting,
  vegetable: Vegetable
): Planting {
  // First ensure we have harvest dates
  let result = planting.expectedHarvestStart
    ? planting
    : populateExpectedHarvest(planting, vegetable)

  // If still no sow date, can't calculate
  if (!result.sowDate) {
    return result
  }

  // Capture sowDate to preserve type narrowing across reassignments
  const sowDate = result.sowDate
  const sowYear = parseDate(sowDate).getFullYear()

  // Set originYear if not already set
  if (!result.originYear) {
    result = { ...result, originYear: sowYear }
  }

  // Detect and set harvestYear if it's a cross-year planting
  if (result.expectedHarvestStart && !result.harvestYear) {
    const harvestYear = detectCrossYear(sowDate, result.expectedHarvestStart)
    if (harvestYear) {
      result = { ...result, harvestYear }
    }
  }

  return result
}

/**
 * Get display info for cross-year plantings
 */
export function getCrossYearDisplayInfo(planting: Planting): {
  isCrossYear: boolean
  label?: string
  originYear?: number
  harvestYear?: number
} {
  if (!isCrossYearPlanting(planting)) {
    return { isCrossYear: false }
  }

  const originYear = planting.originYear ||
    (planting.sowDate ? parseDate(planting.sowDate).getFullYear() : undefined)
  const harvestYear = planting.harvestYear ||
    (planting.expectedHarvestStart ? parseDate(planting.expectedHarvestStart).getFullYear() : undefined)

  return {
    isCrossYear: true,
    label: originYear && harvestYear ? `${originYear} → ${harvestYear}` : 'Cross-year',
    originYear,
    harvestYear,
  }
}
