import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Clerk server auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// Mock Supabase sync
vi.mock('@/lib/supabase/sync', () => ({
  fetchRemote: vi.fn(),
  deleteRemote: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: vi.fn(() => true),
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Clerk auth() return type is complex; partial mock is sufficient for tests
type AuthReturn = any

describe('GET /api/account (export)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturn)

    const { GET } = await import('@/app/api/account/route')
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns user data as JSON when authenticated', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({
      userId: 'user-123',
      getToken: vi.fn().mockResolvedValue('test-token'),
    } as AuthReturn)

    const { fetchRemote } = await import('@/lib/supabase/sync')
    vi.mocked(fetchRemote).mockResolvedValue({
      data: { version: 16, meta: { name: 'Test' } } as unknown as import('@/types/unified-allotment').AllotmentData,
      updatedAt: '2026-03-04T12:00:00Z',
    })

    const { GET } = await import('@/app/api/account/route')
    const response = await GET()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta.name).toBe('Test')
  })
})

describe('DELETE /api/account', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturn)

    const { DELETE } = await import('@/app/api/account/route')
    const response = await DELETE()
    expect(response.status).toBe(401)
  })

  it('deletes user data and returns success', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({
      userId: 'user-123',
      getToken: vi.fn().mockResolvedValue('test-token'),
    } as AuthReturn)

    const { deleteRemote } = await import('@/lib/supabase/sync')
    vi.mocked(deleteRemote).mockResolvedValue(undefined)

    const { DELETE } = await import('@/app/api/account/route')
    const response = await DELETE()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(deleteRemote).toHaveBeenCalledWith('test-token', 'user-123')
  })
})
