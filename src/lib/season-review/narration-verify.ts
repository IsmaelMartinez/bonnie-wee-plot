/**
 * Narration number verification (Phase 2c).
 *
 * The LLM narration layer is only trustworthy because of this module: after a
 * model drafts a season narrative, every numeric token in the draft must be
 * vouched for by the deterministic findings (their summaries, metric values,
 * or dates) or by a small derived allowance (the season year, the year after
 * it for "next year" phrasing, and the finding counts). A draft containing
 * any number the findings can't account for is rejected outright and the UI
 * falls back to the plain findings list.
 *
 * Deliberately conservative: rounding, unit conversion, and arithmetic the
 * model performs itself all fail verification. A false rejection costs a
 * paragraph of prose; a false acceptance costs trust in the whole report.
 */

import type { Finding } from './findings'

export interface NarrationVerification {
  ok: boolean
  /** Numeric tokens in the narration no finding vouches for (canonical, deduped). */
  unverifiedNumbers: string[]
}

/** Context numbers that are fair game even though no finding contains them. */
export interface VerificationMeta {
  /** The season year under review (also allows year + 1 for "next year"). */
  year: number
}

/**
 * Join digit groups split by thousands separators ("1,200" → "1200") without
 * touching list commas ("3, 14" stays two tokens: the comma is only removed
 * when exactly three digits follow).
 */
function stripThousandsSeparators(text: string): string {
  return text.replace(/(\d),(?=\d{3}(?!\d))/g, '$1')
}

/**
 * Canonical form of a numeric token so formatting differences never matter:
 * "21.50" and "21.5" compare equal, "07" reads as "7", ".5" reads as "0.5".
 * Sign is not captured — verification compares magnitudes ("-60mm" and "a
 * 60mm deficit" are the same fact wearing different grammar).
 */
function canonicalize(token: string): string {
  return String(Number.parseFloat(token))
}

/**
 * Extract every numeric token from free text, canonicalized. Bare-dot
 * decimals (".5") are matched whole — splitting one into "5" would let a
 * draft's ".5" ride on an unrelated vouched-for 5.
 */
export function extractNumericTokens(text: string): string[] {
  const matches = stripThousandsSeparators(text).match(/\d+(?:\.\d+)?|\.\d+/g) ?? []
  return matches.map(canonicalize)
}

/**
 * Every number the findings can vouch for: numeric tokens in each summary,
 * each metrics value (numbers and numeric fragments of strings), each date
 * (ISO parts, so "2025-06-14" vouches for 2025, 6 and 14), plus the derived
 * allowance (year, year + 1, total and per-severity finding counts).
 */
export function collectAllowedNumbers(
  findings: Finding[],
  meta: VerificationMeta
): Set<string> {
  const allowed = new Set<string>()
  const addFromText = (text: string | undefined) => {
    if (!text) return
    for (const token of extractNumericTokens(text)) allowed.add(token)
  }

  for (const finding of findings) {
    addFromText(finding.summary)
    for (const value of Object.values(finding.metrics)) {
      addFromText(String(value))
    }
    addFromText(finding.dates?.start)
    addFromText(finding.dates?.end)
  }

  allowed.add(canonicalize(String(meta.year)))
  allowed.add(canonicalize(String(meta.year + 1)))
  allowed.add(canonicalize(String(findings.length)))
  // Count every severity, present or not, so "you had 2 notices and 0
  // warnings" isn't rejected over the 0.
  const severities: Finding['severity'][] = ['warning', 'notice', 'info']
  for (const severity of severities) {
    const count = findings.filter((f) => f.severity === severity).length
    allowed.add(canonicalize(String(count)))
  }

  return allowed
}

/**
 * Check a narration draft against the findings. `ok` is true only when every
 * numeric token in the draft is vouched for. Prose with no numbers passes —
 * the checker guards against invented quantities, not dullness.
 */
export function verifyNarration(
  narration: string,
  findings: Finding[],
  meta: VerificationMeta
): NarrationVerification {
  const allowed = collectAllowedNumbers(findings, meta)
  const unverified = new Set<string>()
  for (const token of extractNumericTokens(narration)) {
    if (!allowed.has(token)) unverified.add(token)
  }
  return { ok: unverified.size === 0, unverifiedNumbers: [...unverified] }
}
