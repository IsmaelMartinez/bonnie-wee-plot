import { NextResponse } from 'next/server'
import packageJson from '../../../../package.json'

/**
 * Health check endpoint for uptime monitoring (e.g., UptimeRobot)
 *
 * Returns:
 * - status: "healthy" or "unhealthy"
 * - timestamp: ISO 8601 timestamp
 * - version: App version from package.json
 * - redis: "ok" or "unavailable" (keeps Upstash free tier alive)
 */
export async function GET() {
  try {
    // Ping Redis to keep Upstash free tier alive (evicts after 30 days of inactivity)
    let redisStatus = 'unavailable'
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
          headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
          signal: AbortSignal.timeout(3000),
        })
        if (res.ok) redisStatus = 'ok'
      } catch {
        // Redis ping failed — non-critical, don't fail health check
      }
    }

    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      redis: redisStatus,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  }
}
