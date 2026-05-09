# Current Plan

Last updated: 2026-05-09 (post-merge of #338/#339/#340/#341/#342)

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

#### Future: revisit the sync engine (ADR 027 — not started)

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

### Research-Driven Improvements: Backlog

Follow-ups from earlier research rounds. Soil temperature, Aitor opt-in polish, and backup reminders all shipped above. What remains is the longer-tail Aitor work that didn't fit in this sprint:

- Server-side fallback cost-line risk (`OPENAI_API_KEY`) once auth-gated users opt in en masse — keep BYO key as the default and only allow server-side for a future paid/free-tier when ready.

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
