/**
 * Open-Meteo Historical Weather (Archive) Service
 *
 * Season-at-once historical weather for the Season Observer: one API call
 * fetches a whole calendar year of daily weather plus hourly soil series
 * (aggregated to daily here — see soil-daily.ts), parsed into typed daily
 * records and cached locally. A future rules engine consumes these records
 * to compare a season against the plot's 10-year baseline (weather-baseline.ts).
 *
 * Endpoint decision: everything comes from the Archive API (ERA5/ERA5-Land,
 * https://archive-api.open-meteo.com/v1/archive). The Historical Forecast API
 * was considered for the current in-progress season (it has ~no lag), but it
 * publishes soil variables at different depth layers (0cm/6cm point depths,
 * 0-1cm/1-3cm/... moisture layers) than ERA5's 0-7cm/7-28cm, so mixing the
 * two would make current-season soil metrics incomparable with the multi-year
 * baseline. The Archive API's ~5-day lag is irrelevant for a retrospective
 * season report, so a single consistent source wins. All variable names below
 * were verified against the live API (2026-07).
 *
 * Caching: completed past seasons are immutable and cached forever; the
 * current in-progress season is cached with a 24h TTL and refetched whole
 * (still just one call) when stale. Aggregating hourly soil data to daily
 * before caching keeps a season at roughly 40 KB of JSON, so ten years fit
 * comfortably in localStorage — matching the storage the existing weather
 * code uses — with an in-memory fallback when quota is exhausted.
 *
 * Privacy: coordinates are home-adjacent. They appear only in local cache
 * keys (rounded to ~1 km like the existing weather cache), are never logged,
 * and are absent from every exported type, so cached or derived weather data
 * can be shared without leaking the plot location.
 *
 * Open-Meteo is free for non-commercial use, needs no API key, supports CORS
 * (called directly from the browser), and requires CC BY 4.0 attribution —
 * shown where weather data surfaces (WeatherStrip) and in the README.
 */

import { logger } from '@/lib/logger'
import { aggregateSoilDaily } from './soil-daily'

const ENDPOINT = 'https://archive-api.open-meteo.com/v1/archive'
const CACHE_PREFIX = 'bwp-season-weather-'
// Archive queries scan a year of ERA5 data and are slower than the forecast
// API; allow the same headroom as the climate endpoint in frost-dates.ts.
const FETCH_TIMEOUT_MS = 15000
// The current season grows a new tail every day (minus the ~5-day archive
// lag); refetch at most once a day. Completed seasons never expire.
const CURRENT_SEASON_TTL_MS = 24 * 60 * 60 * 1000

const DAILY_VARIABLES = [
  'temperature_2m_max',
  'temperature_2m_min',
  'temperature_2m_mean',
  'precipitation_sum',
  'shortwave_radiation_sum',
  'et0_fao_evapotranspiration',
  'sunshine_duration',
  'daylight_duration',
  'weather_code',
].join(',')

const HOURLY_VARIABLES = [
  'soil_temperature_0_to_7cm',
  'soil_temperature_7_to_28cm',
  'soil_moisture_0_to_7cm',
].join(',')

/** Geographic coordinates, matching the shape of AllotmentMeta.coordinates. */
export interface PlotCoordinates {
  latitude: number
  longitude: number
}

/** One day of historical weather. Null means the archive had no value. */
export interface SeasonDailyRecord {
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** Daily max air temperature at 2m in °C. */
  tempMaxC: number | null
  /** Daily min air temperature at 2m in °C. */
  tempMinC: number | null
  /** Daily mean air temperature at 2m in °C. */
  tempMeanC: number | null
  /** Total daily precipitation in mm. */
  precipitationMm: number | null
  /** Daily shortwave solar radiation sum in MJ/m². */
  shortwaveRadiationMJm2: number | null
  /** Daily FAO reference evapotranspiration (ET₀) in mm. */
  et0Mm: number | null
  /** Sunshine duration in hours. */
  sunshineHours: number | null
  /** Daylight duration in hours. */
  daylightHours: number | null
  /** Most severe WMO weather code of the day. */
  weatherCode: number | null
  /** Mean soil temperature at 0–7cm in °C (aggregated from hourly). */
  soilTempMean0to7C: number | null
  /** Mean soil temperature at 7–28cm in °C (aggregated from hourly). */
  soilTempMean7to28C: number | null
  /** Mean volumetric soil moisture at 0–7cm in m³/m³ (aggregated from hourly). */
  soilMoistureMean0to7: number | null
}

/** A season (calendar year) of daily weather for one plot. */
export interface SeasonWeather {
  /** Calendar year the records cover. */
  year: number
  /** Daily records in date order, trailing no-data days trimmed. */
  days: SeasonDailyRecord[]
  /** True for a completed past year — the data is immutable. */
  complete: boolean
  /** ISO timestamp when this season was fetched. */
  fetchedAt: string
}

interface ArchiveResponse {
  daily?: {
    time?: string[]
    temperature_2m_max?: (number | null)[]
    temperature_2m_min?: (number | null)[]
    temperature_2m_mean?: (number | null)[]
    precipitation_sum?: (number | null)[]
    shortwave_radiation_sum?: (number | null)[]
    et0_fao_evapotranspiration?: (number | null)[]
    sunshine_duration?: (number | null)[]
    daylight_duration?: (number | null)[]
    weather_code?: (number | null)[]
  }
  hourly?: {
    time?: string[]
    soil_temperature_0_to_7cm?: (number | null)[]
    soil_temperature_7_to_28cm?: (number | null)[]
    soil_moisture_0_to_7cm?: (number | null)[]
  }
}

interface CachedSeason {
  season: SeasonWeather
  /** Epoch ms after which the entry is stale, or null for immutable seasons. */
  expiresAt: number | null
}

const memoryCache = new Map<string, CachedSeason>()

function cacheKey(coords: PlotCoordinates, year: number): string {
  // Round to 2 decimals (~1 km) so tiny coordinate jitter still hits the
  // cache — and so the exact plot location never leaves the device.
  const lat = coords.latitude.toFixed(2)
  const lng = coords.longitude.toFixed(2)
  return `${CACHE_PREFIX}${lat}_${lng}_${year}`
}

function readCache(key: string): SeasonWeather | null {
  let entry = memoryCache.get(key) ?? null
  if (!entry && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        entry = JSON.parse(raw) as CachedSeason
        memoryCache.set(key, entry)
      }
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
      // Removal is best-effort; a stale entry is re-written on next fetch.
    }
    return null
  }
  return entry.season
}

function writeCache(key: string, season: SeasonWeather): void {
  const entry: CachedSeason = {
    season,
    expiresAt: season.complete ? null : Date.now() + CURRENT_SEASON_TTL_MS,
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
export function _resetSeasonCacheForTests(): void {
  memoryCache.clear()
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function numberOrNull(
  series: (number | null)[] | undefined,
  index: number,
  decimals: number,
  scale = 1
): number | null {
  const v = series?.[index]
  if (typeof v !== 'number' || Number.isNaN(v)) return null
  return round(v * scale, decimals)
}

/** Local ISO date (YYYY-MM-DD) — matches Open-Meteo's timezone=auto days. */
function todayIsoLocal(): string {
  return new Date().toLocaleDateString('en-CA')
}

function buildDays(data: ArchiveResponse): SeasonDailyRecord[] | null {
  const time = data.daily?.time
  if (!Array.isArray(time) || time.length === 0) return null
  const daily = data.daily!
  const hourly = data.hourly
  const hourlyTime = hourly?.time
  const soilByDate =
    hourly && Array.isArray(hourlyTime) && hourlyTime.length > 0
      ? aggregateSoilDaily({ ...hourly, time: hourlyTime })
      : undefined

  const days: SeasonDailyRecord[] = time.map((date, i) => {
    const soil = soilByDate?.get(date)
    return {
      date,
      tempMaxC: numberOrNull(daily.temperature_2m_max, i, 1),
      tempMinC: numberOrNull(daily.temperature_2m_min, i, 1),
      tempMeanC: numberOrNull(daily.temperature_2m_mean, i, 1),
      precipitationMm: numberOrNull(daily.precipitation_sum, i, 2),
      shortwaveRadiationMJm2: numberOrNull(daily.shortwave_radiation_sum, i, 2),
      et0Mm: numberOrNull(daily.et0_fao_evapotranspiration, i, 2),
      // Open-Meteo returns durations in seconds; hours are the useful unit.
      sunshineHours: numberOrNull(daily.sunshine_duration, i, 2, 1 / 3600),
      daylightHours: numberOrNull(daily.daylight_duration, i, 2, 1 / 3600),
      weatherCode: numberOrNull(daily.weather_code, i, 0),
      soilTempMean0to7C: soil?.soilTempMean0to7C ?? null,
      soilTempMean7to28C: soil?.soilTempMean7to28C ?? null,
      soilMoistureMean0to7: soil?.soilMoistureMean0to7 ?? null,
    }
  })

  // The archive lags ~5 days behind real time and pads the gap with nulls;
  // trim trailing days that carry no temperature or precipitation data.
  let end = days.length
  while (end > 0) {
    const d = days[end - 1]
    if (d.tempMeanC !== null || d.tempMaxC !== null || d.precipitationMm !== null) break
    end--
  }
  return end > 0 ? days.slice(0, end) : null
}

/**
 * Return the cached season for the given plot and year, or null when absent
 * or stale. Never touches the network.
 */
export function getCachedSeason(coords: PlotCoordinates, year: number): SeasonWeather | null {
  return readCache(cacheKey(coords, year))
}

/**
 * Fetch a whole season (calendar year) of daily weather for the plot.
 * Cache-first: a completed past season is fetched at most once, ever; the
 * current in-progress season is refetched after 24h. Returns null when the
 * year is in the future, when offline, or when the API fails and nothing is
 * cached — callers should degrade gracefully.
 */
export async function fetchSeasonWeather(
  coords: PlotCoordinates,
  year: number
): Promise<SeasonWeather | null> {
  const today = todayIsoLocal()
  const currentYear = Number(today.slice(0, 4))
  if (year > currentYear) return null

  const key = cacheKey(coords, year)
  const cached = readCache(key)
  if (cached) return cached

  const complete = year < currentYear
  const endDate = complete ? `${year}-12-31` : today
  const url =
    `${ENDPOINT}?latitude=${coords.latitude}&longitude=${coords.longitude}` +
    `&start_date=${year}-01-01&end_date=${endDate}` +
    `&daily=${DAILY_VARIABLES}&hourly=${HOURLY_VARIABLES}&timezone=auto`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      logger.warn('season-archive: API request failed', { status: response.status, year })
      return null
    }
    const data = (await response.json()) as ArchiveResponse
    const days = buildDays(data)
    if (!days) {
      logger.warn('season-archive: response had no usable daily data', { year })
      return null
    }
    const season: SeasonWeather = {
      year,
      days,
      complete,
      fetchedAt: new Date().toISOString(),
    }
    writeCache(key, season)
    return season
  } catch (error) {
    logger.warn('season-archive: fetch error', { error: String(error), year })
    return null
  } finally {
    clearTimeout(timeout)
  }
}
