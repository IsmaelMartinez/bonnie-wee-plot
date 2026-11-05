/**
 * Server-side rate limiter using Upstash Redis
 *
 * Uses a sliding window counter per IP address.
 * Designed for Vercel serverless functions where in-memory state doesn't persist.
 */

import { Redis } from '@upstash/redis'

interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
  prefix: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

/**
 * Check and record a request against the rate limit.
 * Returns whether the request is allowed and remaining quota.
 *
 * Falls back to allowing requests if Redis is unavailable,
 * so rate limiting is best-effort and never blocks legitimate users
 * due to infrastructure issues.
 */
export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowSeconds, prefix } = config

  // 'unknown' means the platform didn't supply a client IP (local dev,
  // header-stripping proxies). All such requests would share a single
  // bucket and could rate-limit each other out — fail open instead,
  // consistent with the Redis-unavailable behaviour below.
  if (ip === 'unknown') {
    return { allowed: true, remaining: maxRequests, resetInSeconds: 0 }
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { allowed: true, remaining: maxRequests, resetInSeconds: 0 }
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  const key = `ratelimit:${prefix}:${ip}`

  try {
    // One MULTI/EXEC transaction: SET NX EX creates the window with its TTL
    // only when the key is missing (never extending an existing window), and
    // INCR preserves that TTL, so no key can be left without one.
    const [, current, observedTtl] = await redis
      .multi()
      .set(key, 0, { ex: windowSeconds, nx: true })
      .incr(key)
      .ttl(key)
      .exec<['OK' | null, number, number]>()

    // The key is not time-bucketed, so a key left without a TTL (by the old
    // non-atomic INCR-then-EXPIRE code) would count up forever. Restore one.
    let ttl = observedTtl
    if (ttl === -1) {
      await redis.expire(key, windowSeconds)
      ttl = windowSeconds
    }

    if (current > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: ttl > 0 ? ttl : windowSeconds,
      }
    }

    return {
      allowed: true,
      remaining: maxRequests - current,
      resetInSeconds: ttl > 0 ? ttl : windowSeconds,
    }
  } catch {
    // If Redis fails, allow the request (fail open)
    return { allowed: true, remaining: maxRequests, resetInSeconds: 0 }
  }
}

/**
 * Extract client IP from a request.
 * Prefers x-real-ip (set by Vercel and cannot be spoofed).
 * Falls back to the rightmost x-forwarded-for entry (platform-appended).
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',')
    return parts[parts.length - 1].trim()
  }
  return 'unknown'
}
