# Variety Management Refactor - Complete Specification Package

This is your one-stop reference for implementing the complete Variety Management Refactor (Issues #13-20).

## Quick Navigation

### Main Documents

1. **[Epic Overview](ISSUE_TEMPLATE/epic-variety-management.md)** - Start here for strategic context
   - Epic goals and phases
   - Architecture decisions
   - Timeline and dependencies
   - Success criteria

2. **[Complete Specifications](../ISSUES.md)** - Detailed specs for all 8 issues
   - Full problem statements
   - Complete acceptance criteria
   - Implementation guidance
   - Testing requirements

3. **[Issues Summary](ISSUE_SPECS_SUMMARY.md)** - Quick reference index
   - Issue table with effort estimates
   - Quick links to each issue
   - Execution timeline
   - Coordination notes

### Individual Issue Specifications

**Phase 4: Advanced Features**
- [Issue #13: Archive Functionality](ISSUE_TEMPLATE/issue-13-archive.md)
- [Issue #14: Rename with Cascade](ISSUE_TEMPLATE/issue-14-rename.md)
- [Issue #15: Repair Tools](ISSUE_TEMPLATE/issue-15-repair.md)
- [Issue #16: Error Messages](ISSUE_TEMPLATE/issue-16-errors.md)

**Phase 5: Testing & Migration**
- [Issue #17: Update Tests](ISSUE_TEMPLATE/issue-17-tests.md)
- [Issue #18: Test Coverage](ISSUE_TEMPLATE/issue-18-coverage.md)
- [Issue #19: Migration Script](ISSUE_TEMPLATE/issue-19-migration.md)
- [Issue #20: E2E Testing](ISSUE_TEMPLATE/issue-20-e2e.md)

---

## Project Overview

**Objective:** Comprehensive refactor of the seed variety tracking system with advanced features, data integrity tools, and comprehensive testing.

**Scope:**
- Archive functionality (soft delete without data loss)
- Rename with cascade updates to maintain consistency
- Data repair and integrity tools
- Enhanced error messaging
- Comprehensive test coverage
- User data migration
- End-to-end validation

**Timeline:** ~8 weeks (2 phases)
- Phase 4: ~2-3 weeks (Features & Core Implementation)
- Phase 5: ~2-3 weeks (Testing & Migration)

**Total Effort:** 50-60 hours

---

## At a Glance

### Phase 4: Features (Issues #13-16)

| Issue | Feature | Effort | Key Tech |
|-------|---------|--------|----------|
| #13 | Archive (soft delete) | 4-6h | boolean field, query filters |
| #14 | Rename with cascade | 6-8h | validation, cascade logic, sync |
| #15 | Repair tools | 6-8h | detection, repair, validation |
| #16 | Error messages | 5-6h | typed errors, i18n preparation |

### Phase 5: Quality & Migration (Issues #17-20)

| Issue | Activity | Effort | Key Tech |
|-------|----------|--------|----------|
| #17 | Test refactoring | 4-5h | computed fields, new test patterns |
| #18 | Test coverage | 8-10h | unit, integration, performance tests |
| #19 | Migration script | 5-7h | file I/O, schema migration, validation |
| #20 | E2E testing | 5-6h | Playwright, large dataset testing |

---

## Key Features Explained

### Archive (Issue #13)
Instead of deleting varieties, mark them as archived:
- Hidden from queries by default
- Recoverable anytime
- References preserved
- Audit trail maintained

### Rename with Cascade (Issue #14)
Safely rename varieties with automatic consistency:
- Validation prevents duplicates and invalid names
- Plantings automatically updated
- Maintenance tasks updated
- Rename history tracked

### Repair Tools (Issue #15)
Detect and fix data integrity issues:
- Identify orphaned references
- Find duplicate varieties
- Detect inconsistent data
- Auto-repair where possible
- Generate detailed reports

### Error Messages (Issue #16)
Clear, actionable error messages:
- Typed error hierarchy
- Contextual information
- Suggested fixes
- User-friendly formatting

---

## Getting Started

### For Project Leads

1. Read the **Epic Overview** for strategic context
2. Review the **Issues Summary** for timeline and coordination
3. Share individual issue specs with assigned developers
4. Set up GitHub issues using the `.md` templates
5. Establish code review process per Phase 4 recommendations

### For Developers

1. Get assigned to one or more issues
2. Read the complete issue specification from `ISSUES.md`
3. Review related issue specs for dependencies
4. Review implementation details section
5. Follow the acceptance criteria checklist
6. Write tests per testing requirements

### For QA/Testers

1. Review Phase 5 testing issues (#17-20)
2. Understand test coverage goals
3. Plan test execution schedule
4. Prepare test data and fixtures
5. Coordinate with developers on test setup

---

## Implementation Order

### Week 1-2: Phase 4 (Parallel Work Possible)

**Day 1-2:** Start parallel threads
- Thread A: Issue #13 (Archive)
- Thread B: Issue #15 (Repair tools)
- Thread C: Issue #16 (Error messages)

**Day 3-5:** Continue Phase 4
- Thread A: Complete #13
- Thread B: Continue #15
- Thread C: Continue #16
- Thread D: Start #14 (after #13 merged)

**Day 6-10:** Wrap up Phase 4
- Complete all Phase 4 issues
- Code review and fixes
- Merge all Phase 4 PRs

### Week 3-4: Phase 5 (Preparation & Testing)

**Day 11-12:** Start Phase 5
- Issue #17: Update tests (small, unblocks others)
- Issue #18: Begin test coverage (large, start early)

**Day 13-14:** Continue Phase 5
- Issue #18: Continue comprehensive tests
- Issue #19: Start migration script (with real user data)

**Day 15-18:** Finalize Phase 5
- Issue #18: Complete test coverage
- Issue #19: Finish migration script
- Issue #20: E2E testing (final validation)

**Day 19-20:** Release prep
- Final testing and fixes
- Documentation updates
- Release coordination

---

## File Structure

After implementation, the codebase will include:

**New Core Files:**
```
src/
  types/
    variety-errors.ts        # Error type definitions
  lib/
    variety-repair.ts        # Repair and validation utilities
  scripts/
    migrate-variety-data.ts  # User data migration script
```

**Modified Core Files:**
```
src/
  types/
    unified-allotment.ts     # Add archived, renamedFrom fields
    variety-data.ts          # Updated field types
  services/
    variety-storage.ts       # Add archive, rename, repair methods
    variety-allotment-sync.ts # Integrate rename cascade
  hooks/
    useVarieties.ts          # Add new methods, error handling
```

**New Test Files:**
```
src/__tests__/
  lib/
    variety-repair.test.ts
  types/
    variety-errors.test.ts
  services/
    variety-integration.test.ts

tests/
  variety-import-export.spec.ts
```

**Documentation:**
```
MIGRATION_GUIDE.md           # User migration instructions
ISSUES.md                    # Complete specifications
```

---

## Success Metrics

### Code Quality
- ✅ All tests passing (npm run test:all)
- ✅ >85% code coverage for new functionality
- ✅ >80% overall coverage maintained
- ✅ ESLint and TypeScript checks pass
- ✅ Code review approved

### Functionality
- ✅ Archive feature working and tested
- ✅ Rename cascade working end-to-end
- ✅ Repair tools detect and fix issues
- ✅ Error messages clear and actionable
- ✅ No data loss in any operation

### User Experience
- ✅ Migration successful on real user data
- ✅ UI responsive with large datasets
- ✅ Error messages guide users to solutions
- ✅ Import/export cycle validates
- ✅ Documentation complete

---

## Risk Mitigation

### Data Loss Prevention
- ✅ Archive prevents accidental deletion
- ✅ Repair tools detect issues early
- ✅ Comprehensive testing validates integrity
- ✅ Migration script tested before release

### Performance
- ✅ Large dataset E2E tests
- ✅ Repair performance benchmarked
- ✅ Query optimization for filters
- ✅ Caching strategy if needed

### Migration Safety
- ✅ Migration script generates report
- ✅ Dry-run verification available
- ✅ Rollback procedures documented
- ✅ User communication plan

---

## Documentation Checklist

To be completed during implementation:

- [ ] Update README.md with new features
- [ ] Create MIGRATION_GUIDE.md for users
- [ ] Update developer docs with new patterns
- [ ] Document error codes and meanings
- [ ] Add JSDoc comments to new functions
- [ ] Create runbook for repair operations
- [ ] Document performance characteristics
- [ ] Update changelog

---

## Decision Log

### Architectural Decisions Made

1. **Soft Delete via Archive Field** (Issue #13)
   - Decided: Add boolean `archived` field rather than separate table
   - Rationale: Simpler schema, no migration complexity, easier queries

2. **Cascade Rename Updates** (Issue #14)
   - Decided: Update references automatically
   - Rationale: Prevents inconsistent state, better UX, simpler than manual steps

3. **Separate Repair Module** (Issue #15)
   - Decided: Create new `variety-repair.ts` module
   - Rationale: Clear separation of concerns, reusable, testable

4. **Typed Error Hierarchy** (Issue #16)
   - Decided: Create error classes extending Error
   - Rationale: Type-safe error handling, IDE support, i18n ready

5. **Migration Script Approach** (Issue #19)
   - Decided: Separate CLI tool, not integrated into app
   - Rationale: Can run before deployment, doesn't affect production code

---

## Questions & Support

### Where do I find...

**Architecture context?**
→ See Epic Overview: `epic-variety-management.md`

**Detailed implementation guidance?**
→ See Complete Specifications: `../ISSUES.md`

**Quick reference on timeline?**
→ See Issues Summary: `ISSUE_SPECS_SUMMARY.md`

**Specific issue details?**
→ See individual issue file: `ISSUE_TEMPLATE/issue-XX-*.md`

**User migration instructions?**
→ See Migration Guide: `../MIGRATION_GUIDE.md` (to be created)

---

## Version Control

- **Created:** 2026-01-22
- **Version:** 1.0
- **Status:** Ready for Implementation
- **Branch:** Main docs on `fix/e2e-tests-and-docs`
- **Issues:** Ready to create on GitHub

---

## Quick Links

- GitHub Epic: (to be linked when created)
- Project Board: (to be created)
- Documentation: See links above
- User Data File: `allotment-backup-2026-01-22.json`

---

**Ready to start implementing? Pick an issue and dive in! 🚀**
