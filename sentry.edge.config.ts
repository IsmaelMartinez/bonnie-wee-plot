// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

try {
  Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // PII scrubbing for edge runtime
  beforeSend(event) {
    // Scrub API keys from error messages
    if (event.message) {
      event.message = event.message.replace(/sk-[a-zA-Z0-9-_]+/g, '[REDACTED_API_KEY]')
    }

    if (event.exception?.values) {
      event.exception.values = event.exception.values.map((exception) => {
        if (exception.value) {
          exception.value = exception.value.replace(/sk-[a-zA-Z0-9-_]+/g, '[REDACTED_API_KEY]')
        }
        return exception
      })
    }

    return event
  },

  environment: process.env.NODE_ENV,
  })
} catch (error) {
  console.error('[Sentry] Failed to initialize edge error tracking:', error)
}
