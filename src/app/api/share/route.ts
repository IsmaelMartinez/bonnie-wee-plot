/**
 * Share API - POST endpoint
 *
 * Stores allotment data temporarily in Upstash Redis with a short code.
 * Data expires after a configurable time (default 1 day, max 7 days).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import type { AllotmentData } from '@/types/unified-allotment'
import { validateAllotmentData } from '@/services/allotment-storage'
import { checkRateLimit, getClientIp } from '@/lib/server-rate-limiter'
import { logger } from '@/lib/logger'

// Initialize Redis client (uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Generate a 6-character alphanumeric code (uppercase for readability)
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid ambiguous chars like 0/O, 1/I/L
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Default expiry time in minutes (1 day)
const DEFAULT_EXPIRY_MINUTES = 1440
// Maximum expiry time in minutes (7 days)
const MAX_EXPIRY_MINUTES = 10080

export async function POST(request: NextRequest) {
  try {
    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json(
        { error: 'Share feature not configured' },
        { status: 503 }
      )
    }

    // Rate limit: 10 shares per hour per IP
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(ip, {
      maxRequests: 10,
      windowSeconds: 3600,
      prefix: 'share',
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many share requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetInSeconds),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const body = await request.json()
    const { allotment, expirationMinutes: requestedExpiry } = body as {
      allotment: AllotmentData
      expirationMinutes?: number
    }

    // Calculate expiry time in seconds (validated and capped)
    const expirationMinutes = Math.min(
      Math.max(requestedExpiry ?? DEFAULT_EXPIRY_MINUTES, 1), // At least 1 minute
      MAX_EXPIRY_MINUTES // Cap at 7 days
    )
    const expirySeconds = expirationMinutes * 60

    // Validate the allotment data
    const validation = validateAllotmentData(allotment)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid allotment data', details: validation.errors },
        { status: 400 }
      )
    }

    // Generate a unique code (retry if collision)
    let code = generateShareCode()
    let attempts = 0
    while (attempts < 5) {
      const existing = await redis.exists(`share:${code}`)
      if (!existing) break
      code = generateShareCode()
      attempts++
    }

    if (attempts >= 5) {
      return NextResponse.json(
        { error: 'Unable to generate unique code, please try again' },
        { status: 500 }
      )
    }

    // Store the data with expiry
    const shareData = {
      allotment,
      sharedAt: new Date().toISOString(),
    }

    await redis.set(`share:${code}`, JSON.stringify(shareData), {
      ex: expirySeconds,
    })

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString()

    return NextResponse.json({
      code,
      expiresAt,
      expiresInSeconds: expirySeconds,
    })
  } catch (error) {
    logger.error('Share API error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { error: 'Failed to share allotment' },
      { status: 500 }
    )
  }
}
