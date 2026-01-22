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
- `layout` - physical beds, permanent plantings, infrastructure
- `seasons` - array of `SeasonRecord` for each year
- `currentYear` - active year for the UI
- `maintenanceTasks` - care tasks for perennial plants

Each `SeasonRecord` contains `BedSeason` entries that track `Planting` items per bed per year.

### State Management

`useAllotment` hook (`src/hooks/useAllotment.ts`) is the single source of truth for allotment state. It wraps the storage service and provides:
- CRUD operations for plantings and maintenance tasks
- Year/bed selection
- Multi-tab sync via storage events
- Debounced saves with status tracking

### Storage Service

`src/services/allotment-storage.ts` handles all localStorage operations:
- Schema validation and migration (current version: 12)
- Legacy data migration from hardcoded historical plans
- Immutable update functions (return new data, don't mutate)

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
- `Planting` - instance of a plant in a bed, with sow method tracking (`indoor`/`outdoor`/`transplant-purchased`), expected harvest dates (calculated), and actual harvest dates
- `PrimaryPlant` - permanent plants (trees, berries) with perennial status tracking

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

## Code Conventions

- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`
- Use server components where possible; `'use client'` only when needed
- Tailwind CSS for styling
- Playwright tests must pass before pushing
- Test files: unit tests in `src/__tests__/`, e2e tests in `tests/`
