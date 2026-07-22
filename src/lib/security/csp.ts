/**
 * Content-Security-Policy for the app, extracted from the middleware so it can
 * be unit-tested without pulling in Clerk's middleware wrapper.
 *
 * The `connect-src` allowlist is the one that bites silently: every host the
 * browser reaches with `fetch()` (weather, geocoding, BYO AI narration, Clerk,
 * Supabase, Sentry) must be listed, or the request is blocked before it leaves
 * the page — no network error the user can act on, just a failed fetch that
 * degrades a feature to "unavailable". Server-to-server calls (e.g. the Gemini
 * proxy in the season-narration / ai-advisor API routes) are NOT subject to
 * this and must stay out of the list.
 *
 * When adding a browser-side fetch to a new host, add it here and to
 * `csp.test.ts`'s coverage assertion.
 */

/**
 * Origins the browser fetches directly. Kept as a named export so the CSP test
 * can assert every one is present in `connect-src` — the guardrail that caught
 * the Season Review archive host being omitted (weather stuck "unavailable").
 */
export const BROWSER_FETCH_ORIGINS = {
  /** Open-Meteo forecast API — Today-page current weather (open-meteo.ts). */
  openMeteoForecast: 'https://api.open-meteo.com',
  /** Open-Meteo Archive API — Season Review historical weather (open-meteo-archive.ts). */
  openMeteoArchive: 'https://archive-api.open-meteo.com',
  /** Open-Meteo Climate API — frost-date normals (frost-dates.ts). */
  openMeteoClimate: 'https://climate-api.open-meteo.com',
  /** BigDataCloud reverse geocoding (two endpoints). */
  bigDataCloud: 'https://api.bigdatacloud.net',
  bigDataCloudBdc: 'https://api-bdc.io',
  /** OpenAI — BYO-key narration/advisor when the user picks the OpenAI preset. */
  openai: 'https://api.openai.com',
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
    'connect-src': [
      "'self'",
      // Season-review narration default preset: the user's own local Ollama.
      // Browsers exempt localhost from mixed-content blocking, but CSP still
      // needs the origin. Custom remote narration endpoints require adding
      // their origin here.
      'http://localhost:11434',
      'http://127.0.0.1:11434',
      BROWSER_FETCH_ORIGINS.openai,
      BROWSER_FETCH_ORIGINS.bigDataCloud,
      BROWSER_FETCH_ORIGINS.bigDataCloudBdc,
      BROWSER_FETCH_ORIGINS.openMeteoForecast,
      // Archive + Climate are distinct Open-Meteo hosts from the forecast API;
      // each must be listed separately or its weather feature (Season Review,
      // frost dates) silently degrades to "unavailable".
      BROWSER_FETCH_ORIGINS.openMeteoArchive,
      BROWSER_FETCH_ORIGINS.openMeteoClimate,
      'https://*.clerk.accounts.dev',
      'https://*.supabase.co',
      'https://*.ingest.sentry.io',
    ],
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
