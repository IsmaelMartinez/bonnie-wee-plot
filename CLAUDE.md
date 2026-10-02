# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bonnie Wee Plot is a Next.js 16 application for garden planning and AI-powered gardening advice, built with React 19 and TypeScript. Users can plan their allotment plots, track plantings across seasons, and get advice from "Aitor" - an opt-in AI gardening assistant for signed-in users (server-side Gemini free tier, the user's own OpenAI key, or a server OpenAI key fallback).

## Commands

### Development
```bash
npm run dev          # Start development server at localhost:3000
npm run build        # Production build
npm run start        # Start production server (after build)
npm run analyze      # Build with bundle analyzer (ANALYZE=true)
npm run lint         # ESLint
npm run type-check   # TypeScript type checking (tsc --noEmit)
```

### Testing
```bash
npm run test:unit            # Run Vitest unit tests (src/__tests__/)
npm run test:unit:watch      # Unit tests in watch mode
npm run test:unit:coverage   # Unit tests with coverage report
npm run test                 # Run Playwright e2e tests (tests/)
npm run test:ui              # Playwright with the UI runner
npm run test:debug           # Playwright in debug mode
npm run test:headed          # Playwright with browser visible
npm run test:chrome          # Playwright chromium project (the only configured project)
npm run test:all             # Run both unit and e2e tests
```

Run a single unit test:
```bash
npx vitest run src/__tests__/lib/rate-limiter.test.ts
```

Run a single Playwright test:
```bash
npx playwright test tests/homepage.spec.ts
```

## Architecture

### Data Model

The app uses a unified data model held in a Yjs document persisted to IndexedDB (`bwp-allotment-yjs`, see the Yjs Storage Engine section); the legacy localStorage key `allotment-unified-data` is only the first-run seed and the hand-off for flows that write JSON there and then re-hydrate the doc (backup restore, Clear Local Data, cloud-history restore and AI tool execution call `reload()`; file import and receive clear the Yjs IndexedDB and then reload or redirect so the next mount re-seeds). The core types are defined in `src/types/unified-allotment.ts`:

`AllotmentData` is the root structure containing:
- `meta` - allotment name, location, timestamps
- `layout` - unified `Area` system for beds, trees, berries, infrastructure
- `seasons` - array of `SeasonRecord` for each year
- `currentYear` - active year for the UI
- `maintenanceTasks` - care tasks for perennial plants
- `gardenEvents` - log of garden events (pruning, feeding, etc.)
- `varieties` - seed varieties with inventory tracking (single source of truth)
- `compost` - compost pile tracking (integrated from separate storage in v18)

Each `SeasonRecord` contains `AreaSeason` entries that track `Planting` items per area per year.

### Variety Management

Seed varieties are stored exclusively in `AllotmentData.varieties` with computed usage tracking:

- **Single Source of Truth**: All variety data lives in `AllotmentData.varieties`
- **Computed Queries**: Year usage computed dynamically from plantings via `getVarietyUsedYears()`
- **Soft Delete**: Varieties use `isArchived` flag to preserve references to historical plantings
- **Inventory Tracking**: Per-year seed status (`none`/`ordered`/`have`/`had`) via `seedsByYear`. Setting any status for a year also marks the variety as "planned" for that year.

Query functions in `src/lib/variety-queries.ts`:
- `getVarietyUsedYears(varietyId, data)` - Returns all years a variety was planted
- `getVarietiesForYear(year, data)` - Returns varieties with seedsByYear entry OR actual plantings for a year

### State Management

`useAllotment` hook (`src/hooks/useAllotment.ts`) is the single source of truth for allotment state. It composes the domain hooks in `src/hooks/allotment/` over the Yjs storage engine (`useAllotmentData` → `useYjsDoc`, see ADR 027) and provides:
- CRUD operations for plantings and maintenance tasks (all writes go through `mutate(fn)` against the SyncedStore proxy)
- Year/bed selection
- No live cross-tab sync: `y-indexeddb` (9.x) has no BroadcastChannel, so another open tab only sees local edits after it reloads (or via cloud sync when signed in). `isSyncedFromOtherTab` actually fires for any non-local update, i.e. cloud merges
- Cloud sync + conflict status via `useCloudSync`

### Storage Service

`src/services/allotment-storage.ts` is a barrel file re-exporting from focused modules:
- `storage-core.ts` — read/write of the legacy `allotment-unified-data` localStorage blob and `initializeStorage()`, which `useYjsDoc` uses to seed the doc on first run and `reload()` uses to re-hydrate after a restore or AI tool execution writes that key (file import and receive instead clear the Yjs IndexedDB so the next mount re-seeds from it). It is not the live store
- `storage-validation.ts` — schema validation and data repair
- `storage-migrations.ts` — schema migrations (current version: 23, minimum supported: 16), backup/restore, legacy migration
- `season-operations.ts` — season CRUD and year management
- `planting-operations.ts` — planting CRUD, area season helpers, notes, garden events
- `area-queries.ts` — area lookups, filtering by kind, legacy compatibility wrappers
- `area-mutations.ts` — area CRUD, care logs, harvest tracking
- `variety-operations.ts` — variety CRUD, seed inventory, supplier queries
- `task-operations.ts` — custom tasks and maintenance tasks
- `compost-operations.ts` — compost pile CRUD, inputs, events, and queries over `AllotmentData.compost`
- `generic-storage.ts` — raw localStorage utilities
- `photo-store.ts` — care-log photo blobs in a separate plain IndexedDB database (not in the Yjs doc; not re-exported by the barrel)

All existing imports from `@/services/allotment-storage` continue to work unchanged via the barrel file. These service functions are pure (they return new data); live writes from hooks go through `mutate(fn)` on the Yjs store, and `flushSave()` awaits IndexedDB persistence.

### Date Calculator

`src/lib/date-calculator.ts` provides personalized date calculations:
- `calculatePlantingDates()` - Forward calculation from sow date to expected harvest
- `calculateSowDateForHarvest()` - Backward calculation from target harvest to sow date
- `validateSowDate()` - Validates against plant's growing window
- Scotland-specific fall factor adjustment for autumn plantings

### Task Generator

`src/lib/task-generator.ts` generates automatic tasks for the Today dashboard based on plantings, areas, seed varieties, and the current month. Task types include harvest, sow-indoors, sow-outdoors, transplant, prune, feed, water, mulch, succession, and care-tip. Date-based tasks (from actual sow dates) take priority over month-based tasks (from the vegetable database calendar). Care tips (`careTips` on `Vegetable`) provide lifecycle-aware seasonal advice for perennials, filtered by month and the plant's `PerennialStatus` (establishing/productive/declining) via `calculatePerennialStatus()`. See ADR 025.

### Vegetable Database

Split into index, per-category data files, and lazy loader for performance:
- `src/lib/vegetables/index.ts` - lightweight index for dropdowns/search
- `src/lib/vegetables/data/*.ts` - 17 per-category files (leafy-greens, root-vegetables, brassicas, etc.)
- `src/lib/vegetable-database.ts` - combines all category files into single array
- `src/lib/vegetable-loader.ts` - per-category dynamic imports for code splitting

### Preserving Guides

Rich per-crop preservation guidance (method how-tos, storage life, free online resource links, recipe ideas) for the `/preserving` page, building on the lightweight `Vegetable.storage` field:
- `src/types/preservation.ts` - `PreservationGuide` types
- `src/lib/preservation/index.ts` - aggregator and lookups
- `src/lib/preservation/resources.ts` - shared fetch-verified free resources (NCHFP, RHS, Garden Organic, BBC Food, etc.)
- `src/lib/preservation/data/*.ts` - per-category guide files (parallel-authoring-safe)

Authoring spec: `src/lib/preservation/data/README.md`. All categories are fully authored (~157 crops). Plant detail pages cross-link to `/preserving?plant=<id>` (deep link expands that crop's card) when a guide exists. A coverage test (`src/__tests__/lib/preservation-coverage.test.ts`) asserts every crop whose `storage.methods` include a preserve method (freeze/jam/pickle/ferment/dry) has a guide.

### Key Type Definitions

`src/types/garden-planner.ts` defines:
- `PhysicalBedId` - bed identifiers (A, B1, B2, C, D, E, etc.)
- `RotationGroup` - crop rotation categories
- `Vegetable` - plant definition with planting/care info, including `PerennialInfo` for perennial lifecycle tracking and `careTips` for month-tagged seasonal advice

`src/types/unified-allotment.ts` defines:
- `Area` - unified type for all allotment areas (beds, trees, berries, infrastructure)
- `AreaKind` - discriminator for area types (`rotation-bed`, `perennial-bed`, `tree`, `berry`, `herb`, `infrastructure`, `other`)
- `Planting` - instance of a plant in an area, with sow method tracking (`indoor`/`outdoor`/`transplant-purchased`), expected harvest dates (calculated), and actual harvest dates
- `PrimaryPlant` - permanent plants (trees, berries) with perennial lifecycle status tracking
- `StoredVariety` - seed variety with per-year inventory status
- `AreaSeason.gridPosition` - per-year grid layout positions (schema v14)

### Data Sharing

The share/receive flow (temporary Upstash Redis upload, 6-character code, QR) is effectively dormant. The sender UI, `src/components/share/ShareDialog.tsx`, has not been mounted anywhere since #255, so no user can create a share code. What remains reachable only by direct URL:

- `src/app/api/share/route.ts` - POST: Upload data, returns 6-char code
- `src/app/api/share/[code]/route.ts` - GET: Retrieve data by code
- `src/app/receive/page.tsx` - Code entry and QR scanner (`html5-qrcode`)
- `src/app/receive/[code]/page.tsx` - Preview and import confirmation (writes the legacy localStorage key)

Cross-device sync is now the Supabase cloud sync below. **Environment:** the share routes need `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. See `docs/adrs/024-p2p-sync-architecture.md` for decision history.

**Settings Page:** `/settings` has up to three tabs. "AI & Location" (Aitor on/off toggle, free-quota display, optional BYO OpenAI key, geolocation) is rendered only when signed in and is the landing tab then. Data (export/import, cloud history when signed in, Danger Zone with "Clear Local Data", plus account deletion when signed in) and Help (guided tours) are always shown.

### Authentication (Clerk)

Opt-in user authentication via `@clerk/nextjs`. `ClerkProvider` wraps the app in `src/app/layout.tsx`. The middleware (`src/middleware.ts`) uses `clerkMiddleware` with CSP headers allowing Clerk and Supabase domains. All routes remain public — auth is opt-in for cloud sync.

Sign-in/sign-up pages at `/sign-in` and `/sign-up` use Clerk's pre-built components with catch-all routes. Navigation shows `UserButton` when signed in, "Sign in" link when not. Account deletion is in the Settings Data tab's Danger Zone (visible when signed in).

Environment: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`.

### Cloud Persistence (Supabase)

Cloud sync exchanges the Yjs document as **binary CRDT state**, not full-JSON last-write-wins (ADR 027 Step 4). Concurrent edits across devices merge via `Y.applyUpdate` instead of one side overwriting the other; there is no conflict dialog. Storage is the `allotments` table (schema in `sql/001-allotments.sql` + `sql/004-allotment-yjs.sql`): `yjs_state BYTEA` holds the encoded doc (authoritative), `yjs_updated_at TIMESTAMPTZ` is the optimistic-concurrency (CAS) token, and `data JSONB` is kept as a derived read-only mirror written on every push (so the history trigger, GDPR export, and Studio inspection keep working). Row Level Security restricts access via the Clerk JWT `sub` claim; the existing per-row policies cover the new columns.

The sync architecture layers: `useAllotment` -> `useAllotmentData` -> (`useYjsDoc` for local IndexedDB persistence + `useCloudSync` for Supabase). `useCloudSync` (`src/hooks/useCloudSync.ts`) drives the binary transport: on a device's first sync it **adopts** the canonical cloud lineage (loads the cloud binary into a fresh doc that replaces the seeded local one, resetting IndexedDB) so independently-hydrated local docs converge on one lineage — a prerequisite for duplicate-free merge; thereafter it fetches, `Y.applyUpdate`-merges, and pushes the merged state with CAS retry (30s push debounce, unload flush). The one-time JSONB→binary migration runs lazily per user on first sync and is serialised to a single lineage by the CAS write (`bwp-yjs-synced-<userId>` flag marks adoption). Reconnection triggers a re-sync via `useNetworkStatus.justReconnected`. The LWW machinery (`contentSnapshot`, `isLocalStructurallySmaller`, `SyncConflict`, `SyncConflictDialog`, the `'conflict'` status) was retired here.

**Duplicate-free convergence safety net.** Adoption keeps every device on one canonical lineage, but the `bwp-yjs-synced-<userId>` flag is not a guaranteed proxy for "my local doc shares the cloud's history" — it can desync (IndexedDB evicted while localStorage survives, a blocked IDB delete during adoption, two tabs seeding independent lineages on first run), and a CRDT merge of two same-content lineages duplicates every id'd entity (beds, plantings, compost, varieties, seasons). `dedupeAllotmentData` (`src/lib/yjs/dedupe.ts`) is the id-keyed convergence guarantee that does not depend on the gate holding: it collapses duplicated entities back to a single copy (seasons keyed by `year`, plantings unioned so none are lost). `useYjsDoc` runs `dedupeStore` after every `mergeRemoteUpdate`/`adoptRemoteUpdate` and on load; the repair is a real Yjs delete, so it propagates to the cloud and every device. It is idempotent and a no-op on a healthy document — a clean doc is never rewritten.

The Supabase client module (`src/lib/supabase/client.ts`) provides `createAnonClient()`, `createAuthClient(token)`, and `isSupabaseConfigured()`. The binary sync service (`src/lib/supabase/sync-binary.ts`) provides `fetchRemoteBinary()`, `pushBinary()` (CAS + retry), and the bytea hex codec; the JSON service (`src/lib/supabase/sync.ts`) keeps `fetchRemote()` / `deleteRemote()` (GDPR export + history) and the `fetchHistory*` helpers. Deployment steps (including pre-migration history-row seeding) are in `docs/runbooks/adr-027-step-4-yjs-binary-migration.md`.

Environment: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. A Clerk JWT template named "supabase" must be created in the Clerk Dashboard (JWT Templates > New template > Supabase preset). The template claims should be `{ "aud": "authenticated", "role": "authenticated", "email": "{{user.primary_email_address}}" }` — do not include `sub` as it is a reserved claim that Clerk sets automatically to the user ID. The signing key must be the Supabase JWT Secret (Project Settings > API > JWT Secret), algorithm HS256. The RLS policies in `sql/001-allotments.sql` use `auth.jwt() ->> 'sub'` to match rows to users.

### Yjs Storage Engine (ADR 027)

`src/lib/yjs/allotment-yjs.ts` maps `AllotmentData` onto a Yjs document via SyncedStore (`@syncedstore/core`). It exports `createAllotmentDoc`, `hydrateFromJson`, `serializeToJson`, `encodeDocState` / `decodeDocState` for the BYTEA round-trip, `clearAllotmentStore` (empty every container — used by hydrate), `dedupeStore` (id-keyed duplicate collapse — the CRDT-merge safety net, see the Cloud Persistence section), and the shared write-site helpers `withoutUndefined` / `assignDefined` used by the domain hooks. This is the canonical local storage engine: `useYjsDoc` (`src/hooks/useYjsDoc.ts`) owns the `Y.Doc`, the `y-indexeddb` persistence provider, and the published `AllotmentData` snapshot; `useAllotmentData` composes it with `useCloudSync`. Domain-hook mutations write through `mutate(fn)` against the SyncedStore proxy. For the Step 4 cloud transport, `useYjsDoc` also exposes `encodeState` (encode the doc for a push), `mergeRemoteUpdate` (CRDT-merge a remote update), `adoptRemoteUpdate` (load remote into a fresh doc + swap — first-sync lineage adoption, avoiding the Y.Map key-clientID race that clearing in place would hit), `getSnapshot` (live snapshot on demand), and `hasUpdatesBeyond` (skip a redundant push on a pure pull).

`serializeToJson` and `decodeDocState` are permanent infrastructure — they back the rollback path (decode binary → JSON → restore), the GDPR `/api/account` export (which returns JSON from the `data` mirror, and can decode `yjs_state` if the mirror is ever dropped), and per-user binary debugging. Do not delete them. On first run, `useYjsDoc` seeds the doc via `initializeStorage()`, which reads and migrates the legacy `allotment-unified-data` localStorage key or creates and persists a fresh default allotment on a brand-new device (the same seed the pre-Step-5 legacy chain produced). Mutations then persist to IndexedDB, not localStorage — the legacy debounced-save mirror into that key was removed in Step 5, so tests must observe state via the UI or IndexedDB rather than reading that key.

### GDPR Compliance

`GET /api/account` exports user data as JSON download. `DELETE /api/account` deletes the Supabase row. Both require Clerk authentication. No UI calls the GET export; the Settings Data tab's Transfer section exports a local JSON backup file, and its Danger Zone calls `DELETE /api/account` for account deletion (signed in only).

### AI Advisor

Aitor is opt-in per user. `AitorAuthGate` (`src/components/ai-advisor/AitorAuthGate.tsx`, mounted in `src/app/layout.tsx`) renders the floating chat button and modal only when the user is signed in and `meta.aiAdvisorEnabled === true` (toggled in Settings > AI & Location or the Today dashboard opt-in banner). It is not in the navigation; `/ai-advisor` just opens the chat and redirects to `/`.

`src/app/api/ai-advisor/route.ts` is a Next.js API route that:
- Requires Clerk auth (401 otherwise) and applies a short-window per-user rate limit
- Accepts user messages and optional plant images
- Picks a provider in order: BYO `x-openai-token` header (no quota) → server `GEMINI_API_KEY` (free tier, per-user monthly quota from `src/lib/supabase/ai-usage.ts`) → server `OPENAI_API_KEY`
- On OpenAI paths uses gpt-4o for vision and gpt-4o-mini for text
- Includes allotment context in system prompt when provided
- Supports function calling for data modification only when `AI_TOOLS_ENABLED=true` and on an OpenAI provider

### AI Tool Execution

`src/services/ai-tool-executor.ts` handles AI-initiated data modifications:
- Executes tool calls from AI responses (add_planting, update_planting, remove_planting, list_areas)
- Requires user confirmation via `ToolCallConfirmation` component before execution (applied in `AitorChatModal` via `saveAllotmentData`, i.e. the legacy localStorage key)
- Supports area name resolution (e.g., "Bed A" instead of internal IDs)
- Tool schema defined in `src/lib/ai-tools-schema.ts`

### Onboarding

`src/components/onboarding/OnboardingWizard.tsx` - 3-screen welcome for new users:
1. Welcome with two paths (explore/plan)
2. Contextual guidance based on chosen path
3. Success confirmation with next steps

### Component Organization

- `src/components/allotment/` - allotment grid, bed items, area/planting forms, `details/` panels (bed, permanent, infrastructure, care log, harvest)
- `src/components/dashboard/` - Today dashboard (task list, weather, frost and Aitor opt-in banners)
- `src/components/garden-planner/` - `UnifiedCalendar` only
- `src/components/ai-advisor/` - Aitor chat (auth gate, modal, tool-call confirmation)
- `src/components/settings/` - Settings Data tab, cloud history, AI quota
- `src/components/onboarding/` - wizard and guided tours
- `src/components/auth/`, `plants/`, `seeds/`, `season-review/` - feature-specific pieces
- `src/components/testing/` - `E2ETestBridge` for Playwright
- `src/components/share/` - unmounted `ShareDialog` (see Data Sharing)
- `src/components/ui/` - shared UI components (Dialog, Tabs, Toast, OfflineIndicator, StorageWarningBanner)

### Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)

### Release Visibility Config

`src/config/release-visibility.ts` exports boolean constants that gate advanced features (most are off for the first release). Current values:

- `SHOW_ROTATION_SUGGESTIONS = false` — auto-rotate button/dialog and "X/Y to rotate" in season widget
- `SHOW_ADVANCED_AREA_FIELDS = false` — Short ID and Built-in-year fields in Add Area form
- `SHOW_CARE_LOGS = true` — care log section in permanent area detail panels
- `SHOW_UNDERPLANTINGS = false` — underplantings list in permanent area detail panels

Import the relevant constant and wrap advanced JSX in `{SHOW_X && (...)}`. Props, imports, state, and logic stay untouched — only rendering is gated.

## Migration and Backward Compatibility

The app supports automatic schema migration for users on older data versions (`migrateSchema` in `src/services/storage-migrations.ts`). Current schema is v23 (`CURRENT_SCHEMA_VERSION` in `src/types/unified-allotment.ts`). Data on v16-v22 migrates automatically with a backup created first; data older than v16 (`MINIMUM_SUPPORTED_VERSION`) is rejected and needs a fresh start. Migration runs when the legacy JSON is seeded or imported, not on the live Yjs doc.

### Key Schema Milestones

- **v23**: Season Observer — observation care-log types (germinated, thinned, flowering, pest, disease, bolted, damage), `CareLogEntry.severity`/`photoId`/`plantingId`, `Planting.endedOn` (no data transform)
- **v22**: `meta.aiAdvisorEnabled` and `meta.aiAdvisorPromptDismissedAt` for Aitor opt-in (no data transform)
- **v21**: `meta.frostDates` for frost-aware planning (no data transform)
- **v20**: Repaired planting status drift (stale `planned` promoted to `active`/`harvested` from dates)
- **v19**: `water` care-log type and coordinates for weather-aware watering (no data transform)
- **v18** (2026-03-04): Integrated compost data into AllotmentData (migrates from separate localStorage key)
- **v17**: Added `customTasks` array
- **v16** (2026-01-28): Removed `plannedYears` from `StoredVariety`, simplified to use `seedsByYear` as single source of truth for year tracking
- **v15**: Added `PlantingStatus` for lifecycle tracking
- **v14** (2026-01-23): Moved grid positions to `AreaSeason.gridPosition` for per-year layouts
- **v13** (2026-01-22): Consolidated variety storage from dual localStorage into `AllotmentData.varieties`
- **v12**: Added `SowMethod` tracking and harvest date fields
- **v11**: Synchronized plant IDs to singular form
- **v10**: Unified Area type replacing separate bed/permanent/infrastructure types
- **v9**: Introduced unified area system with underplantings

See `docs/adrs/018-variety-refactor.md` for details on the v13 consolidation. See `docs/adrs/019-per-year-grid-positions.md` for the v14 per-year grid positions feature.

## Design Principle: Simplicity First

**For Users:** Keep each section focused on one clear purpose. Remove or hide complexity that isn't essential to solving the immediate problem. Features that simplify workflows (e.g., AI Advisor modifying data) are prioritized over features that add complexity without clear user benefit (e.g., overly detailed monthly planning, complex compost tracking). When in doubt, remove it or hide it until users demonstrate they need it.

**For Maintainers:** Code should be easy to understand and modify. Prefer simple patterns over clever abstractions. Avoid feature flag sprawl and conditional complexity. Delete unused code, outdated pages, or experimental features regularly. Before adding a new feature, audit the existing codebase for duplication or technical debt that should be addressed first.

**Application:** Each page/section should do one thing well. If a page tries to solve multiple problems, break it into clearer pieces or remove the less essential problem entirely.

## Code Conventions

- When finishing a development branch, always push and create a PR. Do not ask — just do it.
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`
- Use server components where possible; `'use client'` only when needed
- Tailwind CSS for styling
- Playwright tests must pass before pushing
- Test files: unit tests in `src/__tests__/`, e2e tests in `tests/`
- Immutable update patterns: storage functions return new data, never mutate

## Current Plan

`docs/plans/current-plan.md` is the single source of truth for what's been completed and what to work on next. Update it after completing significant work. Research documents in `docs/research/` provide detailed context when needed.

## Documentation Hygiene

- Plan files in `docs/plans/` are temporary working documents - delete them after implementation is complete (except `current-plan.md` which is kept up to date)
- Research documents in `docs/research/` should be reviewed periodically and removed when obsolete
- ADRs preserve decisions but can be consolidated/merged when multiple related decisions become hard to follow
- Keep documentation minimal and current; avoid accumulating stale artifacts

## Repo Butler

This repo is monitored by [Repo Butler](https://github.com/IsmaelMartinez/repo-butler), a portfolio health agent that observes repo health daily and generates dashboards, governance proposals, and tier classifications.

**Your report:** https://ismaelmartinez.github.io/repo-butler/bonnie-wee-plot.html
**Portfolio dashboard:** https://ismaelmartinez.github.io/repo-butler/
**Consumer guide:** https://github.com/IsmaelMartinez/repo-butler/blob/main/docs/consumer-guide.md

### Querying Reginald (the butler MCP server)

To query your repo's health tier, governance findings, and portfolio data from any Claude Code session, add the MCP server once (adjust the path to your local repo-butler checkout):

```bash
claude mcp add repo-butler node /path/to/repo-butler/src/mcp.js
```

Available tools: `get_health_tier`, `get_campaign_status`, `query_portfolio`, `get_snapshot_diff`, `get_governance_findings`, `trigger_refresh`.

When working on health improvements, check the per-repo report for the current tier checklist and use the consumer guide for fix instructions.

If this repo deploys a page, set its GitHub repository Homepage URL (the Website field in the repo's About section — not `package.json`'s `homepage`) to the canonical URL. That's how repo-butler surfaces the deployed link in dashboards and agent cards.
