# ADR 020: Vercel Deployment with Security Scanning

## Status
Accepted

## Date
2026-01-20

## Context

The application was deployed to GitHub Pages as a static export, which required `basePath` configuration and prevented use of API routes in production. As the application matures, we need analytics, preview deployments, and automated security scanning for dependencies and code.

## Decision

### Deployment: Vercel Hobby Tier

Migrate from GitHub Pages to Vercel for primary deployment. Vercel provides native Next.js support, built-in analytics (2,500 events/month free), preview deployments for PRs, and serverless function support for the AI advisor API.

GitHub Pages workflow remains available via `workflow_dispatch` for manual rollback if needed.

### Security Scanning: CodeQL + Snyk

Two complementary tools added via GitHub Actions:

**CodeQL** performs static code analysis for JavaScript/TypeScript, running on push to main, PRs, and weekly schedules. No configuration required beyond the workflow file.

**Snyk** scans npm dependencies for known vulnerabilities. Requires `SNYK_TOKEN` secret in repository settings. Runs on push to main and PRs, with `--severity-threshold=high` to focus on critical issues.

### Existing Observability

Sentry error tracking (ADR 014) continues unchanged. The optional `SENTRY_DSN` environment variable enables error aggregation when provided via Vercel environment settings.

## Consequences

### Positive

Analytics and preview deployments are built into the platform. Security scanning catches vulnerabilities early. Serverless functions enable the AI advisor API in production.

### Negative

Vercel Hobby tier has limits (100GB bandwidth, 150k function invocations/month). Snyk requires maintaining `SNYK_TOKEN` secret. CodeQL adds ~2-3 minutes to CI pipeline.

## Implementation Files

```
.github/workflows/codeql.yml   # CodeQL scanning
.github/workflows/snyk.yml     # Snyk dependency scanning
.github/workflows/deploy.yml   # Modified to manual-only (rollback)
.vercel/project.json           # Vercel project config
```

## References

- [Vercel Pricing](https://vercel.com/pricing)
- [GitHub CodeQL](https://codeql.github.com/)
- [Snyk Documentation](https://docs.snyk.io/)
- [ADR 014: Observability Foundation](014-observability-foundation.md)
