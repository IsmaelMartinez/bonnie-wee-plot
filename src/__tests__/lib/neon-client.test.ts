import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AllotmentData } from '@/types/unified-allotment'

// Mock @neondatabase/serverless
const mockQuery = vi.fn()
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockQuery),
}))

const mockData: AllotmentData = {
  version: 18,
  meta: { name: 'Test', updatedAt: '2026-04-07T12:00:00Z' },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2026,
  varieties: [],
} as unknown as AllotmentData

describe('Neon client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@test-pooler.neon.tech/neondb')
  })

  it('fetchAllotment returns data when row exists', async () => {
    mockQuery.mockResolvedValue([{
      data: mockData,
      updated_at: '2026-04-07T12:00:00Z',
    }])

    const { fetchAllotment } = await import('@/lib/neon/client')
    const result = await fetchAllotment('user-123')
    expect(result).toEqual({ data: mockData, updatedAt: '2026-04-07T12:00:00Z' })
    // Tagged template literals pass (strings, ...values) — check userId was interpolated
    expect(mockQuery).toHaveBeenCalledOnce()
    const args = mockQuery.mock.calls[0]
    // args[0] is the TemplateStringsArray, args[1] is the first interpolated value
    expect(args[1]).toBe('user-123')
  })

  it('fetchAllotment returns null when no row exists', async () => {
    mockQuery.mockResolvedValue([])

    const { fetchAllotment } = await import('@/lib/neon/client')
    const result = await fetchAllotment('user-123')
    expect(result).toBeNull()
  })

  it('upsertAllotment calls SQL with userId and serialized data', async () => {
    mockQuery.mockResolvedValue([])

    const { upsertAllotment } = await import('@/lib/neon/client')
    await upsertAllotment('user-123', mockData)
    expect(mockQuery).toHaveBeenCalledOnce()
    const args = mockQuery.mock.calls[0]
    // First interpolated value is userId, second and third are the JSON data
    expect(args[1]).toBe('user-123')
    expect(args[2]).toBe(JSON.stringify(mockData))
  })

  it('deleteAllotment calls SQL with userId', async () => {
    mockQuery.mockResolvedValue([])

    const { deleteAllotment } = await import('@/lib/neon/client')
    await deleteAllotment('user-123')
    expect(mockQuery).toHaveBeenCalledOnce()
    const args = mockQuery.mock.calls[0]
    expect(args[1]).toBe('user-123')
  })
})
