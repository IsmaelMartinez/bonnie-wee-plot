/**
 * Date helpers for the Quick Log capture screen.
 *
 * Pure and deterministic so they can be unit-tested and so every stored
 * care-log entry is guaranteed a valid, non-future YYYY-MM-DD date — otherwise
 * downstream renderers (e.g. CareLogSection.formatDate) can hit an invalid Date
 * and future dates could leak into a season report.
 */

/**
 * Today's date as a local YYYY-MM-DD string. Built from local date parts (not
 * UTC) so it rolls over at the user's midnight, and by hand (not
 * toLocaleDateString) so the format is guaranteed regardless of runtime locale.
 */
export function todayLocalISO(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Normalise a date-input value before it is stored. The `<input type="date">`
 * max only constrains the picker UI — a user can still clear the field (empty
 * string) or land on an invalid/future value. Empty, malformed, or impossible
 * calendar dates (e.g. 2026-02-31) fall back to `today`; future dates clamp to
 * `today`. YYYY-MM-DD string comparison is safe for the not-future check.
 */
export function normalizeLogDate(raw: string, today: string = todayLocalISO()): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (!m) return today
  const [, y, mo, d] = m
  // Reject impossible calendar dates by round-tripping the parts through a UTC
  // Date — an overflowed value won't match what was typed.
  const dt = new Date(`${raw}T00:00:00Z`)
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getUTCFullYear() !== Number(y) ||
    dt.getUTCMonth() + 1 !== Number(mo) ||
    dt.getUTCDate() !== Number(d)
  ) {
    return today
  }
  return raw > today ? today : raw
}
