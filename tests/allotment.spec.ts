import { test, expect } from '@playwright/test'

// Helper function to select a rotation bed (not perennial)
async function selectRotationBed(page: import('@playwright/test').Page) {
  // Wait for all beds section to load
  const allBedsSection = page.locator('h4').filter({ hasText: 'All Beds' }).locator('..')
  await expect(allBedsSection).toBeVisible({ timeout: 10000 })

  // Wait a moment for data to initialize
  await page.waitForTimeout(500)

  // Click on a bed that is not perennial - look for beds with rotation groups
  const rotationBedButton = page.locator('button').filter({ hasText: /legumes|brassicas|roots|alliums|solanaceae|cucurbits/i }).first()
  if (await rotationBedButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await rotationBedButton.click()
    // Wait for bed details to appear
    await page.waitForTimeout(300)
    return true
  }

  // Fallback: click first bed button in the All Beds section
  const anyBedButton = allBedsSection.locator('button').first()
  if (await anyBedButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await anyBedButton.click()
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

  test('should add a new planting', async ({ page }) => {
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
    await page.locator('#vegetable-select').selectOption({ label: 'Peas' })
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

  test('should show delete confirmation dialog', async ({ page }) => {
    // First add a planting so we have something to delete
    await selectRotationBed(page)

    // Add a planting
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.locator('#vegetable-select').selectOption({ label: 'Tomatoes' })
    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()

    // Wait for planting to appear (use exact match to avoid "Rate success for Tomatoes")
    await expect(page.getByText('Tomatoes', { exact: true })).toBeVisible({ timeout: 5000 })

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

  test('should cancel delete when clicking Keep', async ({ page }) => {
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
    await page.locator('#vegetable-select').selectOption({ label: 'Carrots' })
    await page.locator('#variety-input').fill(uniqueVariety)
    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()

    // Wait for planting to appear (use exact variety name)
    await expect(page.getByText(uniqueVariety)).toBeVisible()

    // Click delete on Carrots (first one)
    const deleteButton = page.locator('button[aria-label*="Delete Carrots"]').first()
    await deleteButton.click()

    // Click Keep
    await page.getByRole('dialog').getByRole('button', { name: 'Keep' }).click()

    // Dialog should close and planting should still be there
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText(uniqueVariety)).toBeVisible()
  })

  test('should delete planting when confirmed', async ({ page }) => {
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
  test('should persist plantings across page reloads', async ({ page }) => {
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
    await page.locator('#vegetable-select').selectOption({ label: 'Tomatoes' })
    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()

    // Wait for planting to appear (use exact match to avoid "Rate success for Tomatoes")
    await expect(page.getByText('Tomatoes', { exact: true })).toBeVisible({ timeout: 5000 })

    // Wait for save (debounced at 500ms)
    await page.waitForTimeout(700)

    // Reload
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Re-select the same rotation bed
    await selectRotationBed(page)

    // Planting should still be there (use exact match)
    await expect(page.getByText('Tomatoes', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('should load migrated historical data', async ({ page }) => {
    await page.goto('/allotment')
    
    // Should have data from legacy migration (2024, 2025)
    await expect(page.locator('button').filter({ hasText: '2024' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: '2025' })).toBeVisible()
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

