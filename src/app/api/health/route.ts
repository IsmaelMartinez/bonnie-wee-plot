import { NextResponse } from 'next/server'
import packageJson from '../../../../package.json'

/**
 * Health check endpoint for uptime monitoring (e.g., UptimeRobot)
 *
 * Returns:
 * - status: "healthy" or "unhealthy"
 * - timestamp: ISO 8601 timestamp
 * - version: App version from package.json
 */
export async function GET() {
  try {
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: packageJson.version,
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
