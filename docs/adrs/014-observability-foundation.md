# ADR 014: Observability Foundation

## Status
Accepted

## Date
2026-01-16

## Context

The Bonnie Wee Plot application had essentially no observability infrastructure. Error handling logged to console only with no aggregation, there was no performance monitoring or uptime tracking, and no visibility into data loss or corruption issues. As the application moves toward production readiness, we need to understand how the application behaves in real-world conditions, catch errors before users report them, and track performance baselines.

Four observability capabilities were identified as foundational:

1. Error tracking and aggregation
2. Structured logging
3. Health check endpoint for uptime monitoring
4. Core Web Vitals tracking for performance baseline

## Decision

We implemented a minimal observability foundation using the following tools and patterns.

### Error Tracking: Sentry

Sentry (`@sentry/nextjs`) was chosen for error tracking because it offers a generous free tier (5,000 errors/month), excellent Next.js integration with automatic source map uploads, both client and server error capture, and built-in PII scrubbing capabilities.

The implementation includes PII scrubbing configured to strip API tokens from breadcrumbs and error messages using regex patterns like `/sk-[a-zA-Z0-9-_]+/` for OpenAI keys. Source maps are uploaded in production builds for readable stack traces, and Sentry is disabled in development mode to avoid noise during local testing.

Configuration files created:
- `sentry.client.config.ts` - Client-side error tracking
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Edge runtime error tracking
- `src/instrumentation.ts` - Next.js instrumentation hook for initialization

### Structured Logging: Custom Logger

A custom structured logging utility was created at `src/lib/logger.ts` rather than using a third-party library. This decision was made because Next.js 15 serverless functions have constraints around library initialization, the requirements are simple (log levels, timestamps, metadata), and the utility provides a foundation for future integration with services like Axiom.

The logger provides four log levels (debug, info, warn, error) with each log entry containing timestamp, level, message, and optional metadata. In production, logs are queued for potential batch sending to an aggregation service. The minimum log level is configurable and defaults to `info` in production and `debug` in development.

High-priority console.error calls in `src/services/allotment-storage.ts` and `src/app/api/ai-advisor/route.ts` were replaced with structured logger calls to demonstrate the pattern.

### Health Check Endpoint

A health check endpoint at `/api/health` was created to enable uptime monitoring through services like UptimeRobot (free tier: 50 monitors, 5-minute intervals).

The endpoint returns JSON containing:
- `status`: "healthy" or "unhealthy"
- `timestamp`: ISO 8601 timestamp
- `version`: Application version from package.json
- `memoryUsage`: Heap and RSS memory statistics (Node.js runtime only)

Cache-Control headers are set to prevent caching of health check responses.

### Core Web Vitals: web-vitals Library

The `web-vitals` library was chosen for performance tracking because it is the official Google library for Web Vitals measurement, it has a tiny bundle size (~1KB), and it provides the standard metrics (LCP, FCP, CLS, INP, TTFB).

A `WebVitalsReporter` component at `src/components/web-vitals.tsx` was created as a client component that registers observers for all Core Web Vitals and logs metrics with their ratings (good/needs-improvement/poor). The component is included in the root layout and renders nothing visually.

## Consequences

### Positive

The application now has production-ready error visibility with errors captured and reported to Sentry automatically. There is a consistent logging format across the codebase with structured logs that include metadata for debugging. Uptime monitoring capability is enabled through the health check endpoint. Performance baseline tracking is in place with Core Web Vitals metrics logged for analysis.

### Negative

Bundle size increases slightly with Sentry adding approximately 20KB to the client bundle (tree-shaken). Environment configuration is required since Sentry DSN must be provided for production deployment. There is some log queue memory usage in production as logs are queued before being flushed.

### Neutral

Sentry is disabled in development, so errors must be caught via console during local testing. The structured logger currently logs to console but has hooks for future aggregation service integration.

## Implementation Files

```
sentry.client.config.ts      # Client-side Sentry initialization
sentry.server.config.ts      # Server-side Sentry initialization
sentry.edge.config.ts        # Edge runtime Sentry initialization
src/instrumentation.ts       # Next.js instrumentation hook
src/lib/logger.ts            # Structured logging utility
src/app/api/health/route.ts  # Health check endpoint
src/components/web-vitals.tsx # Core Web Vitals reporter
.env.example                 # Environment variable documentation
```

## Future Enhancements

Log aggregation integration with a service like Axiom when log volume justifies it. Performance alerting based on Core Web Vitals thresholds. Custom Sentry dashboards for gardening-specific error patterns. Integration with Vercel Speed Insights if deployed to Vercel.

## References

- [Sentry Next.js SDK Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Core Web Vitals](https://web.dev/articles/vitals)
- [UptimeRobot](https://uptimerobot.com/)
