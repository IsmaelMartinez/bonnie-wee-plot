---
name: "#18: Add comprehensive test coverage"
about: Add tests for new functionality (archive, computed queries, import/export)
title: "#18: Add comprehensive test coverage"
labels: phase-5, testing, variety-management
---

## Problem Statement

While Phase 4 adds significant new functionality (archive, rename, repair, error handling), the test coverage for these features is minimal. We need comprehensive test suites covering all new functionality, edge cases, and integration points.

## Acceptance Criteria

- [ ] Create test suite for archive functionality:
  - Test archive/restore operations
  - Test that archived varieties don't appear in queries
  - Test `includeArchived` parameter
  - Test edge cases (archive twice, restore archived item)

- [ ] Create test suite for rename functionality:
  - Test valid rename operations
  - Test name validation (empty, duplicates, length)
  - Test cascade updates to plantings
  - Test cascade updates to maintenance tasks
  - Test rename history
  - Test edge cases

- [ ] Create test suite for repair utilities:
  - Test each integrity issue detection
  - Test each repair function
  - Test full detect-repair-validate cycle
  - Test repair logging
  - Test with realistic corrupted data

- [ ] Create test suite for error messages:
  - Test each error type
  - Test message formatting
  - Test error context/details
  - Test suggestions

- [ ] Create integration tests:
  - Test archive + rename interactions
  - Test rename + repair interactions
  - Test full variety workflow with allotment sync
  - Test import/export with new fields

- [ ] Coverage targets:
  - Archive functionality: >90% coverage
  - Rename functionality: >90% coverage
  - Repair utilities: >85% coverage
  - Error types: >85% coverage
  - Overall variety system: >80% coverage

- [ ] Performance tests (optional):
  - Test repair on large datasets (1000+ varieties)
  - Test cascade updates performance
  - Document any performance concerns

## Implementation Details

### Test Files
Create test files:
- `/src/__tests__/services/variety-storage.test.ts` - add new sections
- `/src/__tests__/lib/variety-repair.test.ts` - new file
- `/src/__tests__/types/variety-errors.test.ts` - new file
- `/src/__tests__/services/variety-integration.test.ts` - new file

### Test Patterns
Use existing patterns from:
- `/src/__tests__/services/allotment-storage.test.ts`
- `/src/__tests__/hooks/useTodayData.test.ts`

### Test Utilities
Create helpers:
- Builders for test data
- Helpers for common assertions
- Fixtures for realistic data

### Archive Tests
```typescript
describe('Archive functionality', () => {
  test('should archive a variety', () => { ... })
  test('should not show archived varieties in queries', () => { ... })
  test('should restore archived variety', () => { ... })
  test('should respect includeArchived flag', () => { ... })
})
```

### Rename Tests
```typescript
describe('Rename functionality', () => {
  test('should rename a variety', () => { ... })
  test('should validate duplicate names', () => { ... })
  test('should cascade update plantings', () => { ... })
  test('should track rename history', () => { ... })
})
```

### Repair Tests
```typescript
describe('Variety repair', () => {
  test('should detect orphaned references', () => { ... })
  test('should repair corrupted data', () => { ... })
  test('should validate consistency after repair', () => { ... })
})
```

### Error Tests
```typescript
describe('Error messages', () => {
  test('should format error with context', () => { ... })
  test('should provide suggestions', () => { ... })
})
```

### Integration Tests
```typescript
describe('Complete workflows', () => {
  test('should handle archive then rename', () => { ... })
  test('should sync with allotment data', () => { ... })
  test('should export and re-import correctly', () => { ... })
})
```

## Testing Requirements

- [ ] All tests pass: `npm run test:unit`
- [ ] Coverage meets targets for new code
- [ ] Tests document expected behavior
- [ ] Integration tests verify multi-component interactions

## Files to Create

- `/src/__tests__/lib/variety-repair.test.ts`
- `/src/__tests__/types/variety-errors.test.ts`
- `/src/__tests__/services/variety-integration.test.ts`

## Files to Modify

- `/src/__tests__/services/variety-storage.test.ts`

## Estimated Effort

Medium-High (8-10 hours) - Large volume of test code to write covering multiple components.

## Related

Epic: Variety Management Refactor
Phase: 5
Priority: High
Depends on: #13, #14, #15, #16, #17
