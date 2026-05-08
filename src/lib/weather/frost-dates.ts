import { logger } from '@/lib/logger'

const ENDPOINT = 'https://climate-api.open-meteo.com/v1/climate'
const CACHE_PREFIX = 'bwp-frost-dates-'
const START_DATE = '2010-01-01'
const END_DATE = '2024-12-31'
const MODEL = 'ECMWF_IFS'
const FROST_THRESHOLD_C = 0
// Climate endpoint is slower than the forecast API; allow more headroom but
// still bound the wait so a hung request can't pin the hook.
const FETCH_TIMEOUT_MS = 15000

export interface FrostDates {
  /** ISO date (YYYY-MM-DD) for average last spring frost (Jan–Jun). */
  lastSpring: string
  /** ISO date (YYYY-MM-DD) for average first autumn frost (Jul–Dec). */
  firstAutumn: string
  /** ISO timestamp for when the data was fetched. */
  fetchedAt: string
}

interface ClimateResponse {
  daily?: {
    time?: string[]
    temperature_2m_min?: number[]
  }
}

const memoryCache = new Map<string, FrostDates>()

function cacheKey(latitude: number, longitude: number): string {
  return `${CACHE_PREFIX}${latitude.toFixed(2)}-${longitude.toFixed(2)}`
}

function readCache(key: string): FrostDates | null {
  if (memoryCache.has(key)) return memoryCache.get(key)!
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FrostDates
    memoryCache.set(key, parsed)
    return parsed
  } catch {
    return null
  }
}

function writeCache(key: string, value: FrostDates): void {
  memoryCache.set(key, value)
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage may be full or unavailable — fall back to memory-only cache
  }
}

/** Internal helper: only used by tests to clear caches between runs. */
export function _resetFrostCacheForTests(): void {
  memoryCache.clear()
}

interface YearAccumulator {
  year: number
  lastSpringDoy: number | null
  firstAutumnDoy: number | null
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const diff = date.getTime() - start
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

function doyToIsoDate(doy: number, referenceYear: number): string {
  const d = new Date(Date.UTC(referenceYear, 0, doy))
  return d.toISOString().slice(0, 10)
}

function deriveFrostDates(
  times: string[],
  minTemps: number[]
): { lastSpring: string; firstAutumn: string } | null {
  const byYear = new Map<number, YearAccumulator>()

  for (let i = 0; i < times.length; i++) {
    const iso = times[i]
    const t = minTemps[i]
    if (typeof t !== 'number' || Number.isNaN(t)) continue
    const [yStr, mStr, dStr] = iso.split('-')
    const year = Number(yStr)
    const month = Number(mStr)
    const day = Number(dStr)
    if (!year || !month || !day) continue
    const date = new Date(Date.UTC(year, month - 1, day))
    const doy = dayOfYear(date)

    let acc = byYear.get(year)
    if (!acc) {
      acc = { year, lastSpringDoy: null, firstAutumnDoy: null }
      byYear.set(year, acc)
    }

    if (t <= FROST_THRESHOLD_C) {
      // Spring frost: months 1..6 → keep the latest day-of-year seen
      if (month <= 6) {
        if (acc.lastSpringDoy === null || doy > acc.lastSpringDoy) {
          acc.lastSpringDoy = doy
        }
      }
      // Autumn frost: months 7..12 → keep the earliest day-of-year seen
      if (month >= 7) {
        if (acc.firstAutumnDoy === null || doy < acc.firstAutumnDoy) {
          acc.firstAutumnDoy = doy
        }
      }
    }
  }

  const springDoys: number[] = []
  const autumnDoys: number[] = []
  for (const acc of byYear.values()) {
    if (acc.lastSpringDoy !== null) springDoys.push(acc.lastSpringDoy)
    if (acc.firstAutumnDoy !== null) autumnDoys.push(acc.firstAutumnDoy)
  }

  if (springDoys.length === 0 || autumnDoys.length === 0) return null

  const avgSpring = Math.round(springDoys.reduce((a, b) => a + b, 0) / springDoys.length)
  const avgAutumn = Math.round(autumnDoys.reduce((a, b) => a + b, 0) / autumnDoys.length)

  const referenceYear = new Date().getUTCFullYear()
  return {
    lastSpring: doyToIsoDate(avgSpring, referenceYear),
    firstAutumn: doyToIsoDate(avgAutumn, referenceYear),
  }
}

export async function fetchFrostDates(
  latitude: number,
  longitude: number
): Promise<FrostDates | null> {
  const key = cacheKey(latitude, longitude)
  const cached = readCache(key)
  if (cached) return cached

  const url = `${ENDPOINT}?latitude=${latitude}&longitude=${longitude}&start_date=${START_DATE}&end_date=${END_DATE}&models=${MODEL}&daily=temperature_2m_min`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      logger.warn('frost-dates: API request failed', { status: res.status })
      return null
    }
    const body = (await res.json()) as ClimateResponse
    const times = body.daily?.time
    const temps = body.daily?.temperature_2m_min
    if (!Array.isArray(times) || !Array.isArray(temps) || times.length === 0 || temps.length === 0) {
      return null
    }
    const derived = deriveFrostDates(times, temps)
    if (!derived) return null
    const result: FrostDates = {
      ...derived,
      fetchedAt: new Date().toISOString(),
    }
    writeCache(key, result)
    return result
  } catch (error) {
    logger.warn('frost-dates: fetch error', { error: String(error) })
    return null
  } finally {
    clearTimeout(timeout)
  }
}
