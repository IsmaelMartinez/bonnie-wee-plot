# Current Plan

Last updated: 2026-02-04

## What's Been Completed

### Pre-Production Infrastructure (Phases 0-5)

All foundational phases are done: foundation fixes, security hardening (CSP, input validation), observability (Sentry, structured logging, health check, web vitals), PWA (installable, service worker caching), accessibility (keyboard nav, ARIA, screen reader support), and mobile UX (touch targets, bottom sheets, reduced motion, install prompt).

### Product Roadmap Phase 1: Simplified Launch

Progressive disclosure system with feature gating (`src/lib/feature-flags.ts`), engagement-based unlocks, unlock celebration modals, and the 3-screen onboarding wizard are all implemented. Navigation simplified to 3 core items with AI Advisor, Compost, and Allotment Layout hidden behind unlock conditions. Local analytics tracking added.

### AI Tool Calling

Aitor can propose and execute garden modifications (add/update/remove plantings) with user confirmation. Plant disambiguation, area name resolution, and batch operations all working.

### Data Sharing

P2P sync was attempted, then replaced with a simpler share/receive flow using Upstash Redis (QR code + 6-character code, 5-minute expiry).

### Code Quality and UX Polish

Storage service and useAllotment hook refactored into smaller modules. Legacy dead code removed. Components migrated to lightweight vegetable index for performance. Mobile-first allotment redesign. PlantingDetailDialog refactored into tabbed interface. Global Aitor chat modal accessible from any page. Seed status bugs fixed. Stale data race conditions fixed.

---

## Next Steps

### Step 2: Section-by-Section UX Review

The product roadmap (`docs/research/product-roadmap-quick-reference.md`) identifies this as the next milestone before adding more complexity. The goal is to ship a polished, coherent experience. That document contains a detailed breakdown of each section's components and the questions to answer during review.

Sections to review: Today (Dashboard), This Month (Calendar), Seeds (Inventory), Allotment (Layout & Plantings), Compost, AI Advisor, Settings, Shared UI Components, Navigation, About.

After individual section reviews, cross-section integration should be tested via user journeys like "Plan a new bed", "Track a harvest", "Check what to do", "Add seeds I bought", "Share with family", "Ask for help".

Some UX work has already been done organically (mobile-first allotment redesign, planting dialog tabs, global AI chat, seed status fixes), but a systematic review hasn't happened yet.

### Plant Data Validation (Parallel Track)

Scottish outdoor plant validation is complete. Remaining work documented in `docs/research/plant-data-validation-strategy.md`:

- Companion data name normalization (plural-to-singular, semantic mapping)
- External reference links (RHS URLs, Wikipedia, botanical names)
- Companion data enhancement with confidence levels and mechanism types
- Crop rotation alignment with RHS guidance

### Future Phases (Contingent on User Adoption)

These are from the pre-production strategic plan (`docs/research/pre-production-strategic-plan.md`), phases 6-8:

- Phase 6: Authentication (Clerk) - user accounts, session management, API route protection
- Phase 7: Database (Supabase) - cloud persistence, localStorage-to-cloud migration, GDPR compliance
- Phase 8: Multi-Provider AI - Gemini support, server-side free tier after auth

Product roadmap phases 2-4 (Feature Discovery, Power Users, Community & Scale) are also contingent on Phase 1 metrics and user feedback.

---

## Key References

- `docs/research/product-roadmap-quick-reference.md` - Product strategy, unlock conditions, UX review checklist
- `docs/research/pre-production-strategic-plan.md` - Infrastructure phases (0-5 done), future phases 6-8
- `docs/research/plant-data-validation-strategy.md` - Plant database improvement plan
