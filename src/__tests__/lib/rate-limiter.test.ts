import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter, formatCooldown } from '@/lib/rate-limiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    // Clear sessionStorage before each test
    sessionStorage.clear()
    rateLimiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 60000, // 1 minute
      storageKey: 'test_rate_limit'
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    sessionStorage.clear()
  })

  describe('canRequest', () => {
    it('should allow requests when under limit', () => {
      expect(rateLimiter.canRequest()).toBe(true)
    })

    it('should block requests when limit is reached', () => {
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      
      expect(rateLimiter.canRequest()).toBe(false)
    })

    it('should allow requests after window expires', () => {
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      
      expect(rateLimiter.canRequest()).toBe(false)
      
      // Advance time past the window
      vi.advanceTimersByTime(60001)
      
      expect(rateLimiter.canRequest()).toBe(true)
    })
  })

  describe('recordRequest', () => {
    it('should record a request successfully', () => {
      const result = rateLimiter.recordRequest()
      expect(result).toBe(true)
    })

    it('should fail to record when limit reached', () => {
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      
      const result = rateLimiter.recordRequest()
      expect(result).toBe(false)
    })
  })

  describe('tryRequest', () => {
    it('should record and return true when allowed', () => {
      const result = rateLimiter.tryRequest()
      expect(result).toBe(true)
      expect(rateLimiter.getRemainingRequests()).toBe(2)
    })

    it('should return false when rate limited', () => {
      rateLimiter.tryRequest()
      rateLimiter.tryRequest()
      rateLimiter.tryRequest()
      
      const result = rateLimiter.tryRequest()
      expect(result).toBe(false)
    })
  })

  describe('getRemainingRequests', () => {
    it('should return max requests initially', () => {
      expect(rateLimiter.getRemainingRequests()).toBe(3)
    })

    it('should decrease as requests are made', () => {
      rateLimiter.recordRequest()
      expect(rateLimiter.getRemainingRequests()).toBe(2)
      
      rateLimiter.recordRequest()
      expect(rateLimiter.getRemainingRequests()).toBe(1)
    })

    it('should reset after window expires', () => {
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      expect(rateLimiter.getRemainingRequests()).toBe(1)
      
      vi.advanceTimersByTime(60001)
      
      expect(rateLimiter.getRemainingRequests()).toBe(3)
    })
  })

  describe('getCooldownMs', () => {
    it('should return 0 when not rate limited', () => {
      expect(rateLimiter.getCooldownMs()).toBe(0)
    })

    it('should return time until oldest request expires', () => {
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      
      const cooldown = rateLimiter.getCooldownMs()
      expect(cooldown).toBeGreaterThan(0)
      expect(cooldown).toBeLessThanOrEqual(60000)
    })

    it('should decrease as time passes', () => {
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      
      vi.advanceTimersByTime(30000)
      
      const cooldown = rateLimiter.getCooldownMs()
      expect(cooldown).toBeLessThanOrEqual(30000)
    })
  })

  describe('getState', () => {
    it('should return complete state object', () => {
      rateLimiter.recordRequest()
      
      const state = rateLimiter.getState()
      
      expect(state).toHaveProperty('timestamps')
      expect(state).toHaveProperty('remainingRequests')
      expect(state).toHaveProperty('cooldownMs')
      expect(state).toHaveProperty('canMakeRequest')
      expect(state.timestamps).toHaveLength(1)
      expect(state.remainingRequests).toBe(2)
    })
  })

  describe('reset', () => {
    it('should clear all timestamps', () => {
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      
      rateLimiter.reset()
      
      expect(rateLimiter.getRemainingRequests()).toBe(3)
      expect(rateLimiter.canRequest()).toBe(true)
    })
  })
})

describe('formatCooldown', () => {
  it('should format seconds only', () => {
    expect(formatCooldown(5000)).toBe('5s')
    expect(formatCooldown(30000)).toBe('30s')
    expect(formatCooldown(59000)).toBe('59s')
  })

  it('should format minutes and seconds', () => {
    expect(formatCooldown(60000)).toBe('1m 0s')
    expect(formatCooldown(90000)).toBe('1m 30s')
    expect(formatCooldown(125000)).toBe('2m 5s')
  })

  it('should round up partial seconds', () => {
    expect(formatCooldown(1500)).toBe('2s')
    expect(formatCooldown(1001)).toBe('2s')
  })
})

