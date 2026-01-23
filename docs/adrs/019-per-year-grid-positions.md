# ADR-019: Per-Year Grid Positions

## Status
Accepted

## Date
2026-01-23

## Context

Grid layout positions for allotment areas were stored in a separate localStorage key (`allotment-grid-layout`) that was not included in export/import operations. This caused several issues:

1. User-arranged layouts were lost when importing a backup on a new device
2. The data model didn't support per-year positions, so layouts couldn't vary by year
3. Position changes were saved to localStorage but never synced to the main data model

## Decision

Move `gridPosition` from `Area` (global) to `AreaSeason` (per-year), eliminate the separate storage key, and sync changes directly to the data model.

### Key Changes

1. **Per-Year Positions**: Each year's `AreaSeason` now has its own `gridPosition` field
2. **Single Storage Location**: Positions stored in `AllotmentData.seasons[].areas[].gridPosition`
3. **Position Inheritance**: New seasons copy positions from previous year, falling back to `Area.gridPosition`
4. **Reduced Default Height**: New areas default to `h: 1` (50px) instead of `h: 2` (100px)

### Position Resolution Order

When displaying an area, position resolves in this order:
1. `AreaSeason.gridPosition` for current year (if exists)
2. `Area.gridPosition` (default from area creation)
3. Auto-placement default `{x: 0, y: maxY+1, w: 2, h: 1}`

### Migration (v13 → v14)

The migration:
1. Reads positions from `allotment-grid-layout` localStorage key (if exists)
2. Populates `AreaSeason.gridPosition` for all existing seasons
3. Falls back to `Area.gridPosition` if no saved position
4. Deletes the separate `allotment-grid-layout` key

## Consequences

### Positive

- Export/import now includes grid positions
- Each year can have different layouts
- Simpler storage model (no separate key to manage)
- Positions are part of the versioned schema with migration support

### Negative

- Slightly larger data size (positions duplicated per year)
- Migration required for users with custom layouts

### Files Changed

- `src/types/unified-allotment.ts` - Added `gridPosition` to `AreaSeason`, bumped to v14
- `src/services/allotment-storage.ts` - Migration, `updateAreaSeasonPosition()`, position copying in `addSeason()`
- `src/hooks/useAllotment.ts` - Exposed `updateAreaSeasonPosition()`
- `src/components/allotment/AllotmentGrid.tsx` - Reads from `AreaSeason`, calls callback on change
- `src/components/allotment/AddAreaForm.tsx` - Reduced default height to `h: 1`
- `src/data/allotment-layout.ts` - Removed `LAYOUT_STORAGE_KEY`

## References

- GitHub Issues: #48-#55
- Pull Request: #56
- Related ADRs: ADR-002 (Data Persistence Strategy), ADR-018 (Variety Refactor)
