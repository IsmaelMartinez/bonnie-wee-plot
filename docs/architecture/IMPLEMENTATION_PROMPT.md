# Implementation Prompt: Temporal Metadata Enhancement (v10.1)

**Use this prompt to guide implementation of the temporal metadata feature.**

---

## Task Overview

Implement temporal metadata for Areas to track when beds were built or removed. This allows beds added in 2025 to NOT appear in historical views (2024, 2023, etc.), solving the user problem without requiring complex per-year bed configurations.

**Background:** Read `/docs/architecture/per-year-beds-analysis.md` for full context. The proposed per-year bed configuration (v11) was rejected after multi-perspective review. This lightweight enhancement (v10.1) achieves the same user goal with 90% less complexity.

---

## Implementation Phases

Implement in order. Each phase is independently testable.

### Phase 1: Add Temporal Metadata Types (1-2 days)

**Objective:** Add optional temporal fields to the Area interface and create helper functions.

**Files to Modify:**

1. **`src/types/unified-allotment.ts`**

   Add three optional fields to the `Area` interface:

   ```typescript
   export interface Area {
     // ... existing fields ...

     /**
      * Year this area was physically built/established.
      * If undefined, area is treated as having always existed (backward compat).
      */
     createdYear?: number

     /**
      * Year this area was removed/demolished.
      * If undefined, area is still active.
      */
     retiredYear?: number

     /**
      * Explicit list of years this area was active.
      * Takes precedence over createdYear/retiredYear if specified.
      * Useful for beds that were temporarily removed and rebuilt.
      */
     activeYears?: number[]
   }
   ```

2. **`src/services/allotment-storage.ts`**

   Add three new exported helper functions at the end of the file (before the final export block):

   ```typescript
   /**
    * Check if an area was active/existed in a specific year
    *
    * @param area - The area to check
    * @param year - The year to check
    * @returns true if area existed in that year
    */
   export function wasAreaActiveInYear(area: Area, year: number): boolean {
     // Backward compatibility: if no temporal metadata, assume always existed
     if (!area.createdYear && !area.retiredYear && !area.activeYears) {
       return !area.isArchived
     }

     // Explicit activeYears list takes precedence (handles edge cases)
     if (area.activeYears && area.activeYears.length > 0) {
       return area.activeYears.includes(year)
     }

     // Use createdYear/retiredYear range
     const created = area.createdYear || 0  // undefined = always existed
     const retired = area.retiredYear || Infinity  // undefined = still active

     return year >= created && year < retired
   }

   /**
    * Get all areas that were active in a specific year
    *
    * @param data - Allotment data
    * @param year - Year to filter by
    * @returns Areas active in that year
    */
   export function getAreasForYear(data: AllotmentData, year: number): Area[] {
     return getAllAreas(data).filter(a => wasAreaActiveInYear(a, year))
   }

   /**
    * Get the year range an area was active
    *
    * @param area - The area
    * @returns { from: number, to: number | null } or null if always active
    */
   export function getAreaActiveRange(area: Area): { from: number; to: number | null } | null {
     if (!area.createdYear && !area.retiredYear) {
       return null  // Always active
     }

     return {
       from: area.createdYear || 0,
       to: area.retiredYear || null  // null = still active
     }
   }
   ```

3. **Create unit tests:** `src/__tests__/services/allotment-storage-temporal.test.ts`

   Create comprehensive tests for the three helper functions. Test cases:
   - Areas with no temporal metadata (backward compat)
   - Areas with createdYear only
   - Areas with retiredYear only
   - Areas with both createdYear and retiredYear
   - Areas with explicit activeYears list (takes precedence)
   - Edge cases: createdYear = retiredYear, undefined handling

**Verification:**
```bash
npm run type-check  # Should pass - no breaking changes
npm run test:unit   # New tests should pass
```

**CRITICAL: Do NOT proceed to Phase 2 until Phase 1 tests pass.**

---

### Phase 2: Update UI Components (2-3 days)

**Objective:** Add UI for users to set temporal metadata when creating/editing areas.

**Files to Modify:**

1. **`src/components/allotment/AddAreaForm.tsx`**

   Add temporal metadata section to the form:

   - Add state: `const [createdYear, setCreatedYear] = useState<number>(currentYear)`
   - Add state: `const [existedBefore, setExistedBefore] = useState(false)`
   - Add UI section after existing fields, before submit button:
     - Checkbox: "This area existed before I started tracking"
     - If unchecked: Show number input for "Built in year" (default: current year)
     - Helper text: "This area will only appear in {year} and later years"
   - When submitting: Set `createdYear: existedBefore ? undefined : createdYear`

2. **`src/components/allotment/EditAreaForm.tsx`** (NEW FILE - create it)

   Create a new form component for editing existing areas:

   - Props: `{ area: Area, onSubmit: (areaId: string, updates: Partial<Area>) => void, onCancel: () => void }`
   - Fields to edit: name, description, createdYear, retiredYear
   - Use similar UI to AddAreaForm but simpler (no "existed before" toggle)
   - Allow clearing createdYear/retiredYear (set to undefined)

3. **`src/components/allotment/details/BedDetailPanel.tsx`**

   Add "Edit Area" button that opens EditAreaForm in a dialog.

   - Import Dialog and EditAreaForm
   - Add state: `const [showEditDialog, setShowEditDialog] = useState(false)`
   - Add button in header: "Edit Area"
   - Add Dialog component with EditAreaForm
   - Wire up `onSubmit` to call `updateArea(areaId, updates)` from useAllotment hook

4. **`src/components/allotment/BedItem.tsx`** (or wherever bed items are rendered in grid)

   Add visual badges for temporal status:

   - Import `wasAreaActiveInYear` from storage service
   - Check `isNew = area.createdYear === selectedYear`
   - Check `isRetired = area.retiredYear && area.retiredYear <= selectedYear`
   - Show "New {year}" badge if isNew
   - Show "Since {year}" text if createdYear exists and is recent
   - Apply opacity-50 if isRetired

**Verification:**
- Manually test: Add new area with "Built in 2025"
- Switch to different years, verify UI updates correctly
- Edit existing area, add temporal metadata
- Visual badges appear correctly

**CRITICAL: Test backward compatibility - areas with no temporal metadata should work exactly as before.**

---

### Phase 3: Update Storage Operations (1 day)

**Objective:** Fix `addArea()` to respect temporal metadata when backfilling seasons.

**File to Modify:**

1. **`src/services/allotment-storage.ts` - `addArea()` function**

   **Current Issue:** Function backfills AreaSeason to ALL seasons (lines ~2284-2320)

   **Fix Required:** Only backfill to seasons where area should exist

   Find this section:
   ```typescript
   // Backfill AreaSeason to all existing seasons
   const updatedSeasons = data.seasons.map(season => {
     const newAreaSeason: AreaSeason = {
       areaId: id,
       rotationGroup: newArea.kind === 'rotation-bed' ? newArea.rotationGroup : undefined,
       plantings: [],
       notes: [],
     }
     return {
       ...season,
       areas: [...(season.areas || []), newAreaSeason],
       updatedAt: new Date().toISOString(),
     }
   })
   ```

   **Replace with:**
   ```typescript
   // Backfill AreaSeason ONLY to years where area should exist
   const updatedSeasons = data.seasons.map(season => {
     // Check if area should exist in this season
     if (!wasAreaActiveInYear(newArea, season.year)) {
       return season  // Don't add to this season
     }

     const newAreaSeason: AreaSeason = {
       areaId: id,
       rotationGroup: newArea.kind === 'rotation-bed' ? newArea.rotationGroup : undefined,
       plantings: [],
       notes: [],
     }

     return {
       ...season,
       areas: [...(season.areas || []), newAreaSeason],
       updatedAt: new Date().toISOString(),
     }
   })
   ```

   Also ensure `newArea` has default createdYear set:
   ```typescript
   const currentYear = new Date().getFullYear()
   const newArea: Area = {
     ...area,
     id,
     createdAt: new Date().toISOString(),
     createdYear: area.createdYear || currentYear  // Default to current year
   }
   ```

2. **Add validation helper (optional but recommended):**

   ```typescript
   /**
    * Validate that a planting can be added to an area in a specific year
    */
   export function validatePlantingForYear(
     data: AllotmentData,
     year: number,
     areaId: string
   ): { valid: boolean; error?: string } {
     const area = getAreaById(data, areaId)
     if (!area) {
       return { valid: false, error: `Area ${areaId} does not exist` }
     }

     if (!wasAreaActiveInYear(area, year)) {
       const range = getAreaActiveRange(area)
       if (range) {
         const rangeStr = `${range.from}-${range.to || 'present'}`
         return {
           valid: false,
           error: `Area "${area.name}" was not active in ${year}. Active years: ${rangeStr}`
         }
       }
     }

     return { valid: true }
   }
   ```

**Verification:**
- Add area with createdYear: 2025
- Check that AreaSeason only exists in 2025+ seasons, NOT in 2024/2023
- Check localStorage to verify seasons array structure
- Verify existing areas (no createdYear) still get backfilled to all seasons

---

### Phase 4: Filter Grid by Year (1 day)

**Objective:** Only show areas in the grid that were active in the selected year.

**Files to Modify:**

1. **`src/components/allotment/AllotmentGrid.tsx`**

   Add `selectedYear` prop and filter areas:

   ```typescript
   interface AllotmentGridProps {
     // ... existing props ...
     selectedYear: number  // NEW
   }

   export default function AllotmentGrid({
     areas,
     selectedYear,  // NEW
     // ... other props
   }: AllotmentGridProps) {
     // Filter areas by selected year
     const visibleAreas = useMemo(() => {
       return areas.filter(area => wasAreaActiveInYear(area, selectedYear))
     }, [areas, selectedYear])

     // Use visibleAreas instead of areas throughout component
   }
   ```

   Import `wasAreaActiveInYear` from storage service.

2. **`src/app/allotment/page.tsx`**

   Pass `selectedYear` prop to AllotmentGrid:

   ```typescript
   <AllotmentGrid
     onItemSelect={selectItem}
     selectedItemRef={selectedItemRef}
     getPlantingsForBed={getPlantings}
     areas={getAllAreas()}
     selectedYear={selectedYear}  // NEW - pass selected year
   />
   ```

**Verification:**
- Add area with createdYear: 2025
- Switch to 2024: area should NOT appear in grid
- Switch to 2025: area SHOULD appear in grid
- Switch back to 2024: area disappears again
- Existing areas (no temporal metadata) should appear in all years

**CRITICAL: This is the core feature - test thoroughly with multiple scenarios.**

---

### Phase 5: Testing & Polish (2 days)

**Objective:** Comprehensive testing and UX polish.

**Testing Checklist:**

**Unit Tests:**
- [x] `wasAreaActiveInYear()` - all cases from test file
- [x] `getAreasForYear()` - filters correctly
- [x] `getAreaActiveRange()` - returns correct range
- [x] `addArea()` temporal backfill - only adds to correct seasons

**Integration Tests:**
1. **New Bed in Current Year**
   - Add bed with createdYear = current year
   - Switch to previous year → bed should NOT appear
   - Switch back → bed SHOULD appear
   - Badge shows "New {year}"

2. **Bed "Existed Before"**
   - Add bed with existedBefore checked (createdYear = undefined)
   - Verify appears in ALL years
   - No "New" or "Since" badges

3. **Retire Bed**
   - Edit bed, set retiredYear = 2024
   - Switch to 2023 → bed should appear
   - Switch to 2024 → bed should NOT appear (retired)
   - Switch to 2025 → bed should NOT appear

4. **Backward Compatibility**
   - Import existing data (no temporal metadata)
   - All areas should appear in all years
   - No changes to existing behavior
   - Can still add plantings, rotate crops, etc.

5. **Rotation Tracking**
   - Add bed with createdYear = 2024
   - Add plantings in 2024, 2025, 2026
   - Verify rotation history shows correctly
   - Auto-rotation works from 2024 → 2025 → 2026

6. **Multi-Tab Sync**
   - Tab A: Edit bed, set createdYear = 2025
   - Tab B: Switch to 2024
   - Verify bed disappears without errors or weird state

**Edge Cases:**
- Area with createdYear > current year (future)
- Area with retiredYear in the past
- Area with activeYears array (explicit years)
- Trying to add planting to bed in year it didn't exist
- Switching years rapidly while grid is loading

**UX Polish (Optional but Recommended):**
1. Add timeline visualization in BedDetailPanel
2. Show warning when trying to add planting to inactive bed
3. Tooltip on badges explaining temporal status
4. Help text in AddAreaForm explaining the feature

---

## Implementation Guidelines

### DO:
✅ Test backward compatibility at every step
✅ Run `npm run type-check` after each file change
✅ Write unit tests before implementation where possible (TDD)
✅ Check localStorage structure after storage changes
✅ Test with multiple years of data
✅ Verify existing features still work (rotation, plantings, notes)
✅ Keep changes minimal and focused
✅ Use existing patterns from codebase
✅ Add console.log for debugging during development (remove before commit)

### DON'T:
❌ Make breaking changes to existing interfaces
❌ Modify how existing data is stored (additive only)
❌ Change behavior of areas with no temporal metadata
❌ Add required fields (all temporal fields are optional)
❌ Implement per-year bed configurations (rejected approach)
❌ Break rotation tracking functionality
❌ Add complex migration logic (none needed)
❌ Over-engineer - keep it simple

---

## Success Criteria

**Feature is complete when:**
1. ✅ Areas with `createdYear: 2025` don't appear in 2024 grid
2. ✅ Areas with no temporal metadata work exactly as before
3. ✅ UI allows setting temporal metadata when creating/editing areas
4. ✅ All existing tests still pass
5. ✅ New unit tests for temporal helpers pass
6. ✅ Rotation tracking still works correctly
7. ✅ Multi-tab sync handles temporal changes gracefully
8. ✅ No breaking changes to API or data structure
9. ✅ Type checking passes (`npm run type-check`)
10. ✅ Manual testing checklist completed

---

## Troubleshooting

**Common Issues:**

**"Areas disappearing from grid"**
- Check `wasAreaActiveInYear()` logic
- Verify selectedYear is being passed correctly
- Check if area has temporal metadata set incorrectly
- Console.log `visibleAreas` in AllotmentGrid

**"Backfill not working"**
- Check `addArea()` is using `wasAreaActiveInYear()` check
- Verify `newArea` has `createdYear` set before calling `wasAreaActiveInYear()`
- Check localStorage - inspect `seasons[].areas[]` structure

**"Type errors"**
- Run `npm run type-check` to see exact errors
- Ensure all temporal fields are optional (?)
- Check imports - `wasAreaActiveInYear` must be exported from storage service

**"Rotation tracking broken"**
- Verify area IDs remain stable across years
- Check `getRotationHistory()` still finds area in previous seasons
- Ensure temporal filtering only affects UI, not data structure

**"Tests failing"**
- Run `npm run test:unit` to see which tests fail
- Check if you changed behavior of areas without temporal metadata
- Verify helper functions handle undefined correctly

---

## Files Summary

**Files to Create:**
- `src/__tests__/services/allotment-storage-temporal.test.ts`
- `src/components/allotment/EditAreaForm.tsx`

**Files to Modify:**
- `src/types/unified-allotment.ts` - Add optional fields to Area interface
- `src/services/allotment-storage.ts` - Add helpers, fix addArea()
- `src/components/allotment/AddAreaForm.tsx` - Add temporal UI
- `src/components/allotment/AllotmentGrid.tsx` - Filter by year
- `src/components/allotment/details/BedDetailPanel.tsx` - Add edit dialog
- `src/components/allotment/BedItem.tsx` - Add badges
- `src/app/allotment/page.tsx` - Pass selectedYear prop

**Estimated LOC:** ~200-300 lines added, ~50 modified

---

## Final Notes

**This is a LOW-RISK, HIGH-VALUE enhancement.**

- No breaking changes
- No migration required
- Backward compatible
- Solves real user problem
- Simple to implement
- Easy to test

**Reference the full analysis document** (`/docs/architecture/per-year-beds-analysis.md`) for context on why this approach was chosen over per-year bed configurations.

**Good luck with implementation! 🌱**
