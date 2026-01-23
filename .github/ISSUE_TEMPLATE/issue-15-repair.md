---
name: "#15: Build variety repair and rebuild tools"
about: Detect and repair data integrity issues in variety management
title: "#15: Build variety repair and rebuild tools"
labels: phase-4, feature, variety-management
---

## Problem Statement

As the variety system evolves and data gets imported/migrated, there may be cases of data integrity issues:
- Orphaned variety references (planting refers to variety that doesn't exist)
- Inconsistent state between variety storage and allotment storage
- Missing or corrupted fields in varieties
- Duplicate varieties with same plant/name combination

We need tooling to detect and repair these issues automatically.

## Acceptance Criteria

- [ ] Create repair utility module `/src/lib/variety-repair.ts` with:
  - `detectIntegrityIssues(allotmentData, varietyData)` - returns list of issues found
  - `repairIntegrityIssues(allotmentData, varietyData)` - attempts repairs
  - `validateConsistency(allotmentData, varietyData)` - returns boolean

- [ ] Detection functions for:
  - Plantings that reference non-existent varieties
  - Varieties with missing required fields
  - Duplicate varieties (same plant + name)
  - Varieties with orphaned references
  - Inconsistent year data (years used don't match plantings)

- [ ] Repair functions for:
  - Removing or marking invalid variety references
  - Attempting to merge duplicates
  - Rebuilding computed fields (yearsUsed)
  - Adding missing default values

- [ ] Create export/output format:
  - Report of issues found (severity, type, quantity)
  - Detailed log of repairs applied
  - Suggestions for manual fixes if needed

- [ ] Add logging with `@/lib/logger.ts`:
  - Log all repairs with severity levels
  - Provide audit trail of changes

- [ ] Add to `useVarieties` hook:
  - `detectIssues()` method
  - `repair()` method
  - `validate()` method

- [ ] Unit tests for:
  - Each detection function
  - Each repair function
  - Integration with corrupted data
  - Repair logging

## Implementation Details

### New Module
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

### Integration Points
Coordinate with `variety-allotment-sync`:
- May need to use or extend existing sync functionality
- Coordinate with allotment storage for plantings data

### Hook Integration
Update `/src/hooks/useVarieties.ts`:
- Add hooks for repair operations
- Expose validation results

## Testing Requirements

- [ ] Create test data with various integrity issues
- [ ] Unit tests for each issue type detection
- [ ] Unit tests for each repair type
- [ ] Integration test: detect, repair, validate cycle
- [ ] Test logging output
- [ ] Edge cases: empty data, all valid, all corrupted

## Files to Create

- `/src/lib/variety-repair.ts`
- `/src/__tests__/lib/variety-repair.test.ts`

## Files to Modify

- `/src/hooks/useVarieties.ts`
- `/src/services/variety-storage.ts` (may need helper exports)

## Estimated Effort

Medium (6-8 hours) - Requires comprehensive detection logic but repairs are mostly straightforward data transformations.

## Related

Epic: Variety Management Refactor
Phase: 4
Priority: Medium
Depends on: #13, #14
