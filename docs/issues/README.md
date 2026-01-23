# Variety Management Refactor - GitHub Issues

This directory contains detailed specifications for Phase 2 and Phase 3 issues of the Variety Management Refactor initiative.

## Quick Reference

### Phase 2: Import/Export Reliability (Issues #5-8)

| Issue | Title | Priority | Size | Summary |
|-------|-------|----------|------|---------|
| #5 | Implement flush mechanism for debounced saves | High | M (4-8h) | Flush pending saves before import to prevent race condition overwrite |
| #6 | Add compost data to CompleteExport interface | High | M (4-6h) | Include compost tracking in export/import for complete backup |
| #7 | Fix import race conditions and verification | High | M (6-8h) | Add preview step and prevent dialog close before reload |
| #8 | Improve error handling and user feedback | High | M (5-7h) | Comprehensive error messages with recovery steps |

**Phase 2 Total Effort:** 19-29 hours (~1-2 weeks)
**Recommended Order:** #5 → #6 (parallel), then #7 → #8

### Phase 3: Variety Management Consolidation (Issues #9-12)

| Issue | Title | Priority | Size | Summary |
|-------|-------|----------|------|---------|
| #9 | Remove separate variety storage and useVarieties hook | High | M (3-5d) | Eliminate separate variety storage system and hook; update all components |
| #10 | Eliminate variety-allotment-sync service | High | M (2-4d) | Remove sync service; integrate logic into allotment storage layer |
| #11 | Implement one-time storage migration | High | L (4-6d) | Migrate legacy variety data to unified storage without data loss |
| #12 | Clean up redundant files and code | Medium | S (1-2d) | Final cleanup of deprecated code and documentation |

**Phase 3 Total Effort:** 10-17 days
**Recommended Order:** #9 → #10 → #11 → #12 (sequential dependencies)

## File Overview

### Phase 2 Files
- `PHASE-2-OVERVIEW.md` - High-level overview of Phase 2, dependencies, and testing strategy
- `phase-2-issue-5.md` - Implement flush mechanism for debounced saves
- `phase-2-issue-6.md` - Add compost data to CompleteExport interface
- `phase-2-issue-7.md` - Fix import race conditions and verification
- `phase-2-issue-8.md` - Improve error handling and user feedback

### Phase 3 Files
- `issue-9-remove-variety-storage.md` - Remove separate variety storage and useVarieties hook
- `issue-10-eliminate-sync-service.md` - Eliminate variety-allotment-sync service
- `issue-11-storage-migration.md` - Implement one-time storage migration
- `issue-12-cleanup.md` - Clean up redundant files and code

## Creating These Issues on GitHub

Each markdown file is formatted to be directly usable as a GitHub issue. To create an issue:

1. Go to the repository's Issues tab
2. Click "New Issue"
3. Copy the content from the relevant markdown file
4. Add the labels from the "## Labels" section
5. Set the priority using the issue template
6. Click "Create Issue"

### GitHub CLI Method - Phase 2

```bash
# Issue #5
gh issue create \
  --title "Implement flush mechanism for debounced saves" \
  --label "refactor,data-integrity,import-export,debouncing,phase-2" \
  --body "$(cat phase-2-issue-5.md)"

# Issue #6
gh issue create \
  --title "Add compost data to CompleteExport interface" \
  --label "refactor,data-integrity,import-export,compost-tracker,phase-2" \
  --body "$(cat phase-2-issue-6.md)"

# Issue #7
gh issue create \
  --title "Fix import race conditions and verification" \
  --label "refactor,data-integrity,import-export,race-condition,phase-2" \
  --body "$(cat phase-2-issue-7.md)"

# Issue #8
gh issue create \
  --title "Improve error handling and user feedback" \
  --label "refactor,error-handling,user-experience,import-export,phase-2" \
  --body "$(cat phase-2-issue-8.md)"
```

### GitHub CLI Method - Phase 3

```bash
# Issue #9
gh issue create \
  --title "Remove separate variety storage and useVarieties hook" \
  --label "refactor,variety-management,breaking-change,phase-3" \
  --body "$(cat issue-9-remove-variety-storage.md)"

# Issue #10
gh issue create \
  --title "Eliminate variety-allotment-sync service" \
  --label "refactor,variety-management,phase-3" \
  --body "$(cat issue-10-eliminate-sync-service.md)"

# Issue #11
gh issue create \
  --title "Implement one-time storage migration" \
  --label "refactor,variety-management,data-migration,phase-3" \
  --body "$(cat issue-11-storage-migration.md)"

# Issue #12
gh issue create \
  --title "Clean up redundant files and code" \
  --label "refactor,variety-management,cleanup,phase-3" \
  --body "$(cat issue-12-cleanup.md)"
```

## Implementation Roadmap

### Phase 3 Architecture Goal

Eliminate the dual storage architecture that has caused maintenance complexity:

**Before (Phase 2):**
- AllotmentData in `'allotment-unified-data'` (main storage)
- VarietyData in `'community-allotment-varieties'` (legacy storage)
- variety-allotment-sync service keeps them in sync
- Split brain potential if sync fails

**After (Phase 3):**
- AllotmentData in `'allotment-unified-data'` containing all varieties
- Single source of truth
- No separate sync needed
- Simpler, more maintainable code

### Sequential Dependencies

```
Issue #9: Remove Storage & Hook
    ↓ (must complete first)
Issue #10: Integrate Sync Logic
    ↓ (must complete first)
Issue #11: Migrate Legacy Data
    ↓ (must complete first)
Issue #12: Final Cleanup
```

**Why sequential?**
- #9 must finish first so there's no code importing from removed files
- #10 needs #9 done to integrate the sync logic safely
- #11 depends on both #9 and #10 to understand the new data structure
- #12 can only clean up after #11 confirms migration worked

## Context: Current State

### Separate Variety Storage System (To Be Removed)

**Files to Remove:**
- `src/services/variety-storage.ts` - Load/save variety data from separate localStorage
- `src/hooks/useVarieties.ts` - State management hook for varieties
- `src/services/variety-allotment-sync.ts` - One-way sync from plantings to varieties
- `src/types/variety-data.ts` - Type definitions for separate storage

**Current References:**
- `src/components/allotment/AddPlantingForm.tsx` imports `hasSeedsForYear`
- `src/components/allotment/DataManagement.tsx` imports `loadVarietyData`
- `src/hooks/useAllotment.ts` calls `syncPlantingToVariety`
- Tests in `src/__tests__/services/variety-storage.test.ts`

### Unified Storage System (Already Exists)

The `AllotmentData` in unified storage already contains:
```typescript
export interface AllotmentData {
  // ... other fields
  varieties: StoredVariety[]  // All varieties now here
  // ... metadata includes migration status
}
```

This was added in Phase 2. Phase 3 removes the separate storage and migration helpers.

## Success Criteria

Upon completion of Phase 3:

1. **Data Consolidation**: All variety data stored in single location (unified allotment storage)
2. **No Split Brain**: No separate localStorage keys for varieties
3. **No Sync Service**: Variety records automatically stay consistent with plantings
4. **Data Preservation**: Existing user data fully migrated without loss
5. **Code Quality**: All tests passing, no type errors, TypeScript strict mode compliant
6. **User Experience**: No breaking changes to user-facing features
7. **Maintainability**: Simpler codebase with fewer moving parts
8. **Performance**: Single save operation instead of dual saves

## Testing Strategy

### Unit Tests
- Each issue includes specific unit test requirements
- Focus on removed functionality still working through new paths
- Test migration logic thoroughly (idempotency, edge cases, error handling)

### E2E Tests
- Comprehensive coverage of variety workflows
- Add planting → variety auto-created
- Filter varieties by seed status → still works
- Export/import varieties → still works
- Migration on first load → transparent to user

### Integration Tests
- Data consistency: varieties match plantings
- No race conditions during saves
- Large dataset performance
- Concurrent operations

### Manual Testing
- Seed library workflow
- Adding plantings and variety suggestions
- Variety year planning
- Seed spend tracking

## Future Considerations

After Phase 3 is complete:

1. **Performance Optimization**: Monitor if single large AllotmentData causes issues; potentially split storage again if needed (but with clearer architecture)
2. **Indexing**: Consider adding variety index within AllotmentData for faster lookups
3. **Archiving**: Consider archiving variety records not used in recent years
4. **Export Formats**: Update export/import to reflect single storage format

## Questions & Clarifications

### Why Remove Separate Storage?

1. **Maintenance burden**: Two storage locations require sync logic to keep them consistent
2. **Data integrity**: Sync can fail, leaving data in inconsistent state
3. **Performance**: Dual storage and sync means more localStorage writes
4. **Complexity**: Code has to handle both storages, increases mental load
5. **User confusion**: Users see variety data in two places if something goes wrong

### Why Not Just Deprecate?

1. We actively use varieties in plantings, so can't just mark as deprecated
2. Need one-time migration to move user data
3. Removing entirely makes it clear this is the canonical location
4. Reduces technical debt now rather than carrying it forward

### Data Loss Concerns?

1. Migration logic is thoroughly tested
2. Idempotency ensures safe retries
3. Merge logic preserves all data from both sources
4. Detailed logging provides debugging trail
5. E2E tests verify migration doesn't lose data

## Related Documentation

- Phase 2 Implementation: See git history for when varieties were embedded in AllotmentData
- ADRs: Check `docs/adrs/` for architectural decision records
- Storage Design: See `docs/research/` for storage analysis

## Contact & Discussion

For questions about these issues:

1. Check the individual issue files in this directory
2. Review the summary document: `../github-issues-phase-3.md`
3. Reference the codebase:
   - `src/services/allotment-storage.ts` - Target storage system
   - `src/types/unified-allotment.ts` - Data model
   - `src/hooks/useAllotment.ts` - State management
