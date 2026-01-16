// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

try {
  Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  replaysSessionSampleRate: 0,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // PII scrubbing - strip API tokens from breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Scrub x-openai-token from request headers
    if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
      if (breadcrumb.data?.headers) {
        const headers = { ...breadcrumb.data.headers }
        // Remove sensitive headers
        delete headers['x-openai-token']
        delete headers['authorization']
        delete headers['Authorization']
        breadcrumb.data = { ...breadcrumb.data, headers }
      }
      // Scrub token from URL query params if present
      if (breadcrumb.data?.url) {
        try {
          const url = new URL(breadcrumb.data.url, window.location.origin)
          if (url.searchParams.has('token')) {
            url.searchParams.set('token', '[REDACTED]')
            breadcrumb.data.url = url.toString()
          }
        } catch {
          // Invalid URL, leave as-is
        }
      }
    }
    return breadcrumb
  },

  // Additional PII scrubbing for error events
  beforeSend(event) {
    // Scrub sensitive data from error messages
    if (event.message) {
      event.message = event.message.replace(/sk-[a-zA-Z0-9-_]+/g, '[REDACTED_API_KEY]')
    }

    // Scrub breadcrumbs of any API key patterns
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.message) {
          breadcrumb.message = breadcrumb.message.replace(/sk-[a-zA-Z0-9-_]+/g, '[REDACTED_API_KEY]')
        }
        return breadcrumb
      })
    }

    return event
  },

  // You can optionally set other Sentry configuration here
  environment: process.env.NODE_ENV,
  })
} catch (error) {
  console.error('[Sentry] Failed to initialize client error tracking:', error)
}
