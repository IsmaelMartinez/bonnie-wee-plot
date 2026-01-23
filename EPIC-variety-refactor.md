# Epic: Variety Management Refactor & Import/Export Reliability

## Overview

Refactor variety/seed management to eliminate dual storage architecture and fix import/export reliability issues. Make plantings the single source of truth for seed usage tracking.

## Problem Statement

The current system suffers from:
1. **Split-brain storage**: Varieties exist in two localStorage locations that get out of sync
2. **Manual tracking**: `yearsUsed` field is never automatically updated from actual plantings
3. **One-way sync**: Adding plantings updates varieties, but removing plantings doesn't
4. **Import failures**: Race conditions with debounced saves, missing compost data
5. **Silent errors**: Export failures, reload errors, and verification issues are invisible to users

## Goals

- [x] Eliminate dual variety storage completely
- [x] Make plantings the authoritative source for variety usage
- [x] Compute `yearsUsed` from actual plantings (indexed for performance)
- [x] Fix import/export race conditions and add compost data
- [x] Improve error handling and user feedback
- [x] Maintain backward compatibility with existing backups
- [x] Migrate user's existing export file to new format
- [x] Comprehensive test coverage for all changes

## Success Metrics

1. Import → Export produces identical data (no drift)
2. Rapid sequential imports don't corrupt data (no race conditions)
3. All e2e tests pass including new scenarios
4. Seeds page shows accurate usage data derived from plantings
5. User's export file successfully migrates with data verification

## Implementation Phases

### Phase 1: Data Model & Index Infrastructure
- Clean up StoredVariety type (remove yearsUsed field)
- Add isArchived field for soft delete
- Implement indexed variety usage query system
- Add performance optimizations with memoization

### Phase 2: Import/Export Reliability
- Fix race conditions with flush mechanism
- Add compost data to export/import
- Improve error handling and verification
- Add progress indicators and better UX

### Phase 3: Storage Consolidation
- Remove separate variety storage completely
- Eliminate variety-allotment-sync service
- One-time migration for existing users
- Clean up redundant code and files

### Phase 4: Variety Management UX
- Implement soft delete (archive) functionality
- Add cascade warnings and rename propagation
- Build variety repair/rebuild tools
- Enhance error messages and recovery

### Phase 5: Testing & Migration
- Update all affected tests
- Add new test coverage for computed fields
- Create migration script for user's export
- Comprehensive e2e testing

## Issues

### Phase 1: Data Model & Infrastructure
- #1: Remove yearsUsed field and implement computed queries
- #2: Add isArchived field for soft delete
- #3: Implement variety usage index builder
- #4: Add memoization and performance optimizations

### Phase 2: Import/Export Reliability
- #5: Implement flush mechanism for debounced saves
- #6: Add compost data to CompleteExport interface
- #7: Fix import race conditions and verification
- #8: Improve error handling and user feedback

### Phase 3: Storage Consolidation
- #9: Remove separate variety storage and useVarieties hook
- #10: Eliminate variety-allotment-sync service
- #11: Implement one-time storage migration
- #12: Clean up redundant files and code

### Phase 4: Variety Management UX
- #13: Implement soft delete (archive) functionality
- #14: Add variety rename with cascade updates
- #15: Build variety repair and rebuild tools
- #16: Enhance variety management error messages

### Phase 5: Testing & Migration
- #17: Update existing tests for computed fields
- #18: Add comprehensive test coverage
- #19: Create migration script for user's export file
- #20: E2E testing and validation

## Dependencies

```
Phase 1 (Data Model) → Phase 2 (Import/Export)
Phase 1 (Data Model) → Phase 3 (Consolidation)
Phase 2 (Import/Export) → Phase 5 (Testing)
Phase 3 (Consolidation) → Phase 4 (UX)
Phase 4 (UX) → Phase 5 (Testing)
```

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Create automatic backups, verification step |
| Performance degradation | Medium | Indexed queries, memoization, benchmark testing |
| Breaking existing functionality | High | Comprehensive test coverage, phased rollout |
| User confusion | Medium | Clear error messages, migration guides |

## Rollback Plan

1. Keep old variety storage temporarily (mark deprecated)
2. Feature flag for using old vs new variety system
3. Pre-migration backups stored in localStorage
4. Restore from backup if migration fails

## Timeline

- Phase 1: 6-8 hours
- Phase 2: 6-8 hours
- Phase 3: 4-6 hours
- Phase 4: 4-6 hours
- Phase 5: 6-8 hours
- **Total: ~26-36 hours (3-4.5 days)**

## Out of Scope

- External API integration for variety data
- Variety recommendation engine
- Multi-user collaboration on variety planning
- Mobile app native features
