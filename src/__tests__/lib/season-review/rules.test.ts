import { describe, it, expect } from 'vitest'
import type { SeasonDailyRecord, SeasonWeather } from '@/lib/weather/open-meteo-archive'
import type { WeatherBaseline } from '@/lib/weather/weather-baseline'
import type {
  Area,
  CareLogEntry,
  Planting,
  SeasonRecord,
} from '@/types/unified-allotment'
import { sortFindings, type Finding } from '@/lib/season-review/findings'
import {
  computePlantingMetrics,
  evaluateSeason,
  type SeasonReviewInput,
} from '@/lib/season-review/rules'

const YEAR = 2025

// ---------------------------------------------------------------------------
// Fixtures — a synthetic plot, season and weather the rules run over.
// ---------------------------------------------------------------------------

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

function buildWeather(
  overrides: Record<string, Partial<SeasonDailyRecord>> = {}
): SeasonWeather {
  const days = datesBetween(`${YEAR}-01-01`, `${YEAR}-12-31`).map((date) =>
    makeDay(date, overrides[date])
  )
  return { year: YEAR, days, complete: true, fetchedAt: '2026-01-01T00:00:00Z' }
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

/** Baseline matching the fixture weather's defaults, so only crafted deviations flag. */
function makeBaseline(
  perMonth: Partial<Record<number, { meanTempC?: number; totalRainfallMm?: number; sunshineHours?: number }>> = {}
): WeatherBaseline {
  return {
    startYear: YEAR - 10,
    endYear: YEAR - 1,
    yearsUsed: Array.from({ length: 10 }, (_, i) => YEAR - 10 + i),
    months: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      meanTempC: 12,
      totalRainfallMm: 62,
      sunshineHours: 155,
      yearsUsed: 10,
      ...perMonth[i + 1],
    })),
    computedAt: '2026-01-01T00:00:00Z',
  }
}

const BED_A: Area = {
  id: 'bed-a',
  name: 'Bed A',
  kind: 'rotation-bed',
  canHavePlantings: true,
}

function makeInput(overrides: Partial<SeasonReviewInput> = {}): SeasonReviewInput {
  return {
    year: YEAR,
    areas: [BED_A],
    seasonRecord: null,
    weather: null,
    baseline: null,
    ...overrides,
  }
}

function makeSeasonRecord(plantings: Planting[], careLogs: CareLogEntry[] = []): SeasonRecord {
  return {
    year: YEAR,
    status: 'historical',
    areas: [{ areaId: 'bed-a', plantings, careLogs }],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

function byRule(findings: Finding[], ruleId: string): Finding[] {
  return findings.filter((f) => f.ruleId === ruleId)
}

// ---------------------------------------------------------------------------
// R1 cold-soil-sowing
// ---------------------------------------------------------------------------

describe('rule: cold-soil-sowing', () => {
  // Peas need 5°C soil; keep it at 3.5°C through March, warm from 1 April.
  const coldMarchWeather = () =>
    buildWeather({
      ...overrideRange(`${YEAR}-03-01`, `${YEAR}-03-31`, { soilTempMean0to7C: 3.5 }),
      ...overrideRange(`${YEAR}-04-01`, `${YEAR}-04-30`, { soilTempMean0to7C: 6 }),
    })
  const peas: Planting = {
    id: 'peas-1',
    plantId: 'peas',
    sowDate: `${YEAR}-03-10`,
    sowMethod: 'outdoor',
  }

  it('flags an outdoor sowing into too-cold soil, with the recovery date and germination interval', () => {
    const germinated: CareLogEntry = {
      id: 'g1',
      type: 'germinated',
      date: `${YEAR}-04-03`,
      plantingId: 'peas-1',
    }
    const findings = evaluateSeason(
      makeInput({
        weather: coldMarchWeather(),
        seasonRecord: makeSeasonRecord([peas], [germinated]),
      })
    )
    const [finding] = byRule(findings, 'cold-soil-sowing')
    expect(finding).toBeDefined()
    expect(finding.severity).toBe('warning')
    expect(finding.summary).toContain('3.5°C')
    expect(finding.summary).toContain('22 days later')
    expect(finding.summary).toContain('Germination took 24 days (typically ~10)')
    expect(finding.metrics).toMatchObject({
      sowDate: `${YEAR}-03-10`,
      soilTempAtSowC: 3.5,
      minSoilTempGerminationC: 5,
      soilReachedThresholdOn: `${YEAR}-04-01`,
      daysUntilSoilReached: 22,
      actualDaysToGerminate: 24,
      typicalDaysToGerminate: 10,
    })
    expect(finding.entities[0]).toMatchObject({
      areaId: 'bed-a',
      areaName: 'Bed A',
      plantingId: 'peas-1',
      plantId: 'peas',
    })
    // The same planting is not double-reported by slow-germination.
    expect(byRule(findings, 'slow-germination')).toEqual([])
  })

  it('stays silent when the soil was warm enough at sowing', () => {
    const findings = evaluateSeason(
      makeInput({
        weather: buildWeather(), // 10°C soil everywhere
        seasonRecord: makeSeasonRecord([peas]),
      })
    )
    expect(byRule(findings, 'cold-soil-sowing')).toEqual([])
  })

  it('stays silent for indoor sowings and when the sow-date soil reading is missing', () => {
    const indoor: Planting = { ...peas, id: 'peas-2', sowMethod: 'indoor' }
    const noReading = buildWeather({ [`${YEAR}-03-10`]: { soilTempMean0to7C: null } })
    const findings = evaluateSeason(
      makeInput({
        weather: noReading,
        seasonRecord: makeSeasonRecord([indoor, { ...peas, id: 'peas-3' }]),
      })
    )
    expect(byRule(findings, 'cold-soil-sowing')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// R2 slow-germination
// ---------------------------------------------------------------------------

describe('rule: slow-germination', () => {
  it('flags germination far beyond typical (works without weather)', () => {
    // Carrots typically germinate in ~16 days; 30 days ≥ 1.5× and ≥ +5.
    const carrot: Planting = { id: 'c1', plantId: 'carrot', sowDate: `${YEAR}-04-01`, sowMethod: 'outdoor' }
    const log: CareLogEntry = { id: 'g1', type: 'germinated', date: `${YEAR}-05-01`, plantingId: 'c1' }
    const findings = evaluateSeason(makeInput({ seasonRecord: makeSeasonRecord([carrot], [log]) }))
    const [finding] = byRule(findings, 'slow-germination')
    expect(finding).toBeDefined()
    expect(finding.severity).toBe('notice')
    expect(finding.metrics).toMatchObject({ actualDaysToGerminate: 30, typicalDaysToGerminate: 16 })
  })

  it('stays silent for germination within the normal range', () => {
    const carrot: Planting = { id: 'c1', plantId: 'carrot', sowDate: `${YEAR}-04-01` }
    const log: CareLogEntry = { id: 'g1', type: 'germinated', date: `${YEAR}-04-19`, plantingId: 'c1' }
    const findings = evaluateSeason(makeInput({ seasonRecord: makeSeasonRecord([carrot], [log]) }))
    expect(byRule(findings, 'slow-germination')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// R3 frost-after-tender-planting
// ---------------------------------------------------------------------------

describe('rule: frost-after-tender-planting', () => {
  it('flags a frost shortly after a tender crop went outside', () => {
    const courgette: Planting = { id: 'z1', plantId: 'courgette', transplantDate: `${YEAR}-05-05` }
    const weather = buildWeather({ [`${YEAR}-05-12`]: { tempMinC: -1.3 } })
    const findings = evaluateSeason(
      makeInput({ weather, seasonRecord: makeSeasonRecord([courgette]) })
    )
    const [finding] = byRule(findings, 'frost-after-tender-planting')
    expect(finding).toBeDefined()
    expect(finding.severity).toBe('warning')
    expect(finding.summary).toContain('12 May')
    expect(finding.metrics).toMatchObject({ firstFrostDate: `${YEAR}-05-12`, minTempC: -1.3, frostDays: 1 })
  })

  it('stays silent for frost-tolerant crops and frosts outside the window', () => {
    const peas: Planting = { id: 'p1', plantId: 'peas', sowDate: `${YEAR}-03-10`, sowMethod: 'outdoor' }
    const courgette: Planting = { id: 'z1', plantId: 'courgette', transplantDate: `${YEAR}-05-05` }
    // Frost in March (before courgettes were out) and late August (past the 45-day window).
    const weather = buildWeather({
      [`${YEAR}-03-12`]: { tempMinC: -2 },
      [`${YEAR}-08-20`]: { tempMinC: -1 },
    })
    const findings = evaluateSeason(
      makeInput({ weather, seasonRecord: makeSeasonRecord([peas, courgette]) })
    )
    expect(byRule(findings, 'frost-after-tender-planting')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// R4 heat-stress
// ---------------------------------------------------------------------------

describe('rule: heat-stress', () => {
  const lettuce: Planting = {
    id: 'l1',
    plantId: 'lettuce',
    transplantDate: `${YEAR}-06-01`,
    endedOn: `${YEAR}-07-31`,
  }
  // Lettuce stresses at 24°C.
  const hotJune = () =>
    buildWeather({
      [`${YEAR}-06-10`]: { tempMaxC: 25 },
      [`${YEAR}-06-11`]: { tempMaxC: 26 },
      [`${YEAR}-06-12`]: { tempMaxC: 27 },
      [`${YEAR}-07-02`]: { tempMaxC: 24 },
    })

  it('flags enough hot days for a heat-sensitive crop', () => {
    const findings = evaluateSeason(
      makeInput({ weather: hotJune(), seasonRecord: makeSeasonRecord([lettuce]) })
    )
    const [finding] = byRule(findings, 'heat-stress')
    expect(finding).toBeDefined()
    expect(finding.severity).toBe('notice')
    expect(finding.metrics).toMatchObject({ heatStressDays: 4, heatStressTempC: 24 })
  })

  it('escalates to warning when bolting was logged in the window', () => {
    const bolted: CareLogEntry = { id: 'b1', type: 'bolted', date: `${YEAR}-07-05`, plantingId: 'l1' }
    const findings = evaluateSeason(
      makeInput({ weather: hotJune(), seasonRecord: makeSeasonRecord([lettuce], [bolted]) })
    )
    const [finding] = byRule(findings, 'heat-stress')
    expect(finding.severity).toBe('warning')
    expect(finding.summary).toContain('bolting on 5 Jul')
    expect(finding.metrics.boltedOn).toBe(`${YEAR}-07-05`)
  })

  it('stays silent below the day-count threshold and after the planting ended', () => {
    // Two hot days in the window; a third scorcher lands after endedOn.
    const weather = buildWeather({
      [`${YEAR}-06-10`]: { tempMaxC: 25 },
      [`${YEAR}-06-11`]: { tempMaxC: 26 },
      [`${YEAR}-08-10`]: { tempMaxC: 30 },
    })
    const findings = evaluateSeason(
      makeInput({ weather, seasonRecord: makeSeasonRecord([lettuce]) })
    )
    expect(byRule(findings, 'heat-stress')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// R5/R6/R10 monthly anomalies vs baseline
// ---------------------------------------------------------------------------

describe('rules: monthly anomalies vs baseline', () => {
  it('flags a month markedly colder than the baseline', () => {
    const weather = buildWeather(overrideRange(`${YEAR}-06-01`, `${YEAR}-06-30`, { tempMeanC: 10.2 }))
    const findings = evaluateSeason(makeInput({ weather, baseline: makeBaseline() }))
    const june = byRule(findings, 'temp-anomaly').find((f) => f.metrics.month === 6)
    expect(june).toBeDefined()
    expect(june?.summary).toBe(
      'June averaged 10.2°C — 1.8°C below your 10-year average of 12°C.'
    )
    expect(june?.severity).toBe('info')
  })

  it('flags a much drier month as a notice and a much wetter one as info', () => {
    const weather = buildWeather({
      ...overrideRange(`${YEAR}-06-01`, `${YEAR}-06-30`, { precipitationMm: 1 }),
      ...overrideRange(`${YEAR}-08-01`, `${YEAR}-08-31`, { precipitationMm: 4 }),
    })
    const findings = evaluateSeason(makeInput({ weather, baseline: makeBaseline() }))
    const june = byRule(findings, 'rain-anomaly').find((f) => f.metrics.month === 6)
    const august = byRule(findings, 'rain-anomaly').find((f) => f.metrics.month === 8)
    expect(june?.severity).toBe('notice')
    expect(june?.summary).toContain('drier')
    expect(june?.metrics).toMatchObject({ actualRainMm: 30, baselineRainMm: 62 })
    expect(august?.severity).toBe('info')
    expect(august?.summary).toContain('wetter')
  })

  it('flags a notably dull summer month', () => {
    const weather = buildWeather(overrideRange(`${YEAR}-06-01`, `${YEAR}-06-30`, { sunshineHours: 2 }))
    const findings = evaluateSeason(makeInput({ weather, baseline: makeBaseline() }))
    const [finding] = byRule(findings, 'dull-month')
    expect(finding).toBeDefined()
    expect(finding.metrics).toMatchObject({ month: 6, actualSunshineHours: 60, baselineSunshineHours: 155 })
    expect(finding.summary).toContain('less sunshine')
  })

  it('emits no anomaly findings when weather matches the baseline, or without a baseline', () => {
    expect(
      evaluateSeason(makeInput({ weather: buildWeather(), baseline: makeBaseline() }))
    ).toEqual([])
    expect(
      evaluateSeason(
        makeInput({
          weather: buildWeather(overrideRange(`${YEAR}-06-01`, `${YEAR}-06-30`, { tempMeanC: 2 })),
        })
      )
    ).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// R7 dry-spell
// ---------------------------------------------------------------------------

describe('rule: dry-spell', () => {
  const drySummer = () =>
    buildWeather(overrideRange(`${YEAR}-07-02`, `${YEAR}-07-19`, { precipitationMm: 0.1 }))
  const water = (id: string, date: string): CareLogEntry => ({ id, type: 'water', date })

  it('reports a growing-season dry spell with the watering logs during it', () => {
    const logs = [
      water('w1', `${YEAR}-07-05`),
      water('w2', `${YEAR}-07-10`),
      water('w3', `${YEAR}-07-15`),
      water('w4', `${YEAR}-07-18`),
    ]
    const findings = evaluateSeason(
      makeInput({ weather: drySummer(), seasonRecord: makeSeasonRecord([], logs) })
    )
    const [finding] = byRule(findings, 'dry-spell')
    expect(finding).toBeDefined()
    expect(finding.severity).toBe('notice')
    expect(finding.summary).toContain('18-day dry spell')
    expect(finding.summary).toContain('watering 4 times')
    expect(finding.metrics).toMatchObject({ lengthDays: 18, totalRainMm: 1.8, wateringsLogged: 4 })
  })

  it('escalates when the season has watering logs but none during the spell', () => {
    const logs = [water('w1', `${YEAR}-05-01`)]
    const findings = evaluateSeason(
      makeInput({ weather: drySummer(), seasonRecord: makeSeasonRecord([], logs) })
    )
    const [finding] = byRule(findings, 'dry-spell')
    expect(finding.severity).toBe('warning')
    expect(finding.summary).toContain('No watering was logged')
  })

  it('never comments on watering when the user logs no watering at all', () => {
    const findings = evaluateSeason(
      makeInput({ weather: drySummer(), seasonRecord: makeSeasonRecord([]) })
    )
    const [finding] = byRule(findings, 'dry-spell')
    expect(finding.severity).toBe('notice')
    expect(finding.summary).not.toContain('watering')
    expect(finding.metrics.wateringsLogged).toBeUndefined()
  })

  it('ignores watering logs from other years when judging the spell', () => {
    // A stray watering entry dated last year must not trigger the false
    // warning that this year's spell went unwatered.
    const strayLog = water('w0', `${YEAR - 1}-07-05`)
    const findings = evaluateSeason(
      makeInput({ weather: drySummer(), seasonRecord: makeSeasonRecord([], [strayLog]) })
    )
    const [finding] = byRule(findings, 'dry-spell')
    expect(finding.severity).toBe('notice')
    expect(finding.summary).not.toContain('watering')
  })

  it('ignores dry spells outside the growing season', () => {
    const winterDry = buildWeather(
      overrideRange(`${YEAR}-01-05`, `${YEAR}-01-25`, { precipitationMm: 0 })
    )
    const findings = evaluateSeason(makeInput({ weather: winterDry }))
    expect(byRule(findings, 'dry-spell')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// R8 water-deficit
// ---------------------------------------------------------------------------

describe('rule: water-deficit', () => {
  it('flags a summer month where ET0 far outran rainfall', () => {
    // Rain stays at 2mm/day but never a dry spell; ET0 climbs to 5mm/day.
    const weather = buildWeather(overrideRange(`${YEAR}-07-01`, `${YEAR}-07-31`, { et0Mm: 5 }))
    const findings = evaluateSeason(makeInput({ weather }))
    const [finding] = byRule(findings, 'water-deficit')
    expect(finding).toBeDefined()
    expect(finding.metrics).toMatchObject({ month: 7, rainMm: 62, et0Mm: 155, balanceMm: -93 })
    expect(finding.summary).toContain('93mm deficit')
  })

  it('stays silent when the balance is mild or coverage is thin', () => {
    const mild = evaluateSeason(makeInput({ weather: buildWeather() }))
    expect(byRule(mild, 'water-deficit')).toEqual([])
    const gappy = buildWeather({
      ...overrideRange(`${YEAR}-07-01`, `${YEAR}-07-31`, { et0Mm: 5 }),
      ...overrideRange(`${YEAR}-07-01`, `${YEAR}-07-10`, { et0Mm: null }),
    })
    expect(byRule(evaluateSeason(makeInput({ weather: gappy })), 'water-deficit')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// R9 pest-disease-cluster
// ---------------------------------------------------------------------------

describe('rule: pest-disease-cluster', () => {
  const pest = (id: string, date: string, severity?: 1 | 2 | 3): CareLogEntry => ({
    id,
    type: 'pest',
    date,
    ...(severity ? { severity } : {}),
  })

  it('flags 3+ same-type observations in one bed within 30 days (no weather needed)', () => {
    const logs = [
      pest('p1', `${YEAR}-06-03`, 1),
      pest('p2', `${YEAR}-06-12`, 2),
      pest('p3', `${YEAR}-06-28`, 2),
    ]
    const findings = evaluateSeason(makeInput({ seasonRecord: makeSeasonRecord([], logs) }))
    const [finding] = byRule(findings, 'pest-disease-cluster')
    expect(finding).toBeDefined()
    expect(finding.severity).toBe('notice')
    expect(finding.summary).toContain('3 pest observations')
    expect(finding.summary).toContain('Bed A')
    expect(finding.metrics).toMatchObject({ observationCount: 3, maxSeverity: 2 })
  })

  it('escalates to warning when any observation was severe', () => {
    const logs = [
      pest('p1', `${YEAR}-06-03`, 1),
      pest('p2', `${YEAR}-06-12`, 3),
      pest('p3', `${YEAR}-06-20`, 1),
    ]
    const findings = evaluateSeason(makeInput({ seasonRecord: makeSeasonRecord([], logs) }))
    expect(byRule(findings, 'pest-disease-cluster')[0]?.severity).toBe('warning')
  })

  it('picks the largest 30-day run when logs straggle beyond the window', () => {
    // 5 logs over 6 weeks: the densest 30-day window holds the middle four.
    const logs = [
      pest('p1', `${YEAR}-06-01`),
      pest('p2', `${YEAR}-06-20`),
      pest('p3', `${YEAR}-06-25`),
      pest('p4', `${YEAR}-07-01`),
      pest('p5', `${YEAR}-07-15`),
    ]
    const findings = evaluateSeason(makeInput({ seasonRecord: makeSeasonRecord([], logs) }))
    const [finding] = byRule(findings, 'pest-disease-cluster')
    expect(finding.metrics).toMatchObject({
      observationCount: 4,
      firstDate: `${YEAR}-06-20`,
      lastDate: `${YEAR}-07-15`,
    })
  })

  it('does not mix types or count logs spread beyond the window', () => {
    const logs = [
      pest('p1', `${YEAR}-04-01`),
      pest('p2', `${YEAR}-06-01`),
      pest('p3', `${YEAR}-08-01`),
      { id: 'd1', type: 'disease', date: `${YEAR}-06-02` } as CareLogEntry,
      { id: 'd2', type: 'disease', date: `${YEAR}-06-03` } as CareLogEntry,
    ]
    const findings = evaluateSeason(makeInput({ seasonRecord: makeSeasonRecord([], logs) }))
    expect(byRule(findings, 'pest-disease-cluster')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Engine behaviour
// ---------------------------------------------------------------------------

describe('evaluateSeason', () => {
  it('emits nothing for a sparse season: plantings without dates, no logs, no weather, no baseline', () => {
    const undated: Planting = { id: 'u1', plantId: 'peas' }
    const findings = evaluateSeason(makeInput({ seasonRecord: makeSeasonRecord([undated]) }))
    expect(findings).toEqual([])
  })

  it('emits nothing when there is no data at all', () => {
    expect(evaluateSeason(makeInput())).toEqual([])
  })

  it('orders findings most severe first', () => {
    const findings: Finding[] = [
      { id: 'a', ruleId: 'r', severity: 'info', summary: '', metrics: {}, entities: [] },
      { id: 'b', ruleId: 'r', severity: 'warning', summary: '', metrics: {}, entities: [] },
      { id: 'c', ruleId: 'r', severity: 'notice', summary: '', metrics: {}, entities: [] },
    ]
    expect(sortFindings(findings).map((f) => f.severity)).toEqual(['warning', 'notice', 'info'])
  })
})

// ---------------------------------------------------------------------------
// Per-planting metrics for the review page
// ---------------------------------------------------------------------------

describe('computePlantingMetrics', () => {
  it('computes soil-at-sow, GDD and germination for a dated planting', () => {
    const peas: Planting = {
      id: 'p1',
      plantId: 'peas',
      sowDate: `${YEAR}-04-01`,
      sowMethod: 'outdoor',
      endedOn: `${YEAR}-04-30`,
    }
    const log: CareLogEntry = { id: 'g1', type: 'germinated', date: `${YEAR}-04-11`, plantingId: 'p1' }
    const [metrics] = computePlantingMetrics(
      makeInput({ weather: buildWeather(), seasonRecord: makeSeasonRecord([peas], [log]) })
    )
    expect(metrics).toMatchObject({
      plantingId: 'p1',
      areaName: 'Bed A',
      soilTempAtSowC: 10,
      gddBaseTempC: 5,
      typicalDaysToGerminate: 10,
    })
    // 30 days (1–30 Apr inclusive) × (12 − 5).
    expect(metrics.gdd).toEqual({ gdd: 210, daysWithData: 30, windowDays: 30 })
    expect(metrics.germination?.days).toBe(10)
  })

  it('skips plantings with no dates this year and degrades without weather', () => {
    const undated: Planting = { id: 'u1', plantId: 'peas' }
    const dated: Planting = { id: 'd1', plantId: 'carrot', sowDate: `${YEAR}-04-01`, sowMethod: 'outdoor' }
    const results = computePlantingMetrics(
      makeInput({ seasonRecord: makeSeasonRecord([undated, dated]) })
    )
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ plantingId: 'd1', soilTempAtSowC: null, gdd: null })
  })
})
