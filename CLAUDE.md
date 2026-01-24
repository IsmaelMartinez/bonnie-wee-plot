# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bonnie Wee Plot is a Next.js 15 application for garden planning and AI-powered gardening advice, built with React 19 and TypeScript. Users can plan their allotment plots, track plantings across seasons, and get advice from "Aitor" - an AI gardening assistant powered by OpenAI (BYO API key).

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

Each `SeasonRecord` contains `AreaSeason` entries that track `Planting` items per area per year.

### Variety Management

Seed varieties are stored exclusively in `AllotmentData.varieties` with computed usage tracking:

- **Single Source of Truth**: All variety data lives in `AllotmentData.varieties`
- **Computed Queries**: Year usage computed dynamically from plantings via `getVarietyUsedYears()`
- **Soft Delete**: Varieties use `isArchived` flag to preserve references to historical plantings
- **Inventory Tracking**: Per-year seed status (`none`/`ordered`/`have`) via `seedsByYear`

Query functions in `src/lib/variety-queries.ts`:
- `getVarietyUsedYears(varietyId, data)` - Returns all years a variety was planted
- `getVarietiesForYear(year, data)` - Returns all varieties used in a specific year

### State Management

`useAllotment` hook (`src/hooks/useAllotment.ts`) is the single source of truth for allotment state. It wraps the storage service and provides:
- CRUD operations for plantings and maintenance tasks
- Year/bed selection
- Multi-tab sync via storage events
- Debounced saves with status tracking

### Storage Service

`src/services/allotment-storage.ts` handles all localStorage operations:
- Schema validation and migration (current version: 14)
- Legacy data migration from hardcoded historical plans
- Immutable update functions (return new data, don't mutate)
- Promise-based `flushSave()` for reliable import/export coordination
- Automatic backup creation before imports

Schema v14 moved grid positions from a separate localStorage key into `AreaSeason.gridPosition`, enabling per-year layouts and ensuring positions are included in export/import. Users on older schemas automatically migrate on next app load with automatic backup creation.

### Date Calculator

`src/lib/date-calculator.ts` provides personalized date calculations:
- `calculatePlantingDates()` - Forward calculation from sow date to expected harvest
- `calculateSowDateForHarvest()` - Backward calculation from target harvest to sow date
- `validateSowDate()` - Validates against plant's growing window
- Scotland-specific fall factor adjustment for autumn plantings

### Vegetable Database

Split into index and full data for performance:
- `src/lib/vegetables/index.ts` - lightweight index for dropdowns/search
- `src/lib/vegetable-database.ts` - full vegetable definitions
- `src/lib/vegetable-loader.ts` - lazy loading by category

### Key Type Definitions

`src/types/garden-planner.ts` defines:
- `PhysicalBedId` - bed identifiers (A, B1, B2, C, D, E, etc.)
- `RotationGroup` - crop rotation categories
- `Vegetable` - plant definition with planting/care info, including `PerennialInfo` for perennial lifecycle tracking

`src/types/unified-allotment.ts` defines:
- `Area` - unified type for all allotment areas (beds, trees, berries, infrastructure)
- `AreaKind` - discriminator for area types (`rotation-bed`, `perennial-bed`, `tree`, `berry`, `herb`, `infrastructure`, `other`)
- `Planting` - instance of a plant in an area, with sow method tracking (`indoor`/`outdoor`/`transplant-purchased`), expected harvest dates (calculated), and actual harvest dates
- `PrimaryPlant` - permanent plants (trees, berries) with perennial lifecycle status tracking
- `StoredVariety` - seed variety with per-year inventory status
- `AreaSeason.gridPosition` - per-year grid layout positions (schema v14)

### AI Advisor

`src/app/api/ai-advisor/route.ts` is a Next.js API route that:
- Accepts user messages and optional plant images
- Proxies to OpenAI API (gpt-4o for vision, gpt-4o-mini for text)
- Uses BYO token via `x-openai-token` header
- Includes allotment context in system prompt when provided

### Component Organization

- `src/components/garden-planner/` - garden grid (GardenGrid, GridSizeControls, PlantSelectionDialog), bed editor, calendar
- `src/components/allotment/` - allotment grid, bed items
- `src/components/ai-advisor/` - chat interface components
- `src/components/ui/` - shared UI components (Dialog, SaveIndicator)

### Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Migration and Backward Compatibility

The app supports automatic schema migration for users on older data versions. Current schema is v14. Users on older schemas (v1-v13) automatically migrate on next app load with automatic backup creation.

### Key Schema Milestones

- **v14** (2026-01-23): Moved grid positions to `AreaSeason.gridPosition` for per-year layouts
- **v13** (2026-01-22): Consolidated variety storage from dual localStorage into `AllotmentData.varieties`
- **v12**: Added `SowMethod` tracking and harvest date fields
- **v11**: Synchronized plant IDs to singular form
- **v10**: Unified Area type replacing separate bed/permanent/infrastructure types
- **v9**: Introduced unified area system with underplantings

See `docs/adrs/018-variety-refactor.md` for details on the v13 consolidation. See `docs/adrs/019-per-year-grid-positions.md` for the v14 per-year grid positions feature.

## Code Conventions

- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`
- Use server components where possible; `'use client'` only when needed
- Tailwind CSS for styling
- Playwright tests must pass before pushing
- Test files: unit tests in `src/__tests__/`, e2e tests in `tests/`
- Immutable update patterns: storage functions return new data, never mutate

## Documentation Hygiene

- Plan files in `docs/plans/` are temporary working documents - delete them after implementation is complete
- Research documents in `docs/research/` should be reviewed periodically and removed when obsolete
- ADRs are permanent records - update status but don't delete
- Keep documentation minimal and current; avoid accumulating stale artifacts
