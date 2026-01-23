---
name: "#17: Update existing tests for computed fields"
about: Modify tests that expect yearsUsed to be stored to use computed values
title: "#17: Update existing tests for computed fields"
labels: phase-5, testing, variety-management
---

## Problem Statement

Existing tests in `/src/__tests__/services/variety-storage.test.ts` were written when `yearsUsed` was stored as a field. With the move to computed fields based on plantings, these tests need updating:
- Tests that set `yearsUsed` directly won't work
- Tests need to set plantings in allotment data instead
- Some tests need new assertions for computed values

## Acceptance Criteria

- [ ] Audit all existing tests in `variety-storage.test.ts`:
  - Identify tests that expect `yearsUsed` to be stored
  - Identify tests that set `yearsUsed` directly
  - Mark for update or removal

- [ ] Update test setup:
  - Create test utilities that generate both `AllotmentData` and `VarietyData`
  - Helper to create plantings with specific varieties
  - Helper to create complete test scenarios

- [ ] Update tests to use computed approach:
  - Set up plantings in allotment data
  - Call variety-allotment-sync to compute `yearsUsed`
  - Assert computed values instead of stored values

- [ ] Add new tests for:
  - `yearsUsed` calculation accuracy
  - Sync between allotment plantings and variety computed years
  - Edge cases (archived varieties, renamed varieties)

- [ ] Verify all tests pass:
  - Run `npm run test:unit` for variety-storage tests
  - No skipped tests
  - Good coverage maintained (>80%)

- [ ] Document test patterns:
  - Comment explaining the computed approach
  - Guidelines for writing new variety tests

## Implementation Details

### Test Updates
Update `/src/__tests__/services/variety-storage.test.ts`:
- Import sync utilities from `variety-allotment-sync`
- Create helper functions for test data setup
- Replace direct `yearsUsed` assignments with planting creation
- Update assertions to work with computed values

### Helper Functions
Create test helpers in test file or separate utilities:
```typescript
function createTestPlanting(varietyId: string, year: number): Planting { ... }
function syncVarietyYears(
  allotmentData: AllotmentData,
  varietyData: VarietyData
): VarietyData { ... }
```

### Test Pattern Example
Before (direct assignment):
```typescript
const variety = { ..., yearsUsed: [2024, 2025] }
```

After (computed from plantings):
```typescript
const allotmentData = { seasons: [{ bedSeasons: [{ plantings: [{ varietyId, year: 2024 }] }] }] }
const varietyData = syncVarietyYears(allotmentData, varietyData)
```

## Testing Requirements

- [ ] All existing tests pass after updates
- [ ] New tests for computed field accuracy
- [ ] New tests for edge cases
- [ ] Coverage maintained or improved (>80%)

## Files to Modify

- `/src/__tests__/services/variety-storage.test.ts`

## Estimated Effort

Medium (4-5 hours) - Mostly test refactoring following existing patterns.

## Related

Epic: Variety Management Refactor
Phase: 5
Priority: High
Depends on: #13, #14, #15, #16
