# Phase 3: Variety Management Refactor - GitHub Issues

This document contains detailed specifications for Phase 3 issues (#9-12) of the Variety Management Refactor initiative. These issues eliminate the dual storage architecture and complete the consolidation of variety data into the unified allotment storage system.

---

## Issue #9: Remove separate variety storage and useVarieties hook

### Title
Remove separate variety storage and useVarieties hook

### Labels
`refactor`, `variety-management`, `breaking-change`, `phase-3`

### Priority
High

### Size
M (3-5 days)

### Description

The separate variety storage system (`VARIETY_STORAGE_KEY = 'community-allotment-varieties'`) creates a split-brain data architecture where varieties are stored in two places: the main allotment storage and a separate localStorage location. This has been mitigated by Phase 2 work that embeds varieties directly into the unified allotment data structure, making the separate storage redundant.

This issue removes the legacy architecture and eliminates the `useVarieties` hook entirely. All variety access must transition to reading from `AllotmentData.varieties` within the unified storage system, which is already available through the `useAllotment` hook.

### Acceptance Criteria

1. Remove `src/services/variety-storage.ts` completely
2. Remove `src/hooks/useVarieties.ts` completely
3. Remove `src/types/variety-data.ts` completely (types re-exported from `unified-allotment.ts`)
4. Update all components that import from `variety-storage.ts` to use unified storage instead
5. Update all components that use `useVarieties` hook to use `useAllotment` hook instead
6. All existing unit tests continue to pass
7. Existing e2e tests continue to work without modification
8. Component rendering and functionality remain identical from user perspective

### Implementation Details

**Files to Modify:**

1. `src/components/allotment/AddPlantingForm.tsx`
   - Replace `hasSeedsForYear` import from `variety-storage` with direct computation from variety data
   - Update component props if needed to receive variety data from parent
   - Consider using `useAllotment` hook to access varieties if not already passed as prop

2. `src/components/allotment/DataManagement.tsx`
   - Replace `loadVarietyData()` calls with access to `useAllotment` hook
   - Update export logic to use varieties from unified storage
   - Update import logic to merge varieties into unified storage format

3. Test files (`src/__tests__/services/variety-storage.test.ts`)
   - Move test cases to unified storage tests where applicable
   - Remove tests specific to separate variety storage
   - Ensure variety CRUD operations are tested through unified storage tests

**Key Changes:**

- `hasSeedsForYear(variety, year)` logic should be inlined where used or moved to a utility function in `src/lib/` if used in multiple places
- Any query functions from `variety-storage` that read from varieties should become local functions or utilities
- The `VarietyData` wrapper type is no longer needed; use varieties array directly from `AllotmentData`

### Testing Requirements

1. Unit tests for all modified components
   - Verify variety querying still works correctly
   - Test seed status checking logic
   - Test variety filtering by year

2. E2E tests
   - Test adding a planting shows correct variety suggestions
   - Test seed status filtering when adding plantings
   - Test variety data persists correctly

3. Manual testing
   - Verify seed library/variety tracking still works
   - Verify adding plantings still auto-syncs to varieties
   - Verify all variety-related features render correctly

### Dependencies

- Requires Phase 2 to be complete (varieties embedded in AllotmentData)
- Blocks Phase 3 issue #10, #11, #12
- No API changes needed; purely internal refactoring

---

## Issue #10: Eliminate variety-allotment-sync service

### Title
Eliminate variety-allotment-sync service

### Labels
`refactor`, `variety-management`, `phase-3`

### Priority
High

### Size
M (2-4 days)

### Description

The `src/services/variety-allotment-sync.ts` service performs one-way synchronization from allotment plantings to the separate variety storage. With varieties now embedded directly in the unified allotment storage (Phase 2), this sync logic is redundant. The same functionality (tracking that a variety was used in a year) should be handled directly when plantings are added/removed.

This issue removes the sync service and integrates its logic directly into the allotment storage layer where plantings are managed, ensuring variety records are always consistent with plantings without needing a separate sync step.

### Acceptance Criteria

1. Remove `src/services/variety-allotment-sync.ts` completely
2. Remove all calls to `syncPlantingToVariety()` from codebase
3. Integrate variety year tracking logic into `src/services/allotment-storage.ts` when plantings are added
4. When a planting is added to the unified storage, the variety record is automatically updated (no separate sync call needed)
5. Variety year tracking maintains same business logic as before:
   - If matching variety exists (by plantId + name), add year to plannedYears
   - If no matching variety exists, create new one
   - Matching is case-insensitive and whitespace-normalized
6. All existing functionality preserved from user perspective
7. No split-brain scenarios possible (variety records always match planting records)

### Implementation Details

**Files to Modify:**

1. `src/services/allotment-storage.ts`
   - In `addPlanting()` function: After adding planting, call `ensureVarietyForPlanting()`
   - In `removePlanting()` function: May need cleanup logic (optional: remove unused varieties)
   - Add helper functions:
     - `findMatchingVariety(plantId, varietyName)` - Match existing variety
     - `ensureVarietyForPlanting(planting, year, allotmentData)` - Create or update variety

2. `src/hooks/useAllotment.ts`
   - Remove import of `syncPlantingToVariety`
   - Remove the call to `syncPlantingToVariety()` after plantings are added
   - No other changes needed; storage layer now handles sync

3. Update any related tests to reflect new behavior

**Key Implementation Pattern:**

Instead of:
```typescript
// Old approach (separate sync)
const newPlanting = createPlanting(...)
setAllotmentData(addPlanting(data, newPlanting))
syncPlantingToVariety(newPlanting, year)  // Separate call
```

New approach:
```typescript
// New approach (integrated)
const newPlanting = createPlanting(...)
setAllotmentData(addPlanting(data, newPlanting, year))  // Sync integrated
```

### Testing Requirements

1. Unit tests for new allotment-storage functions
   - Test `ensureVarietyForPlanting()` creates variety when needed
   - Test matching logic is case-insensitive
   - Test variety year tracking
   - Test that duplicate syncs don't create duplicates

2. E2E tests
   - Add planting → verify variety record created
   - Add planting with existing variety → verify year added to plannedYears
   - Remove planting → verify behavior (should variety be removed or marked as unused?)

3. Integration tests
   - Variety data before and after adding planting should be consistent
   - No race conditions or data loss during saves

### Dependencies

- Requires #9 to be completed first (separate variety storage removed)
- Blocks #11 and #12
- Must maintain data consistency (all varieties match plantings)

---

## Issue #11: Implement one-time storage migration

### Title
Implement one-time storage migration

### Labels
`refactor`, `variety-management`, `data-migration`, `phase-3`

### Priority
High

### Size
L (4-6 days)

### Description

Existing users have variety data stored in the separate `'community-allotment-varieties'` localStorage key. After issues #9 and #10 are completed, this data becomes inaccessible. This issue implements a robust one-time migration that moves all variety data from the legacy storage into the unified allotment storage, ensuring zero data loss for existing users.

The migration must be:
- **Automatic**: Run on first app load if needed
- **Idempotent**: Safe to run multiple times without duplicating data
- **Non-destructive**: Never deletes data, only moves/merges
- **Logged**: Tracks success/failure for debugging
- **Tested**: Comprehensive coverage of edge cases

### Acceptance Criteria

1. Create `src/services/storage-migration.ts` with migration logic
2. Migration runs automatically on app load in `src/hooks/useAllotment.ts` before data is accessed
3. Check for legacy variety storage and unified allotment storage:
   - If legacy storage exists and unified storage is empty → migrate all varieties
   - If both exist → merge them intelligently (no duplicates based on plantId + name matching)
   - If only unified storage exists → nothing to do
4. Merge logic handles duplicate varieties intelligently:
   - Match by (plantId + normalized name)
   - Keep historical year data from both sources
   - Combine plannedYears and yearsUsed sets
   - Preserve seed status information
5. After successful migration, legacy storage key remains for backward compatibility (don't delete immediately)
6. Migration status tracked in localStorage to prevent re-running (flag in unified storage metadata)
7. Errors logged but don't break app startup
8. Detailed migration report available for debugging (logs what was migrated, any conflicts, etc.)
9. Test with realistic data scenarios (duplicates, conflicts, corrupted data)

### Implementation Details

**Files to Modify/Create:**

1. **Create** `src/services/storage-migration.ts`
   - Export `migrateVarietyDataIfNeeded()` function
   - Implements detection and migration logic
   - Handles merging of duplicate varieties
   - Records migration completion in allotment metadata

2. **Modify** `src/services/allotment-storage.ts`
   - Add metadata field to track migration status: `varietyMigrationCompleted: boolean`
   - Update `AllotmentData` meta to include this flag

3. **Modify** `src/hooks/useAllotment.ts`
   - Call `migrateVarietyDataIfNeeded()` in initialization, before loading/saving data
   - Handle any migration errors gracefully (log but don't crash)

**Migration Algorithm:**

```
1. Check if 'community-allotment-varieties' exists in localStorage
2. If not, check migration flag in unified storage
   - If flag is true, we're done (already migrated)
   - If flag is false, nothing to migrate
   - If flag doesn't exist, assume no prior variety data
3. If legacy storage exists:
   a. Load it and validate
   b. Load current unified allotment data
   c. For each variety in legacy:
      - Find matching variety in unified (by plantId + normalized name)
      - If found: merge data (combine years, keep seed status)
      - If not found: add as new variety
   d. Set migration flag to true
   e. Save merged allotment data
   f. Log migration completion
```

**Merge Strategy for Duplicate Varieties:**

When the same variety exists in both legacy and unified storage:
- Combine all planned years (take union, sort)
- Combine all years used (take union, sort)
- Combine seed status per year (prefer 'have' > 'ordered' > 'none')
- Combine notes (if unified is empty or generic, use legacy)
- Keep unified price/supplier if present (assume more recently updated)

### Testing Requirements

1. Unit tests for `storage-migration.ts`
   - Test detection of legacy storage
   - Test migration when both storages exist
   - Test migration with duplicate varieties
   - Test merge logic for combining year data
   - Test idempotency (running twice gives same result)
   - Test handling of corrupted data
   - Test handling of empty storages

2. Integration tests
   - Set up localStorage with legacy variety data
   - Initialize app
   - Verify all varieties migrated to unified storage
   - Verify metadata flag set correctly
   - Verify second app load doesn't re-migrate

3. E2E tests
   - Simulate existing user with separate storage
   - Load app and verify migration happens automatically
   - Verify data is accessible through normal UI
   - Verify both legacy and new queries work correctly

4. Edge cases to test
   - Very large variety database (performance)
   - Corrupted JSON in legacy storage
   - Partial data loss in either storage
   - Same variety name different plantIds
   - Special characters in variety names

### Dependencies

- Requires #9 (separate storage removed)
- Requires #10 (sync service removed)
- Must complete before #12 (cleanup)
- No API changes needed; pure data migration

---

## Issue #12: Clean up redundant files and code

### Title
Clean up redundant files and code

### Labels
`refactor`, `variety-management`, `cleanup`, `phase-3`

### Priority
Medium

### Size
S (1-2 days)

### Description

After the migration in issue #11 is complete and we're confident the legacy variety storage is no longer needed, this issue performs final cleanup of deprecated code and files. This removes the last traces of the split-brain architecture and simplifies the codebase.

Cleanup includes removing the legacy storage fallback code, updating all import statements, and removing any comments or documentation that references the old variety storage system.

### Acceptance Criteria

1. Remove the legacy variety storage key from localStorage (after grace period or based on safe conditions)
   - Add cleanup logic that runs once when migration is confirmed complete
   - Or provide admin tool to clean up legacy data
   - Document manual cleanup process for users who need it

2. Remove any fallback code that handles missing unified storage by falling back to legacy storage

3. Update all documentation and comments
   - Remove references to separate variety storage
   - Update architectural documentation to reflect unified storage only
   - Update inline code comments that mention legacy system

4. Verify no dead imports remain in codebase
   - Ensure all removed files no longer imported anywhere
   - Run TypeScript compiler in strict mode to catch import errors

5. Verify tests pass
   - All unit tests pass
   - All e2e tests pass
   - No type errors

6. Update CLAUDE.md if necessary to reflect new architecture

### Implementation Details

**Files to Remove/Clean:**

1. Remove fallback code from utilities that might reference legacy storage
2. Clean up any type definitions that were only for backward compatibility
3. Remove test fixtures that reference legacy storage format
4. Update error messages that might mention "variety storage"

**Files to Update:**

1. `src/services/allotment-storage.ts`
   - Remove any comments about variety-storage
   - Remove migration code from previous phases (once #11 confirmed working)

2. `CLAUDE.md` project documentation
   - Update "State Management" section to remove mention of separate variety storage
   - Update data model description
   - Update any architectural diagrams

3. `docs/adrs/` - potentially create ADR for unified storage completion

4. Test files - remove any mocks/stubs for variety-storage

**Optional Improvements (Out of Scope for Core Task):**

- Create new ADR documenting why unified storage was chosen
- Add performance documentation showing consolidated storage is more efficient
- Create migration guide for anyone running custom code against old storage

### Testing Requirements

1. Unit tests
   - No tests for removed functionality needed
   - Verify existing tests all pass

2. E2E tests
   - Variety tracking still works correctly
   - Seed status filtering works
   - All variety features function normally

3. Type checking
   - `npm run type-check` passes with no errors
   - No unused imports or variables

4. Linting
   - `npm run lint` passes
   - No dead code warnings

### Dependencies

- Requires #9 (storage removed)
- Requires #10 (sync removed)
- Requires #11 (migration complete and validated)
- No dependencies on other work

---

## Phase 3 Timeline and Integration

These four issues represent the complete elimination of the dual storage architecture:

1. **#9** (3-5 days): Remove separate storage and hook - makes code simpler, requires storage updates in consumers
2. **#10** (2-4 days): Remove sync service - straightforward integration into storage layer
3. **#11** (4-6 days): Migration logic - ensures existing users' data is preserved
4. **#12** (1-2 days): Final cleanup - removes all traces of old system

**Recommended Order:** #9 → #10 → #11 → #12 (must proceed sequentially)

**Total Effort:** 10-17 days

**Risk Mitigation:**
- Comprehensive data backup before migration runs
- Migration validation on second load
- Detailed logging of all operations
- E2E tests covering migration scenarios
- Gradual rollout with monitoring

---

## Success Metrics

Upon completion of Phase 3:

1. All variety data stored in single location (unified allotment storage)
2. No separate localStorage keys for varieties
3. No sync logic needed between storage systems
4. Existing user data fully migrated without loss
5. All tests passing
6. No breaking changes to user-facing features
7. Codebase simpler and more maintainable
8. Type system fully validates new architecture
