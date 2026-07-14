/**
 * Season Observer rules engine (Phase 2b).
 *
 * Deterministic rules over the derived metrics (metrics.ts), the crop
 * agronomy reference (agronomy.ts), and the season's logged plantings and
 * care logs. `evaluateSeason` emits a structured findings[] array — no LLM,
 * no heuristics beyond the documented thresholds.
 *
 * The failure mode is a false positive: a wrong "your peas struggled" erodes
 * trust in every other finding. So every rule stays silent unless its inputs
 * are complete — missing weather, a planting without dates, a metric that
 * returned null for thin coverage, all mean "no finding", never a guess.
 * Every number in a summary comes from a tested metric function or the
 * agronomy table.
 */

import { getCropAgronomy, type CropAgronomy } from '@/lib/agronomy'
import { getVegetableById } from '@/lib/vegetable-database'
import type { SeasonWeather } from '@/lib/weather/open-meteo-archive'
import type { WeatherBaseline } from '@/lib/weather/weather-baseline'
import type {
  Area,
  CareLogEntry,
  Planting,
  SeasonRecord,
} from '@/types/unified-allotment'
import type { Finding, FindingEntity } from './findings'
import { sortFindings } from './findings'
import {
  accumulateGdd,
  computeMonthlyActuals,
  computeMonthlyAnomalies,
  countHeatStressDays,
  daySpan,
  daysToGermination,
  findDrySpells,
  firstSoilTempAtOrAbove,
  frostDaysInWindow,
  monthlyWaterBalance,
  soilTempOn,
  type GddAccumulation,
  type GerminationInterval,
} from './metrics'

// ---------------------------------------------------------------------------
// Thresholds. Each is the line between "normal season noise" and "worth a
// finding" — deliberately conservative, and in one place so they're easy to
// tune as real seasons calibrate them.
// ---------------------------------------------------------------------------

/** Soil must be at least this far (°C) below the crop's minimum to flag a sowing. */
const COLD_SOIL_MARGIN_C = 1
/** Germination must take ≥ typical × this AND ≥ typical + 5 days to flag. */
const SLOW_GERMINATION_RATIO = 1.5
const SLOW_GERMINATION_MIN_EXTRA_DAYS = 5
/** Days after planting-out during which a frost counts as "caught the young plant". */
const TENDER_FROST_WINDOW_DAYS = 45
/** Heat-stress days within a planting's window before it's worth reporting. */
const MIN_HEAT_STRESS_DAYS = 3
/** Monthly mean temperature must deviate ≥ this (°C) from baseline to flag. */
const TEMP_ANOMALY_C = 1.5
/** Month rainfall ≤ this fraction of baseline = notably dry. */
const DRY_MONTH_RATIO = 0.5
/** Month rainfall ≥ this multiple of baseline = notably wet. */
const WET_MONTH_RATIO = 1.8
/** Month sunshine ≤ this fraction of baseline = notably dull. */
const DULL_MONTH_RATIO = 0.7
/** Consecutive dry days before a spell is reported. */
const DRY_SPELL_MIN_DAYS = 14
/** Monthly rain − ET0 at or below this (mm) = notable water deficit. */
const WATER_DEFICIT_MM = -60
/** Pest/disease logs of one type in one bed within this window = a cluster. */
const CLUSTER_WINDOW_DAYS = 30
const CLUSTER_MIN_LOGS = 3
/** Growing-season months (inclusive) for plot-wide monthly findings. */
const GROWING_SEASON_START_MONTH = 3
const GROWING_SEASON_END_MONTH = 10

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ---------------------------------------------------------------------------
// Input assembly
// ---------------------------------------------------------------------------

/** Everything the engine reasons over. Any piece may be missing. */
export interface SeasonReviewInput {
  /** The calendar year under review. */
  year: number
  /** All areas, for resolving bed names. */
  areas: Area[]
  /** The season record for `year` (plantings + care logs), if one exists. */
  seasonRecord: SeasonRecord | null
  /** Archived daily weather for `year`, if cached/fetchable. */
  weather: SeasonWeather | null
  /** The plot's 10-year monthly baseline, if computable. */
  baseline: WeatherBaseline | null
}

/** One planting joined with its bed and the bed's care logs for the year. */
interface PlantingContext {
  planting: Planting
  area: Area | undefined
  areaId: string
  careLogs: CareLogEntry[]
  agronomy: CropAgronomy
}

function collectPlantings(input: SeasonReviewInput): PlantingContext[] {
  if (!input.seasonRecord) return []
  const contexts: PlantingContext[] = []
  for (const areaSeason of input.seasonRecord.areas) {
    const area = input.areas.find((a) => a.id === areaSeason.areaId)
    const careLogs = areaSeason.careLogs ?? []
    // plantings is required by the type, but season records travel through
    // migration/CRDT merges — guard like careLogs rather than crash.
    for (const planting of areaSeason.plantings ?? []) {
      contexts.push({
        planting,
        area,
        areaId: areaSeason.areaId,
        careLogs,
        agronomy: getCropAgronomy(planting.plantId),
      })
    }
  }
  return contexts
}

function plantingEntity(ctx: PlantingContext): FindingEntity {
  return {
    areaId: ctx.areaId,
    areaName: ctx.area?.name,
    plantingId: ctx.planting.id,
    plantId: ctx.planting.plantId,
    plantName: plantName(ctx.planting.plantId),
    varietyName: ctx.planting.varietyName,
  }
}

function plantName(plantId: string): string {
  return getVegetableById(plantId)?.name ?? plantId
}

/** "2026-05-12" → "12 May". Fixed English month names — no locale surprises. */
function formatDay(isoDate: string): string {
  const month = Number(isoDate.slice(5, 7))
  const day = Number(isoDate.slice(8, 10))
  return `${day} ${MONTH_NAMES[month - 1]?.slice(0, 3) ?? '?'}`
}

/** Null on an unparseable date — callers skip, per the stay-silent policy. */
function addDaysISO(isoDate: string, days: number): string | null {
  const parsed = Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(parsed)) return null
  return new Date(parsed + days * 86_400_000).toISOString().slice(0, 10)
}

function isInYear(date: string | undefined, year: number): date is string {
  return typeof date === 'string' && date.startsWith(`${year}-`)
}

/**
 * The date a planting first faced outdoor weather this year: its sow date
 * when direct-sown, otherwise its transplant date. Null when neither applies
 * to the reviewed year — weather rules then stay silent for the planting.
 */
function outdoorExposureDate(planting: Planting, year: number): string | null {
  if (planting.sowMethod === 'outdoor' && isInYear(planting.sowDate, year)) {
    return planting.sowDate
  }
  if (isInYear(planting.transplantDate, year)) {
    return planting.transplantDate
  }
  return null
}

/** When a planting stopped facing the weather: ended, last harvest, or last weather day. */
function windowEnd(planting: Planting, weather: SeasonWeather): string | null {
  const lastWeatherDay = weather.days[weather.days.length - 1]?.date
  if (!lastWeatherDay) return null
  const end = planting.endedOn ?? planting.actualHarvestEnd ?? lastWeatherDay
  return end < lastWeatherDay ? end : lastWeatherDay
}

// ---------------------------------------------------------------------------
// Rules — each takes the input plus shared context and returns findings.
// ---------------------------------------------------------------------------

/**
 * R1 cold-soil-sowing (warning): a crop was direct-sown outdoors while the
 * 0–7cm soil was more than COLD_SOIL_MARGIN_C below its minimum germination
 * temperature. Reports when the soil actually reached the threshold and, if
 * germination was logged, actual vs typical days.
 */
function ruleColdSoilSowing(
  input: SeasonReviewInput,
  plantings: PlantingContext[],
  flaggedPlantings: Set<string>
): Finding[] {
  if (!input.weather) return []
  const days = input.weather.days
  const findings: Finding[] = []

  for (const ctx of plantings) {
    const { planting, agronomy } = ctx
    if (planting.sowMethod !== 'outdoor' || !isInYear(planting.sowDate, input.year)) continue
    const soilAtSow = soilTempOn(days, planting.sowDate)
    if (soilAtSow === null) continue
    const minTemp = agronomy.minSoilTempGerminationC
    if (soilAtSow > minTemp - COLD_SOIL_MARGIN_C) continue

    const reached = firstSoilTempAtOrAbove(days, minTemp, planting.sowDate)
    const daysLate = reached ? daySpan(planting.sowDate, reached) - 1 : null
    const germination = daysToGermination(planting, ctx.careLogs)

    const metrics: Record<string, number | string> = {
      sowDate: planting.sowDate,
      soilTempAtSowC: soilAtSow,
      minSoilTempGerminationC: minTemp,
    }
    let summary =
      `${plantName(planting.plantId)} was sown outdoors on ${formatDay(planting.sowDate)} ` +
      `when the soil was ${soilAtSow}°C — below the ~${minTemp}°C it needs to germinate.`
    if (reached && daysLate !== null && daysLate > 0) {
      metrics.soilReachedThresholdOn = reached
      metrics.daysUntilSoilReached = daysLate
      summary += ` The soil didn't reliably reach ${minTemp}°C until ${formatDay(reached)} (${daysLate} days later).`
    }
    if (germination) {
      metrics.actualDaysToGerminate = germination.days
      metrics.typicalDaysToGerminate = agronomy.typicalDaysToGerminate
      summary += ` Germination took ${germination.days} days (typically ~${agronomy.typicalDaysToGerminate}).`
    }

    flaggedPlantings.add(planting.id)
    findings.push({
      id: `cold-soil-sowing:${input.year}:${planting.id}`,
      ruleId: 'cold-soil-sowing',
      severity: 'warning',
      summary,
      metrics,
      entities: [plantingEntity(ctx)],
      dates: { start: planting.sowDate, end: reached ?? undefined },
    })
  }
  return findings
}

/**
 * R2 slow-germination (notice): germination was logged and took markedly
 * longer than typical for the crop. Skipped when R1 already explained the
 * same planting — one story per planting.
 */
function ruleSlowGermination(
  input: SeasonReviewInput,
  plantings: PlantingContext[],
  flaggedPlantings: Set<string>
): Finding[] {
  const findings: Finding[] = []
  for (const ctx of plantings) {
    const { planting, agronomy } = ctx
    if (flaggedPlantings.has(planting.id)) continue
    if (!isInYear(planting.sowDate, input.year)) continue
    const germination = daysToGermination(planting, ctx.careLogs)
    if (!germination) continue
    const typical = agronomy.typicalDaysToGerminate
    if (
      germination.days < typical * SLOW_GERMINATION_RATIO ||
      germination.days < typical + SLOW_GERMINATION_MIN_EXTRA_DAYS
    ) {
      continue
    }
    findings.push({
      id: `slow-germination:${input.year}:${planting.id}`,
      ruleId: 'slow-germination',
      severity: 'notice',
      summary:
        `${plantName(planting.plantId)} took ${germination.days} days to germinate ` +
        `(sown ${formatDay(germination.sowDate)}, germinated ${formatDay(germination.germinatedDate)}) — ` +
        `typically ~${typical} days.`,
      metrics: {
        sowDate: germination.sowDate,
        germinatedDate: germination.germinatedDate,
        actualDaysToGerminate: germination.days,
        typicalDaysToGerminate: typical,
      },
      entities: [plantingEntity(ctx)],
      dates: { start: germination.sowDate, end: germination.germinatedDate },
    })
  }
  return findings
}

/**
 * R3 frost-after-tender-planting (warning): a frost-tender crop went outside
 * and an air frost (Tmin ≤ 0°C) hit within TENDER_FROST_WINDOW_DAYS.
 */
function ruleFrostAfterTenderPlanting(
  input: SeasonReviewInput,
  plantings: PlantingContext[]
): Finding[] {
  if (!input.weather) return []
  const findings: Finding[] = []
  for (const ctx of plantings) {
    const { planting, agronomy } = ctx
    if (agronomy.frostTolerant) continue
    const exposure = outdoorExposureDate(planting, input.year)
    if (!exposure) continue
    const end = windowEnd(planting, input.weather)
    if (!end || end < exposure) continue
    const frostWindowEnd = addDaysISO(exposure, TENDER_FROST_WINDOW_DAYS)
    if (!frostWindowEnd) continue
    const frost = frostDaysInWindow(
      input.weather.days,
      exposure,
      frostWindowEnd < end ? frostWindowEnd : end
    )
    if (!frost) continue
    const firstFrost = frost.dates[0]
    findings.push({
      id: `frost-after-tender-planting:${input.year}:${planting.id}`,
      ruleId: 'frost-after-tender-planting',
      severity: 'warning',
      summary:
        `${plantName(planting.plantId)} is frost-tender and went outside on ${formatDay(exposure)}, ` +
        `but there was an air frost on ${formatDay(firstFrost)}` +
        `${frost.dates.length > 1 ? ` (${frost.dates.length} frosts in total)` : ''} ` +
        `with a low of ${frost.minTempC}°C.`,
      metrics: {
        outdoorFrom: exposure,
        firstFrostDate: firstFrost,
        frostDays: frost.dates.length,
        minTempC: frost.minTempC,
      },
      entities: [plantingEntity(ctx)],
      dates: { start: exposure, end: frost.dates[frost.dates.length - 1] },
    })
  }
  return findings
}

/**
 * R4 heat-stress (notice; warning when bolting was logged): a heat-sensitive
 * crop faced ≥ MIN_HEAT_STRESS_DAYS days at/above its stress temperature
 * while in the ground.
 */
function ruleHeatStress(input: SeasonReviewInput, plantings: PlantingContext[]): Finding[] {
  if (!input.weather) return []
  const findings: Finding[] = []
  for (const ctx of plantings) {
    const { planting, agronomy } = ctx
    const threshold = agronomy.heatStressTempC
    if (threshold === undefined) continue
    const start =
      isInYear(planting.transplantDate, input.year)
        ? planting.transplantDate
        : planting.sowMethod === 'outdoor' && isInYear(planting.sowDate, input.year)
          ? planting.sowDate
          : null
    if (!start) continue
    const end = windowEnd(planting, input.weather)
    if (!end || end < start) continue
    const heat = countHeatStressDays(input.weather.days, threshold, start, end)
    if (!heat || heat.count < MIN_HEAT_STRESS_DAYS) continue

    const bolted = ctx.careLogs
      .filter(
        (log) =>
          log.type === 'bolted' &&
          log.plantingId === planting.id &&
          log.date >= start &&
          log.date <= end
      )
      .sort((a, b) => a.date.localeCompare(b.date))[0]

    const metrics: Record<string, number | string> = {
      heatStressDays: heat.count,
      heatStressTempC: threshold,
      windowStart: start,
      windowEnd: end,
    }
    let summary =
      `${plantName(planting.plantId)} faced ${heat.count} days at or above ${threshold}°C ` +
      `between ${formatDay(heat.dates[0])} and ${formatDay(heat.dates[heat.dates.length - 1])}.`
    if (bolted) {
      metrics.boltedOn = bolted.date
      summary += ` You logged it bolting on ${formatDay(bolted.date)}.`
    }
    findings.push({
      id: `heat-stress:${input.year}:${planting.id}`,
      ruleId: 'heat-stress',
      severity: bolted ? 'warning' : 'notice',
      summary,
      metrics,
      entities: [plantingEntity(ctx)],
      dates: { start: heat.dates[0], end: heat.dates[heat.dates.length - 1] },
    })
  }
  return findings
}

/**
 * R5 temp-anomaly (info): a growing-season month's mean temperature deviated
 * ≥ TEMP_ANOMALY_C from the 10-year baseline.
 */
function ruleTempAnomaly(input: SeasonReviewInput): Finding[] {
  if (!input.weather || !input.baseline) return []
  const anomalies = computeMonthlyAnomalies(computeMonthlyActuals(input.weather), input.baseline)
  const findings: Finding[] = []
  for (const anomaly of anomalies) {
    if (anomaly.month < GROWING_SEASON_START_MONTH || anomaly.month > GROWING_SEASON_END_MONTH) continue
    if (
      anomaly.tempDeltaC === null ||
      anomaly.actualTempC === null ||
      anomaly.baselineTempC === null ||
      Math.abs(anomaly.tempDeltaC) < TEMP_ANOMALY_C
    ) {
      continue
    }
    const direction = anomaly.tempDeltaC > 0 ? 'above' : 'below'
    findings.push({
      id: `temp-anomaly:${input.year}:${anomaly.month}`,
      ruleId: 'temp-anomaly',
      severity: 'info',
      summary:
        `${MONTH_NAMES[anomaly.month - 1]} averaged ${anomaly.actualTempC}°C — ` +
        `${Math.abs(anomaly.tempDeltaC)}°C ${direction} your 10-year average of ${anomaly.baselineTempC}°C.`,
      metrics: {
        month: anomaly.month,
        actualMeanTempC: anomaly.actualTempC,
        baselineMeanTempC: anomaly.baselineTempC,
        tempDeltaC: anomaly.tempDeltaC,
      },
      entities: [],
      dates: { start: `${input.year}-${String(anomaly.month).padStart(2, '0')}-01` },
    })
  }
  return findings
}

/**
 * R6 rain-anomaly (notice when dry, info when wet): a growing-season month's
 * rainfall was ≤ DRY_MONTH_RATIO or ≥ WET_MONTH_RATIO of the baseline.
 */
function ruleRainAnomaly(input: SeasonReviewInput): Finding[] {
  if (!input.weather || !input.baseline) return []
  const anomalies = computeMonthlyAnomalies(computeMonthlyActuals(input.weather), input.baseline)
  const findings: Finding[] = []
  for (const anomaly of anomalies) {
    if (anomaly.month < GROWING_SEASON_START_MONTH || anomaly.month > GROWING_SEASON_END_MONTH) continue
    if (anomaly.rainRatio === null || anomaly.actualRainMm === null || anomaly.baselineRainMm === null) continue
    const dry = anomaly.rainRatio <= DRY_MONTH_RATIO
    const wet = anomaly.rainRatio >= WET_MONTH_RATIO
    if (!dry && !wet) continue
    const monthName = MONTH_NAMES[anomaly.month - 1]
    findings.push({
      id: `rain-anomaly:${input.year}:${anomaly.month}`,
      ruleId: 'rain-anomaly',
      severity: dry ? 'notice' : 'info',
      summary: dry
        ? `${monthName} was much drier than usual: ${anomaly.actualRainMm}mm of rain against ` +
          `your 10-year average of ${anomaly.baselineRainMm}mm (${Math.round(anomaly.rainRatio * 100)}%).`
        : `${monthName} was much wetter than usual: ${anomaly.actualRainMm}mm of rain against ` +
          `your 10-year average of ${anomaly.baselineRainMm}mm (${Math.round(anomaly.rainRatio * 100)}%).`,
      metrics: {
        month: anomaly.month,
        actualRainMm: anomaly.actualRainMm,
        baselineRainMm: anomaly.baselineRainMm,
        rainRatio: anomaly.rainRatio,
      },
      entities: [],
      dates: { start: `${input.year}-${String(anomaly.month).padStart(2, '0')}-01` },
    })
  }
  return findings
}

/**
 * R7 dry-spell (notice; warning when no watering was logged): a run of
 * ≥ DRY_SPELL_MIN_DAYS dry days overlapping the April–September growing
 * season, cross-referenced with the season's watering logs.
 */
function ruleDrySpell(input: SeasonReviewInput): Finding[] {
  if (!input.weather) return []
  const growingStart = `${input.year}-04-01`
  const growingEnd = `${input.year}-09-30`
  const spells = findDrySpells(input.weather.days, DRY_SPELL_MIN_DAYS).filter(
    (spell) => spell.end >= growingStart && spell.start <= growingEnd
  )
  if (spells.length === 0) return []

  // Only this year's watering logs count — an out-of-year entry (backdated
  // mistake, copied log) must not make "no watering was logged" fire falsely.
  const waterLogs = (input.seasonRecord?.areas ?? [])
    .flatMap((areaSeason) => areaSeason.careLogs ?? [])
    .filter((log) => log.type === 'water' && isInYear(log.date, input.year))

  return spells.map((spell) => {
    const waterings = waterLogs.filter((log) => log.date >= spell.start && log.date <= spell.end)
    const hasLogs = waterLogs.length > 0
    const summaryBase =
      `A ${spell.lengthDays}-day dry spell ran from ${formatDay(spell.start)} to ${formatDay(spell.end)} ` +
      `(${spell.totalRainMm}mm of rain in total).`
    // Only comment on watering when the season has watering logs at all —
    // "you never watered" is unfair to someone who just doesn't log it.
    const summary = !hasLogs
      ? summaryBase
      : waterings.length === 0
        ? `${summaryBase} No watering was logged during it.`
        : `${summaryBase} You logged watering ${waterings.length} time${waterings.length === 1 ? '' : 's'} during it.`
    const metrics: Record<string, number | string> = {
      startDate: spell.start,
      endDate: spell.end,
      lengthDays: spell.lengthDays,
      totalRainMm: spell.totalRainMm,
    }
    if (hasLogs) metrics.wateringsLogged = waterings.length
    return {
      id: `dry-spell:${input.year}:${spell.start}`,
      ruleId: 'dry-spell',
      severity: hasLogs && waterings.length === 0 ? 'warning' : 'notice',
      summary,
      metrics,
      entities: [],
      dates: { start: spell.start, end: spell.end },
    } satisfies Finding
  })
}

/**
 * R8 water-deficit (info): a summer month where reference evapotranspiration
 * outran rainfall by ≥ |WATER_DEFICIT_MM| — the plot lost more water than the
 * sky supplied, even without a headline dry spell.
 */
function ruleWaterDeficit(input: SeasonReviewInput): Finding[] {
  if (!input.weather) return []
  const findings: Finding[] = []
  for (let month = 4; month <= 9; month++) {
    const balance = monthlyWaterBalance(input.weather, month)
    if (!balance || balance.balanceMm > WATER_DEFICIT_MM) continue
    findings.push({
      id: `water-deficit:${input.year}:${month}`,
      ruleId: 'water-deficit',
      severity: 'info',
      summary:
        `In ${MONTH_NAMES[month - 1]} the plot lost ${balance.et0Mm}mm to evapotranspiration ` +
        `but only received ${balance.rainMm}mm of rain — a ${Math.abs(balance.balanceMm)}mm deficit.`,
      metrics: {
        month,
        rainMm: balance.rainMm,
        et0Mm: balance.et0Mm,
        balanceMm: balance.balanceMm,
      },
      entities: [],
      dates: { start: `${input.year}-${String(month).padStart(2, '0')}-01` },
    })
  }
  return findings
}

/**
 * R9 pest-disease-cluster (notice; warning when any log was severity 3):
 * ≥ CLUSTER_MIN_LOGS pest or disease observations of the same type in one
 * bed within CLUSTER_WINDOW_DAYS. Works from logs alone — no weather needed.
 */
function rulePestDiseaseCluster(input: SeasonReviewInput): Finding[] {
  if (!input.seasonRecord) return []
  const findings: Finding[] = []
  for (const areaSeason of input.seasonRecord.areas) {
    const area = input.areas.find((a) => a.id === areaSeason.areaId)
    for (const type of ['pest', 'disease'] as const) {
      const logs = (areaSeason.careLogs ?? [])
        .filter((log) => log.type === type && isInYear(log.date, input.year))
        .sort((a, b) => a.date.localeCompare(b.date))
      if (logs.length < CLUSTER_MIN_LOGS) continue

      // Find the largest run of logs that fits a CLUSTER_WINDOW_DAYS window —
      // a sliding window over the date-sorted logs.
      let best: CareLogEntry[] = []
      let lo = 0
      for (let hi = 0; hi < logs.length; hi++) {
        while (daySpan(logs[lo].date, logs[hi].date) > CLUSTER_WINDOW_DAYS) lo++
        if (hi - lo + 1 > best.length) best = logs.slice(lo, hi + 1)
      }
      if (best.length < CLUSTER_MIN_LOGS) continue

      const maxSeverity = Math.max(...best.map((log) => log.severity ?? 0))
      const first = best[0].date
      const last = best[best.length - 1].date
      const bedName = area?.name ?? areaSeason.areaId
      findings.push({
        id: `pest-disease-cluster:${input.year}:${areaSeason.areaId}:${type}`,
        ruleId: 'pest-disease-cluster',
        severity: maxSeverity >= 3 ? 'warning' : 'notice',
        summary:
          `${best.length} ${type} observations were logged in ${bedName} ` +
          `between ${formatDay(first)} and ${formatDay(last)}` +
          `${maxSeverity >= 3 ? ', including at least one rated severe' : ''}.`,
        metrics: {
          observationCount: best.length,
          type,
          firstDate: first,
          lastDate: last,
          ...(maxSeverity > 0 ? { maxSeverity } : {}),
        },
        entities: [{ areaId: areaSeason.areaId, areaName: area?.name }],
        dates: { start: first, end: last },
      })
    }
  }
  return findings
}

/**
 * R10 dull-month (info): a summer month with ≤ DULL_MONTH_RATIO of the
 * baseline's sunshine hours — slow, leggy growth without an obvious culprit.
 */
function ruleDullMonth(input: SeasonReviewInput): Finding[] {
  if (!input.weather || !input.baseline) return []
  const anomalies = computeMonthlyAnomalies(computeMonthlyActuals(input.weather), input.baseline)
  const findings: Finding[] = []
  for (const anomaly of anomalies) {
    if (anomaly.month < 4 || anomaly.month > 9) continue
    if (
      anomaly.sunshineRatio === null ||
      anomaly.actualSunshineHours === null ||
      anomaly.baselineSunshineHours === null ||
      anomaly.sunshineRatio > DULL_MONTH_RATIO
    ) {
      continue
    }
    findings.push({
      id: `dull-month:${input.year}:${anomaly.month}`,
      ruleId: 'dull-month',
      severity: 'info',
      summary:
        `${MONTH_NAMES[anomaly.month - 1]} had ${Math.round((1 - anomaly.sunshineRatio) * 100)}% less sunshine ` +
        `than your 10-year average (${Math.round(anomaly.actualSunshineHours)}h vs ` +
        `${Math.round(anomaly.baselineSunshineHours)}h).`,
      metrics: {
        month: anomaly.month,
        actualSunshineHours: anomaly.actualSunshineHours,
        baselineSunshineHours: anomaly.baselineSunshineHours,
        sunshineRatio: anomaly.sunshineRatio,
      },
      entities: [],
      dates: { start: `${input.year}-${String(anomaly.month).padStart(2, '0')}-01` },
    })
  }
  return findings
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/**
 * Evaluate every rule against a season and return the findings, most severe
 * first. Missing inputs (no weather, no baseline, no season record, sparse
 * logs) silently disable the rules that need them — an empty array means
 * "nothing confidently worth saying", which is a valid, common result.
 */
export function evaluateSeason(input: SeasonReviewInput): Finding[] {
  const plantings = collectPlantings(input)
  // Plantings already explained by the cold-soil rule skip slow-germination.
  const flaggedPlantings = new Set<string>()

  const findings = [
    ...ruleColdSoilSowing(input, plantings, flaggedPlantings),
    ...ruleSlowGermination(input, plantings, flaggedPlantings),
    ...ruleFrostAfterTenderPlanting(input, plantings),
    ...ruleHeatStress(input, plantings),
    ...ruleTempAnomaly(input),
    ...ruleRainAnomaly(input),
    ...ruleDrySpell(input),
    ...ruleWaterDeficit(input),
    ...rulePestDiseaseCluster(input),
    ...ruleDullMonth(input),
  ]
  return sortFindings(findings)
}

/** Per-planting derived metrics for the review page's plantings table. */
export interface PlantingSeasonMetrics {
  plantingId: string
  plantId: string
  plantName: string
  varietyName?: string
  areaId: string
  areaName?: string
  sowDate?: string
  /** 0–7cm soil temperature on the sow date (outdoor sowings only). */
  soilTempAtSowC: number | null
  /** GDD accumulated from first outdoor exposure to the planting's window end. */
  gdd: GddAccumulation | null
  gddBaseTempC: number
  germination: GerminationInterval | null
  typicalDaysToGerminate: number
}

/**
 * Derived metrics for each planting with any date logged this year — the
 * deterministic numbers the review page shows alongside the findings. Pure
 * presentation data; emits nothing that isn't computable.
 */
export function computePlantingMetrics(input: SeasonReviewInput): PlantingSeasonMetrics[] {
  const results: PlantingSeasonMetrics[] = []
  for (const ctx of collectPlantings(input)) {
    const { planting, agronomy } = ctx
    const exposure = input.weather ? outdoorExposureDate(planting, input.year) : null
    const end = input.weather ? windowEnd(planting, input.weather) : null
    const hasAnyDate =
      isInYear(planting.sowDate, input.year) || isInYear(planting.transplantDate, input.year)
    if (!hasAnyDate) continue
    results.push({
      plantingId: planting.id,
      plantId: planting.plantId,
      plantName: plantName(planting.plantId),
      varietyName: planting.varietyName,
      areaId: ctx.areaId,
      areaName: ctx.area?.name,
      sowDate: planting.sowDate,
      soilTempAtSowC:
        input.weather && planting.sowMethod === 'outdoor' && isInYear(planting.sowDate, input.year)
          ? soilTempOn(input.weather.days, planting.sowDate)
          : null,
      gdd:
        input.weather && exposure && end && end >= exposure
          ? accumulateGdd(input.weather.days, agronomy.gddBaseTempC, exposure, end)
          : null,
      gddBaseTempC: agronomy.gddBaseTempC,
      germination: daysToGermination(planting, ctx.careLogs),
      typicalDaysToGerminate: agronomy.typicalDaysToGerminate,
    })
  }
  return results
}
