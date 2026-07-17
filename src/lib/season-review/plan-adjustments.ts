/**
 * Season Observer plan adjustments (Phase 3).
 *
 * Closes the plan → observe → learn → better-plan loop: last season's
 * findings[] (rules.ts) in, typed next-season suggestions out. Pure and
 * deterministic — no LLM, no storage, no network. Each suggestion maps 1:1
 * to a rule id and restates only numbers already present in the finding's
 * `metrics`, so everything shown is traceable to a tested metric.
 *
 * Same silence discipline as the rules engine: a finding whose metrics are
 * missing the pieces an adjustment needs produces nothing, and findings with
 * no concrete plan action (plot-wide context like temp/rain anomalies) are
 * skipped entirely — an empty array is a valid, common result.
 */

import type { Finding, FindingEntity, FindingSeverity } from './findings'

/** Average frost dates from `meta.frostDates`, when the plot has them. */
export interface PlanAdjustmentContext {
  frostDates?: {
    lastSpring: string
    firstAutumn: string
  }
}

/** One concrete, rule-derived adjustment for next season's plan. */
export interface PlanAdjustment {
  /** Stable: `plan:${finding.id}`. */
  id: string
  /** The finding this adjustment was derived from. */
  findingId: string
  /** The rule the finding (and therefore this adjustment) came from. */
  ruleId: string
  severity: FindingSeverity
  /** What happened last season — the finding's key fact, one sentence. */
  observed: string
  /** The concrete change to make this year, one sentence. */
  action: string
  /** Beds/plantings the adjustment refers to, carried from the finding. */
  entities: FindingEntity[]
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "2026-05-12" → "12 May". Null on anything unparseable — callers skip. */
function formatDay(isoDate: string): string | null {
  const month = Number(isoDate.slice(5, 7))
  const day = Number(isoDate.slice(8, 10))
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  if (!Number.isInteger(day) || day < 1 || day > 31) return null
  return `${day} ${MONTH_NAMES[month - 1].slice(0, 3)}`
}

/** "2026-07-03" → "July". Null on anything unparseable. */
function monthNameOf(isoDate: string): string | null {
  const month = Number(isoDate.slice(5, 7))
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  return MONTH_NAMES[month - 1]
}

/** "2026-05-12" → "05-12" for year-free calendar comparison. Null when malformed. */
function monthDayOf(isoDate: string): string | null {
  // Same month/day range validation as formatDay — "2026-99-99" is rejected.
  return formatDay(isoDate) === null ? null : isoDate.slice(5, 10)
}

function metricNumber(finding: Finding, key: string): number | null {
  const value = finding.metrics[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function metricString(finding: Finding, key: string): string | null {
  const value = finding.metrics[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

/** The plant the finding is about, when its entities name one. */
function plantNameOf(finding: Finding): string | null {
  return finding.entities[0]?.plantName ?? null
}

function adjustment(
  finding: Finding,
  observed: string,
  action: string
): PlanAdjustment {
  return {
    id: `plan:${finding.id}`,
    findingId: finding.id,
    ruleId: finding.ruleId,
    severity: finding.severity,
    observed,
    action,
    entities: finding.entities,
  }
}

// ---------------------------------------------------------------------------
// Per-rule mappers. Each returns null when the finding is missing anything
// the adjustment's sentences need — silence over a vague suggestion.
// ---------------------------------------------------------------------------

type AdjustmentMapper = (
  finding: Finding,
  context: PlanAdjustmentContext
) => PlanAdjustment | null

/** cold-soil-sowing → wait for the soil threshold, or start indoors. */
function mapColdSoilSowing(finding: Finding): PlanAdjustment | null {
  const plant = plantNameOf(finding)
  const soilAtSow = metricNumber(finding, 'soilTempAtSowC')
  const minTemp = metricNumber(finding, 'minSoilTempGerminationC')
  const sowDate = metricString(finding, 'sowDate')
  const sowDay = sowDate ? formatDay(sowDate) : null
  if (!plant || soilAtSow === null || minTemp === null || !sowDay) return null

  const reached = metricString(finding, 'soilReachedThresholdOn')
  const reachedDay = reached ? formatDay(reached) : null
  const observed =
    `${plant} went into ${soilAtSow}°C soil on ${sowDay} — ` +
    `below the ~${minTemp}°C it needs to germinate.`
  const action = reachedDay
    ? `This year wait until the soil holds ${minTemp}°C before sowing ${plant} outdoors ` +
      `(last year that wasn't until ${reachedDay}), or start it indoors.`
    : `This year wait until the soil holds ${minTemp}°C before sowing ${plant} outdoors, ` +
      `or start it indoors.`
  return adjustment(finding, observed, action)
}

/** slow-germination → sow later into warmer soil, or pre-warm the bed. */
function mapSlowGermination(finding: Finding): PlanAdjustment | null {
  const plant = plantNameOf(finding)
  const actual = metricNumber(finding, 'actualDaysToGerminate')
  const typical = metricNumber(finding, 'typicalDaysToGerminate')
  const sowDate = metricString(finding, 'sowDate')
  const sowDay = sowDate ? formatDay(sowDate) : null
  if (!plant || actual === null || typical === null || !sowDay) return null

  return adjustment(
    finding,
    `${plant} sown on ${sowDay} took ${actual} days to germinate — typically ~${typical}.`,
    `This year sow ${plant} a little later into warmer soil, or pre-warm the bed ` +
      `with a cloche or fleece for a couple of weeks before sowing.`
  )
}

/** frost-after-tender-planting → hold tender plantings past the last frost. */
function mapFrostAfterTenderPlanting(
  finding: Finding,
  context: PlanAdjustmentContext
): PlanAdjustment | null {
  const plant = plantNameOf(finding)
  const outdoorFrom = metricString(finding, 'outdoorFrom')
  const firstFrost = metricString(finding, 'firstFrostDate')
  const outdoorDay = outdoorFrom ? formatDay(outdoorFrom) : null
  const frostDay = firstFrost ? formatDay(firstFrost) : null
  if (!plant || !outdoorFrom || !outdoorDay || !frostDay) return null

  const observed = `Frost caught ${plant} on ${frostDay} after it went outside on ${outdoorDay}.`

  const lastSpring = context.frostDates?.lastSpring
  const lastSpringDay = lastSpring ? formatDay(lastSpring) : null
  const lastSpringMd = lastSpring ? monthDayOf(lastSpring) : null
  const plantedMd = monthDayOf(outdoorFrom)
  if (lastSpringDay && lastSpringMd && plantedMd) {
    const action =
      lastSpringMd > plantedMd
        ? `Your average last frost is around ${lastSpringDay} — later than you planted. ` +
          `This year hold ${plant} back until after that date, and keep fleece handy.`
        : `You planted on or after your average last frost (~${lastSpringDay}) and still got caught — ` +
          `this year keep fleece over ${plant} for its first weeks outside.`
    return adjustment(finding, observed, action)
  }
  return adjustment(
    finding,
    observed,
    `This year wait until frost risk has clearly passed before planting ${plant} out, ` +
      `and keep fleece handy for cold nights.`
  )
}

/** heat-stress → bolt-resistant variety / earlier sowing / shade and water. */
function mapHeatStress(finding: Finding): PlanAdjustment | null {
  const plant = plantNameOf(finding)
  const days = metricNumber(finding, 'heatStressDays')
  const threshold = metricNumber(finding, 'heatStressTempC')
  if (!plant || days === null || threshold === null) return null

  const bolted = metricString(finding, 'boltedOn') !== null
  const observed = bolted
    ? `${plant} bolted after ${days} days at or above ${threshold}°C.`
    : `${plant} sat through ${days} days at or above ${threshold}°C.`
  const action = bolted
    ? `This year pick a bolt-resistant ${plant} variety, or sow earlier so it matures ` +
      `before the hottest weeks.`
    : `This year plan shade or steadier watering for ${plant} in high summer, or time ` +
      `sowings so it isn't maturing in the hottest weeks.`
  return adjustment(finding, observed, action)
}

/** dry-spell → mulch in spring, plan a watering routine around the spell's months. */
function mapDrySpell(finding: Finding): PlanAdjustment | null {
  const length = metricNumber(finding, 'lengthDays')
  const rain = metricNumber(finding, 'totalRainMm')
  const start = metricString(finding, 'startDate')
  const end = metricString(finding, 'endDate')
  const startDay = start ? formatDay(start) : null
  const endDay = end ? formatDay(end) : null
  const startMonth = start ? monthNameOf(start) : null
  const endMonth = end ? monthNameOf(end) : null
  if (length === null || rain === null || !startDay || !endDay || !startMonth || !endMonth) {
    return null
  }

  const noWatering = metricNumber(finding, 'wateringsLogged') === 0
  const observed =
    `A ${length}-day dry spell ran ${startDay}–${endDay} with only ${rain}mm of rain` +
    `${noWatering ? ', and no watering was logged during it' : ''}.`
  const window = startMonth === endMonth ? startMonth : `${startMonth}–${endMonth}`
  return adjustment(
    finding,
    observed,
    `This year mulch beds in spring to hold moisture, and plan a watering routine for ${window}.`
  )
}

/** pest-disease-cluster → protect that bed from the start of the season. */
function mapPestDiseaseCluster(finding: Finding): PlanAdjustment | null {
  const count = metricNumber(finding, 'observationCount')
  const type = metricString(finding, 'type')
  const first = metricString(finding, 'firstDate')
  const firstDay = first ? formatDay(first) : null
  const firstMonth = first ? monthNameOf(first) : null
  const bed = finding.entities[0]?.areaName ?? finding.entities[0]?.areaId ?? null
  if (count === null || (type !== 'pest' && type !== 'disease') || !firstDay || !firstMonth || !bed) {
    return null
  }

  const observed = `${count} ${type} observations were logged in ${bed}, starting ${firstDay}.`
  const action =
    type === 'pest'
      ? `This year protect ${bed} from the start — netting or collars in place before ` +
        `${firstMonth} — and check young plants weekly.`
      : `This year give plantings in ${bed} wider spacing for airflow, avoid the same crop ` +
        `family there, and remove affected leaves as soon as they show.`
  return adjustment(finding, observed, action)
}

/**
 * Rule id → mapper. Rules absent here (temp-anomaly, rain-anomaly,
 * water-deficit, dull-month) are season context with no concrete per-plan
 * action, so they never become suggestions.
 */
const MAPPERS: Readonly<Record<string, AdjustmentMapper>> = {
  'cold-soil-sowing': mapColdSoilSowing,
  'slow-germination': mapSlowGermination,
  'frost-after-tender-planting': mapFrostAfterTenderPlanting,
  'heat-stress': mapHeatStress,
  'dry-spell': mapDrySpell,
  'pest-disease-cluster': mapPestDiseaseCluster,
}

/**
 * Derive next-season plan adjustments from a season's findings. Preserves
 * the findings' order (evaluateSeason already sorts most-severe-first).
 * Computed on demand, never persisted.
 */
export function derivePlanAdjustments(
  findings: Finding[],
  context: PlanAdjustmentContext = {}
): PlanAdjustment[] {
  const adjustments: PlanAdjustment[] = []
  for (const finding of findings) {
    const mapper = MAPPERS[finding.ruleId]
    if (!mapper) continue
    const mapped = mapper(finding, context)
    if (mapped) adjustments.push(mapped)
  }
  return adjustments
}

/**
 * The adjustments that are about one specific crop, matched via each
 * adjustment's `entities[].plantId` (Phase 4 point-of-decision nudges).
 * Plot-wide adjustments (dry-spell) carry no plant entity and never match —
 * they belong on the plan-level panel, not next to a single crop picker.
 */
export function adjustmentsForPlant(
  plantId: string,
  adjustments: PlanAdjustment[]
): PlanAdjustment[] {
  if (!plantId) return []
  return adjustments.filter((adj) =>
    adj.entities.some((entity) => entity.plantId === plantId)
  )
}

/**
 * The adjustments that are about one specific bed and not about a crop,
 * matched via each adjustment's `entities[].areaId` (Phase 5 bed-scoped
 * nudges — pest-disease-cluster is the only rule that emits these today).
 * Adjustments that name a plant are excluded even when they also carry the
 * bed: those stay crop-matched via `adjustmentsForPlant`, so a finding with
 * both never renders twice. Plot-wide adjustments (dry-spell) carry no
 * entities and never match. Accepts undefined (the form's area is an
 * optional prop) — no area means no matches.
 */
export function adjustmentsForArea(
  areaId: string | undefined,
  adjustments: PlanAdjustment[]
): PlanAdjustment[] {
  if (!areaId) return []
  return adjustments.filter(
    (adj) =>
      adj.entities.some((entity) => entity.areaId === areaId) &&
      !adj.entities.some((entity) => entity.plantId)
  )
}
