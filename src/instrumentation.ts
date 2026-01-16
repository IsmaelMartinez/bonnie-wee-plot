// This file configures the initialization of Sentry on the server side.
// The instrumentation.ts file is automatically loaded by Next.js.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import the server config to initialize Sentry
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Import the edge config to initialize Sentry
    await import('../sentry.edge.config')
  }
}
