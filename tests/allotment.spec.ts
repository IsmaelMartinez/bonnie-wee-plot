import { test, expect } from '@playwright/test'

// Helper function to create a sample rotation bed if none exists
async function ensureRotationBedExists(page: import('@playwright/test').Page) {
  // Check if there are any areas in the grid (look for Plot Overview section content)
  const gridItems = page.locator('[class*="react-grid-item"]')
  const hasItems = await gridItems.count().then(count => count > 0).catch(() => false)

  if (!hasItems) {
    // No beds exist, create one
    const addAreaButton = page.locator('button').filter({ hasText: 'Add Area' })
    await addAreaButton.click()

    // Wait for dialog to open
    await page.waitForTimeout(300)

    // Fill in the Add Area form (defaults to Rotation Bed with Legumes rotation group)
    await page.locator('#area-name').fill('Test Bed A')

    // Submit the form
    await page.locator('button[type="submit"]').filter({ hasText: 'Add Area' }).click()

    // Wait for the area to be created
    await page.waitForTimeout(500)
  }
}

// Helper function to select a rotation bed (not perennial)
async function selectRotationBed(page: import('@playwright/test').Page) {
  // Ensure at least one bed exists
  await ensureRotationBedExists(page)

  // Wait for grid to load
  await page.waitForTimeout(500)

  // Look for any grid item in the AllotmentGrid
  const gridItem = page.locator('[class*="react-grid-item"]').first()

  if (await gridItem.isVisible({ timeout: 5000 }).catch(() => false)) {
    await gridItem.click()
    // Wait for bed details to appear
    await page.waitForTimeout(300)
    return true
  }

  return false
}

test.describe('Allotment Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to start fresh
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display allotment page with header', async ({ page }) => {
    await page.goto('/allotment')
    
    // Check page loads with the allotment-specific header
    await expect(page.locator('h1').filter({ hasText: /Allotment|Edinburgh/i })).toBeVisible()
  })

  test('should display year selector with available years', async ({ page }) => {
    await page.goto('/allotment')
    
    // Year selector should be visible with at least one year button
    const yearButtons = page.locator('button').filter({ hasText: /^20\d{2}$/ })
    await expect(yearButtons.first()).toBeVisible()
  })

  test('should switch between years', async ({ page }) => {
    await page.goto('/allotment')
    
    // Find year buttons
    const yearButtons = page.locator('button').filter({ hasText: /^20\d{2}$/ })
    
    if (await yearButtons.count() > 1) {
      const secondYear = yearButtons.nth(1)
      
      // Click second year
      await secondYear.click()
      
      // Second year should now be active (has moss background)
      await expect(secondYear).toHaveClass(/bg-zen-moss-600/)
    }
  })

  test('should display bed grid', async ({ page }) => {
    await page.goto('/allotment')
    
    // Should show Plot Overview section
    await expect(page.getByText('Plot Overview')).toBeVisible()
  })

  test('should select a bed and show details panel', async ({ page }) => {
    await page.goto('/allotment')
    
    // Select a rotation bed (not perennial)
    const selected = await selectRotationBed(page)
    
    if (selected) {
      // Should show the bed details panel with Add button
      await expect(page.locator('button').filter({ hasText: 'Add' }).first()).toBeVisible()
    }
  })

  test('should persist selected year across page reloads', async ({ page }) => {
    await page.goto('/allotment')
    
    // Find year buttons
    const yearButtons = page.locator('button').filter({ hasText: /^20\d{2}$/ })
    
    // Get the first year's text
    const firstYearText = await yearButtons.first().textContent()
    
    // Click the first year to select it
    await yearButtons.first().click()
    
    // Wait for save (debounced)
    await page.waitForTimeout(600)
    
    // Reload the page
    await page.reload()
    
    // First year should still be selected
    await expect(page.locator('button').filter({ hasText: firstYearText! })).toHaveClass(/bg-zen-moss-600/)
  })
})

test.describe('Allotment Dialog Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('should open Add Planting dialog when clicking Add button', async ({ page }) => {
    // Select a rotation bed
    const selected = await selectRotationBed(page)
    if (!selected) return

    // Wait for Add button to appear after bed selection
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Dialog should be visible with proper ARIA attributes
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  test('dialog should have proper heading structure', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Should have a heading
    await expect(page.getByRole('dialog').getByRole('heading')).toBeVisible()
  })

  test('dialog should close on Escape key', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('dialog should close on close button click', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click close button
    await page.getByRole('button', { name: /Close dialog/i }).click()

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('dialog should trap focus within', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Wait for focus to settle
    await page.waitForTimeout(100)

    // Tab forward multiple times - focus should stay within dialog
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
    }

    // Focus should still be within the dialog
    const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]'))
    expect(focusedElement).not.toBeNull()
  })

  test('dialog should have description text', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Should have description
    await expect(page.getByText(/Add a new planting/i)).toBeVisible()
  })
})

test.describe('Allotment Planting CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test.skip('should add a new planting', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill form with a unique variety name to avoid conflicts
    const uniqueVariety = `Test Variety ${Date.now()}`
    await page.locator('#vegetable-select').selectOption({ label: 'Garden Peas' })
    await page.locator('#variety-input').fill(uniqueVariety)
    await page.locator('#notes-input').fill('Test planting')

    // Submit (button text is "Add Planting" in the dialog)
    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Planting should appear in the bed details
    await expect(page.getByText(uniqueVariety)).toBeVisible()
  })

  test('should require vegetable selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Submit button in dialog should be disabled
    const submitButton = page.getByRole('dialog').getByRole('button', { name: /Add Planting/i })
    await expect(submitButton).toBeDisabled()
  })

  test.skip('should show delete confirmation dialog', async ({ page }) => {
    // First add a planting so we have something to delete
    await selectRotationBed(page)

    // Add a planting
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.locator('#vegetable-select').selectOption({ label: 'Tomato' })
    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()

    // Wait for planting to appear (use exact match to avoid "Rate success for Tomato")
    await expect(page.getByText('Tomato', { exact: true })).toBeVisible({ timeout: 5000 })

    // Find planting delete button (not year delete buttons which contain "year")
    const plantingDeleteButton = page.locator('button[aria-label^="Delete "]:not([aria-label*="year"])').first()

    if (await plantingDeleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await plantingDeleteButton.click()

      // Confirmation dialog should appear with Keep button
      await expect(page.getByRole('dialog').getByText(/Are you sure/i)).toBeVisible()
      await expect(page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true })).toBeVisible()
      await expect(page.getByRole('dialog').getByRole('button', { name: 'Keep' })).toBeVisible()
    }
  })

  test.skip('should cancel delete when clicking Keep', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Add a planting first with unique name
    const uniqueVariety = `CancelTest${Date.now()}`
    await page.locator('#vegetable-select').selectOption({ label: 'Carrot' })
    await page.locator('#variety-input').fill(uniqueVariety)
    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()

    // Wait for planting to appear (use exact variety name)
    await expect(page.getByText(uniqueVariety)).toBeVisible()

    // Click delete on Carrot (first one)
    const deleteButton = page.locator('button[aria-label*="Delete Carrot"]').first()
    await deleteButton.click()

    // Click Keep
    await page.getByRole('dialog').getByRole('button', { name: 'Keep' }).click()

    // Dialog should close and planting should still be there
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText(uniqueVariety)).toBeVisible()
  })

  test.skip('should delete planting when confirmed', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Add a planting with unique variety name
    const uniqueVariety = `DeleteTest${Date.now()}`
    await page.locator('#vegetable-select').selectOption({ label: 'Lettuce' })
    await page.locator('#variety-input').fill(uniqueVariety)
    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()

    // Wait for planting (exact variety match)
    await expect(page.getByText(uniqueVariety)).toBeVisible()

    // Delete it (use first match)
    const deleteButton = page.locator('button[aria-label*="Delete Lettuce"]').first()
    await deleteButton.click()

    // Confirm delete (exact match to avoid matching other Delete buttons)
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click()

    // Planting should be gone
    await expect(page.getByText(uniqueVariety)).not.toBeVisible()
  })
})

test.describe('Allotment Data Persistence', () => {
  test.skip('should persist plantings across page reloads', async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Add a planting (use vegetable name only - variety auto-select may interfere)
    await page.locator('#vegetable-select').selectOption({ label: 'Tomato' })
    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()

    // Wait for planting to appear (use exact match to avoid "Rate success for Tomato")
    await expect(page.getByText('Tomato', { exact: true })).toBeVisible({ timeout: 5000 })

    // Wait for save (debounced at 500ms)
    await page.waitForTimeout(700)

    // Reload
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Re-select the same rotation bed
    await selectRotationBed(page)

    // Planting should still be there (use exact match)
    await expect(page.getByText('Tomato', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('should start with current year for fresh install', async ({ page }) => {
    await page.goto('/allotment')

    // Fresh install should have current year
    const currentYear = new Date().getFullYear()
    await expect(page.locator('button').filter({ hasText: `${currentYear}` })).toBeVisible()

    // Should be able to add next year
    const nextYearButton = page.locator('button').filter({ hasText: `${currentYear + 1}` })
    await expect(nextYearButton).toBeVisible()
  })
})

test.describe('Allotment Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/allotment')

    // Main content should be visible - check for allotment header
    await expect(page.locator('h1').filter({ hasText: /Allotment|Edinburgh/i })).toBeVisible()
  })

  test('should show action buttons on mobile (not just hover)', async ({ page }) => {
    await page.goto('/allotment')
    await page.waitForLoadState('networkidle')

    // Select a rotation bed
    await selectRotationBed(page)

    // If there are plantings, action buttons should be visible without hover
    const deleteButtons = page.locator('button[aria-label*="Delete"]')
    if (await deleteButtons.count() > 0) {
      // Button should be visible immediately (not requiring hover)
      await expect(deleteButtons.first()).toBeVisible()
    }
  })

  test('dialog should be usable on mobile', async ({ page }) => {
    await page.goto('/allotment')
    await page.waitForLoadState('networkidle')

    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add button
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Dialog should be visible and usable
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Form elements should be visible
    await expect(page.locator('#vegetable-select')).toBeVisible()

    // Close dialog
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })
})

test.describe('Allotment Navigation', () => {
  test('should navigate to plan history', async ({ page }) => {
    await page.goto('/allotment')

    // Find and click History link (use the one in the allotment page header, not main nav)
    // The allotment page has a dedicated History button with amber styling
    const historyLink = page.locator('a[href*="plan-history"]').filter({ hasText: 'History' }).first()
    await historyLink.click()

    await expect(page).toHaveURL(/plan-history/)
  })
})

test.describe('Allotment Bed Notes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('should show Note section when bed is selected', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Note section should be visible
    await expect(page.getByText('Note', { exact: true })).toBeVisible()
  })

  test('should add a note to a bed', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add note button
    const addNoteButton = page.locator('button').filter({ hasText: 'Add note' })
    await expect(addNoteButton).toBeVisible({ timeout: 5000 })
    await addNoteButton.click()

    // Wait for the note form to appear (textarea)
    const textarea = page.locator('textarea[placeholder*="Enter your note"]')
    await expect(textarea).toBeVisible({ timeout: 3000 })

    // Fill in the note and verify it's filled
    const noteText = `Test note ${Date.now()}`
    await textarea.fill(noteText)
    await expect(textarea).toHaveValue(noteText)

    // Click Add Note button (the submit button in the form, not disabled)
    const submitButton = page.locator('button:has-text("Add Note"):not([disabled])')
    await expect(submitButton).toBeVisible({ timeout: 3000 })
    await submitButton.click()

    // Wait for form to close (Add note button to reappear would mean form is open again)
    // Note should appear - look for it in the note card structure
    await expect(page.locator('div').filter({ hasText: noteText }).first()).toBeVisible({ timeout: 5000 })
  })

  test('should only allow 1 note per bed', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add note button
    const addNoteButton = page.locator('button').filter({ hasText: 'Add note' })
    await expect(addNoteButton).toBeVisible({ timeout: 5000 })
    await addNoteButton.click()

    // Wait for form to appear
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 3000 })
    await textarea.fill('First note')

    // Submit
    const submitButton = page.locator('button').filter({ hasText: /^Add Note$/ })
    await expect(submitButton).toBeEnabled({ timeout: 3000 })
    await submitButton.click()

    // Wait for note to appear
    await expect(page.getByText('First note')).toBeVisible({ timeout: 5000 })

    // Add note button should no longer be visible
    await expect(page.locator('button').filter({ hasText: 'Add note' })).not.toBeVisible()
  })

  test('should edit an existing note', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add note button
    const addNoteButton = page.locator('button').filter({ hasText: 'Add note' })
    await expect(addNoteButton).toBeVisible({ timeout: 5000 })
    await addNoteButton.click()

    // Wait for form and add note
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 3000 })
    await textarea.fill('Original note')
    const submitButton = page.locator('button').filter({ hasText: /^Add Note$/ })
    await expect(submitButton).toBeEnabled({ timeout: 3000 })
    await submitButton.click()
    await expect(page.getByText('Original note')).toBeVisible({ timeout: 5000 })

    // Click edit button (pencil icon)
    await page.locator('button[title="Edit note"]').click()

    // Wait for edit form and change the note text
    await expect(page.locator('textarea')).toBeVisible({ timeout: 3000 })
    await page.locator('textarea').fill('Edited note')
    await page.locator('button').filter({ hasText: 'Save' }).click()

    // Edited note should appear
    await expect(page.getByText('Edited note')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Original note')).not.toBeVisible()
  })

  test('should delete a note', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add note button
    const addNoteButton = page.locator('button').filter({ hasText: 'Add note' })
    await expect(addNoteButton).toBeVisible({ timeout: 5000 })
    await addNoteButton.click()

    // Wait for form and add note
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 3000 })
    await textarea.fill('Note to delete')
    const submitButton = page.locator('button').filter({ hasText: /^Add Note$/ })
    await expect(submitButton).toBeEnabled({ timeout: 3000 })
    await submitButton.click()
    await expect(page.getByText('Note to delete')).toBeVisible({ timeout: 5000 })

    // Click delete button (trash icon)
    await page.locator('button[title="Delete note"]').click()

    // Note should be removed
    await expect(page.getByText('Note to delete')).not.toBeVisible()

    // Add note button should reappear
    await expect(page.locator('button').filter({ hasText: 'Add note' })).toBeVisible()
  })

  test('should change note type', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add note button
    const addNoteButton = page.locator('button').filter({ hasText: 'Add note' })
    await expect(addNoteButton).toBeVisible({ timeout: 5000 })
    await addNoteButton.click()

    // Wait for form to appear
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 3000 })

    // Select warning type
    await page.locator('button').filter({ hasText: 'Warning' }).click()

    await textarea.fill('Warning note')
    const submitButton = page.locator('button').filter({ hasText: /^Add Note$/ })
    await expect(submitButton).toBeEnabled({ timeout: 3000 })
    await submitButton.click()

    // Note should appear with warning styling (amber background)
    const noteCard = page.locator('.bg-amber-50').filter({ hasText: 'Warning note' })
    await expect(noteCard).toBeVisible({ timeout: 5000 })
  })

  test('should persist notes across page reloads', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Wait for and click Add note button
    const addNoteButton = page.locator('button').filter({ hasText: 'Add note' })
    await expect(addNoteButton).toBeVisible({ timeout: 5000 })
    await addNoteButton.click()

    // Wait for form to appear
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 3000 })

    // Add a note
    const noteText = `Persistent note ${Date.now()}`
    await textarea.fill(noteText)
    const submitButton = page.locator('button').filter({ hasText: /^Add Note$/ })
    await expect(submitButton).toBeEnabled({ timeout: 3000 })
    await submitButton.click()
    await expect(page.getByText(noteText)).toBeVisible({ timeout: 5000 })

    // Wait for save (debounced)
    await page.waitForTimeout(700)

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Re-select the same rotation bed
    await selectRotationBed(page)

    // Note should still be there
    await expect(page.getByText(noteText)).toBeVisible()
  })
})

test.describe('Allotment Grid Resizing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('should show resize handles when area is selected in edit mode', async ({ page }) => {
    // Ensure at least one area exists
    await ensureRotationBedExists(page)

    // Click Lock/Locked button to enter edit mode
    const lockButton = page.locator('button').filter({ hasText: /Lock/ })
    await expect(lockButton).toBeVisible({ timeout: 5000 })
    await lockButton.click()
    await page.waitForTimeout(300)

    // Click on a grid item to select it
    const gridItem = page.locator('[class*="react-grid-item"]').first()
    await gridItem.click()
    await page.waitForTimeout(200)

    // Selected item should have yellow ring and shadow on the child div (BedItem)
    const bedItem = gridItem.locator('> div').first()
    await expect(bedItem).toHaveClass(/ring-4/)
    await expect(bedItem).toHaveClass(/ring-yellow-500/)
    await expect(bedItem).toHaveClass(/shadow-lg/)

    // Should NOT have scale transform class
    const hasScaleClass = await bedItem.evaluate((el) => {
      return el.className.includes('scale-105')
    })
    expect(hasScaleClass).toBe(false)
  })

  test('resize handles should be clickable when area is selected', async ({ page }) => {
    // Ensure at least one area exists
    await ensureRotationBedExists(page)

    // Enter edit mode
    const lockButton = page.locator('button').filter({ hasText: /Lock/ })
    await expect(lockButton).toBeVisible({ timeout: 5000 })
    await lockButton.click()
    await page.waitForTimeout(300)

    // Click on a grid item to select it
    const gridItem = page.locator('[class*="react-grid-item"]').first()
    await gridItem.click()
    await page.waitForTimeout(200)

    // Get the bounding box of the grid item
    const boundingBox = await gridItem.boundingBox()
    expect(boundingBox).not.toBeNull()

    if (boundingBox) {
      // Try to hover over the bottom-right corner where resize handle should be
      // Resize handles are typically at the corners
      await page.mouse.move(
        boundingBox.x + boundingBox.width - 5,
        boundingBox.y + boundingBox.height - 5
      )
      await page.waitForTimeout(100)

      // The cursor should change to indicate resize is possible
      // We can't directly test cursor, but we can verify the element is there
      const resizeHandle = gridItem.locator('.react-resizable-handle')
      await expect(resizeHandle).toBeVisible()
    }
  })

  test('area should maintain visual feedback without scale transform', async ({ page }) => {
    // Ensure at least one area exists
    await ensureRotationBedExists(page)

    // Enter edit mode
    const lockButton = page.locator('button').filter({ hasText: /Lock/ })
    await expect(lockButton).toBeVisible({ timeout: 5000 })
    await lockButton.click()
    await page.waitForTimeout(300)

    // Click on a grid item
    const gridItem = page.locator('[class*="react-grid-item"]').first()
    await gridItem.click()
    await page.waitForTimeout(200)

    // Verify visual feedback classes are applied to the child div (BedItem)
    const bedItem = gridItem.locator('> div').first()
    await expect(bedItem).toHaveClass(/ring-offset-2/)

    // Get computed styles to verify no transform scaling
    const hasTransformScale = await bedItem.evaluate((el) => {
      const transform = window.getComputedStyle(el).transform
      // Check if transform includes scale - should be 'none' or identity matrix
      return transform !== 'none' && transform.includes('scale')
    })
    expect(hasTransformScale).toBe(false)
  })
})

test.describe('Custom Allotment Naming', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('should display custom allotment name in navigation', async ({ page }) => {
    // Default name should be "My Allotment"
    const navName = page.locator('nav').getByText('My Allotment')
    await expect(navName).toBeVisible()
  })

  test('should display custom allotment name in page header', async ({ page }) => {
    // Check the h1 in the allotment page shows the name
    const headerName = page.locator('h1').filter({ hasText: 'My Allotment' })
    await expect(headerName).toBeVisible()
  })

  test('should make allotment name editable on click', async ({ page }) => {
    // Click on the allotment name in the header
    const nameHeading = page.locator('h1').filter({ hasText: 'My Allotment' })
    await nameHeading.click()
    await page.waitForTimeout(200)

    // Should show an input field
    const nameInput = page.locator('input[value*="My Allotment"]')
    await expect(nameInput).toBeVisible()
    await expect(nameInput).toBeFocused()
  })

  test('should save new name on Enter key', async ({ page }) => {
    // Click on the allotment name
    const nameHeading = page.locator('h1').filter({ hasText: 'My Allotment' })
    await nameHeading.click()
    await page.waitForTimeout(200)

    // Type a new name - use a more generic selector
    const nameInput = page.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible()
    await nameInput.fill('My Sunny Garden')
    await nameInput.press('Enter')

    // Wait for save
    await page.waitForTimeout(700)

    // New name should appear in the header
    await expect(page.locator('h1').filter({ hasText: 'My Sunny Garden' })).toBeVisible()
  })

  test('should save new name on blur', async ({ page }) => {
    // Click on the allotment name
    const nameHeading = page.locator('h1').filter({ hasText: 'My Allotment' })
    await nameHeading.click()
    await page.waitForTimeout(200)

    // Type a new name
    const nameInput = page.locator('input[value*="My Allotment"]')
    await nameInput.fill('My Beautiful Plot')

    // Click outside to blur
    await page.locator('body').click({ position: { x: 10, y: 10 } })
    await page.waitForTimeout(200)

    // New name should appear
    await expect(page.locator('h1').filter({ hasText: 'My Beautiful Plot' })).toBeVisible()
  })

  test('should cancel edit on Escape key', async ({ page }) => {
    // Click on the allotment name
    const nameHeading = page.locator('h1').filter({ hasText: 'My Allotment' })
    await nameHeading.click()
    await page.waitForTimeout(200)

    // Type a new name but don't save
    const nameInput = page.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible()
    await nameInput.fill('Temporary Name')
    await nameInput.press('Escape')
    await page.waitForTimeout(200)

    // Original name should still be there
    await expect(page.locator('h1').filter({ hasText: 'My Allotment' })).toBeVisible()
  })

  test('should persist custom name across page reloads', async ({ page }) => {
    // Click on the allotment name
    const nameHeading = page.locator('h1').filter({ hasText: 'My Allotment' })
    await nameHeading.click()
    await page.waitForTimeout(200)

    // Type and save a new name
    const nameInput = page.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible()
    await nameInput.fill('Edinburgh Garden')
    await nameInput.press('Enter')

    // Wait for save
    await page.waitForTimeout(700)

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Custom name should still be visible in both places
    await expect(page.locator('h1').filter({ hasText: 'Edinburgh Garden' })).toBeVisible()
    await expect(page.locator('nav').getByText('Edinburgh Garden')).toBeVisible()
  })

  test('should show custom name in navigation after changing it', async ({ page }) => {
    // Change the name
    const nameHeading = page.locator('h1').filter({ hasText: 'My Allotment' })
    await nameHeading.click()
    await page.waitForTimeout(200)

    const nameInput = page.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible()
    await nameInput.fill('Test Garden Name')
    await nameInput.press('Enter')
    await page.waitForTimeout(700)

    // Navigate to another page
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Custom name should appear in navigation
    await expect(page.locator('nav').getByText('Test Garden Name')).toBeVisible()
  })
})

test.describe('Plant Database - Removed Plants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('should not show Sweet Peppers in plant selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Open Add Planting dialog
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Get all options from the vegetable select
    const options = await page.locator('#vegetable-select option').allTextContents()

    // Should NOT include Sweet Peppers
    expect(options).not.toContain('Sweet Peppers')
    expect(options).not.toContain('Sweet Pepper')
  })

  test('should not show Chillies in plant selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Open Add Planting dialog
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Get all options
    const options = await page.locator('#vegetable-select option').allTextContents()

    // Should NOT include Chillies
    expect(options).not.toContain('Chillies')
  })

  test('should not show Basil in plant selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Open Add Planting dialog
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Get all options
    const options = await page.locator('#vegetable-select option').allTextContents()

    // Should NOT include Basil
    expect(options).not.toContain('Basil')
  })
})

test.describe('Seeds Page - PlantCombobox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seeds')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('should allow selecting a plant and adding a variety', async ({ page }) => {
    // Click Add Variety button
    const addVarietyButton = page.locator('button').filter({ hasText: 'Add Variety' })
    await addVarietyButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click on the plant combobox to open dropdown
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()

    // Wait for dropdown to appear
    await expect(page.getByRole('listbox', { name: 'Plant search results' })).toBeVisible()

    // Select a plant (e.g., Lettuce)
    await page.getByRole('option', { name: /Lettuce/ }).first().click()

    // Dropdown should close after selection
    await expect(page.getByRole('listbox', { name: 'Plant search results' })).not.toBeVisible()

    // Combobox should show the selected plant
    await expect(plantCombobox).toHaveValue('Lettuce')

    // Fill in variety name
    await page.getByRole('textbox', { name: 'Variety Name' }).fill('Little Gem')

    // Submit button should be enabled
    const submitButton = page.getByRole('dialog').getByRole('button', { name: 'Add Variety' })
    await expect(submitButton).toBeEnabled()

    // Click submit
    await submitButton.click()

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Variety should appear in the list
    await expect(page.getByRole('button', { name: 'Lettuce (1)' })).toBeVisible()
  })

  test('should allow searching for plants in the combobox', async ({ page }) => {
    // Click Add Variety button
    const addVarietyButton = page.locator('button').filter({ hasText: 'Add Variety' })
    await addVarietyButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click on the plant combobox
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()

    // Type to search for carrot
    await plantCombobox.fill('carrot')

    // Should show filtered results
    const listbox = page.getByRole('listbox', { name: 'Plant search results' })
    await expect(listbox).toBeVisible()

    // Should show Carrot option
    await expect(page.getByRole('option', { name: /^Carrot/ })).toBeVisible()

    // Select it
    await page.getByRole('option', { name: /^Carrot/ }).first().click()

    // Dropdown should close and show selected value
    await expect(listbox).not.toBeVisible()
    await expect(plantCombobox).toHaveValue('Carrot')
  })

  test('should allow adding variety without a name', async ({ page }) => {
    // Click Add Variety button
    const addVarietyButton = page.locator('button').filter({ hasText: 'Add Variety' })
    await addVarietyButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click on the plant combobox
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()

    // Select a plant
    await page.getByRole('option', { name: /Spinach/ }).first().click()

    // Don't fill in variety name - leave it empty

    // Submit button should be enabled (only requires plant selection)
    const submitButton = page.getByRole('dialog').getByRole('button', { name: 'Add Variety' })
    await expect(submitButton).toBeEnabled()

    // Click submit
    await submitButton.click()

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Variety should appear with just the plant name
    await expect(page.getByRole('button', { name: 'Spinach (1)' })).toBeVisible()
  })
})

test.describe('Allotment Infrastructure Areas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('should allow adding infrastructure without a name', async ({ page }) => {
    // Click Add Area button
    const addAreaButton = page.locator('button').filter({ hasText: 'Add Area' })
    await addAreaButton.click()

    // Wait for dialog
    await page.waitForTimeout(300)

    // Select Infrastructure type
    const infrastructureButton = page.locator('button').filter({ hasText: 'Infrastructure' })
    await infrastructureButton.click()

    // Select Compost as infrastructure type
    const infraTypeSelect = page.locator('#infra-subtype')
    await infraTypeSelect.selectOption('compost')

    // Leave name field empty - it should show placeholder with default
    const nameInput = page.locator('#area-name')
    await expect(nameInput).toHaveAttribute('placeholder', /Optional.*Compost/)

    // Submit button should be enabled even without a name
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: 'Add Area' })
    await expect(submitButton).toBeEnabled()

    // Submit the form
    await submitButton.click()

    // Wait for the area to appear
    await page.waitForTimeout(500)

    // Area should appear with the infrastructure type as name
    // Look for a grid item that contains "Compost"
    const compostArea = page.locator('[class*="react-grid-item"]').filter({ hasText: 'Compost' })
    await expect(compostArea).toBeVisible()
  })

  test('should use custom name if provided for infrastructure', async ({ page }) => {
    // Click Add Area button
    const addAreaButton = page.locator('button').filter({ hasText: 'Add Area' })
    await addAreaButton.click()

    // Wait for dialog
    await page.waitForTimeout(300)

    // Select Infrastructure type
    const infrastructureButton = page.locator('button').filter({ hasText: 'Infrastructure' })
    await infrastructureButton.click()

    // Select Shed as infrastructure type
    const infraTypeSelect = page.locator('#infra-subtype')
    await infraTypeSelect.selectOption('shed')

    // Provide custom name
    const nameInput = page.locator('#area-name')
    await nameInput.fill('Tool Shed')

    // Submit the form
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: 'Add Area' })
    await submitButton.click()

    // Wait for the area to appear
    await page.waitForTimeout(500)

    // Area should appear with the custom name
    const toolShedArea = page.locator('[class*="react-grid-item"]').filter({ hasText: 'Tool Shed' })
    await expect(toolShedArea).toBeVisible()
  })
})

test.describe('Plant Database - New Scottish Plants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('should show Corn Salad in plant selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Open Add Planting dialog
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Should be able to select Corn Salad by value
    const select = page.locator('#vegetable-select')
    await select.selectOption('corn-salad')

    // Verify it was selected
    const selectedOption = await select.inputValue()
    expect(selectedOption).toBe('corn-salad')
  })

  test('should show Winter Purslane in plant selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Open Add Planting dialog
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Should be able to select Winter Purslane
    const select = page.locator('#vegetable-select')
    await select.selectOption('winter-purslane')

    const selectedOption = await select.inputValue()
    expect(selectedOption).toBe('winter-purslane')
  })

  test('should show Hamburg Parsley in plant selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Open Add Planting dialog
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Should be able to select Hamburg Parsley
    const select = page.locator('#vegetable-select')
    await select.selectOption('hamburg-parsley')

    const selectedOption = await select.inputValue()
    expect(selectedOption).toBe('hamburg-parsley')
  })

  test('should show Kohlrabi in plant selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Open Add Planting dialog
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Should be able to select Kohlrabi
    const select = page.locator('#vegetable-select')
    await select.selectOption('kohlrabi')

    const selectedOption = await select.inputValue()
    expect(selectedOption).toBe('kohlrabi')
  })

  test('should show Lovage in plant selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Open Add Planting dialog
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Should be able to select Lovage
    const select = page.locator('#vegetable-select')
    await select.selectOption('lovage')

    const selectedOption = await select.inputValue()
    expect(selectedOption).toBe('lovage')
  })

  test('should show Sorrel in plant selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Open Add Planting dialog
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Should be able to select Sorrel
    const select = page.locator('#vegetable-select')
    await select.selectOption('sorrel')

    const selectedOption = await select.inputValue()
    expect(selectedOption).toBe('sorrel')
  })

  test('all new Scottish plants should be available in Seeds page', async ({ page }) => {
    // Navigate to Seeds page
    await page.goto('/seeds')
    await page.waitForLoadState('networkidle')

    // Click Add Variety button
    const addVarietyButton = page.locator('button').filter({ hasText: 'Add Variety' })
    await addVarietyButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Get all plant options
    const select = page.locator('#variety-vegetable-select')
    const options = await select.locator('option').allTextContents()

    // All new plants should be present
    const newPlants = [
      'Corn Salad',
      'Winter Purslane',
      'Hamburg Parsley',
      'Kohlrabi',
      'Lovage',
      'Sorrel'
    ]

    for (const plant of newPlants) {
      const hasPlant = options.some(opt => opt.includes(plant))
      expect(hasPlant).toBe(true)
    }

    // Removed plants should NOT be present
    const removedPlants = ['Sweet Pepper', 'Chillies', 'Basil']
    for (const plant of removedPlants) {
      const hasPlant = options.some(opt => opt.includes(plant))
      expect(hasPlant).toBe(false)
    }
  })
})

