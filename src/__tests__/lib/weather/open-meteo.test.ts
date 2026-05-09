import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { fetchRainfall, shouldSkipWatering, type RainfallSummary } from '@/lib/weather/open-meteo'

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

describe('shouldSkipWatering', () => {
  const drySummary: RainfallSummary = {
    past3DaysMm: 0,
    todayMm: 0,
    fetchedAt: new Date().toISOString(),
  }

  it('does not skip when there has been no rain', () => {
    expect(shouldSkipWatering('low', drySummary)).toBe(false)
    expect(shouldSkipWatering('moderate', drySummary)).toBe(false)
    expect(shouldSkipWatering('high', drySummary)).toBe(false)
  })

  it('skips drought-tolerant plants after light rain (5mm)', () => {
    const summary: RainfallSummary = { past3DaysMm: 5, todayMm: 0, fetchedAt: '' }
    expect(shouldSkipWatering('low', summary)).toBe(true)
    expect(shouldSkipWatering('moderate', summary)).toBe(false)
    expect(shouldSkipWatering('high', summary)).toBe(false)
  })

  it('skips moderate plants only when total reaches 8mm', () => {
    const summary: RainfallSummary = { past3DaysMm: 6, todayMm: 2, fetchedAt: '' }
    expect(shouldSkipWatering('moderate', summary)).toBe(true)
    expect(shouldSkipWatering('high', summary)).toBe(false)
  })

  it('skips thirsty plants only after heavy rain (>=12mm total)', () => {
    const summary: RainfallSummary = { past3DaysMm: 8, todayMm: 4, fetchedAt: '' }
    expect(shouldSkipWatering('high', summary)).toBe(true)
  })

  it('combines past and forecast rainfall', () => {
    const summary: RainfallSummary = { past3DaysMm: 4, todayMm: 4, fetchedAt: '' }
    expect(shouldSkipWatering('moderate', summary)).toBe(true)
  })
})

describe('fetchRainfall', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null and logs when the API responds with an error status', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response('error', { status: 500 })
    )

    const result = await fetchRainfall(55.95, -3.18)
    expect(result).toBeNull()
  })

  it('returns null when the daily series is missing or short', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ daily: { precipitation_sum: [1, 2] } }), { status: 200 })
    )

    const result = await fetchRainfall(55.95, -3.18)
    expect(result).toBeNull()
  })

  it('parses past 3 days and today rainfall from a valid response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          daily: {
            time: ['d-3', 'd-2', 'd-1', 'today'],
            precipitation_sum: [1.2, 0, 3.4, 2.1],
          },
        }),
        { status: 200 }
      )
    )

    const result = await fetchRainfall(55.95, -3.18)
    expect(result).not.toBeNull()
    expect(result!.past3DaysMm).toBeCloseTo(4.6, 1)
    expect(result!.todayMm).toBeCloseTo(2.1, 1)
  })

  it('caches the result so a second call avoids the network', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          daily: { precipitation_sum: [0, 0, 0, 0] },
        }),
        { status: 200 }
      )
    )

    await fetchRainfall(55.95, -3.18)
    const second = await fetchRainfall(55.95, -3.18)

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(second).not.toBeNull()
  })

  it('rounds coordinates to 2 decimals when keying the cache', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          daily: { precipitation_sum: [0, 0, 0, 0] },
        }),
        { status: 200 }
      )
    )

    await fetchRainfall(55.951, -3.182)
    // Same coords rounded to 2 decimals -> hits the cache
    const second = await fetchRainfall(55.953, -3.184)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(second).not.toBeNull()
  })

  it('returns null when fetch throws (offline or aborted)', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('network down'))

    const result = await fetchRainfall(55.95, -3.18)
    expect(result).toBeNull()
  })

  it('builds forecast tiles when the response includes weathercode and temps', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          daily: {
            time: ['d-3', 'd-2', 'd-1', '2026-04-29', '2026-04-30', '2026-05-01'],
            precipitation_sum: [0, 1, 2, 3, 0, 0.5],
            weathercode: [0, 0, 0, 61, 3, 2],
            temperature_2m_max: [10, 11, 12, 14.4, 16, 15],
            temperature_2m_min: [4, 5, 6, 7.2, 8, 7],
          },
        }),
        { status: 200 }
      )
    )

    const result = await fetchRainfall(55.95, -3.18)
    expect(result?.forecast).toHaveLength(3)
    expect(result?.forecast?.[0]).toEqual({
      date: '2026-04-29',
      weatherCode: 61,
      tempMaxC: 14.4,
      tempMinC: 7.2,
      precipitationMm: 3,
    })
    expect(result?.forecast?.[2].date).toBe('2026-05-01')
  })

  it('derives todays mean soil temperature from the hourly series', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          daily: {
            time: ['d-3', 'd-2', 'd-1', '2026-04-29'],
            precipitation_sum: [0, 0, 0, 0],
          },
          hourly: {
            time: [
              '2026-04-28T22:00',
              '2026-04-28T23:00',
              '2026-04-29T00:00',
              '2026-04-29T06:00',
              '2026-04-29T12:00',
              '2026-04-29T18:00',
              '2026-04-30T00:00',
            ],
            soil_temperature_0_to_7cm: [4, 4, 6, 8, 12, 10, 5],
          },
        }),
        { status: 200 }
      )
    )

    const result = await fetchRainfall(55.95, -3.18)
    // Mean of today's four entries: (6+8+12+10)/4 = 9
    expect(result?.soilTempC).toBe(9)
  })

  it('leaves soilTempC undefined when the hourly series is missing', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          daily: {
            time: ['d-3', 'd-2', 'd-1', '2026-04-29'],
            precipitation_sum: [0, 0, 0, 0],
          },
        }),
        { status: 200 }
      )
    )

    const result = await fetchRainfall(55.95, -3.18)
    expect(result?.soilTempC).toBeUndefined()
  })

  it('omits forecast when the response lacks weathercode or temperature series', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          daily: { precipitation_sum: [0, 0, 0, 0] },
        }),
        { status: 200 }
      )
    )

    const result = await fetchRainfall(55.95, -3.18)
    expect(result).not.toBeNull()
    expect(result?.forecast).toBeUndefined()
  })
})
