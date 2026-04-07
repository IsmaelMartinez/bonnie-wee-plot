import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AllotmentData } from '@/types/unified-allotment'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/neon/client', () => ({
  fetchAllotment: vi.fn(),
  upsertAllotment: vi.fn(),
  deleteAllotment: vi.fn(),
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthReturn = any

const mockData: AllotmentData = {
  version: 18,
  meta: { name: 'Test', updatedAt: '2026-04-07T12:00:00Z' },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2026,
  varieties: [],
} as unknown as AllotmentData

describe('GET /api/sync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturn)
    const { GET } = await import('@/app/api/sync/route')
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns 404 when no data exists', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as AuthReturn)
    const { fetchAllotment } = await import('@/lib/neon/client')
    vi.mocked(fetchAllotment).mockResolvedValue(null)
    const { GET } = await import('@/app/api/sync/route')
    const response = await GET()
    expect(response.status).toBe(404)
  })

  it('returns allotment data when it exists', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as AuthReturn)
    const { fetchAllotment } = await import('@/lib/neon/client')
    vi.mocked(fetchAllotment).mockResolvedValue({
      data: mockData,
      updatedAt: '2026-04-07T12:00:00Z',
    })
    const { GET } = await import('@/app/api/sync/route')
    const response = await GET()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.meta.name).toBe('Test')
    expect(body.updatedAt).toBe('2026-04-07T12:00:00Z')
  })
})

describe('PUT /api/sync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturn)
    const { PUT } = await import('@/app/api/sync/route')
    const request = new Request('http://localhost/api/sync', {
      method: 'PUT',
      body: JSON.stringify({ data: mockData }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(request)
    expect(response.status).toBe(401)
  })

  it('upserts data and returns 200', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as AuthReturn)
    const { upsertAllotment } = await import('@/lib/neon/client')
    vi.mocked(upsertAllotment).mockResolvedValue(undefined)
    const { PUT } = await import('@/app/api/sync/route')
    const request = new Request('http://localhost/api/sync', {
      method: 'PUT',
      body: JSON.stringify({ data: mockData }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(request)
    expect(response.status).toBe(200)
    expect(upsertAllotment).toHaveBeenCalledWith('user-123', mockData)
  })
})

describe('DELETE /api/sync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturn)
    const { DELETE } = await import('@/app/api/sync/route')
    const response = await DELETE()
    expect(response.status).toBe(401)
  })

  it('deletes data and returns 200', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as AuthReturn)
    const { deleteAllotment } = await import('@/lib/neon/client')
    vi.mocked(deleteAllotment).mockResolvedValue(undefined)
    const { DELETE } = await import('@/app/api/sync/route')
    const response = await DELETE()
    expect(response.status).toBe(200)
    expect(deleteAllotment).toHaveBeenCalledWith('user-123')
  })
})
