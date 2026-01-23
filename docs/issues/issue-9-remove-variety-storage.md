# Remove separate variety storage and useVarieties hook

## Labels
`refactor`, `variety-management`, `breaking-change`, `phase-3`

## Priority
High

## Size
M (3-5 days)

## Description

The separate variety storage system (`VARIETY_STORAGE_KEY = 'community-allotment-varieties'`) creates a split-brain data architecture where varieties are stored in two places: the main allotment storage and a separate localStorage location. This has been mitigated by Phase 2 work that embeds varieties directly into the unified allotment data structure, making the separate storage redundant.

This issue removes the legacy architecture and eliminates the `useVarieties` hook entirely. All variety access must transition to reading from `AllotmentData.varieties` within the unified storage system, which is already available through the `useAllotment` hook.

## Acceptance Criteria

- [ ] Remove `src/services/variety-storage.ts` completely
- [ ] Remove `src/hooks/useVarieties.ts` completely
- [ ] Remove `src/types/variety-data.ts` completely (types re-exported from `unified-allotment.ts`)
- [ ] Update all components that import from `variety-storage.ts` to use unified storage instead
- [ ] Update all components that use `useVarieties` hook to use `useAllotment` hook instead
- [ ] All existing unit tests continue to pass
- [ ] Existing e2e tests continue to work without modification
- [ ] Component rendering and functionality remain identical from user perspective

## Implementation Details

### Files to Modify

1. **`src/components/allotment/AddPlantingForm.tsx`**
   - Replace `hasSeedsForYear` import from `variety-storage` with direct computation from variety data
   - Update component props if needed to receive variety data from parent
   - Consider using `useAllotment` hook to access varieties if not already passed as prop

2. **`src/components/allotment/DataManagement.tsx`**
   - Replace `loadVarietyData()` calls with access to `useAllotment` hook
   - Update export logic to use varieties from unified storage
   - Update import logic to merge varieties into unified storage format

3. **`src/__tests__/services/variety-storage.test.ts`**
   - Move test cases to unified storage tests where applicable
   - Remove tests specific to separate variety storage
   - Ensure variety CRUD operations are tested through unified storage tests

### Key Changes

- `hasSeedsForYear(variety, year)` logic should be inlined where used or moved to a utility function in `src/lib/` if used in multiple places
- Any query functions from `variety-storage` that read from varieties should become local functions or utilities
- The `VarietyData` wrapper type is no longer needed; use varieties array directly from `AllotmentData`

## Testing Requirements

1. Unit tests for all modified components
   - Verify variety querying still works correctly
   - Test seed status checking logic
   - Test variety filtering by year

2. E2E tests
   - Test adding a planting shows correct variety suggestions
   - Test seed status filtering when adding plantings
   - Test variety data persists correctly

3. Manual testing
   - Verify seed library/variety tracking still works
   - Verify adding plantings still auto-syncs to varieties
   - Verify all variety-related features render correctly

## Dependencies

- Requires Phase 2 to be complete (varieties embedded in AllotmentData)
- Blocks Phase 3 issue #10, #11, #12
- No API changes needed; purely internal refactoring
