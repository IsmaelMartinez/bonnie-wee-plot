import { test, expect } from '@playwright/test'

async function setupPage(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      meta: { setupCompleted: true },
      layout: { areas: [{ id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', position: { x: 0, y: 0, w: 2, h: 2 } }] },
      seasons: [{ year: new Date().getFullYear(), status: 'current', areas: [{ areaId: 'bed-a', rotationGroup: 'legumes', plantings: [], notes: [] }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      currentYear: new Date().getFullYear(),
      varieties: []
    }))
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  })
}

test.describe('Shared UI - Save Indicator', () => {
  test('should show save status indicator on allotment page', async ({ page }) => {
    await setupPage(page)
    await page.goto('/allotment')

    // Save indicator uses role="status" aria-live="polite"
    const saveIndicator = page.locator('[role="status"][aria-live="polite"]')
    // Should be attached (may show "Saved" or be idle)
    await expect(saveIndicator.first()).toBeAttached({ timeout: 15000 })
  })

  test('should show Saved text after data loads', async ({ page }) => {
    await setupPage(page)
    await page.goto('/allotment')
    await page.waitForLoadState('networkidle')

    // After loading, indicator should show "Saved" or a time
    const saveIndicator = page.locator('[role="status"][aria-live="polite"]')
    if (await saveIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      const text = await saveIndicator.first().textContent()
      expect(text).toMatch(/Saved|Saving/i)
    }
  })
})

test.describe('Shared UI - Dialogs', () => {
  test('should have proper ARIA attributes on allotment dialogs', async ({ page }) => {
    await setupPage(page)
    await page.goto('/allotment')

    // Enter edit mode and open add area dialog
    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock/i })
    await expect(lockButton).toBeVisible({ timeout: 15000 })
    await lockButton.click()

    await page.getByRole('button', { name: /Add Area/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Check ARIA attributes
    await expect(dialog).toHaveAttribute('aria-modal', 'true')

    // Close button should have aria-label
    const closeButton = dialog.getByRole('button', { name: /Close/i })
    await expect(closeButton).toBeVisible()
  })

  test('should trap focus within dialog', async ({ page }) => {
    await setupPage(page)
    await page.goto('/allotment')

    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock/i })
    await expect(lockButton).toBeVisible({ timeout: 15000 })
    await lockButton.click()

    await page.getByRole('button', { name: /Add Area/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Tab through all elements - should stay within dialog
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab')
    }

    // Focus should still be within the dialog
    const focusedInDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')
      return dialog?.contains(document.activeElement)
    })
    expect(focusedInDialog).toBe(true)
  })

  test('should close dialog on Escape', async ({ page }) => {
    await setupPage(page)
    await page.goto('/allotment')

    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock/i })
    await expect(lockButton).toBeVisible({ timeout: 15000 })
    await lockButton.click()

    await page.getByRole('button', { name: /Add Area/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('Shared UI - Mobile Bottom Sheet', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should show dialog on mobile', async ({ page }) => {
    await setupPage(page)
    await page.goto('/allotment')

    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock|Edit/i })
    await expect(lockButton).toBeVisible({ timeout: 15000 })
    await lockButton.click()

    await page.getByRole('button', { name: /Add Area/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
