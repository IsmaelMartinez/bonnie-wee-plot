# Variety Management Refactor: Issue Specifications Summary

This document provides a quick reference and index to all GitHub issue specifications for the Variety Management Refactor epic (Issues #13-20).

## Overview

- **Total Issues:** 8 (4 Phase 4 + 4 Phase 5)
- **Total Effort:** ~50-60 hours
- **Status:** Ready for implementation
- **Files Created:** 9 markdown files

## Issue Index

### Phase 4: Advanced Variety Management

| # | Issue | Type | Effort | Dependencies |
|---|-------|------|--------|--------------|
| 13 | Soft delete (archive) | Feature | 4-6h | None |
| 14 | Rename with cascade | Feature | 6-8h | #13 |
| 15 | Repair tools | Feature | 6-8h | #13, #14 |
| 16 | Error messages | Enhancement | 5-6h | #13, #14, #15 |

**Phase 4 Total:** ~25-30 hours

### Phase 5: Testing & Migration

| # | Issue | Type | Effort | Dependencies |
|---|-------|------|--------|--------------|
| 17 | Update tests | Testing | 4-5h | #13-16 |
| 18 | Coverage | Testing | 8-10h | #13-16, #17 |
| 19 | Migration script | Feature | 5-7h | #13-16, #17 |
| 20 | E2E testing | Testing | 5-6h | All Phase 4 + #17-19 |

**Phase 5 Total:** ~25-30 hours

---

## Issue Details

### Issue #13: Implement soft delete (archive) functionality

**File:** `.github/ISSUE_TEMPLATE/issue-13-archive.md`

**Summary:** Add archive field to varieties, create archive/restore operations, update queries to respect archive status.

**Key Points:**
- New `archived: boolean` field on `StoredVariety`
- New functions: `archiveVariety()`, `restoreVariety()`, `getArchivedVarieties()`
- Query functions updated with `includeArchived` parameter
- Archived varieties excluded from queries by default
- Unit tests for archive/restore operations

**Acceptance Criteria:** 10 items
**Files to Modify:** 4 files
**Estimated Effort:** 4-6 hours

---

### Issue #14: Add variety rename with cascade updates

**File:** `.github/ISSUE_TEMPLATE/issue-14-rename.md`

**Summary:** Implement rename operation with validation, cascade updates to plantings/maintenance tasks, and history tracking.

**Key Points:**
- Validate rename: no empty names, no duplicates, length limits
- Cascade updates to plantings and maintenance tasks
- Optional rename history tracking
- Integration with `variety-allotment-sync.ts`
- Error messages for validation failures

**Acceptance Criteria:** 7 items
**Files to Modify:** 5 files
**Estimated Effort:** 6-8 hours
**Depends on:** #13

---

### Issue #15: Build variety repair and rebuild tools

**File:** `.github/ISSUE_TEMPLATE/issue-15-repair.md`

**Summary:** Create utilities to detect and repair data integrity issues in the variety system.

**Key Points:**
- New module: `variety-repair.ts`
- Detection: orphaned references, missing fields, duplicates, inconsistencies
- Repair: remove invalid refs, merge duplicates, rebuild computed fields
- Detailed repair reports with severity levels
- Logging with `@/lib/logger.ts`

**Acceptance Criteria:** 7 items
**Files to Create:** 2 files
**Files to Modify:** 2 files
**Estimated Effort:** 6-8 hours
**Depends on:** #13, #14

---

### Issue #16: Enhance variety management error messages

**File:** `.github/ISSUE_TEMPLATE/issue-16-errors.md`

**Summary:** Create typed error hierarchy with clear, actionable, contextual error messages.

**Key Points:**
- New module: `variety-errors.ts` with error types
- Each error has: code, message, details, suggestion
- Error types: NotFound, NameError, OperationError, IntegrityError, StorageError
- Centralized error message constants for i18n
- Hook maintains error state with `clearError()` method

**Acceptance Criteria:** 8 items
**Files to Create:** 1 file
**Files to Modify:** 3 files
**Estimated Effort:** 5-6 hours
**Depends on:** #13, #14, #15

---

### Issue #17: Update existing tests for computed fields

**File:** `.github/ISSUE_TEMPLATE/issue-17-tests.md`

**Summary:** Refactor existing variety tests to work with computed `yearsUsed` field instead of stored field.

**Key Points:**
- Audit existing tests for direct `yearsUsed` assignments
- Create test helpers for AllotmentData + VarietyData setup
- Update assertions to use computed values
- Add tests for computed accuracy and sync
- Maintain >80% coverage

**Acceptance Criteria:** 6 items
**Files to Modify:** 1 file
**Estimated Effort:** 4-5 hours
**Depends on:** #13-16

---

### Issue #18: Add comprehensive test coverage

**File:** `.github/ISSUE_TEMPLATE/issue-18-coverage.md`

**Summary:** Add test suites for new Phase 4 features and ensure >85% coverage.

**Key Points:**
- Archive test suite (>90% coverage)
- Rename test suite (>90% coverage)
- Repair test suite (>85% coverage)
- Error message tests (>85% coverage)
- Integration tests (archive+rename, rename+repair, full workflow)
- Optional performance tests

**Acceptance Criteria:** 8 items
**Files to Create:** 3 files
**Files to Modify:** 1 file
**Estimated Effort:** 8-10 hours
**Depends on:** #13-17

---

### Issue #19: Create migration script for user's export file

**File:** `.github/ISSUE_TEMPLATE/issue-19-migration.md`

**Summary:** Migrate user's backup file (`allotment-backup-2026-01-22.json`) to new schema with verification.

**Key Points:**
- Script takes input/output file paths
- Handles allotment v12 → current version migration
- Adds new fields: `archived: false`, `renamedFrom: []`
- Computes `yearsUsed` from plantings
- Validates consistency, reports issues
- Generates migrated export with metadata

**Acceptance Criteria:** 8 items
**Files to Create:** 2 files
**Files to Modify:** 1 file
**Estimated Effort:** 5-7 hours
**Depends on:** #13-17

---

### Issue #20: E2E testing and validation

**File:** `.github/ISSUE_TEMPLATE/issue-20-e2e.md`

**Summary:** End-to-end testing of complete import/export cycle with large datasets.

**Key Points:**
- Playwright E2E test suite
- Test scenarios: import, add, modify, export, re-import, verify
- Large dataset testing (100+ varieties, 200+ plantings)
- Data integrity validation through cycle
- Edge cases: empty data, corrupt files, performance
- Accessibility checks

**Acceptance Criteria:** 7 items
**Files to Create:** 2 files
**Files to Modify:** 1 file
**Estimated Effort:** 5-6 hours
**Depends on:** All Phase 4 + #17-19

---

## Epic Document

**File:** `.github/ISSUE_TEMPLATE/epic-variety-management.md`

**Contains:**
- Epic overview and objectives
- Phase breakdown with dependencies
- Architecture decisions
- Key features explained
- Testing strategy
- Migration path
- Success criteria
- Timeline and resource recommendations
- Risk mitigation strategies
- Q&A for clarifications

---

## Comprehensive Issues Document

**File:** `ISSUES.md`

Contains complete specifications for all 8 issues with:
- Detailed problem statements
- Complete acceptance criteria
- Implementation guidance
- Testing requirements
- Estimated effort
- File listings
- Related dependencies

---

## Quick Start for Implementation

### Setup
1. Review `epic-variety-management.md` for overall context
2. Read `ISSUES.md` for complete specifications
3. Create GitHub issues from individual `.md` files in `.github/ISSUE_TEMPLATE/`

### Execution Order

**Week 1-2: Phase 4**
- Start #13 (Archive) - ~4-6 hours
- Start #15 (Repair) in parallel - ~6-8 hours
- Start #16 (Errors) in parallel - ~5-6 hours
- Start #14 (Rename) after #13 - ~6-8 hours

**Week 3: Phase 4 Completion**
- Complete any remaining Phase 4 issues
- Code review and merges
- Prepare Phase 5

**Week 3-4: Phase 5**
- Start #17 (Update Tests) - ~4-5 hours
- Start #18 (Coverage) in parallel - ~8-10 hours
- Start #19 (Migration) in parallel - ~5-7 hours
- Start #20 (E2E) after #19 - ~5-6 hours

**Week 4: Testing & Release**
- Finalize all tests
- Run migration script on user data
- Release preparation

### Coordination Notes

**Blocking Dependencies:**
- #14 (Rename) requires #13 (Archive) to be merged first
- #15 (Repair) needs #13 and #14 available
- Phase 5 issues depend on Phase 4 completion

**Parallel Opportunities:**
- Phase 4: #13, #15, #16 can be worked on simultaneously
- Phase 4: #14 starts when #13 is done
- Phase 5: #17 and #18 can be parallel
- Phase 5: #19 and #20 can be parallel (after dependencies)

### Code Review Strategy

**Phase 4 Reviews:**
- Review #13 first (base for others)
- Review #15 and #16 (independent of #14)
- Review #14 last (depends on #13)

**Phase 5 Reviews:**
- Review #17 (test refactoring)
- Review #18 in batches (large PR, review by test area)
- Review #19 with actual migration run
- Review #20 after #17-19 are merged

---

## Files Summary

### Created Files

1. `ISSUES.md` - Complete specifications (1 file, ~850 lines)
2. `.github/ISSUE_TEMPLATE/issue-13-archive.md` - Archive feature
3. `.github/ISSUE_TEMPLATE/issue-14-rename.md` - Rename feature
4. `.github/ISSUE_TEMPLATE/issue-15-repair.md` - Repair tools
5. `.github/ISSUE_TEMPLATE/issue-16-errors.md` - Error messages
6. `.github/ISSUE_TEMPLATE/issue-17-tests.md` - Test updates
7. `.github/ISSUE_TEMPLATE/issue-18-coverage.md` - Test coverage
8. `.github/ISSUE_TEMPLATE/issue-19-migration.md` - Migration script
9. `.github/ISSUE_TEMPLATE/epic-variety-management.md` - Epic overview

### Total Size

- 1 comprehensive document (ISSUES.md)
- 1 epic document
- 8 individual issue specifications
- Total: ~5000+ lines of detailed specifications

---

## Next Steps

1. **Review** - Stakeholders review this specification
2. **Create Issues** - Use the individual `.md` files to create GitHub issues
3. **Link Issues** - Set up dependency links in GitHub
4. **Plan Sprints** - Assign to team members based on timeline
5. **Implement** - Follow the implementation details in each issue
6. **Test** - Execute test plans specified in each issue
7. **Release** - Deploy after all issues complete and tests pass

---

## Contact & Questions

For questions about these specifications, refer to:
- `ISSUES.md` - Complete details on each issue
- `epic-variety-management.md` - Architecture and strategic context
- Individual issue files - Specific implementation guidance

---

**Created:** 2026-01-22
**Version:** 1.0
**Status:** Ready for Implementation
