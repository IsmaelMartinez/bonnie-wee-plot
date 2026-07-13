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
 * Normalise a date-input value before it is stored, clamping it into
 * `[min, max]`. The `<input type="date">` min/max only constrain the picker UI —
 * a user can still clear the field (empty string) or land on an invalid value.
 * Empty, malformed, or impossible calendar dates (e.g. 2026-02-31) fall back to
 * `max`; anything above `max` clamps down to it; anything below `min` clamps up.
 * `max` defaults to today so a lone-arg call still rejects future dates.
 *
 * The Quick Log screen passes the selected season's year bounds so a backdated
 * entry can't be filed into a different season than its date belongs to. The
 * max clamp is applied last, so it always wins over min (a degenerate min > max,
 * e.g. a future season, can never yield a future stored date).
 * YYYY-MM-DD string comparison is safe for these bound checks.
 */
export function normalizeLogDate(
  raw: string,
  max: string = todayLocalISO(),
  min?: string
): string {
  let value = max
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (m) {
    const [, y, mo, d] = m
    // Reject impossible calendar dates by round-tripping the parts through a UTC
    // Date — an overflowed value won't match what was typed.
    const dt = new Date(`${raw}T00:00:00Z`)
    const isRealDate =
      !Number.isNaN(dt.getTime()) &&
      dt.getUTCFullYear() === Number(y) &&
      dt.getUTCMonth() + 1 === Number(mo) &&
      dt.getUTCDate() === Number(d)
    if (isRealDate) value = raw
  }
  if (min && value < min) value = min
  if (value > max) value = max
  return value
}
