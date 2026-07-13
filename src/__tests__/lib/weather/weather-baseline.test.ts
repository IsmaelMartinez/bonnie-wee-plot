import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  computeBaseline,
  getBaseline,
  BASELINE_WINDOW_YEARS,
  _resetBaselineCacheForTests,
} from '@/lib/weather/weather-baseline'
import {
  _resetSeasonCacheForTests,
  type SeasonDailyRecord,
  type SeasonWeather,
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

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function makeDay(date: string, overrides: Partial<SeasonDailyRecord> = {}): SeasonDailyRecord {
  return {
    date,
    tempMaxC: 15,
    tempMinC: 5,
    tempMeanC: 10,
    precipitationMm: 2,
    shortwaveRadiationMJm2: 15,
    et0Mm: 2.5,
    sunshineHours: 5,
    daylightHours: 14,
    weatherCode: 3,
    soilTempMean0to7C: 11,
    soilTempMean7to28C: 12,
    soilMoistureMean0to7: 0.16,
    ...overrides,
  }
}

interface SeasonOptions {
  /** Added to every day's tempMeanC (base value is the month number). */
  tempOffset?: number
  /** Months (1-12) to omit entirely — a data gap. */
  skipMonths?: number[]
  /** Limit a month to its first N days: { month, days }. */
  partialMonth?: { month: number; days: number }
}

function makeSeason(year: number, options: SeasonOptions = {}): SeasonWeather {
  const days: SeasonDailyRecord[] = []
  for (let month = 1; month <= 12; month++) {
    if (options.skipMonths?.includes(month)) continue
    let total = daysInMonth(year, month)
    if (options.partialMonth?.month === month) total = options.partialMonth.days
    for (let day = 1; day <= total; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push(makeDay(date, { tempMeanC: month + (options.tempOffset ?? 0) }))
    }
  }
  return { year, days, complete: true, fetchedAt: new Date().toISOString() }
}

describe('computeBaseline', () => {
  it('returns null for an empty seasons list', () => {
    expect(computeBaseline([])).toBeNull()
  })

  it('computes monthly normals across full years', () => {
    const seasons = [makeSeason(2020), makeSeason(2021, { tempOffset: 2 })]
    const baseline = computeBaseline(seasons)!

    expect(baseline.startYear).toBe(2020)
    expect(baseline.endYear).toBe(2021)
    expect(baseline.yearsUsed).toEqual([2020, 2021])
    expect(baseline.months).toHaveLength(12)

    const june = baseline.months[5]
    expect(june.month).toBe(6)
    // Daily means are 6 and 8 -> normal 7
    expect(june.meanTempC).toBe(7)
    // 30 June days x 2mm each year
    expect(june.totalRainfallMm).toBe(60)
    // 30 June days x 5h each year
    expect(june.sunshineHours).toBe(150)
    expect(june.yearsUsed).toBe(2)
  })

  it('excludes a year with a missing month from that month only', () => {
    const seasons = [makeSeason(2020), makeSeason(2021, { tempOffset: 2, skipMonths: [6] })]
    const baseline = computeBaseline(seasons)!

    const june = baseline.months[5]
    expect(june.meanTempC).toBe(6) // only 2020 contributes
    expect(june.yearsUsed).toBe(1)

    const july = baseline.months[6]
    expect(july.meanTempC).toBe(8) // (7 + 9) / 2 — both years
    expect(july.yearsUsed).toBe(2)
  })

  it('excludes a month with too few days from means and totals', () => {
    // 10 June days: below the 20-day mean minimum and the 90% total coverage
    const seasons = [
      makeSeason(2020),
      makeSeason(2021, { tempOffset: 2, partialMonth: { month: 6, days: 10 } }),
    ]
    const baseline = computeBaseline(seasons)!

    const june = baseline.months[5]
    expect(june.meanTempC).toBe(6)
    expect(june.totalRainfallMm).toBe(60)
    expect(june.yearsUsed).toBe(1)
  })

  it('keeps a mean but drops a total when only totals lack coverage', () => {
    // 25 of 30 June days have rain data (83% < 90%), but 25 valid temps >= 20
    const season = makeSeason(2020)
    for (const day of season.days) {
      if (day.date.startsWith('2020-06-') && Number(day.date.slice(8)) > 25) {
        day.precipitationMm = null
        day.sunshineHours = null
      }
    }
    const baseline = computeBaseline([season])!

    const june = baseline.months[5]
    expect(june.meanTempC).toBe(6)
    expect(june.totalRainfallMm).toBeNull()
    expect(june.sunshineHours).toBeNull()
  })

  it('reports null normals for months no year covered', () => {
    const seasons = [makeSeason(2020, { skipMonths: [1] })]
    const baseline = computeBaseline(seasons)!

    const january = baseline.months[0]
    expect(january.meanTempC).toBeNull()
    expect(january.totalRainfallMm).toBeNull()
    expect(january.sunshineHours).toBeNull()
    expect(january.yearsUsed).toBe(0)
  })
})

describe('getBaseline', () => {
  const COORDS = { latitude: 55.95, longitude: -3.18 }

  function datesForYear(year: number): string[] {
    const dates: string[] = []
    const d = new Date(Date.UTC(year, 0, 1))
    while (d.getUTCFullYear() === year) {
      dates.push(d.toISOString().slice(0, 10))
      d.setUTCDate(d.getUTCDate() + 1)
    }
    return dates
  }

  function fullYearResponse(url: string): Response {
    const year = Number(new URL(url).searchParams.get('start_date')!.slice(0, 4))
    const dates = datesForYear(year)
    const n = dates.length
    return new Response(
      JSON.stringify({
        daily: {
          time: dates,
          temperature_2m_max: Array(n).fill(15),
          temperature_2m_min: Array(n).fill(5),
          temperature_2m_mean: Array(n).fill(11.5),
          precipitation_sum: Array(n).fill(1.2),
          sunshine_duration: Array(n).fill(36000), // 10 hours
        },
      }),
      { status: 200 }
    )
  }

  beforeEach(() => {
    localStorageMock.clear()
    _resetBaselineCacheForTests()
    _resetSeasonCacheForTests()
    vi.clearAllMocks()
    vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches the missing window years, computes normals, and caches', async () => {
    vi.mocked(globalThis.fetch).mockImplementation((input) =>
      Promise.resolve(fullYearResponse(String(input)))
    )

    const baseline = await getBaseline(COORDS)
    expect(baseline).not.toBeNull()
    expect(globalThis.fetch).toHaveBeenCalledTimes(BASELINE_WINDOW_YEARS)

    const endYear = new Date().getFullYear() - 1
    expect(baseline!.endYear).toBe(endYear)
    expect(baseline!.startYear).toBe(endYear - BASELINE_WINDOW_YEARS + 1)
    expect(baseline!.yearsUsed).toHaveLength(BASELINE_WINDOW_YEARS)

    const june = baseline!.months[5]
    expect(june.meanTempC).toBe(11.5)
    expect(june.totalRainfallMm).toBe(36) // 30 days x 1.2mm
    expect(june.sunshineHours).toBe(300) // 30 days x 10h

    // Second call is served from the baseline cache — zero further fetches.
    vi.mocked(globalThis.fetch).mockClear()
    const again = await getBaseline(COORDS)
    expect(again).not.toBeNull()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('returns null when the archive is unreachable and nothing is cached', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('network down'))

    expect(await getBaseline(COORDS)).toBeNull()
  })

  it('publishes a baseline when enough years succeed despite some failures', async () => {
    let call = 0
    vi.mocked(globalThis.fetch).mockImplementation((input) => {
      call++
      // Fail 4 of the 10 years; 6 remain, above the 5-year minimum.
      if (call <= 4) return Promise.reject(new Error('archive outage'))
      return Promise.resolve(fullYearResponse(String(input)))
    })

    const baseline = await getBaseline(COORDS)
    expect(baseline).not.toBeNull()
    expect(baseline!.yearsUsed).toHaveLength(BASELINE_WINDOW_YEARS - 4)
  })

  it('returns null when too few years are available for a trustworthy average', async () => {
    let call = 0
    vi.mocked(globalThis.fetch).mockImplementation((input) => {
      call++
      // Only 4 years succeed — below the 5-year minimum.
      if (call > 4) return Promise.reject(new Error('archive outage'))
      return Promise.resolve(fullYearResponse(String(input)))
    })

    expect(await getBaseline(COORDS)).toBeNull()
  })
})
