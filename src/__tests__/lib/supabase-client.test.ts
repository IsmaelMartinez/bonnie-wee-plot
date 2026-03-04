import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('Supabase client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  it('createAnonClient returns a Supabase client', async () => {
    const { createAnonClient } = await import('@/lib/supabase/client')
    const client = createAnonClient()
    expect(client).toBeDefined()
    expect(client.from).toBeDefined()
  })

  it('createAuthClient returns a client with Authorization header', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const { createAuthClient } = await import('@/lib/supabase/client')
    createAuthClient('test-token-123')
    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        global: {
          headers: { Authorization: 'Bearer test-token-123' },
        },
      })
    )
  })

  it('isSupabaseConfigured returns false when env vars missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    const { isSupabaseConfigured } = await import('@/lib/supabase/client')
    expect(isSupabaseConfigured()).toBe(false)
  })
})
