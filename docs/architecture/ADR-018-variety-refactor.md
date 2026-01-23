# ADR-018: Variety Management Refactor

## Status
Accepted

## Context

The application suffered from a dual storage architecture where seed varieties existed in two separate localStorage locations, causing data drift, race conditions, and unreliable import/export operations.

### Problems with Dual Storage

The previous implementation stored variety data in two places:

1. `AllotmentData.varieties` - Main storage with variety definitions
2. Separate `VarietyData` localStorage key - Duplicate storage for "variety data"

This dual storage led to several critical issues:

- **Data Drift**: Updates to one location wouldn't sync to the other, causing inconsistent state
- **Race Conditions**: Concurrent saves could overwrite each other's changes
- **Import/Export Failures**: Import operations had to coordinate two separate data sources, increasing failure risk
- **Complexity**: Developers had to manage synchronization logic across the codebase
- **Stored Computed Data**: The `yearsUsed` field was stored redundantly when it could be computed from plantings

### Why This Happened

The dual storage architecture emerged organically as features were added incrementally. Varieties started as a simple list, then gained year tracking, inventory status, and eventually integration with the unified allotment data model. Rather than refactoring early, the code accumulated synchronization logic that became increasingly fragile.

## Decision

Consolidate to a single source of truth in `AllotmentData.varieties` with computed queries for usage tracking.

### Key Changes

1. **Single Source of Truth**: All variety data lives exclusively in `AllotmentData.varieties`
2. **Computed Usage Tracking**: The `yearsUsed` field is now computed dynamically from actual plantings via `getVarietyUsedYears()`
3. **Soft Delete**: Varieties use `isArchived` flag to preserve referential integrity with historical plantings
4. **Promise-based Flush**: `flushSave()` now returns `Promise<boolean>` to allow reliable coordination with import/export
5. **Migration Path**: Schema v13 migration handles existing dual storage data with automatic backup and rollback

### New Query Functions

The refactor introduces dedicated query functions in `src/lib/variety-queries.ts`:

- `getVarietyUsedYears(varietyId, allotmentData)` - Returns all years a variety was actually planted
- `getVarietiesForYear(year, allotmentData)` - Returns all varieties used in a specific year
- `normalizeVarietyName(name)` - Normalizes variety names for consistent matching

These queries scan `AllotmentData.seasons` plantings to determine actual variety usage, making the data authoritative and eliminating stale cached values.

### Import/Export Improvements

Import/export operations now:

- Call `await flushSave()` before import to ensure pending changes are committed
- Validate import data with `validateImportData()` before applying changes
- Create automatic backups in case of import failure
- Handle `CompleteExport` format that includes both allotment and compost data

## Consequences

### Positive

- **Single Source of Truth**: No more data drift between storage locations
- **Authoritative Data**: Plantings are the definitive record of variety usage
- **Simpler Codebase**: Removed all synchronization logic between storage systems
- **Reliable Import/Export**: Flush mechanism ensures data consistency before operations
- **Better Performance**: Computed queries only run when needed, not on every save
- **Referential Integrity**: Soft delete via `isArchived` preserves links to historical plantings

### Negative

- **Query Cost**: Computing usage requires scanning all seasons (acceptable for current data volumes)
- **Migration Required**: Users on old dual storage must migrate via schema v13
- **Breaking Change**: External tools expecting dual storage format need updates

### Migration Strategy

Users with existing data automatically migrate on next app load:

1. Schema v13 migration detects dual storage
2. Creates automatic backup before migration
3. Consolidates variety data into `AllotmentData.varieties`
4. Removes redundant `VarietyData` localStorage key
5. Computes `yearsUsed` from historical plantings
6. Logs migration details to console

If migration fails, users can manually restore from the automatic backup via the Data Management UI.

## Implementation

### Files Changed

- `src/types/unified-allotment.ts` - Removed `yearsUsed` from `StoredVariety`, added `@deprecated` marker
- `src/lib/variety-queries.ts` - New query functions for computed usage tracking
- `src/services/allotment-storage.ts` - Removed dual storage sync, added v13 migration
- `src/hooks/useAllotment.ts` - Updated to use query functions, removed sync logic
- `src/app/seeds/page.tsx` - Updated to use computed queries
- `src/app/allotment/page.tsx` - Updated to use computed queries

### Schema Version

Current schema version: 13

## References

- Related ADRs: ADR-010 (Seed Variety Tracking), ADR-002 (Data Persistence Strategy)
- GitHub Issues: #1-#7 (Variety Management Refactor Epic)
- Migration Guide: See Issue #5 implementation for rollback procedure
