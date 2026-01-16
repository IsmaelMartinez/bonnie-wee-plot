// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // PII scrubbing - strip API tokens from breadcrumbs and events
  beforeBreadcrumb(breadcrumb) {
    // Scrub authorization headers from request breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data) {
      const data = { ...breadcrumb.data }
      // Remove sensitive header values
      if (data.headers) {
        const headers = { ...data.headers }
        delete headers['x-openai-token']
        delete headers['authorization']
        delete headers['Authorization']
        data.headers = headers
      }
      breadcrumb.data = data
    }
    return breadcrumb
  },

  // Additional PII scrubbing for error events
  beforeSend(event) {
    // Scrub API keys from error messages
    if (event.message) {
      event.message = event.message.replace(/sk-[a-zA-Z0-9-_]+/g, '[REDACTED_API_KEY]')
    }

    // Scrub from exception values
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map((exception) => {
        if (exception.value) {
          exception.value = exception.value.replace(/sk-[a-zA-Z0-9-_]+/g, '[REDACTED_API_KEY]')
        }
        return exception
      })
    }

    // Scrub breadcrumbs
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

  environment: process.env.NODE_ENV,
})
