import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  fetchSeasonWeather,
  getCachedSeason,
  isValidPlotCoordinates,
  _resetSeasonCacheForTests,
  type PlotCoordinates,
} from '@/lib/weather/open-meteo-archive'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

const COORDS = { latitude: 55.95, longitude: -3.18 }
const CURRENT_YEAR = new Date().getFullYear()
const PAST_YEAR = CURRENT_YEAR - 1

function archiveResponse(dates: string[], withHourly = false) {
  const n = dates.length
  const body: Record<string, unknown> = {
    daily: {
      time: dates,
      temperature_2m_max: Array(n).fill(15.0),
      temperature_2m_min: Array(n).fill(8.1),
      temperature_2m_mean: Array(n).fill(11.5),
      precipitation_sum: Array(n).fill(1.2),
      shortwave_radiation_sum: Array(n).fill(20.48),
      et0_fao_evapotranspiration: Array(n).fill(3.16),
      sunshine_duration: Array(n).fill(36000), // 10 hours in seconds
      daylight_duration: Array(n).fill(61200), // 17 hours in seconds
      weather_code: Array(n).fill(61),
    },
  }
  if (withHourly) {
    body.hourly = {
      time: dates.flatMap((d) =>
        Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`)
      ),
      soil_temperature_0_to_7cm: Array(n * 24).fill(12.4),
      soil_temperature_7_to_28cm: Array(n * 24).fill(13.1),
      soil_moisture_0_to_7cm: Array(n * 24).fill(0.164),
    }
  }
  return new Response(JSON.stringify(body), { status: 200 })
}

describe('isValidPlotCoordinates', () => {
  it('accepts real-world coordinates', () => {
    expect(isValidPlotCoordinates({ latitude: 55.95, longitude: -3.18 })).toBe(true)
    expect(isValidPlotCoordinates({ latitude: -90, longitude: 180 })).toBe(true)
  })

  it('rejects missing, non-numeric, non-finite, or out-of-range values', () => {
    expect(isValidPlotCoordinates(null)).toBe(false)
    expect(isValidPlotCoordinates(undefined)).toBe(false)
    expect(isValidPlotCoordinates({ latitude: NaN, longitude: 0 })).toBe(false)
    expect(isValidPlotCoordinates({ latitude: 0, longitude: -Infinity })).toBe(false)
    expect(isValidPlotCoordinates({ latitude: 90.1, longitude: 0 })).toBe(false)
    expect(isValidPlotCoordinates({ latitude: 0, longitude: 180.1 })).toBe(false)
    expect(
      isValidPlotCoordinates({ latitude: '55.95', longitude: -3.18 } as unknown as PlotCoordinates)
    ).toBe(false)
  })
})

describe('fetchSeasonWeather', () => {
  beforeEach(() => {
    localStorageMock.clear()
    _resetSeasonCacheForTests()
    vi.clearAllMocks()
    vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parses daily records including unit conversion and soil aggregation', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      archiveResponse([`${PAST_YEAR}-06-01`, `${PAST_YEAR}-06-02`], true)
    )

    const season = await fetchSeasonWeather(COORDS, PAST_YEAR)
    expect(season).not.toBeNull()
    expect(season!.year).toBe(PAST_YEAR)
    expect(season!.complete).toBe(true)
    expect(season!.days).toHaveLength(2)
    expect(season!.days[0]).toMatchObject({
      date: `${PAST_YEAR}-06-01`,
      tempMaxC: 15,
      tempMinC: 8.1,
      tempMeanC: 11.5,
      precipitationMm: 1.2,
      shortwaveRadiationMJm2: 20.48,
      et0Mm: 3.16,
      sunshineHours: 10,
      daylightHours: 17,
      weatherCode: 61,
      soilTempMean0to7C: 12.4,
      soilTempMean7to28C: 13.1,
      soilMoistureMean0to7: 0.164,
    })
  })

  it('requests the full calendar year for a completed past season', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(archiveResponse([`${PAST_YEAR}-01-01`]))

    await fetchSeasonWeather(COORDS, PAST_YEAR)
    const url = vi.mocked(globalThis.fetch).mock.calls[0][0] as string
    expect(url).toContain('archive-api.open-meteo.com/v1/archive')
    expect(url).toContain(`start_date=${PAST_YEAR}-01-01`)
    expect(url).toContain(`end_date=${PAST_YEAR}-12-31`)
    expect(url).toContain('temperature_2m_mean')
    expect(url).toContain('soil_moisture_0_to_7cm')
  })

  it('marks the current in-progress season as incomplete', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(archiveResponse([`${CURRENT_YEAR}-01-01`]))

    const season = await fetchSeasonWeather(COORDS, CURRENT_YEAR)
    expect(season!.complete).toBe(false)
    const url = vi.mocked(globalThis.fetch).mock.calls[0][0] as string
    expect(url).not.toContain(`end_date=${CURRENT_YEAR}-12-31`)
  })

  it('returns null for a future year without touching the network', async () => {
    const season = await fetchSeasonWeather(COORDS, CURRENT_YEAR + 1)
    expect(season).toBeNull()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('returns null for missing or invalid coordinates without touching the network', async () => {
    const invalid = [
      undefined,
      { latitude: NaN, longitude: -3.18 },
      { latitude: 55.95, longitude: Infinity },
      { latitude: 91, longitude: -3.18 },
      { latitude: 55.95, longitude: -181 },
      { latitude: '55.95', longitude: -3.18 },
    ]
    for (const coords of invalid) {
      expect(await fetchSeasonWeather(coords as unknown as PlotCoordinates, PAST_YEAR)).toBeNull()
    }
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('stores the season under a versioned, coordinate-rounded key', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(archiveResponse([`${PAST_YEAR}-06-01`]))

    await fetchSeasonWeather({ latitude: 55.9533, longitude: -3.1883 }, PAST_YEAR)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      `bwp-season-weather-v1-55.95_-3.19_${PAST_YEAR}`,
      expect.any(String)
    )
  })

  it('refetches the current in-progress season once its 24h TTL expires', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(globalThis.fetch).mockImplementation(() =>
        Promise.resolve(archiveResponse([`${CURRENT_YEAR}-01-01`]))
      )

      await fetchSeasonWeather(COORDS, CURRENT_YEAR)
      await fetchSeasonWeather(COORDS, CURRENT_YEAR)
      expect(globalThis.fetch).toHaveBeenCalledTimes(1) // within TTL: cached

      vi.advanceTimersByTime(25 * 60 * 60 * 1000)
      await fetchSeasonWeather(COORDS, CURRENT_YEAR)
      expect(globalThis.fetch).toHaveBeenCalledTimes(2) // stale: refetched
    } finally {
      vi.useRealTimers()
    }
  })

  it('serves a cached season without a second fetch', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(archiveResponse([`${PAST_YEAR}-06-01`]))

    await fetchSeasonWeather(COORDS, PAST_YEAR)
    const second = await fetchSeasonWeather(COORDS, PAST_YEAR)

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(second).not.toBeNull()
  })

  it('misses the cache for a different year or coordinates', async () => {
    vi.mocked(globalThis.fetch).mockImplementation(() =>
      Promise.resolve(archiveResponse([`${PAST_YEAR}-06-01`]))
    )

    await fetchSeasonWeather(COORDS, PAST_YEAR)
    await fetchSeasonWeather(COORDS, PAST_YEAR - 1)
    await fetchSeasonWeather({ latitude: 57.15, longitude: -2.09 }, PAST_YEAR)

    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  it('returns null when the API responds with an error status', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response('error', { status: 500 }))

    expect(await fetchSeasonWeather(COORDS, PAST_YEAR)).toBeNull()
  })

  it('returns null when fetch throws and nothing is cached', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('network down'))

    expect(await fetchSeasonWeather(COORDS, PAST_YEAR)).toBeNull()
    expect(getCachedSeason(COORDS, PAST_YEAR)).toBeNull()
  })

  it('returns null when the response has no usable daily data', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ daily: { time: [] } }), { status: 200 })
    )

    expect(await fetchSeasonWeather(COORDS, PAST_YEAR)).toBeNull()
  })

  it('trims trailing days the archive padded with nulls', async () => {
    const body = {
      daily: {
        time: [`${PAST_YEAR}-06-01`, `${PAST_YEAR}-06-02`, `${PAST_YEAR}-06-03`],
        temperature_2m_max: [15, null, null],
        temperature_2m_min: [8, null, null],
        temperature_2m_mean: [11, null, null],
        precipitation_sum: [0.4, null, null],
      },
    }
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status: 200 })
    )

    const season = await fetchSeasonWeather(COORDS, PAST_YEAR)
    expect(season!.days).toHaveLength(1)
    expect(season!.days[0].date).toBe(`${PAST_YEAR}-06-01`)
  })
})

describe('getCachedSeason', () => {
  beforeEach(() => {
    localStorageMock.clear()
    _resetSeasonCacheForTests()
    vi.clearAllMocks()
    vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the cached season without any fetch', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(archiveResponse([`${PAST_YEAR}-06-01`]))
    await fetchSeasonWeather(COORDS, PAST_YEAR)
    vi.mocked(globalThis.fetch).mockClear()

    const cached = getCachedSeason(COORDS, PAST_YEAR)
    expect(cached).not.toBeNull()
    expect(cached!.year).toBe(PAST_YEAR)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('returns null when nothing is cached', () => {
    expect(getCachedSeason(COORDS, PAST_YEAR)).toBeNull()
  })

  it('returns null for invalid coordinates', () => {
    expect(
      getCachedSeason({ latitude: NaN, longitude: -3.18 }, PAST_YEAR)
    ).toBeNull()
  })

  it('survives a memory-cache reset via localStorage', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(archiveResponse([`${PAST_YEAR}-06-01`]))
    await fetchSeasonWeather(COORDS, PAST_YEAR)

    _resetSeasonCacheForTests() // simulate a new session; localStorage persists
    expect(getCachedSeason(COORDS, PAST_YEAR)).not.toBeNull()
  })
})
