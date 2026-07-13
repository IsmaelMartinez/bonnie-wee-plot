/**
 * Season Observer findings (Phase 2b).
 *
 * A finding is one deterministic, plain-English observation about the
 * reviewed season, emitted by the rules engine. Findings are computed on
 * demand from logs + cached weather — never persisted in the Yjs doc — and
 * carry the numbers behind them (`metrics`) plus the entities they refer to,
 * so any future narration layer (Phase 2c) can be checked against them
 * number-for-number. Coordinates are never part of a finding.
 */

/**
 * How much attention a finding deserves.
 * - info: context worth knowing ("June was warmer than your average").
 * - notice: probably affected an outcome; worth a different plan next year.
 * - warning: strong evidence something went wrong for a specific planting/bed.
 */
export type FindingSeverity = 'info' | 'notice' | 'warning'

/** What a finding is about. All fields optional — a weather-only finding names no bed. */
export interface FindingEntity {
  areaId?: string
  /** Display name resolved at evaluation time so the UI never re-joins. */
  areaName?: string
  plantingId?: string
  plantId?: string
  plantName?: string
  varietyName?: string
}

/** The date range a finding refers to (ISO dates), when it has one. */
export interface FindingDates {
  start?: string
  end?: string
}

export interface Finding {
  /** Stable within a season: `${ruleId}:${year}:${discriminator}`. */
  id: string
  /** Which rule produced this finding. */
  ruleId: string
  severity: FindingSeverity
  /** One plain-English sentence, every number sourced from `metrics`. */
  summary: string
  /** The tested metric values the summary was built from. */
  metrics: Record<string, number | string>
  /** Beds/plantings the finding refers to; empty for plot-wide weather findings. */
  entities: FindingEntity[]
  dates?: FindingDates
}

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  warning: 0,
  notice: 1,
  info: 2,
}

/** Sort findings for display: most severe first, then by start date, then id. */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const severity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (severity !== 0) return severity
    const dateA = a.dates?.start ?? ''
    const dateB = b.dates?.start ?? ''
    if (dateA !== dateB) return dateA.localeCompare(dateB)
    return a.id.localeCompare(b.id)
  })
}
