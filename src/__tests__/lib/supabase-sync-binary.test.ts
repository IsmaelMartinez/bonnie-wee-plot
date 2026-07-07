import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  bytesToPgHex,
  pgHexToBytes,
  fetchRemoteBinary,
  pushBinary,
} from '@/lib/supabase/sync-binary'
import type { AllotmentData } from '@/types/unified-allotment'

const mockFrom = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createAuthClient: vi.fn(() => ({ from: mockFrom })),
  isSupabaseConfigured: vi.fn(() => true),
}))

const jsonMirror = {
  version: 22,
  meta: { name: 'Test' },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2026,
  varieties: [],
} as unknown as AllotmentData

describe('bytea hex codec', () => {
  it('round-trips arbitrary bytes through the Postgres hex format', () => {
    const bytes = new Uint8Array([0, 1, 15, 16, 127, 128, 255, 42])
    const hex = bytesToPgHex(bytes)
    expect(hex).toBe('\\x00010f107f80ff2a')
    expect(Array.from(pgHexToBytes(hex))).toEqual(Array.from(bytes))
  })

  it('decodes a hex string without the leading \\x', () => {
    expect(Array.from(pgHexToBytes('00ff'))).toEqual([0, 255])
  })

  it('round-trips an empty array', () => {
    expect(bytesToPgHex(new Uint8Array())).toBe('\\x')
    expect(pgHexToBytes('\\x').length).toBe(0)
  })
})

describe('fetchRemoteBinary', () => {
  beforeEach(() => vi.clearAllMocks())

  function mockRow(row: unknown, error: unknown = null) {
    const single = vi.fn().mockResolvedValue({ data: row, error })
    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ select })
    return { select, eq, single }
  }

  it('decodes yjs_state and returns the CAS token + jsonb mirror', async () => {
    const { select } = mockRow({
      yjs_state: '\\x00ff2a',
      yjs_updated_at: '2026-07-01T10:00:00Z',
      data: jsonMirror,
    })
    const result = await fetchRemoteBinary('token', 'user-1')
    expect(select).toHaveBeenCalledWith('yjs_state, yjs_updated_at, data')
    expect(result.exists).toBe(true)
    expect(Array.from(result.update!)).toEqual([0, 255, 42])
    expect(result.yjsUpdatedAt).toBe('2026-07-01T10:00:00Z')
    expect(result.jsonb).toEqual(jsonMirror)
  })

  it('returns update=null when the row exists but has not been migrated', async () => {
    mockRow({ yjs_state: null, yjs_updated_at: null, data: jsonMirror })
    const result = await fetchRemoteBinary('token', 'user-1')
    expect(result.exists).toBe(true)
    expect(result.update).toBeNull()
    expect(result.yjsUpdatedAt).toBeNull()
    expect(result.jsonb).toEqual(jsonMirror)
  })

  it('returns exists=false when no row (PGRST116)', async () => {
    mockRow(null, { code: 'PGRST116' })
    const result = await fetchRemoteBinary('token', 'user-1')
    expect(result).toEqual({ exists: false, update: null, yjsUpdatedAt: null, jsonb: null })
  })

  it('throws on other errors', async () => {
    mockRow(null, { code: 'OTHER', message: 'boom' })
    await expect(fetchRemoteBinary('token', 'user-1')).rejects.toThrow('boom')
  })
})

describe('pushBinary', () => {
  beforeEach(() => vi.clearAllMocks())
  const update = new Uint8Array([1, 2, 3])

  it('inserts a new row when none exists', async () => {
    const single = vi.fn().mockResolvedValue({ data: { yjs_updated_at: 'T1' }, error: null })
    const selectAfter = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select: selectAfter })
    mockFrom.mockReturnValue({ insert })

    const res = await pushBinary('token', 'user-1', update, jsonMirror, {
      rowExists: false,
      expectedYjsUpdatedAt: null,
    })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        yjs_state: '\\x010203',
        data: jsonMirror,
      }),
    )
    expect(res).toEqual({ ok: true, casConflict: false, yjsUpdatedAt: 'T1' })
  })

  it('reports casConflict when a concurrent insert wins (unique violation)', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: '23505' } })
    const selectAfter = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select: selectAfter })
    mockFrom.mockReturnValue({ insert })

    const res = await pushBinary('token', 'user-1', update, jsonMirror, {
      rowExists: false,
      expectedYjsUpdatedAt: null,
    })
    expect(res.ok).toBe(false)
    expect(res.casConflict).toBe(true)
  })

  it('updates with an equality CAS predicate and reports success', async () => {
    const selectAfter = vi.fn().mockResolvedValue({ data: [{ yjs_updated_at: 'T2' }], error: null })
    const eqYjs = vi.fn().mockReturnValue({ select: selectAfter })
    const isNull = vi.fn().mockReturnValue({ select: selectAfter })
    const eqUser = vi.fn().mockReturnValue({ is: isNull, eq: eqYjs })
    const updateFn = vi.fn().mockReturnValue({ eq: eqUser })
    mockFrom.mockReturnValue({ update: updateFn })

    const res = await pushBinary('token', 'user-1', update, jsonMirror, {
      rowExists: true,
      expectedYjsUpdatedAt: 'T1',
    })
    expect(eqUser).toHaveBeenCalledWith('user_id', 'user-1')
    expect(eqYjs).toHaveBeenCalledWith('yjs_updated_at', 'T1')
    expect(res).toEqual({ ok: true, casConflict: false, yjsUpdatedAt: 'T2' })
  })

  it('uses an IS NULL CAS predicate when migrating (expected token null)', async () => {
    const selectAfter = vi.fn().mockResolvedValue({ data: [{ yjs_updated_at: 'T2' }], error: null })
    const isNull = vi.fn().mockReturnValue({ select: selectAfter })
    const eqUser = vi.fn().mockReturnValue({ is: isNull })
    const updateFn = vi.fn().mockReturnValue({ eq: eqUser })
    mockFrom.mockReturnValue({ update: updateFn })

    await pushBinary('token', 'user-1', update, jsonMirror, {
      rowExists: true,
      expectedYjsUpdatedAt: null,
    })
    expect(isNull).toHaveBeenCalledWith('yjs_updated_at', null)
  })

  it('reports casConflict when the CAS predicate matches no rows', async () => {
    const selectAfter = vi.fn().mockResolvedValue({ data: [], error: null })
    const eqYjs = vi.fn().mockReturnValue({ select: selectAfter })
    const eqUser = vi.fn().mockReturnValue({ eq: eqYjs })
    const updateFn = vi.fn().mockReturnValue({ eq: eqUser })
    mockFrom.mockReturnValue({ update: updateFn })

    const res = await pushBinary('token', 'user-1', update, jsonMirror, {
      rowExists: true,
      expectedYjsUpdatedAt: 'stale-token',
    })
    expect(res.ok).toBe(false)
    expect(res.casConflict).toBe(true)
  })
})
