# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bonnie Wee Plot is a Next.js 16 application for garden planning and AI-powered gardening advice, built with React 19 and TypeScript. Users can plan their allotment plots, track plantings across seasons, and get advice from "Aitor" - an AI gardening assistant powered by OpenAI (BYO API key).

## Commands

### Development
```bash
npm run dev          # Start development server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript type checking (tsc --noEmit)
```

### Testing
```bash
npm run test:unit           # Run Vitest unit tests (src/__tests__/)
npm run test:unit:watch     # Unit tests in watch mode
npm run test                # Run Playwright e2e tests (tests/)
npm run test:headed         # Playwright with browser visible
npm run test:all            # Run both unit and e2e tests
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

The app uses a unified data model stored in localStorage under `allotment-unified-data`. The core types are defined in `src/types/unified-allotment.ts`:

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

`useAllotment` hook (`src/hooks/useAllotment.ts`) is the single source of truth for allotment state. It wraps the storage service and provides:
- CRUD operations for plantings and maintenance tasks
- Year/bed selection
- Multi-tab sync via storage events
- Debounced saves with status tracking

### Storage Service

`src/services/allotment-storage.ts` is a barrel file re-exporting from focused modules:
- `storage-core.ts` — localStorage read/write, initialization
- `storage-validation.ts` — schema validation and data repair
- `storage-migrations.ts` — schema migrations (current version: 18), backup/restore, legacy migration
- `season-operations.ts` — season CRUD and year management
- `planting-operations.ts` — planting CRUD, area season helpers, notes, garden events
- `area-queries.ts` — area lookups, filtering by kind, legacy compatibility wrappers
- `area-mutations.ts` — area CRUD, care logs, harvest tracking
- `variety-operations.ts` — variety CRUD, seed inventory, supplier queries
- `task-operations.ts` — custom tasks and maintenance tasks
- `generic-storage.ts` — raw localStorage utilities

All existing imports from `@/services/allotment-storage` continue to work unchanged via the barrel file. Immutable update patterns, Promise-based `flushSave()`, and automatic backup creation before imports are preserved.

### Date Calculator

`src/lib/date-calculator.ts` provides personalized date calculations:
- `calculatePlantingDates()` - Forward calculation from sow date to expected harvest
- `calculateSowDateForHarvest()` - Backward calculation from target harvest to sow date
- `validateSowDate()` - Validates against plant's growing window
- Scotland-specific fall factor adjustment for autumn plantings

### Task Generator

`src/lib/task-generator.ts` generates automatic tasks for the Today dashboard based on plantings, areas, seed varieties, and the current month. Task types include harvest, sow-indoors, sow-outdoors, transplant, prune, feed, mulch, succession, and care-tip. Date-based tasks (from actual sow dates) take priority over month-based tasks (from the vegetable database calendar). Care tips (`careTips` on `Vegetable`) provide lifecycle-aware seasonal advice for perennials, filtered by month and the plant's `PerennialStatus` (establishing/productive/declining) via `calculatePerennialStatus()`. See ADR 025.

### Vegetable Database

Split into index, per-category data files, and lazy loader for performance:
- `src/lib/vegetables/index.ts` - lightweight index for dropdowns/search
- `src/lib/vegetables/data/*.ts` - 17 per-category files (leafy-greens, root-vegetables, brassicas, etc.)
- `src/lib/vegetable-database.ts` - combines all category files into single array
- `src/lib/vegetable-loader.ts` - per-category dynamic imports for code splitting

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

The app supports sharing allotment data between devices via a simple share/receive flow using temporary cloud storage:

**Share Flow (Sender):**
1. Go to Settings > Share My Allotment
2. Data uploads to Upstash Redis (expires in 5 minutes)
3. QR code and 6-character code displayed
4. Share with receiving device

**Receive Flow (Receiver):**
1. Scan QR or enter code at `/receive`
2. Preview shared data (name, planting count, etc.)
3. Confirm import - replaces local data with automatic backup

**API Routes:**
- `src/app/api/share/route.ts` - POST: Upload data, returns 6-char code
- `src/app/api/share/[code]/route.ts` - GET: Retrieve data by code

**UI Components:**
- `src/components/share/ShareDialog.tsx` - QR and code display dialog
- `src/app/receive/page.tsx` - Code entry and QR scanner (uses `html5-qrcode` for cross-browser compatibility)
- `src/app/receive/[code]/page.tsx` - Preview and import confirmation

**Settings Page:** `/settings` has three tabs: AI & Location (API key, geolocation), Data (transfer, share, danger zone with account deletion), and Help (guided tours).

**Environment:** Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for the share feature.

See `docs/adrs/024-p2p-sync-architecture.md` for decision history.

### Authentication (Clerk)

Opt-in user authentication via `@clerk/nextjs`. `ClerkProvider` wraps the app in `src/app/layout.tsx`. The middleware (`src/middleware.ts`) uses `clerkMiddleware` with CSP headers allowing Clerk and Supabase domains. All routes remain public — auth is opt-in for cloud sync.

Sign-in/sign-up pages at `/sign-in` and `/sign-up` use Clerk's pre-built components with catch-all routes. Navigation shows `UserButton` when signed in, "Sign in" link when not. Account deletion is in the Settings Data tab's Danger Zone (visible when signed in).

Environment: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`.

### Cloud Persistence (Supabase)

Supabase stores AllotmentData as a JSONB document per user in the `allotments` table (schema in `sql/001-allotments.sql`). Row Level Security restricts access via Clerk JWT `sub` claim.

The sync architecture layers: `useAllotment` -> `useAllotmentData` -> `useSyncedStorage` -> `usePersistedStorage` (localStorage). The `useSyncedStorage` hook (`src/hooks/useSyncedStorage.ts`) adds cloud sync when authenticated. On first sync for a device (no `bonnie-synced-{userId}` flag in localStorage), cloud data always wins — this prevents empty/bootstrap local data from overwriting cloud state when signing in on a new browser. On subsequent syncs (flag exists), LWW on `meta.updatedAt` handles offline edits. Saves push asynchronously to Supabase, and reconnection triggers a re-sync via `useNetworkStatus.justReconnected`.

The Supabase client module (`src/lib/supabase/client.ts`) provides `createAnonClient()`, `createAuthClient(token)`, and `isSupabaseConfigured()`. The sync service (`src/lib/supabase/sync.ts`) provides `fetchRemote()`, `pushToRemote()`, and `deleteRemote()`.

Environment: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. A Clerk JWT template named "supabase" must be created in the Clerk Dashboard (JWT Templates > New template > Supabase preset). The template claims should be `{ "aud": "authenticated", "role": "authenticated", "email": "{{user.primary_email_address}}" }` — do not include `sub` as it is a reserved claim that Clerk sets automatically to the user ID. The signing key must be the Supabase JWT Secret (Project Settings > API > JWT Secret), algorithm HS256. The RLS policies in `sql/001-allotments.sql` use `auth.jwt() ->> 'sub'` to match rows to users.

### GDPR Compliance

`GET /api/account` exports user data as JSON download. `DELETE /api/account` deletes the Supabase row. Both require Clerk authentication. The Settings Data tab provides UI for export and account deletion in the Danger Zone section.

### AI Advisor

`src/app/api/ai-advisor/route.ts` is a Next.js API route that:
- Accepts user messages and optional plant images
- Proxies to OpenAI API (gpt-4o for vision, gpt-4o-mini for text)
- Uses BYO token via `x-openai-token` header
- Includes allotment context in system prompt when provided
- Supports function calling for data modification (add/update/remove plantings)

### AI Tool Execution

`src/services/ai-tool-executor.ts` handles AI-initiated data modifications:
- Executes tool calls from AI responses (add_planting, update_planting, remove_planting, list_areas)
- Requires user confirmation via `ToolCallConfirmation` component before execution
- Supports area name resolution (e.g., "Bed A" instead of internal IDs)
- Tool schema defined in `src/lib/ai-tools-schema.ts`

### Onboarding

`src/components/onboarding/OnboardingWizard.tsx` - 3-screen welcome for new users:
1. Welcome with three paths (explore/plan/ask)
2. Contextual guidance based on chosen path
3. Success confirmation with next steps

### Component Organization

- `src/components/garden-planner/` - garden grid (GardenGrid, GridSizeControls, PlantSelectionDialog), bed editor, calendar
- `src/components/allotment/` - allotment grid, bed items
- `src/components/ai-advisor/` - chat interface components
- `src/components/share/` - Data sharing UI (ShareDialog)
- `src/components/ui/` - shared UI components (Dialog, SaveIndicator)

### Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Migration and Backward Compatibility

The app supports automatic schema migration for users on older data versions. Current schema is v18. Users on older schemas (v1-v17) automatically migrate on next app load with automatic backup creation.

### Key Schema Milestones

- **v18** (2026-03-04): Integrated compost data into AllotmentData (migrates from separate localStorage key)
- **v17**: Added compost field to AllotmentData schema
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
