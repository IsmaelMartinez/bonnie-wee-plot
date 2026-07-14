import { describe, it, expect } from 'vitest'
import type { SeasonDailyRecord, SeasonWeather } from '@/lib/weather/open-meteo-archive'
import type { WeatherBaseline } from '@/lib/weather/weather-baseline'
import type { CareLogEntry, Planting } from '@/types/unified-allotment'
import {
  accumulateGdd,
  computeMonthlyActuals,
  computeMonthlyAnomalies,
  countHeatStressDays,
  daySpan,
  daysInWindow,
  daysToGermination,
  findDrySpells,
  firstSoilTempAtOrAbove,
  frostDaysInWindow,
  monthlyWaterBalance,
  soilTempOn,
} from '@/lib/season-review/metrics'

function makeDay(date: string, overrides: Partial<SeasonDailyRecord> = {}): SeasonDailyRecord {
  return {
    date,
    tempMaxC: 16,
    tempMinC: 8,
    tempMeanC: 12,
    precipitationMm: 2,
    shortwaveRadiationMJm2: 15,
    et0Mm: 2,
    sunshineHours: 5,
    daylightHours: 14,
    weatherCode: 3,
    soilTempMean0to7C: 10,
    soilTempMean7to28C: 11,
    soilMoistureMean0to7: 0.2,
    ...overrides,
  }
}

/** All ISO dates from start to end inclusive. */
function datesBetween(start: string, end: string): string[] {
  const dates: string[] = []
  let t = Date.parse(`${start}T00:00:00Z`)
  const endT = Date.parse(`${end}T00:00:00Z`)
  while (t <= endT) {
    dates.push(new Date(t).toISOString().slice(0, 10))
    t += 86_400_000
  }
  return dates
}

/** A full-year season with per-date overrides. */
function buildSeason(
  year: number,
  overrides: Record<string, Partial<SeasonDailyRecord>> = {}
): SeasonWeather {
  const days = datesBetween(`${year}-01-01`, `${year}-12-31`).map((date) =>
    makeDay(date, overrides[date])
  )
  return { year, days, complete: true, fetchedAt: '2026-01-01T00:00:00Z' }
}

function overrideRange(
  start: string,
  end: string,
  values: Partial<SeasonDailyRecord>
): Record<string, Partial<SeasonDailyRecord>> {
  const result: Record<string, Partial<SeasonDailyRecord>> = {}
  for (const date of datesBetween(start, end)) result[date] = values
  return result
}

describe('daySpan', () => {
  it('is inclusive', () => {
    expect(daySpan('2025-03-10', '2025-03-10')).toBe(1)
    expect(daySpan('2025-03-10', '2025-03-12')).toBe(3)
  })

  it('returns 0 for malformed dates', () => {
    expect(daySpan('not-a-date', '2025-03-12')).toBe(0)
  })
})

describe('daysInWindow', () => {
  it('filters inclusively by date', () => {
    const season = buildSeason(2025)
    const window = daysInWindow(season.days, '2025-06-01', '2025-06-03')
    expect(window.map((d) => d.date)).toEqual(['2025-06-01', '2025-06-02', '2025-06-03'])
  })
})

describe('accumulateGdd', () => {
  it('sums degrees above the base temperature', () => {
    const season = buildSeason(2025) // tempMeanC 12 every day
    const result = accumulateGdd(season.days, 5, '2025-06-01', '2025-06-10')
    // 10 days × (12 − 5)
    expect(result).toEqual({ gdd: 70, daysWithData: 10, windowDays: 10 })
  })

  it('never counts negative daily GDD', () => {
    const season = buildSeason(2025, overrideRange('2025-06-01', '2025-06-05', { tempMeanC: 3 }))
    const result = accumulateGdd(season.days, 5, '2025-06-01', '2025-06-10')
    // 5 cold days contribute 0, 5 days × 7
    expect(result?.gdd).toBe(35)
  })

  it('falls back to (max+min)/2 when the daily mean is missing', () => {
    const season = buildSeason(
      2025,
      overrideRange('2025-06-01', '2025-06-10', { tempMeanC: null, tempMaxC: 20, tempMinC: 10 })
    )
    const result = accumulateGdd(season.days, 5, '2025-06-01', '2025-06-10')
    // mean = 15 → 10 × 10
    expect(result?.gdd).toBe(100)
  })

  it('returns null when coverage is too thin', () => {
    const season = buildSeason(
      2025,
      overrideRange('2025-06-01', '2025-06-07', { tempMeanC: null, tempMaxC: null, tempMinC: null })
    )
    // 3 of 10 days have data — far below the 80% coverage floor.
    expect(accumulateGdd(season.days, 5, '2025-06-01', '2025-06-10')).toBeNull()
  })

  it('returns null for an inverted window', () => {
    const season = buildSeason(2025)
    expect(accumulateGdd(season.days, 5, '2025-06-10', '2025-06-01')).toBeNull()
  })
})

describe('soilTempOn', () => {
  it('returns the soil temperature for the exact date', () => {
    const season = buildSeason(2025, { '2025-03-10': { soilTempMean0to7C: 4.2 } })
    expect(soilTempOn(season.days, '2025-03-10')).toBe(4.2)
  })

  it('returns null when the date has no record or no reading', () => {
    const season = buildSeason(2025, { '2025-03-10': { soilTempMean0to7C: null } })
    expect(soilTempOn(season.days, '2025-03-10')).toBeNull()
    expect(soilTempOn(season.days, '2030-01-01')).toBeNull()
  })
})

describe('firstSoilTempAtOrAbove', () => {
  it('finds the start of the first 3-day run at/above the threshold', () => {
    const season = buildSeason(2025, {
      ...overrideRange('2025-03-01', '2025-03-31', { soilTempMean0to7C: 4 }),
      // A single warm blip must not count.
      '2025-03-15': { soilTempMean0to7C: 8 },
      ...overrideRange('2025-04-01', '2025-04-30', { soilTempMean0to7C: 7.5 }),
    })
    expect(firstSoilTempAtOrAbove(season.days, 7, '2025-03-01')).toBe('2025-04-01')
  })

  it('treats a missing reading as breaking the run', () => {
    const season = buildSeason(2025, {
      ...overrideRange('2025-03-01', '2025-03-31', { soilTempMean0to7C: 4 }),
      ...overrideRange('2025-04-01', '2025-04-30', { soilTempMean0to7C: 7.5 }),
      '2025-04-02': { soilTempMean0to7C: null },
    })
    expect(firstSoilTempAtOrAbove(season.days, 7, '2025-03-01')).toBe('2025-04-03')
  })

  it('returns null when the threshold is never sustained', () => {
    const season = buildSeason(2025, overrideRange('2025-01-01', '2025-12-31', { soilTempMean0to7C: 4 }))
    expect(firstSoilTempAtOrAbove(season.days, 7, '2025-01-01')).toBeNull()
  })
})

describe('findDrySpells', () => {
  it('finds a spell of consecutive dry days with its rain total', () => {
    const season = buildSeason(2025, overrideRange('2025-07-02', '2025-07-19', { precipitationMm: 0.1 }))
    const spells = findDrySpells(season.days, 14)
    expect(spells).toEqual([
      { start: '2025-07-02', end: '2025-07-19', lengthDays: 18, totalRainMm: 1.8 },
    ])
  })

  it('ignores spells shorter than the minimum', () => {
    const season = buildSeason(2025, overrideRange('2025-07-02', '2025-07-10', { precipitationMm: 0 }))
    expect(findDrySpells(season.days, 14)).toEqual([])
  })

  it('breaks a spell on a missing precipitation reading', () => {
    const season = buildSeason(2025, {
      ...overrideRange('2025-07-01', '2025-07-30', { precipitationMm: 0 }),
      '2025-07-15': { precipitationMm: null },
    })
    const spells = findDrySpells(season.days, 14)
    // 1–14 July is 14 days; 16–30 July is 15 days.
    expect(spells.map((s) => [s.start, s.end])).toEqual([
      ['2025-07-01', '2025-07-14'],
      ['2025-07-16', '2025-07-30'],
    ])
  })

  it('breaks a spell on a wet day (> 1mm)', () => {
    const season = buildSeason(2025, {
      ...overrideRange('2025-07-01', '2025-07-20', { precipitationMm: 0.5 }),
      '2025-07-10': { precipitationMm: 6 },
    })
    expect(findDrySpells(season.days, 14)).toEqual([])
  })
})

describe('monthlyWaterBalance', () => {
  it('computes rain minus ET0 for a fully-covered month', () => {
    const season = buildSeason(2025, overrideRange('2025-07-01', '2025-07-31', { precipitationMm: 0.5, et0Mm: 3 }))
    expect(monthlyWaterBalance(season, 7)).toEqual({
      month: 7,
      rainMm: 15.5,
      et0Mm: 93,
      balanceMm: -77.5,
    })
  })

  it('returns null when either series lacks coverage', () => {
    const season = buildSeason(2025, overrideRange('2025-07-01', '2025-07-10', { et0Mm: null }))
    expect(monthlyWaterBalance(season, 7)).toBeNull()
  })
})

describe('countHeatStressDays', () => {
  it('counts days at or above the threshold', () => {
    const season = buildSeason(2025, {
      '2025-06-10': { tempMaxC: 30 },
      '2025-06-15': { tempMaxC: 31.5 },
      '2025-06-20': { tempMaxC: 30 },
    })
    const result = countHeatStressDays(season.days, 30, '2025-06-01', '2025-06-30')
    expect(result?.count).toBe(3)
    expect(result?.dates).toEqual(['2025-06-10', '2025-06-15', '2025-06-20'])
  })

  it('returns null when max-temperature coverage is too thin', () => {
    const season = buildSeason(2025, overrideRange('2025-06-01', '2025-06-20', { tempMaxC: null }))
    expect(countHeatStressDays(season.days, 30, '2025-06-01', '2025-06-30')).toBeNull()
  })
})

describe('frostDaysInWindow', () => {
  it('returns frost dates and the coldest minimum', () => {
    const season = buildSeason(2025, {
      '2025-05-12': { tempMinC: -1.3 },
      '2025-05-14': { tempMinC: 0 },
    })
    expect(frostDaysInWindow(season.days, '2025-05-05', '2025-05-31')).toEqual({
      dates: ['2025-05-12', '2025-05-14'],
      minTempC: -1.3,
    })
  })

  it('returns null when no frost occurred in the window', () => {
    const season = buildSeason(2025)
    expect(frostDaysInWindow(season.days, '2025-05-05', '2025-05-31')).toBeNull()
  })
})

describe('daysToGermination', () => {
  const planting: Planting = { id: 'p1', plantId: 'peas', sowDate: '2025-03-10' }
  const log = (overrides: Partial<CareLogEntry>): CareLogEntry => ({
    id: 'log-1',
    type: 'germinated',
    date: '2025-04-03',
    plantingId: 'p1',
    ...overrides,
  })

  it('measures sow → earliest germination log for the planting', () => {
    const logs = [log({ id: 'a', date: '2025-04-05' }), log({ id: 'b', date: '2025-04-03' })]
    expect(daysToGermination(planting, logs)).toEqual({
      sowDate: '2025-03-10',
      germinatedDate: '2025-04-03',
      days: 24,
    })
  })

  it('ignores germination logs for other plantings or before sowing', () => {
    expect(daysToGermination(planting, [log({ plantingId: 'other' })])).toBeNull()
    expect(daysToGermination(planting, [log({ date: '2025-03-01' })])).toBeNull()
  })

  it('returns null without a sow date or without a germination log', () => {
    expect(daysToGermination({ id: 'p2', plantId: 'peas' }, [log({ plantingId: 'p2' })])).toBeNull()
    expect(daysToGermination(planting, [log({ type: 'observation' })])).toBeNull()
  })

  it('treats an unparseable sow date as missing data, not a negative interval', () => {
    // Sorts before the log date so the entry still matches, but doesn't parse.
    const mangled: Planting = { id: 'p1', plantId: 'peas', sowDate: '2025-04-99' }
    expect(daysToGermination(mangled, [log({ date: '2025-05-01' })])).toBeNull()
  })
})

describe('computeMonthlyActuals', () => {
  it('aggregates monthly mean temperature, rain and sunshine totals', () => {
    const season = buildSeason(2025, overrideRange('2025-06-01', '2025-06-30', { tempMeanC: 14, precipitationMm: 1, sunshineHours: 6 }))
    const june = computeMonthlyActuals(season).find((m) => m.month === 6)
    expect(june).toEqual({ month: 6, meanTempC: 14, rainfallMm: 30, sunshineHours: 180 })
  })

  it('nulls metrics without enough coverage', () => {
    const season = buildSeason(2025, {
      ...overrideRange('2025-06-01', '2025-06-15', { tempMeanC: null }),
      ...overrideRange('2025-06-01', '2025-06-05', { tempMeanC: null, precipitationMm: null }),
    })
    const june = computeMonthlyActuals(season).find((m) => m.month === 6)
    // 15 days of temp (< 20 needed), 25/30 rain days (< 90% coverage).
    expect(june?.meanTempC).toBeNull()
    expect(june?.rainfallMm).toBeNull()
    expect(june?.sunshineHours).toBe(150)
  })
})

describe('computeMonthlyAnomalies', () => {
  const baseline: WeatherBaseline = {
    startYear: 2015,
    endYear: 2024,
    yearsUsed: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    months: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      meanTempC: 14,
      totalRainfallMm: 60,
      sunshineHours: 150,
      yearsUsed: 10,
    })),
    computedAt: '2026-01-01T00:00:00Z',
  }

  it('computes temperature delta and rain/sunshine ratios', () => {
    const season = buildSeason(2025, overrideRange('2025-06-01', '2025-06-30', { tempMeanC: 12.2, precipitationMm: 1, sunshineHours: 2 }))
    const june = computeMonthlyAnomalies(computeMonthlyActuals(season), baseline).find(
      (m) => m.month === 6
    )
    expect(june?.tempDeltaC).toBe(-1.8)
    expect(june?.rainRatio).toBe(0.5)
    expect(june?.sunshineRatio).toBe(0.4)
  })

  it('nulls comparisons when either side is missing', () => {
    const season = buildSeason(2025, overrideRange('2025-06-01', '2025-06-30', { tempMeanC: null, tempMaxC: null, tempMinC: null }))
    const noTempBaseline: WeatherBaseline = {
      ...baseline,
      months: baseline.months.map((m) => (m.month === 7 ? { ...m, totalRainfallMm: null } : m)),
    }
    const anomalies = computeMonthlyAnomalies(computeMonthlyActuals(season), noTempBaseline)
    expect(anomalies.find((m) => m.month === 6)?.tempDeltaC).toBeNull()
    expect(anomalies.find((m) => m.month === 7)?.rainRatio).toBeNull()
  })

  it('refuses a rain ratio against a near-zero baseline month', () => {
    const dryBaseline: WeatherBaseline = {
      ...baseline,
      months: baseline.months.map((m) => ({ ...m, totalRainfallMm: 2 })),
    }
    const season = buildSeason(2025)
    const anomalies = computeMonthlyAnomalies(computeMonthlyActuals(season), dryBaseline)
    expect(anomalies.every((m) => m.rainRatio === null)).toBe(true)
  })
})
