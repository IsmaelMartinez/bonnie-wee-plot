# Current Plan

Last updated: 2026-05-19 (ADR 027 Yjs Step 3 Phase 1 cutover live — PR-A.2 wired cloud sync into the Yjs doc, PR-C flipped `USE_YJS_STORAGE` to default-on, the deployment-runbook `UPDATE allotments SET data = data` ran against production Supabase seeding pre-cutover history rows for both users; soak window now open, Step 5 cleanup is the next deliberate work)

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

### Post-Review Hardening (PRs #260–#290)

After the page-by-page review, a batch of smaller fixes and housekeeping work landed:

- **PR #260** Hid the rotation guide banner for the first release.
- **PR #261** Removed the Excel workbook and import scripts.
- **PR #262** Fixed duplicate sow tasks appearing across beds.
- **PRs #264, #265** Added the repo-butler consumer guide link to `CLAUDE.md` and community health files (`CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, issue and PR templates).
- **PRs #266, #279, #281** Resolved npm audit findings across direct and transitive dependencies, including the Vite GHSA-p9ff-h696-f583 advisory.
- **PR #267** Added `.github/dependabot.yml` as the single source of dependency automation (the earlier `renovate.json` was retired in favour of the GitHub-native tool).
- **PRs #268–#277, #290** Grouped dependency bumps (react, nextjs, sentry, serwist, playwright, vitest, type-definitions, upstash, etc.) plus removal of the deprecated `@types/react-grid-layout`.
- **PR #282** Removed the redundant Snyk workflow; the Snyk App handles security scanning.

### Tech Debt Cleanup (April 2026)

- Confirmed `renovate.json` is gone; Dependabot (`.github/dependabot.yml`) is the sole dependency automation.
- Retired `compost-storage.ts`: the pure mutation/query helpers live in `src/services/compost-operations.ts` and are now re-exported from the `allotment-storage` barrel. `useCompost` imports through the unified barrel and stale `compost-storage` comments were updated.

### Deferred Major Dependency Upgrades (2026-05-12)

Two Dependabot major-version PRs were closed without merging because their failures are not mechanical fixes. Both are dev-tooling bumps — neither affects runtime, neither is a security issue, and the current versions are still maintained.

ESLint 9 → 10 (PR #334, closed 2026-05-12). Blocked on upstream: `eslint-plugin-react` (pulled in transitively via `eslint-config-next`) still calls `context.getFilename()` which was removed in ESLint 10 in favour of `context.filename`. The lint job crashes with `TypeError: contextOrFilename.getFilename is not a function`. Revisit when `eslint-plugin-react` ships an ESLint-10-compatible release; the bump will be mechanical at that point. This is the higher priority of the two to track since the fix is a single dependency release, not work on our end.

Tailwind CSS 3 → 4 + TypeScript major bump (PR #313, closed 2026-05-12). Tailwind 4 is a different product wearing the same name — the PostCSS plugin renamed to `@tailwindcss/postcss`, configuration moved from `tailwind.config.js` into `@theme {}` blocks inside CSS, and some utility classes had semantic changes (default colour palette, opacity modifiers, the `screens` API). Migration is several hours of controlled work with visual-regression risk across every page. The TypeScript major bump bundled in the same PR is trivial in isolation (add `"ignoreDeprecations": "6.0"` to `tsconfig.json` or migrate `baseUrl` to `paths`), but Dependabot grouped them so neither could be merged independently. Revisit when there is appetite for an afternoon of Tailwind migration; the TS bump can be split out and landed separately at any time.

Both PRs left `.github/dependabot.yml` alone for now. If they get re-proposed and become noisy, the answer is to add `ignore` entries with `update-types: ["version-update:semver-major"]` for `eslint` and `tailwindcss` rather than closing them by hand every time.

### Remaining Backlog

(Empty — see "Backup Reminder" below for the previously-listed item, now shipped.)

### Research-Driven Improvements: Shipped

A round of research into adjacent gardening apps surfaced four small UI bets, all landed on `claude/analyze-vercro-app-A6inL`:

- **Today weather strip** (commit 76ff0ef) — 3-tile today/tomorrow/+1 forecast on the Today dashboard. Open-Meteo query extended with `weathercode` + temps; `RainfallSummary.forecast` carries the daily tiles; WMO codes mapped to lucide icons in `src/lib/weather/wmo-icons.ts`.
- **Crop progress strip** (commit a197ad4) — `<PlantingProgress>` rendered in `PlantingDetailDialog` showing sow → expected harvest window with actual harvest overlaid and a "today" line. Pure UI over existing `Planting` fields.
- **Boost this bed** (commit 2ba4c67) — companion suggestions in `BedDetailPanel` for rotation beds with at least one planting. Ranked by seed availability → confidence → name; click pre-fills the Add Planting dialog with the suggested variety. Logic in `src/lib/boost-suggestions.ts` with full unit coverage.
- **Aitor re-enable** (commit 5255f4c) — replaced `SHOW_AI_ADVISOR` flag with Clerk `isSignedIn` gate via `AitorAuthGate`. Settings "AI & Location" tab gated the same way. Anonymous users see no AI surfaces; signed-in users get the chat back.

### Frost & Climate Data (research)

`docs/research/frost-and-climate-data.md` — fresh research into extending the existing Open-Meteo plumbing with frost-aware features. The full background is in the research doc; the actionable tracks are split between Shipped and Backlog below.

### Frost Track: Shipped (PR #328, 2026-05-08)

The full frost track from items 1–5 of the research-driven backlog landed in a single squash-merged PR (`f53c155`).

- **Frost indicators on WeatherStrip** — `Snowflake` icon when `tempMinC ≤ 0`, faint dot when `≤ 3`. Pure UI on the existing 3-day forecast.
- **`hardiness` field on `Vegetable`** — RHS H1a–H7 ratings populated on all 192 plant entries across the 17 category files; new `Hardiness` type in `src/types/garden-planner.ts` and an `isFrostTender` helper in `src/lib/hardiness.ts` (defaults `undefined` to `H4`).
- **Climate-API frost dates** — `fetchFrostDates(lat, lng)` in `src/lib/weather/frost-dates.ts` hits Open-Meteo's `/v1/climate` for a sliding 15-year window of `temperature_2m_min`, derives average last spring / first autumn frost, caches in memory + localStorage, and is wired through `useTodayData` to populate `meta.frostDates` lazily once coordinates are known. 15s timeout + AbortController, matching the `open-meteo.ts` convention.
- **Schema v20 → v21** — added `meta.frostDates` (optional). No-op data transform.
- **Tonight's frost banner** — `FrostWarningBanner` mounts on Today between `LocationPromptBanner` and `WeatherStrip`, lists tender (H1a–H3) plantings in active beds whenever `forecast[0].tempMinC ≤ 0`. Per-day dismiss via `toLocaleDateString('en-CA')` so it rolls over at the user's local midnight (matches the `todayLocal()` helper convention from #304).
- **Frost-aware `validateSowDate()`** — accepts an optional `SowDateValidationContext` carrying `frostDates`; warns when a frost-tender crop is sown outdoors before the user's average last spring frost. Existing fall-factor warning preserved.

### Mobile + Auth Polish: Shipped

- **PR #330 (`795e600`, 2026-05-08)** — Boost this bed on mobile. Ported the `<BoostThisBed>` section from `BedDetailPanel` into `MobileAreaBottomSheet`. Same gating (any bed with at least one planting), same prop wiring; required widening `onAddPlanting` from `() => void` to `(prefilledPlantId?: string) => void` and threading `varieties` through from the allotment page.
- **Social login (Clerk Dashboard config)** — confirmed enabled by the user in the Clerk Dashboard. Pure config, no code change. Google/Apple buttons render automatically above the email field on `/sign-in`.

### Cloud Sync Hardening (post-incident, May 2026)

On 2026-05-08, signing in on a second window silently overwrote several days of cloud activity. Root cause: `saveAllotmentData` in `src/services/storage-core.ts` bumped `meta.updatedAt` to NOW on every save — including load-time side effects (schema migrations, validation/repair, currentYear auto-update) — which fooled `useSyncedStorage`'s LWW comparison into pushing a stale-content / now-stamped local up to Supabase. The Supabase free tier has no point-in-time recovery and the upsert overwrites the row, so the prior cloud snapshot was unrecoverable.

Two PRs are open and ready to land. They are independent of each other but should both ship.

#### PR #332 — Server-side cloud history with restore UI (LAND FIRST)

Branch: `feat/cloud-history`. Adds an `allotment_history` table in Supabase with a `BEFORE UPDATE` trigger on `allotments` that archives the old row before each upsert (`SECURITY DEFINER` so the insert bypasses RLS). RLS on the history table only lets users SELECT and DELETE their own rows. App side: `fetchHistoryList` and `fetchHistorySnapshot` in `src/lib/supabase/sync.ts`, plus a new `<CloudHistorySection>` rendered in Settings → Data tab (signed-in only) that lists the most recent 20 snapshots with relative + absolute timestamps and a `plantings · areas · varieties` summary; Restore opens a confirm dialog and writes the snapshot back to localStorage, then `reload()` triggers the next sync (which re-archives the just-replaced version, so a restore is itself reversible).

The SQL migration (`sql/002-allotment-history.sql`) was already run in the Supabase SQL Editor on 2026-05-09, plus a one-off backfill that inserted a baseline row per existing allotment so every current user has a recovery point. Verify before merge that the table + trigger exist and `SELECT count(*) FROM allotment_history;` matches the count of rows in `allotments` after the backfill.

This PR is the "basics first" win — it gives every user a recovery path independent of which sync architecture we end up with, and the history table doubles as the audit trail if/when we revisit the sync engine.

#### PR #331 — Forward fix for the silent-overwrite bug

Branch: `fix/sync-overwrite-safety`. Three layered fixes that ship together:

1. **Drop the unconditional `meta.updatedAt` bump in `saveAllotmentData`.** Each real mutation (`area-mutations`, `planting-operations`, `variety-operations`) already sets `updatedAt` explicitly. The blanket bump was the bug.
2. **Content-equality short-circuit before any push.** New `contentSnapshot()` in `src/lib/supabase/sync.ts` serialises the data with `meta.updatedAt` blanked out — a stable fingerprint that ignores timestamp drift. `useSyncedStorage` uses it for `lastPushedRef` / `pulledSnapshotRef` and skips the push when local and remote match.
3. **Initial-sync overwrite safety net.** New `isLocalStructurallySmaller(local, remote)` helper. If LWW says "push local" but local has fewer plantings/areas/varieties than remote, route through the existing conflict dialog instead of silently pushing.

Includes regression test in `useSyncedStorage.test.ts` that asserts a stale-but-newer-stamped local with fewer varieties than remote routes to conflict, never calls `pushToRemote`. Also tightens five existing LWW tests that were using timestamp-only differences (now correctly short-circuited by fix 2) to use real content differences.

Land #332 first so users have a recovery path while #331 is rolling out, then land #331. They don't conflict; #331 is content-only and #332 is additive (new table, new component).

**Status:** Both #332 (`83ee236`) and #331 (`99dd858`) are merged on `main` as of 2026-05-09. #331 was rebased onto post-#332 main; the conflict in `src/__tests__/lib/supabase-sync.test.ts` was resolved by keeping all four test groups (fetchHistory* from #332 + contentSnapshot/isLocalStructurallySmaller from #331) plus a unified import.

#### Cloud history follow-ups

After #332 + #331 landed, the production cloud-history list grew faster than expected: ~4 snapshots within a single 1–2 minute window of activity, e.g. four "08:41 · 28 areas · 32 varieties" rows back-to-back. Root cause: every `setData` in the app triggers a debounced local save, every save fires the push effect in `useSyncedStorage` (`src/hooks/useSyncedStorage.ts`), every push hits the `BEFORE UPDATE` trigger on `allotments`, and so every meaningful in-app interaction (toggling a task, editing a name, dismissing a banner) creates one history row. This is the architecture working as designed — but it makes the restore list noisy and grows the history table fast.

Two layered dampeners, in order of leverage. The first has shipped; the others remain backlog.

##### 1. Push-side debounce in `useSyncedStorage` — Shipped (PR #338, `fde0599`)

The push effect now schedules pushes via a 30 s `PUSH_DEBOUNCE_MS` timer instead of firing on every `local.saveStatus === 'saved'` transition. Each new save during the window resets the timer and updates `pendingPushDataRef`; only the latest snapshot survives. A new `flushPush()` is exposed from `useSyncedStorage` (and re-exported through `useAllotmentData` and `useAllotment`) which cancels the timer and pushes immediately, returning a Promise. The disabled-state effect also clears the timer and pending refs when the user signs out so the pending push doesn't leak across an auth transition.

Unload safety net: `useSyncedStorage` registers a `pagehide` + `beforeunload` listener that runs `local.flushSave()` first (to ensure the latest data is in localStorage as the recovery floor) and then `flushPush()` bypasses the debounce. The simpler "just call `flushSave()` on unload" approach was rejected because flushing the local layer would re-trigger the push effect and start a fresh 30 s timer that the user is no longer around for. The unload network call itself is best-effort — the LWW reconciliation on next load is the actual recovery floor if the in-flight push is killed.

Tradeoff: cloud lags local by up to 30 s. Fine for a single-user app — the local cache is always current and the restore-from-history floor handles the worst case.

##### 2. Snapshot diff UI — Shipped (PR #340, `83c077b`)

`<CloudHistorySection>` now exposes a "View changes" button per row that opens `<CloudHistoryDiffDialog>`. The dialog fetches the snapshot for that row and the next-newer one in parallel (or diffs against current local data when the row is the most recent), then renders concrete added/removed/renamed lists for areas and varieties, counts for plantings, and a schema-version-bump line for meta. The diff routine itself lives in `src/lib/allotment-diff.ts` as a hand-rolled walker keyed on `id` for areas/varieties (so renames register) and on `${year}|${areaId}|${plantingId}` for plantings (so an edit-in-place is distinguished from a move across seasons). `summariseDiff()` returns a one-line inline hint that the parent renders lazily under the row's existing summary once the dialog has computed the diff. 17 unit tests cover the diff cases plus the no-meaningful-changes (timestamp-only churn) path.

##### 3. Trigger-side coalesce / retention (optional, defer)

If the client-side debounce is enough, skip this. If the history table still grows too fast, the SQL trigger can UPDATE the most recent history row in place when its `archived_at` is less than ~30s old, and the retention SQL in `sql/002-allotment-history.sql` can bucket older snapshots (one per 5-minute window after an hour, one per hour after a day, etc). Keep commented in the SQL file until volume justifies it.

The UPDATE must be strictly scoped to the user — pseudo-SQL: `UPDATE allotment_history SET data = OLD.data, archived_at = COALESCE(OLD.updated_at, now()) WHERE id = (SELECT id FROM allotment_history WHERE user_id = OLD.user_id AND archived_at > now() - INTERVAL '30 seconds' ORDER BY archived_at DESC LIMIT 1)`. Without the `WHERE user_id = OLD.user_id` filter on the inner SELECT, two different users saving within the same 30s window could merge each other's snapshots, which would be a much worse incident than the verbosity it's trying to fix.

#### Future: revisit the sync engine (ADR 027 — Step 1 shipped, Step 2 is the next deliberate work)

The current architecture (local-first JSONB + LWW on `meta.updatedAt`) is the same shape that produced the incident. ADR 024 documents that the original sync attempt was Yjs over PeerJS/WebRTC, abandoned because WebRTC was unreliable — *not* because Yjs was wrong. The "shareable by ID, auto-sync, conflict-free" library the user remembered is exactly Yjs (or its modern cousin AutomergeRepo). With a websocket relay (y-websocket against a tiny Node service, a Cloudflare Durable Object, or even a Supabase Realtime channel) the WebRTC failure mode disappears and the LWW machinery — and a whole class of future incidents — goes with it.

Spike outline for the new session, in order:

1. Write a new ADR `docs/adrs/027-sync-revisit.md`. Reference 024. Capture the post-incident decision: "Yjs is back on the table once we have a non-WebRTC transport." Survey the transport options (y-websocket on Fly/Render, Cloudflare Durable Objects, Supabase Realtime, Liveblocks). Pick one for the spike — likely a Cloudflare Durable Object hosting the y-websocket protocol per document, since stateless Workers can't hold the in-memory `Y.Doc` that y-websocket needs to coordinate clients.
2. Spike branch: convert `AllotmentData` to a Yjs document. The 192-entry vegetable database is static and stays as TypeScript modules — only mutable user state moves. Map the top-level shape to `Y.Doc` with `Y.Map` for `meta`, `Y.Array` for `seasons`, etc. Rough sizing: a few days of work, not hours.
3. Replace `useSyncedStorage` with a `useYjsDoc` hook. Keep `usePersistedStorage` semantics (local cache via `y-indexeddb`) so offline-first still works.
4. Migrate live users: write a one-shot import that reads each user's current `allotments.data` row, hydrates a Yjs doc, snapshots the binary state, and stores it in a new `allotment_yjs` table (or replaces the JSONB blob with the Yjs binary update). The history table from #332 is the safety net during the migration.
5. Retire `useSyncedStorage`, the LWW comparison, the conflict dialog. Keep the share/receive flow as-is (it serves a different purpose — one-shot transfer to a new device without sign-in).

This is a multi-day effort and is *not* the priority for the next session. The next session's priority is landing #332 then #331 and watching the cloud history table fill up. The Yjs revisit comes after — once we're sure the bleeding has stopped and we have evidence about whether users actually exercise the "restore" UI.

### Parallel PR Sprint: Shipped (2026-05-09)

A four-PR sprint dispatched in parallel agent worktrees, all addressed and merged the same day.

#### Soil temperature for sow tasks — PR #339 (`c1ab516`)

Added `soil_temperature_0_to_7cm` to the Open-Meteo hourly forecast call and surfaced today's mean as `soilTempC?: number` on `RainfallSummary`. New `src/lib/sowing-thresholds.ts` carries the per-species table (peas / sugar-snap-peas / carrot at 7°C; the four bean variants at 12°C; sweetcorn at 13°C) plus the pure `getMinOutdoorSowSoilTempC()` and `shouldSuppressOutdoorSow()` helpers. The task generator now passes `rainfall?.soilTempC` through and suppresses `sow-outdoors` emissions when soil is below the threshold. Indoor sowing, plants without a threshold, and `undefined` soil temp all preserve the existing month-based behaviour. New tests cover the threshold module, the soil-temp derivation in `open-meteo`, and a fresh "soil temperature gating" block in `task-generator.test.ts`.

#### Aitor opt-in polish — PR #342 (`87bc612`)

Schema bumped to v22 with a no-op v21→v22 migration. Added `meta.aiAdvisorEnabled` and `meta.aiAdvisorPromptDismissedAt` as optional fields. `AitorAuthGate` now requires both `isSignedIn` and `meta.aiAdvisorEnabled === true` instead of just `isSignedIn` — the implicit "signed-in == opted-in" became an explicit choice. A new `<AitorOptInBanner>` on TodayDashboard shows once for signed-in-but-not-opted-in users with "Try Aitor" / "Maybe later" actions wired through `updateMeta`. Next to the existing chat launcher, a secondary "Diagnose a plant" button opens `AitorChatModal` via a new `initialMode: 'diagnose'` carried through `AitorChatContext`; the modal prepends a diagnosis-focused hint to the system prompt and passes `autoOpenFilePicker` to `ChatInput`, which clicks the hidden file input on mount. `QuickTopics` swapped to the four refreshed prompts ("What can I plant now?", "Diagnose this leaf", "Plan my next rotation", "Why is my chard bolting?"). The Gemini review caught a real bug in the first cut — an `autoOpenedRef` blocked the second-and-later diagnose-button click while the modal stayed mounted; fixed by relying on the dep array alone.

#### Backup reminder — PR #341 (`10f8083`)

Settings → Data tab now surfaces a yellow `<BackupReminderCallout>` when more than 30 days have passed since the user's last JSON export. The callout offers a Download backup button (routes through the existing `useDataTransfer.handleExport`) and a Dismiss for 30 days button. Both stamp ISO timestamps onto two new optional fields on `AllotmentMeta` (`lastBackupExportAt`, `backupReminderDismissedAt`). No schema bump — both fields are optional with `undefined` meaning "never". Visibility lives in a tiny pure predicate `shouldShowBackupReminder(meta, syncStatus, now)` in `src/lib/backup-reminder.ts` with 9 unit tests covering all the cases. Cloud-synced signed-in users (`syncStatus === 'synced'`) are excluded — they have a recovery floor already. The Gemini review flagged two real issues both applied: gating the predicate on non-null `data` to stop the callout flashing during initial load, and computing the relative time inside a `useEffect` to avoid SSR/CSR hydration drift around day boundaries. The branch was rebased onto post-#342 `main` to add its two meta fields alongside Aitor's two; conflict resolved by keeping all four optional fields plus the v22 schema bump.

### Phase 8 (partial): Gemini free tier — Shipped (PR #345, `3ac2636`)

Closes the loop on the Aitor opt-in: signed-in users who haven't added their own OpenAI key get a 30-requests-per-month free tier backed by Google's Gemini API (default `gemini-2.5-flash`, override via `GEMINI_MODEL` env). New `src/lib/ai/gemini.ts` adapter handles chat + vision in OpenAI-shaped requests; tools are deliberately carved out on the Gemini path (OpenAI keeps tool-calling). Per-user quota tracked in a new `ai_usage` Supabase table (`sql/003-ai-usage.sql`) with RLS so each user only reads their own counter; the route checks before each call and increments after a successful response. Settings → AI & Location surfaces a `<AiQuotaSection>` showing "X / 30 free this month" with the BYO upgrade hint. Chat error UX recognises the 429 quota-exhausted message and renders a friendly two-options message.

Operator setup: add `GEMINI_API_KEY` to Vercel env, optionally `GEMINI_MODEL=gemini-3-flash` once that model is confirmed live, and run `sql/003-ai-usage.sql` in the Supabase SQL Editor (same operator workflow as #332).

Risks the plan still tracks: per-user quota of 30/month is the policy call to revisit if the project's daily Gemini quota gets close to the cap; tool-calling on Gemini path is a follow-up if/when users miss it.

### Try Aitor button opens chat — Shipped (PR #349, `5f2abe7`)

The opt-in banner's "Try Aitor" button used to only flip `meta.aiAdvisorEnabled` + `aiAdvisorPromptDismissedAt`, leaving the user with no visible feedback — the floating chat launcher at `bottom-6 right-6` is easy to miss on a long Today page, so the click felt like a no-op. `TodayDashboard` now imports `useAitorChat` and the banner's `onEnable` calls `openChat()` after `updateMeta`, so clicking Try Aitor opens the modal immediately. One-line UX fix, no schema or test changes.

### Free-tier Gemini client path — Shipped (PR #351, `1f32e2b`)

After PR #345 added the server-side Gemini free tier, clicking Try Aitor still threw "Please configure your OpenAI API key in Settings" because two client-side guards bailed before the request reached `/api/ai-advisor`. PR #351 dropped the `!token` early-throw in `AitorChatModal.tsx`, wrapped the `x-openai-token` header in an `if (options.apiToken)` check inside `openai-client.ts`, and kept the `tokenPattern` validator only in the static-deployment `callOpenAIDirect` fallback (which genuinely needs a BYO key because GitHub Pages can't reach the Gemini path). Signed-in users without a BYO key now hit Gemini cleanly; the modal's quota-exceeded (429) and config-error branches still match the failure modes they were written for, while any other server error (including the "JWT template missing" path) falls through to the generic "Temporary Connection Issue" message.

### ADR 027 Yjs spike Step 2 — Shipped (PR #364, `8b28818`)

A proof-of-concept conversion of `AllotmentData` to a Yjs document landed on `main` on 2026-05-13. `src/lib/yjs-spike/allotment-yjs.ts` defines the top-level shape, a `hydrateFromJson` helper that seeds from an existing `AllotmentData` snapshot inside a single Yjs transaction, a `serializeToJson` mirror, and `encodeDocState` / `decodeDocState` for the BYTEA round-trip the migration step will need. 13 unit tests in `src/__tests__/lib/yjs-spike/allotment-yjs.test.ts` cover hydrate-serialize round-trip, idempotent re-hydration, replace-on-different-data semantics, meta-key-clear on re-hydrate, optional-array normalisation, proxy mutations, binary encoding, and the two CRDT-semantics cases (disjoint edits and same-field convergence).

Proxy-wrapper decision: **SyncedStore** (`@syncedstore/core@^0.6`) over valtio-yjs. valtio-yjs is self-described as alpha; SyncedStore is production-tested in BlockNote and has the clean `shape` API plus a `getYjsDoc()` escape hatch. Two shape constraints worth flagging: top-level entries must be empty `{}` / `[]` (the validator throws otherwise), so `AllotmentData.layout.areas` is hoisted to a top-level `areas` Y.Array and `version` / `currentYear` are nested inside a `state` Y.Map. Neither change is user-visible — the legacy JSON shape is reconstructed at the serialization boundary. The other constraint: `undefined` values must be dropped before assignment (Yjs has no `undefined`), enforced by the `assignDefined` helper.

Two correctness gotchas surfaced during review and are now covered by tests. First, `hydrateFromJson` has to clear the top-level Y.Arrays *and* the `meta` Y.Map before repopulating — without the clears, a second hydrate from a backup with fewer fields silently keeps stale data (the first-round Gemini review caught the array case; the second-round self-review caught the matching meta case). Second, SyncedStore cannot distinguish "field never set" from "empty array" once hydrate has run, so the canonical `serializeToJson` output normalises optional top-level arrays to `[]`. Both behaviours are documented inline and asserted by tests.

First cost-line measurement: on a small fixture (one bed with 2 plantings, one tree, 2 varieties, one compost pile, ~2.1KB JSON), the Yjs binary is 2.6KB — a 1.21x ratio *larger* than JSON. CRDT metadata is a fixed overhead that only amortises away on bigger documents. The cost-line risk in the ADR remains open until measured on a realistic multi-season fixture.

### AI/Settings UX sprint — Shipped (PRs #366–#371, 2026-05-17 → 2026-05-18)

A six-PR sprint focused on the AI advisor and Settings surface. PR #366 (squash `e9c560c`) removed the Reset button from the allotment grid toolbar, dropped the OpenAI token privacy notice, merged the floating Diagnose + Ask Aitor launchers into one, made Settings land on the AI & Location tab for signed-in users via a `key` remount that survives Clerk's async auth resolve, lazy-mounted `AitorChatModal` via `next/dynamic` so its hooks no longer run on every parent re-render (the "extremely slow" report), added a minimize affordance with conversation state preserved via mount-while-minimized, and tightened the Aitor system prompt to favour short chat-style replies. The follow-up PRs landed on top of `main`: #367 (`1428638`) collapsed the BYOK OpenAI key input behind a default-closed disclosure; #369 (`9ada468`) fixed the bug where toggling Aitor off in Settings didn't propagate to the floating launcher in the same tab — `usePersistedStorage` now emits a same-tab `bonnie:storage-update` CustomEvent with a per-instance id and monotonic sequence so sibling hook instances stay in sync; #368 (`57d6ece`) made a planting's name itself clickable to open the species `PlantSummaryDialog`, removing the small `(i)` icon as redundant; #370 (`a085db5`) polished `usePersistedStorage` (unmount-flush symmetry, validate-rejection test, stringify hoist); and #371 (`e0cd829`) extended the Settings tour with the AI & Location section, with a runtime element-existence filter so signed-out users still get the Data → Help fallback. Each PR went through one round of Gemini bot review with a follow-up commit addressing the findings. Two non-blocking notes remain: the auto-save effect in `usePersistedStorage` still has a falsy-T truthy-check (same pattern as the two fixed in PR #370 but a separate code path), and the tour's element-existence filter only catches missing targets when the relevant tab is already active at tour start — both filed as follow-up candidates.

### ADR 027 Yjs Step 3 — Foundation shipped (PRs #382, #383, 2026-05-18)

PR #382 (squash `9b01146`) landed the integration-design spec at `docs/superpowers/specs/2026-05-13-yjs-step-3-integration-design.md` plus the matching "Step 3 design constraints" subsection in ADR 027. The spec documents three load-bearing decisions future PRs must preserve: `serializeToJson` and `decodeDocState` are permanent infrastructure (rollback, GDPR export, debug), the legacy-to-Yjs mapping is not a runtime bijection (two-branch domain-hook methods, no reshape), the dual-write bridge drives `usePersistedStorage.setData` not localStorage directly.

PR #383 (squash `6fde2f1`) landed PR-A of the three-PR Step 3 split: the foundation. New file `src/hooks/useYjsDoc.ts` is the Yjs-path data hook — it owns the `Y.Doc`, the SyncedStore proxy, the `IndexeddbPersistence` provider, snapshot publishing via `serializeToJson`, plus `mutate(fn)`, `replaceFromJson`, and `serializeAndPush`. New file `src/hooks/useYjsToLegacyMirror.ts` is a one-way adapter that pushes each Yjs snapshot through `usePersistedStorage.setData` so the existing cloud-push effect still fires. `useAllotmentData` gains a module-level strategy switch — `const useAllotmentDataImpl = USE_YJS_STORAGE ? useAllotmentDataYjs : useAllotmentDataLegacy` — which lets the bundler tree-shake the unused branch. A `bwp-storage-flag` BroadcastChannel plus `StorageFlagReloadBanner` handle the cross-tab flag-transition safety net. `USE_YJS_STORAGE = false` is added to `release-visibility.ts`, and `fake-indexeddb` is added as a dev dependency. 16 new tests across three new test files. Three Gemini bot findings were addressed before merge: timeout cleanup on unmount in `useYjsDoc`, the module-level strategy switch replacing an eslint-disabled conditional hook call, and full-stack-trace dedup for the no-op `setData` seam that catches unported domain-hook call sites. With the flag off (the default), behaviour is byte-identical to the pre-PR-A `main`. With the flag flipped on locally, reads work and writes log a single warning per call site — the seam PR-B closes when the seven domain hooks are ported.

### ADR 027 Yjs Step 3 — Domain hooks ported (PRs #385, #386, 2026-05-19)

PR #385 (squash `987ad91`) ported seven domain-hook files to two-branch methods: `useAllotmentAreas`, `useAllotmentPlantings`, `useAllotmentVarieties`, `useAllotmentCustomTasks`, `useAllotmentMaintenance`, `useAllotmentNotes`, `useAllotmentCareLogs`. Each `setData(prev => ...)` call site now has a paired `if (USE_YJS_STORAGE) { mutate(store => { ... }) }` branch that mutates the SyncedStore proxy in place. The legacy branches stay byte-identical to keep the rollback contract intact. The spec's "99 call sites" figure was an expression-level count; the actual invocation count came in at 39 paired branches. Cross-collection methods turned out to include more than the spec called out: `addPlanting`/`addPlantings` (plantings + varieties), `addArea`/`removeArea` (areas + season backfill + maintenance tasks), `createSeason`/`deleteSeason` (seasons + state.currentYear rebalancing). A new `src/hooks/allotment/yjs-helpers.ts` module exports `withoutUndefined` and `assignDefined` for the Yjs write sites (the spec's reference to `assignDefined` in `allotment-yjs.ts` was internal-only; the two implementations will consolidate during the eventual `yjs-spike` → `yjs` rename after Step 5). A new `src/__tests__/hooks/allotment-path-parity.test.ts` runs an 8-step scripted mutation sequence under both flag states and asserts snapshot equality at each step. Non-determinism handling: real timers with spied `Date.now` and patched `new Date()` (not `vi.useFakeTimers()` — that froze the microtask scheduler `fake-indexeddb`/`y-indexeddb` rely on for `whenSynced`), mocked `generateId` covering both `@/lib/utils/id` and the `@/lib/utils` barrel, and a `stripVolatile` helper to drop `meta.updatedAt`/`season.updatedAt` from the snapshot diff. One Gemini finding was addressed before merge (redundant `find` lookup in `createSeason`'s rotation-bed branch hoisted to the top of the loop iteration).

PR #386 (squash `f677040`) closed the spec-inventory gap on `useCompost` — the only remaining `setData` consumer the spec hadn't listed. Seven mutation methods ported (`addPile`, `updatePile`, `removePile`, `addInput`, `removeInput`, `addEvent`, `removeEvent`), all single-collection. `useCompost` is consumed directly (not composed via `useAllotment.ts`), so it destructures `mutate` from `useAllotmentData()` itself rather than taking a prop — no public API change. The path-parity test gained a second `it` block with five scripted compost steps. Pre-existing legacy quirk preserved: compost mutations don't bump `meta.updatedAt` on either path; if compost writes should participate in LWW timestamping that's a separate behaviour change. Gemini left no inline findings on this PR.

### ADR 027 Yjs Step 3 — Phase 1 cutover live (PRs #388, #387, 2026-05-19)

PR #388 (squash `5a2eb2d`) closed two foundation-layer gaps Gemini flagged as critical on the first PR-C draft. `useAllotmentDataYjs.handleSync` now closes over the Yjs doc (constructor reordered) and calls `yjs.replaceFromJson(newData)` before `setSelectedYear`, so sibling-tab `storage` events and cloud-sync pulls land in the Yjs doc instead of being silently overwritten by the mirror on the next push. `resolveConflict` is wrapped: it captures `synced.syncConflict?.remote` before delegating, then for the `'cloud'` choice also calls `yjs.replaceFromJson(remote)`. Verified `usePersistedStorage`'s `latestSerializedRef` dedup short-circuits the redundant save the mirror would emit when `handleSync`'s `replaceFromJson` republishes via the doc's `update` listener. PR-A.2 also surfaced two separate gaps while running Playwright with the flag flipped locally: a concurrent-mount race in `useYjsDoc` (multiple `useAllotment` consumers each built their own Y.Doc against the same shared IndexedDB store and independently hydrated from localStorage, producing duplicate seasons across reloads — refactored to a refcounted module-level singleton so all consumers share one doc), and an import-flow gap where `useDataTransfer.handleImport` wrote new data to localStorage but Yjs IDB still held the previous session's state (added `clearYjsIndexedDb()` before reload in the import, receive-link, and Clear-Local-Data paths). Two new tests in `allotment-path-parity.test.ts` cover both wired seams. All 9 previously-failing E2E tests pass with the flag flipped on.

PR #387 (squash `5580c59`) flipped `USE_YJS_STORAGE` to `true`. The Yjs path is now canonical; the legacy chain stays in tree as the rollback floor and the cloud-sync mirror target throughout the soak window. Rollback is a one-line flag flip back, no data migration — the mirror has been keeping localStorage and Supabase in sync. PR-C also added a `tests/utils/storage.ts` helper, `clearAllStorage(page)`, that deletes the `bwp-allotment-yjs` IndexedDB database alongside `localStorage.clear()`; without it, Playwright's full-suite run saw cross-test contamination from stale Yjs state. Every `await page.evaluate(() => localStorage.clear())` call site now routes through the helper, and `seedTestData` / `seedBedWithCarrot` clear storage before seeding so the Yjs-path first-run hydrates from the fresh legacy snapshot. The deployment-runbook step `UPDATE allotments SET data = data` ran against production Supabase post-merge — the `BEFORE UPDATE` history trigger from PR #332 fired and inserted two new rows into `allotment_history` (IDs 35 and 36, one per active user). The `archived_at` on each carries the user's last legacy-chain `updated_at` (the trigger archives `OLD.updated_at`), which is exactly the pre-cutover state worth keeping as a recovery point.

### Feeding & Preserving — Milestones B2 + C (PR #425 + storage QA follow-up)

PR #425 shipped the feed-task own-resource hints (B2 — feed hints prefer the
user's own comfrey bed / ready compost over generic make-your-own advice) and
the storage/preserving surface (Milestone C): an optional `storage` field on
`Vegetable` (`methods` / `freshDays` / `tip`), a read-only "Storage &
Preserving" panel on the plant/variety detail page (C2), and a "Glut of X?"
care-tip nudge that fires in a crop's expected harvest window when its storage
data offers a preserving method (C3 — `generatePreserveNudges`, preserve
methods = freeze/jam/pickle/ferment/dry).

The storage-QA follow-up reviewed and corrected the authored data and filled the
obvious high-glut / staple-keeper gaps the first pass missed — **33 crops
added** (alliums: leek, shallot; brassicas: swede, turnip, cauliflower,
calabrese, purple-sprouting broccoli, Brussels sprouts, savoy; roots: parsnip,
celeriac; other: sweetcorn, Jerusalem artichoke; berries: gooseberry,
redcurrant, blueberry; fruit trees: pear, cherry, damson, greengage; cucurbits:
patty-pan, spaghetti, acorn squash; solanaceae: blight-resistant tomato; leafy:
kale, cavolo nero, chard, spinach; legumes: borlotti, black turtle, edamame,
mangetout, sugar snap), plus a courgette methods/tip consistency fix (added
`jam` to match its chutney tip). All 26 pre-existing entries were sanity-checked
against Scottish-allotment practice and found sound. C2 and C3 were verified
in-app (Playwright screenshots: detail panel renders for crops with data and is
hidden without; the glut nudge shows for an in-window preservable crop and not
for an out-of-window one). Coverage now **59 / ~191 crops**.

### Storage tips — edible long tail complete (branch `claude/storage-remaining-crops`)

The edible long tail called out in the previous backlog is now authored — **90
crops added** in one pass, bringing coverage to **149 / 191 crops**. Filled
completely: all **herbs** (20 — soft herbs freeze-first, woody herbs dry-first,
bay/chamomile dry, sorrel/borage fresh), all remaining **leafy greens** (17 —
salad leaves fridge/fresh, cooking greens freeze, mustard/pak-choi ferment),
all remaining **roots** (12 — in-ground/damp-sand keepers, mooli/horseradish
ferment-or-pickle, oca/yacon cure notes), all remaining **berries** (8 —
freeze/jam soft-fruit, goji/aronia/elderberry dry, elderberry "cook first"),
all remaining **brassicas** (7), **fruit trees** (4 — medlar bletting, quince
membrillo), **alliums** (7 — cure-and-store keepers vs fresh-leaf), **legumes**
(3), **solanaceae** (3 — new tatties "eat fresh", tomatillo husks-on), and
**other** (5 — asparagus/globe-artichoke/celery/cardoon/mashua). Plus the named
ornamental exceptions: edible flowers calendula + nasturtium (annual) and
culinary lavender + bergamot (perennial). Authored to the rule of thumb — only
genuine preserving crops carry a preserve method (so keepers like maincrop-style
potatoes, salsify, scorzonera, fennel bulb, crosnes, oca, ulluco show storage
info without triggering the C3 glut nudge). All 1099 unit tests pass.

**Remaining (deliberately out of scope):** ~37 crops — non-edible ornamental
flowers (annual & perennial), bulbs, and green manures. Per the prior guidance
these mostly don't warrant storage tips.

### Perennial care tips — full soft fruit / tree / perennial coverage (branch `claude/caretips-perennial-crops-iur6au`)

Expanded `careTips` (ADR 025) from the original 4-plant spike (strawberry,
raspberry, apple-tree, rhubarb) to **43 perennials** — **39 plants added, 6 tips
each (234 new tips)**. Authored per-category via parallel subagents against a
tight spec, then every diff reviewed. Coverage now:

- **Soft fruit & currants (13):** blackberry, blueberry, gooseberry,
  blackcurrant, redcurrant, tayberry, loganberry, jostaberry, honeyberry,
  goji-berry, aronia, elderberry, sea-buckthorn.
- **Fruit trees (9):** cherry, damson, plum, pear, greengage, medlar, quince,
  fig, mulberry — prune-timing safety respected (stone fruit summer-only,
  mulberry dormant-only, fig keeps the embryo figs, medlar/quince blet/membrillo).
- **Perennial veg (5):** asparagus, globe-artichoke, cardoon, seakale, horseradish.
- **Perennial herbs (12):** rosemary, thyme, sage, mint, oregano, marjoram,
  lovage, sorrel, chives, bay, lemon-balm, French tarragon.

Tips are month-tagged and Scotland/Edinburgh-appropriate. Stage filtering
(`establishing`/`productive`) is applied only where a plant carries
`perennialInfo` so the tips actually fire — all soft fruit, all fruit trees and
asparagus are stage-tagged; the herbs and the four perennial veg without
`perennialInfo` are deliberately stage-agnostic (a staged tip on those would be
silently filtered). Existing entries untouched. Single-quoted strings, no
apostrophes. All 110 tests across plant-data-integrity, task-generator and
vegetable-database pass; type-check and lint clean.

Also folded in the last storage-data edible stragglers — **sunflower** (dry
seeds), **hardy-kiwi**, **hops**, and the gourmet mushrooms **shiitake** and
**oyster** (both dry well) — bringing storage coverage to **154 / 191 crops**.

### Care-tip data integrity test + remaining perennials (branch `claude/plant-integrity-perennial-tips-h0csl9`)

Follow-up to the #442 careTips expansion. A code review had found a latent
damson bug — `maintenance.pruneMonths` set to winter (unsafe for a stone fruit)
while the care-tip said summer — with no automated guard. The `stage` field is
also silently dropped by `generateCareTipTasks` when a plant lacks
`perennialInfo`, and nothing tested for it.

**Integrity test** (`src/__tests__/lib/plant-data-integrity.test.ts`): new
data-driven blocks iterate every plant and assert, per careTip: months are
integers 1–12 and non-empty; `category` is a valid `CareTipCategory`; `stage`,
when set, is a real lifecycle stage (`establishing`/`productive`/`declining` —
`removed` is a stored status, never computed, so it would be dead data); any
stage-tagged tip sits only on a plant with `perennialInfo` (else it never
fires); and no tip string repeats within one plant. A "Pruning-season
consistency" block flags stone fruit (Prunus: cherry, plum, damson, greengage,
matched by id or `Prunus*` botanical name) whose `pruneMonths` or prune care-tips
fall in winter (Nov–Feb), and a general check requires every perennial's
`pruneMonths` season to be endorsed by at least one prune-mentioning care-tip
(so a winter+summer pruner like gooseberry passes, but a schedule contradicting
its only prune advice fails). All checks are data-driven so future plants are
covered automatically.

**Remaining perennials** (6 tips each, month-tagged, Scotland-appropriate,
single-quoted, no apostrophes, stage-agnostic as none carry `perennialInfo`):
winter-savory, hyssop (`herbs.ts`), jerusalem-artichoke (`other.ts`), and the
culinary perennials lavender + bergamot (`perennial-flowers.ts`). Existing
entries untouched. type-check, lint clean; plant-data-integrity, task-generator,
and vegetable-database suites all pass.

### Plant-data integrity follow-up — cadence/lifecycle guards + last edible perennials (branch `claude/pr443-plant-integrity-followup-sfl0rk`)

Follow-up to #443 (merged). The sea-buckthorn `feedMonths: []` that #443 caught
suggested sibling data smells the new tests did not yet cover, so
`plant-data-integrity.test.ts` gained three more data-driven blocks:

- **Feed & water cadence:** `feedFrequencyDays` and `waterFrequencyDays` must be
  positive when set, and a `feedType` must be backed by a feed schedule
  (`feedMonths` or `feedFrequencyDays`) — a feedType with no schedule never
  surfaces in a feed task. The reverse is deliberately not asserted: a schedule
  with no feedType is supported (the generator falls back to a generic feed
  reminder).
- **Perennial lifecycle info:** `perennialInfo.yearsToFirstHarvest` and
  `productiveYears` must have positive `min` <= `max`.

Run against current data these surfaced **no** offenders — the checks are
non-vacuous (47 plants carry a feedType, all correctly paired; 27 carry
`perennialInfo`, all with valid ranges), so this is a regression guard for
future edits, not a data fix.

**careTips coverage re-audit:** swept the perennial categories
(herbs/other/perennial-flowers/berries/fruit-trees) for gaps. Confirmed the true
annuals/biennials are correctly skipped (borage, coriander, dill, parsley,
celery, sweetcorn, mashua) and that the remaining ornamental perennial-flowers
(echinacea, geranium, nepeta, rudbeckia, salvia, sedum, tansy, yarrow) stay out
of scope, consistent with the edible/culinary/functional scoping of #441–#443.
Filled the last edible/functional perennials still lacking tips (6 each,
month-tagged, Scotland-appropriate, single-quoted, no apostrophes,
stage-agnostic as none carry `perennialInfo`): chamomile, herb-fennel
(`herbs.ts`), comfrey, agastache/anise-hyssop (`perennial-flowers.ts`). Existing
entries untouched. type-check, lint clean; plant-data-integrity, task-generator,
and vegetable-database suites all pass (122 tests).

### Up Next: Phase 1 soak then Step 5 cleanup

The soak window is open. Success criterion is qualitative for the two-user cohort: both real users use the app on the flag for ~3–5 days each, run at least one manual cross-device conflict (edit on phone and laptop, watch the conflict-replace path actually re-hydrate the Yjs doc from cloud), and report no data anomalies. The Yjs binary on each device is the source of truth from this point; the legacy `allotment-unified-data` localStorage key is being mirrored from Yjs and is the rollback floor. Step 5 then deletes `useSyncedStorage`, the legacy branch of every domain-hook method, `useYjsToLegacyMirror`, the `bwp-storage-flag` BroadcastChannel, the legacy localStorage key, and the same-tab broadcast apparatus from PR #369 (the `bonnie:storage-update` CustomEvent, the `instanceId`/`sameTabSeq` bookkeeping, the `recordSavedState`/`recordAdoptedState` helpers, the `recentSavesRef` echo dedup) — every line of that broadcast becomes redundant the day the legacy chain leaves the tree. `serializeToJson` and `decodeDocState` stay forever (rollback + GDPR export + debug). Separate follow-ups worth filing: rename `src/lib/yjs-spike/` → `src/lib/yjs/`, consolidate `src/hooks/allotment/yjs-helpers.ts` with the now-internal `assignDefined` in `allotment-yjs.ts`, and tighten the still-`addInitScript`-pattern Playwright seeds (homepage / onboarding / boost-this-bed) to also clear Yjs IDB if those tests start contaminating each other later.

### Research-Driven Improvements: Backlog

Soil temperature, Aitor opt-in polish, and backup reminders all shipped earlier; the Gemini free tier above closes the cost-line risk that was previously parked here.

### Future Phases (Contingent on User Adoption)

From the pre-production strategic plan (`docs/research/pre-production-strategic-plan.md`):

- Phase 8 cont'd — pgvector for semantic search of plantings/notes once the Gemini path has real usage data.

Product roadmap phases 2-4 (Feature Discovery, Power Users, Community & Scale) are also contingent on Phase 1 metrics and user feedback.

---

## Key References

- `docs/research/repo-analysis-and-improvements.md` - Full codebase analysis with prioritised improvement opportunities
- `docs/research/product-roadmap-quick-reference.md` - Product strategy, UX review checklist (all steps complete)
- `docs/research/pre-production-strategic-plan.md` - Infrastructure phases (0-5 done), future phases 6-8
- `docs/research/plant-data-validation-strategy.md` - Plant database improvement plan
