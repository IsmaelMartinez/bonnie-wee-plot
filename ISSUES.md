# Variety Management Refactor: Phase 4 & 5 Issues

This document contains detailed specifications for the Phase 4 and Phase 5 issues of the variety management refactor project.

---

## Phase 4: Advanced Variety Management

### Issue #13: Implement soft delete (archive) functionality

**Type:** Enhancement
**Epic:** Variety Management Refactor
**Phase:** 4
**Priority:** High
**Dependencies:** Existing variety management system

#### Problem Statement

Users need to "delete" varieties without permanently removing them or breaking references in existing plantings. Currently, `removeVariety()` performs a hard delete, which can cause data loss and broken references if a variety was used in past seasons.

#### Acceptance Criteria

1. Add an `archived` boolean field to `StoredVariety` type (default: `false`)
2. Create `archiveVariety(data, id)` function that sets `archived = true` instead of deleting
3. Create `restoreVariety(data, id)` function that sets `archived = false`
4. Update `getVarietiesForYear()` to exclude archived varieties by default
5. Create new `getArchivedVarietiesForYear()` function for accessing archived items
6. Create `getArchivedVarieties()` to list all archived varieties
7. Update variety queries to respect archive status:
   - `getVarietiesByVegetable()` - exclude archived by default
   - `getSuppliers()` - exclude archived by default
   - `getTotalSpendForYear()` - exclude archived by default
8. Add optional `includeArchived` parameter to query functions for admin/debug use
9. Update migration script to add `archived: false` to existing varieties
10. Add unit tests for archive/restore operations

#### Implementation Details

Update `/src/types/unified-allotment.ts`:
- Add `archived?: boolean` field to `StoredVariety` interface

Create new functions in `/src/services/variety-storage.ts`:
- `archiveVariety(data: VarietyData, id: string): VarietyData`
- `restoreVariety(data: VarietyData, id: string): VarietyData`
- `getArchivedVarieties(data: VarietyData): StoredVariety[]`
- `getArchivedVarietiesForYear(data: VarietyData, year: number): StoredVariety[]`

Update existing functions to handle archive status:
- Add `includeArchived: boolean = false` parameter
- Filter out archived items unless flag is true

Update `/src/hooks/useVarieties.ts`:
- Add `archiveVariety()` and `restoreVariety()` methods to hook

#### Testing Requirements

- Unit tests for archive/restore state changes
- Verify archived varieties don't appear in queries by default
- Verify `includeArchived` flag works correctly
- Test that archived varieties can be restored to active status
- Verify archived varieties still reference their plant data correctly

#### Files to Modify

- `/src/types/unified-allotment.ts`
- `/src/services/variety-storage.ts`
- `/src/hooks/useVarieties.ts`
- `/src/__tests__/services/variety-storage.test.ts`

#### Estimated Effort

Medium (4-6 hours) - Schema change is simple but requires careful filtering logic across multiple query functions.

---

### Issue #14: Add variety rename with cascade updates

**Type:** Enhancement
**Epic:** Variety Management Refactor
**Phase:** 4
**Priority:** High
**Dependencies:** Issue #13 (should be done after archive functionality)

#### Problem Statement

When a user wants to rename a variety (e.g., "Early Tomato" → "Early Tomato v2"), the change should propagate to all affected data:
- Update the variety name itself
- Update references in plantings (if storing variety name)
- Update references in maintenance tasks
- Track the change for audit purposes

Currently, renaming is a simple field update with no cascade logic.

#### Acceptance Criteria

1. Create `renameVariety(data, id, newName)` function with validation
2. Rename validation:
   - New name must not be empty or whitespace
   - New name must not duplicate another variety for the same plant (case-insensitive)
   - Name length must be reasonable (max 100 characters)
3. Return proper error messages for each validation failure
4. Cascade updates:
   - Update plantings that reference this variety by name
   - Update maintenance tasks that reference this variety
   - Update allotment sync references
5. Add `renamedFrom` history tracking (optional, stores previous names)
6. Create `getVarietyHistory(id)` to retrieve rename history
7. Add unit tests covering:
   - Valid rename operations
   - Duplicate name detection
   - Cascade updates to plantings
   - Cascade updates to maintenance tasks
   - Error cases
8. Integration test with allotment sync service

#### Implementation Details

Create new function in `/src/services/variety-storage.ts`:
```typescript
export function renameVariety(
  data: VarietyData,
  id: string,
  newName: string
): StorageResult<VarietyData>
```

Validation logic:
- Check if name is empty/whitespace
- Check for duplicate names in same plant
- Check length constraints

Cascade logic (may need to coordinate with `variety-allotment-sync.ts`):
- Find all plantings with this variety
- Update planting variety name references
- Update any maintenance task references

Create helper function in `/src/services/variety-storage.ts`:
```typescript
export function validateVarietyName(
  data: VarietyData,
  newName: string,
  plantId: string,
  excludeVarietyId?: string
): { valid: boolean; error?: string }
```

Update `/src/hooks/useVarieties.ts`:
- Add `renameVariety(id, newName)` method

#### Testing Requirements

- Unit tests for name validation
- Unit tests for duplicate detection
- Unit tests for cascade updates to plantings
- Unit tests for cascade updates to maintenance tasks
- Integration test with allotment-sync service
- Test rename history tracking and retrieval

#### Files to Modify

- `/src/services/variety-storage.ts`
- `/src/services/variety-allotment-sync.ts` (may need updates)
- `/src/hooks/useVarieties.ts`
- `/src/__tests__/services/variety-storage.test.ts`
- Potentially new integration test file

#### Estimated Effort

Medium-High (6-8 hours) - Requires careful cascade logic and coordination with multiple data structures.

---

### Issue #15: Build variety repair and rebuild tools

**Type:** Feature
**Epic:** Variety Management Refactor
**Phase:** 4
**Priority:** Medium
**Dependencies:** Issues #13, #14

#### Problem Statement

As the variety system evolves and data gets imported/migrated, there may be cases of data integrity issues:
- Orphaned variety references (planting refers to variety that doesn't exist)
- Inconsistent state between variety storage and allotment storage
- Missing or corrupted fields in varieties
- Duplicate varieties with same plant/name combination

We need tooling to detect and repair these issues automatically.

#### Acceptance Criteria

1. Create repair utility module `/src/lib/variety-repair.ts` with:
   - `detectIntegrityIssues(allotmentData, varietyData)` - returns list of issues found
   - `repairIntegrityIssues(allotmentData, varietyData)` - attempts repairs
   - `validateConsistency(allotmentData, varietyData)` - returns boolean

2. Detection functions:
   - Find plantings that reference non-existent varieties
   - Find varieties with missing required fields
   - Find duplicate varieties (same plant + name)
   - Find varieties with orphaned references
   - Find inconsistent year data (years used don't match plantings)

3. Repair functions:
   - Remove or mark invalid variety references
   - Attempt to merge duplicates
   - Rebuild computed fields (yearsUsed)
   - Add missing default values

4. Create export/output format:
   - Report of issues found (severity, type, quantity)
   - Detailed log of repairs applied
   - Suggestions for manual fixes if needed

5. Add logging with `@/lib/logger.ts`:
   - Log all repairs with severity levels
   - Provide audit trail of changes

6. Add to `useVarieties` hook:
   - `detectIssues()` method
   - `repair()` method
   - `validate()` method

7. Testing:
   - Unit tests for each detection function
   - Unit tests for each repair function
   - Integration test with corrupted data
   - Test repair logging

#### Implementation Details

Create `/src/lib/variety-repair.ts`:
```typescript
interface IntegrityIssue {
  severity: 'error' | 'warning' | 'info'
  type: string
  description: string
  affectedData?: Record<string, unknown>
}

export function detectIntegrityIssues(
  allotmentData: AllotmentData,
  varietyData: VarietyData
): IntegrityIssue[]

export function repairIntegrityIssues(
  allotmentData: AllotmentData,
  varietyData: VarietyData
): { allotmentData: AllotmentData; varietyData: VarietyData; report: IntegrityIssue[] }

export function validateConsistency(
  allotmentData: AllotmentData,
  varietyData: VarietyData
): boolean
```

Integration with variety-allotment-sync:
- May need to use or extend existing sync functionality
- Coordinate with allotment storage for plantings data

#### Testing Requirements

- Create test data with various integrity issues
- Unit tests for each issue type detection
- Unit tests for each repair type
- Integration test: detect, repair, validate cycle
- Test logging output
- Edge cases: empty data, all valid, all corrupted

#### Files to Create

- `/src/lib/variety-repair.ts`
- `/src/__tests__/lib/variety-repair.test.ts`

#### Files to Modify

- `/src/hooks/useVarieties.ts`
- `/src/services/variety-storage.ts` (may need helper exports)

#### Estimated Effort

Medium (6-8 hours) - Requires comprehensive detection logic but repairs are mostly straightforward data transformations.

---

### Issue #16: Enhance variety management error messages

**Type:** Enhancement
**Epic:** Variety Management Refactor
**Phase:** 4
**Priority:** Medium
**Dependencies:** Issues #13, #14, #15

#### Problem Statement

Error messages throughout the variety management system are generic and non-actionable. Users don't know what went wrong or how to fix it. Error messages should be:
- Clear and specific about what failed
- Actionable (tell user what to do)
- Contextual (include relevant data like variety name)
- Localized for different error types

#### Acceptance Criteria

1. Create error type hierarchy in `/src/types/variety-errors.ts`:
   - `VarietyError` (base class)
   - `VarietyNotFoundError`
   - `VarietyNameError` (duplicate, invalid format)
   - `VarietyOperationError` (general operation failure)
   - `VarietyIntegrityError` (data consistency issues)
   - `VarietyStorageError` (storage limits, quota)

2. Each error type should include:
   - `code` - machine-readable error identifier
   - `message` - user-facing error message
   - `details` - optional object with additional context
   - `suggestion` - optional action the user can take

3. Update all variety storage functions to throw/return typed errors:
   - `addVariety()`
   - `updateVariety()`
   - `removeVariety()`
   - `renameVariety()`
   - `archiveVariety()`
   - And other operations

4. Error messages for common scenarios:
   - "Variety 'Early Tomato' already exists for this plant"
   - "Cannot rename: 'Cherry Tomato' is already used for this plant"
   - "Variety 'Unknown' not found - it may have been deleted"
   - "Storage quota exceeded. Archive old varieties to free space."
   - "Planting references this variety which no longer exists"

5. Create error message constants in `/src/types/variety-errors.ts`:
   - Centralized for consistency and i18n preparation
   - Include placeholder positions for dynamic content

6. Update `useVarieties` hook:
   - Catch and re-throw errors with context
   - Maintain error state in hook return value
   - Add `clearError()` method

7. Add tests:
   - Each error type tested with example scenarios
   - Verify message formatting and suggestions
   - Test error propagation through hook

8. Documentation:
   - Add comments explaining error types
   - Example error scenarios in JSDoc

#### Implementation Details

Create `/src/types/variety-errors.ts`:
```typescript
export class VarietyError extends Error {
  code: string
  details?: Record<string, unknown>
  suggestion?: string

  constructor(code: string, message: string, details?: Record<string, unknown>, suggestion?: string)
}

export class VarietyNotFoundError extends VarietyError { ... }
export class VarietyNameError extends VarietyError { ... }
// etc.

export const ERROR_MESSAGES = {
  VARIETY_NOT_FOUND: (name: string) => `Variety '${name}' not found`,
  DUPLICATE_NAME: (name: string, plant: string) => `Variety '${name}' already exists for ${plant}`,
  // etc.
}
```

Update variety-storage.ts functions:
- Replace generic `StorageResult` with typed errors
- Or return `StorageResult` with error code + message

#### Testing Requirements

- Unit tests for each error type
- Test error message formatting
- Test error propagation through hook
- Test error state management in component
- Test error clearing

#### Files to Create

- `/src/types/variety-errors.ts`
- `/src/__tests__/types/variety-errors.test.ts` (if needed)

#### Files to Modify

- `/src/services/variety-storage.ts`
- `/src/hooks/useVarieties.ts`
- All variety operation functions to use new errors

#### Estimated Effort

Medium (5-6 hours) - Mostly code organization and message creation, straightforward implementation.

---

## Phase 5: Testing & Migration

### Issue #17: Update existing tests for computed fields

**Type:** Testing
**Epic:** Variety Management Refactor
**Phase:** 5
**Priority:** High
**Dependencies:** Issues #13-16

#### Problem Statement

Existing tests in `/src/__tests__/services/variety-storage.test.ts` were written when `yearsUsed` was stored as a field. With the move to computed fields based on plantings, these tests need updating:
- Tests that set `yearsUsed` directly won't work
- Tests need to set plantings in allotment data instead
- Some tests need new assertions for computed values

#### Acceptance Criteria

1. Audit all existing tests in `variety-storage.test.ts`:
   - Identify tests that expect `yearsUsed` to be stored
   - Identify tests that set `yearsUsed` directly
   - Mark for update or removal

2. Update test setup:
   - Create test utilities that generate both `AllotmentData` and `VarietyData`
   - Helper to create plantings with specific varieties
   - Helper to create complete test scenarios

3. Update tests to use computed approach:
   - Set up plantings in allotment data
   - Call variety-allotment-sync to compute `yearsUsed`
   - Assert computed values instead of stored values

4. Add new tests for:
   - `yearsUsed` calculation accuracy
   - Sync between allotment plantings and variety computed years
   - Edge cases (archived varieties, renamed varieties)

5. Verify all tests pass:
   - Run `npm run test:unit` for variety-storage tests
   - No skipped tests
   - Good coverage maintained (>80%)

6. Document test patterns:
   - Comment explaining the computed approach
   - Guidelines for writing new variety tests

#### Implementation Details

Update `/src/__tests__/services/variety-storage.test.ts`:
- Import sync utilities from `variety-allotment-sync`
- Create helper functions for test data setup
- Replace direct `yearsUsed` assignments with planting creation
- Update assertions to work with computed values

Create test helpers in separate file or at top of test:
```typescript
function createTestPlanting(varietyId: string, year: number): Planting { ... }
function syncVarietyYears(allotmentData: AllotmentData, varietyData: VarietyData): VarietyData { ... }
```

#### Testing Requirements

- All existing tests pass after updates
- New tests for computed field accuracy
- New tests for edge cases
- Coverage maintained or improved

#### Files to Modify

- `/src/__tests__/services/variety-storage.test.ts`

#### Estimated Effort

Medium (4-5 hours) - Mostly test refactoring following existing patterns.

---

### Issue #18: Add comprehensive test coverage

**Type:** Testing
**Epic:** Variety Management Refactor
**Phase:** 5
**Priority:** High
**Dependencies:** Issues #13-17

#### Problem Statement

While Phase 4 adds significant new functionality (archive, rename, repair, error handling), the test coverage for these features is minimal. We need comprehensive test suites covering all new functionality, edge cases, and integration points.

#### Acceptance Criteria

1. Create test suite for archive functionality:
   - `archive.test.ts` or section in `variety-storage.test.ts`
   - Test archive/restore operations
   - Test that archived varieties don't appear in queries
   - Test `includeArchived` parameter
   - Test edge cases (archive twice, restore archived archived item)

2. Create test suite for rename functionality:
   - `rename.test.ts` or section in `variety-storage.test.ts`
   - Test valid rename operations
   - Test name validation (empty, duplicates, length)
   - Test cascade updates to plantings
   - Test cascade updates to maintenance tasks
   - Test rename history
   - Test edge cases

3. Create test suite for repair utilities:
   - `src/__tests__/lib/variety-repair.test.ts`
   - Test each integrity issue detection
   - Test each repair function
   - Test full detect-repair-validate cycle
   - Test repair logging
   - Test with realistic corrupted data

4. Create test suite for error messages:
   - `src/__tests__/types/variety-errors.test.ts`
   - Test each error type
   - Test message formatting
   - Test error context/details
   - Test suggestions

5. Create integration tests:
   - `src/__tests__/services/variety-integration.test.ts`
   - Test archive + rename interactions
   - Test rename + repair interactions
   - Test full variety workflow with allotment sync
   - Test import/export with new fields

6. Coverage targets:
   - Archive functionality: >90% coverage
   - Rename functionality: >90% coverage
   - Repair utilities: >85% coverage
   - Error types: >85% coverage
   - Overall variety system: >80% coverage

7. Performance tests (optional):
   - Test repair on large datasets (1000+ varieties)
   - Test cascade updates performance
   - Document any performance concerns

#### Implementation Details

Create test files:
- `/src/__tests__/services/variety-storage.test.ts` - add new sections
- `/src/__tests__/lib/variety-repair.test.ts` - new file
- `/src/__tests__/types/variety-errors.test.ts` - new file
- `/src/__tests__/services/variety-integration.test.ts` - new file

Use existing test patterns from:
- `/src/__tests__/services/allotment-storage.test.ts`
- `/src/__tests__/hooks/useTodayData.test.ts`

Create test utilities:
- Builders for test data
- Helpers for common assertions
- Fixtures for realistic data

#### Testing Requirements

- All tests pass: `npm run test:unit`
- Coverage meets targets for new code
- Tests document expected behavior
- Integration tests verify multi-component interactions

#### Files to Create

- `/src/__tests__/lib/variety-repair.test.ts`
- `/src/__tests__/types/variety-errors.test.ts`
- `/src/__tests__/services/variety-integration.test.ts`

#### Files to Modify

- `/src/__tests__/services/variety-storage.test.ts`

#### Estimated Effort

Medium-High (8-10 hours) - Large volume of test code to write covering multiple components.

---

### Issue #19: Create migration script for user's export file

**Type:** Feature
**Epic:** Variety Management Refactor
**Phase:** 5
**Priority:** High
**Dependencies:** Issues #13-16, #17

#### Problem Statement

The user has provided a backup file (`allotment-backup-2026-01-22.json`) in the current data format. Before launching the refactored variety system with new fields (archive, rename history, etc.), we need to:
- Load the backup file
- Migrate data to new schema
- Verify data integrity after migration
- Generate a new export file in the new format
- Document any data changes

This ensures a smooth transition and provides the user with a working export file.

#### Acceptance Criteria

1. Create migration script `/src/scripts/migrate-variety-data.ts`:
   - Takes input file path as argument
   - Loads JSON from file
   - Parses both allotment and variety data sections
   - Migrates to current schema versions
   - Validates all data
   - Generates output file with timestamp

2. Migration logic:
   - Parse allotment version and apply migrations
   - Parse variety data (may need to extract or create from allotment)
   - Add new fields with default values:
     - `archived: false` for all varieties
     - `renamedFrom: []` for rename history
     - Any other new schema fields
   - Compute `yearsUsed` from plantings
   - Verify referential integrity

3. Validation:
   - Run `validateConsistency()` from variety-repair
   - Log any warnings or errors
   - Provide detailed report
   - Return exit code indicating success/failure

4. Output:
   - Create `allotment-backup-2026-01-22.migrated.json`
   - Separate allotment and variety sections
   - Include migration metadata:
     - Migration timestamp
     - Source format/version
     - Target format/version
     - Issues found and fixed
     - Number of varieties, plantings, etc.

5. Error handling:
   - Handle invalid/corrupted JSON gracefully
   - Handle missing fields with sensible defaults
   - Report problems clearly
   - Don't fail on non-critical issues

6. Documentation:
   - Create `/MIGRATION_GUIDE.md`:
     - How to run the script
     - What changes were made
     - How to verify the migration
     - Rollback procedures

7. Testing:
   - Run script on the provided backup file
   - Verify output is valid
   - Check that all plantings/varieties are preserved
   - Verify computed fields are accurate

#### Implementation Details

Create `/src/scripts/migrate-variety-data.ts`:
```typescript
async function migrateVarietyData(inputPath: string, outputPath: string): Promise<void> {
  // Load file
  // Parse JSON
  // Apply migrations
  // Validate
  // Save output
  // Log report
}

// Run from command line: npx tsx src/scripts/migrate-variety-data.ts input.json output.json
```

Migration steps:
1. Load and parse JSON
2. Check version numbers
3. Apply schema migrations step-by-step
4. For varieties: add new fields
5. For plantings: ensure they reference valid varieties
6. Compute yearsUsed from plantings
7. Run integrity checks
8. Generate report
9. Save output file

Use existing utilities:
- `loadVarietyData()` and `saveVarietyData()`
- `detectIntegrityIssues()` and `repairIntegrityIssues()`
- Logger for output

#### Testing Requirements

- Test on the provided `allotment-backup-2026-01-22.json`
- Verify output file has correct structure
- Verify no data loss
- Verify computed fields are accurate
- Run validation on output
- Manual verification of migration results

#### Files to Create

- `/src/scripts/migrate-variety-data.ts`
- `/MIGRATION_GUIDE.md`

#### Files to Modify

- `package.json` (add script entry if needed)

#### Estimated Effort

Medium (5-7 hours) - Script writing and validation, plus documentation and testing on real data.

---

### Issue #20: E2E testing and validation

**Type:** Testing
**Epic:** Variety Management Refactor
**Phase:** 5
**Priority:** High
**Dependencies:** Issues #13-19

#### Problem Statement

While unit and integration tests verify individual components, we need end-to-end testing to ensure the complete import/export cycle works correctly with large datasets. This includes:
- Importing a large backup file (like the user's)
- Using the app to add/modify/delete varieties
- Exporting the data
- Re-importing the export
- Verifying complete cycle integrity

#### Acceptance Criteria

1. Create E2E test file `/tests/variety-import-export.spec.ts`:
   - Uses Playwright for browser automation
   - Tests complete workflow with realistic data

2. Test scenarios:
   - **Import backup**: Load and import the user's backup file, verify UI shows all data
   - **Add varieties**: User adds new varieties through UI, verify they're saved
   - **Modify varieties**: Rename and archive existing varieties, verify changes persist
   - **Export data**: Export the modified dataset
   - **Re-import export**: Import the exported data into a new session
   - **Verify integrity**: Compare original + modifications with final state

3. Large dataset handling:
   - Test with 100+ varieties (if user's data is large)
   - Test with 200+ plantings
   - Verify performance is acceptable (<2s for operations)
   - Verify no UI freezing during operations

4. Data integrity checks:
   - Verify no varieties lost in import/export cycle
   - Verify all planting references intact
   - Verify computed fields (yearsUsed) accurate after import
   - Verify archived varieties not visible but recoverable

5. Edge cases:
   - Export without any data, re-import (empty dataset)
   - Export partial data (single year/variety)
   - Import corrupt file, verify error handling
   - Import very large file, verify performance

6. Accessibility checks:
   - Verify error messages visible to users
   - Verify success feedback provided
   - Verify all controls keyboard accessible

7. Documentation:
   - Document test setup and execution
   - Explain test data files used
   - Add to CI/CD pipeline docs

#### Implementation Details

Create `/tests/variety-import-export.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Variety Import/Export Cycle', () => {
  test('should import backup file and show data', async ({ page }) => {
    // Navigate to app
    // Open import dialog
    // Select backup file
    // Verify data loaded
  })

  test('should add varieties and persist through export/import', async ({ page }) => {
    // Start with backup data
    // Add new variety
    // Export
    // Clear local storage
    // Import export
    // Verify new variety present
  })

  // Additional tests...
})
```

Test data:
- Use the provided backup file
- Create additional test files with various sizes/structures
- Store in `/tests/fixtures/`

#### Testing Requirements

- All tests pass: `npm run test`
- Tests complete in reasonable time (<2 minutes total)
- Tests are stable (no flaky tests)
- Large dataset performance acceptable
- Coverage of happy path and error cases

#### Files to Create

- `/tests/variety-import-export.spec.ts`
- `/tests/fixtures/variety-large-dataset.json` (if needed)
- Update `/tests/README.md` or similar

#### Files to Modify

- CI/CD configuration if needed

#### Estimated Effort

Medium (5-6 hours) - E2E test writing, but can reuse existing Playwright patterns in the project.

---

## Summary

**Total Effort Estimate:**
- Phase 4: ~25-30 hours (Issues #13-16)
- Phase 5: ~25-30 hours (Issues #17-20)
- **Total: ~50-60 hours**

**Recommended Timeline:**
- Phase 4: 2-3 weeks (parallel work possible on issues #13, #15, #16)
- Phase 5: 2-3 weeks (depends on Phase 4 completion)

**Key Dependencies:**
- Phase 4 issues build on each other (especially #14 depends on #13)
- Phase 5 issues depend on Phase 4 completion
- Issue #19 unblocks user migration
- Issue #20 validates the entire system

**Quality Gates:**
- All tests pass before merging
- Code review for each issue
- Manual testing of user workflows
- Validation script run on backup file before release
