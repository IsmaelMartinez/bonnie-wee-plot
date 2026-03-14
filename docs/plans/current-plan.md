# Current Plan

Last updated: 2026-03-06

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

### Dependency Management and ESLint Modernisation (PR #199)

Updated all npm dependencies within semver ranges and bumped `eslint-config-next` to v16, `lucide-react` to 0.574, `@types/node` to v25, and `jsdom` to v28. Migrated `eslint.config.mjs` to native flat config (removed `FlatCompat` shim and `@eslint/eslintrc`), added `eslint-config-next/typescript` config. React Compiler rules from react-hooks v7 disabled for now (TODO: address incrementally). Replaced custom `update-deps.yml` GitHub Actions workflow with Renovate bot (`renovate.json`) configured with 10 logical dependency groups and auto-merge for dev dependency minor/patch updates.

### Share Infrastructure Fix (PR #TBD)

Previous Upstash Redis instance was evicted due to 30-day free tier inactivity. Replaced with new instance and updated Vercel env vars. Added Redis keep-alive ping to `/api/health` endpoint — any uptime monitor hitting this endpoint will prevent future inactivity eviction. Also fixed CSP blocking `api.bigdatacloud.net` for reverse geocoding. This is a temporary measure; share storage will move to a proper database when phases 6-7 are implemented.

### Tech Debt Sprint (March 2026)

Parallel execution of tech debt and improvements to prepare for the database migration (phases 6-7). All tasks structured to make the future Supabase migration easier.

**Task A: Split `allotment-storage.ts`** (3,458 lines → ~8 modules)
Split into: storage-core (load/save/clear), storage-validation, storage-migrations (largest, ~800 lines), season-operations, planting-operations (includes garden events), area-queries (includes legacy compat wrappers), variety-operations, area-mutations (CRUD + care logs + temporal filtering). Also includes custom-task-operations and maintenance-task-operations. Re-export everything from a barrel `index.ts` for backward compatibility. Structure modules so each maps to a future database service layer.

**Task B: Compost data integration into AllotmentData**
Move compost from separate `compost-data` localStorage key into `AllotmentData.compost`. Schema migration v17 reads old key and merges. Update `useCompost` to work through `useAllotment`. Fixes the gap where QR share silently excluded compost data. Remove separate `compost-storage.ts` service once migrated.

**Task C: Vegetable database restructuring**
Split `vegetable-database.ts` (6,716 lines) into per-category data files under `src/lib/vegetables/data/`. Fix synchronous imports in `rotation.ts`, `companion-validation.ts`, `planting-utils.ts`, `task-generator.ts`, and `ai-tool-executor.ts` to use the async loader. Move helper functions into `vegetable-loader.ts`. This makes the data DB-ready (each category file maps to a future database query).

**Task D: Replace `window.__disablePersistenceUntilReload`**
Create `src/lib/persistence-signal.ts` with a `usePersistenceSignal()` hook using a module-scoped ref. Update `usePersistedStorage.ts` to check the hook instead of `window`. Update the two write sites (`useDataTransfer.ts`, `receive/[code]/page.tsx`).

**Task E: Add bundle analysis**
Add `@next/bundle-analyzer` as dev dependency. Configure in `next.config.mjs` (outermost wrapper, enabled via `ANALYZE=true`). Add `npm run analyze` script.

### Perennial Care Tips Spike (PR #215)

Added lifecycle-aware seasonal care tips for perennial plants. Extended the `Vegetable` type with a `careTips` array where each tip is tagged with months, an optional lifecycle stage (establishing/productive/declining), and a category (care/harvest/propagate/protect/plant). The task generator reads these alongside existing maintenance data and emits them as care-tip tasks on the Today dashboard. Stage filtering uses `calculatePerennialStatus` so a first-year raspberry gets different advice from an established one. Initial data covers 4 plants: raspberry, strawberry, rhubarb, and apple tree (6 tips each). See ADR 025.

### Test Coverage Thresholds (PR #216)

Added Vitest coverage thresholds: 64% statements, 54% branches, 55% functions, 65% lines. Expanded exclusion list for coverage reporting. Uses `@vitest/coverage-v8`.

### Offline Messaging Improvements (PR #217)

Extended `useNetworkStatus` hook with `justReconnected` state that shows a green "back online" banner for 3 seconds after reconnecting. Fixed animation classes to use existing `animate-fade-in` from globals.css instead of missing `tailwindcss-animate` classes. Updated offline copy to "your data is saved locally and safe". Added unit tests for both the hook and `OfflineIndicator` component.

### Plant Info Pages (PR #218)

Created `/plants` index page with search and category filtering using the lightweight vegetable index. Created `/plants/[id]` detail pages (statically generated at build time for all 192+ plants) showing planting calendar, care requirements, perennial lifecycle info, maintenance schedule, seasonal care tips, companion planting with cross-links, and external links to RHS and Wikipedia. Added "Plant Guide" link to the secondary navigation dropdown.

### Component Unit Tests (PR #219)

Added 67 component unit tests across 3 new test files: `TaskList.test.tsx` (29 tests covering generated tasks, custom tasks, dismiss/restore, add-task input, maintenance tasks, completed section), `AddPlantingForm.test.tsx` (19 tests covering plant selection, form submission, variety auto-selection, sow methods, add-another flow), and `AddAreaForm.test.tsx` (19 tests covering area types, conditional fields, duplicate detection, infrastructure defaults, temporal metadata).

### Authentication & Cloud Persistence (Phases 6-7, PR #221)

Implemented opt-in Clerk authentication and Supabase cloud persistence as a single body of work. Anonymous users keep localStorage only; signed-in users get continuous bidirectional sync with last-write-wins conflict resolution on `meta.updatedAt`. All existing pages remain public — auth is opt-in for cloud sync across devices.

Key additions: `useSyncedStorage` hook wrapping `usePersistedStorage` with cloud sync layer, Supabase client module with RLS via Clerk JWT, GDPR-compliant data export and account deletion endpoints, sign-in/sign-up pages, navigation auth UI with sync status indicator, Settings Account tab, and sign-in prompt on Today dashboard. 851 unit tests pass, build succeeds without env vars (graceful degradation), all E2E tests pass.
### Post-Auth Fixes (PRs #222-228)

Addressed review comments across PRs #206-219 (PR #222). Hid auth UI when Clerk is not configured for graceful degradation (PR #223). Enabled Clerk keyless mode for zero-config auth (PR #224). Fixed CSP rules for Clerk CAPTCHA and workers (PR #226). Comprehensive codebase review improvements (PR #227). Added guided tours to all 8 pages, fixed Supabase auth token bug (`getToken` missing `{ template: 'supabase' }`), and wrote ADR 026 documenting the tour architecture (PR #228).

---

## Current Phase: Page-by-Page Review for First Release

Before sharing with testers, review every user-facing page to decide whether each page should be kept as-is, simplified, or hidden for the first release. The goal is a focused, polished experience — fewer pages done well beats many pages done partially.

For each page, evaluate: does a new user need this on day one? Is it polished enough? Does it add confusion or value? Could it be accessed from another page instead of having its own route?

### Pages Reviewed

1. `/` (Today Dashboard) — reviewed and polished (PR #229, #230). Clarified compost tour copy. Review improvements committed.
2. `/this-month` — reviewed and polished (PR #232). Fixed bed UUID display, replaced current-month banner with dot indicator, merged month selector with collapsible planting calendar (starts expanded, clickable month headers), removed redundant header, consolidated bottom sections into scrollable tip carousel, tour synced to 8 steps covering all sections.
3. `/seeds` — reviewed and polished (PR #235). Filter button changed from emoji to text label.
4. `/compost` — reviewed and polished (PR #238). Kept with simplifications: moved care tips to collapsible section at bottom, fixed empty state copy (removed C:N ratio reference), added reactivate button for applied piles, wired up PageTour with 3 data-tour attributes matching tour definition order.
5. `/about` — removed. Not needed for first release; onboarding wizard covers the same ground. Removed page, nav link, tour definition, and related E2E tests.
6. `/plants` — reviewed and polished. Keep for first release. Plant guide is now a useful working reference rather than a static encyclopaedia: difficulty filter, "my plants" filter, planted badges, and reusable summary dialog make it directly useful from planning flows.
7. `/plants/[id]` — reviewed and polished. Keep for first release. Detail pages are sufficiently rich and connected to the rest of the product via companion links, external references, and shared summary entry points from Seeds and Allotment.
8. `/sign-in` + `/sign-up` — reviewed. Keep as support routes, not core navigation destinations. They already redirect home when Clerk is unavailable, and sign-out should remain in the existing `UserButton` menu rather than becoming its own page.

9. `/settings` — reviewed and simplified. Removed analytics UI (Show Analytics, storage stats, clear analytics). Merged Account tab into Data tab: single Danger Zone with "Clear Local Data" and "Delete My Account" (cloud+local, only when signed in). Single export button works for both local and cloud users. Tour now navigates across tabs automatically via `onHighlightStarted` callbacks.
10. `/receive` + `/receive/[code]` — reviewed. Keep as-is, working correctly.
11. `/sign-in` + `/sign-up` — reviewed. Keep as support routes.

12. `/ai-advisor` — hidden for first release (PR #255). Chat modal, floating button, and receive/share-via-code UI all disconnected from navigation. Underlying code preserved for future re-enablement. Onboarding "ask" path removed, Quick Actions replaced "Ask Aitor" with "Plant Guide". Tests skipped rather than deleted.
13. `/allotment` — reviewed and simplified. Core workflow (add areas, record plantings, view details) kept intact. Hidden for first release: auto-rotate button and dialog, rotation count jargon (replaced with "beds not yet planted"), Short ID and Built-in-year fields in Add Area, care logs, and underplantings in permanent panels. All hidden via `src/config/release-visibility.ts` constants — flip to `true` to re-enable. Harvest tracking, rotation type dropdown, rotation guide banner, grid layout, notes, and cross-links all kept.

### Remaining Backlog

- Automatic backup prompts

### Future Phases (Contingent on User Adoption)

These are from the pre-production strategic plan (`docs/research/pre-production-strategic-plan.md`):

- Phase 8: Multi-Provider AI - Gemini support, server-side free tier after auth, pgvector for semantic search

Product roadmap phases 2-4 (Feature Discovery, Power Users, Community & Scale) are also contingent on Phase 1 metrics and user feedback.

---

## Key References

- `docs/research/repo-analysis-and-improvements.md` - Full codebase analysis with prioritised improvement opportunities
- `docs/research/product-roadmap-quick-reference.md` - Product strategy, UX review checklist (all steps complete)
- `docs/research/pre-production-strategic-plan.md` - Infrastructure phases (0-5 done), future phases 6-8
- `docs/research/plant-data-validation-strategy.md` - Plant database improvement plan
