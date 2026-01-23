---
name: "#13: Implement soft delete (archive) functionality"
about: Users need to delete varieties without breaking planting references
title: "#13: Implement soft delete (archive) functionality"
labels: phase-4, enhancement, variety-management
---

## Problem Statement

Users need to "delete" varieties without permanently removing them or breaking references in existing plantings. Currently, `removeVariety()` performs a hard delete, which can cause data loss and broken references if a variety was used in past seasons.

## Acceptance Criteria

- [ ] Add an `archived` boolean field to `StoredVariety` type (default: `false`)
- [ ] Create `archiveVariety(data, id)` function that sets `archived = true` instead of deleting
- [ ] Create `restoreVariety(data, id)` function that sets `archived = false`
- [ ] Update `getVarietiesForYear()` to exclude archived varieties by default
- [ ] Create `getArchivedVarietiesForYear()` function for accessing archived items
- [ ] Create `getArchivedVarieties()` to list all archived varieties
- [ ] Update variety queries to respect archive status:
  - `getVarietiesByVegetable()` - exclude archived by default
  - `getSuppliers()` - exclude archived by default
  - `getTotalSpendForYear()` - exclude archived by default
- [ ] Add optional `includeArchived` parameter to query functions for admin/debug use
- [ ] Update migration script to add `archived: false` to existing varieties
- [ ] Add unit tests for archive/restore operations

## Implementation Details

### Type Changes
Update `/src/types/unified-allotment.ts`:
- Add `archived?: boolean` field to `StoredVariety` interface

### New Functions
Create new functions in `/src/services/variety-storage.ts`:
- `archiveVariety(data: VarietyData, id: string): VarietyData`
- `restoreVariety(data: VarietyData, id: string): VarietyData`
- `getArchivedVarieties(data: VarietyData): StoredVariety[]`
- `getArchivedVarietiesForYear(data: VarietyData, year: number): StoredVariety[]`

### Updated Functions
Update existing functions to handle archive status:
- Add `includeArchived: boolean = false` parameter
- Filter out archived items unless flag is true

### Hook Updates
Update `/src/hooks/useVarieties.ts`:
- Add `archiveVariety()` and `restoreVariety()` methods to hook

## Testing Requirements

- [ ] Unit tests for archive/restore state changes
- [ ] Verify archived varieties don't appear in queries by default
- [ ] Verify `includeArchived` flag works correctly
- [ ] Test that archived varieties can be restored to active status
- [ ] Verify archived varieties still reference their plant data correctly

## Files to Modify

- `/src/types/unified-allotment.ts`
- `/src/services/variety-storage.ts`
- `/src/hooks/useVarieties.ts`
- `/src/__tests__/services/variety-storage.test.ts`

## Estimated Effort

Medium (4-6 hours) - Schema change is simple but requires careful filtering logic across multiple query functions.

## Related

Epic: Variety Management Refactor
Phase: 4
Priority: High
