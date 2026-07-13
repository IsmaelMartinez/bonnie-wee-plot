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
  isValidPlotCoordinates,
  type PlotCoordinates,
  type SeasonWeather,
} from './open-meteo-archive'

// The "v1" segment versions the cached payload shape — bump it if
// WeatherBaseline ever changes so an old cached shape can't be served.
const CACHE_PREFIX = 'bwp-weather-baseline-v1-'
/** How many completed years the baseline window spans. */
export const BASELINE_WINDOW_YEARS = 10
/**
 * How long a baseline computed from an incomplete window (some years failed
 * to fetch) stays valid. Recomputing after a day picks up the missing years
 * opportunistically; a full-window baseline is immutable for its endYear.
 */
const INCOMPLETE_BASELINE_TTL_MS = 24 * 60 * 60 * 1000
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

interface CachedBaseline {
  baseline: WeatherBaseline
  /** Epoch ms after which the entry is stale, or null for full-window baselines. */
  expiresAt: number | null
}

const memoryCache = new Map<string, CachedBaseline>()

function cacheKey(coords: PlotCoordinates, startYear: number, endYear: number): string {
  // Rounded to ~1 km like the season cache; the exact plot location stays
  // out of storage keys and is never part of the baseline payload. Both
  // window years are in the key so a future BASELINE_WINDOW_YEARS change
  // can't serve a baseline computed over a different window.
  const lat = coords.latitude.toFixed(2)
  const lng = coords.longitude.toFixed(2)
  return `${CACHE_PREFIX}${lat}_${lng}_${startYear}-${endYear}`
}

function readCache(key: string): WeatherBaseline | null {
  let entry = memoryCache.get(key) ?? null
  if (!entry && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      entry = JSON.parse(raw) as CachedBaseline
      memoryCache.set(key, entry)
    } catch {
      return null
    }
  }
  if (!entry) return null
  if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
    memoryCache.delete(key)
    try {
      localStorage.removeItem(key)
    } catch {
      // Removal is best-effort; a stale entry is overwritten on recompute.
    }
    return null
  }
  // ?? null guards a corrupt entry (e.g. hand-edited storage) parsing fine.
  return entry.baseline ?? null
}

function writeCache(key: string, baseline: WeatherBaseline): void {
  // A baseline missing some window years (failed fetches) expires after a
  // day so the missing years are retried; a full window is immutable.
  const isComplete = baseline.yearsUsed.length >= BASELINE_WINDOW_YEARS
  const entry: CachedBaseline = {
    baseline,
    expiresAt: isComplete ? null : Date.now() + INCOMPLETE_BASELINE_TTL_MS,
  }
  memoryCache.set(key, entry)
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(entry))
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
 * contributed, otherwise null — callers should degrade gracefully. A
 * baseline built from an incomplete window is cached for a day and then
 * recomputed so the missing years get retried.
 *
 * The window is the BASELINE_WINDOW_YEARS completed years before the current
 * one, so the cached baseline rolls forward automatically at new year.
 */
export async function getBaseline(coords: PlotCoordinates): Promise<WeatherBaseline | null> {
  if (!isValidPlotCoordinates(coords)) return null
  const endYear = new Date().getFullYear() - 1
  const startYear = endYear - BASELINE_WINDOW_YEARS + 1

  const key = cacheKey(coords, startYear, endYear)
  const cached = readCache(key)
  if (cached) return cached

  // Fetch the window years concurrently — this is a one-time backfill of
  // BASELINE_WINDOW_YEARS calls (cache-first, so already-archived years cost
  // nothing), well within Open-Meteo's free-tier rate limits, and the slow
  // archive endpoint makes sequential fetching needlessly take ~10x longer.
  const years = Array.from({ length: BASELINE_WINDOW_YEARS }, (_, i) => startYear + i)
  const fetched = await Promise.all(years.map((year) => fetchSeasonWeather(coords, year)))
  const seasons = fetched.filter((s): s is SeasonWeather => s !== null)

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
