import { describe, it, expect, vi, beforeEach } from 'vitest'
import { currentYearMonth, FREE_TIER_MONTHLY_QUOTA, getCurrentUsage, incrementUsage } from '@/lib/supabase/ai-usage'

const mockMaybeSingle = vi.fn()
const mockUpsert = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createAuthClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      }),
      upsert: mockUpsert,
    }),
    rpc: mockRpc,
  }),
}))

describe('currentYearMonth', () => {
  it('formats a date as YYYY-MM in UTC', () => {
    expect(currentYearMonth(new Date('2026-05-09T22:00:00Z'))).toBe('2026-05-09'.slice(0, 7))
  })

  it('zero-pads single-digit months', () => {
    expect(currentYearMonth(new Date('2026-03-15T00:00:00Z'))).toBe('2026-03')
  })

  it('uses UTC, not local time', () => {
    // 23:30 UTC on the 31st of January is still January in UTC even if the
    // user's local time has rolled over to February.
    expect(currentYearMonth(new Date('2026-01-31T23:30:00Z'))).toBe('2026-01')
  })
})

describe('getCurrentUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 0 used / quota remaining when no row exists', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const usage = await getCurrentUsage('token', 'user-123', new Date('2026-05-09T00:00:00Z'))
    expect(usage).toEqual({
      yearMonth: '2026-05',
      requestCount: 0,
      remaining: FREE_TIER_MONTHLY_QUOTA,
    })
  })

  it('returns the row count and computes remaining', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { request_count: 12 }, error: null })
    const usage = await getCurrentUsage('token', 'user-123', new Date('2026-05-09T00:00:00Z'))
    expect(usage.requestCount).toBe(12)
    expect(usage.remaining).toBe(FREE_TIER_MONTHLY_QUOTA - 12)
  })

  it('clamps remaining at 0 when usage exceeds quota', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { request_count: FREE_TIER_MONTHLY_QUOTA + 5 },
      error: null,
    })
    const usage = await getCurrentUsage('token', 'user-123', new Date('2026-05-09T00:00:00Z'))
    expect(usage.remaining).toBe(0)
  })

  it('throws when the read fails', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
    await expect(getCurrentUsage('token', 'user-123')).rejects.toThrow('boom')
  })
})

describe('incrementUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // End users have no INSERT/UPDATE policy on ai_usage (sql/006), so the
  // increment must go through the SECURITY DEFINER RPC, which does a single
  // atomic INSERT ... ON CONFLICT DO UPDATE SET request_count + 1.
  it('increments atomically through the increment_ai_usage RPC', async () => {
    mockRpc.mockResolvedValueOnce({ data: 8, error: null })
    const newCount = await incrementUsage('token')
    expect(newCount).toBe(8)
    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(mockRpc).toHaveBeenCalledWith('increment_ai_usage')
  })

  it('never reads-then-writes the row directly', async () => {
    mockRpc.mockResolvedValueOnce({ data: 1, error: null })
    await incrementUsage('token')
    expect(mockMaybeSingle).not.toHaveBeenCalled()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('throws when the RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'denied' } })
    await expect(incrementUsage('token')).rejects.toThrow('denied')
  })
})
