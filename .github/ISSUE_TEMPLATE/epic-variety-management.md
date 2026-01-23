---
name: "Epic: Variety Management Refactor"
about: Complete refactor of seed variety tracking system with advanced features
title: "Epic: Variety Management Refactor (Issues #13-20)"
labels: epic, variety-management
---

## Epic: Variety Management Refactor

This epic encompasses the complete refactoring and enhancement of the seed variety tracking system. It includes advanced features like archiving, renaming with cascade updates, data repair tools, and comprehensive testing.

## Overview

The variety management system is evolving to support:
- **Safe deletion** through soft archive without breaking references
- **Cascade updates** when renaming varieties
- **Data integrity** tools for detection and repair
- **Clear messaging** with actionable error messages
- **Comprehensive testing** for all new functionality
- **User migration** for existing data

## Phase 4: Advanced Variety Management (Issues #13-16)

### Core Features

**Issue #13: Soft Delete / Archive Functionality**
- Add archive field to varieties
- Create archive/restore operations
- Update queries to exclude archived by default
- Provide `includeArchived` flag for admin use
- **Effort:** 4-6 hours

**Issue #14: Rename with Cascade Updates**
- Implement rename validation
- Cascade updates to plantings and maintenance tasks
- Track rename history
- Return clear error messages for conflicts
- **Effort:** 6-8 hours

**Issue #15: Repair and Rebuild Tools**
- Detect data integrity issues
- Auto-repair corrupted data
- Validate system consistency
- Provide detailed repair reports
- **Effort:** 6-8 hours

**Issue #16: Enhanced Error Messages**
- Create typed error hierarchy
- Provide actionable user messages
- Include contextual details and suggestions
- Support i18n preparation
- **Effort:** 5-6 hours

**Phase 4 Total Effort:** ~25-30 hours

## Phase 5: Testing & Migration (Issues #17-20)

### Quality Assurance & User Migration

**Issue #17: Update Existing Tests**
- Refactor tests for computed fields
- Update yearsUsed test expectations
- Add computed value tests
- Maintain >80% coverage
- **Effort:** 4-5 hours

**Issue #18: Comprehensive Test Coverage**
- Create archive test suite
- Create rename test suite
- Create repair test suite
- Create error message tests
- Create integration tests
- Target: >85% coverage
- **Effort:** 8-10 hours

**Issue #19: Migration Script**
- Load user's backup file
- Migrate to new schema
- Add new fields with defaults
- Verify data integrity
- Generate output file
- **Effort:** 5-7 hours

**Issue #20: E2E Testing**
- Test full import/export cycle
- Test large dataset handling
- Verify data integrity through cycle
- Test edge cases
- Performance validation
- **Effort:** 5-6 hours

**Phase 5 Total Effort:** ~25-30 hours

## Architecture Decisions

### Data Model Changes

All changes maintain backward compatibility while adding new capabilities:

```typescript
// StoredVariety gains new fields
interface StoredVariety {
  // Existing fields
  id: string
  plantId: string
  name: string
  supplier?: string
  price?: number
  notes?: string
  yearsUsed: number[]        // Computed from plantings
  plannedYears: number[]
  seedsByYear: Record<number, SeedStatus>

  // New fields for Phase 4
  archived?: boolean         // Soft delete flag
  renamedFrom?: string[]     // Rename history
}
```

### Service Updates

New functions added to `variety-storage.ts`:
- Archive/restore operations
- Rename with validation
- Computed field builders
- Query filters for archived status

New module created:
- `variety-repair.ts` - Integrity detection and repair

New error types created:
- `variety-errors.ts` - Typed error hierarchy

### Hook Updates

`useVarieties` hook enhanced with:
- Archive/restore methods
- Rename method
- Repair/validate methods
- Error state tracking

## Key Features

### Archive Functionality
- Hide varieties without deleting them
- Preserve history and references
- Recover archived varieties anytime
- Include option for queries to show archived items

### Rename with Cascade
- Rename varieties safely
- Automatically update all references:
  - Plantings that use the variety
  - Maintenance tasks
  - Import/export metadata
- Prevent duplicate names for same plant
- Track rename history for audit trail

### Repair Tools
- **Detection**: Identify data integrity issues
  - Orphaned references
  - Missing fields
  - Duplicates
  - Inconsistencies
- **Repair**: Automatically fix issues
  - Remove invalid references
  - Merge duplicates
  - Rebuild computed fields
- **Validation**: Verify system health

### Error Management
- Typed error hierarchy
- Contextual error messages
- Actionable suggestions
- Formatted for user display and logging

## Testing Strategy

### Unit Tests
- Archive/restore operations
- Rename validation and cascade
- Repair detection and fixes
- Error type formatting

### Integration Tests
- Archive + rename interactions
- Rename + repair workflows
- Variety sync with allotment
- Import/export with new fields

### E2E Tests
- Full import/export cycle
- Large dataset handling
- UI responsiveness
- User workflows

### Coverage Goals
- Phase 4 new code: >90%
- Phase 5 tests: >85%
- Overall system: >80%

## Migration Path

### User's Data
1. Load existing backup file
2. Apply schema migrations
3. Add new fields with defaults
4. Compute missing values
5. Verify integrity
6. Generate migrated export

### Backward Compatibility
- New fields are optional
- Old data formats supported during load
- Migrations applied automatically
- No breaking changes to existing data

## Success Criteria

### Phase 4 Completion
- [ ] All issues #13-16 completed and merged
- [ ] All tests passing with >90% coverage on new code
- [ ] Code review approval
- [ ] Documentation updated

### Phase 5 Completion
- [ ] All issues #17-20 completed and merged
- [ ] Test coverage >85% for new functionality
- [ ] User's backup file successfully migrated
- [ ] E2E tests pass with all data scenarios
- [ ] Ready for user release

### Overall Success
- [ ] No data loss during migration
- [ ] Performance acceptable (operations <2s)
- [ ] Error messages clear and actionable
- [ ] System passes integrity validation
- [ ] Users can import/export without issues

## Dependencies & Timeline

### Dependency Graph
```
Phase 4:
  #13 (Archive)
    ↓
  #14 (Rename) ← depends on #13
  #15 (Repair) ← depends on #13, #14
  #16 (Errors) ← depends on #13, #14, #15

Phase 5:
  #17 (Update Tests) ← depends on #13-16
  #18 (Test Coverage) ← depends on #13-16, #17
  #19 (Migration) ← depends on #13-16, #17
  #20 (E2E Tests) ← depends on #13-16, #17, #18, #19
```

### Recommended Timeline
- **Week 1-2**: Phase 4 parallel work
  - Issue #13, #15, #16 can be done in parallel
  - Issue #14 starts after #13
- **Week 2-3**: Phase 4 completion
  - Complete all Phase 4 issues
  - Code review and fixes
- **Week 3-4**: Phase 5 implementation
  - Issue #17 and #18 parallel
  - Issue #19 and #20 parallel (after #17)
  - Testing and validation
- **Week 4**: Release preparation
  - Final testing
  - Documentation
  - Release

## Files Involved

### Core System Files
- `/src/types/unified-allotment.ts` - Data model updates
- `/src/types/variety-data.ts` - Variety type definitions
- `/src/services/variety-storage.ts` - Storage operations
- `/src/services/variety-allotment-sync.ts` - Sync logic
- `/src/hooks/useVarieties.ts` - State management hook

### New Files (Phase 4)
- `/src/types/variety-errors.ts` - Error definitions
- `/src/lib/variety-repair.ts` - Repair utilities

### New Files (Phase 5)
- `/src/scripts/migrate-variety-data.ts` - Migration script
- `/tests/variety-import-export.spec.ts` - E2E tests
- `/MIGRATION_GUIDE.md` - User documentation

### Test Files
- `/src/__tests__/services/variety-storage.test.ts` - Updated
- `/src/__tests__/lib/variety-repair.test.ts` - New
- `/src/__tests__/types/variety-errors.test.ts` - New
- `/src/__tests__/services/variety-integration.test.ts` - New

## Communications

### For Stakeholders
- Archive feature prevents accidental loss while keeping history
- Rename feature keeps data consistent across the app
- Repair tools ensure data integrity
- Migration ensures smooth transition for existing users

### For Developers
- New error types provide clear debugging information
- Test coverage ensures stability
- Documentation guides future maintenance
- Script automates user data migration

### For Users
- Archive is safe way to "delete" without losing data
- Clear error messages when things go wrong
- Backup file works smoothly with new system
- All data preserved through system upgrade

## Risk Mitigation

### Data Loss Risk
- Soft delete prevents accidental loss
- Repair tools detect issues early
- Comprehensive testing validates integrity
- Migration script verified before release

### Performance Risk
- Large dataset tests in E2E suite
- Repair tools optimized for bulk operations
- Query filtering minimizes unnecessary work
- Performance benchmarks documented

### Migration Risk
- Migration script tested on actual user data
- Dry-run verification before applying changes
- Rollback procedures documented
- User communication clear about process

## Questions & Clarifications

### Cascading Renames
- Q: Should renaming a variety update exports from previous years?
- A: Yes, only current data is affected; historical exports remain unchanged

### Archived Varieties
- Q: Can archived varieties be used in new plantings?
- A: No, archived varieties are hidden from add dialogs but can be restored

### Repair Operations
- Q: What happens to repairs if they break something?
- A: All repairs are logged; user can compare with backup file

### Migration
- Q: What if user's backup file can't be fully migrated?
- A: Script reports all issues; critical issues prevent migration; warnings allow continuation

---

**Epic Lead:** Team
**Start Date:** [TBD]
**Target Completion:** [TBD]
**Status:** Planning

Related Issues: #13, #14, #15, #16, #17, #18, #19, #20
