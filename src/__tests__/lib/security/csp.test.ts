import { describe, it, expect } from 'vitest'
import { buildCspHeader, BROWSER_FETCH_ORIGINS } from '@/lib/security/csp'

/**
 * Parse a CSP header string into { directive: [values] }. Mirrors how a
 * browser reads the policy, so assertions match real enforcement.
 */
function parseCsp(header: string): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const part of header.split(';')) {
    const [directive, ...values] = part.trim().split(/\s+/)
    if (directive) out[directive] = values
  }
  return out
}

describe('buildCspHeader', () => {
  const csp = parseCsp(buildCspHeader())

  it('lists every browser-fetched origin in connect-src', () => {
    // The guardrail: any host our client code hits with fetch() must be here,
    // or the request is blocked before it leaves the page and the feature
    // silently degrades. This caught the Season Review archive host omission
    // (weather stuck "unavailable", 8/10 rules silent, page showed no data).
    const connectSrc = csp['connect-src'] ?? []
    for (const origin of Object.values(BROWSER_FETCH_ORIGINS)) {
      expect(connectSrc, `connect-src must allow ${origin}`).toContain(origin)
    }
  })

  it('allows all three distinct Open-Meteo hosts the app fetches', () => {
    // Forecast (Today), Archive (Season Review) and Climate (frost dates) are
    // separate subdomains — a wildcard is not used, so each must be explicit.
    const connectSrc = csp['connect-src'] ?? []
    expect(connectSrc).toContain('https://api.open-meteo.com')
    expect(connectSrc).toContain('https://archive-api.open-meteo.com')
    expect(connectSrc).toContain('https://climate-api.open-meteo.com')
  })

  it('keeps the security-critical directives locked down', () => {
    expect(csp['default-src']).toEqual(["'self'"])
    expect(csp['frame-ancestors']).toEqual(["'none'"])
    expect(csp['base-uri']).toEqual(["'self'"])
    expect(csp['form-action']).toEqual(["'self'"])
  })

  it('does not expose server-only AI hosts to the browser', () => {
    // Gemini is called from the season-narration / ai-advisor API routes
    // (server-to-server), never the browser, so it must not appear here.
    expect(buildCspHeader()).not.toContain('generativelanguage.googleapis.com')
  })
})
