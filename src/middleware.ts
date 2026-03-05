import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

// Clerk is available via explicit keys or keyless mode (dev only)
const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const isKeylessMode = !hasClerkKeys && process.env.NODE_ENV === 'development'
const clerkAvailable = hasClerkKeys || isKeylessMode

function buildCspHeader(): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'", "'unsafe-eval'", "'unsafe-inline'",
      'https://*.clerk.accounts.dev',
      'https://challenges.cloudflare.com',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'connect-src': [
      "'self'",
      'https://api.openai.com',
      'https://api.bigdatacloud.net',
      'https://api-bdc.io',
      'https://*.clerk.accounts.dev',
      'https://*.supabase.co',
    ],
    'img-src': ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://img.clerk.com'],
    'font-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'], // blob: required by Clerk for CAPTCHA web workers
    'frame-src': ["'self'", 'https://*.clerk.accounts.dev', 'https://challenges.cloudflare.com'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('Content-Security-Policy', buildCspHeader())
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
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
