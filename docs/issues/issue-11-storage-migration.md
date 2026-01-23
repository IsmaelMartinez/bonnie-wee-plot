# Implement one-time storage migration

## Labels
`refactor`, `variety-management`, `data-migration`, `phase-3`

## Priority
High

## Size
L (4-6 days)

## Description

Existing users have variety data stored in the separate `'community-allotment-varieties'` localStorage key. After issues #9 and #10 are completed, this data becomes inaccessible. This issue implements a robust one-time migration that moves all variety data from the legacy storage into the unified allotment storage, ensuring zero data loss for existing users.

The migration must be:
- **Automatic**: Run on first app load if needed
- **Idempotent**: Safe to run multiple times without duplicating data
- **Non-destructive**: Never deletes data, only moves/merges
- **Logged**: Tracks success/failure for debugging
- **Tested**: Comprehensive coverage of edge cases

## Acceptance Criteria

- [ ] Create `src/services/storage-migration.ts` with migration logic
- [ ] Migration runs automatically on app load in `src/hooks/useAllotment.ts` before data is accessed
- [ ] Check for legacy variety storage and unified allotment storage:
  - [ ] If legacy storage exists and unified storage is empty → migrate all varieties
  - [ ] If both exist → merge them intelligently (no duplicates based on plantId + name matching)
  - [ ] If only unified storage exists → nothing to do
- [ ] Merge logic handles duplicate varieties intelligently:
  - [ ] Match by (plantId + normalized name)
  - [ ] Keep historical year data from both sources
  - [ ] Combine plannedYears and yearsUsed sets
  - [ ] Preserve seed status information
- [ ] After successful migration, legacy storage key remains for backward compatibility (don't delete immediately)
- [ ] Migration status tracked in localStorage to prevent re-running (flag in unified storage metadata)
- [ ] Errors logged but don't break app startup
- [ ] Detailed migration report available for debugging (logs what was migrated, any conflicts, etc.)
- [ ] Test with realistic data scenarios (duplicates, conflicts, corrupted data)

## Implementation Details

### Files to Modify/Create

1. **Create `src/services/storage-migration.ts`**
   - Export `migrateVarietyDataIfNeeded()` function
   - Implements detection and migration logic
   - Handles merging of duplicate varieties
   - Records migration completion in allotment metadata

2. **Modify `src/services/allotment-storage.ts`**
   - Add metadata field to track migration status: `varietyMigrationCompleted: boolean`
   - Update `AllotmentData` meta to include this flag

3. **Modify `src/hooks/useAllotment.ts`**
   - Call `migrateVarietyDataIfNeeded()` in initialization, before loading/saving data
   - Handle any migration errors gracefully (log but don't crash)

### Migration Algorithm

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

### Merge Strategy for Duplicate Varieties

When the same variety exists in both legacy and unified storage:
- Combine all planned years (take union, sort)
- Combine all years used (take union, sort)
- Combine seed status per year (prefer 'have' > 'ordered' > 'none')
- Combine notes (if unified is empty or generic, use legacy)
- Keep unified price/supplier if present (assume more recently updated)

## Testing Requirements

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

## Dependencies

- Requires #9 (separate storage removed)
- Requires #10 (sync service removed)
- Must complete before #12 (cleanup)
- No API changes needed; pure data migration
