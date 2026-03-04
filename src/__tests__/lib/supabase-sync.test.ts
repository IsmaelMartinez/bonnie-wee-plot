import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchRemote, pushToRemote, deleteRemote } from '@/lib/supabase/sync'
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

  it('upserts data with user_id and updated_at', async () => {
    const mockUpsertChain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    mockFrom.mockReturnValueOnce({
      upsert: vi.fn().mockReturnValue(mockUpsertChain),
    } as any)

    await pushToRemote('token', 'user-123', mockData)
    expect(mockFrom).toHaveBeenCalledWith('allotments')
  })
})

describe('deleteRemote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the row for the given user', async () => {
    mockEq.mockResolvedValue({ error: null })
    await deleteRemote('token', 'user-123')
    expect(mockFrom).toHaveBeenCalledWith('allotments')
  })
})
