import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchRemote,
  pushToRemote,
  deleteRemote,
  fetchHistoryList,
  fetchHistorySnapshot,
  contentSnapshot,
  isLocalStructurallySmaller,
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

function makeData(overrides: Partial<AllotmentData> = {}): AllotmentData {
  return {
    version: 21,
    meta: {
      name: 'Test',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-05-08T12:00:00Z',
    },
    layout: { areas: [] },
    seasons: [],
    currentYear: 2026,
    varieties: [],
    ...overrides,
  } as unknown as AllotmentData
}

describe('contentSnapshot', () => {
  it('returns the same fingerprint regardless of meta.updatedAt', () => {
    const a = makeData({
      meta: {
        name: 'Test',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-05-08T12:00:00Z',
      },
    } as unknown as Partial<AllotmentData>)
    const b = makeData({
      meta: {
        name: 'Test',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-05-08T18:00:00Z',
      },
    } as unknown as Partial<AllotmentData>)
    expect(contentSnapshot(a)).toBe(contentSnapshot(b))
  })

  it('returns different fingerprints when content changes', () => {
    const a = makeData({ currentYear: 2026 })
    const b = makeData({ currentYear: 2027 })
    expect(contentSnapshot(a)).not.toBe(contentSnapshot(b))
  })
})

describe('isLocalStructurallySmaller', () => {
  it('returns true when local has fewer plantings than remote', () => {
    const remote = makeData({
      seasons: [
        {
          year: 2026,
          status: 'current',
          areas: [
            { areaId: 'a', plantings: [{ id: 'p1' }, { id: 'p2' }] },
          ],
        } as unknown,
      ] as unknown as AllotmentData['seasons'],
    })
    const local = makeData({
      seasons: [
        {
          year: 2026,
          status: 'current',
          areas: [{ areaId: 'a', plantings: [{ id: 'p1' }] }],
        } as unknown,
      ] as unknown as AllotmentData['seasons'],
    })
    expect(isLocalStructurallySmaller(local, remote)).toBe(true)
  })

  it('returns true when local has fewer areas than remote', () => {
    const remote = makeData({ layout: { areas: [{ id: 'a' }, { id: 'b' }] } as unknown as AllotmentData['layout'] })
    const local = makeData({ layout: { areas: [{ id: 'a' }] } as unknown as AllotmentData['layout'] })
    expect(isLocalStructurallySmaller(local, remote)).toBe(true)
  })

  it('returns true when local has fewer varieties than remote', () => {
    const remote = makeData({ varieties: [{ id: 'v1' }, { id: 'v2' }] as unknown as AllotmentData['varieties'] })
    const local = makeData({ varieties: [{ id: 'v1' }] as unknown as AllotmentData['varieties'] })
    expect(isLocalStructurallySmaller(local, remote)).toBe(true)
  })

  it('returns false when local matches remote on all axes', () => {
    const data = makeData({
      layout: { areas: [{ id: 'a' }] } as unknown as AllotmentData['layout'],
      varieties: [{ id: 'v1' }] as unknown as AllotmentData['varieties'],
    })
    expect(isLocalStructurallySmaller(data, data)).toBe(false)
  })

  it('returns false when local has more content than remote', () => {
    const local = makeData({
      varieties: [{ id: 'v1' }, { id: 'v2' }] as unknown as AllotmentData['varieties'],
    })
    const remote = makeData({
      varieties: [{ id: 'v1' }] as unknown as AllotmentData['varieties'],
    })
    expect(isLocalStructurallySmaller(local, remote)).toBe(false)
  })
})

describe('fetchHistoryList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries allotment_history with partial JSON projection, ordering, limit and user filter', async () => {
    // PostgREST returns the aliased JSON paths as top-level columns.
    const mockOrder = vi.fn().mockReturnThis()
    const mockLimit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 7,
          archived_at: '2026-05-08T10:00:00Z',
          areas: [{ id: 'a' }, { id: 'b' }],
          varieties: [{ id: 'v1' }],
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
    // Crucially the select does NOT include the full `data` blob — only the
    // narrow `data->layout->areas` and `data->varieties` projections — so
    // the list query stays bounded even for large allotments.
    expect(mockSelectHist).toHaveBeenCalledWith(
      'id, archived_at, areas:data->layout->areas, varieties:data->varieties'
    )
    expect(mockEqHist).toHaveBeenCalledWith('user_id', 'user-123')
    expect(mockOrder).toHaveBeenCalledWith('archived_at', { ascending: false })
    expect(mockLimit).toHaveBeenCalledWith(5)
    expect(result).toEqual([
      {
        id: 7,
        archivedAt: '2026-05-08T10:00:00Z',
        summary: { areas: 2, varieties: 1 },
      },
    ])
  })

  it('treats missing JSON projections as zero counts', async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      data: [{ id: 1, archived_at: '2026-05-08T10:00:00Z', areas: null, varieties: null }],
      error: null,
    })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockEqHist = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelectHist = vi.fn().mockReturnValue({ eq: mockEqHist })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockReturnValueOnce({ select: mockSelectHist } as any)

    const result = await fetchHistoryList('token', 'user-123')
    expect(result).toEqual([
      { id: 1, archivedAt: '2026-05-08T10:00:00Z', summary: { areas: 0, varieties: 0 } },
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
