/**
 * 10-year weather baseline (monthly normals) for the plot.
 *
 * Computes per-month normals — mean temperature, total rainfall, sunshine
 * hours — from ~10 years of archived season data, so later code can say
 * "June was 1.4°C below your 10-year average". The computation is a pure
 * function over already-fetched SeasonWeather data; getBaseline() fetches
 * missing years through the season-archive cache and caches the computed
 * baseline locally, keyed by (rounded) coordinates like every other weather
 * cache. Coordinates never appear inside the baseline itself.
 */

import { logger } from '@/lib/logger'
import {
  fetchSeasonWeather,
  type PlotCoordinates,
  type SeasonWeather,
} from './open-meteo-archive'

const CACHE_PREFIX = 'bwp-weather-baseline-'
/** How many completed years the baseline window spans. */
export const BASELINE_WINDOW_YEARS = 10
/**
 * Minimum years of usable data before a baseline is published. A "10-year
 * average" built on fewer than half the window would mislead more than help.
 */
const MIN_BASELINE_YEARS = 5
/** Minimum valid days before a month's mean is included for a year. */
const MIN_DAYS_FOR_MEAN = 20
/**
 * Minimum fraction of the month's days with data before a monthly *total*
 * (rainfall, sunshine) is included — missing days silently shrink a total,
 * so totals need near-complete coverage.
 */
const MIN_COVERAGE_FOR_TOTAL = 0.9

/** Normals for one calendar month, averaged across the baseline years. */
export interface MonthlyNormal {
  /** Calendar month, 1–12. */
  month: number
  /** Mean daily-mean temperature in °C, or null when no year had coverage. */
  meanTempC: number | null
  /** Mean monthly rainfall total in mm, or null when no year had coverage. */
  totalRainfallMm: number | null
  /** Mean monthly sunshine total in hours, or null when no year had coverage. */
  sunshineHours: number | null
  /** How many baseline years contributed to this month (max of the three metrics). */
  yearsUsed: number
}

/** Per-month climate normals for the plot over a multi-year window. */
export interface WeatherBaseline {
  /** First year of the window (inclusive). */
  startYear: number
  /** Last year of the window (inclusive). */
  endYear: number
  /** Years that actually contributed data. */
  yearsUsed: number[]
  /** One entry per calendar month, index 0 = January. */
  months: MonthlyNormal[]
  /** ISO timestamp when the baseline was computed. */
  computedAt: string
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  const sum = values.reduce((a, b) => a + b, 0)
  return Math.round((sum / values.length) * 10) / 10
}

interface MonthAccumulator {
  meanTemps: number[]
  rainTotals: number[]
  sunshineTotals: number[]
}

/**
 * Compute per-month normals from already-fetched seasons. Pure function.
 *
 * Gap handling: for each (year, month) a metric only contributes when
 * coverage is sufficient — means need MIN_DAYS_FOR_MEAN valid days, totals
 * need MIN_COVERAGE_FOR_TOTAL of the month's days — so a year with a hole
 * (archive outage, mid-year start) degrades that month's sample instead of
 * skewing the normal. Returns null when the seasons list is empty.
 */
export function computeBaseline(seasons: SeasonWeather[]): WeatherBaseline | null {
  if (seasons.length === 0) return null

  const accumulators: MonthAccumulator[] = Array.from({ length: 12 }, () => ({
    meanTemps: [],
    rainTotals: [],
    sunshineTotals: [],
  }))
  const yearsUsed = new Set<number>()

  for (const season of seasons) {
    for (let month = 1; month <= 12; month++) {
      const prefix = `${season.year}-${String(month).padStart(2, '0')}-`
      const days = season.days.filter((d) => d.date.startsWith(prefix))
      if (days.length === 0) continue

      const acc = accumulators[month - 1]
      const totalDays = daysInMonth(season.year, month)
      let contributed = false

      const temps = days
        .map((d) => d.tempMeanC)
        .filter((t): t is number => t !== null)
      if (temps.length >= MIN_DAYS_FOR_MEAN) {
        acc.meanTemps.push(temps.reduce((a, b) => a + b, 0) / temps.length)
        contributed = true
      }

      const rain = days
        .map((d) => d.precipitationMm)
        .filter((r): r is number => r !== null)
      if (rain.length >= totalDays * MIN_COVERAGE_FOR_TOTAL) {
        acc.rainTotals.push(rain.reduce((a, b) => a + b, 0))
        contributed = true
      }

      const sunshine = days
        .map((d) => d.sunshineHours)
        .filter((s): s is number => s !== null)
      if (sunshine.length >= totalDays * MIN_COVERAGE_FOR_TOTAL) {
        acc.sunshineTotals.push(sunshine.reduce((a, b) => a + b, 0))
        contributed = true
      }

      if (contributed) yearsUsed.add(season.year)
    }
  }

  const years = [...yearsUsed].sort((a, b) => a - b)
  const seasonYears = seasons.map((s) => s.year)
  return {
    startYear: Math.min(...seasonYears),
    endYear: Math.max(...seasonYears),
    yearsUsed: years,
    months: accumulators.map((acc, i) => ({
      month: i + 1,
      meanTempC: mean(acc.meanTemps),
      totalRainfallMm: mean(acc.rainTotals),
      sunshineHours: mean(acc.sunshineTotals),
      yearsUsed: Math.max(acc.meanTemps.length, acc.rainTotals.length, acc.sunshineTotals.length),
    })),
    computedAt: new Date().toISOString(),
  }
}

const memoryCache = new Map<string, WeatherBaseline>()

function cacheKey(coords: PlotCoordinates, endYear: number): string {
  // Rounded to ~1 km like the season cache; the exact plot location stays
  // out of storage keys and is never part of the baseline payload.
  const lat = coords.latitude.toFixed(2)
  const lng = coords.longitude.toFixed(2)
  return `${CACHE_PREFIX}${lat}_${lng}_${endYear}`
}

function readCache(key: string): WeatherBaseline | null {
  const inMemory = memoryCache.get(key)
  if (inMemory) return inMemory
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WeatherBaseline
    memoryCache.set(key, parsed)
    return parsed
  } catch {
    return null
  }
}

function writeCache(key: string, baseline: WeatherBaseline): void {
  memoryCache.set(key, baseline)
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(baseline))
  } catch {
    // Quota errors are non-fatal — the memory cache still serves this session.
  }
}

/** Internal helper: only used by tests to clear caches between runs. */
export function _resetBaselineCacheForTests(): void {
  memoryCache.clear()
}

/**
 * Get the plot's 10-year baseline, computing (and caching) it from archived
 * seasons on first call. Missing years are fetched through the season cache,
 * so a fully-cached plot computes offline. Years that fail to fetch are
 * skipped; the baseline is published when at least MIN_BASELINE_YEARS
 * contributed, otherwise null — callers should degrade gracefully.
 *
 * The window is the BASELINE_WINDOW_YEARS completed years before the current
 * one, so the cached baseline rolls forward automatically at new year.
 */
export async function getBaseline(coords: PlotCoordinates): Promise<WeatherBaseline | null> {
  const endYear = new Date().getFullYear() - 1
  const startYear = endYear - BASELINE_WINDOW_YEARS + 1

  const key = cacheKey(coords, endYear)
  const cached = readCache(key)
  if (cached) return cached

  const seasons: SeasonWeather[] = []
  for (let year = startYear; year <= endYear; year++) {
    // fetchSeasonWeather is cache-first, so already-archived years cost nothing.
    const season = await fetchSeasonWeather(coords, year)
    if (season) seasons.push(season)
  }

  if (seasons.length < MIN_BASELINE_YEARS) {
    logger.warn('weather-baseline: not enough archived years to compute a baseline', {
      yearsAvailable: seasons.length,
      yearsNeeded: MIN_BASELINE_YEARS,
    })
    return null
  }

  const baseline = computeBaseline(seasons)
  if (!baseline) return null
  writeCache(key, baseline)
  return baseline
}
