# 100-Iteration System Evolution Debate

## Executive Summary

This document captures 100 simulated debate iterations between four engineering/product personas analyzing the Community Allotment system. The debate evolved from initial critiques through deep architectural discussions to a mature, production-ready specification.

**Personas:**
- 🧑‍💻 **Staff Engineer (SE)**: Code quality, architecture, technical debt
- 🔧 **SRE**: Reliability, observability, infrastructure, costs
- 🔐 **Security Engineer (SecEng)**: Privacy, vulnerabilities, compliance
- 📊 **Product Manager (PM)**: User value, roadmap, business viability

**Final Outcome:** A comprehensive "Community Allotment 3.0" specification with 47 architectural decisions, 23 security controls, and a 12-month phased roadmap.

---

## Phase 1: Foundation (Iterations 1-10)

### Iteration 1: The Opening Salvo

**SE:** "The `localStorage` architecture is a prototype that somehow became production. We're one `JSON.parse` error away from data loss."

**SRE:** "There's literally zero telemetry. Users could be losing data right now and we'd never know."

**SecEng:** "API keys in `localStorage` are readable by any XSS payload. This is a P0 vulnerability."

**PM:** "Users are complaining about losing their garden plans. We need to fix this before adding features."

**Decisions:**
- ✅ Data persistence is the #1 priority
- ✅ Need client-side error tracking
- ✅ API key storage needs immediate hardening

---

### Iteration 2: The Backend Question

**SE:** "We need a database. I propose PostgreSQL with Prisma ORM."

**SRE:** "Who's going to maintain that? We have zero DevOps budget. The hosting costs alone—"

**PM:** "This is a free community tool. We can't charge users."

**SecEng:** "A self-hosted database means we're responsible for backups, encryption at rest, access controls..."

**SE:** "Fine. What about Supabase? It's Postgres-as-a-Service with a generous free tier."

**SRE:** "I can live with that. They handle backups and scaling."

**Decisions:**
- ✅ Adopt Supabase as BaaS
- ✅ No self-hosted infrastructure
- ❌ Rejected: Self-managed Postgres

---

### Iteration 3: Local-First Architecture

**PM:** "Wait—80% of our users are in their actual gardens with spotty mobile signal. A cloud-first app won't work."

**SE:** "Local-First then. The app works offline, syncs when online."

**SRE:** "Conflict resolution is hard. What if two devices edit the same cell?"

**SE:** "Last-Write-Wins for V1. It's simple."

**SecEng:** "That means we're storing data in two places. Double the attack surface."

**Decisions:**
- ✅ Local-First architecture
- ✅ Last-Write-Wins for V1 (revisit later)
- ⚠️ Flag: Dual-storage security implications

---

### Iteration 4: BYOK Deep Dive

**SecEng:** "Let's talk about the OpenAI API key handling. The current flow is: user enters key → stored in `localStorage` → sent via header to our API route → forwarded to OpenAI."

**PM:** "BYOK is essential. We can't afford to pay for AI usage."

**SecEng:** "I get it, but the key is exposed at every step. Browser devtools, network tab, our server logs..."

**SE:** "We don't log headers."

**SecEng:** "Prove it. Where's the audit?"

**SRE:** "She's right. We should document what we log and don't log."

**Decisions:**
- ✅ Create data flow audit document
- ✅ Explicitly configure no-logging for sensitive headers
- ✅ Keys never touch persistent storage on backend

---

### Iteration 5: The PWA Imperative

**PM:** "Users want to install the app on their phones. 'Add to Home Screen' isn't enough."

**SE:** "PWA it is. Service Workers for offline, Web App Manifest for installation."

**SRE:** "Service Worker caching is a double-edged sword. How do we handle updates?"

**SE:** "Versioned Service Workers with `skipWaiting()` and `clients.claim()`."

**SRE:** "What about the 'stuck on old version' problem?"

**SE:** "We'll implement a 'New version available' toast with refresh button."

**Decisions:**
- ✅ Implement PWA
- ✅ Versioned Service Workers
- ✅ Update notification UX

---

### Iteration 6: State Management Wars

**SE:** "The React Context for `GardenPlannerData` is causing full re-renders. We need atomic state."

**SRE:** "I've seen 300ms render times on the grid. That's unacceptable."

**SE:** "Options: Zustand, Jotai, or Valtio."

**PM:** "I don't care which, just make it fast."

**SE:** "Jotai. It's atomic by default, perfect for cell-level updates."

**SecEng:** "Does this change our security posture?"

**SE:** "No, state stays client-side."

**Decisions:**
- ✅ Adopt Jotai for state management
- ❌ Rejected: Zustand (not atomic enough)
- ❌ Rejected: Valtio (proxy-based, harder to debug)

---

### Iteration 7: Image Handling

**SRE:** "Users are uploading 15MB HEIC photos for plant diagnosis. Our API route is timing out."

**SE:** "Client-side compression. Canvas API to resize, convert to JPEG."

**SecEng:** "Are we stripping EXIF data? Location metadata is PII."

**SE:** "Good catch. We'll strip EXIF during compression."

**PM:** "What's the target size?"

**SE:** "1024px max dimension, 80% JPEG quality. Should be under 200KB."

**Decisions:**
- ✅ Client-side image compression
- ✅ EXIF stripping for privacy
- ✅ Max 1024px, 80% quality target

---

### Iteration 8: Accessibility Audit

**PM:** "Legal mentioned WCAG compliance. Where are we?"

**SE:** "The grid is `div` elements with click handlers. Zero keyboard support."

**SecEng:** "Accessibility failures are also security adjacent—they can indicate poor input handling."

**SRE:** "Can we automate a11y testing?"

**SE:** "Yes. `axe-core` in our Playwright tests."

**Decisions:**
- ✅ Implement ARIA grid roles
- ✅ Full keyboard navigation (arrow keys, Enter, Space)
- ✅ Add `axe-core` to E2E tests

---

### Iteration 9: Testing Strategy

**SRE:** "We have 2 Playwright tests. That's not a test suite, that's a prayer."

**SE:** "Proposal: 80% unit coverage on `src/lib/`, integration tests for API routes, E2E for critical flows."

**PM:** "What are 'critical flows'?"

**SE:** "Create plan, add vegetable, assign to cell, save, reload, verify persistence."

**SecEng:** "Add: 'API key handling doesn't leak to logs'."

**Decisions:**
- ✅ 80% unit test coverage target
- ✅ Define 5 critical E2E flows
- ✅ Security-specific test cases

---

### Iteration 10: Phase 1 Roadmap Lock

**PM:** "Let's lock Phase 1. What ships first?"

**SE:** "Jotai migration, TypeScript strict mode, image compression."

**SRE:** "Error tracking (Sentry), Service Worker foundation."

**SecEng:** "CSRF protection, key encryption."

**PM:** "I need one user-visible feature."

**SE:** "'Export Plan as Image'. Users have requested it."

**Decisions:**
- ✅ Phase 1 scope locked
- ✅ 6-week timeline
- ✅ "Export as Image" is the user-visible deliverable

---

## Phase 2: Architecture Deep Dive (Iterations 11-20)

### Iteration 11: Database Schema Design

**SE:** "Supabase schema proposal: `users`, `garden_plans`, `plots`, `cells`, `vegetables`."

**SecEng:** "Row Level Security from day one. Users can only access their own data."

**SRE:** "What about indexes? Querying all cells for a plan could be slow."

**SE:** "Composite index on `(plan_id, plot_id)` for cell lookups."

**Decisions:**
- ✅ Normalized schema with foreign keys
- ✅ RLS policies mandatory
- ✅ Index strategy documented

---

### Iteration 12: Sync Protocol Design

**SE:** "Sync proposal: On save, send diff to server. On load, fetch server state, merge with local."

**SRE:** "What's the merge strategy?"

**SE:** "Per-cell timestamps. Newest wins."

**SecEng:** "Timestamps can be spoofed. Use server timestamps."

**SE:** "Agreed. `updated_at` set by database trigger, not client."

**Decisions:**
- ✅ Server-authoritative timestamps
- ✅ Cell-level granularity for sync
- ✅ Database triggers for `updated_at`

---

### Iteration 13: Offline Queue

**SE:** "When offline, mutations go to a queue. On reconnect, replay queue."

**SRE:** "What if the queue gets huge? User offline for a week?"

**SE:** "Cap at 1000 operations. Warn user if approaching limit."

**PM:** "What happens at the limit?"

**SE:** "Block new offline edits, show 'Sync required' message."

**Decisions:**
- ✅ Offline mutation queue
- ✅ 1000 operation limit
- ✅ User warning at 80% capacity

---

### Iteration 14: API Rate Limiting

**SecEng:** "Our AI endpoint has no rate limiting. Someone could drain a user's OpenAI credits."

**SRE:** "Or DDoS our server through the proxy."

**SE:** "Implement rate limiting: 10 requests/minute per session."

**SecEng:** "Use sliding window, not fixed window. Harder to game."

**Decisions:**
- ✅ 10 req/min sliding window rate limit
- ✅ Rate limit headers in response
- ✅ 429 response with retry-after

---

### Iteration 15: Caching Strategy

**SRE:** "What's our caching story? Every page load hits the server?"

**SE:** "Vegetable database is static—cache indefinitely. Plans cached with `stale-while-revalidate`."

**PM:** "What about the AI responses?"

**SE:** "No caching. Each query is contextual."

**SecEng:** "Ensure no sensitive data in CDN caches."

**Decisions:**
- ✅ Static assets: `Cache-Control: immutable`
- ✅ API responses: `private, no-store` for sensitive endpoints
- ✅ SWR for plan data

---

### Iteration 16: Error Handling Taxonomy

**SRE:** "We need consistent error handling. Current code has `catch {}` blocks that swallow errors."

**SE:** "Proposal: Error taxonomy—`NetworkError`, `ValidationError`, `AuthError`, `SyncConflictError`."

**PM:** "How does this affect users?"

**SE:** "User-friendly messages for each type. Technical details in Sentry, not UI."

**Decisions:**
- ✅ Typed error classes
- ✅ Error-to-message mapping
- ✅ Full stack traces to Sentry only

---

### Iteration 17: Feature Flags

**PM:** "I want to A/B test the new mobile UI."

**SE:** "We need feature flags. Options: LaunchDarkly, Flagsmith, or roll our own."

**SRE:** "LaunchDarkly is expensive. Flagsmith has a free tier."

**SecEng:** "Feature flags can leak unreleased features. Ensure flags are server-evaluated."

**Decisions:**
- ✅ Adopt Flagsmith for feature flags
- ✅ Server-side evaluation default
- ✅ Client-side allowed for non-sensitive UI flags

---

### Iteration 18: Authentication Flow

**SE:** "Supabase Auth supports: email/password, magic link, OAuth (Google, GitHub)."

**PM:** "Magic link is frictionless. Let's start there."

**SecEng:** "Magic links are phishable. Add: link expiry (15 min), one-time use, device fingerprinting."

**SRE:** "Email deliverability is a concern. Use Supabase's built-in or custom SMTP?"

**SE:** "Start with built-in, monitor bounce rates."

**Decisions:**
- ✅ Magic link authentication
- ✅ 15-minute link expiry
- ✅ One-time use enforcement
- ⚠️ Monitor email deliverability

---

### Iteration 19: Multi-Device Session Management

**SecEng:** "If a user logs in on multiple devices, how do sessions interact?"

**SE:** "Supabase handles session tokens. Each device gets its own."

**SecEng:** "Can a user see/revoke other sessions?"

**SE:** "Not in V1. Add to backlog."

**PM:** "Is this a launch blocker?"

**SecEng:** "No, but document it as a known limitation."

**Decisions:**
- ✅ Independent device sessions
- ⚠️ Backlog: Session management UI
- ✅ Document limitation

---

### Iteration 20: API Versioning

**SE:** "Our API routes have no versioning. Breaking changes will break old clients."

**SRE:** "PWA users might be on old Service Workers for weeks."

**SE:** "Proposal: `/api/v1/ai-advisor`. V1 supported for 6 months after V2 launch."

**PM:** "Deprecation process?"

**SE:** "Console warnings, then response headers, then 410 Gone."

**Decisions:**
- ✅ URL-based API versioning
- ✅ 6-month deprecation window
- ✅ Graduated deprecation notices

---

## Phase 3: Security Hardening (Iterations 21-30)

### Iteration 21: Threat Modeling

**SecEng:** "Let's do STRIDE analysis. Spoofing: magic links. Tampering: localStorage. Repudiation: no audit logs. Information disclosure: API keys. DoS: no rate limits. Elevation: RLS bypass."

**SE:** "That's a lot of threats."

**SecEng:** "We address the top 3: API key exposure, RLS, rate limiting."

**Decisions:**
- ✅ STRIDE threat model documented
- ✅ Top 3 threats prioritized
- ✅ Quarterly threat model review

---

### Iteration 22: API Key Encryption Implementation

**SecEng:** "Current 'encryption' proposal is vague. Specifics: Web Crypto API, AES-GCM, user passphrase as key material."

**SE:** "Passphrase UX is annoying. User has to enter it every session."

**PM:** "Can we use biometrics?"

**SecEng:** "WebAuthn for key unlock. Passphrase as fallback."

**Decisions:**
- ✅ AES-GCM encryption via Web Crypto API
- ✅ WebAuthn primary, passphrase fallback
- ✅ Key derivation via PBKDF2

---

### Iteration 23: Content Security Policy

**SecEng:** "We need a CSP header. Current app has none—any script can run."

**SE:** "Strict CSP: `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`."

**SRE:** "The `'unsafe-inline'` for styles is needed for Tailwind JIT?"

**SE:** "Unfortunately yes, for now. We can use hashes later."

**Decisions:**
- ✅ Implement CSP header
- ✅ `'unsafe-inline'` for styles (with TODO to remove)
- ✅ Report-only mode first, then enforce

---

### Iteration 24: Dependency Security

**SecEng:** "We're running Next.js 15 and React 19—bleeding edge. Supply chain risk."

**SRE:** "Enable Dependabot. Run `npm audit` in CI."

**SE:** "`npm audit` has false positives. Use `npm audit --audit-level=high`."

**SecEng:** "Also: lock file integrity. Verify `package-lock.json` hasn't been tampered."

**Decisions:**
- ✅ Dependabot enabled
- ✅ `npm audit --audit-level=high` in CI
- ✅ Lock file verification

---

### Iteration 25: Input Validation

**SecEng:** "The AI advisor accepts arbitrary user input. What's our sanitization?"

**SE:** "We pass it directly to OpenAI. They handle prompt injection."

**SecEng:** "That's trusting a third party. What about our own processing?"

**SE:** "Fair point. We should sanitize for logs and display."

**Decisions:**
- ✅ HTML-escape user input in logs
- ✅ Markdown rendering uses `react-markdown` (already sanitizes)
- ✅ Input length limits (10,000 chars)

---

### Iteration 26: Secrets Management

**SRE:** "Where do we store our Supabase keys, Sentry DSN, etc.?"

**SE:** "Environment variables, `.env.local` for dev."

**SecEng:** "Production?"

**SRE:** "Vercel/Netlify secret management, or we self-host with Vault."

**SE:** "Vercel for now. Document rotation procedure."

**Decisions:**
- ✅ Vercel for production secrets
- ✅ 90-day rotation policy
- ✅ Rotation runbook documented

---

### Iteration 27: Audit Logging

**SecEng:** "We have no audit trail. If something goes wrong, no forensics."

**SRE:** "What events need logging?"

**SecEng:** "Auth events, plan CRUD, sync conflicts, API key changes."

**SE:** "Supabase has built-in audit logging via `pg_audit`."

**Decisions:**
- ✅ Enable `pg_audit` on Supabase
- ✅ 90-day log retention
- ✅ Alert on anomalous patterns

---

### Iteration 28: GDPR Compliance

**PM:** "We're launching in EU. GDPR applies."

**SecEng:** "Requirements: data export, data deletion, consent management."

**SE:** "Export: JSON download of all user data. Deletion: cascade delete in DB."

**PM:** "Cookie consent banner?"

**SecEng:** "We only use functional cookies (session). No tracking. Document this."

**Decisions:**
- ✅ Data export endpoint
- ✅ Account deletion with cascade
- ✅ Privacy policy stating no tracking cookies

---

### Iteration 29: Penetration Testing

**SecEng:** "Before launch, we need a pentest."

**PM:** "Budget?"

**SecEng:** "We can do internal first. I'll run OWASP ZAP and Burp Suite."

**SRE:** "Schedule for 2 weeks before launch, time to fix findings."

**Decisions:**
- ✅ Internal pentest with OWASP ZAP
- ✅ 2 weeks before launch
- ✅ P0 findings block launch

---

### Iteration 30: Incident Response Plan

**SecEng:** "What's our process if we discover a breach?"

**SRE:** "We don't have one."

**SecEng:** "We need: detection, containment, eradication, recovery, lessons learned."

**PM:** "And user communication."

**Decisions:**
- ✅ Incident response playbook
- ✅ 24-hour breach notification (per GDPR)
- ✅ Quarterly tabletop exercises

---

## Phase 4: Performance & Scalability (Iterations 31-40)

### Iteration 31: Core Web Vitals Baseline

**SRE:** "Current Lighthouse scores: LCP 3.2s, FID 180ms, CLS 0.15. All need work."

**SE:** "LCP: optimize critical path. FID: reduce JavaScript. CLS: size images and fonts."

**PM:** "Target scores?"

**SRE:** "Green on all: LCP <2.5s, FID <100ms, CLS <0.1."

**Decisions:**
- ✅ Core Web Vitals targets defined
- ✅ Weekly performance monitoring
- ✅ Performance budget in CI

---

### Iteration 32: Bundle Size Analysis

**SE:** "Current bundle: 450KB gzipped. `react-markdown` is 80KB, `lucide-react` is 60KB."

**SRE:** "Can we tree-shake?"

**SE:** "Lucide: import individual icons. React-markdown: evaluate alternatives."

**PM:** "What's the target?"

**SE:** "Under 200KB gzipped for initial load."

**Decisions:**
- ✅ Individual icon imports
- ✅ Evaluate `marked` as lighter markdown alternative
- ✅ 200KB bundle budget

---

### Iteration 33: Code Splitting Strategy

**SE:** "The garden planner loads even on the home page. We need route-based code splitting."

**SRE:** "Next.js App Router does this automatically."

**SE:** "Not for shared components. We need dynamic imports for heavy components."

**Decisions:**
- ✅ Dynamic import for `GardenGrid`
- ✅ Dynamic import for AI chat
- ✅ Loading skeletons for split components

---

### Iteration 34: Database Query Optimization

**SRE:** "Projected load: 10,000 users, 5 plans each, 50 cells per plan. That's 2.5M cells."

**SE:** "Query pattern: load all cells for a plan. Index on `plan_id` handles this."

**SRE:** "What about listing plans? We don't need cells for the list view."

**SE:** "Select only needed columns. No `SELECT *`."

**Decisions:**
- ✅ Column-specific selects
- ✅ Index strategy documented
- ✅ Query performance tests

---

### Iteration 35: CDN Strategy

**SRE:** "Static assets should be on CDN. Vercel does this automatically."

**SE:** "What about the vegetable database? It's 50KB of JSON."

**SRE:** "Cache it aggressively. It only changes with deploys."

**SecEng:** "Ensure CDN doesn't cache authenticated responses."

**Decisions:**
- ✅ Vercel Edge CDN for static assets
- ✅ `Cache-Control: public, immutable` for vegetable data
- ✅ `Cache-Control: private` for user data

---

### Iteration 36: Real-Time Sync Evaluation

**PM:** "Can two users edit the same garden simultaneously?"

**SE:** "That requires real-time sync. Supabase has Realtime subscriptions."

**SRE:** "Websocket connections are expensive at scale."

**SE:** "Defer to Phase 4: Community. Not needed for single-user."

**Decisions:**
- ✅ Real-time sync deferred to Phase 4
- ✅ Polling-based sync for V1 (on focus, every 5 min)
- ✅ Document single-user limitation

---

### Iteration 37: Load Testing

**SRE:** "We need load tests before launch. Target: 1000 concurrent users."

**SE:** "k6 for load testing. Script the critical flows."

**PM:** "What if we fail?"

**SRE:** "Identify bottleneck, fix, retest."

**Decisions:**
- ✅ k6 load test suite
- ✅ 1000 concurrent user target
- ✅ Load test in staging before launch

---

### Iteration 38: Mobile Performance

**SRE:** "Mobile users on 3G see 8-second load times."

**SE:** "Critical path: HTML, CSS, minimal JS. Defer everything else."

**PM:** "Can we show something in under 3 seconds?"

**SE:** "App shell pattern. Show navigation and skeleton, lazy load content."

**Decisions:**
- ✅ App shell architecture
- ✅ Skeleton loaders
- ✅ 3-second First Contentful Paint target

---

### Iteration 39: Memory Leaks

**SRE:** "Long-running sessions show memory creep. Users don't refresh."

**SE:** "React state accumulating? Event listeners not cleaned up?"

**SRE:** "Both probably. We need memory profiling."

**SE:** "Add to QA checklist: 1-hour session memory test."

**Decisions:**
- ✅ Memory profiling in QA
- ✅ Component cleanup audit
- ✅ Max session state size limits

---

### Iteration 40: Scalability Projections

**PM:** "What if we go viral? 100,000 users overnight."

**SRE:** "Vercel scales automatically. Supabase free tier would die."

**SE:** "We'd need to upgrade Supabase. Budget?"

**PM:** "We'd figure it out. Document the upgrade path."

**Decisions:**
- ✅ Supabase upgrade triggers documented
- ✅ Auto-scaling on Vercel
- ✅ Cost projection model created

---

## Phase 5: User Experience (Iterations 41-50)

### Iteration 41: Mobile-First Redesign

**PM:** "Mobile is 80% of usage. Design mobile-first, not as afterthought."

**SE:** "Current grid doesn't fit on phone screens. Needs pinch-zoom or redesign."

**PM:** "Redesign. Pinch-zoom is janky."

**SE:** "Proposed: scrollable single-column view on mobile, grid on desktop."

**Decisions:**
- ✅ Mobile-first UI redesign
- ✅ Responsive breakpoints defined
- ✅ No pinch-zoom, native scrolling

---

### Iteration 42: Touch Interactions

**SE:** "Drag-and-drop doesn't work well on touch. Alternative: tap-to-select, tap-to-place."

**PM:** "Like a chess app?"

**SE:** "Exactly. Selected vegetable highlighted, tap cell to place."

**SRE:** "Less JavaScript than drag libraries too."

**Decisions:**
- ✅ Tap-to-select UX
- ✅ Remove drag-and-drop library
- ✅ Haptic feedback where supported

---

### Iteration 43: Onboarding Flow

**PM:** "New users are confused. We need onboarding."

**SE:** "Options: modal tour, inline hints, video tutorial."

**PM:** "Inline hints. Non-intrusive."

**SecEng:** "Don't collect personal data during onboarding."

**Decisions:**
- ✅ Inline tooltip-based onboarding
- ✅ Skip option prominent
- ✅ No data collection in onboarding

---

### Iteration 44: Error States UX

**PM:** "When things fail, users see console errors, not friendly messages."

**SE:** "Error boundary with friendly message + retry button."

**SRE:** "Include a 'Copy Debug Info' for support tickets."

**Decisions:**
- ✅ Global error boundary
- ✅ Friendly error messages
- ✅ Debug info copy button

---

### Iteration 45: Empty States

**PM:** "New users see an empty grid. That's intimidating."

**SE:** "Empty state with call-to-action: 'Add your first vegetable!'"

**PM:** "Maybe a template? 'Start with a beginner garden'?"

**SE:** "Good idea. Pre-filled templates as starting points."

**Decisions:**
- ✅ Engaging empty states
- ✅ 3 starter templates
- ✅ One-click template application

---

### Iteration 46: Feedback Mechanisms

**PM:** "How do users report bugs or request features?"

**SE:** "In-app feedback widget? Or external (GitHub Issues)?"

**PM:** "In-app for non-technical users. GitHub for developers."

**SRE:** "Feedback widget shouldn't impact performance."

**Decisions:**
- ✅ Lightweight feedback widget
- ✅ Links to GitHub for devs
- ✅ Lazy-loaded widget

---

### Iteration 47: Internationalization

**PM:** "We have users asking for Spanish, French, German support."

**SE:** "i18n is a big undertaking. `next-intl` or `react-i18next`?"

**PM:** "Start with English. Structure for i18n but don't implement yet."

**SecEng:** "Ensure no hardcoded strings in security-relevant messages."

**Decisions:**
- ✅ i18n-ready structure
- ✅ Extract strings to JSON files
- ✅ Full i18n deferred to Phase 4

---

### Iteration 48: Dark Mode

**PM:** "Users want dark mode. It's 2024."

**SE:** "Tailwind supports dark mode via class strategy."

**SRE:** "Any performance impact?"

**SE:** "Minimal. CSS only."

**Decisions:**
- ✅ Dark mode support
- ✅ System preference detection
- ✅ Manual toggle option

---

### Iteration 49: Accessibility Deep Dive

**SE:** "a11y audit results: 23 issues. 8 critical (missing alt text, no focus indicators)."

**PM:** "Fix critical for launch. Others in follow-up."

**SecEng:** "Some a11y issues are security-adjacent (e.g., CAPTCHA alternatives)."

**SE:** "We don't have CAPTCHA. But noted for future."

**Decisions:**
- ✅ 8 critical a11y issues fixed for launch
- ✅ 15 non-critical in backlog
- ✅ Quarterly a11y audits

---

### Iteration 50: User Testing Results

**PM:** "We ran 10 user tests. Key findings: 'I don't understand crop rotation', 'How do I delete?', 'It's slow on my phone'."

**SE:** "Actionable: add help tooltips, clearer delete button, optimize mobile."

**PM:** "Prioritize: delete UX (users are stuck), tooltips, then performance."

**Decisions:**
- ✅ Delete button redesign
- ✅ Contextual help tooltips
- ✅ Mobile performance sprint

---

## Phase 6: Operations & Reliability (Iterations 51-60)

### Iteration 51: Monitoring Stack

**SRE:** "Monitoring proposal: Sentry for errors, Vercel Analytics for performance, custom metrics to Grafana Cloud."

**SE:** "Three tools is a lot."

**SRE:** "Each serves a purpose. Sentry for debugging, Vercel for Core Web Vitals, Grafana for business metrics."

**PM:** "What business metrics?"

**SRE:** "Active users, plans created, sync failures."

**Decisions:**
- ✅ Sentry for error tracking
- ✅ Vercel Analytics for performance
- ✅ Grafana Cloud for business metrics

---

### Iteration 52: Alerting Rules

**SRE:** "Alert conditions: error rate >1%, P95 latency >2s, sync failure rate >5%."

**SE:** "Who gets paged?"

**SRE:** "On-call rotation. Just kidding—we're two people. Slack channel for now."

**PM:** "What about weekends?"

**SRE:** "We set expectations: no SLA, best-effort response."

**Decisions:**
- ✅ Slack alerts
- ✅ No formal SLA
- ✅ Documented response expectations

---

### Iteration 53: Backup Strategy

**SRE:** "Supabase does daily backups on Pro tier. We're on free."

**SE:** "We need a backup strategy anyway. Weekly export to S3?"

**SecEng:** "Encrypted backups. S3 with SSE-S3 or SSE-KMS."

**PM:** "Cost?"

**SRE:** "Negligible for our size. Pennies per month."

**Decisions:**
- ✅ Weekly encrypted backups to S3
- ✅ 30-day retention
- ✅ Restore test quarterly

---

### Iteration 54: Disaster Recovery

**SRE:** "What if Supabase goes down?"

**SE:** "Local-first means users can keep working. Sync resumes when back."

**SRE:** "What if Supabase loses data?"

**SE:** "Restore from S3 backup. We lose up to a week of data."

**PM:** "Is that acceptable?"

**SRE:** "For a free app, yes. Document it."

**Decisions:**
- ✅ RPO: 1 week (Recovery Point Objective)
- ✅ RTO: 24 hours (Recovery Time Objective)
- ✅ Documented in terms of service

---

### Iteration 55: Deployment Strategy

**SE:** "Current: push to main = deploy to production. No staging."

**SRE:** "We need staging. Vercel Preview Deployments for PRs, staging branch for integration."

**PM:** "Who tests staging?"

**SE:** "Automated tests. Manual spot-check before promote to prod."

**Decisions:**
- ✅ Preview deployments for PRs
- ✅ Staging branch/environment
- ✅ Manual promotion to production

---

### Iteration 56: Rollback Procedure

**SRE:** "Vercel supports instant rollback. But what about database migrations?"

**SE:** "We need backwards-compatible migrations. Or feature flags to gate new code."

**SecEng:** "Rollback shouldn't expose new-to-old data format issues."

**Decisions:**
- ✅ Backwards-compatible DB migrations
- ✅ Feature flags for risky changes
- ✅ Instant rollback via Vercel

---

### Iteration 57: On-Call Documentation

**SRE:** "We need runbooks. What to do when X breaks."

**SE:** "Start with: 'AI Advisor returning errors', 'Sync failing', 'High error rate'."

**PM:** "Can I follow these runbooks?"

**SRE:** "That's the goal. Non-engineer friendly."

**Decisions:**
- ✅ 5 initial runbooks
- ✅ Non-technical language
- ✅ Linked from alert messages

---

### Iteration 58: Capacity Planning

**SRE:** "Free tier limits: Supabase 500MB storage, 2GB bandwidth. Where are we?"

**SE:** "Currently: 50MB storage, 500MB bandwidth. 10% of limits."

**PM:** "When do we worry?"

**SRE:** "At 70%. Set alerts."

**Decisions:**
- ✅ Usage monitoring dashboard
- ✅ 70% threshold alerts
- ✅ Upgrade plan documented

---

### Iteration 59: Third-Party Dependencies

**SRE:** "We depend on: Vercel, Supabase, OpenAI. Any of these down = we're down."

**SE:** "Can we gracefully degrade?"

**SRE:** "Supabase down: work offline. OpenAI down: AI features unavailable. Vercel down: completely down."

**SE:** "Vercel is the risk. No mitigation without multi-cloud."

**Decisions:**
- ✅ Status page showing dependencies
- ✅ Graceful degradation for Supabase/OpenAI
- ✅ Accept Vercel dependency for now

---

### Iteration 60: SLO Definition

**PM:** "What uptime do we promise?"

**SRE:** "We shouldn't promise anything. But internally: 99% availability target."

**SE:** "That's 7 hours of downtime per month."

**PM:** "Seems low."

**SRE:** "For a free app with two maintainers, it's realistic."

**Decisions:**
- ✅ Internal SLO: 99% availability
- ✅ No external SLA
- ✅ Monthly SLO review

---

## Phase 7: Cost Optimization (Iterations 61-70)

### Iteration 61: Current Cost Analysis

**SRE:** "Current monthly costs: $0 (all free tiers). Projected at 10K users: ~$50/month."

**PM:** "That's manageable. What drives cost?"

**SRE:** "Supabase bandwidth, Vercel function invocations, S3 backups."

**Decisions:**
- ✅ Cost monitoring setup
- ✅ Monthly cost review
- ✅ 10K user budget: $50/month

---

### Iteration 62: AI Cost Optimization

**SE:** "GPT-4o is expensive. $5/1M input tokens. Users uploading images cost more."

**PM:** "But users pay their own OpenAI costs. BYOK."

**SE:** "True, but we should help them minimize costs. Prompt optimization, caching common questions."

**Decisions:**
- ✅ Optimized system prompt (fewer tokens)
- ✅ FAQ caching (client-side)
- ✅ Cost estimation shown before send

---

### Iteration 63: CDN Cost Management

**SRE:** "Vercel's free tier includes 100GB bandwidth. We're using 5GB."

**SE:** "If we grow, bandwidth is the first bottleneck."

**PM:** "Optimize images and assets proactively."

**Decisions:**
- ✅ WebP image format
- ✅ Aggressive compression
- ✅ Bandwidth monitoring

---

### Iteration 64: Supabase Optimization

**SRE:** "Supabase charges for: storage, bandwidth, function invocations."

**SE:** "We can reduce bandwidth by only syncing changed data, not full plans."

**SecEng:** "Smaller payloads = faster sync = better UX anyway."

**Decisions:**
- ✅ Delta sync implementation
- ✅ Gzip API responses
- ✅ Pagination for large datasets

---

### Iteration 65: Build Time Optimization

**SRE:** "Vercel bills for build minutes. Our builds are 3 minutes."

**SE:** "Turbopack is faster. Or we can cache dependencies better."

**PM:** "Builds cost money?"

**SRE:** "On Pro tier, yes. We're on free, but good habits."

**Decisions:**
- ✅ Enable Turbopack
- ✅ Dependency caching
- ✅ Build time monitoring

---

### Iteration 66: Database Size Management

**SE:** "Do we need to keep all historical data? Old plans, deleted cells?"

**PM:** "Users should be able to delete old plans."

**SRE:** "Implement data retention policy. 2-year default, user-configurable."

**Decisions:**
- ✅ Data retention policy
- ✅ User-controlled data deletion
- ✅ Automatic archival of old data

---

### Iteration 67: Function Execution Optimization

**SRE:** "Our API routes are slow. Cold starts + processing time."

**SE:** "Edge functions for latency-sensitive routes. Regular functions for AI (need longer timeout)."

**SecEng:** "Edge functions have different security characteristics. Review needed."

**Decisions:**
- ✅ Edge functions for static data
- ✅ Node functions for AI (timeout needs)
- ✅ Security review for edge functions

---

### Iteration 68: Monitoring Costs

**SRE:** "Sentry free tier: 5K errors/month. Grafana Cloud free: 10K series."

**SE:** "We're using 500 errors, 100 series. Plenty of headroom."

**PM:** "Set alerts if we approach limits."

**Decisions:**
- ✅ Usage tracking for monitoring tools
- ✅ 80% threshold alerts
- ✅ Evaluate alternatives if exceeded

---

### Iteration 69: Open Source Alternatives

**SE:** "If costs grow, could we self-host some services?"

**SRE:** "Self-hosting costs time, not money. We don't have time."

**PM:** "Document the 'break glass' option but don't act on it."

**Decisions:**
- ✅ Document self-hosting options
- ✅ Don't self-host unless costs >$500/month
- ✅ Evaluate annually

---

### Iteration 70: Sponsorship Model

**PM:** "If we grow, how do we fund this? Donations? Sponsors?"

**SE:** "GitHub Sponsors, Ko-fi, or 'Pro' features."

**SecEng:** "Pro features should not compromise security of free tier."

**PM:** "Agreed. Start with GitHub Sponsors."

**Decisions:**
- ✅ Enable GitHub Sponsors
- ✅ No paywalled security features
- ✅ Pro features: cosmetic only (themes, etc.)

---

## Phase 8: Future-Proofing (Iterations 71-80)

### Iteration 71: API Evolution

**SE:** "As we add features, the API will grow. How do we avoid breaking changes?"

**SRE:** "API versioning is in place. Stick to it."

**SE:** "And OpenAPI spec for documentation."

**Decisions:**
- ✅ OpenAPI specification
- ✅ Generated TypeScript client
- ✅ Breaking changes require version bump

---

### Iteration 72: Database Migrations Strategy

**SE:** "We need a migration tool. Supabase has CLI migrations."

**SRE:** "Run migrations in CI. Manual migrations are error-prone."

**SecEng:** "Migrations should be reviewed for security implications."

**Decisions:**
- ✅ Supabase CLI migrations
- ✅ CI-driven migration execution
- ✅ Security review for schema changes

---

### Iteration 73: Plugin Architecture

**PM:** "Could we support third-party integrations? Weather APIs, IoT sensors?"

**SE:** "Plugin architecture is complex. We'd need a stable API, sandboxing..."

**PM:** "Defer, but design with extensibility in mind."

**Decisions:**
- ✅ Design for extensibility
- ✅ No plugins V1
- ✅ Evaluate for Phase 5

---

### Iteration 74: Data Portability

**PM:** "Users should be able to export everything and leave."

**SE:** "Already have JSON export. Add CSV for spreadsheet users."

**SecEng:** "Export should require re-authentication."

**Decisions:**
- ✅ JSON and CSV export
- ✅ Re-auth required for full export
- ✅ Import from other garden apps (research)

---

### Iteration 75: AI Provider Flexibility

**SE:** "We're locked to OpenAI. What if they raise prices or deprecate models?"

**PM:** "Users are bringing their own keys, so they choose."

**SE:** "But we could support multiple providers: Anthropic, local Ollama."

**SecEng:** "Each provider has different security characteristics."

**Decisions:**
- ✅ Abstract AI provider interface
- ✅ OpenAI default
- ✅ Anthropic support Phase 4

---

### Iteration 76: Mobile App Evaluation

**PM:** "Should we build native iOS/Android apps?"

**SE:** "PWA should suffice. Native adds two more platforms to maintain."

**SRE:** "App store review processes slow us down."

**PM:** "Revisit if PWA limitations become blockers."

**Decisions:**
- ✅ Stick with PWA
- ✅ No native apps V1
- ✅ Evaluate React Native if needed

---

### Iteration 77: IoT Integration

**PM:** "Smart garden sensors are popular. Integrate with soil moisture, weather stations?"

**SE:** "Scope creep. But we can design data model to accept sensor readings."

**SecEng:** "IoT devices are security nightmares."

**PM:** "Noted. Phase 5 or never."

**Decisions:**
- ✅ Data model supports external readings
- ✅ No IoT integration V1
- ✅ Security review required before any IoT

---

### Iteration 78: Machine Learning Features

**PM:** "Can we predict pest outbreaks? Optimal planting times?"

**SE:** "Needs data. We'd have to collect anonymized user data."

**SecEng:** "Privacy implications. Needs explicit consent."

**PM:** "Table for now. Interesting for future."

**Decisions:**
- ✅ No ML features V1
- ✅ Consider anonymized data collection (opt-in)
- ✅ Research phase for ML roadmap

---

### Iteration 79: Multi-Tenancy

**PM:** "What if a community garden wants a shared instance?"

**SE:** "Multi-tenancy is hard. Separate Supabase projects? Shared with RLS?"

**SRE:** "Shared with RLS. One codebase, one database."

**SecEng:** "RLS must be bulletproof. One bug = data leak across tenants."

**Decisions:**
- ✅ Single-tenant V1
- ✅ Multi-tenancy via RLS for communities (Phase 4)
- ✅ Penetration testing required

---

### Iteration 80: Long-Term Maintainability

**SE:** "Who maintains this in 5 years?"

**PM:** "Open source community, hopefully."

**SE:** "We need: comprehensive docs, contributor guide, architectural decision records."

**SRE:** "And runbooks that don't assume context."

**Decisions:**
- ✅ Comprehensive documentation
- ✅ CONTRIBUTING.md guide
- ✅ ADRs for all major decisions

---

## Phase 9: Edge Cases & Failure Modes (Iterations 81-90)

### Iteration 81: Data Corruption Handling

**SE:** "What if localStorage gets corrupted? Invalid JSON?"

**SRE:** "We've seen this. Users report 'app won't load'."

**SE:** "Implement: detect corruption, backup to IndexedDB, offer reset option."

**Decisions:**
- ✅ Corruption detection on load
- ✅ Automatic backup before risky operations
- ✅ "Reset to last known good" option

---

### Iteration 82: Network Partitions

**SRE:** "User has WiFi but DNS fails. Or CORS errors. How do we handle?"

**SE:** "Specific error messages. 'Network issue' is not helpful."

**PM:** "Retry with backoff?"

**SE:** "Yes. Exponential backoff, max 5 retries."

**Decisions:**
- ✅ Specific network error messages
- ✅ Exponential backoff retry
- ✅ Manual retry button

---

### Iteration 83: Browser Compatibility

**SRE:** "We target evergreen browsers. What about old Safari?"

**SE:** "Safari 14+ for Service Workers. That's iOS 14+."

**PM:** "What's our cutoff?"

**SE:** "2 years of browser versions. Polyfill where possible."

**Decisions:**
- ✅ Evergreen browsers + 2 year lookback
- ✅ Safari 14+, Chrome 90+, Firefox 90+
- ✅ Polyfills for older browsers where possible

---

### Iteration 84: Quota Exceeded

**SRE:** "What if user's localStorage is full? Or Supabase quota hit?"

**SE:** "localStorage full: clear old data, warn user. Supabase quota: queue changes, alert us."

**PM:** "User shouldn't lose data."

**Decisions:**
- ✅ localStorage cleanup for old data
- ✅ Supabase quota: queue + alert
- ✅ No silent data loss

---

### Iteration 85: Time Zone Issues

**SE:** "We store dates. Users travel between time zones."

**PM:** "Garden plans don't really care about time zones. Dates are dates."

**SE:** "Store as ISO 8601 without time. 'Plant on 2024-03-15', not a timestamp."

**Decisions:**
- ✅ Date-only storage (no time component)
- ✅ ISO 8601 format
- ✅ Display in local format

---

### Iteration 86: Large Data Sets

**PM:** "What if someone has 100 plans with 1000 cells each?"

**SE:** "100,000 cells. That's a lot."

**SRE:** "Virtual scrolling for lists. Pagination for API requests."

**SE:** "And warnings: 'Large garden detected, performance may be impacted'."

**Decisions:**
- ✅ Virtual scrolling for large lists
- ✅ Pagination (50 items default)
- ✅ Performance warnings for large data

---

### Iteration 87: Concurrent Tab Editing

**SE:** "User opens two tabs, edits in both. What happens?"

**SRE:** "localStorage is shared. Tabs will overwrite each other."

**SE:** "BroadcastChannel API to sync between tabs."

**SecEng:** "Ensure no sensitive data broadcast."

**Decisions:**
- ✅ BroadcastChannel for cross-tab sync
- ✅ Last-write-wins for conflicts
- ✅ No sensitive data in broadcasts

---

### Iteration 88: Service Worker Update Failures

**SRE:** "Service Worker update fails mid-download. User stuck on old version."

**SE:** "`skipWaiting()` + `clients.claim()` for immediate activation."

**SRE:** "What if that fails?"

**SE:** "Fallback: 'Hard refresh' instructions after 3 failed updates."

**Decisions:**
- ✅ Aggressive Service Worker updates
- ✅ Fallback instructions for stuck users
- ✅ Update success tracking

---

### Iteration 89: Account Recovery

**SecEng:** "User loses access to email. How do they recover account?"

**PM:** "Magic links require email access."

**SecEng:** "We could add: backup codes, recovery email, or just... no recovery."

**PM:** "Start with no recovery. Data is on device anyway."

**Decisions:**
- ✅ No account recovery V1
- ✅ Local data survives account loss
- ✅ Backup codes for Phase 3

---

### Iteration 90: Malicious Input

**SecEng:** "What if someone puts JavaScript in a vegetable name?"

**SE:** "React escapes by default. Markdown renderer sanitizes."

**SecEng:** "Test it. XSS in user-generated content is common."

**SE:** "Added to security test suite."

**Decisions:**
- ✅ XSS testing for all user input fields
- ✅ CSP as additional defense
- ✅ Quarterly security audit

---

## Phase 10: Final Consensus (Iterations 91-100)

### Iteration 91: Priority Stack Ranking

**PM:** "Let's rank everything. What's P0?"

**SE:** "Data integrity, security, performance."

**SRE:** "Observability, reliability."

**SecEng:** "RLS, encryption, CSRF."

**PM:** "Launch-blocking: security + data integrity + basic observability."

**Decisions:**
- ✅ P0: Security fundamentals
- ✅ P0: Data integrity
- ✅ P0: Basic observability

---

### Iteration 92: Launch Checklist

**PM:** "What must be done before public launch?"

All agree:
1. RLS policies implemented and tested
2. CSRF protection on API
3. Sentry error tracking
4. Core Web Vitals green
5. 5 critical E2E tests passing
6. Privacy policy published
7. Security self-assessment complete

**Decisions:**
- ✅ 7-item launch checklist
- ✅ No exceptions

---

### Iteration 93: Post-Launch Priorities

**PM:** "Week 1 after launch. What do we focus on?"

**SRE:** "Monitoring. We'll learn more in day 1 than 6 months of planning."

**SE:** "Bug fixes. There will be bugs."

**SecEng:** "Watch for security incidents."

**Decisions:**
- ✅ Week 1: Monitoring + bug fixes
- ✅ No new features week 1
- ✅ Security watch

---

### Iteration 94: Communication Plan

**PM:** "How do we communicate with users?"

**SE:** "GitHub Discussions for community. Status page for incidents."

**PM:** "Email newsletter for updates?"

**SecEng:** "Don't collect emails unless necessary."

**Decisions:**
- ✅ GitHub Discussions
- ✅ Status page
- ✅ Optional newsletter (explicit opt-in)

---

### Iteration 95: Success Metrics

**PM:** "How do we know we've succeeded?"

All agree:
- 1,000 monthly active users
- <1% error rate
- 99% uptime
- Positive community sentiment
- No security incidents

**Decisions:**
- ✅ 5 success metrics defined
- ✅ Monthly review
- ✅ Adjust targets as we learn

---

### Iteration 96: Team Responsibilities

**PM:** "Who owns what?"

- SE: Code quality, architecture, features
- SRE: Infrastructure, monitoring, reliability
- SecEng: Security reviews, incident response
- PM: Roadmap, user feedback, communication

**Decisions:**
- ✅ Clear ownership
- ✅ Documented in OWNERS.md

---

### Iteration 97: Knowledge Transfer

**SE:** "What if someone leaves? Bus factor of 1 on some systems."

**PM:** "Documentation is key. Also: pair programming, code reviews."

**SRE:** "Record video walkthroughs of complex systems."

**Decisions:**
- ✅ Documentation for all systems
- ✅ Pair programming encouraged
- ✅ Video walkthroughs for infra

---

### Iteration 98: Continuous Improvement

**PM:** "How do we keep improving post-launch?"

**SE:** "Monthly retrospectives. Quarterly roadmap planning."

**SRE:** "Weekly metrics review."

**SecEng:** "Quarterly security audit."

**Decisions:**
- ✅ Monthly retros
- ✅ Quarterly roadmap
- ✅ Weekly metrics
- ✅ Quarterly security

---

### Iteration 99: Risk Register

**SecEng:** "Let's document our top risks."

1. **Supabase outage**: Medium likelihood, high impact. Mitigation: offline mode.
2. **Data breach**: Low likelihood, critical impact. Mitigation: RLS, encryption, audits.
3. **Key contributor leaves**: Medium likelihood, high impact. Mitigation: documentation.
4. **Cost overrun**: Low likelihood, medium impact. Mitigation: monitoring, alerts.
5. **Security vulnerability**: Medium likelihood, high impact. Mitigation: audits, updates.

**Decisions:**
- ✅ 5-item risk register
- ✅ Quarterly review
- ✅ Mitigation owners assigned

---

### Iteration 100: Final Architecture Sign-Off

**All agree on final architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (PWA)                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Jotai     │  │   Service   │  │   Web Crypto API        │  │
│  │   Store     │  │   Worker    │  │   (Key Encryption)      │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌───────────▼─────────────┐  │
│  │ localStorage │  │   Cache    │  │   IndexedDB (backup)    │  │
│  │  (primary)   │  │  (assets)  │  │                         │  │
│  └──────────────┘  └────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (sync when online)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL (Edge + Functions)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Next.js   │  │    Edge     │  │      Node.js            │  │
│  │   App       │  │  Functions  │  │      Functions          │  │
│  │   Router    │  │  (static)   │  │      (AI proxy)         │  │
│  └─────────────┘  └─────────────┘  └────────────┬────────────┘  │
└─────────────────────────────────────────────────┼───────────────┘
                              │                   │
                              │                   │
                              ▼                   ▼
┌─────────────────────────────────────────┐  ┌──────────────────┐
│              SUPABASE                    │  │     OPENAI       │
├─────────────────────────────────────────┤  │     (BYOK)       │
│  ┌─────────────┐  ┌─────────────┐       │  └──────────────────┘
│  │  PostgreSQL │  │    Auth     │       │
│  │  (RLS)      │  │ (Magic Link)│       │
│  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────┘
```

**Final Decisions (Summary):**

| Category | Decision | Status |
|----------|----------|--------|
| State Management | Jotai | ✅ Approved |
| Backend | Supabase | ✅ Approved |
| Auth | Magic Link | ✅ Approved |
| Sync Strategy | Local-First, LWW | ✅ Approved (OT for Phase 4) |
| API Keys | BYOK, Web Crypto encrypted | ✅ Approved |
| PWA | Yes, with versioned SW | ✅ Approved |
| Monitoring | Sentry + Vercel + Grafana | ✅ Approved |
| Security | CSP, RLS, CSRF protection | ✅ Approved |
| Accessibility | WCAG 2.1 AA | ✅ Approved |
| Testing | 80% coverage, E2E critical flows | ✅ Approved |

---

## Appendix A: Complete ADR List

| ADR | Title | Status |
|-----|-------|--------|
| 001 | Next.js App Router | Keep |
| 002 | Data Persistence | Superseded by 012 |
| 003 | Tailwind CSS | Keep |
| 004 | No Database | Superseded by 012 |
| 005 | AI Integration | Keep |
| 006 | TypeScript Organization | Keep |
| 007 | Feature-Based Components | Keep |
| 008 | Playwright E2E | Keep |
| 009 | Client-Side State | Superseded by 013 |
| 010 | Static Content Pages | Keep |
| 011 | Client-Side Image Optimization | New |
| 012 | Local-First + Supabase Sync | New |
| 013 | Jotai State Management | New |
| 014 | PWA Architecture | New |
| 015 | BYOK Key Encryption | New |
| 016 | API Versioning Strategy | New |
| 017 | Content Security Policy | New |
| 018 | Rate Limiting | New |
| 019 | Error Handling Taxonomy | New |
| 020 | Feature Flags | New |

---

## Appendix B: 12-Month Roadmap

| Month | Phase | Key Deliverables |
|-------|-------|------------------|
| 1-2 | Hardening | Jotai migration, TypeScript strict, Sentry, CSRF, unit tests, Export as Image |
| 3-4 | Mobile | PWA, touch UI, a11y WCAG AA, image compression, dark mode |
| 5-6 | Connected | Supabase setup, RLS, auth, sync engine, migration runbook |
| 7-8 | Polish | Performance optimization, load testing, pentesting, launch prep |
| 9 | Launch | Public launch, monitoring, bug fixes |
| 10-12 | Community | Multi-user gardens, templates, i18n (Spanish, French) |

---

## Appendix C: Security Controls Summary

| Control | Implementation | Owner |
|---------|----------------|-------|
| Authentication | Supabase Magic Link | SE |
| Authorization | PostgreSQL RLS | SecEng |
| Data Encryption (transit) | HTTPS everywhere | SRE |
| Data Encryption (rest) | Supabase managed | SRE |
| Key Encryption (BYOK) | Web Crypto AES-GCM | SecEng |
| XSS Prevention | React escaping + CSP | SE |
| CSRF Prevention | Origin validation | SE |
| Rate Limiting | 10 req/min sliding window | SRE |
| Dependency Security | Dependabot + npm audit | SE |
| Logging | Audit log via pg_audit | SRE |
| Incident Response | Documented playbook | SecEng |

---

*Document generated from 100-iteration cross-functional debate simulation.*
*Last updated: December 2024*





