import { NextResponse } from 'next/server'
import packageJson from '../../../../package.json'

type DependencyStatus = 'ok' | 'unavailable'

const PING_TIMEOUT_MS = 3000

/**
 * Ping Upstash Redis to keep the free tier alive (evicts after 30 days of
 * inactivity). Non-critical: failure is reported, never thrown.
 */
async function pingRedis(): Promise<DependencyStatus> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return 'unavailable'
  try {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    })
    return res.ok ? 'ok' : 'unavailable'
  } catch {
    return 'unavailable'
  }
}

/**
 * Run a trivial PostgREST query against Supabase to keep the free-tier
 * project from being paused (paused after ~7 days of inactivity, at which
 * point its hostname stops resolving and cloud sync + the Aitor free-tier
 * quota check both fail). Uses the anon key, so RLS returns no rows — the
 * query still reaches Postgres, which is what counts as activity.
 * Non-critical: failure is reported, never thrown.
 */
async function pingSupabase(): Promise<DependencyStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return 'unavailable'
  try {
    const res = await fetch(`${url}/rest/v1/allotments?select=user_id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    })
    return res.ok ? 'ok' : 'unavailable'
  } catch {
    return 'unavailable'
  }
}

/**
 * Health check endpoint for uptime monitoring (e.g., UptimeRobot)
 *
 * Returns:
 * - status: "healthy" or "unhealthy"
 * - timestamp: ISO 8601 timestamp
 * - version: App version from package.json
 * - redis: "ok" or "unavailable" (keeps Upstash free tier alive)
 * - supabase: "ok" or "unavailable" (keeps Supabase free tier from pausing)
 *
 * Dependency pings are informational: the app itself is healthy even when a
 * free-tier backend is down, so they never flip the status to unhealthy.
 */
export async function GET() {
  try {
    const [redisStatus, supabaseStatus] = await Promise.all([pingRedis(), pingSupabase()])

    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      redis: redisStatus,
      supabase: supabaseStatus,
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
