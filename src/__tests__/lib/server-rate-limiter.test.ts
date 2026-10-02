import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit, getClientIp } from '@/lib/server-rate-limiter'

// Mock @upstash/redis. The limiter must issue SET NX EX, INCR and TTL as one
// atomic MULTI/EXEC transaction, so the mock records the queued commands and
// resolves exec() with the configured [setResult, count, ttl] tuple.
const mockExec = vi.fn()
const queued: Array<[string, ...unknown[]]> = []
const mockMulti = vi.fn(() => {
  const tx = {
    set: (...args: unknown[]) => { queued.push(['set', ...args]); return tx },
    incr: (...args: unknown[]) => { queued.push(['incr', ...args]); return tx },
    ttl: (...args: unknown[]) => { queued.push(['ttl', ...args]); return tx },
    exec: mockExec,
  }
  return tx
})
const mockIncr = vi.fn()
const mockExpire = vi.fn()

vi.mock('@upstash/redis', () => {
  return {
    Redis: class MockRedis {
      constructor() {
        // no-op
      }
      multi = mockMulti
      incr = mockIncr
      expire = mockExpire
    },
  }
})

describe('server-rate-limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queued.length = 0
    // Set env vars so Redis is "configured"
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token'
  })

  describe('checkRateLimit', () => {
    const config = {
      maxRequests: 3,
      windowSeconds: 60,
      prefix: 'test',
    }

    it('allows requests under the limit', async () => {
      mockExec.mockResolvedValue(['OK', 1, 60])

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2) // 3 max - 1 used
    })

    it('creates the window with SET NX EX and increments in one atomic transaction', async () => {
      mockExec.mockResolvedValue([null, 2, 45])

      await checkRateLimit('1.2.3.4', config)

      const key = 'ratelimit:test:1.2.3.4'
      expect(mockMulti).toHaveBeenCalledTimes(1)
      expect(mockExec).toHaveBeenCalledTimes(1)
      // SET NX EX creates the key with its TTL only when it is missing (so an
      // existing window is never extended), and INCR keeps that TTL. Both are
      // long-supported, unlike EXPIRE NX which needs Redis 7.
      expect(queued).toEqual([
        ['set', key, 0, { ex: 60, nx: true }],
        ['incr', key],
        ['ttl', key],
      ])
      // No standalone, non-atomic round-trips.
      expect(mockIncr).not.toHaveBeenCalled()
      expect(mockExpire).not.toHaveBeenCalled()
    })

    it('blocks requests over the limit', async () => {
      mockExec.mockResolvedValue([null, 4, 30]) // over the limit of 3

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetInSeconds).toBe(30)
    })

    it('allows exactly at the limit', async () => {
      mockExec.mockResolvedValue([null, 3, 45]) // exactly at limit

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('fails open when Redis errors', async () => {
      mockExec.mockRejectedValue(new Error('Connection refused'))

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(3) // full quota
    })

    it('fails open for the shared "unknown" IP bucket', async () => {
      const result = await checkRateLimit('unknown', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(3)
      expect(mockMulti).not.toHaveBeenCalled()
    })

    it('allows all requests when Redis is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(3)
      expect(mockMulti).not.toHaveBeenCalled()
    })

    it('uses windowSeconds as fallback when TTL returns non-positive', async () => {
      mockExec.mockResolvedValue([null, 4, -1]) // key has no TTL

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(false)
      expect(result.resetInSeconds).toBe(60) // falls back to windowSeconds
    })
  })

  describe('getClientIp', () => {
    it('extracts rightmost IP from x-forwarded-for header', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18' },
      })

      // Rightmost IP is the one added by the trusted reverse proxy
      expect(getClientIp(request)).toBe('70.41.3.18')
    })

    it('prefers x-real-ip over x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '192.168.1.1',
          'x-forwarded-for': '203.0.113.50, 70.41.3.18',
        },
      })

      expect(getClientIp(request)).toBe('192.168.1.1')
    })

    it('returns single IP from x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      })

      expect(getClientIp(request)).toBe('10.0.0.1')
    })

    it('returns "unknown" when no forwarded header', () => {
      const request = new Request('https://example.com')

      expect(getClientIp(request)).toBe('unknown')
    })
  })
})
