# Pre-Production Strategic Plan: Community Allotment 2.0

## Executive Summary

This document synthesizes findings from five specialized deep-dive analyses covering security, PWA/mobile, observability, maintainability, and accessibility. It provides a unified roadmap for taking Community Allotment from its current prototype state to a production-ready, maintainable application.

The application is at an inflection point: solid foundations exist (Next.js 15, React 19, TypeScript, good testing), with clear plans for Clerk auth, Supabase storage, and multi-provider AI. However, significant work is needed across all five domains before production deployment.

---

## Current State Assessment

### What's Working Well

The application demonstrates thoughtful architecture documented across 12 ADRs. The unified data model in `src/types/unified-allotment.ts` cleanly handles schema versioning (v10) with automatic migration and repair. State management via `useAllotment` hook provides clean separation between UI and persistence. The BYOK (Bring Your Own Key) model for AI keeps costs user-managed while the client-side rate limiter prevents accidental API abuse.

Testing infrastructure is reasonably mature with Vitest for unit tests (~2,800 lines) and Playwright for E2E (~1,950 lines). The CI pipeline runs lint, type-check, and tests in parallel before builds.

### Critical Gaps Identified

Security has no CSP headers, no server-side rate limiting, and API tokens stored in sessionStorage are vulnerable to XSS. There's no authentication infrastructure and input validation on API routes is minimal.

PWA/Mobile has zero PWA infrastructure (no manifest, no service worker). The AllotmentGrid drag-and-drop is unusable on touch devices, though a dedicated `AllotmentMobileView` exists as a workaround. No offline capability exists despite the "80% garden usage" finding.

Observability is essentially non-existent. Error handling logs to console only with no aggregation. There's no performance monitoring, no uptime monitoring, and no visibility into data loss issues.

Accessibility has critical barriers. The AllotmentGrid is described accurately as "div soup" with no keyboard navigation. Screen reader users cannot use the core functionality. Multiple touch targets fall below the 44x44px minimum.

Maintainability shows some issues: 3 failing unit tests erode CI trust, the storage service file exceeds AI context limits, and documentation references non-existent features.

---

## Strategic Roadmap

### Phase -1: Plant Data Validation (Parallel Track)

This work can proceed in parallel with other phases and should be completed before Supabase migration.

#### Phase 1 Analysis Complete ✅ (January 15, 2026)

Initial audit of the 205 plant entries revealed the following:

**Data Quality Statistics:**
- 107 unique companion plant names referenced across the database
- 31 unique avoid plant names referenced
- 43 companion names match database IDs exactly (after case/hyphen normalization)
- 8 names need plural→singular normalization
- 12 names need semantic mapping to correct IDs
- 16 vague/generic references need removal or replacement
- 11 plants have empty companion arrays (all mushrooms and green manures - justified)

**Critical Gaps in Database:**
Three common plants are referenced as companions but missing from the database entirely:
- Basil (referenced 6 times) - major culinary herb
- Peppers/Chili - common solanaceae family member
- Aubergine/Eggplant - common solanaceae family member

**Vague References to Remove (16 items):**
Generic terms like "Vegetables (general)", "Most vegetables", "All vegetables", "Herbs", "Alliums", "Brassicas", "Native plants", "Water-loving plants" don't map to specific plant IDs. One entry ("Dill should be kept separate") is an instruction masquerading as a companion plant.

**OpenFarm API Status:**
The OpenFarm API is DOWN (redirects to GitHub). The repository was archived April 22, 2025. Data is CC0 licensed and could be recovered from Internet Archive snapshots if needed.

See `/tasks/plant-data-validation.md` for complete Phase 1 findings and normalization maps.

#### Parallel Implementation Plan Available

A comprehensive parallel execution plan has been created through 5-expert debate analysis (Data Quality, UX/Product, Database Architecture, DevOps/Testing, Horticulture). See `/tasks/plant-data-parallel-plan.md` for:
- 3 parallel workstreams that can execute simultaneously
- Critical blocker identified: ID mismatch between vegetable index and database
- Specific test cases, CI enhancements, and rollback strategies
- Complete Supabase schema with bidirectional enforcement triggers
- Timeline: ~12-16 hours across 3 workstreams

#### Remaining Work (Phases 2-5)

**External Reference Links:**
Add RHS URLs to all plants with dedicated RHS growing guides. The URL pattern is `https://www.rhs.org.uk/vegetables/[name]/grow-your-own`. Also add Wikipedia URLs and botanical names where available.

**Companion Data Enhancement:**
Validate companion planting claims against authoritative sources (RHS, Garden Organic, University Extension services). Add confidence levels (proven/likely/traditional/anecdotal) and mechanism types (pest_confusion, allelopathy, nitrogen_fixation, etc.).

**Name Normalization Implementation:**
Apply the normalization maps identified in Phase 1 to convert string-based companion references to normalized plant IDs.

**Missing Plants:**
Add basil, peppers, and aubergine to the database before finalizing companion relationships.

**Crop Rotation Alignment:**
Ensure rotation groups align with RHS four-year rotation guidance. Add rotation-specific advice explaining why crops follow in sequence.

See `/docs/research/plant-data-validation-strategy.md` for detailed implementation guidance.

---

### Phase 0: Foundation Fixes ✅ COMPLETE (January 15, 2026)

All foundation fixes completed:

- Fixed 2 failing tests (Firefox quota error detection, createdYear test alignment)
- Added pre-commit hooks with husky + lint-staged
- Updated copilot-instructions.md to reflect actual features
- Fixed ADR numbering conflict (012 → 013 for plant data external sources)
- Added AllotmentMobileView component for better mobile UX

PRs: #4, #5, #6 merged to main.

---

### Phase 1: Security Hardening ✅ COMPLETE (January 15, 2026)

Security hardening implemented:

- Created `src/middleware.ts` with CSP headers
- Added X-Frame-Options, X-Content-Type-Options, Referrer-Policy headers
- Created Zod validation schemas in `src/lib/validations/ai-advisor.ts`
- Updated AI advisor route with input validation
- Added request size limits (10MB max)
- Improved error logging (no sensitive data exposure)

PR: #7 merged to main.

#### What Was Implemented
Content Security Policy with:
- `default-src 'self'`
- `script-src 'self'` (expand for Clerk domains when integrated)
- `style-src 'self' 'unsafe-inline'` (Tailwind requirement)
- `connect-src 'self' https://api.openai.com` (add Clerk, Supabase)
- `frame-ancestors 'none'`

#### Input Validation ✅
Zod schema validation added to AI advisor API route with:
- Message length limits (10,000 chars)
- Conversation history limit (50 messages)
- Image size limit (10MB base64)
- Allotment context limit (50,000 chars)

#### Server-Side Rate Limiting (Deferred)
Deferred to post-Clerk integration. Requires Upstash Redis for distributed rate limiting across serverless functions. Will implement per-IP limiting when authentication is added.

#### API Token Security Enhancement (Deferred)
Deferred to Phase 6 (Clerk integration). Token encryption requires user authentication context.

---

### Phase 2: Observability Foundation (Week 3-4)

Get visibility into errors and performance before expanding the user base.

#### Error Tracking with Sentry
Install `@sentry/nextjs` for error tracking. The free tier (5,000 errors/month) is sufficient for a community project. Configure PII scrubbing to strip API tokens from breadcrumbs. Enable source maps for production debugging.

#### Structured Logging
Create `/src/lib/logger.ts` with structured logging utility. Replace high-priority console.error calls in storage service and AI advisor route. Queue error/warning logs for batch sending to aggregation service.

#### Health Check Endpoint
Create `/src/app/api/health/route.ts` returning status, timestamp, version, and memory check. This enables uptime monitoring via free services like UptimeRobot.

#### Core Web Vitals
Add Vercel Speed Insights or manual web-vitals reporting. Track LCP, FID, CLS for performance baseline. Instrument AI API latency tracking.

---

### Phase 3: PWA Foundation (Week 4-5)

Enable installation and basic caching for the "garden usage" scenario.

#### Web App Manifest
Create `/public/manifest.json` with standalone display mode, zen-moss theme color (#5c6e49), and icons at 192x192, 384x384, and 512x512. Account for GitHub Pages base path when needed.

#### Service Worker Setup
Install `@ducanh2912/next-pwa` (maintained fork compatible with Next.js 15 App Router). Configure cache-first for static assets, network-first for API routes, stale-while-revalidate for HTML pages.

#### Offline Indicator
Create `/src/components/ui/OfflineIndicator.tsx` and `/src/hooks/useNetworkStatus.ts`. Show subtle banner when offline with "Changes will sync when connected" messaging.

---

### Phase 4: Accessibility Critical Fixes (Week 5-6)

Address barriers that prevent users from accessing core functionality.

#### AllotmentGrid Accessibility
This is the highest-impact fix. Convert clickable divs to buttons. Implement ARIA grid pattern following the existing GardenGrid component as a template. Add arrow key navigation for grid traversal. Provide keyboard alternative for repositioning (mode toggle + arrow keys).

#### AllotmentMobileView Accessibility
Convert clickable divs to buttons. Add proper section headings with aria-labelledby. Use list semantics for grouped items.

#### Form Accessibility
Add aria-describedby linking error messages to inputs across all form components. Move focus to first error field on validation failure. Replace native confirm() dialogs with accessible custom dialogs.

#### Chat Interface Accessibility
Add `role="log"` and `aria-live="polite"` to messages container. Announce loading states to screen readers.

---

### Phase 5: Mobile UX Enhancement (Week 6-7)

Improve the experience for the 80% of users in the garden.

#### Touch Target Sizing
Audit all interactive elements against 44x44px minimum. Fix year delete buttons (currently 32px), action buttons in PlantingCard, and category filter buttons. Use consistent `min-h-[44px] min-w-[44px]` or `p-2.5` padding.

#### Bottom Sheet Pattern
Enhance Dialog component with `variant="bottom-sheet"` for mobile viewports. Bottom sheets slide from bottom, provide larger touch targets, and work better with virtual keyboard.

#### Reduced Motion Support
Add `prefers-reduced-motion` media query to global CSS. Disable loading skeleton pulse and other animations for users who prefer reduced motion.

#### Install Prompt
Create `/src/components/ui/InstallPrompt.tsx` and `/src/hooks/useInstallPrompt.ts`. Show install prompt after meaningful engagement (first planting added, second visit). Store dismissal in localStorage. For iOS, show custom "Add to Home Screen" instructions.

---

### Phase 6: Authentication Integration (Week 8-9)

Integrate Clerk for user management per existing research documents.

#### Clerk Setup
Install `@clerk/nextjs`. Create middleware wrapper for protected routes. Add sign-in/sign-up pages. Configure session management with short-lived access tokens (15-60 minutes).

#### Navigation Integration
Add UserButton to navigation for authenticated users. Show subtle "Sign in to save across devices" prompt for anonymous users.

#### API Route Protection
Wrap sensitive API routes with Clerk authentication middleware. Continue allowing anonymous access for BYOK AI usage.

---

### Phase 7: Database Integration (Week 10-12)

Integrate Supabase for cloud persistence per existing research documents.

#### Supabase Setup
Create Supabase project. Implement schema from `supabase-data-storage.md` research. Configure Row Level Security policies with extensive testing.

#### Storage Abstraction Layer
Create `/src/lib/supabase/` directory with client and server configurations. Implement storage provider pattern that switches between localStorage (anonymous) and Supabase (authenticated).

#### Migration Flow
Build localStorage-to-Supabase migration for users who sign up. Show "Import your existing garden?" prompt. Handle conflict resolution with last-write-wins for v1.

#### GDPR Compliance
Implement data export endpoint (server-side equivalent of existing DataManagement export). Implement account deletion endpoint with complete data removal. Create privacy policy.

---

### Phase 8: Multi-Provider AI (Week 13-14)

Add Gemini support per existing research documents.

#### Provider Configuration
Create `/src/types/ai-provider.ts` with provider configs for OpenAI and Gemini (OpenAI-compatible endpoint). Update AI advisor route to accept provider header.

#### Client Updates
Add provider selector to AI advisor settings. Separate token storage per provider in sessionStorage.

#### Server-Side Free Tier (Post-Clerk)
After Clerk integration, implement authenticated free tier using server-side Gemini key with per-user rate limits (50 queries/day).

---

## Long-Term Maintenance Strategy

### AI-Assisted Development Workflow

#### CLAUDE.md Enhancements
Add quick reference section mapping common tasks to files. Document the storage service size constraint (exceeds 25k tokens). Include testing commands and common gotchas.

#### Ralph Loop Usage
Use Ralph Loop for iterative tasks with clear acceptance criteria. Good candidates include test fixes ("Run npm run test:unit after each change, success = all tests pass"), migration logic testing, and component styling refinement.

#### Subagent Patterns
Reserve subagents for tasks requiring fresh context windows: reviewing ADRs for consistency, analyzing test coverage patterns, investigating complex multi-file bugs. Avoid for single-file edits.

### Code Quality Automation

#### Pre-Commit Hooks
Configure husky + lint-staged to run ESLint and Prettier on staged files. This catches issues before they reach CI.

#### Test Coverage Thresholds
Add coverage thresholds to vitest.config.ts starting at achievable levels (60% lines, 50% branches) and gradually increase.

#### Automated Accessibility Testing
Add `@axe-core/playwright` to run accessibility checks as part of E2E tests. Catch regressions before they reach production.

### Dependency Management

The existing `update-deps.yml` workflow runs weekly with security audits. Recommended fix: remove `--force` flag from `npm audit fix` to prevent unexpected breaking changes.

### Storage Service Refactoring

The `allotment-storage.ts` file has grown too large for effective AI assistance. Plan to split into focused modules:
- `/src/services/allotment/validation.ts`
- `/src/services/allotment/migration.ts`
- `/src/services/allotment/areas.ts`
- `/src/services/allotment/seasons.ts`
- `/src/services/allotment/index.ts` (re-exports)

---

## Tooling Recommendations (Free Tiers)

| Domain | Tool | Free Tier | Priority |
|--------|------|-----------|----------|
| Error Tracking | Sentry | 5,000 errors/month | Phase 2 |
| Log Aggregation | Axiom | 500GB/month, 30 days | Phase 2 |
| Uptime Monitoring | UptimeRobot | 50 monitors, 5-min intervals | Phase 2 |
| PWA | @ducanh2912/next-pwa | Open source | Phase 3 |
| Authentication | Clerk | 10,000 MAU | Phase 6 |
| Database | Supabase | 500MB, 1GB storage | Phase 7 |
| Performance | Vercel Speed Insights | Included with Vercel | Phase 2 |

---

## Success Metrics

### Pre-Production Checklist

Security:
- [ ] CSP headers configured
- [ ] Server-side rate limiting active
- [ ] Input validation on all API routes
- [ ] RLS policies tested extensively

PWA:
- [ ] App installs successfully on iOS and Android
- [ ] Offline mode works after initial visit
- [ ] Lighthouse PWA score = "installable"

Accessibility:
- [ ] AllotmentGrid navigable by keyboard
- [ ] Screen reader can access core functionality
- [ ] All touch targets meet 44px minimum
- [ ] axe-core tests pass in CI

Observability:
- [ ] Sentry capturing errors
- [ ] Health check endpoint responding
- [ ] Core Web Vitals tracked

Performance:
- [ ] LCP < 2.5 seconds
- [ ] TTI < 3.5 seconds
- [ ] Lighthouse Performance > 90

---

## Risk Assessment

### High Risk
RLS Policy Errors: Incorrect Supabase RLS policies could expose user data. Mitigation: extensive testing including automated cross-user access tests.

### Medium Risk
Service Worker Caching Issues: Aggressive caching could serve stale content. Mitigation: implement cache versioning and "new version available" refresh flow.

Migration Data Loss: localStorage-to-Supabase migration could fail. Mitigation: preserve localStorage as backup until sync confirmed.

### Low Risk
Third-Party Service Outages: Clerk, Supabase, or OpenAI could have downtime. Mitigation: graceful degradation with clear user messaging.

---

## Timeline Summary

| Phase | Focus | Duration | Dependencies |
|-------|-------|----------|--------------|
| 0 | Foundation Fixes | 1 week | None |
| 1 | Security Hardening | 2 weeks | None |
| 2 | Observability | 1 week | None |
| 3 | PWA Foundation | 1 week | None |
| 4 | Accessibility Critical | 2 weeks | None |
| 5 | Mobile UX | 1 week | Phase 3 |
| 6 | Authentication | 2 weeks | Phase 1 |
| 7 | Database | 3 weeks | Phase 6 |
| 8 | Multi-Provider AI | 2 weeks | Phase 6 |

Total estimated timeline: 15 weeks for full implementation. Phases 0-5 can proceed without external service integration. Phases 6-8 require Clerk and Supabase accounts.

---

## References

### Analysis Reports
- Security Analysis: Agent a282834
- PWA/Mobile Analysis: Agent ad2d1d0
- Observability Analysis: Agent a9e665b
- Maintainability Analysis: Agent a307a78
- Accessibility Analysis: Agent abea409

### Existing Research Documents
- System Evolution Plan: docs/research/system-evolution-plan.md
- Clerk User Management: docs/research/clerk-user-management.md
- Supabase Data Storage: docs/research/supabase-data-storage.md
- Multi-Provider AI Integration: docs/research/multi-provider-ai-integration.md
- Plant Data Validation Strategy: docs/research/plant-data-validation-strategy.md

### Key External Sources
- [RHS Crop Rotation](https://www.rhs.org.uk/vegetables/crop-rotation)
- [RHS Composting Guide](https://www.rhs.org.uk/soil-composts-mulches/composting)
- [Garden Organic Companion Planting](https://www.gardenorganic.org.uk/expert-advice/how-to-grow/how-to-grow-flowers/companion-or-mixed-planting)
- [Charles Dowding No-Dig](https://charlesdowding.co.uk/)
- [OpenFarm GitHub (Plant Data)](https://github.com/openfarmcc/OpenFarm) - ARCHIVED April 2025, API down, data CC0 licensed

---

*Document created: January 14, 2026*
*Last updated: January 15, 2026 - Added Phase 1 analysis + 5-expert parallel implementation plan*
*Analysis method: Multi-persona Opus ultrathink review*
