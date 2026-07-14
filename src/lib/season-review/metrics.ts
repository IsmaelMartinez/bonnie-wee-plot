/**
 * Season Observer derived metrics (Phase 2b).
 *
 * Pure functions over a season's daily weather (`SeasonWeather` from the
 * Open-Meteo archive), the plot's monthly baseline (`WeatherBaseline`), and
 * the season's logged plantings/care-logs. The rules engine builds every
 * number in a finding from these functions — nothing in a finding may be
 * computed anywhere else, so each metric is unit-tested in isolation.
 *
 * Missing-data policy (false positives are the failure mode): every metric
 * returns null — or excludes the day — rather than guessing when coverage is
 * too thin. Rules then stay silent instead of reporting a number built on a
 * gap. Coverage thresholds mirror weather-baseline.ts so "this June" and
 * "your average June" are computed to the same standard.
 */

import type { SeasonDailyRecord, SeasonWeather } from '@/lib/weather/open-meteo-archive'
import type { WeatherBaseline } from '@/lib/weather/weather-baseline'
import type { CareLogEntry, Planting } from '@/types/unified-allotment'

/** Minimum fraction of a window's days with data before a sum/count is trusted. */
const MIN_WINDOW_COVERAGE = 0.8
/** Minimum valid days before a month's mean is included (as weather-baseline.ts). */
const MIN_DAYS_FOR_MEAN = 20
/** Minimum fraction of a month's days before a monthly total is included (as weather-baseline.ts). */
const MIN_COVERAGE_FOR_TOTAL = 0.9
/** A day with at most this much rain (mm) counts as dry for dry-spell detection. */
const DRY_DAY_MAX_MM = 1
/** Consecutive days at/above a soil threshold before it counts as "reliably reached". */
const SOIL_THRESHOLD_RUN_DAYS = 3

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Inclusive day count between two ISO dates (same date = 1). */
export function daySpan(startDate: string, endDate: string): number {
  // Tolerate a full ISO datetime by keeping only the date part.
  const start = Date.parse(`${startDate.slice(0, 10)}T00:00:00Z`)
  const end = Date.parse(`${endDate.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.floor((end - start) / 86_400_000) + 1
}

/** Days in `[startDate, endDate]` (inclusive, lexical compare on ISO dates). */
export function daysInWindow(
  days: SeasonDailyRecord[],
  startDate: string,
  endDate: string
): SeasonDailyRecord[] {
  return days.filter((d) => d.date >= startDate && d.date <= endDate)
}

/**
 * Daily mean temperature for GDD: prefer the archive's daily mean, fall back
 * to (max+min)/2 when only the extremes are present.
 */
function dailyMeanTemp(day: SeasonDailyRecord): number | null {
  if (day.tempMeanC !== null) return day.tempMeanC
  if (day.tempMaxC !== null && day.tempMinC !== null) {
    return (day.tempMaxC + day.tempMinC) / 2
  }
  return null
}

/** Growing-degree-day accumulation over a window. */
export interface GddAccumulation {
  /** Accumulated GDD (°C·days) above the base temperature. */
  gdd: number
  /** Days in the window that had usable temperature data. */
  daysWithData: number
  /** Total days in the window (inclusive). */
  windowDays: number
}

/**
 * Accumulate GDD (simple average method: max(0, dailyMean − base)) from
 * startDate to endDate inclusive. Returns null when the window is invalid or
 * fewer than MIN_WINDOW_COVERAGE of its days carry temperature data — a GDD
 * total over a gappy window would silently understate growth.
 */
export function accumulateGdd(
  days: SeasonDailyRecord[],
  baseTempC: number,
  startDate: string,
  endDate: string
): GddAccumulation | null {
  const windowDays = daySpan(startDate, endDate)
  if (windowDays <= 0) return null
  let gdd = 0
  let daysWithData = 0
  for (const day of daysInWindow(days, startDate, endDate)) {
    const mean = dailyMeanTemp(day)
    if (mean === null) continue
    daysWithData++
    gdd += Math.max(0, mean - baseTempC)
  }
  if (daysWithData < windowDays * MIN_WINDOW_COVERAGE) return null
  return { gdd: round(gdd, 0), daysWithData, windowDays }
}

/** Mean 0–7cm soil temperature on the given date, or null when not recorded. */
export function soilTempOn(days: SeasonDailyRecord[], date: string): number | null {
  return days.find((d) => d.date === date)?.soilTempMean0to7C ?? null
}

/**
 * First date at/after `fromDate` where the 0–7cm soil temperature stayed at or
 * above `thresholdC` for SOIL_THRESHOLD_RUN_DAYS consecutive recorded days —
 * a single warm day doesn't count as the soil "reaching" a germination
 * threshold. A missing reading breaks the run (conservative: when in doubt,
 * the threshold was not reached). Returns null when no such run exists.
 */
export function firstSoilTempAtOrAbove(
  days: SeasonDailyRecord[],
  thresholdC: number,
  fromDate: string
): string | null {
  const window = days.filter((d) => d.date >= fromDate)
  let runStart: string | null = null
  let runLength = 0
  for (const day of window) {
    if (day.soilTempMean0to7C !== null && day.soilTempMean0to7C >= thresholdC) {
      if (runLength === 0) runStart = day.date
      runLength++
      if (runLength >= SOIL_THRESHOLD_RUN_DAYS) return runStart
    } else {
      runStart = null
      runLength = 0
    }
  }
  return null
}

/** A run of consecutive dry days (each ≤ DRY_DAY_MAX_MM of rain). */
export interface DrySpell {
  start: string
  end: string
  lengthDays: number
  totalRainMm: number
}

/**
 * Find dry spells of at least `minLengthDays` consecutive dry days. A day
 * with no precipitation reading breaks the spell rather than extending it —
 * a "20-day dry spell" spanning a data gap would be a guess.
 */
export function findDrySpells(days: SeasonDailyRecord[], minLengthDays: number): DrySpell[] {
  const spells: DrySpell[] = []
  let current: { start: string; end: string; days: number; rain: number } | null = null

  const flush = () => {
    if (current && current.days >= minLengthDays) {
      spells.push({
        start: current.start,
        end: current.end,
        lengthDays: current.days,
        totalRainMm: round(current.rain, 1),
      })
    }
    current = null
  }

  for (const day of days) {
    const rain = day.precipitationMm
    if (rain !== null && rain <= DRY_DAY_MAX_MM) {
      if (current) {
        current.end = day.date
        current.days++
        current.rain += rain
      } else {
        current = { start: day.date, end: day.date, days: 1, rain }
      }
    } else {
      flush()
    }
  }
  flush()
  return spells
}

/** Rain vs reference evapotranspiration for one calendar month. */
export interface MonthlyWaterBalance {
  month: number
  rainMm: number
  et0Mm: number
  /** rain − ET0; negative means the month lost more water than it received. */
  balanceMm: number
}

/**
 * Simple monthly water balance: total rain minus total FAO ET₀. Returns null
 * unless both series cover ≥ MIN_COVERAGE_FOR_TOTAL of the month — a partial
 * total would understate one side of the balance.
 */
export function monthlyWaterBalance(
  season: SeasonWeather,
  month: number
): MonthlyWaterBalance | null {
  const prefix = `${season.year}-${String(month).padStart(2, '0')}-`
  const monthDays = season.days.filter((d) => d.date.startsWith(prefix))
  const totalDays = new Date(season.year, month, 0).getDate()
  const needed = totalDays * MIN_COVERAGE_FOR_TOTAL

  const rain = monthDays.map((d) => d.precipitationMm).filter((v): v is number => v !== null)
  const et0 = monthDays.map((d) => d.et0Mm).filter((v): v is number => v !== null)
  if (rain.length < needed || et0.length < needed) return null

  const rainMm = round(rain.reduce((a, b) => a + b, 0), 1)
  const et0Mm = round(et0.reduce((a, b) => a + b, 0), 1)
  return { month, rainMm, et0Mm, balanceMm: round(rainMm - et0Mm, 1) }
}

/** Days at/above a heat threshold inside a window. */
export interface HeatStressDays {
  count: number
  /** Dates that hit the threshold, in order. */
  dates: string[]
  daysWithData: number
  windowDays: number
}

/**
 * Count days whose max temperature reached `thresholdC` between startDate and
 * endDate. Returns null when fewer than MIN_WINDOW_COVERAGE of the window's
 * days have a max-temperature reading, so a count over a gappy window can't
 * masquerade as a complete one.
 */
export function countHeatStressDays(
  days: SeasonDailyRecord[],
  thresholdC: number,
  startDate: string,
  endDate: string
): HeatStressDays | null {
  const windowDays = daySpan(startDate, endDate)
  if (windowDays <= 0) return null
  const dates: string[] = []
  let daysWithData = 0
  for (const day of daysInWindow(days, startDate, endDate)) {
    if (day.tempMaxC === null) continue
    daysWithData++
    if (day.tempMaxC >= thresholdC) dates.push(day.date)
  }
  if (daysWithData < windowDays * MIN_WINDOW_COVERAGE) return null
  return { count: dates.length, dates, daysWithData, windowDays }
}

/** Dates with an air frost (Tmin ≤ 0°C) inside a window, with the coldest. */
export interface FrostInWindow {
  dates: string[]
  /** Coldest Tmin among the frost dates. */
  minTempC: number
}

/**
 * Frost days (Tmin ≤ 0°C) between startDate and endDate inclusive. Missing
 * Tmin days simply can't contribute a frost — an absence of data never
 * asserts "no frost", and callers only act when frosts were found.
 */
export function frostDaysInWindow(
  days: SeasonDailyRecord[],
  startDate: string,
  endDate: string
): FrostInWindow | null {
  const dates: string[] = []
  let minTempC = Infinity
  for (const day of daysInWindow(days, startDate, endDate)) {
    if (day.tempMinC === null) continue
    if (day.tempMinC <= 0) {
      dates.push(day.date)
      minTempC = Math.min(minTempC, day.tempMinC)
    }
  }
  if (dates.length === 0) return null
  return { dates, minTempC }
}

/** Actual sow → germination interval for one planting, from the care log. */
export interface GerminationInterval {
  sowDate: string
  germinatedDate: string
  days: number
}

/**
 * Days from a planting's sow date to its earliest `germinated` care-log entry
 * (matched by plantingId). Returns null when the planting has no sow date or
 * no germination was logged — never inferred from other entry types.
 */
export function daysToGermination(
  planting: Planting,
  careLogs: CareLogEntry[]
): GerminationInterval | null {
  if (!planting.sowDate) return null
  const germinated = careLogs
    .filter(
      (log) =>
        log.type === 'germinated' && log.plantingId === planting.id && log.date >= planting.sowDate!
    )
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  if (!germinated) return null
  return {
    sowDate: planting.sowDate,
    germinatedDate: germinated.date,
    // daySpan is inclusive; sow→germination is the elapsed interval.
    days: daySpan(planting.sowDate, germinated.date) - 1,
  }
}

/** One month of the reviewed season, aggregated to the baseline's standard. */
export interface MonthlyActual {
  month: number
  meanTempC: number | null
  rainfallMm: number | null
  sunshineHours: number | null
}

/**
 * Aggregate a season's days into monthly actuals using the same coverage
 * rules as computeBaseline (means need MIN_DAYS_FOR_MEAN days, totals need
 * MIN_COVERAGE_FOR_TOTAL of the month), so actual-vs-normal comparisons are
 * like-for-like. Always returns 12 entries; a month without coverage has
 * null metrics.
 */
export function computeMonthlyActuals(season: SeasonWeather): MonthlyActual[] {
  const actuals: MonthlyActual[] = []
  for (let month = 1; month <= 12; month++) {
    const prefix = `${season.year}-${String(month).padStart(2, '0')}-`
    const monthDays = season.days.filter((d) => d.date.startsWith(prefix))
    const totalDays = new Date(season.year, month, 0).getDate()

    const temps = monthDays.map((d) => d.tempMeanC).filter((v): v is number => v !== null)
    const rain = monthDays.map((d) => d.precipitationMm).filter((v): v is number => v !== null)
    const sun = monthDays.map((d) => d.sunshineHours).filter((v): v is number => v !== null)

    actuals.push({
      month,
      meanTempC:
        temps.length >= MIN_DAYS_FOR_MEAN
          ? round(temps.reduce((a, b) => a + b, 0) / temps.length, 1)
          : null,
      rainfallMm:
        rain.length >= totalDays * MIN_COVERAGE_FOR_TOTAL
          ? round(rain.reduce((a, b) => a + b, 0), 1)
          : null,
      sunshineHours:
        sun.length >= totalDays * MIN_COVERAGE_FOR_TOTAL
          ? round(sun.reduce((a, b) => a + b, 0), 1)
          : null,
    })
  }
  return actuals
}

/** One month's deviation from the 10-year baseline. Null = not comparable. */
export interface MonthlyAnomaly {
  month: number
  /** Actual − baseline mean temperature (°C). */
  tempDeltaC: number | null
  actualTempC: number | null
  baselineTempC: number | null
  /** Actual ÷ baseline rainfall (1 = normal). */
  rainRatio: number | null
  actualRainMm: number | null
  baselineRainMm: number | null
  /** Actual ÷ baseline sunshine (1 = normal). */
  sunshineRatio: number | null
  actualSunshineHours: number | null
  baselineSunshineHours: number | null
}

/**
 * Compare a season's monthly actuals against the baseline normals. Each
 * metric is only compared when both sides have a value (and, for ratios, the
 * baseline is meaningfully non-zero); otherwise that metric is null.
 */
export function computeMonthlyAnomalies(
  actuals: MonthlyActual[],
  baseline: WeatherBaseline
): MonthlyAnomaly[] {
  return actuals.map((actual) => {
    const normal = baseline.months.find((m) => m.month === actual.month)
    const baselineTempC = normal?.meanTempC ?? null
    const baselineRainMm = normal?.totalRainfallMm ?? null
    const baselineSunshineHours = normal?.sunshineHours ?? null
    return {
      month: actual.month,
      tempDeltaC:
        actual.meanTempC !== null && baselineTempC !== null
          ? round(actual.meanTempC - baselineTempC, 1)
          : null,
      actualTempC: actual.meanTempC,
      baselineTempC,
      // A tiny baseline (near-rainless normal month) makes ratios explode;
      // require at least 5mm of normal rain before publishing a ratio.
      rainRatio:
        actual.rainfallMm !== null && baselineRainMm !== null && baselineRainMm >= 5
          ? round(actual.rainfallMm / baselineRainMm, 2)
          : null,
      actualRainMm: actual.rainfallMm,
      baselineRainMm,
      sunshineRatio:
        actual.sunshineHours !== null && baselineSunshineHours !== null && baselineSunshineHours >= 10
          ? round(actual.sunshineHours / baselineSunshineHours, 2)
          : null,
      actualSunshineHours: actual.sunshineHours,
      baselineSunshineHours,
    }
  })
}
