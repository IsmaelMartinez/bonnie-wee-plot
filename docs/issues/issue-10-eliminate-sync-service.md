# Eliminate variety-allotment-sync service

## Labels
`refactor`, `variety-management`, `phase-3`

## Priority
High

## Size
M (2-4 days)

## Description

The `src/services/variety-allotment-sync.ts` service performs one-way synchronization from allotment plantings to the separate variety storage. With varieties now embedded directly in the unified allotment storage (Phase 2), this sync logic is redundant. The same functionality (tracking that a variety was used in a year) should be handled directly when plantings are added/removed.

This issue removes the sync service and integrates its logic directly into the allotment storage layer where plantings are managed, ensuring variety records are always consistent with plantings without needing a separate sync step.

## Acceptance Criteria

- [ ] Remove `src/services/variety-allotment-sync.ts` completely
- [ ] Remove all calls to `syncPlantingToVariety()` from codebase
- [ ] Integrate variety year tracking logic into `src/services/allotment-storage.ts` when plantings are added
- [ ] When a planting is added to the unified storage, the variety record is automatically updated (no separate sync call needed)
- [ ] Variety year tracking maintains same business logic as before:
  - [ ] If matching variety exists (by plantId + name), add year to plannedYears
  - [ ] If no matching variety exists, create new one
  - [ ] Matching is case-insensitive and whitespace-normalized
- [ ] All existing functionality preserved from user perspective
- [ ] No split-brain scenarios possible (variety records always match planting records)

## Implementation Details

### Files to Modify

1. **`src/services/allotment-storage.ts`**
   - In `addPlanting()` function: After adding planting, call `ensureVarietyForPlanting()`
   - In `removePlanting()` function: May need cleanup logic (optional: remove unused varieties)
   - Add helper functions:
     - `findMatchingVariety(plantId, varietyName)` - Match existing variety
     - `ensureVarietyForPlanting(planting, year, allotmentData)` - Create or update variety

2. **`src/hooks/useAllotment.ts`**
   - Remove import of `syncPlantingToVariety`
   - Remove the call to `syncPlantingToVariety()` after plantings are added
   - No other changes needed; storage layer now handles sync

3. **Test files**
   - Update related tests to reflect new behavior

### Key Implementation Pattern

**Old approach (separate sync):**
```typescript
const newPlanting = createPlanting(...)
setAllotmentData(addPlanting(data, newPlanting))
syncPlantingToVariety(newPlanting, year)  // Separate call
```

**New approach (integrated):**
```typescript
const newPlanting = createPlanting(...)
setAllotmentData(addPlanting(data, newPlanting, year))  // Sync integrated
```

## Testing Requirements

1. Unit tests for new allotment-storage functions
   - Test `ensureVarietyForPlanting()` creates variety when needed
   - Test matching logic is case-insensitive
   - Test variety year tracking
   - Test that duplicate syncs don't create duplicates

2. E2E tests
   - Add planting → verify variety record created
   - Add planting with existing variety → verify year added to plannedYears
   - Remove planting → verify behavior (should variety be removed or marked as unused?)

3. Integration tests
   - Variety data before and after adding planting should be consistent
   - No race conditions or data loss during saves

## Dependencies

- Requires #9 to be completed first (separate variety storage removed)
- Blocks #11 and #12
- Must maintain data consistency (all varieties match plantings)
