# Allotment Page First-Release Simplification

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide advanced allotment features behind a release visibility config so the first release presents a focused, beginner-friendly experience without deleting any code.

**Architecture:** A single `src/config/release-visibility.ts` file exports boolean constants (all `false` for first release). Components import the relevant constant and wrap advanced JSX blocks in `{SHOW_X && (...)}` conditionals. Props, imports, state, and logic remain untouched — only the rendering is gated. To re-enable any feature later, flip the constant to `true`.

**Tech Stack:** TypeScript, React, Next.js (existing stack — no new dependencies)

---

## What Gets Hidden

| Feature | Where | Constant |
|---|---|---|
| "X/Y to rotate" in season widget | SeasonStatusWidget.tsx | `SHOW_ROTATION_SUGGESTIONS` |
| Auto-rotate button in bed detail | BedDetailPanel.tsx:194-202 | `SHOW_ROTATION_SUGGESTIONS` |
| Auto-rotate dialog | page.tsx:587-677 | `SHOW_ROTATION_SUGGESTIONS` |
| Rotation suggestion + apply button (mobile) | MobileAreaBottomSheet.tsx:195-221 | `SHOW_ROTATION_SUGGESTIONS` |
| Short ID field | AddAreaForm.tsx:271-291 | `SHOW_ADVANCED_AREA_FIELDS` |
| Built-in-year field | AddAreaForm.tsx:417-443 | `SHOW_ADVANCED_AREA_FIELDS` |
| CareLogSection in permanent panel | PermanentDetailPanel.tsx:315-320 | `SHOW_CARE_LOGS` |
| UnderplantingsList in permanent panel | PermanentDetailPanel.tsx:321-327 | `SHOW_UNDERPLANTINGS` |

## What Stays Visible

The rotation type dropdown in BedDetailPanel (line 127-146) stays — it's a simple select with no jargon overhead. The rotation guide banner (line 149-169) stays — it only appears when previous-year data exists, providing passive context. HarvestTracker stays — yield tracking is universally appealing. All cross-links, year selector, grid, notes, and planting workflows remain unchanged.

---

## Chunk 1: Implementation

### Task 1: Create release visibility config

**Files:**
- Create: `src/config/release-visibility.ts`

- [ ] **Step 1: Create the config file**

```typescript
/**
 * Release visibility constants.
 *
 * These gate advanced features that are hidden for the first release
 * to keep the experience focused for new users. Set any constant to
 * `true` to re-enable the feature.
 */

/** Auto-rotate button, auto-rotate dialog, and "X/Y to rotate" in season widget */
export const SHOW_ROTATION_SUGGESTIONS = false

/** Short ID and Built-in-year fields in Add Area form */
export const SHOW_ADVANCED_AREA_FIELDS = false

/** Care log section in permanent area detail panels */
export const SHOW_CARE_LOGS = false

/** Underplantings list in permanent area detail panels */
export const SHOW_UNDERPLANTINGS = false
```

- [ ] **Step 2: Commit**

```bash
git add src/config/release-visibility.ts
git commit -m "feat: add release visibility config for first-release feature gating"
```

### Task 2: Hide rotation count in SeasonStatusWidget

**Files:**
- Modify: `src/components/allotment/SeasonStatusWidget.tsx:36-49`

The "X/Y to rotate" text uses jargon that confuses newcomers when all beds are empty. Replace it with "X beds not yet planted" which is universally understandable.

- [ ] **Step 1: Update SeasonStatusWidget**

Import the constant at the top of the file:

```typescript
import { SHOW_ROTATION_SUGGESTIONS } from '@/config/release-visibility'
```

Replace lines 44-48 (the rotation count `<div>`) with:

```tsx
{SHOW_ROTATION_SUGGESTIONS ? (
  <div className="flex items-center gap-2 px-3 py-1.5 text-zen-ink-600">
    <ArrowRight className="w-4 h-4 text-zen-stone-400" />
    <span>{bedsNeedingRotation}/{totalRotationBeds} to rotate</span>
  </div>
) : (
  totalRotationBeds > 0 && bedsNeedingRotation > 0 && (
    <div className="flex items-center gap-2 px-3 py-1.5 text-zen-ink-600">
      <ArrowRight className="w-4 h-4 text-zen-stone-400" />
      <span>{bedsNeedingRotation} bed{bedsNeedingRotation !== 1 ? 's' : ''} not yet planted</span>
    </div>
  )
)}
```

This keeps the widget useful (telling users which beds are empty) without introducing rotation terminology.

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS (no type errors)

- [ ] **Step 3: Commit**

```bash
git add src/components/allotment/SeasonStatusWidget.tsx
git commit -m "feat: replace rotation jargon with bed-planted count in season widget"
```

### Task 3: Hide auto-rotate button in BedDetailPanel

**Files:**
- Modify: `src/components/allotment/details/BedDetailPanel.tsx:194-202`

- [ ] **Step 1: Add import and wrap auto-rotate button**

Add import at top:

```typescript
import { SHOW_ROTATION_SUGGESTIONS } from '@/config/release-visibility'
```

Wrap the auto-rotate button (lines 194-202) with the constant. The existing `{autoRotateInfo && (` condition becomes `{SHOW_ROTATION_SUGGESTIONS && autoRotateInfo && (`:

Replace:
```tsx
{autoRotateInfo && (
  <button
    onClick={onAutoRotate}
```

With:
```tsx
{SHOW_ROTATION_SUGGESTIONS && autoRotateInfo && (
  <button
    onClick={onAutoRotate}
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/allotment/details/BedDetailPanel.tsx
git commit -m "feat: hide auto-rotate button in bed detail panel for first release"
```

### Task 4: Hide auto-rotate dialog and mobile rotation suggestion

**Files:**
- Modify: `src/app/allotment/page.tsx:587-677` (auto-rotate dialog)
- Modify: `src/components/allotment/MobileAreaBottomSheet.tsx:195-221` (rotation suggestion card)

- [ ] **Step 1: Hide auto-rotate dialog in page.tsx**

Add import at top of the file (near other imports):

```typescript
import { SHOW_ROTATION_SUGGESTIONS } from '@/config/release-visibility'
```

On line 588, wrap the auto-rotate dialog. Replace:
```tsx
{autoRotateInfo && selectedBedId && (() => {
```

With:
```tsx
{SHOW_ROTATION_SUGGESTIONS && autoRotateInfo && selectedBedId && (() => {
```

- [ ] **Step 2: Hide rotation suggestion in MobileAreaBottomSheet**

Add import at top:

```typescript
import { SHOW_ROTATION_SUGGESTIONS } from '@/config/release-visibility'
```

On line 195, wrap the rotation suggestion card. Replace:
```tsx
{rotationInfo && (
  <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3">
```

With:
```tsx
{SHOW_ROTATION_SUGGESTIONS && rotationInfo && (
  <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3">
```

- [ ] **Step 3: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/allotment/page.tsx src/components/allotment/MobileAreaBottomSheet.tsx
git commit -m "feat: hide auto-rotate dialog and mobile rotation suggestion for first release"
```

### Task 5: Hide Short ID and Built-in-year in AddAreaForm

**Files:**
- Modify: `src/components/allotment/AddAreaForm.tsx:271-291` (Short ID), `417-443` (Built-in-year)

- [ ] **Step 1: Add import and wrap both fields**

Add import at top:

```typescript
import { SHOW_ADVANCED_AREA_FIELDS } from '@/config/release-visibility'
```

Wrap the Short ID block (lines 271-291). Replace:
```tsx
{/* Short ID */}
<div>
  <label htmlFor="area-short-id"
```

With:
```tsx
{/* Short ID */}
{SHOW_ADVANCED_AREA_FIELDS && <div>
  <label htmlFor="area-short-id"
```

And close the conditional after the closing `</div>` on line 291:
```tsx
  </p>
</div>}
```

Wrap the Built-in-year block (lines 417-443). Replace:
```tsx
{/* Temporal Metadata */}
<div className="border-t border-zen-stone-200 pt-4">
```

With:
```tsx
{/* Temporal Metadata */}
{SHOW_ADVANCED_AREA_FIELDS && <div className="border-t border-zen-stone-200 pt-4">
```

And close after line 443:
```tsx
      </div>
    </div>}
```

- [ ] **Step 2: Skip unit tests that reference hidden fields**

The following tests query for elements that are now hidden and will fail:
- `describe('Short ID validation')` — `screen.getByLabelText(/short id/i)` at line 241
- `describe('Temporal metadata')` — three tests querying `screen.getByLabelText(/built in year/i)` and hint text at lines 335-387

In `src/__tests__/components/AddAreaForm.test.tsx`, change both `describe` blocks to `describe.skip` and add a comment:

```typescript
// Re-enable when SHOW_ADVANCED_AREA_FIELDS is set to true in src/config/release-visibility.ts
describe.skip('Short ID validation', () => {
```

```typescript
// Re-enable when SHOW_ADVANCED_AREA_FIELDS is set to true in src/config/release-visibility.ts
describe.skip('Temporal metadata', () => {
```

- [ ] **Step 3: Run unit tests for AddAreaForm**

Run: `npx vitest run src/__tests__/components/AddAreaForm.test.tsx`
Expected: PASS (4 tests skipped, rest pass)

- [ ] **Step 4: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/allotment/AddAreaForm.tsx src/__tests__/components/AddAreaForm.test.tsx
git commit -m "feat: hide Short ID and Built-in-year fields in Add Area form for first release"
```

### Task 6: Hide CareLogSection and UnderplantingsList in PermanentDetailPanel

**Files:**
- Modify: `src/components/allotment/details/PermanentDetailPanel.tsx:303-330` (care tab content)

- [ ] **Step 1: Add imports and conditionally render within the care tab**

Add imports at top:

```typescript
import { SHOW_CARE_LOGS, SHOW_UNDERPLANTINGS } from '@/config/release-visibility'
```

In the `care` tab content (lines 308-328), wrap CareLogSection and UnderplantingsList:

Replace lines 315-327:
```tsx
          <CareLogSection
            selectedYear={selectedYear}
            careLogs={careLogs}
            onAddCareLog={(entry) => onAddCareLog(area.id, entry)}
            onRemoveCareLog={(entryId) => onRemoveCareLog(area.id, entryId)}
          />
          <UnderplantingsList
            parentAreaName={area.name}
            selectedYear={selectedYear}
            plantings={plantings}
            onAddPlanting={(planting) => onAddPlanting(area.id, planting)}
            onRemovePlanting={(plantingId) => onRemovePlanting(area.id, plantingId)}
          />
```

With:
```tsx
          {SHOW_CARE_LOGS && (
            <CareLogSection
              selectedYear={selectedYear}
              careLogs={careLogs}
              onAddCareLog={(entry) => onAddCareLog(area.id, entry)}
              onRemoveCareLog={(entryId) => onRemoveCareLog(area.id, entryId)}
            />
          )}
          {SHOW_UNDERPLANTINGS && (
            <UnderplantingsList
              parentAreaName={area.name}
              selectedYear={selectedYear}
              plantings={plantings}
              onAddPlanting={(planting) => onAddPlanting(area.id, planting)}
              onRemovePlanting={(plantingId) => onRemovePlanting(area.id, plantingId)}
            />
          )}
```

Also rename the tab label from `'Harvest & Care'` to `'Harvest'` (line 305) since care logs and underplantings are hidden:

```typescript
label: (SHOW_CARE_LOGS || SHOW_UNDERPLANTINGS) ? 'Harvest & Care' : 'Harvest',
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/allotment/details/PermanentDetailPanel.tsx
git commit -m "feat: hide care logs and underplantings in permanent panel for first release"
```

### Task 7: Run full test suite

- [ ] **Step 1: Run unit tests**

Run: `npm run test:unit`
Expected: All tests pass (AddAreaForm Short ID and Temporal Metadata tests already skipped in Task 5).

- [ ] **Step 2: Run E2E tests**

Run: `npm run test`
Expected: All tests pass. The allotment E2E tests don't reference auto-rotate, care logs, underplantings, or Short ID, so they should be unaffected.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Fix any failures and commit**

If any tests needed skipping or fixing:
```bash
git add -A
git commit -m "test: skip tests for hidden first-release features"
```

### Task 8: Update current plan

**Files:**
- Modify: `docs/plans/current-plan.md`

- [ ] **Step 1: Add entry to current plan under "Pages Reviewed"**

Add entry 13 for `/allotment`:

```
13. `/allotment` — reviewed and simplified. Core workflow (add areas, record plantings, view details) kept intact. Hidden for first release: auto-rotate button and dialog, rotation count jargon (replaced with "beds not yet planted"), Short ID and Built-in-year fields in Add Area, care logs, and underplantings in permanent panels. All hidden via `src/config/release-visibility.ts` constants — flip to `true` to re-enable. Harvest tracking, rotation type dropdown, rotation guide banner, grid layout, notes, and cross-links all kept.
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/current-plan.md
git commit -m "docs: mark allotment page as reviewed in current plan"
```
