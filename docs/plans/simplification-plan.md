# Simplification and Bug-Fix Plan (2026-09)

Status: in progress (plan merged in #592). Baseline commit: `49a23f0` (origin/main, #585). Delete this file when the last wave lands, per the documentation hygiene rule.

## Resume here

A session told to "continue with what we were doing" should follow these steps. All state lives upstream (this file plus GitHub), so no local memory is required.

1. Work from a fresh worktree off `origin/main`, never from the local `main` checkout, which may be stale.
2. Reconstruct progress from GitHub, not from memory. Every work-package PR is titled `WP-NN: <summary>`, so `gh pr list --state all --search "WP- in:title" --json number,title,state,isDraft` shows what is merged, open or missing. The Status table at the bottom is only a convenience copy and may lag behind GitHub.
3. If any row in the Decisions table below has no answer, ask the user every open decision in a single question batch, with the recommended option first. Record the answers in that table as part of the next PR. Wave 0 does not depend on the decisions, so start Wave 0 while you wait.
4. A work package is ready when its "After" dependencies are merged and no open PR carries its number. Launch one implementer subagent per ready package, in parallel, each in its own worktree (Agent tool with `isolation: "worktree"`). Pass each one its table row, the matching evidence paragraph from "Verified bugs", and the rules in "The agent loop" below. Stay within the session's subagent-size guideline, and ask before starting more than roughly eight at once.
5. Each implementer opens a draft PR titled `WP-NN: ...` and runs `/address-pr-comments`. Never merge: report the ready PRs to the user with one `gh pr merge <n> --squash --delete-branch` line each.
6. Once a wave has fully merged, record the metrics listed in "The agent loop" and update the Status table and `current-plan.md` in a small `docs(plan)` PR.

## How this was produced

Five parallel reviewers each took one slice of the codebase: persistence and sync, domain logic, UI, API/security/AI, and repo hygiene. Every bug below was either reproduced with a scratch vitest harness or traced end to end through the code. Items still marked "unverified" have not yet been confirmed. The baseline at `49a23f0` is green: type-check clean, lint clean, and 1510 unit tests pass (11 skipped by design) in 43s.

The overall picture is that the ADR 027 Yjs cutover succeeded, but it left a lot of scaffolding behind. There is a complete second write implementation in `src/services/*` that only tests exercise. There are four release flags that have been off since March. The share/receive flow's sender UI has been unmounted since #255. The GitHub Pages path is vestigial, and there is a lazy loader that loads nothing lazily. Removing these is roughly 7,000 lines of production code plus their tests; this is an estimate that the waves below will measure. The same review also found several real bugs. Two of them lose user data, and one will surface on 1 January 2027.

## Verified bugs, ranked

Data loss and correctness in sync (persistence slice, harness-confirmed):

- Every `useAllotment()` call builds its own `useCloudSync` engine, because the lock, debounce and initial-sync refs are per instance (`useCloudSync.ts:150-161`), while the Yjs doc is a singleton. With Navigation plus the page, at least two engines always run, and the home page runs three. The harness showed one local edit causing 4 fetches and 2 pushes, and concurrent `adoptRemoteUpdate` calls racing on provider teardown.
- Lineage adoption drops local edits. If a device's first sync fails, the next push takes the `firstDeviceSync` path, and `adoptRemoteUpdate` rebuilds from remote only (`useYjsDoc.ts:433-445`). The same loss applies to anonymous-era data when a user signs in on a device whose account already has a cloud row.
- Import, receive and restore on a signed-in device merge with the cloud instead of replacing it. Deleted areas come back, because they reseed a new lineage while the `bwp-yjs-synced-*` flag survives. The pre-import "safety backup" copies the frozen legacy localStorage key rather than the live doc (`storage-utils.ts:117`). `clearYjsIndexedDb` without a reload leaves mounted consumers holding a destroyed doc.
- Year rollover stopped working after the cutover. `selectedYear` is seeded from the stored `currentYear` (`useAllotmentData.ts:96-103`), and `ensureCurrentYearSeason` only runs on the legacy load path. From January 2027 the app stays on 2026. This must ship before year end.
- Local edits made within 3s of a remote merge are not pushed. The push effect skips on the UI-only `isSyncedFromOtherTab` flag (`useCloudSync.ts:357`).

Security and privacy (API slice):

- The AI free-tier quota can be reset by the user. `sql/003-ai-usage.sql:36-43` grants end users INSERT/UPDATE on their own `ai_usage` row, which contradicts the comment above it. Any signed-in user can PATCH `request_count=0` via PostgREST with the JWT already in the browser. The increment is also a non-atomic SELECT-then-UPSERT. Whether production matches the repo SQL is unverified.
- Account deletion is incomplete. `deleteRemote` removes only the `allotments` row, so `allotment_history` snapshots and `ai_usage` rows remain. The settings page clears only the legacy key, so the IndexedDB doc survives and the next sign-in re-pushes it. It also becomes user B's data if B signs in on the same device.
- The AI tool executor bypasses `mutate`. It saves to the legacy key and re-hydrates the whole doc (`AitorChatModal.tsx:400-414`), which drops concurrent CRDT edits. This is live only when `AI_TOOLS_ENABLED=true` or on the browser-direct path.
- Lower severity items:
  - CSP `script-src` allows `unsafe-eval` and `unsafe-inline`.
  - `server-rate-limiter.ts:56-63` runs INCR and EXPIRE non-atomically, which can leave a key with no TTL.
  - `allotment_history` has no retention.
  - Malformed JSON returns 500 instead of 400 on the share and advisor routes.
  - It is unverified whether Sentry client init is dead under Turbopack; there is no `instrumentation-client.ts` and no `onRequestError`.

User-visible bugs (domain and UI slices):

- The frost banner never lists plants. `TodayDashboard.tsx:92` reads `getVegetableByIdCached`, whose cache is only filled by functions with zero callers.
- Date-based tasks are off by one day. `new Date('YYYY-MM-DD')` parses as UTC midnight in `task-generator.ts:149,183,251` and is compared against a local time-of-day "now", so a harvest due today reads "Overdue by 1 days". The tests mask this by using UTC-midnight `today`.
- Sow windows that wrap the year (`[11,12,1,2,3]`, five berry crops) collapse to Jan–Dec in `date-calculator.ts:428-434`.
- Tablets between 768 and 1023px get no area detail and no Add Planting button. The sidebar is `hidden lg:block` while the mobile sheet requires `innerWidth < 768`.
- The mobile bottom sheet has drifted from the desktop panels: it has no harvest tracker or care log for perennials, and no Escape or focus trap.
- Smaller UI bugs:
  - AddPlantingForm refills a cleared variety when exactly one saved variety exists.
  - The Seeds page never applies its "latest year" default because data is null on first render.
  - Escape on a nested dialog closes the parent too.
  - `text-zen-ink-500` is built dynamically and never generated.
  - The preserve nudge ignores the year.
  - `planting-utils.formatDate` shows the previous day west of UTC.
- `tsconfig.sw.json` inherits the root exclude of `src/app/sw.ts`, so the service worker is never type-checked (TS18003).

## Decisions needed before Wave 1

These change scope. Each has a recommended default. A resuming session asks all unanswered ones together and records the user's answer in the last column.

| # | Decision | Recommendation | Gates | Answer |
|---|---|---|---|---|
| D1 | Share/receive flow | Delete `components/share`, `app/receive/**`, `app/api/share/**`, `qrcode.react` and `html5-qrcode`. The sender UI has been unmounted for six months, and Yjs cloud sync now covers moving data between devices. This also makes the share-route hardening findings moot | WP-06 | |
| D2 | AI tool calling | Delete the executor, schema, `ToolCallConfirmation` and the modal glue (about 1,500 lines) unless `AI_TOOLS_ENABLED=true` in production. Keep the chat and the Gemini free tier | WP-07 | |
| D3 | Flagged-off features (`SHOW_ROTATION_SUGGESTIONS`, `SHOW_UNDERPLANTINGS`, `SHOW_ADVANCED_AREA_FIELDS`), off since #258 | Delete the gated code, inline `SHOW_CARE_LOGS=true`, and remove `release-visibility.ts` | WP-08 | |
| D4 | Should account deletion also delete the Clerk user? Also, the CSP only allows `*.clerk.accounts.dev`, which suggests production may be on a Clerk dev instance | Delete the Clerk user too, and check the production publishable key | WP-13, WP-22 | |
| D5 | `dependabot-auto-merge.yml` auto-merges non-major bumps, which conflicts with the "never merge autonomously" rule | User's call | WP-05 | |
| D6 | Seeds page default year | The latest year once data loads | WP-16 | |

## Work packages

Each work package (WP) owns an exclusive file set within its wave, so the WPs in a wave can run as parallel agents in separate worktrees. "After" lists hard dependencies, meaning the earlier WP must be merged to main first.

### Wave 0 — urgent fixes and a truthful CLAUDE.md

Fix agents read CLAUDE.md, and parts of it misdirect them. Its storage and Yjs sections are current, but it still says schema v18 when the code is at v23, says Aitor is hidden behind a `SHOW_AI_ADVISOR` flag that no longer exists, claims a y-indexeddb cross-tab broadcast that the library does not have, describes the unmounted Share UI, and lists `storage-core` as localStorage-based. So WP-00 goes first and stays small; the full docs pass is WP-21.

| WP | Goal | Files owned | Done when | Size |
|---|---|---|---|---|
| 00 | Correct the stale CLAUDE.md sections (schema v23, AI advisor and settings tabs, release flags, cross-tab claim, Share, storage-core, component list) | `CLAUDE.md` | Every claim is checked against the code; no mention of deleted modules or flags | S |
| 01 | Server-only atomic AI quota | new `sql/005-ai-usage-lockdown.sql`, `lib/supabase/ai-usage.ts`, `lib/server-rate-limiter.ts`, both AI routes' quota calls | INSERT/UPDATE policies dropped; the counter is Upstash `INCR` with a TTL (or a SECURITY DEFINER RPC); the rate limiter uses an atomic `multi` with `expire NX`; route tests cover quota exhaustion. The user applies the SQL in Supabase | S–M |
| 02 | Year rollover on the Yjs path | `hooks/allotment/useAllotmentData.ts`, `services/season-operations.ts` (read only), new test | A doc with `currentYear=2026` opened with a mocked 2027 clock gets a 2027 season and selects it | S |
| 03 | Local-date correctness | `lib/date-calculator.ts`, `lib/task-generator.ts` (date lines only), `lib/planting-utils.ts` | `parseDate`/`addDays` exported and used everywhere; tests run with a non-midnight local `today` under `TZ=America/New_York`; wrap-around windows handled; month names in messages; the preserve nudge compares full dates | S |
| 04 | Frost banner and loader removal | `lib/vegetable-loader.ts` (delete), `TodayDashboard.tsx`, `app/allotment/page.tsx` (imports only), `BedItem.tsx`, `MobileAreaBottomSheet.tsx` (imports only), `BedDetailPanel.tsx` (imports only), `lib/vegetable-database.ts` | Banner test lists a tender planting; `getVegetableById` backed by a Map | S |
| 05 | Tooling fixes | `tsconfig.sw.json`, `package.json` scripts, `postcss.config.js`, `.github/workflows/ci.yml`, `codeql.yml`, `tests/*.json` fixtures | `type-check` covers `sw.ts`; `test:firefox`/`test:webkit` removed; autoprefixer dropped; `react-resizable` and `axe-core` declared; lint and type-check merged into one CI job; the redundant plant-data job dropped; `concurrency` added; CodeQL uses `build-mode: none` | S |

### Wave 1 — delete dead weight (after the decisions)

Deletions cascade, so each WP reruns knip at the end and deletes anything it newly orphaned inside its own file set.

| WP | Goal | Files owned | After | Size |
|---|---|---|---|---|
| 06 | Delete share/receive (decision 1) | `components/share/**`, `app/receive/**`, `app/api/share/**`, their tests, share deps in `package.json`, ADR 024 status line | 05 | M |
| 07 | Delete AI tool calling, the browser-direct/GitHub Pages path, the client rate limiter and the logger queue; extract a shared `runFreeTierGemini()`; dedupe the system prompt; return 400 on bad JSON (decision 2) | `services/ai-tool-executor.ts`, `lib/ai-tools-schema.ts`, `components/ai-advisor/**`, `lib/openai-client.ts`, `lib/rate-limiter.ts`, `lib/logger.ts`, `app/api/ai-advisor/**`, `app/api/season-narration/**`, `next.config.mjs` (Pages branches), `.github/workflows/deploy.yml`, `public/.nojekyll` | 01 | M |
| 08 | Delete dead UI and flags (decision 3): `shadcn-dialog`, `AIInsight`, `ai-suggestions`, `UnderplantingsList`, the auto-rotate dialog and memos, AddAreaForm's advanced fields and `release-visibility.ts` | `app/allotment/page.tsx`, `components/allotment/**` except the WP-04 import lines, `components/dashboard/AIInsight.tsx`, `lib/ai-suggestions.ts`, `components/ui/shadcn-dialog.tsx`, `config/release-visibility.ts`, `SeasonStatusWidget.tsx` | 04 | M |
| 09 | Delete the dead domain layer: most of `rotation.ts`, `historical-plans.ts`, `my-varieties.ts`, the empty arrays in `allotment-layout.ts`, dead `companion-validation` and `companion-utils` exports, grid-planner types and dead `vegetable-database`/`index` exports | those files plus `types/garden-planner.ts` and their test blocks | 08 | M |
| 10 | Delete the immutable service write layer: every writer with no production caller, legacy query wrappers, `storage-ops`, `persistence-signal`, dead migration and backup helpers, `hooks/allotment/index.ts` | `services/**`, `lib/storage-ops.ts`, `lib/persistence-signal.ts`, `lib/storage-utils.ts` (dead exports only), `__tests__/services/**` | 07 (the executor was the last caller) | L |

### Wave 2 — structural simplification and sync correctness

The sync lane is strictly sequential because every step touches `useYjsDoc` and `useCloudSync`. The UI and domain lanes run in parallel with it.

| WP | Lane | Goal | After | Size |
|---|---|---|---|---|
| 11 | sync | A single `AllotmentProvider` in `layout.tsx` owning the doc, cloud sync, `selectedYear` and status; `useAllotment` becomes a thin selector and loses its 31 unused members; the push-skip is driven by a local-edit counter instead of `isSyncedFromOtherTab` | 02, 10 | M |
| 12 | sync | Adoption preserves local edits: union by id after `adoptRemoteUpdate`, reusing the keying in `dedupe.ts`; the harness scenario "first sync fails, user edits" ends with the edit on the remote | 11 | M |
| 13 | sync | Replace-data correctness: import, restore, cloud-history restore and receive (if kept) call `replaceFromJson(migrateSchemaForImport(json))` on the live lineage; the backup is taken from the live doc; account deletion clears history, `ai_usage`, IndexedDB and the lineage flag, then reloads; user switch clears local state; the `whenReady` schema-version hook is added; the non-existent y-indexeddb cross-tab broadcast is fixed or documented correctly | 12, 01 | M |
| 14 | UI | One detail surface: delete `MobileAreaBottomSheet`, render `ItemDetailSwitcher` inside `<Dialog variant="bottom-sheet">` below `lg`, add a single `useIsMobile()`, and fix the tablet gap | 08 | M |
| 15 | UI | Merge AddAreaForm and EditAreaForm into `AreaForm`, and inline or delete `useFormState` | 14 | M |
| 16 | UI | Page extractions, one sub-agent per page: this-month (inline components into `components/this-month/`, memos into `lib/month-plan.ts`, and the almanac and tips folded into one disclosure); seeds (`VarietyRow`, `SuppliersSection`, the default-year fix and nested-interactive a11y); compost (`PileCard` and self-contained dialogs); allotment (`YearSelector`) | 14 for allotment only | M |
| 17 | UI | Dialog Escape stack, AddPlantingForm variety refill, static Tailwind class maps, care-log delete button a11y | 14 | S |
| 18 | domain | Split `task-generator.ts` into a directory; remove the no-op `deduplicateTasks`, dead exports, never-passed `areaId` args and the triple status filter; `TaskList` uses `getTaskLabel` | 03 | M |
| 19 | domain | One `MONTH_NAMES` source (8 copies today); `season-review/dates.ts`; merge `seasons.ts` into `seasonal-theme.ts` with 1-indexed months; derive the rotation inverse map; collapse the `companion-utils` loops | 09 | S |

### Wave 3 — hardening, tests and docs

| WP | Goal | Size |
|---|---|---|
| 20 | Tests: shared `src/__tests__/fixtures/allotment.ts` replacing about 17 local factories; `environment: 'node'` for `lib/**` tests (jsdom is 66% of test time); direct tests for `useDataTransfer`, `useAllotmentPlantings`, `useAllotmentVarieties` and the middleware; un-skip or delete `tests/ai-advisor.spec.ts`; recheck coverage thresholds after the deletions | M |
| 21 | Docs: `current-plan.md` cut from 1,099 lines to under 100 lines of open work; delete the shipped plans (`season-observer.md`, `compost-love.md`), stale research docs, the superpowers Step 3 spec and `blog-draft.md`; mark ADRs 002, 008 and 024 superseded by 027; renumber the duplicate `sql/004-*`; final CLAUDE.md pass; delete this file | M |
| 22 | Security hardening: drop `unsafe-eval` in production and move toward nonces; Sentry `instrumentation-client.ts` and `onRequestError` (verify with a real build); `allotment_history` retention job | M |
| 23 | Middleware to `proxy.ts` for the Next 16 convention (verify with a build first) | S |

## The agent loop

An orchestrator session drives the waves. For each ready WP (decisions settled and every "after" merged), it spawns one implementer agent in its own worktree off the latest main. The prompt contains the WP row, the evidence section above and these rules. For a bug, write the failing test first and show it failing. Touch only the owned files. Run `npm run type-check`, `npm run lint` and `npm run test:unit`, plus the relevant Playwright spec when UI changes. Rerun knip for the owned files. Open a draft PR with a two-sentence description. A separate reviewer agent then does an adversarial pass on the diff: it runs the tests, fact-checks every claim against the code and looks for callers the deletion missed. The implementer addresses the findings. The orchestrator never merges; the user merges each PR. After each merge, the orchestrator updates the status table below and releases any WP whose dependencies are now satisfied.

The loop's exit metric is measured, not estimated. After each wave, record the non-test TS line count, knip's unused-export count, the unit-test count and the unit-test wall time against the baseline (60.4k lines, 1510 tests, 43s).

## Status

| WP | State | PR |
|---|---|---|
| 00–05 | ready | |
| 06–10 | waiting on decisions | |
| 11–19 | blocked by dependencies | |
| 20–23 | blocked by Wave 2 | |
