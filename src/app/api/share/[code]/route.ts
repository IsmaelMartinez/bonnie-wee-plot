/**
 * Share API - GET endpoint
 *
 * Retrieves shared allotment data by code.
 * Returns 404 if code doesn't exist or has expired.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import type { AllotmentData } from '@/types/unified-allotment'
import { logger } from '@/lib/logger'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

interface ShareData {
  allotment: AllotmentData
  sharedAt: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json(
        { error: 'Share feature not configured' },
        { status: 503 }
      )
    }

    const { code } = await params

    // Validate code format (6 alphanumeric characters)
    if (!code || !/^[A-Z0-9]{6}$/i.test(code)) {
      return NextResponse.json(
        { error: 'Invalid share code format' },
        { status: 400 }
      )
    }

    // Fetch from Redis (case-insensitive lookup)
    const upperCode = code.toUpperCase()
    const data = await redis.get<string>(`share:${upperCode}`)

    if (!data) {
      return NextResponse.json(
        { error: 'Share code not found or expired' },
        { status: 404 }
      )
    }

    // Parse the stored data
    const shareData: ShareData = typeof data === 'string' ? JSON.parse(data) : data

    return NextResponse.json({
      allotment: shareData.allotment,
      sharedAt: shareData.sharedAt,
    })
  } catch (error) {
    logger.error('Share retrieval error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { error: 'Failed to retrieve shared allotment' },
      { status: 500 }
    )
  }
}
