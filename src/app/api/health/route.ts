import { NextResponse } from 'next/server'
import packageJson from '../../../../package.json'

/**
 * Health check endpoint for uptime monitoring (e.g., UptimeRobot)
 *
 * Returns:
 * - status: "healthy" or "unhealthy"
 * - timestamp: ISO 8601 timestamp
 * - version: App version from package.json
 * - memoryUsage: Current memory statistics (Node.js only)
 */
export async function GET() {
  try {
    // Get memory usage (available in Node.js runtime)
    const memoryUsage = process.memoryUsage?.() ?? null

    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      memoryUsage: memoryUsage
        ? {
            heapUsed: formatBytes(memoryUsage.heapUsed),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            rss: formatBytes(memoryUsage.rss),
          }
        : null,
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

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
