# Current Plan

Last updated: 2026-02-10 (Ready for user testing)

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

### Crop Rotation Alignment with RHS Guidance (PR #174)

Aligned `ROTATION_GROUPS` mapping and `ROTATION_ORDER` in `rotation.ts` with RHS four-year rotation guidance. Moved potatoes to solanaceae rotation group, extended rotation cycle from 3-year to 4-year (legumes → brassicas → solanaceae → roots). Reclassified leafy-greens and other categories as permanent (flexible, no rotation needed). Moved radish/swede/turnip into brassicas family per RHS.

### Wikipedia URLs for All Plants (PR #175)

Populated `wikipediaUrl` for all 192 plant entries in the vegetable database using species-level Wikipedia URLs.

### Companion Data Gaps (PR #176)

Added `enhancedAvoid` entries to 15 plants (brassicas avoiding potato, cucurbits avoiding potato, herbs avoiding fennel, berries cross-avoidance, apple-tree avoiding potato) and `enhancedCompanions` to 2 plants (ice-plant, horseradish). Bidirectional flags aligned with existing reverse entries for data consistency.

### Companion Planting Migration (PR #178)

Completed migration from legacy string-based companion system to ID-based enhanced arrays. Removed `companionPlants` and `avoidPlants` string arrays from all 192 plant entries in the database. Deleted entire `companion-normalization.ts` module (95 lines). Refactored `companion-validation.ts` to use direct ID lookups on `enhancedCompanions` and `enhancedAvoid` arrays, simplifying from 270 to 195 lines. Made enhanced arrays required fields in the Vegetable type. Added runner-beans to sweetcorn for proper Three Sisters bidirectional relationship. Net reduction of 450 lines across the codebase with cleaner, more maintainable code.

### Integration and UX Fixes (PRs #180-188)

Comprehensive audit of cross-section integration and low-priority UX improvements identified and fixed critical issues and polish opportunities:

**PR #180 - Harvest Date Calculation (Critical Fix):** Fixed missing harvest date calculation when adding plantings manually or via AI. Implemented automatic calculation using `populateExpectedHarvest()` in AddPlantingForm, AI tool executor, and PlantingDetailDialog. Made function generic to handle both Planting and NewPlanting types. Added date recalculation when sowDate or sowMethod changes. All 737 unit tests pass.

**PR #181 - Cross-Section Navigation Links:** Added seamless navigation between related sections. Allotment page links to Seeds, Seeds page has back button, This Month "Harvest now" items link directly to specific plantings in Allotment with query parameter handling for deep linking. Improves discoverability and reduces friction in common workflows.

**PR #182 - Share/Import Data Validation:** Added data validation before sharing and after receiving data via QR codes. Uses existing `validateAllotmentData()` function to prevent corrupted data from being shared or imported. Shows validation errors with option to cancel import.

**PR #183 - Loading States and Feedback:** Added loading indicators and success feedback for async operations. ShareDialog shows spinner while generating QR codes, DataManagement displays "Exported successfully!" message that auto-dismisses after 3 seconds, ChatInput displays validation errors below upload button. Improved memory leak handling with proper useEffect cleanup for setTimeout.

**PR #184 - Color Consistency to Zen Design System:** Standardized all colors across 33 files to use Zen design system. Replaced hardcoded Tailwind colors (red→zen-kitsune, amber→zen-bamboo, blue→zen-water, emerald→zen-moss). Fixed flaky E2E test in onboarding spec by adding specific dialog selectors and proper timeout for debounced save operations. All tests now stable with 100% pass rate.

**PR #185 - Button Touch Targets for Accessibility:** Standardized all action buttons to minimum 44x44px for mobile accessibility. Updated 6 components (AnalyticsViewer, PlantCombobox, SeasonStatusWidget, CareLogSection, UnderplantingsList, HarvestTracker) with consistent `min-h-[44px]` styling. Applied Zen design system border radius (`rounded-zen`) throughout.

**PR #186 - Seed Status Integration:** Connected seed inventory to planting recommendations. This Month page now prioritizes varieties with available seeds in "Sow this month" section using optimized Set-based lookup (O(1) performance). AddPlantingForm shows seed availability indicators in variety dropdown with contextual links to Seeds page. Added "Manage seed inventory" links throughout UI.

**PR #188 - Disabled State Indicators:** Enhanced disabled button styling across 14 components for WCAG AA accessibility compliance. Added `disabled:bg-gray-400` for primary buttons, `disabled:bg-gray-300` for secondary, and `disabled:text-gray-400` for text-only buttons. Stronger visual distinction for vision-impaired users beyond the previous `disabled:opacity-50` alone.

---

## Current Status: Ready for User Testing

All planned development work is complete. The app now includes:

- Complete pre-production infrastructure (phases 0-5)
- Product Roadmap Phase 1: Simplified Launch with onboarding, AI tool calling, and data sharing
- Comprehensive UX review and polish (PRs #151, #153, #167, #169, #171, #180-188)
- Complete plant data validation with external references and RHS-aligned crop rotation
- Cross-section integration with seamless navigation between related features
- Full accessibility compliance (keyboard nav, ARIA, screen reader support, WCAG AA)
- Mobile-first responsive design with proper touch targets

The next phase is real-world usage to identify what works well and what needs improvement. Future development will be driven by actual usage patterns and user feedback rather than speculative planning.

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
