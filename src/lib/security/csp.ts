/**
 * Content-Security-Policy for the app, extracted from the middleware so it can
 * be unit-tested without pulling in Clerk's middleware wrapper.
 *
 * The `connect-src` allowlist is the one that bites silently: every host the
 * browser reaches with `fetch()` / SDK network calls (weather, geocoding, BYO
 * AI narration, Clerk, Supabase, Sentry) must be listed, or the request is
 * blocked before it leaves the page — no network error the user can act on,
 * just a failed request that degrades a feature to "unavailable". Server-to-
 * server calls (e.g. the Gemini proxy in the season-narration / ai-advisor API
 * routes) are NOT subject to this and must stay out of the list.
 *
 * `connect-src` is derived from `BROWSER_FETCH_ORIGINS` below, so the tested
 * guardrail list and the enforced policy can never drift: to allow a new
 * browser-reached host, add it to the map and it lands in the header and the
 * coverage assertion at once.
 */

/**
 * Every origin the browser connects to directly (fetch/XHR/WebSocket/SDK).
 * The single source of truth for `connect-src`: the CSP header is built from
 * these values, and `csp.test.ts` asserts each one is present — the guardrail
 * that caught the Season Review archive host being omitted (weather stuck
 * "unavailable", 8/10 rules silent, the page showed no data).
 *
 * Anything reached only from server code (API routes) must NOT be added here.
 */
export const BROWSER_FETCH_ORIGINS = {
  // Season-review narration default preset: the user's own local Ollama.
  // Browsers exempt localhost from mixed-content blocking, but CSP still needs
  // the origin. Custom remote narration endpoints require adding their origin.
  ollamaLocalhost: 'http://localhost:11434',
  ollamaLoopback: 'http://127.0.0.1:11434',
  // BYO-key narration/advisor when the user picks the OpenAI preset.
  openai: 'https://api.openai.com',
  // BigDataCloud reverse geocoding (two endpoints).
  bigDataCloud: 'https://api.bigdatacloud.net',
  bigDataCloudBdc: 'https://api-bdc.io',
  // Open-Meteo: three DISTINCT hosts (no wildcard), each fetched by the app —
  // forecast (Today weather), archive (Season Review historical weather),
  // climate (frost-date normals). Each must be listed separately.
  openMeteoForecast: 'https://api.open-meteo.com',
  openMeteoArchive: 'https://archive-api.open-meteo.com',
  openMeteoClimate: 'https://climate-api.open-meteo.com',
  // Clerk browser SDK (auth), Supabase browser client (cloud sync), and the
  // Sentry browser SDK (error/telemetry ingest) all connect from the page.
  clerk: 'https://*.clerk.accounts.dev',
  supabase: 'https://*.supabase.co',
  sentry: 'https://*.ingest.sentry.io',
} as const

function buildCspDirectives(): Record<string, string[]> {
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'", "'unsafe-eval'", "'unsafe-inline'",
      'https://*.clerk.accounts.dev',
      'https://challenges.cloudflare.com',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    // Built from BROWSER_FETCH_ORIGINS so the policy and the tested guardrail
    // list stay in lockstep — see the module and BROWSER_FETCH_ORIGINS docs.
    'connect-src': ["'self'", ...Object.values(BROWSER_FETCH_ORIGINS)],
    'img-src': ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://img.clerk.com'],
    'font-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'], // blob: required by Clerk for CAPTCHA web workers
    'frame-src': ["'self'", 'https://*.clerk.accounts.dev', 'https://challenges.cloudflare.com'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }
}

/** Serialise the CSP directives into a single header value. */
export function buildCspHeader(): string {
  return Object.entries(buildCspDirectives())
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}
