/**
 * plan-adjustments — the Phase 3 findings → suggestions mapper. Every rule id
 * must map to a concrete adjustment built only from the finding's own metrics,
 * and anything with missing metrics, an unknown rule, or no concrete action
 * must yield silence — the same discipline as the rules engine.
 */
import { describe, expect, it } from 'vitest'
import type { Finding } from '@/lib/season-review/findings'
import {
  adjustmentsForPlant,
  derivePlanAdjustments,
  type PlanAdjustment,
} from '@/lib/season-review/plan-adjustments'

const FROST_DATES = {
  lastSpring: '2026-05-12',
  firstAutumn: '2026-10-20',
}

function finding(overrides: Partial<Finding>): Finding {
  return {
    id: 'rule:2025:x',
    ruleId: 'rule',
    severity: 'notice',
    summary: 'Something happened.',
    metrics: {},
    entities: [],
    ...overrides,
  }
}

function coldSoilFinding(metrics: Finding['metrics'] = {}): Finding {
  return finding({
    id: 'cold-soil-sowing:2025:p1',
    ruleId: 'cold-soil-sowing',
    severity: 'warning',
    entities: [{ plantingId: 'p1', plantId: 'peas', plantName: 'Peas', areaId: 'bed-a', areaName: 'Bed A' }],
    metrics: {
      sowDate: '2025-03-20',
      soilTempAtSowC: 6.5,
      minSoilTempGerminationC: 7,
      ...metrics,
    },
  })
}

function single(findings: Finding[], context?: Parameters<typeof derivePlanAdjustments>[1]): PlanAdjustment {
  const adjustments = derivePlanAdjustments(findings, context)
  expect(adjustments).toHaveLength(1)
  return adjustments[0]
}

describe('derivePlanAdjustments', () => {
  it('returns an empty array for no findings', () => {
    expect(derivePlanAdjustments([])).toEqual([])
  })

  it('drops findings from unknown rules', () => {
    expect(derivePlanAdjustments([finding({ ruleId: 'brand-new-rule' })])).toEqual([])
  })

  it('drops plot-wide context rules that have no concrete plan action', () => {
    const contextRules = ['temp-anomaly', 'rain-anomaly', 'water-deficit', 'dull-month']
    const findings = contextRules.map((ruleId) =>
      finding({ id: `${ruleId}:2025:6`, ruleId, metrics: { month: 6 } })
    )
    expect(derivePlanAdjustments(findings)).toEqual([])
  })

  it('preserves the input order and carries finding identity through', () => {
    const frost = finding({
      id: 'frost-after-tender-planting:2025:p2',
      ruleId: 'frost-after-tender-planting',
      severity: 'warning',
      entities: [{ plantingId: 'p2', plantId: 'courgette', plantName: 'Courgette' }],
      metrics: { outdoorFrom: '2025-05-01', firstFrostDate: '2025-05-06', frostDays: 1, minTempC: -1 },
    })
    const adjustments = derivePlanAdjustments([coldSoilFinding(), frost])
    expect(adjustments.map((a) => a.findingId)).toEqual([
      'cold-soil-sowing:2025:p1',
      'frost-after-tender-planting:2025:p2',
    ])
    expect(adjustments[0]).toMatchObject({
      id: 'plan:cold-soil-sowing:2025:p1',
      ruleId: 'cold-soil-sowing',
      severity: 'warning',
    })
    expect(adjustments[0].entities).toEqual(coldSoilFinding().entities)
  })

  describe('cold-soil-sowing', () => {
    it('maps to a wait-for-soil-temp or start-indoors adjustment', () => {
      const adj = single([coldSoilFinding()])
      expect(adj.observed).toBe('Peas went into 6.5°C soil on 20 Mar — below the ~7°C it needs to germinate.')
      expect(adj.action).toBe(
        'This year wait until the soil holds 7°C before sowing Peas outdoors, or start it indoors.'
      )
    })

    it('includes when the soil actually reached the threshold, when known', () => {
      const adj = single([coldSoilFinding({ soilReachedThresholdOn: '2025-04-14' })])
      expect(adj.action).toContain("last year that wasn't until 14 Apr")
      expect(adj.action).toContain('or start it indoors')
    })

    it('stays silent when the soil temperature metric is missing', () => {
      const f = coldSoilFinding()
      delete f.metrics.soilTempAtSowC
      expect(derivePlanAdjustments([f])).toEqual([])
    })

    it('stays silent when the finding names no plant', () => {
      const f = coldSoilFinding()
      f.entities = [{ areaId: 'bed-a' }]
      expect(derivePlanAdjustments([f])).toEqual([])
    })

    it('stays silent on an unparseable sow date', () => {
      expect(derivePlanAdjustments([coldSoilFinding({ sowDate: 'not-a-date' })])).toEqual([])
    })
  })

  describe('slow-germination', () => {
    const slow = finding({
      id: 'slow-germination:2025:p3',
      ruleId: 'slow-germination',
      entities: [{ plantingId: 'p3', plantId: 'carrot', plantName: 'Carrot' }],
      metrics: {
        sowDate: '2025-04-02',
        germinatedDate: '2025-04-30',
        actualDaysToGerminate: 28,
        typicalDaysToGerminate: 14,
      },
    })

    it('maps to a sow-later or pre-warm adjustment with both durations', () => {
      const adj = single([slow])
      expect(adj.observed).toBe('Carrot sown on 2 Apr took 28 days to germinate — typically ~14.')
      expect(adj.action).toContain('sow Carrot a little later into warmer soil')
      expect(adj.action).toContain('pre-warm the bed')
    })

    it('stays silent when the typical duration is missing', () => {
      const f = { ...slow, metrics: { ...slow.metrics } }
      delete f.metrics.typicalDaysToGerminate
      expect(derivePlanAdjustments([f])).toEqual([])
    })
  })

  describe('frost-after-tender-planting', () => {
    const frost = finding({
      id: 'frost-after-tender-planting:2025:p4',
      ruleId: 'frost-after-tender-planting',
      severity: 'warning',
      entities: [{ plantingId: 'p4', plantId: 'courgette', plantName: 'Courgette' }],
      metrics: {
        outdoorFrom: '2025-05-01',
        firstFrostDate: '2025-05-06',
        frostDays: 1,
        minTempC: -1.2,
      },
    })

    it('uses the average last frost when it is later than the planting date', () => {
      const adj = single([frost], { frostDates: FROST_DATES })
      expect(adj.observed).toBe('Frost caught Courgette on 6 May after it went outside on 1 May.')
      expect(adj.action).toBe(
        'Your average last frost is around 12 May — later than you planted. ' +
          'This year hold Courgette back until after that date, and keep fleece handy.'
      )
    })

    it('suggests fleece when the planting was already after the average last frost', () => {
      const adj = single([frost], { frostDates: { ...FROST_DATES, lastSpring: '2026-04-20' } })
      expect(adj.action).toBe(
        'You planted on or after your average last frost (~20 Apr) and still got caught — ' +
          'this year keep fleece over Courgette for its first weeks outside.'
      )
    })

    it('treats planting exactly on the average last frost date as on-or-after, not later-than', () => {
      const adj = single([frost], { frostDates: { ...FROST_DATES, lastSpring: '2026-05-01' } })
      expect(adj.action).toContain('You planted on or after your average last frost (~1 May)')
      expect(adj.action).not.toContain('later than you planted')
    })

    it('falls back to the generic action when the average last frost date is malformed', () => {
      const adj = single([frost], { frostDates: { ...FROST_DATES, lastSpring: '2026-99-99' } })
      expect(adj.action).toContain('wait until frost risk has clearly passed')
    })

    it('gives a generic wait-for-frost-risk action when no frost dates are known', () => {
      const adj = single([frost])
      expect(adj.action).toContain('wait until frost risk has clearly passed')
      expect(adj.action).toContain('Courgette')
    })

    it('stays silent when the frost date is missing', () => {
      const f = { ...frost, metrics: { ...frost.metrics } }
      delete f.metrics.firstFrostDate
      expect(derivePlanAdjustments([f], { frostDates: FROST_DATES })).toEqual([])
    })
  })

  describe('heat-stress', () => {
    const heat = finding({
      id: 'heat-stress:2025:p5',
      ruleId: 'heat-stress',
      entities: [{ plantingId: 'p5', plantId: 'lettuce', plantName: 'Lettuce' }],
      metrics: {
        heatStressDays: 6,
        heatStressTempC: 25,
        windowStart: '2025-06-10',
        windowEnd: '2025-07-20',
      },
    })

    it('suggests a bolt-resistant variety when bolting was logged', () => {
      const bolted = { ...heat, severity: 'warning' as const, metrics: { ...heat.metrics, boltedOn: '2025-07-01' } }
      const adj = single([bolted])
      expect(adj.observed).toBe('Lettuce bolted after 6 days at or above 25°C.')
      expect(adj.action).toContain('bolt-resistant Lettuce variety')
      expect(adj.action).toContain('sow earlier')
    })

    it('suggests shade or watering when there was heat but no bolting', () => {
      const adj = single([heat])
      expect(adj.observed).toBe('Lettuce sat through 6 days at or above 25°C.')
      expect(adj.action).toContain('shade or steadier watering for Lettuce')
    })

    it('stays silent when the stress-day count is missing', () => {
      const f = { ...heat, metrics: { ...heat.metrics } }
      delete f.metrics.heatStressDays
      expect(derivePlanAdjustments([f])).toEqual([])
    })
  })

  describe('dry-spell', () => {
    const spell = finding({
      id: 'dry-spell:2025:2025-06-10',
      ruleId: 'dry-spell',
      metrics: {
        startDate: '2025-06-10',
        endDate: '2025-07-02',
        lengthDays: 23,
        totalRainMm: 3.4,
      },
    })

    it('maps to a mulch-and-watering-routine adjustment spanning the spell months', () => {
      const adj = single([spell])
      expect(adj.observed).toBe('A 23-day dry spell ran 10 Jun–2 Jul with only 3.4mm of rain.')
      expect(adj.action).toBe(
        'This year mulch beds in spring to hold moisture, and plan a watering routine for June–July.'
      )
    })

    it('names a single month when the spell stays within one', () => {
      const june = {
        ...spell,
        metrics: { ...spell.metrics, startDate: '2025-06-02', endDate: '2025-06-20' },
      }
      expect(single([june]).action).toContain('watering routine for June.')
    })

    it('notes when no watering was logged during the spell', () => {
      const unwatered = {
        ...spell,
        severity: 'warning' as const,
        metrics: { ...spell.metrics, wateringsLogged: 0 },
      }
      expect(single([unwatered]).observed).toContain('and no watering was logged during it')
    })

    it('does not mention watering logs when some were made', () => {
      const watered = { ...spell, metrics: { ...spell.metrics, wateringsLogged: 3 } }
      expect(single([watered]).observed).not.toContain('no watering was logged')
    })

    it('stays silent when the spell length is missing', () => {
      const f = { ...spell, metrics: { ...spell.metrics } }
      delete f.metrics.lengthDays
      expect(derivePlanAdjustments([f])).toEqual([])
    })
  })

  describe('pest-disease-cluster', () => {
    const cluster = finding({
      id: 'pest-disease-cluster:2025:bed-b:pest',
      ruleId: 'pest-disease-cluster',
      entities: [{ areaId: 'bed-b', areaName: 'Bed B' }],
      metrics: {
        observationCount: 4,
        type: 'pest',
        firstDate: '2025-06-05',
        lastDate: '2025-06-28',
      },
    })

    it('suggests early protection for the bed on a pest cluster', () => {
      const adj = single([cluster])
      expect(adj.observed).toBe('4 pest observations were logged in Bed B, starting 5 Jun.')
      expect(adj.action).toContain('protect Bed B from the start')
      expect(adj.action).toContain('netting or collars in place before June')
    })

    it('suggests spacing and family rotation on a disease cluster', () => {
      const disease = { ...cluster, metrics: { ...cluster.metrics, type: 'disease' } }
      const adj = single([disease])
      expect(adj.action).toContain('wider spacing for airflow')
      expect(adj.action).toContain('avoid the same crop family')
    })

    it('falls back to the area id when the bed has no name', () => {
      const unnamed = { ...cluster, entities: [{ areaId: 'bed-b' }] }
      expect(single([unnamed]).observed).toContain('in bed-b')
    })

    it('stays silent on an unexpected observation type', () => {
      const odd = { ...cluster, metrics: { ...cluster.metrics, type: 'weeds' } }
      expect(derivePlanAdjustments([odd])).toEqual([])
    })

    it('stays silent when the observation count is missing', () => {
      const f = { ...cluster, metrics: { ...cluster.metrics } }
      delete f.metrics.observationCount
      expect(derivePlanAdjustments([f])).toEqual([])
    })
  })
})

describe('adjustmentsForPlant', () => {
  /** Real adjustments from the mapper: peas (crop), lettuce (crop), dry spell (plot-wide). */
  function mixedAdjustments(): PlanAdjustment[] {
    const heat = finding({
      id: 'heat-stress:2025:p5',
      ruleId: 'heat-stress',
      entities: [{ plantingId: 'p5', plantId: 'lettuce', plantName: 'Lettuce' }],
      metrics: { heatStressDays: 6, heatStressTempC: 25 },
    })
    const drySpell = finding({
      id: 'dry-spell:2025:2025-06-10',
      ruleId: 'dry-spell',
      metrics: { startDate: '2025-06-10', endDate: '2025-07-02', lengthDays: 23, totalRainMm: 3.4 },
    })
    const adjustments = derivePlanAdjustments([coldSoilFinding(), heat, drySpell])
    expect(adjustments).toHaveLength(3)
    return adjustments
  }

  it('returns only the adjustments whose entities name the picked plant', () => {
    const matched = adjustmentsForPlant('peas', mixedAdjustments())
    expect(matched).toHaveLength(1)
    expect(matched[0].ruleId).toBe('cold-soil-sowing')
    expect(matched[0].entities[0].plantId).toBe('peas')
  })

  it('never returns plot-wide adjustments, which carry no plant entity', () => {
    const all = mixedAdjustments()
    for (const plantId of ['peas', 'lettuce']) {
      const matched = adjustmentsForPlant(plantId, all)
      expect(matched.every((adj) => adj.ruleId !== 'dry-spell')).toBe(true)
    }
  })

  it('returns an empty array for a plant with no matching adjustment', () => {
    expect(adjustmentsForPlant('carrot', mixedAdjustments())).toEqual([])
  })

  it('returns an empty array for an empty plant id or no adjustments', () => {
    expect(adjustmentsForPlant('', mixedAdjustments())).toEqual([])
    expect(adjustmentsForPlant('peas', [])).toEqual([])
  })
})
