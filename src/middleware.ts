import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

// CSP directives — extend for Clerk and Supabase domains
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'connect-src': [
    "'self'",
    'https://api.openai.com',
    'https://api.bigdatacloud.net',
    'https://*.clerk.accounts.dev',
    'https://*.supabase.co',
  ],
  'img-src': ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://img.clerk.com'],
  'font-src': ["'self'"],
  'frame-src': ["'self'", 'https://*.clerk.accounts.dev'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

function buildCspHeader(): string {
  return Object.entries(cspDirectives)
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

// All routes are public — Clerk is used for opt-in auth only.
export default clerkMiddleware(async (_auth, request: NextRequest) => {
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
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
