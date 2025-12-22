/**
 * Rate Limiter Utility
 * Token bucket algorithm for client-side request throttling
 * Prevents accidental API spam and helps manage costs
 */

interface RateLimiterConfig {
  maxRequests: number      // Maximum requests allowed in the window
  windowMs: number         // Time window in milliseconds
  storageKey?: string      // Key for persisting timestamps
}

interface RateLimitState {
  timestamps: number[]
  remainingRequests: number
  cooldownMs: number
  canMakeRequest: boolean
}

export class RateLimiter {
  private maxRequests: number
  private windowMs: number
  private storageKey: string
  private timestamps: number[] = []

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.maxRequests
    this.windowMs = config.windowMs
    this.storageKey = config.storageKey ?? 'rate_limit_timestamps'
    
    // Load persisted timestamps
    if (typeof window !== 'undefined') {
      this.loadTimestamps()
    }
  }

  /**
   * Load timestamps from sessionStorage
   */
  private loadTimestamps(): void {
    try {
      const stored = sessionStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          // Filter out expired timestamps
          const now = Date.now()
          this.timestamps = parsed.filter(ts => now - ts < this.windowMs)
          this.saveTimestamps()
        }
      }
    } catch {
      this.timestamps = []
    }
  }

  /**
   * Save timestamps to sessionStorage
   */
  private saveTimestamps(): void {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.timestamps))
    } catch {
      // Storage not available or quota exceeded
    }
  }

  /**
   * Clean up old timestamps outside the window
   */
  private cleanup(): void {
    const now = Date.now()
    this.timestamps = this.timestamps.filter(ts => now - ts < this.windowMs)
    this.saveTimestamps()
  }

  /**
   * Get current rate limit state
   */
  getState(): RateLimitState {
    this.cleanup()
    
    const remainingRequests = Math.max(0, this.maxRequests - this.timestamps.length)
    const canMakeRequest = this.timestamps.length < this.maxRequests
    
    // Calculate cooldown (time until oldest timestamp expires)
    let cooldownMs = 0
    if (!canMakeRequest && this.timestamps.length > 0) {
      const oldestTimestamp = this.timestamps[0]
      const expiresAt = oldestTimestamp + this.windowMs
      cooldownMs = Math.max(0, expiresAt - Date.now())
    }

    return {
      timestamps: [...this.timestamps],
      remainingRequests,
      cooldownMs,
      canMakeRequest
    }
  }

  /**
   * Check if a request can be made
   */
  canRequest(): boolean {
    return this.getState().canMakeRequest
  }

  /**
   * Record a request (call this after making a successful request)
   */
  recordRequest(): boolean {
    this.cleanup()
    
    if (this.timestamps.length >= this.maxRequests) {
      return false
    }

    this.timestamps.push(Date.now())
    this.saveTimestamps()
    return true
  }

  /**
   * Attempt to make a request - returns true if allowed, false if rate limited
   */
  tryRequest(): boolean {
    if (!this.canRequest()) {
      return false
    }
    this.recordRequest()
    return true
  }

  /**
   * Get remaining time until a request can be made (in ms)
   */
  getCooldownMs(): number {
    return this.getState().cooldownMs
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(): number {
    return this.getState().remainingRequests
  }

  /**
   * Reset the rate limiter (clear all timestamps)
   */
  reset(): void {
    this.timestamps = []
    this.saveTimestamps()
  }
}

// Default AI advisor rate limiter: 5 requests per minute
export const aiRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  storageKey: 'ai_advisor_rate_limit'
})

/**
 * Format cooldown time for display
 */
export function formatCooldown(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

