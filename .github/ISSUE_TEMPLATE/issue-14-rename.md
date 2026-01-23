---
name: "#14: Add variety rename with cascade updates"
about: Propagate variety renames across all references
title: "#14: Add variety rename with cascade updates"
labels: phase-4, enhancement, variety-management
---

## Problem Statement

When a user wants to rename a variety (e.g., "Early Tomato" → "Early Tomato v2"), the change should propagate to all affected data:
- Update the variety name itself
- Update references in plantings (if storing variety name)
- Update references in maintenance tasks
- Track the change for audit purposes

Currently, renaming is a simple field update with no cascade logic.

## Acceptance Criteria

- [ ] Create `renameVariety(data, id, newName)` function with validation
- [ ] Rename validation:
  - New name must not be empty or whitespace
  - New name must not duplicate another variety for the same plant (case-insensitive)
  - Name length must be reasonable (max 100 characters)
- [ ] Return proper error messages for each validation failure
- [ ] Cascade updates:
  - Update plantings that reference this variety by name
  - Update maintenance tasks that reference this variety
  - Update allotment sync references
- [ ] Add `renamedFrom` history tracking (optional, stores previous names)
- [ ] Create `getVarietyHistory(id)` to retrieve rename history
- [ ] Unit tests covering:
  - Valid rename operations
  - Duplicate name detection
  - Cascade updates to plantings
  - Cascade updates to maintenance tasks
  - Error cases
- [ ] Integration test with allotment sync service

## Implementation Details

### New Function
Create in `/src/services/variety-storage.ts`:
```typescript
export function renameVariety(
  data: VarietyData,
  id: string,
  newName: string
): StorageResult<VarietyData>
```

### Validation Helper
Create helper function in `/src/services/variety-storage.ts`:
```typescript
export function validateVarietyName(
  data: VarietyData,
  newName: string,
  plantId: string,
  excludeVarietyId?: string
): { valid: boolean; error?: string }
```

### Validation Logic
- Check if name is empty/whitespace
- Check for duplicate names in same plant
- Check length constraints

### Cascade Logic
Coordinate with `variety-allotment-sync.ts`:
- Find all plantings with this variety
- Update planting variety name references
- Update any maintenance task references

### Hook Updates
Update `/src/hooks/useVarieties.ts`:
- Add `renameVariety(id, newName)` method

## Testing Requirements

- [ ] Unit tests for name validation
- [ ] Unit tests for duplicate detection
- [ ] Unit tests for cascade updates to plantings
- [ ] Unit tests for cascade updates to maintenance tasks
- [ ] Integration test with allotment-sync service
- [ ] Test rename history tracking and retrieval

## Files to Modify

- `/src/services/variety-storage.ts`
- `/src/services/variety-allotment-sync.ts` (may need updates)
- `/src/hooks/useVarieties.ts`
- `/src/__tests__/services/variety-storage.test.ts`
- Potentially new integration test file

## Estimated Effort

Medium-High (6-8 hours) - Requires careful cascade logic and coordination with multiple data structures.

## Related

Epic: Variety Management Refactor
Phase: 4
Priority: High
Depends on: #13
