import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'
import { buildCspHeader } from '@/lib/security/csp'

// Clerk is available via explicit keys or keyless mode (dev only)
const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const isKeylessMode = !hasClerkKeys && process.env.NODE_ENV === 'development'
const clerkAvailable = hasClerkKeys || isKeylessMode

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('Content-Security-Policy', buildCspHeader())
  // 2 years; production only so local HTTPS dev setups don't cache a
  // long-lived HSTS pin for localhost or custom local domains
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  }
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()')
}

function handleRequest(request: NextRequest): NextResponse {
  const response = NextResponse.next()

  addSecurityHeaders(response)

  // Request size limit check for API routes
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const sizeInBytes = parseInt(contentLength, 10)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (sizeInBytes > maxSize) {
      return new NextResponse('Payload too large', { status: 413 })
    }
  }

  return response
}

export default clerkAvailable
  ? clerkMiddleware(async (_auth, request: NextRequest) => handleRequest(request))
  : (request: NextRequest) => handleRequest(request)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
