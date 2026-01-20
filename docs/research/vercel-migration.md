# Vercel Migration Research

Date: 2026-01-20

## Objective

Evaluate migrating from GitHub Pages to Vercel for hosting, primarily to gain analytics capabilities.

## Current State

The app is deployed to GitHub Pages via `.github/workflows/deploy.yml` with:
- Static export (`next build` with `output: 'export'`)
- Base path: `/bonnie-wee-plot`
- No analytics or performance monitoring

## Vercel Comparison

| Feature | GitHub Pages | Vercel Hobby (Free) |
|---------|--------------|---------------------|
| Cost | Free | Free |
| Analytics | None | 2,500 events/month |
| Speed Insights | None | 10,000 data points/month |
| Bandwidth | 100GB/month | 100GB/month |
| Serverless Functions | None | 150k invocations/month |
| Custom Domain | Yes | Yes |
| SSL | Yes | Yes |
| Preview Deployments | No | Yes (per PR) |
| Edge Functions | No | Yes |

## Vercel Pricing Tiers

**Hobby (Free)**: Perfect for personal projects. Includes automatic CI/CD, serverless compute with basic limits, unlimited projects. Cannot purchase additional usage - hard limits.

**Pro ($20/user/month)**: 1TB bandwidth, 1M function invocations, 25k analytics events. Team collaboration, advanced protection, email support.

**Enterprise ($20-25k/year minimum)**: Contract-based, for large organizations.

## Migration Benefits

1. **Analytics**: Basic usage tracking without external tools
2. **Speed Insights**: Core Web Vitals monitoring built-in
3. **Preview Deployments**: Each PR gets a preview URL for testing
4. **Serverless Functions**: AI advisor route can run as serverless (currently client-only with BYOK)
5. **No Base Path**: Can deploy to root domain without `/bonnie-wee-plot` prefix
6. **Faster Builds**: Vercel's build infrastructure is optimized for Next.js

## Migration Steps

### 1. Create Vercel Project
```bash
# Install Vercel CLI
npm i -g vercel

# Link project (from repo root)
vercel link

# Or connect via Vercel dashboard -> Import Git Repository
```

### 2. Update next.config.mjs
Remove GitHub Pages specific config:
```javascript
// Remove these for Vercel:
// - basePath (only needed for GitHub Pages subdirectory)
// - assetPrefix
// - output: 'export' (Vercel handles this automatically)
```

### 3. Environment Variables
Set in Vercel dashboard (Settings -> Environment Variables):
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (if using Sentry)
- Any other env vars from `.env.example`

### 4. Update GitHub Actions
Option A: Remove `deploy.yml` entirely - Vercel auto-deploys on push
Option B: Keep for CI (lint, test, build) but remove deployment steps

### 5. DNS (if using custom domain)
Point domain to Vercel via CNAME or A records per Vercel dashboard instructions.

## Configuration Changes Required

### next.config.mjs
```javascript
// Current (GitHub Pages)
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const basePath = isGitHubPages ? '/bonnie-wee-plot' : ''

// After (Vercel)
// Remove basePath logic entirely, or keep for local dev flexibility
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
```

### Remove Static Export
GitHub Pages requires `output: 'export'`. Vercel doesn't - it can run Next.js natively with SSR/ISR if needed. For now, static export still works fine.

## Rollback Plan

Keep GitHub Pages workflow in place but disabled. Can re-enable if Vercel has issues:
```yaml
# .github/workflows/deploy.yml
# Add at top:
# on: workflow_dispatch  # Manual trigger only
```

## Recommendation

**Migrate to Vercel Hobby tier**. It's free, provides analytics, and is the canonical platform for Next.js. The 2,500 events/month analytics limit is plenty for a single-user app.

## Timeline

Migration effort: ~30 minutes
- 10 min: Connect repo to Vercel
- 10 min: Update next.config.mjs
- 10 min: Test deployment, verify functionality

## References

- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Analytics Pricing](https://vercel.com/docs/analytics/limits-and-pricing)
- [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
