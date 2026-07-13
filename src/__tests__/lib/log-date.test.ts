import { describe, it, expect } from 'vitest'
import { normalizeLogDate, todayLocalISO } from '@/lib/log-date'

describe('log-date helpers', () => {
  describe('todayLocalISO', () => {
    it('formats local date parts as YYYY-MM-DD', () => {
      // 5 March 2026, local time — single-digit month/day must be zero-padded.
      const d = new Date(2026, 2, 5, 23, 30)
      expect(todayLocalISO(d)).toBe('2026-03-05')
    })

    it('uses local (not UTC) date parts', () => {
      // Construct a local date; the string must reflect the local Y/M/D.
      const d = new Date(2026, 0, 1, 12, 0)
      expect(todayLocalISO(d)).toBe('2026-01-01')
    })
  })

  describe('normalizeLogDate', () => {
    const today = '2026-07-12'

    it('passes through a valid, non-future date', () => {
      expect(normalizeLogDate('2026-05-01', today)).toBe('2026-05-01')
      expect(normalizeLogDate(today, today)).toBe(today)
    })

    it('falls back to today for empty or malformed input', () => {
      expect(normalizeLogDate('', today)).toBe(today)
      expect(normalizeLogDate('not-a-date', today)).toBe(today)
      expect(normalizeLogDate('2026/07/12', today)).toBe(today)
      expect(normalizeLogDate('26-7-1', today)).toBe(today)
    })

    it('clamps a future date to today', () => {
      expect(normalizeLogDate('2027-01-01', today)).toBe(today)
      expect(normalizeLogDate('2026-07-13', today)).toBe(today)
    })

    it('rejects impossible calendar dates that would overflow', () => {
      expect(normalizeLogDate('2026-02-31', today)).toBe(today)
      expect(normalizeLogDate('2026-13-01', today)).toBe(today)
      expect(normalizeLogDate('2026-00-10', today)).toBe(today)
      expect(normalizeLogDate('2026-04-31', today)).toBe(today)
    })

    it('accepts a real leap day and rejects a non-leap-year 29 Feb', () => {
      expect(normalizeLogDate('2024-02-29', today)).toBe('2024-02-29') // 2024 is a leap year
      expect(normalizeLogDate('2026-02-29', today)).toBe(today)        // 2026 is not
    })

    describe('with season [min, max] bounds', () => {
      // Simulate the /log page: entries filed into the 2026 season, so the date
      // must fall in 2026. max = today (mid-season), min = Jan 1.
      const seasonMin = '2026-01-01'
      const seasonMax = '2026-07-12'

      it('passes through an in-season date', () => {
        expect(normalizeLogDate('2026-05-01', seasonMax, seasonMin)).toBe('2026-05-01')
      })

      it('clamps a date from an earlier year up to the season start', () => {
        expect(normalizeLogDate('2024-08-15', seasonMax, seasonMin)).toBe(seasonMin)
        expect(normalizeLogDate('2025-12-31', seasonMax, seasonMin)).toBe(seasonMin)
      })

      it('clamps a date past the max down to the max', () => {
        expect(normalizeLogDate('2026-11-30', seasonMax, seasonMin)).toBe(seasonMax)
        expect(normalizeLogDate('2027-01-01', seasonMax, seasonMin)).toBe(seasonMax)
      })

      it('falls back to max for empty/invalid even with a min bound', () => {
        expect(normalizeLogDate('', seasonMax, seasonMin)).toBe(seasonMax)
        expect(normalizeLogDate('2026-02-31', seasonMax, seasonMin)).toBe(seasonMax)
      })

      it('never yields a future date when min > max (degenerate future season)', () => {
        // A future season: min is after max(today). The max clamp wins last.
        expect(normalizeLogDate('2030-06-01', '2026-07-12', '2027-01-01')).toBe('2026-07-12')
      })
    })
  })
})
