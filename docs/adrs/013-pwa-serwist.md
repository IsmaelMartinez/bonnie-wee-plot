# ADR 013: Use Serwist for Progressive Web App Implementation

## Status
Accepted

## Date
2026-01-15

## Context

The Community Allotment application needs Progressive Web App (PWA) capabilities to support the "garden usage" scenario where 80% of users access the app while in their garden. Key requirements include app installation ("Add to Home Screen") and eventually offline functionality for viewing planting data without network connectivity.

Three options were evaluated:

1. **@ducanh2912/next-pwa** - Maintained fork of next-pwa compatible with Next.js 15 App Router
2. **Serwist** - Modern PWA library, spiritual successor to next-pwa, built on Workbox
3. **Manual setup** - Hand-written manifest.json and service worker

## Decision

We chose **Serwist** (`@serwist/next` and `serwist` packages) for PWA implementation.

### Rationale

Serwist is the successor to next-pwa, created when the original package became unmaintained. It is built on Google's Workbox and offers:

- Active development and maintenance
- First-class Next.js 15 App Router support
- Recommended in official Next.js PWA documentation
- Modern API with better TypeScript support
- Clear migration path from next-pwa patterns

While @ducanh2912/next-pwa would have been simpler for initial setup, investing in Serwist provides better long-term maintainability as the ecosystem evolves.

### Implementation Scope (Phase 1: Minimal Installable)

Initial implementation focuses on making the app installable:

- Web app manifest with app metadata and icons
- Basic service worker registration
- Precaching of critical assets

Future phases will add offline support, background sync, and install prompts.

## Consequences

### Positive
- **Long-term investment** in actively maintained library
- **Official recommendation** in Next.js documentation
- **Workbox foundation** provides battle-tested caching strategies
- **TypeScript support** with proper WebWorker types

### Negative
- **Steeper learning curve** compared to simpler alternatives
- **More configuration** required than @ducanh2912/next-pwa
- **Cache invalidation complexity** during development (recommend disabling in dev mode)

### Neutral
- Requires TypeScript configuration changes for WebWorker types
- Service worker source lives in `app/sw.ts`, compiled to `public/sw.js`

## References

- [Serwist Next.js Documentation](https://serwist.pages.dev/docs/next/getting-started)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
