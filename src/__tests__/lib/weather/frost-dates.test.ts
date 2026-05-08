import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { fetchFrostDates, _resetFrostCacheForTests } from '@/lib/weather/frost-dates'

const ORIGINAL_FETCH = global.fetch

function mockResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response
}

describe('fetchFrostDates', () => {
  beforeEach(() => {
    _resetFrostCacheForTests()
    localStorage.clear()
    global.fetch = vi.fn()
  })
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH
  })

  it('returns null when the API call fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse({}, false, 500))
    const result = await fetchFrostDates(55.95, -3.19)
    expect(result).toBeNull()
  })

  it('derives last spring frost as the average of last frost dates per year', async () => {
    const time: string[] = []
    const temps: number[] = []
    function pushDay(date: string, t: number) {
      time.push(date)
      temps.push(t)
    }
    // 2010 — last spring frost May 14, first autumn frost Oct 30
    pushDay('2010-05-13', -1)
    pushDay('2010-05-14', -1)
    pushDay('2010-05-15', 4)
    pushDay('2010-08-15', 12)
    pushDay('2010-10-30', -1)
    // 2011 — last spring frost May 16, first autumn frost Nov 1
    pushDay('2011-05-15', -1)
    pushDay('2011-05-16', -1)
    pushDay('2011-05-17', 4)
    pushDay('2011-08-15', 12)
    pushDay('2011-11-01', -1)
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse({ daily: { time, temperature_2m_min: temps } })
    )

    const result = await fetchFrostDates(55.95, -3.19)
    expect(result).not.toBeNull()
    expect(result!.lastSpring.endsWith('-05-15')).toBe(true)
    // Oct 30 (DOY 303) and Nov 1 (DOY 305) average to DOY 304 → Oct 31 in
    // a non-leap reference year.
    expect(result!.firstAutumn.endsWith('-10-31')).toBe(true)
    expect(result!.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('returns null when the response has no temperature_2m_min series', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse({ daily: { time: ['2010-01-01'] } })
    )
    const result = await fetchFrostDates(55.95, -3.19)
    expect(result).toBeNull()
  })

  it('caches results and does not refetch on a second call within the same coordinate cell', async () => {
    const time = ['2010-05-14', '2010-05-15', '2010-10-30']
    const temps = [-1, 2, -1]
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse({ daily: { time, temperature_2m_min: temps } })
    )

    const a = await fetchFrostDates(55.95, -3.19)
    const b = await fetchFrostDates(55.95, -3.19)
    expect(a).toEqual(b)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
