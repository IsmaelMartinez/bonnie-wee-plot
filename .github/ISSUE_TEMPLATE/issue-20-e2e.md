---
name: "#20: E2E testing and validation"
about: End-to-end testing of complete import/export cycle with large datasets
title: "#20: E2E testing and validation"
labels: phase-5, testing, variety-management
---

## Problem Statement

While unit and integration tests verify individual components, we need end-to-end testing to ensure the complete import/export cycle works correctly with large datasets. This includes:
- Importing a large backup file (like the user's)
- Using the app to add/modify/delete varieties
- Exporting the data
- Re-importing the export
- Verifying complete cycle integrity

## Acceptance Criteria

- [ ] Create E2E test file `/tests/variety-import-export.spec.ts`:
  - Uses Playwright for browser automation
  - Tests complete workflow with realistic data

- [ ] Test scenarios:
  - **Import backup**: Load and import the user's backup file, verify UI shows all data
  - **Add varieties**: User adds new varieties through UI, verify they're saved
  - **Modify varieties**: Rename and archive existing varieties, verify changes persist
  - **Export data**: Export the modified dataset
  - **Re-import export**: Import the exported data into a new session
  - **Verify integrity**: Compare original + modifications with final state

- [ ] Large dataset handling:
  - Test with 100+ varieties (if user's data is large)
  - Test with 200+ plantings
  - Verify performance is acceptable (<2s for operations)
  - Verify no UI freezing during operations

- [ ] Data integrity checks:
  - Verify no varieties lost in import/export cycle
  - Verify all planting references intact
  - Verify computed fields (yearsUsed) accurate after import
  - Verify archived varieties not visible but recoverable

- [ ] Edge cases:
  - Export without any data, re-import (empty dataset)
  - Export partial data (single year/variety)
  - Import corrupt file, verify error handling
  - Import very large file, verify performance

- [ ] Accessibility checks:
  - Verify error messages visible to users
  - Verify success feedback provided
  - Verify all controls keyboard accessible

- [ ] Documentation:
  - Document test setup and execution
  - Explain test data files used
  - Add to CI/CD pipeline docs

## Implementation Details

### Test File
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

  test('should handle rename and archive through cycle', async ({ page }) => {
    // Load backup
    // Rename variety
    // Archive variety
    // Export
    // Clear storage
    // Import
    // Verify rename and archive persist
  })

  test('should maintain data integrity with large dataset', async ({ page }) => {
    // Load large backup
    // Perform multiple operations
    // Export
    // Import
    // Verify all data intact
  })

  // Additional tests...
})
```

### Test Data
- Use the provided backup file
- Create additional test files with various sizes/structures
- Store in `/tests/fixtures/`

### Test Scenarios

#### Import Backup
1. Navigate to variety management page
2. Open import dialog
3. Select backup file
4. Verify loading indicator
5. Verify all varieties appear in UI
6. Verify counts match file

#### Add Varieties
1. Import backup
2. Open add variety dialog
3. Fill in variety details
4. Save variety
5. Export data
6. Clear local storage
7. Import export
8. Verify new variety in UI

#### Modify Varieties
1. Import backup
2. Navigate to variety
3. Rename variety
4. Archive some varieties
5. Export data
6. Clear storage
7. Import export
8. Verify renames and archives persist

#### Large Dataset Performance
1. Import large backup (100+ varieties)
2. Time variety operations
3. Verify operations complete in <2s
4. Verify UI responsive during operations
5. Export and import
6. Verify no data loss

### Accessibility Testing
- All error messages visible
- Success notifications displayed
- Keyboard navigation works
- Screen reader compatible

## Testing Requirements

- [ ] All tests pass: `npm run test`
- [ ] Tests complete in reasonable time (<2 minutes total)
- [ ] Tests are stable (no flaky tests)
- [ ] Large dataset performance acceptable
- [ ] Coverage of happy path and error cases

## Files to Create

- `/tests/variety-import-export.spec.ts`
- `/tests/fixtures/variety-large-dataset.json` (if needed)
- Update `/tests/README.md` or similar

## Files to Modify

- CI/CD configuration if needed

## Estimated Effort

Medium (5-6 hours) - E2E test writing, but can reuse existing Playwright patterns in the project.

## Related

Epic: Variety Management Refactor
Phase: 5
Priority: High
Depends on: #13, #14, #15, #16, #17, #18, #19
