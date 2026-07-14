/**
 * The number-verification checker is the real guarantee behind Phase 2c
 * narration — the LLM is untrusted, this is not. Test it hard.
 */
import { describe, expect, it } from 'vitest'
import type { Finding } from '@/lib/season-review/findings'
import {
  collectAllowedNumbers,
  extractNumericTokens,
  verifyNarration,
} from '@/lib/season-review/narration-verify'

function finding(overrides: Partial<Finding> = {}): Finding {
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

const META = { year: 2025 }

describe('extractNumericTokens', () => {
  it('extracts integers and decimals', () => {
    expect(extractNumericTokens('Soil was 6.5°C, 3 days later 12°C')).toEqual([
      '6.5', '3', '12',
    ])
  })

  it('canonicalizes formatting variants', () => {
    expect(extractNumericTokens('21.50')).toEqual(['21.5'])
    expect(extractNumericTokens('07 of July')).toEqual(['7'])
    expect(extractNumericTokens('0.50')).toEqual(['0.5'])
  })

  it('joins thousands separators but not list commas', () => {
    expect(extractNumericTokens('1,200mm')).toEqual(['1200'])
    expect(extractNumericTokens('beds 3, 14 and 9')).toEqual(['3', '14', '9'])
    // Four digits after the comma is not a thousands group.
    expect(extractNumericTokens('3,1415')).toEqual(['3', '1415'])
  })

  it('splits ISO dates into their parts', () => {
    expect(extractNumericTokens('2025-06-14')).toEqual(['2025', '6', '14'])
  })

  it('handles ordinals and percentages', () => {
    expect(extractNumericTokens('the 14th, at 40%')).toEqual(['14', '40'])
  })

  it('reads bare-dot decimals whole rather than as their fraction digits', () => {
    expect(extractNumericTokens('about .5mm')).toEqual(['0.5'])
    expect(extractNumericTokens('.50 of normal')).toEqual(['0.5'])
  })

  it('returns empty for prose without numbers', () => {
    expect(extractNumericTokens('A kind season with gentle rain.')).toEqual([])
  })
})

describe('collectAllowedNumbers', () => {
  it('vouches for numbers in summaries, metrics, and dates', () => {
    const allowed = collectAllowedNumbers(
      [
        finding({
          summary: 'June was 2.1°C warmer than your 10-year average.',
          metrics: { deltaC: 2.1, baselineC: 14.3, month: 6 },
          dates: { start: '2025-06-01', end: '2025-06-30' },
        }),
      ],
      META
    )
    for (const token of ['2.1', '10', '14.3', '6', '2025', '1', '30']) {
      expect(allowed.has(token), token).toBe(true)
    }
  })

  it('vouches for numeric fragments inside string metrics', () => {
    const allowed = collectAllowedNumbers(
      [finding({ metrics: { window: '14 days from 2025-07-02' } })],
      META
    )
    expect(allowed.has('14')).toBe(true)
    expect(allowed.has('7')).toBe(true)
    expect(allowed.has('2')).toBe(true)
  })

  it('allows the year, next year, and finding counts', () => {
    const findings = [
      finding({ severity: 'warning' }),
      finding({ severity: 'info' }),
      finding({ severity: 'info' }),
    ]
    const allowed = collectAllowedNumbers(findings, META)
    expect(allowed.has('2025')).toBe(true) // season year
    expect(allowed.has('2026')).toBe(true) // "next year"
    expect(allowed.has('3')).toBe(true) // total findings
    expect(allowed.has('1')).toBe(true) // warning count
    expect(allowed.has('2')).toBe(true) // info count
    expect(allowed.has('0')).toBe(true) // notice count — zero is still a count
  })

  it('vouches for numbers inside entity display names', () => {
    const allowed = collectAllowedNumbers(
      [
        finding({
          entities: [
            { areaName: 'Raised Bed 1', plantName: 'Sweetcorn F1', varietyName: 'Earlibird 2' },
          ],
        }),
      ],
      META
    )
    expect(allowed.has('1')).toBe(true)
    expect(allowed.has('2')).toBe(true)
  })

  it('vouches for digits in the allotment name', () => {
    const allowed = collectAllowedNumbers([], { year: 2025, allotmentName: 'Plot 2' })
    expect(allowed.has('2')).toBe(true)
  })

  it('vouches zero counts for severities with no findings at all', () => {
    const allowed = collectAllowedNumbers([finding({ severity: 'notice' })], META)
    expect(allowed.has('0')).toBe(true) // no warnings, no info
  })
})

describe('verifyNarration', () => {
  const findings = [
    finding({
      summary: 'Peas sown 2025-03-12 into 6.5°C soil, below their 7°C minimum.',
      metrics: { soilTempC: 6.5, minSoilTempC: 7 },
      dates: { start: '2025-03-12' },
    }),
    finding({
      summary: 'A 21-day dry spell from 2025-06-14; only 4mm of rain fell.',
      metrics: { days: 21, rainMm: 4 },
      dates: { start: '2025-06-14', end: '2025-07-04' },
    }),
  ]

  it('accepts prose that only reuses findings numbers', () => {
    const result = verifyNarration(
      'Your peas went in on 12 March into 6.5°C soil — just under the 7°C they want. ' +
        'Later, from 14 June, a 21-day dry spell brought only 4mm of rain.',
      findings,
      META
    )
    expect(result).toEqual({ ok: true, unverifiedNumbers: [] })
  })

  it('rejects an invented number and names it', () => {
    const result = verifyNarration(
      'A 21-day dry spell with 4mm of rain — beds lost roughly 85mm of moisture.',
      findings,
      META
    )
    expect(result.ok).toBe(false)
    expect(result.unverifiedNumbers).toEqual(['85'])
  })

  it('rejects arithmetic the model did itself', () => {
    // 21 days restated as "roughly 22": 22 appears nowhere in the findings.
    const result = verifyNarration('The dry spell ran roughly 22 days.', findings, META)
    expect(result.ok).toBe(false)
    expect(result.unverifiedNumbers).toEqual(['22'])
  })

  it('rejects unit conversions the model did itself', () => {
    // 4mm restated as 0.4cm: 0.4 appears nowhere in the findings.
    const result = verifyNarration('Only 0.4cm of rain fell.', findings, META)
    expect(result.ok).toBe(false)
    expect(result.unverifiedNumbers).toEqual(['0.4'])
  })

  it('accepts reformatted-but-equal numbers', () => {
    const result = verifyNarration('Soil sat at 6.50°C on the 12th.', findings, META)
    expect(result.ok).toBe(true)
  })

  it('treats sign as grammar, not a new number', () => {
    const deficit = [
      finding({
        summary: 'July ran a -60mm water deficit.',
        metrics: { balanceMm: -60 },
      }),
    ]
    const result = verifyNarration('July came up 60mm short on water.', deficit, META)
    expect(result.ok).toBe(true)
  })

  it('accepts "0 warnings"-style phrasing when a severity has no findings', () => {
    const noticesOnly = [finding({ severity: 'notice' }), finding({ severity: 'notice' })]
    const result = verifyNarration(
      'Two notices and 0 warnings this season.',
      noticesOnly,
      META
    )
    expect(result.ok).toBe(true)
  })

  it('rejects a bare-dot decimal even when its fraction digits are vouched', () => {
    // findings vouch for 4 (rainMm) — ".4" must not ride on it.
    const result = verifyNarration('Rainfall ran at .4 of normal.', findings, META)
    expect(result.ok).toBe(false)
    expect(result.unverifiedNumbers).toEqual(['0.4'])
  })

  it('accepts a draft repeating a numeric allotment name', () => {
    const result = verifyNarration(
      'Plot 7 had a season to remember.',
      findings,
      { year: 2025, allotmentName: 'Plot 7' }
    )
    expect(result.ok).toBe(true)
  })

  it('accepts a draft naming a numbered bed', () => {
    const numberedBed = [
      finding({
        summary: 'Slugs clustered in one bed.',
        entities: [{ areaName: 'Raised Bed 3' }],
      }),
    ]
    const result = verifyNarration('Raised Bed 3 had a slug problem.', numberedBed, META)
    expect(result.ok).toBe(true)
  })

  it('allows counting the findings and mentioning the season and next year', () => {
    const result = verifyNarration(
      'Two things stood out in 2025 — worth planning around in 2026.',
      findings,
      META
    )
    expect(result.ok).toBe(true)
  })

  it('accepts prose with no numbers at all', () => {
    expect(verifyNarration('A gentle, kind season.', findings, META).ok).toBe(true)
  })

  it('accepts an empty draft (emptiness is handled upstream)', () => {
    expect(verifyNarration('', findings, META).ok).toBe(true)
  })

  it('dedupes repeated unverified numbers', () => {
    const result = verifyNarration('It hit 33°C, then 33°C again, then 99°C.', findings, META)
    expect(result.ok).toBe(false)
    expect(result.unverifiedNumbers.sort()).toEqual(['33', '99'])
  })

  it('with zero findings, only the derived allowance survives', () => {
    const ok = verifyNarration('Nothing to report for 2025.', [], META)
    expect(ok.ok).toBe(true)
    const bad = verifyNarration('Rain totalled 400mm in 2025.', [], META)
    expect(bad.ok).toBe(false)
    expect(bad.unverifiedNumbers).toEqual(['400'])
  })

  it('rejects thousands-separated variants of unvouched numbers', () => {
    const result = verifyNarration('That is 1,200 slugs.', findings, META)
    expect(result.ok).toBe(false)
    expect(result.unverifiedNumbers).toEqual(['1200'])
  })
})
