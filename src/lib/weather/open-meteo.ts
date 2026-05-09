/**
 * Open-Meteo Weather Service
 *
 * Lightweight rainfall and forecast lookup. The task generator uses the
 * rainfall summary to suppress watering reminders after recent rain, and
 * the Today dashboard renders the forecast tiles. Open-Meteo is free for
 * non-commercial use, needs no API key, and supports CORS, so we call it
 * directly from the browser.
 *
 * The result is cached in localStorage with a 3-hour TTL keyed by coordinates
 * + the day of the request, so repeat task-list renders don't refetch.
 */

import { logger } from '@/lib/logger'

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const CACHE_PREFIX = 'bwp-weather-'
const CACHE_TTL_MS = 3 * 60 * 60 * 1000 // 3 hours
const FETCH_TIMEOUT_MS = 5000

export interface ForecastDay {
  /** ISO date (YYYY-MM-DD) for the forecast day. */
  date: string
  /** WMO weather interpretation code. See open-meteo.com/en/docs#weathervariables. */
  weatherCode: number
  /** Forecast max temperature in °C. */
  tempMaxC: number
  /** Forecast min temperature in °C. */
  tempMinC: number
  /** Forecast precipitation total in mm. */
  precipitationMm: number
}

export interface RainfallSummary {
  /** Rain in mm during the last 3 days (excluding today). */
  past3DaysMm: number
  /** Rain in mm forecast for today. */
  todayMm: number
  /** ISO timestamp when this summary was fetched. */
  fetchedAt: string
  /** Optional forecast tiles for today and the next two days. */
  forecast?: ForecastDay[]
  /**
   * Today's mean soil temperature at 0–7cm depth in °C, averaged across the
   * hourly readings for the local day. Undefined when the API didn't return
   * the soil-temp series. Used by the task generator to gate outdoor sowing
   * tasks for cold-sensitive crops.
   */
  soilTempC?: number
}

interface OpenMeteoResponse {
  daily?: {
    time?: string[]
    precipitation_sum?: number[]
    weathercode?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
  }
  hourly?: {
    time?: string[]
    soil_temperature_0_to_7cm?: number[]
  }
}

interface CachedSummary {
  summary: RainfallSummary
  expiresAt: number
}

function cacheKey(latitude: number, longitude: number): string {
  // Round to 2 decimals (~1 km) so tiny coordinate jitter still hits the cache.
  const lat = latitude.toFixed(2)
  const lng = longitude.toFixed(2)
  return `${CACHE_PREFIX}${lat}_${lng}`
}

function readCache(key: string): RainfallSummary | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedSummary
    if (parsed.expiresAt < Date.now()) {
      localStorage.removeItem(key)
      return null
    }
    return parsed.summary
  } catch {
    return null
  }
}

function writeCache(key: string, summary: RainfallSummary): void {
  if (typeof localStorage === 'undefined') return
  try {
    const payload: CachedSummary = {
      summary,
      expiresAt: Date.now() + CACHE_TTL_MS,
    }
    localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // Quota errors are non-fatal — we'll just refetch next time.
  }
}

/**
 * Fetch a rainfall summary for the given coordinates.
 * Returns null when offline, when the API fails, or when no coordinates
 * are available — callers should fall back to weather-agnostic behaviour.
 */
export async function fetchRainfall(
  latitude: number,
  longitude: number
): Promise<RainfallSummary | null> {
  const key = cacheKey(latitude, longitude)
  const cached = readCache(key)
  if (cached) return cached

  const url = `${ENDPOINT}?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum,weathercode,temperature_2m_max,temperature_2m_min&hourly=soil_temperature_0_to_7cm&past_days=3&forecast_days=3&timezone=auto`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      logger.warn('Open-Meteo request failed', { status: response.status })
      return null
    }
    const data = (await response.json()) as OpenMeteoResponse
    const series = data.daily?.precipitation_sum
    if (!Array.isArray(series) || series.length < 4) {
      logger.warn('Open-Meteo response missing precipitation_sum', { length: series?.length })
      return null
    }

    // past_days=3 + forecast_days=3 -> 6 entries: [d-3, d-2, d-1, today, +1, +2]
    const past3 = (series[0] ?? 0) + (series[1] ?? 0) + (series[2] ?? 0)
    const today = series[3] ?? 0
    const summary: RainfallSummary = {
      past3DaysMm: round1(past3),
      todayMm: round1(today),
      fetchedAt: new Date().toISOString(),
      forecast: buildForecast(data.daily),
      soilTempC: deriveTodaySoilTemp(data.hourly, data.daily?.time?.[3]),
    }
    writeCache(key, summary)
    return summary
  } catch (error) {
    logger.warn('Open-Meteo fetch error', { error: String(error) })
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Build forecast tiles for today and the next two days from a daily payload.
 * Returns undefined when any required series is missing or too short, so
 * the rainfall summary falls back gracefully when the API is partial.
 */
function buildForecast(daily?: OpenMeteoResponse['daily']): ForecastDay[] | undefined {
  if (!daily) return undefined
  const { time, weathercode, temperature_2m_max, temperature_2m_min, precipitation_sum } = daily
  if (!time || !weathercode || !temperature_2m_max || !temperature_2m_min || !precipitation_sum) {
    return undefined
  }
  // Today is at index 3 (after past_days=3). We want today, +1, +2.
  const start = 3
  const tiles: ForecastDay[] = []
  for (let i = start; i < start + 3 && i < time.length; i++) {
    tiles.push({
      date: time[i],
      weatherCode: weathercode[i] ?? 0,
      tempMaxC: round1(temperature_2m_max[i] ?? 0),
      tempMinC: round1(temperature_2m_min[i] ?? 0),
      precipitationMm: round1(precipitation_sum[i] ?? 0),
    })
  }
  return tiles.length === 3 ? tiles : undefined
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Average the hourly soil-temperature series for today's date and return a
 * single °C reading. Returns undefined when the series is missing or no
 * hourly entries match today, so callers fall back to ungated behaviour.
 */
function deriveTodaySoilTemp(
  hourly: OpenMeteoResponse['hourly'],
  todayIso: string | undefined
): number | undefined {
  if (!hourly?.time || !hourly.soil_temperature_0_to_7cm || !todayIso) return undefined
  const { time, soil_temperature_0_to_7cm: temps } = hourly
  let sum = 0
  let count = 0
  for (let i = 0; i < time.length; i++) {
    if (!time[i].startsWith(todayIso)) continue
    const t = temps[i]
    if (typeof t !== 'number' || Number.isNaN(t)) continue
    sum += t
    count++
  }
  if (count === 0) return undefined
  return round1(sum / count)
}

/**
 * Threshold rules for suppressing watering tasks based on recent rainfall.
 * Numbers picked from common UK gardening guidance — overwrite via task
 * generator when better data is available.
 */
const RAIN_THRESHOLDS_MM: Record<'low' | 'moderate' | 'high', number> = {
  low: 5,
  moderate: 8,
  high: 12,
}

/**
 * Decide whether watering can be skipped for a plant given a rainfall summary.
 * The threshold scales with the plant's water requirement: drought-tolerant
 * plants (low) skip after less rain; thirsty plants (high) need more.
 */
export function shouldSkipWatering(
  waterRequirement: 'low' | 'moderate' | 'high',
  rainfall: RainfallSummary
): boolean {
  const total = rainfall.past3DaysMm + rainfall.todayMm
  return total >= RAIN_THRESHOLDS_MM[waterRequirement]
}
