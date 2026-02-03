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

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { allowed: true, remaining: maxRequests, resetInSeconds: 0 }
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  const key = `ratelimit:${prefix}:${ip}`

  try {
    const current = await redis.incr(key)

    // Set TTL on first request in window
    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }

    const ttl = await redis.ttl(key)

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
 * Vercel sets x-forwarded-for; falls back to a default.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}
