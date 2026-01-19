# E2E Test Flakiness Investigation Report

## Executive Summary

The E2E test failures on CI are **timing-related**, not test order issues. Tests fail on first attempt but pass on retry, indicating insufficient wait times for slower CI environments.

## Failure Pattern

### CI Behavior
- **First run (commit d28fc79)**: 1 failure - Compost dialog test
- **Second run (commit 6efaafd)**: 6 failures - All Plant Database tests
- **Third run (rerun)**: 2 failures - Corn Salad & Winter Purslane tests

### Common Characteristics
1. **All failures**: Tests that call `selectRotationBed()` helper
2. **Error**: `locator('button').filter({ hasText: /^Add$/ })` - Expected: visible, Timeout: 5000ms
3. **Timing**: First attempt ~24s → fail, Retry ~26-40s → pass
4. **Retry success rate**: 100% (all failures pass on retry)

### Local Behavior
- **96/96 tests pass** consistently
- Pass with 10 parallel workers
- Pass with full test suite in any order
- No failures observed in 10+ runs

## Root Cause Analysis

### The Problem

Located in `tests/allotment.spec.ts:92-116`, the `selectRotationBed()` helper function:

```typescript
async function selectRotationBed(page: import('@playwright/test').Page) {
  await ensureRotationBedExists(page)
  await page.waitForTimeout(500)

  const gridItem = page.locator('[class*="react-grid-item"]').first()
  if (await gridItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await gridItem.click()
    await page.waitForTimeout(300)  // ⚠️ INSUFFICIENT ON CI
    return true
  }

  const mobileItem = page.locator('button').filter({ hasText: 'Test Bed A' }).first()
  if (await mobileItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mobileItem.click()
    await page.waitForTimeout(300)  // ⚠️ INSUFFICIENT ON CI
    return true
  }

  return false
}
```

**Issue**: After clicking a bed (line 103 or 112), only 300ms is allowed for:
1. Bed selection state update
2. Details panel render
3. "Add" button appearance

### Why It Fails on CI

**CI Environment Characteristics**:
- Slower CPU (shared runners)
- Higher system load (parallel jobs)
- Network latency for resources
- Container overhead

**Execution Flow**:
```
1. selectRotationBed() clicks bed → waits 300ms
2. Test immediately searches for Add button → 5000ms timeout
3. If panel hasn't rendered in 300ms:
   - Add button doesn't exist yet
   - 5000ms timeout starts searching for non-existent button
   - Test fails at 24s total
4. Retry:
   - Previous test state may have warmed up React
   - Slightly more time available
   - Test passes at 26-40s
```

### Evidence

**First Run Failures** (various tests, all using `selectRotationBed`):
```
✘ [chromium] › Allotment Dialog Accessibility › dialog should have proper heading structure (21.6s)
✘ [chromium] › Allotment Dialog Accessibility › dialog should close on Escape key (21.7s)
✘ [chromium] › Allotment Dialog Accessibility › dialog should close on close button click (23.1s)
✘ [chromium] › Allotment Bed Notes › should show Note section when bed is selected (23.7s)
✘ [chromium] › Allotment Bed Notes › should add a note to a bed (22.2s)
✘ [chromium] › Plant Database › should show Corn Salad in plant selection (24.1s)
```

**Retry Success** (same tests):
```
✓ [chromium] › Plant Database › should show Corn Salad in plant selection (retry #1) (26.6s)
✓ [chromium] › Plant Database › should show Hamburg Parsley in plant selection (retry #1) (33.3s)
✓ [chromium] › Plant Database › should show Kohlrabi in plant selection (retry #1) (32.4s)
✓ [chromium] › Plant Database › should show Lovage in plant selection (retry #1) (32.5s)
✓ [chromium] › Plant Database › should show Sorrel in plant selection (retry #1) (26.6s)
```

## Conclusion

### Type of Issue
**Timing/Loading Issue** ✓
NOT test order dependency

### Why Local Tests Pass
- Faster local hardware
- No competing CI jobs
- Warm browser/React state
- Lower system overhead

### Why Retries Work
- React hydration already complete from first attempt
- Browser resources already allocated
- Network resources cached
- System state warmed up

## Recommended Fixes

### Option 1: Increase Wait Time (Quick Fix)
```typescript
// Change line 105 and 113:
await page.waitForTimeout(1000)  // Increased from 300ms
```

### Option 2: Wait for Specific Element (Best Practice)
```typescript
async function selectRotationBed(page: import('@playwright/test').Page) {
  await ensureRotationBedExists(page)
  await page.waitForTimeout(500)

  const gridItem = page.locator('[class*="react-grid-item"]').first()
  if (await gridItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await gridItem.click()

    // Wait for Add button to appear (more reliable than timeout)
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 10000 })

    return true
  }

  // Similar for mobile...
}
```

### Option 3: Use Auto-Waiting Patterns
```typescript
// Don't wait at all - let Playwright auto-wait
async function selectRotationBed(page: import('@playwright/test').Page) {
  await ensureRotationBedExists(page)

  const gridItem = page.locator('[class*="react-grid-item"]').first()
  await gridItem.click()  // Auto-waits for clickable

  // Return without explicit wait - let caller wait for their specific element
  return true
}
```

## Impact Assessment

### Severity
- **Low**: Tests pass on retry
- No false negatives (bugs incorrectly passing)
- Only affects CI duration (~30s longer per run)

### Affected Tests
- 15-20 tests using `selectRotationBed()`
- All Allotment page interaction tests
- Dialog accessibility tests
- Plant Database tests
- Bed Notes tests

## Next Steps

1. Implement Option 2 (wait for specific element)
2. Run CI to verify fix
3. Consider adding to test helper documentation
4. Monitor for 3-5 CI runs to confirm stability
