import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit, getClientIp } from '@/lib/server-rate-limiter'

// Mock @upstash/redis
const mockIncr = vi.fn()
const mockExpire = vi.fn()
const mockTtl = vi.fn()

vi.mock('@upstash/redis', () => {
  return {
    Redis: class MockRedis {
      constructor() {
        // no-op
      }
      incr = mockIncr
      expire = mockExpire
      ttl = mockTtl
    },
  }
})

describe('server-rate-limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      mockIncr.mockResolvedValue(1)
      mockExpire.mockResolvedValue(true)
      mockTtl.mockResolvedValue(60)

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2) // 3 max - 1 used
      expect(mockIncr).toHaveBeenCalledWith('ratelimit:test:1.2.3.4')
    })

    it('sets TTL on first request in window', async () => {
      mockIncr.mockResolvedValue(1) // first request
      mockExpire.mockResolvedValue(true)
      mockTtl.mockResolvedValue(60)

      await checkRateLimit('1.2.3.4', config)

      expect(mockExpire).toHaveBeenCalledWith('ratelimit:test:1.2.3.4', 60)
    })

    it('does not reset TTL on subsequent requests', async () => {
      mockIncr.mockResolvedValue(2) // not first
      mockTtl.mockResolvedValue(45)

      await checkRateLimit('1.2.3.4', config)

      expect(mockExpire).not.toHaveBeenCalled()
    })

    it('blocks requests over the limit', async () => {
      mockIncr.mockResolvedValue(4) // over the limit of 3
      mockTtl.mockResolvedValue(30)

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetInSeconds).toBe(30)
    })

    it('allows exactly at the limit', async () => {
      mockIncr.mockResolvedValue(3) // exactly at limit
      mockTtl.mockResolvedValue(45)

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('fails open when Redis errors', async () => {
      mockIncr.mockRejectedValue(new Error('Connection refused'))

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(3) // full quota
    })

    it('allows all requests when Redis is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(3)
      expect(mockIncr).not.toHaveBeenCalled()
    })

    it('uses windowSeconds as fallback when TTL returns non-positive', async () => {
      mockIncr.mockResolvedValue(4)
      mockTtl.mockResolvedValue(-1) // key has no TTL

      const result = await checkRateLimit('1.2.3.4', config)

      expect(result.allowed).toBe(false)
      expect(result.resetInSeconds).toBe(60) // falls back to windowSeconds
    })
  })

  describe('getClientIp', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18' },
      })

      expect(getClientIp(request)).toBe('203.0.113.50')
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
