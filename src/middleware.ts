import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security Middleware
 *
 * Adds security headers to all responses:
 * - Content Security Policy (CSP)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 */

// CSP directives - extend as needed for Clerk, Supabase, etc.
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],  // Next.js requires eval in dev
  'style-src': ["'self'", "'unsafe-inline'"],  // Tailwind CSS requirement
  'connect-src': ["'self'", 'https://api.openai.com', 'wss://0.peerjs.com', 'https://0.peerjs.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
  'font-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

function buildCspHeader(): string {
  return Object.entries(cspDirectives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Content Security Policy
  response.headers.set('Content-Security-Policy', buildCspHeader())

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Prevent XSS attacks in older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block')

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

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
