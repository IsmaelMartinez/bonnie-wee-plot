# V10 Unified Areas System - Issues Investigation

This document consolidates findings from the research phase investigating outstanding issues after the v10 unified area system migration.

## Issue 1: Colors Not Displaying

### Problem
Area colors selected during creation (Green, Blue, Pink, etc.) don't render in the AllotmentGrid.

### Root Cause
There's a critical disconnect between how colors are stored vs. rendered:

1. **AddAreaForm** stores semantic Tailwind names: `'zen-moss'`, `'zen-water'`, `'zen-sakura'`, etc.
2. **Area.color** stores these as plain strings
3. **BedItem.tsx** applies them as inline CSS: `style={{ backgroundColor: item.color }}`

Tailwind semantic names like `'zen-moss'` are NOT valid CSS color values. The browser cannot interpret `backgroundColor: 'zen-moss'` - it requires actual hex values like `#768a5e`.

### Tailwind Color Mappings (from tailwind.config.js)
- `zen-moss-500: #768a5e` (Green)
- `zen-water-500: #5a8dad` (Blue)
- `zen-sakura-500: #e07294` (Pink)
- `zen-kitsune-500: #d4805a` (Orange)
- `zen-stone-500: #78716c` (Gray)

### Files Affected
- `src/components/allotment/AddAreaForm.tsx` - Stores semantic names (line 50-56)
- `src/components/allotment/BedItem.tsx` - Applies as inline style (line 69-71)
- `src/components/allotment/AllotmentGrid.tsx` - Passes color through unchanged (line 99)

### Recommended Fix
Create a color mapping utility that converts semantic names to hex values:
```typescript
const ZEN_COLORS: Record<string, string> = {
  'zen-moss': '#768a5e',
  'zen-water': '#5a8dad',
  'zen-sakura': '#e07294',
  'zen-kitsune': '#d4805a',
  'zen-stone': '#78716c',
}

function getColorValue(colorName: string | undefined): string {
  return ZEN_COLORS[colorName || ''] || '#e5e7eb'
}
```

---

## Issue 2: Cannot Edit Areas

### Problem
Users cannot edit existing areas (change name, convert type, update icon/color).

### Current State

**Storage Layer (Complete):**
- `updateArea()` - Accepts partial updates for any Area field (line 2415-2439)
- `changeAreaKind()` - Converts between area types with proper data handling (line 2488-2533)
- Both functions are exposed through `useAllotment` hook

**UI Layer (Missing):**
- No "Edit" button or mode in detail panels
- No EditAreaForm component
- `AreaTypeConverter.tsx` exists but is never imported or rendered
- Detail panels are read-only for area properties (only planting/rotation editing works)

### Files Affected
- `src/components/allotment/details/BedDetailPanel.tsx` - Read-only for name/icon/color
- `src/components/allotment/details/PermanentDetailPanel.tsx` - Read-only
- `src/components/allotment/details/InfrastructureDetailPanel.tsx` - Read-only
- `src/components/allotment/details/ItemDetailSwitcher.tsx` - No edit button wired
- `src/components/allotment/details/AreaTypeConverter.tsx` - Exists but unused

### Recommended Fix
1. Create `EditAreaForm` component (or repurpose AddAreaForm in edit mode)
2. Add "Edit" button to ItemDetailSwitcher
3. Integrate AreaTypeConverter for kind changes
4. Wire handlers from page through to components

---

## Issue 3: Grid Layout Distribution Broken

### Problem
Areas stack on top of each other at the bottom of the grid instead of displaying in proper positions.

### Root Cause
Grid positions are never defined or migrated:

1. **Source data has no positions**: `physicalBeds`, `permanentPlantings`, and `infrastructure` in `allotment-layout.ts` have no `gridPosition` field defined
2. **Migration can't convert what doesn't exist**: v9→v10 migration tries to convert gridPosition but source is always undefined
3. **Fallback stacks everything**: In `areasToGridConfig()` (line 87-88):
   ```typescript
   const pos = area.gridPosition || { x: 0, y: 20, w: 2, h: 2 }
   ```
   All areas without positions get placed at (0, 20) and stack

4. **Disconnect from DEFAULT_GRID_LAYOUT**: A complete layout exists in `DEFAULT_GRID_LAYOUT` but it's only used when NO areas are provided - once areas load from storage, positions are lost

### Type Mismatch
Three different grid position formats exist:
- `GridPosition` (v10): `{ x, y, w, h }` - React Grid Layout format
- `PhysicalBed.gridPosition`: `{ startRow, startCol, endRow, endCol }` - Legacy format
- `PermanentPlanting.gridPosition`: `{ row, col }` - Point format

### Files Affected
- `src/data/allotment-layout.ts` - Source data missing gridPosition fields
- `src/services/allotment-storage.ts` - Migration has nothing to convert (line 772-782)
- `src/components/allotment/AllotmentGrid.tsx` - Fallback position causes stacking

### Recommended Fix
1. Seed positions from DEFAULT_GRID_LAYOUT during migration:
   ```typescript
   const defaultItem = DEFAULT_GRID_LAYOUT.find(item => item.i === area.id)
   if (defaultItem) {
     gridPosition = { x: defaultItem.x, y: defaultItem.y, w: defaultItem.w, h: defaultItem.h }
   }
   ```
2. Or add gridPosition to source data in allotment-layout.ts

---

## Issue 4: Seeds Page Not Showing Data

### Problem
Seeds page shows no varieties while History page works correctly.

### Root Cause
Two separate, non-integrated storage systems exist:

1. **Separate Variety Storage**: `'community-allotment-varieties'`
   - Managed by `variety-storage.ts`
   - Used by Seeds page via `useVarieties()` hook

2. **Unified Allotment Storage**: `'allotment-unified-data'`
   - Has `varieties: StoredVariety[]` field
   - Used by History page via `useAllotment()` hook

These two never sync. Data entered in one is invisible to the other.

### Broken Sync Service
`variety-allotment-sync.ts` exists with `syncPlantingToVariety()` function but is **never called anywhere** in the codebase:
```bash
grep -r "syncPlantingToVariety" src --include="*.ts*"
# Only finds the export, no imports
```

The comment in allotment-storage.ts (line ~2179) says "variety-allotment-sync.ts removed" but the file still exists and was never actually integrated.

### Files Affected
- `src/services/variety-storage.ts` - Separate storage system
- `src/services/variety-allotment-sync.ts` - Exists but never called
- `src/services/allotment-storage.ts` - Has varieties array but disconnected
- `src/app/seeds/page.tsx` - Uses separate storage (line 79)
- `src/hooks/useVarieties.ts` - Loads from separate storage

### Recommended Fix
1. Call `syncPlantingToVariety()` when adding plantings in useAllotment hook
2. Or migrate all varieties to unified storage and deprecate separate storage
3. Or implement bidirectional sync on load

---

## Issue 5: Areas Don't Appear Across All Years

### Problem
When adding an area in 2025, it doesn't have data when navigating to 2024.

### Current Behavior

**When adding an area in 2025:**
1. Area added to `layout.areas` (global list) ✓
2. `AreaSeason` created in 2025 season ✓
3. **No `AreaSeason` created in 2024** ✗

**Result:** Area appears in grid (uses `getAllAreas()`) but has no plantings/rotation data in 2024.

### Architecture Gap

The `addArea()` function only adds the area to the global layout and current season. It doesn't backfill `AreaSeason` entries to existing prior years.

Contrast with `addSeason()` which correctly creates `AreaSeason` for all current areas when adding a new year.

### Current Code (addArea, line 2390-2410)
```typescript
export function addArea(data, area) {
  const id = generateId()
  const newArea = { ...area, id, createdAt: new Date().toISOString() }
  const areas = data.layout.areas || []
  return {
    data: {
      ...data,
      layout: { ...data.layout, areas: [...areas, newArea] },
    },
    areaId: id,
  }
}
```

Missing: Loop through `data.seasons` and add `AreaSeason` for each existing year.

### Files Affected
- `src/services/allotment-storage.ts` - addArea() needs backfill logic
- `src/hooks/useAllotment.ts` - Uses addArea without backfill

### Recommended Fix
Modify `addArea()` to create `AreaSeason` entries in all existing seasons:
```typescript
const updatedSeasons = data.seasons.map(season => ({
  ...season,
  areas: [
    ...season.areas,
    {
      areaId: id,
      rotationGroup: area.rotationGroup || 'legumes',
      plantings: [],
      notes: [],
    },
  ],
}))
```

---

## Implementation Priority

Based on user impact and complexity:

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Colors not displaying | Low | High - Visual broken |
| 2 | Grid layout distribution | Medium | High - Layout broken |
| 3 | Areas across years | Medium | High - Data inconsistent |
| 4 | Seeds page not showing | Medium | Medium - Feature broken |
| 5 | Cannot edit areas | High | Medium - Missing feature |

## Next Steps

1. Create color mapping utility and update BedItem.tsx
2. Seed grid positions during v10 migration or on fresh init
3. Add backfill logic to addArea() for prior seasons
4. Wire up syncPlantingToVariety or consolidate variety storage
5. Create area editing UI components and wire handlers
