# Current Plan

Last updated: 2026-02-09

## What's Been Completed

### Pre-Production Infrastructure (Phases 0-5)

All foundational phases are done: foundation fixes, security hardening (CSP, input validation), observability (Sentry, structured logging, health check, web vitals), PWA (installable, service worker caching), accessibility (keyboard nav, ARIA, screen reader support), and mobile UX (touch targets, bottom sheets, reduced motion, install prompt).

### Product Roadmap Phase 1: Simplified Launch

3-screen onboarding wizard implemented. All features (AI Advisor, Compost, Allotment Layout) are directly accessible in the navigation. Local analytics tracking added. Progressive disclosure was previously implemented but removed as it was confusing and interfered with e2e tests.

### AI Tool Calling

Aitor can propose and execute garden modifications (add/update/remove plantings) with user confirmation. Plant disambiguation, area name resolution, and batch operations all working.

### Data Sharing

P2P sync was attempted, then replaced with a simpler share/receive flow using Upstash Redis (QR code + 6-character code, 5-minute expiry).

### Code Quality and UX Polish

Storage service and useAllotment hook refactored into smaller modules. Legacy dead code removed. Components migrated to lightweight vegetable index for performance. Mobile-first allotment redesign. PlantingDetailDialog refactored into tabbed interface. Global Aitor chat modal accessible from any page. Seed status bugs fixed. Stale data race conditions fixed.

### UX Review: High-Priority Fixes (PR #151)

Systematic section-by-section UX review identified high-priority issues, now fixed: DataManagement (export/import/backup) added to the Settings page where users naturally look for it. Progressive disclosure issues (UnlockCelebration, CompostAlerts gating) are no longer relevant as progressive disclosure was removed.

### UX and Plant Data Improvements (PR #153)

Medium-priority UX fixes: Add Area button on desktop no longer requires edit mode, Seeds year picker positioned at bottom on mobile. Plant data normalization: fixed Alliums bug (VAGUE_REFERENCES blocked CATEGORY_EXPANSIONS), added semantic mappings for parenthetical names (Broccoli, Chard, Squash, Courgette, etc.), updated category expansions to use actual database names, enabled Three Sisters tests.

### UX Polish Batch (PR #167)

Settings page restructured into tabbed interface (AI & Location, Data, Help). Plot overview toolbar simplified with clear unlock/lock toggle and inline Add Area. This Month view merges trees and perennials into a single unified section within "Your Garden". Tours no longer auto-start; user must initiate from help button. Dead SaveIndicator component removed. Documentation cleaned up: version references updated (Next.js 16, schema v16), project naming corrected, obsolete progressive disclosure content trimmed from roadmap doc, dead document links marked, pre-production checklist updated.

### Personalised Planting Dates in This Month (PR #169)

This Month page now uses actual planting dates instead of static database windows. The UnifiedCalendar shows personalised sow/harvest months at full opacity with generic fallback at 50%. "Your Garden" section restructured from stats row and flat list into task-oriented categories: Harvest now, Sow this month, and Growing, each showing contextual date info. Also fixed a flaky onboarding E2E test.

### UX Accessibility Improvements (PR #171)

Aria-label added to main navigation for screen readers. About page CTA links given descriptive aria-labels. Compost empty state improved with better explanatory copy and accessible button. API key input in Settings no longer blocks keyboard typing (was paste-only), placeholder changed to show expected format.

### Plant Data: Botanical Names and External References (PR #172)

Added `wikipediaUrl` optional field to Vegetable type. Populated `botanicalName` (Latin binomial) for 59 plant entries covering roots, greens, brassicas, legumes, solanaceae, cucurbits, alliums, herbs, berries, and fruit trees. RHS URLs were already populated (56 entries) from prior work.

---

## Next Steps

### Step 2: Section-by-Section UX Review

The product roadmap (`docs/research/product-roadmap-quick-reference.md`) identifies this as the next milestone before adding more complexity. The goal is to ship a polished, coherent experience. That document contains a detailed breakdown of each section's components and the questions to answer during review.

Sections to review: Today (Dashboard), This Month (Calendar), Seeds (Inventory), Allotment (Layout & Plantings), Compost, AI Advisor, Settings, Shared UI Components, Navigation, About.

After individual section reviews, cross-section integration should be tested via user journeys like "Plan a new bed", "Track a harvest", "Check what to do", "Add seeds I bought", "Share with family", "Ask for help".

An initial systematic review has been completed (PRs #151, #153, #169, #171) covering all sections. High and medium-priority issues are fixed including This Month calendar hierarchy, accessibility gaps, and settings usability.

### Plant Data Validation (Parallel Track)

Scottish outdoor plant validation is complete. Companion name normalization is done (PR #153). External reference links largely done: 56 RHS URLs and 59 botanical names populated, `wikipediaUrl` type added. Remaining work documented in `docs/research/plant-data-validation-strategy.md`:

- Companion data enhancement with confidence levels and mechanism types
- Crop rotation alignment with RHS guidance
- Wikipedia URL population for plant entries

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
