# Plant Guide Enhancements Design

Date: 2026-03-09

## Overview

Three enhancements to the plant guide pages to make them more useful as a working reference rather than just a static encyclopaedia.

## Feature 1: Difficulty Filter

Add a second dropdown to the `/plants` index page alongside the existing category filter. Values: "All levels" (default), "Beginner", "Intermediate", "Advanced". All three filters (search, category, difficulty) are AND'd together.

The `VegetableIndex` interface gains a `difficulty` field (type `DifficultyLevel`), populated in `src/lib/vegetables/index.ts`. This keeps the page fast without needing to lazy-load full plant data.

## Feature 2: "My Plants" Filter

A checkbox on the `/plants` page labelled "My plants only". When active, filters the list to plants with at least one planting in the current year's season records. The component uses `useAllotment` to read planting data and collects all `plantId` values from the current year's `AreaSeason` entries into a Set.

Plants that are currently planted show a subtle "planted" badge next to their name regardless of whether the filter is active. When the filter is on but no plantings exist, the empty state directs users to the Allotment page.

## Feature 3: Plant Summary Dialog

A `PlantSummaryDialog` component showing a compact summary when users click a plant name in the seeds or allotment pages. Contents: plant name, botanical name, difficulty badge, key facts grid (sun, water, spacing, depth), planting calendar month bars, and a "View full details" link to `/plants/[id]`.

The `MonthBar` component moves from `/plants/[id]/page.tsx` to `src/components/plants/MonthBar.tsx` for reuse by both the detail page and the dialog. Plant names in the seeds page (variety group headers) and allotment page (planting items) become clickable triggers for this dialog. Uses the existing `Dialog` component and loads data via `getVegetableById`.

## Files Affected

- `src/lib/vegetables/index.ts` — add `difficulty` to VegetableIndex and all entries
- `src/app/plants/page.tsx` — add difficulty dropdown, "my plants" checkbox, planted badges, useAllotment integration
- `src/app/plants/[id]/page.tsx` — extract MonthBar to shared component, import from new location
- `src/components/plants/MonthBar.tsx` — new shared component
- `src/components/plants/PlantSummaryDialog.tsx` — new dialog component
- `src/app/seeds/page.tsx` — make plant group names clickable, open PlantSummaryDialog
- `src/app/allotment/page.tsx` — make planting names clickable, open PlantSummaryDialog
