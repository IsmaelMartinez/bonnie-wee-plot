# Phase 3: Variety Management Refactor - Issue Specifications Summary

## Overview

This document provides a comprehensive summary of the detailed GitHub issue specifications created for Phase 3 of the Variety Management Refactor. These four issues (#9-12) complete the elimination of the dual storage architecture that has split variety data between separate localStorage keys.

## What We're Solving

### The Problem
The application currently maintains varieties in two separate locations:
- `'allotment-unified-data'` - Main allotment storage
- `'community-allotment-varieties'` - Separate variety storage

This split-brain architecture requires:
- A one-way sync service (`variety-allotment-sync.ts`) to keep them in sync
- Separate state management hook (`useVarieties`)
- Separate storage service (`variety-storage.ts`)
- Complex logic to handle both sources

Phase 2 already embedded varieties into the unified storage. Phase 3 removes the legacy system entirely.

### The Solution
Consolidate to a single source of truth:
- All varieties stored in `AllotmentData.varieties`
- Sync happens automatically when plantings are added
- Simpler state management through `useAllotment` hook
- Migration preserves all existing user data

## The Four Issues

### Issue #9: Remove separate variety storage and useVarieties hook
**Priority:** High | **Size:** M (3-5 days)

Removes the legacy storage system entirely:
- Delete `src/services/variety-storage.ts`
- Delete `src/hooks/useVarieties.ts`
- Delete `src/types/variety-data.ts`
- Update all components to use unified storage
- Move helper functions like `hasSeedsForYear` to utilities if needed

**Key Challenge:** Finding and updating all 8 files that import from variety-storage

**Files Affected:**
- `src/components/allotment/AddPlantingForm.tsx`
- `src/components/allotment/DataManagement.tsx`
- Test file: `src/__tests__/services/variety-storage.test.ts`

### Issue #10: Eliminate variety-allotment-sync service
**Priority:** High | **Size:** M (2-4 days)

Removes the sync service and integrates its logic into the storage layer:
- Delete `src/services/variety-allotment-sync.ts`
- Remove sync calls from `src/hooks/useAllotment.ts`
- Add variety sync logic to `src/services/allotment-storage.ts`
- When a planting is added, automatically create/update matching variety

**Key Changes:**
- `addPlanting()` now handles variety sync internally
- No more separate `syncPlantingToVariety()` calls
- Matching logic (case-insensitive, whitespace-normalized) preserved

**Files Affected:**
- `src/services/allotment-storage.ts` (adds sync logic)
- `src/hooks/useAllotment.ts` (removes sync call)

### Issue #11: Implement one-time storage migration
**Priority:** High | **Size:** L (4-6 days)

Migrates existing user data from legacy to unified storage:
- Create `src/services/storage-migration.ts`
- Detect legacy variety storage on app load
- Merge data intelligently (by plantId + normalized name)
- Track migration status in AllotmentData metadata
- Ensure idempotency (safe to run multiple times)

**Key Features:**
- Automatic on first load
- Non-destructive (only moves, never deletes)
- Comprehensive logging
- Handles duplicates intelligently
- Validates data integrity

**Merge Strategy:**
- Match varieties by (plantId + normalized name)
- Combine all years (plannedYears, yearsUsed)
- Combine seed status per year (prefer 'have')
- Preserve notes and metadata from both sources

**Files to Create:**
- `src/services/storage-migration.ts` (new)

**Files to Modify:**
- `src/services/allotment-storage.ts` (add migration flag to metadata)
- `src/hooks/useAllotment.ts` (call migration on init)

### Issue #12: Clean up redundant files and code
**Priority:** Medium | **Size:** S (1-2 days)

Final cleanup after migration is verified:
- Remove legacy storage key from localStorage (or add cleanup logic)
- Remove any fallback code
- Update all documentation and comments
- Verify no dead imports
- Run type-checker to ensure no errors

**Documentation Updates:**
- `CLAUDE.md` - Remove variety storage section
- Inline comments referencing old system
- ADR documentation (optional: create ADR for unified storage)

## Implementation Roadmap

### Phase Timeline
```
Week 1:
  Mon-Fri: Issue #9 (Remove storage & hook)
    - ~3-5 days
    - Block #10 until complete

Week 2:
  Mon-Tue: Issue #10 (Eliminate sync service)
    - ~2-4 days
    - Block #11 until complete

Week 2-3:
  Wed-Fri+Mon-Tue: Issue #11 (Storage migration)
    - ~4-6 days
    - Block #12 until complete

Week 3:
  Wed-Thu: Issue #12 (Final cleanup)
    - ~1-2 days
    - Can be parallelized if needed

Total: ~10-17 days (~2.5 weeks)
```

### Why Sequential?

Each issue must be completed before the next for good reasons:

1. **#9 → #10:** Can't integrate sync logic into storage while old storage files still exist (import conflicts)
2. **#10 → #11:** Migration needs to understand new data structure; sync must be internal first
3. **#11 → #12:** Can't cleanup until migration is tested and verified working
4. **#12 is final:** Can only remove legacy code after we're 100% sure migration worked

## Key Design Decisions

### 1. Keep Legacy Storage Key (Initially)
Don't delete `'community-allotment-varieties'` after migration:
- Provides safety valve if new code has bugs
- Users who downgrade won't lose data
- Can add cleanup UI later if desired
- Gradual rollout reduces risk

### 2. Merge Intelligently, Don't Overwrite
When both storages exist:
- Match by (plantId + normalized name)
- Combine all data from both sources
- Never lose information
- Handles users who edited data in both systems

### 3. Automatic, Transparent Migration
- No user action required
- Happens on first load
- No breaking changes visible to users
- Logged for debugging if issues arise

### 4. Comprehensive Testing
Each issue includes:
- Unit tests for new/modified functions
- E2E tests for user workflows
- Edge case tests (corruption, duplicates, large datasets)
- Integration tests (data consistency)
- Performance tests (large variety databases)

## Risk Mitigation

### Data Loss Prevention
- Merge logic preserves all data from both sources
- Idempotent migration (safe to retry)
- Validation before and after migration
- Detailed logging of all operations
- E2E tests verify no data lost

### Rollback Plan
If migration causes issues:
1. Revert code changes from #9-11
2. Users automatically fall back to legacy storage
3. They'll need to update app again once fixed
4. No data loss because legacy key still exists

### Validation Strategy
- Migration includes checksums/counts
- Compare variety counts before/after
- Verify seed status data preserved
- Check year ranges intact
- Test with production-like datasets

## Success Metrics

### Code Quality
- [ ] No TypeScript errors in strict mode
- [ ] All tests passing (unit + e2e + integration)
- [ ] ESLint passes with no warnings
- [ ] No dead code or unused imports
- [ ] Code coverage maintained or improved

### Functionality
- [ ] All variety workflows work identically
- [ ] Seed library unchanged from user perspective
- [ ] Adding plantings still suggests varieties
- [ ] Variety filtering/sorting works
- [ ] Export/import unchanged

### Data Integrity
- [ ] Zero varieties lost in migration
- [ ] Year data preserved correctly
- [ ] Seed status maintained
- [ ] Supplier/price data intact
- [ ] Historical records preserved

### User Experience
- [ ] Migration transparent (users don't see it)
- [ ] No breaking changes
- [ ] Performance same or better
- [ ] No console errors during migration
- [ ] Logging helps with debugging

## Testing Strategy

### Unit Tests (Per Issue)
- **#9:** Component tests using unified storage
- **#10:** Storage layer tests for variety sync
- **#11:** Migration algorithm tests (edge cases!)
- **#12:** No new tests; just verify existing pass

### E2E Tests
```
Scenario 1: Adding a planting
  1. Open app
  2. Add planting with variety name
  3. Add another planting with same variety
  4. Verify variety shows up once with both years

Scenario 2: Migration
  1. Set up localStorage with legacy variety data
  2. Initialize app
  3. Verify migration runs
  4. Verify data accessible through UI
  5. Reload and verify migration doesn't re-run

Scenario 3: Seed status
  1. Mark variety as having seeds
  2. Add planting
  3. Verify variety suggestions prioritize it
  4. Verify seed status persists on reload
```

### Edge Cases to Test
- Very large variety database (1000+ varieties)
- Special characters in variety names
- Duplicate varieties (same name, different suppliers)
- Corrupted JSON in legacy storage
- Partially migrated data
- Both storages missing

## Documentation Files Created

This initiative created the following documentation:

### Summary Documents
- `/docs/github-issues-phase-3.md` - Comprehensive guide with all issues
- `/PHASE-3-ISSUES-SUMMARY.md` - This file

### Individual Issue Specifications
- `/docs/issues/issue-9-remove-variety-storage.md`
- `/docs/issues/issue-10-eliminate-sync-service.md`
- `/docs/issues/issue-11-storage-migration.md`
- `/docs/issues/issue-12-cleanup.md`
- `/docs/issues/README.md` - Quick reference and creation guide

## Files Impacted Summary

### To Delete Entirely
- `src/services/variety-storage.ts`
- `src/services/variety-allotment-sync.ts`
- `src/hooks/useVarieties.ts`
- `src/types/variety-data.ts`

### To Modify
- `src/services/allotment-storage.ts` - Add variety sync, add migration flag
- `src/hooks/useAllotment.ts` - Remove sync call, add migration call
- `src/components/allotment/AddPlantingForm.tsx` - Use unified storage
- `src/components/allotment/DataManagement.tsx` - Use unified storage
- `CLAUDE.md` - Update documentation

### To Create
- `src/services/storage-migration.ts` - Migration logic (Issue #11)
- `src/lib/variety-utils.ts` - Optional: utility functions like `hasSeedsForYear`

### Tests to Update
- `src/__tests__/services/variety-storage.test.ts` - Move to unified storage tests
- `src/__tests__/services/allotment-storage.test.ts` - Add variety sync tests
- New file: `src/__tests__/services/storage-migration.test.ts` (Issue #11)

## Getting Started

### For Implementation
1. Read `/docs/issues/issue-9-remove-variety-storage.md` to understand scope
2. Map all imports of removed modules
3. Implement changes following the acceptance criteria
4. Run tests frequently
5. Follow the sequential order (#9 → #10 → #11 → #12)

### For Code Review
1. Verify each issue's acceptance criteria are met
2. Check test coverage for new functionality
3. Verify migration logic is idempotent
4. Confirm no data loss in migration tests
5. Validate TypeScript strict mode compliance

### For Project Management
1. Create issues in GitHub using provided markdown files
2. Use the timeline provided (~10-17 days)
3. Plan for adequate testing time (migration is complex)
4. Have rollback plan ready
5. Monitor for issues after deployment

## Questions Answered

### Q: Why not keep both storages indefinitely?
A: Technical debt accumulates. Every piece of code has to handle both systems. The sync service is a failure point. Better to clean up now while migration logic is fresh.

### Q: What if migration fails for a user?
A: Legacy storage still exists, so we can retry. Error logging helps diagnose. E2E tests ensure we don't deploy a breaking migration.

### Q: How long will it take?
A: ~10-17 days depending on team size and testing thoroughness. Can be parallelized with other work after #9-10 are done.

### Q: Will users notice anything?
A: No. Migration is transparent. All functionality remains identical. This is purely internal refactoring.

### Q: What's the rollback plan?
A: Revert code changes from #9-11. Users fall back to legacy storage. Requires redeploy. No data loss because legacy key still exists.

## Next Steps

1. Review the specifications in `/docs/issues/` directory
2. Create GitHub issues using the markdown files
3. Prioritize #9-12 for next sprint/cycle
4. Allocate team members for sequential implementation
5. Set up review process to verify each phase completes correctly
6. Plan testing strategy and rollback scenarios
7. Monitor production after each issue is deployed

## Contact & Support

For clarification on these specifications:
1. Review individual issue files in `/docs/issues/`
2. Check `/docs/github-issues-phase-3.md` for detailed context
3. Reference the codebase files mentioned in each issue
4. Check git history for Phase 2 work (how varieties were embedded)

## Appendix: Architecture Diagrams

### Before (Phase 2 End)
```
AllotmentData                    VarietyData
(unified-data)                   (varieties)
├── areas[]                       ├── varieties[]
├── seasons[]                     └── meta
├── varieties[]  ←→ sync ←→      └── meta
├── meta
└── ...

Sync Service Required (One-way: plantings → varieties)
Risk: Sync can fail, split-brain possible
```

### After (Phase 3 End)
```
AllotmentData (unified-data)
├── areas[]
├── seasons[]
├── varieties[]  ← All variety data here
├── meta
│   ├── varietyMigrationCompleted
│   └── ...
└── ...

No sync service needed (Everything in one place)
Simpler: Single save, no split-brain risk
```

## Version History

- **v1.0** (2026-01-22): Initial creation of Phase 3 issue specifications
  - 4 detailed issues created
  - Total estimated effort: 10-17 days
  - All specifications ready for GitHub issue creation
