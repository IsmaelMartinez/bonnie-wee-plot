import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/health/route'

const ENV_KEYS = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

describe('GET /api/health', () => {
  const savedEnv: Record<string, string | undefined> = {}
  const fetchMock = vi.fn()

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key]
      delete process.env[key]
    }
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key]
      else process.env[key] = savedEnv[key]
    }
    vi.unstubAllGlobals()
  })

  it('reports dependencies unavailable and makes no calls when unconfigured', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('healthy')
    expect(body.redis).toBe('unavailable')
    expect(body.supabase).toBe('unavailable')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('pings Supabase with the anon key and reports ok', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }))

    const body = await (await GET()).json()

    expect(body.supabase).toBe('ok')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://example.supabase.co/rest/v1/allotments?select=user_id&limit=1')
    expect(init.headers).toEqual({ apikey: 'anon-key', Authorization: 'Bearer anon-key' })
  })

  it('stays healthy when the Supabase ping fails', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://paused.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('healthy')
    expect(body.supabase).toBe('unavailable')
  })

  it('reports Supabase unavailable on a non-2xx response', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    fetchMock.mockResolvedValue(new Response('', { status: 503 }))

    const body = await (await GET()).json()
    expect(body.supabase).toBe('unavailable')
  })

  it('pings Redis and Supabase together when both are configured', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'redis-token'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    fetchMock.mockImplementation(async () => new Response('ok', { status: 200 }))

    const body = await (await GET()).json()

    expect(body.redis).toBe('ok')
    expect(body.supabase).toBe('ok')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls.map(c => c[0])).toContain('https://redis.example/ping')
  })
})
