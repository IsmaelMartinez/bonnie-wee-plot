import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchRemote,
  pushToRemote,
  deleteRemote,
  fetchHistoryList,
  fetchHistorySnapshot,
} from '@/lib/supabase/sync'
import type { AllotmentData } from '@/types/unified-allotment'

// Mock the Supabase client module
const mockSelect = vi.fn()
const mockUpsert = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

const mockFrom = vi.fn(() => ({
  select: mockSelect.mockReturnValue({
    eq: mockEq.mockReturnValue({
      single: mockSingle,
    }),
  }),
  upsert: mockUpsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn(),
    }),
  }),
  delete: mockDelete.mockReturnValue({
    eq: mockEq,
  }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createAuthClient: vi.fn(() => ({ from: mockFrom })),
  isSupabaseConfigured: vi.fn(() => true),
}))

const mockData: AllotmentData = {
  version: 16,
  meta: { name: 'Test', lastModified: '2026-03-04T12:00:00Z' },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2026,
  varieties: [],
} as unknown as AllotmentData

describe('fetchRemote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns data and updated_at when row exists', async () => {
    mockSingle.mockResolvedValue({
      data: { data: mockData, updated_at: '2026-03-04T12:00:00Z' },
      error: null,
    })
    const result = await fetchRemote('token', 'user-123')
    expect(result).toEqual({
      data: mockData,
      updatedAt: '2026-03-04T12:00:00Z',
    })
  })

  it('returns null when no row exists', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    })
    const result = await fetchRemote('token', 'user-123')
    expect(result).toBeNull()
  })

  it('throws on unexpected errors', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'OTHER', message: 'Connection failed' },
    })
    await expect(fetchRemote('token', 'user-123')).rejects.toThrow('Connection failed')
  })
})

describe('pushToRemote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts data with user_id and onConflict', async () => {
    const mockUpsertFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockReturnValueOnce({ upsert: mockUpsertFn } as any)

    await pushToRemote('token', 'user-123', mockData)
    expect(mockFrom).toHaveBeenCalledWith('allotments')
    expect(mockUpsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        data: mockData,
        updated_at: expect.any(String),
      }),
      { onConflict: 'user_id' }
    )
  })
})

describe('deleteRemote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the row for the given user_id', async () => {
    mockEq.mockResolvedValue({ error: null })
    await deleteRemote('token', 'user-123')
    expect(mockFrom).toHaveBeenCalledWith('allotments')
    expect(mockDelete).toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
  })
})

describe('fetchHistoryList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries allotment_history with ordering, limit, and user filter', async () => {
    const mockOrder = vi.fn().mockReturnThis()
    const mockLimit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 7,
          archived_at: '2026-05-08T10:00:00Z',
          data: {
            ...mockData,
            seasons: [
              {
                year: 2026,
                areas: [{ areaId: 'a', plantings: [{ id: 'p1' }, { id: 'p2' }] }],
              },
            ],
            layout: { areas: [{ id: 'a' }] },
            varieties: [{ id: 'v1' }],
          },
        },
      ],
      error: null,
    })
    const mockEqHist = vi.fn().mockReturnValue({ order: mockOrder, limit: mockLimit })
    mockOrder.mockReturnValue({ limit: mockLimit })
    const mockSelectHist = vi.fn().mockReturnValue({ eq: mockEqHist })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockReturnValueOnce({ select: mockSelectHist } as any)

    const result = await fetchHistoryList('token', 'user-123', 5)

    expect(mockFrom).toHaveBeenCalledWith('allotment_history')
    expect(mockSelectHist).toHaveBeenCalledWith('id, archived_at, data')
    expect(mockEqHist).toHaveBeenCalledWith('user_id', 'user-123')
    expect(mockOrder).toHaveBeenCalledWith('archived_at', { ascending: false })
    expect(mockLimit).toHaveBeenCalledWith(5)
    expect(result).toEqual([
      {
        id: 7,
        archivedAt: '2026-05-08T10:00:00Z',
        summary: { plantings: 2, areas: 1, varieties: 1 },
      },
    ])
  })

  it('returns empty array when no rows', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockEqHist = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelectHist = vi.fn().mockReturnValue({ eq: mockEqHist })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockReturnValueOnce({ select: mockSelectHist } as any)

    const result = await fetchHistoryList('token', 'user-123')
    expect(result).toEqual([])
  })

  it('throws on supabase errors', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockEqHist = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelectHist = vi.fn().mockReturnValue({ eq: mockEqHist })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockReturnValueOnce({ select: mockSelectHist } as any)

    await expect(fetchHistoryList('token', 'user-123')).rejects.toThrow('boom')
  })
})

describe('fetchHistorySnapshot', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the snapshot when row exists', async () => {
    const mockSingleHist = vi.fn().mockResolvedValue({ data: { data: mockData }, error: null })
    const mockEqId = vi.fn().mockReturnValue({ single: mockSingleHist })
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqId })
    const mockSelectHist = vi.fn().mockReturnValue({ eq: mockEqUser })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockReturnValueOnce({ select: mockSelectHist } as any)

    const result = await fetchHistorySnapshot('token', 'user-123', 7)
    expect(mockFrom).toHaveBeenCalledWith('allotment_history')
    expect(mockEqUser).toHaveBeenCalledWith('user_id', 'user-123')
    expect(mockEqId).toHaveBeenCalledWith('id', 7)
    expect(result).toEqual(mockData)
  })

  it('returns null on PGRST116 (not found)', async () => {
    const mockSingleHist = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    const mockEqId = vi.fn().mockReturnValue({ single: mockSingleHist })
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqId })
    const mockSelectHist = vi.fn().mockReturnValue({ eq: mockEqUser })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockReturnValueOnce({ select: mockSelectHist } as any)

    const result = await fetchHistorySnapshot('token', 'user-123', 7)
    expect(result).toBeNull()
  })

  it('throws on other errors', async () => {
    const mockSingleHist = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'OTHER', message: 'connection failed' },
    })
    const mockEqId = vi.fn().mockReturnValue({ single: mockSingleHist })
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqId })
    const mockSelectHist = vi.fn().mockReturnValue({ eq: mockEqUser })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockReturnValueOnce({ select: mockSelectHist } as any)

    await expect(fetchHistorySnapshot('token', 'user-123', 7)).rejects.toThrow('connection failed')
  })
})
