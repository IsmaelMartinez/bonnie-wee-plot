# Import/Export Alignment Review

**Date**: 2026-01-18
**Status**: Completed

## Executive Summary

This document reviews the alignment between data structures and import/export functionality, identifies issues, documents fixes made, and analyzes the feasibility of partial migrations.

## Current Architecture

### Data Storage

The app uses two localStorage keys for data:

1. **`allotment-unified-data`** (STORAGE_KEY)
   - Contains: `AllotmentData` (v11 schema)
   - Includes: areas, seasons, plantings, varieties, events, tasks

2. **`community-allotment-varieties`** (VARIETY_STORAGE_KEY)
   - Contains: `VarietyData` (v2 schema)
   - Used by: Seeds page, useVarieties hook
   - Synchronized: Auto-sync when plantings added via `variety-allotment-sync.ts`

### Export Format

```typescript
interface CompleteExport {
  allotment: AllotmentData      // v11 schema
  varieties: VarietyData        // v2 schema (separate for Seeds page)
  exportedAt: string
  exportVersion: number         // CURRENT_SCHEMA_VERSION (11)
}
```

### Import Flow

1. Parse JSON file
2. **NEW**: Create pre-import backup (safety measure)
3. Detect format (new vs old)
4. Merge `varieties.varieties` into `allotmentData.varieties`
5. Save to localStorage
6. Trigger UI reload

## Issues Identified & Fixed

### Issue 1: Excel Script Generated v10, App is v11

**Problem**: The `scripts/excel-to-backup.py` generated v10 format with plural plant IDs (peas, onions), but the app's v11 schema uses singular IDs (pea, onion).

**Fix Applied**:
- Updated PLANT_MAPPINGS to use singular plant IDs
- Updated version numbers to 11
- Updated infer_rotation_group() to use singular IDs
- Updated documentation in `docs/excel-import-guide.md`

### Issue 2: No Pre-Import Backup

**Problem**: Documentation promised "automatic backup before import" but code didn't implement it.

**Fix Applied**:
- Added `createPreImportBackup()` function in DataManagement.tsx
- Creates backup with key `allotment-unified-data-pre-import-{timestamp}`
- Called before every import operation

### Issue 3: Documentation Out of Date

**Problem**: `excel-import-guide.md` referenced v10 format.

**Fix Applied**: Updated all v10 references to v11 throughout the document.

## Architecture Decision: Dual Variety Storage

The current architecture maintains varieties in two places:
1. Inside `AllotmentData.varieties` (exported/imported together)
2. Separate `community-allotment-varieties` storage (for Seeds page)

**Why keep both?**
- Seeds page can work independently without loading full allotment data
- Sync happens via `variety-allotment-sync.ts` when plantings added
- Export combines both, import merges them back

**Recommendation**: Keep current architecture. The separation provides good UX for the Seeds page while maintaining data consistency through the sync mechanism.

## Partial Migration Feasibility Analysis

The user asked about implementing partial imports for:
1. Only seeds (varieties)
2. Only plot structure (layout.areas)
3. Only specific years (seasons)

### Complexity Assessment

| Feature | Complexity | Effort | Risk |
|---------|------------|--------|------|
| Seeds only | Low | 2-4 hours | Low |
| Layout only | Medium | 4-8 hours | Medium |
| Specific years | High | 8-16 hours | High |

### 1. Seeds Only Import (Low Complexity)

**Implementation**:
```typescript
interface PartialImportOptions {
  importSeeds: true
}
```

**Steps**:
1. Parse backup file
2. Extract `varieties.varieties` array
3. Merge with existing varieties (by ID or plantId+name)
4. Save to variety storage
5. Optionally update AllotmentData.varieties

**Considerations**:
- Simple merge logic (replace or append)
- No dependencies on other data
- Can preserve existing variety customizations

### 2. Layout Only Import (Medium Complexity)

**Implementation**:
```typescript
interface PartialImportOptions {
  importLayout: true
  backfillSeasons?: boolean  // Create AreaSeason for new areas
}
```

**Steps**:
1. Parse backup file
2. Extract `allotment.layout.areas` array
3. Merge with existing areas (by ID)
4. If backfillSeasons, create AreaSeason entries for existing years
5. Handle area conflicts (same ID, different data)

**Considerations**:
- Grid positions may conflict with existing layout
- New areas need AreaSeason entries for existing years
- Removed areas may have orphaned season data

### 3. Specific Years Import (High Complexity)

**Implementation**:
```typescript
interface PartialImportOptions {
  importSeasons: number[]  // e.g., [2024, 2025]
  mergeMode: 'replace' | 'merge'
}
```

**Steps**:
1. Parse backup file
2. Extract specified years from `allotment.seasons`
3. For each year:
   - Match AreaSeason to existing areas (by areaId)
   - Handle missing areas (skip or warn)
   - Merge or replace plantings
4. Update timestamps

**Considerations**:
- Area IDs must match between import and existing data
- Plantings may reference varieties that don't exist
- Rotation groups may conflict
- Historical data integrity concerns

### Recommended Approach

**Phase 1**: Implement Seeds-only import (low risk, high value)
- Add checkbox in DataManagement: "Import seeds only"
- Merge varieties without touching allotment data

**Phase 2**: Implement selective year import (if needed)
- Add year selector showing available years in backup
- Warn about area mismatches
- Default to merge mode with conflict detection

**Phase 3**: Layout import (only if requested)
- Most complex due to visual positioning
- May require manual grid adjustment

### UI Design for Partial Import

```
┌─────────────────────────────────────────┐
│ Import Options                           │
├─────────────────────────────────────────┤
│ ○ Full restore (replace all data)       │
│ ○ Partial import                         │
│   ┌─────────────────────────────────┐   │
│   │ ☐ Seed varieties                 │   │
│   │ ☐ Plot layout                    │   │
│   │ ☐ Seasons:                       │   │
│   │   ☐ 2024  ☐ 2025  ☐ 2026        │   │
│   └─────────────────────────────────┘   │
│                                          │
│ [Preview Changes] [Import]               │
└─────────────────────────────────────────┘
```

## Files Modified

1. `scripts/excel-to-backup.py` - Updated to v11 format with singular plant IDs
2. `src/components/allotment/DataManagement.tsx` - Added pre-import backup
3. `docs/excel-import-guide.md` - Updated v10 references to v11

## Testing

- All 238 unit tests pass
- TypeScript type-check passes
- No breaking changes to existing import/export flow

## Recommendations

1. **Keep current architecture**: The dual variety storage provides good separation of concerns

2. **Implement seeds-only import**: Low effort, high value for users managing seed inventory separately

3. **Add import preview**: Before importing, show what will change (areas added/removed, seasons affected)

4. **Add backup management UI**: Allow users to see and restore pre-import backups

5. **Consider selective export**: Export only specific years or just seeds for sharing
