# GitHub Issues: Refined Variety Management Refactor (12 Issues)

## Epic Overview

**Title:** Variety Management Refactor & Import/Export Reliability
**Labels:** `epic`, `refactor`, `data-integrity`
**Effort:** 18-24 hours
**Team:** 2 developers, 2.5-3 days

**Goals:**
- Eliminate dual storage architecture
- Make plantings authoritative for variety usage tracking
- Fix import/export race conditions
- Add missing compost data to exports
- Migrate user's existing export file

---

## Phase 1: Data Model Foundation

### Issue #1: Data Model Cleanup and Computed Queries

**Labels:** `refactor`, `data-model`, `performance`
**Priority:** P0 (Critical)
**Size:** M (6-8 hours)
**Assignee:** Developer A

**Description:**

Remove the `yearsUsed` field from `StoredVariety` and replace with computed queries from actual planting data. This makes plantings the single source of truth for variety usage.

**Acceptance Criteria:**
- [ ] Remove `yearsUsed` field from `StoredVariety` interface
- [ ] Create `getVarietyUsedYears(varietyId, allotmentData)` function that queries plantings
- [ ] Update all variety queries to use computed values
- [ ] Add schema migration (v12 → v13) to remove yearsUsed
- [ ] Update Seeds page to use computed queries
- [ ] All tests pass with computed values

**Files to Modify:**
- `src/types/unified-allotment.ts`
- `src/lib/variety-queries.ts` (new file)
- `src/services/variety-storage.ts`
- `src/services/allotment-storage.ts` (migration)
- `src/app/seeds/page.tsx`

**Dependencies:** None (Phase 1 start)

---

### Issue #2: Add Archive Field for Soft Delete

**Labels:** `enhancement`, `data-model`
**Priority:** P1 (High)
**Size:** S (4-5 hours)
**Assignee:** Developer B

**Description:**

Add `isArchived?: boolean` field to support soft delete of varieties without breaking planting references.

**Acceptance Criteria:**
- [ ] Add `isArchived?: boolean` to `StoredVariety` interface
- [ ] Initialize field as `false` for all new varieties
- [ ] Create `archiveVariety()` and `unarchiveVariety()` functions
- [ ] Update query functions to filter archived by default (with option to include)
- [ ] Add migration to set `isArchived: false` for existing varieties
- [ ] Update Seeds page to hide archived varieties

**Files to Modify:**
- `src/types/unified-allotment.ts`
- `src/services/variety-storage.ts`
- `src/services/allotment-storage.ts` (migration)
- `src/app/seeds/page.tsx`

**Dependencies:** None (can run parallel with #1)

---

## Phase 2: Import/Export Reliability

### Issue #3: Fix Import/Export Reliability

**Labels:** `bug`, `import-export`, `critical`
**Priority:** P0 (Critical)
**Size:** L (10-14 hours)
**Assignee:** Developer A

**Description:**

Fix critical race conditions in import/export, add compost data, and implement proper verification. This consolidates original issues #5, #6, and #7.

**CRITICAL FIXES:**
1. Flush mechanism that actually waits for completion (not fake 100ms timeout)
2. Schema validation BEFORE preview generation
3. Don't close dialog until reload completes

**Acceptance Criteria:**
- [ ] Implement `flushSave()` that returns Promise and verifies localStorage write
- [ ] Add compost data to `CompleteExport` interface
- [ ] Load and include compost data in exports
- [ ] Import and save compost data (if present)
- [ ] Add full schema validation before generating preview
- [ ] Show import preview with verified counts
- [ ] Wait for reload completion before showing success
- [ ] Add verification that imported data persisted correctly
- [ ] Test multi-tab scenarios

**Files to Modify:**
- `src/hooks/usePersistedStorage.ts` (flush mechanism)
- `src/types/unified-allotment.ts` (CompleteExport + compost)
- `src/components/allotment/DataManagement.tsx` (import/export flow)
- `src/services/compost-storage.ts` (load/save)
- `src/services/allotment-storage.ts` (validation)

**Dependencies:** Phase 1 complete

---

### Issue #4: Improve Error Handling

**Labels:** `enhancement`, `error-handling`
**Priority:** P1 (High)
**Size:** M (8-10 hours)
**Assignee:** Developer B

**Description:**

Add comprehensive error handling for import/export operations with user-friendly messages and recovery suggestions.

**Acceptance Criteria:**
- [ ] Create structured error types (ExportError, ImportError)
- [ ] Add storage quota checking before save operations
- [ ] Implement quota exceeded error handling with suggestions
- [ ] Add version mismatch detection and upgrade guidance
- [ ] Create pre-import backup with verification
- [ ] Show export success/error feedback (not just console)
- [ ] Add error recovery workflows
- [ ] Test error scenarios (quota, corrupt data, version mismatch)

**Files to Modify:**
- `src/types/errors.ts` (new file)
- `src/components/allotment/DataManagement.tsx`
- `src/services/allotment-storage.ts`
- `src/lib/storage-utils.ts` (new file)

**Dependencies:** None (can run parallel with #3)

---

## Phase 3: Storage Consolidation

### Issue #5: Storage Migration (MUST COME FIRST)

**Labels:** `migration`, `critical`, `data-safety`
**Priority:** P0 (Critical)
**Size:** M (5-7 hours)
**Assignee:** Developer A

**Description:**

**CRITICAL SEQUENCING:** This issue MUST complete before Issue #6 (removal). Migration must happen while both storage systems exist.

One-time migration from dual storage to unified storage with full safety measures.

**NEW REQUIREMENTS (from risk analysis):**
- Dry-run mode
- Atomic transaction
- Rollback capability
- Realistic dataset testing

**Acceptance Criteria:**
- [ ] Create `migrateDryRun()` that logs plan without executing
- [ ] Implement atomic migration (backup → migrate → verify → commit)
- [ ] Add explicit `rollbackMigration()` function
- [ ] Merge varieties from both stores with duplicate detection
- [ ] Add `isArchived: false` to all migrated varieties
- [ ] Create migration report with conflicts resolved
- [ ] Test with large datasets (100+ varieties)
- [ ] Verify no data loss after migration
- [ ] Keep old storage temporarily for rollback

**Files to Modify:**
- `src/services/allotment-storage.ts` (migration logic)
- `src/services/variety-migration.ts` (new file)
- `src/lib/migration-utils.ts` (new file)

**Dependencies:** Phase 2 complete

---

### Issue #6: Remove Dual Storage

**Labels:** `refactor`, `cleanup`
**Priority:** P1 (High)
**Size:** S (3-5 hours)
**Assignee:** Developer A

**Description:**

**MUST WAIT FOR #5:** Only remove storage after migration proven stable.

Remove separate variety storage and integrate sync logic into unified storage.

**Acceptance Criteria:**
- [ ] Remove `src/services/variety-storage.ts`
- [ ] Remove `src/hooks/useVarieties.ts`
- [ ] Remove `src/services/variety-allotment-sync.ts`
- [ ] Update Seeds page to use `useAllotment` only
- [ ] Integrate variety sync into `addPlanting()` function
- [ ] Update all imports across codebase
- [ ] Remove `VARIETY_STORAGE_KEY` constant
- [ ] All tests pass after removal

**Files to Modify:**
- Delete: `src/services/variety-storage.ts`, `src/hooks/useVarieties.ts`, `src/services/variety-allotment-sync.ts`
- Update: `src/app/seeds/page.tsx`, `src/hooks/useAllotment.ts`, `src/services/allotment-storage.ts`

**Dependencies:** Issue #5 complete and stable (2 week buffer recommended)

---

### Issue #7: Cleanup and Documentation

**Labels:** `cleanup`, `documentation`
**Priority:** P2 (Medium)
**Size:** S (2-3 hours)
**Assignee:** Developer B

**Description:**

Clean up deprecated files and update documentation. Add basic error message improvements.

**Acceptance Criteria:**
- [ ] Remove old migration code (after 6 months)
- [ ] Update CLAUDE.md with new architecture
- [ ] Create ADR-018 documenting refactor decisions
- [ ] Update import/export documentation
- [ ] Add troubleshooting guide for common errors
- [ ] Remove deprecated type definitions
- [ ] Update comments referencing old architecture

**Files to Modify:**
- `CLAUDE.md`
- `docs/architecture/ADR-018-variety-refactor.md` (new)
- `docs/guides/import-export.md`
- Various code comments

**Dependencies:** Issue #6 complete

---

## Phase 4: Testing and Validation

### Issue #8: Update and Add Tests

**Labels:** `testing`, `quality`
**Priority:** P1 (High)
**Size:** M (8-12 hours)
**Assignee:** Developer B

**Description:**

Update existing tests for computed fields and add comprehensive coverage for new functionality. Consolidates original issues #17 and #18.

**Acceptance Criteria:**
- [ ] Update 40+ existing tests to use computed `yearsUsed`
- [ ] Add tests for archive functionality (5 tests)
- [ ] Add tests for computed query correctness (8 tests)
- [ ] Add tests for import/export reliability (10 tests)
- [ ] Add tests for migration logic (12 tests)
- [ ] Add tests for error handling (8 tests)
- [ ] Add multi-tab sync test (CRITICAL - currently missing)
- [ ] Achieve 90%+ coverage for new code
- [ ] All tests pass, suite runs in <7 minutes

**Test Distribution:**
- Unit: 75 tests (behavior-focused)
- Integration: 15 tests (workflows)
- E2E: 20 tests (user journeys)

**Files to Modify:**
- `src/__tests__/services/variety-storage.test.ts`
- `src/__tests__/services/allotment-storage.test.ts`
- `src/__tests__/lib/variety-queries.test.ts` (new)
- `tests/data-management.spec.ts`

**Dependencies:** Phase 3 complete

---

### Issue #9: Migration Script for User Export

**Labels:** `migration`, `user-data`
**Priority:** P1 (High)
**Size:** L (13-18 hours)
**Assignee:** Developer A

**Description:**

Create migration script specifically for `allotment-backup-2026-01-22.json` with verification.

**Data Quality Issues in File:**
- 2 varieties with empty names (archive with placeholders)
- 3 varieties with URLs instead of names (fix using allotment store data)
- 14 orphaned planting references (document, don't fail)
- 1 duplicate "Electric" variety (remove)

**Acceptance Criteria:**
- [ ] Load and parse allotment-backup-2026-01-22.json
- [ ] Identify and merge 30 common varieties
- [ ] Remove duplicate "Electric" variety
- [ ] Fix 3 URL-contaminated variety names
- [ ] Archive 2 empty varieties with placeholder names
- [ ] Preserve all 14 orphaned planting references
- [ ] Add `isArchived: false` and `renamedFrom: []` fields
- [ ] Generate detailed migration report
- [ ] Verify variety count: 32+31 → 31 (deduplicated)
- [ ] Verify all plantings, seasons, layout preserved
- [ ] Test import of migrated file

**Expected Output:**
- `allotment-migrated-2026-01-22.json` (schema v13+)
- `migration-report.md` with findings and conflicts resolved

**Files to Create:**
- `scripts/migrate-user-export.ts`
- `scripts/migration-report-template.md`

**Dependencies:** Issue #8 (needs tests)

---

### Issue #10: E2E Validation

**Labels:** `testing`, `e2e`, `quality`
**Priority:** P1 (High)
**Size:** S (5-6 hours)
**Assignee:** Developer B

**Description:**

Comprehensive end-to-end testing of complete import/export cycle, including critical multi-tab sync test currently missing.

**Acceptance Criteria:**
- [ ] Test import → export produces identical data
- [ ] Test rapid sequential imports (no race condition)
- [ ] Test large dataset handling (100+ varieties, 200+ plantings)
- [ ] Test multi-tab sync (CRITICAL - modify in tab A, verify tab B updates)
- [ ] Test migration rollback workflow
- [ ] Test error recovery (quota exceeded, corrupt file)
- [ ] Test backward compatibility (old format imports)
- [ ] All accessibility tests pass
- [ ] Performance: operations complete in <2 seconds

**Test Scenarios:**
1. Happy path: Add data → Export → Clear → Import → Verify
2. Race condition: Rapid imports with debounced saves
3. Multi-tab: Concurrent modifications
4. Large dataset: 100 varieties, 10 years, 200 plantings
5. Error recovery: Quota exceeded, corrupt JSON, version mismatch
6. Backward compat: Import v11, v12 formats

**Files to Modify:**
- `tests/data-management.spec.ts`
- `tests/variety-management.spec.ts` (new)

**Dependencies:** Issues #8, #9 complete

---

## Implementation Timeline (2 Developers)

### Week 1: Phases 1-2 (Days 1-2)

**Day 1:**
- AM: Joint session - align on type definitions for #1 and #2
- PM: Dev A (#1), Dev B (#2) in parallel

**Day 2:**
- Dev A: Issue #3 (Import/Export Reliability)
- Dev B: Issue #4 (Error Handling)

### Week 2: Phase 3 (Days 3-4)

**Day 3:**
- AM: Dev A solo on Issue #5 (Migration - critical path)
- PM: Dev A continues #5, Dev B starts #4 wrap-up

**Day 4:**
- Dev A: Issue #6 (Remove Storage) after #5 complete
- Dev B: Issue #7 (Cleanup)

### Week 3: Phase 4 (Day 5)

**Day 5:**
- AM: Dev B (Issue #8: Tests) while Dev A finishes #6
- PM: Dev A (Issue #9: User Migration), Dev B continues #8
- Final: Both on Issue #10 (E2E) together

**Total: 18-23 calendar hours (2.5-3 working days)**

---

## Success Criteria

**Must Achieve:**
- [x] Import → Export produces identical data
- [x] Rapid sequential imports don't corrupt data
- [x] All tests pass (110 must-have tests)
- [x] Seeds page shows accurate computed usage
- [x] User's export migrates successfully
- [x] Migration has rollback capability
- [x] Multi-tab sync works correctly
- [x] Import validates schema before preview

**Deferred to Post-MVP:**
- Archive UI with restore (basic field exists)
- Variety rename cascade (too risky)
- Repair tools (add if issues emerge)
- Performance memoization (add if slow)

---

## Risk Mitigation Summary

**Top 3 Fixes from Risk Analysis:**

1. **Migration Safety:** Dry-run mode + rollback + sequencing fix (migration before removal)
2. **Flush Mechanism:** Promise-based with actual verification (not fake timeout)
3. **Import Validation:** Schema validation before preview generation

These three changes prevent catastrophic data loss scenarios identified by the Risk Agent.

---

## Files Overview

| Phase | Files Created | Files Modified | Files Deleted |
|-------|---------------|----------------|---------------|
| 1 | variety-queries.ts | 5 core files | 0 |
| 2 | errors.ts, storage-utils.ts | DataManagement.tsx, compost-storage.ts | 0 |
| 3 | variety-migration.ts, migration-utils.ts | allotment-storage.ts | 3 legacy files |
| 4 | migration script, test files | All test suites | 0 |
| **Total** | **6 new files** | **~20 files** | **3 deprecated files** |

---

## Ready to Create Issues

To create all 10 issues on GitHub, use the GitHub CLI:

```bash
# From repository root
gh issue create --title "Issue #1: Data Model Cleanup and Computed Queries" \
  --body-file <(sed -n '/^### Issue #1/,/^---$/p' GITHUB-ISSUES-REFINED.md) \
  --label "refactor,data-model,performance" \
  --milestone "Variety Management Refactor"

# Repeat for issues #2-#10...
```

Or copy each issue section and paste into GitHub's web UI manually.

---

**Next Step:** Review this refined plan, confirm approach, then create GitHub issues and begin implementation.
