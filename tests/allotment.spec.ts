import { test, expect } from '@playwright/test'

// Helper function to seed test data via localStorage for mobile or when UI is not available
async function seedTestData(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const now = new Date().toISOString()
    const currentYear = new Date().getFullYear()
    const testData = {
      version: 12,
      meta: {
        name: 'My Allotment',
        location: 'Edinburgh, Scotland',
        createdAt: now,
        updatedAt: now
      },
      layout: {
        areas: [{
          id: 'test-bed-a',
          name: 'Test Bed A',
          kind: 'rotation',
          position: { x: 0, y: 0, w: 2, h: 2 }
        }]
      },
      seasons: [{
        year: currentYear,
        status: 'current',
        areas: [{
          areaId: 'test-bed-a',
          rotationGroup: 'legumes',
          plantings: [],
          notes: []
        }],
        createdAt: now,
        updatedAt: now
      }],
      currentYear: currentYear,
      maintenanceTasks: [],
      varieties: [],
      gardenEvents: []
    }
    localStorage.setItem('allotment-unified-data', JSON.stringify(testData))
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  })
  await page.reload()
  await page.waitForLoadState('domcontentloaded')
  // Wait for React hydration - the loading spinner should disappear
  await page.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
    // Spinner might not be present if page loaded quickly
  })
  // Also wait for the h1 to appear (indicates page finished loading)
  await page.locator('h1').filter({ hasText: /Plot Layout/i }).waitFor({ state: 'visible', timeout: 30000 })
}

// Helper function to create a sample rotation bed if none exists
async function ensureRotationBedExists(page: import('@playwright/test').Page) {
  // Wait for grid items to potentially appear (seedTestData may have just seeded data)
  const gridItems = page.locator('[class*="react-grid-item"]')

  // Give seeded data time to render before deciding to create a new bed
  const hasItems = await gridItems.first().waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false)

  if (!hasItems) {
    // Check if we're on desktop (Unlock/Lock button visible) or mobile
    const editButton = page.locator('button').filter({ hasText: /Unlock to edit|Lock/ }).first()
    const isDesktop = await editButton.isVisible({ timeout: 2000 }).catch(() => false)

    if (isDesktop) {
      // Desktop: use UI to create area
      // Enter edit mode by clicking the locked/edit button
      await editButton.click()

      // Wait for Add Area button to be enabled (indicates edit mode is active)
      const addAreaButton = page.locator('button').filter({ hasText: 'Add Area' })
      await expect(addAreaButton).toBeEnabled({ timeout: 3000 })
      await addAreaButton.click()

      // Wait for dialog to open
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 3000 })

      // Fill in the Add Area form (defaults to Rotation Bed with Legumes rotation group)
      await page.locator('#area-name').fill('Test Bed A')

      // Submit the form
      await page.locator('button[type="submit"]').filter({ hasText: 'Add Area' }).click()

      // Wait for the dialog to close and area to appear
      await expect(dialog).not.toBeVisible({ timeout: 5000 })
      await expect(page.locator('[class*="react-grid-item"]').first()).toBeVisible({ timeout: 5000 })

      // Exit edit mode - click Lock button
      const lockButton = page.locator('button').filter({ hasText: /^Lock$/ }).first()
      if (await lockButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await lockButton.click()
        // Wait for edit mode to exit (Unlock button should reappear)
        await expect(page.locator('button').filter({ hasText: /Unlock to edit/ })).toBeVisible({ timeout: 3000 }).catch(() => {})
      }
    } else {
      // Mobile: seed data via localStorage
      await seedTestData(page)
    }
  }
}

// Helper function to select a rotation bed (not perennial)
async function selectRotationBed(page: import('@playwright/test').Page) {
  // Ensure at least one bed exists
  await ensureRotationBedExists(page)

  // Wait for grid items to be visible
  await expect(page.locator('[class*="react-grid-item"]').first()).toBeVisible({ timeout: 5000 }).catch(() => {})

  // Try desktop grid item first
  const gridItem = page.locator('[class*="react-grid-item"]').first()

  if (await gridItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await gridItem.click()
    // Wait for bed details panel and Add button to appear (robust for CI)
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 10000 })
    return true
  }

  // Try mobile area card (button with bed name)
  const mobileItem = page.locator('button').filter({ hasText: 'Test Bed A' }).first()
  if (await mobileItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mobileItem.click()
    // Wait for bed details panel and Add button to appear (robust for CI)
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 10000 })
    return true
  }

  return false
}

test.describe('Allotment Page', () => {
  test.beforeEach(async ({ page }) => {
    // Seed fresh data before navigating
    await page.goto('/allotment')
    await seedTestData(page)
  })

  test('should display allotment page with header', async ({ page }) => {
    // Page should already be loaded with header visible from beforeEach
    await expect(page.locator('h1').filter({ hasText: /Plot Layout/i })).toBeVisible()
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
    await seedTestData(page)

    // Get the current year (seeded by seedTestData)
    const currentYear = new Date().getFullYear()

    // Find actual year selector buttons (not "Add year" buttons which have img children)
    // Year selectors are buttons with just the year text, no Plus icons
    const yearButton = page.locator('button').filter({ hasText: String(currentYear) }).filter({ hasNot: page.locator('img, svg') })

    // Verify the year button exists and is selected (has moss-600 background)
    await expect(yearButton).toBeVisible({ timeout: 5000 })
    await expect(yearButton).toHaveClass(/bg-zen-moss-600/, { timeout: 3000 })

    // Reload the page
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // Wait for data to load from localStorage
    await page.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {})
    await page.locator('h1').filter({ hasText: /Plot Layout/i }).waitFor({ state: 'visible', timeout: 30000 })

    // Year should still be selected after reload
    const yearButtonAfterReload = page.locator('button').filter({ hasText: String(currentYear) }).filter({ hasNot: page.locator('img, svg') })
    await expect(yearButtonAfterReload).toHaveClass(/bg-zen-moss-600/, { timeout: 5000 })
  })
})

test.describe('Allotment Dialog Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await seedTestData(page)
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

    // Wait for dialog to be fully interactive (first focusable element should be focused)
    await expect(dialog.locator('input, button, select, textarea').first()).toBeFocused({ timeout: 2000 }).catch(() => {})

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
    await seedTestData(page)
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
})

test.describe('Allotment Data Persistence', () => {
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
    await expect(page.locator('h1').filter({ hasText: /Plot Layout/i })).toBeVisible()
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

})


test.describe('Allotment Bed Notes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await seedTestData(page)
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

    // Wait for debounced save to complete by checking localStorage update
    await page.waitForFunction(
      (text) => {
        const data = localStorage.getItem('allotment-unified-data')
        return data !== null && data.includes(text)
      },
      noteText,
      { timeout: 5000 }
    )

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
    await seedTestData(page)
  })

  test('resize handles should be clickable when area is selected', async ({ page }) => {
    // Ensure at least one area exists
    await ensureRotationBedExists(page)

    // Enter edit mode
    const lockButton = page.locator('button').filter({ hasText: /Unlock to edit|Lock/ }).first()
    await expect(lockButton).toBeVisible({ timeout: 5000 })
    await lockButton.click()

    // Wait for edit mode to activate (Add Area button becomes enabled)
    const addAreaButton = page.locator('button').filter({ hasText: 'Add Area' })
    await expect(addAreaButton).toBeEnabled({ timeout: 3000 })

    // Click on a grid item to select it
    const gridItem = page.locator('[class*="react-grid-item"]').first()
    await gridItem.click()

    // Wait for the resize handle to appear (indicates selection is complete)
    const resizeHandle = gridItem.locator('.react-resizable-handle')
    await expect(resizeHandle).toBeVisible({ timeout: 3000 })

    // Get the bounding box of the grid item
    const boundingBox = await gridItem.boundingBox()
    expect(boundingBox).not.toBeNull()

    if (boundingBox) {
      // Try to hover over the bottom-right corner where resize handle should be
      await page.mouse.move(
        boundingBox.x + boundingBox.width - 5,
        boundingBox.y + boundingBox.height - 5
      )

      // Verify the resize handle is visible
      await expect(resizeHandle).toBeVisible()
    }
  })

})

test.describe('Custom Allotment Naming', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await seedTestData(page)
  })

  test('should display custom allotment name in navigation', async ({ page }) => {
    // Default name should be "My Allotment" in the nav link
    const navName = page.locator('nav a').filter({ hasText: 'My Allotment' })
    await expect(navName).toBeVisible()
  })

  test('should show edit button next to allotment name', async ({ page }) => {
    // Edit button (pencil icon) should be visible next to the name
    const editButton = page.locator('nav button[aria-label="Edit allotment name"]')
    await expect(editButton).toBeVisible()
  })

  test('should make allotment name editable on edit button click', async ({ page }) => {
    // Click the edit button (pencil icon)
    const editButton = page.locator('nav button[aria-label="Edit allotment name"]')
    await editButton.click()

    // Should show an input field
    const nameInput = page.locator('nav input[aria-label="Allotment name"]')
    await expect(nameInput).toBeVisible({ timeout: 3000 })
    await expect(nameInput).toBeFocused()
  })

  test('should save new name on Enter key', async ({ page }) => {
    // Click the edit button
    const editButton = page.locator('nav button[aria-label="Edit allotment name"]')
    await editButton.click()

    // Fill in new name
    const nameInput = page.locator('nav input[aria-label="Allotment name"]')
    await expect(nameInput).toBeVisible({ timeout: 3000 })
    await nameInput.fill('My Sunny Garden')
    await nameInput.press('Enter')

    // New name should appear in the nav link
    await expect(page.locator('nav a').filter({ hasText: 'My Sunny Garden' })).toBeVisible({ timeout: 5000 })
  })

  test('should save new name on blur', async ({ page }) => {
    // Click the edit button
    const editButton = page.locator('nav button[aria-label="Edit allotment name"]')
    await editButton.click()

    // Fill in new name
    const nameInput = page.locator('nav input[aria-label="Allotment name"]')
    await expect(nameInput).toBeVisible({ timeout: 3000 })
    await nameInput.fill('My Beautiful Plot')

    // Click outside to blur
    await page.locator('body').click({ position: { x: 10, y: 10 } })

    // New name should appear in nav
    await expect(page.locator('nav a').filter({ hasText: 'My Beautiful Plot' })).toBeVisible({ timeout: 5000 })
  })

  test('should cancel edit on Escape key', async ({ page }) => {
    // Click the edit button
    const editButton = page.locator('nav button[aria-label="Edit allotment name"]')
    await editButton.click()

    // Fill in temporary name then press Escape
    const nameInput = page.locator('nav input[aria-label="Allotment name"]')
    await expect(nameInput).toBeVisible({ timeout: 3000 })
    await nameInput.fill('Temporary Name')
    await nameInput.press('Escape')

    // Original name should still be there
    await expect(page.locator('nav a').filter({ hasText: 'My Allotment' })).toBeVisible({ timeout: 5000 })
  })

  test('should persist custom name across page reloads', async ({ page }) => {
    // Click the edit button
    const editButton = page.locator('nav button[aria-label="Edit allotment name"]')
    await editButton.click()

    // Fill in new name
    const nameInput = page.locator('nav input[aria-label="Allotment name"]')
    await expect(nameInput).toBeVisible({ timeout: 3000 })
    await nameInput.fill('Edinburgh Garden')
    await nameInput.press('Enter')

    // Wait for name to appear in nav
    await expect(page.locator('nav a').filter({ hasText: 'Edinburgh Garden' })).toBeVisible({ timeout: 5000 })

    // Wait for debounced save to complete by checking localStorage update
    await page.waitForFunction(
      () => {
        const data = localStorage.getItem('allotment-unified-data')
        return data !== null && data.includes('Edinburgh Garden')
      },
      { timeout: 5000 }
    )

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Custom name should still be visible in nav
    await expect(page.locator('nav a').filter({ hasText: 'Edinburgh Garden' })).toBeVisible()
  })

  test('should show custom name in navigation after changing it', async ({ page }) => {
    // Click the edit button
    const editButton = page.locator('nav button[aria-label="Edit allotment name"]')
    await editButton.click()

    // Fill in new name
    const nameInput = page.locator('nav input[aria-label="Allotment name"]')
    await expect(nameInput).toBeVisible({ timeout: 3000 })
    await nameInput.fill('Test Garden Name')
    await nameInput.press('Enter')

    // Wait for name to appear in nav
    await expect(page.locator('nav a').filter({ hasText: 'Test Garden Name' })).toBeVisible({ timeout: 5000 })

    // Wait for debounced save to complete
    await page.waitForFunction(
      () => {
        const data = localStorage.getItem('allotment-unified-data')
        return data !== null && data.includes('Test Garden Name')
      },
      { timeout: 5000 }
    )

    // Navigate to another page
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Custom name should appear in navigation
    await expect(page.locator('nav a').filter({ hasText: 'Test Garden Name' })).toBeVisible()
  })
})

test.describe('Plant Database - Excluded Plants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await seedTestData(page)
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

    // Open the plant combobox to see all options
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()

    // Wait for dropdown to appear
    const listbox = page.getByRole('listbox', { name: 'Plant search results' })
    await expect(listbox).toBeVisible()

    // Get all plant option texts
    const options = await listbox.getByRole('option').allTextContents()

    // Should NOT include Chillies (too warm for Scotland)
    const hasChillies = options.some(opt => opt.includes('Chillies'))
    expect(hasChillies).toBe(false)
  })
})

test.describe('Seeds Page - PlantCombobox', () => {
  test.beforeEach(async ({ page }) => {
    // Seed allotment data first (seeds page uses the same storage)
    await page.goto('/allotment')
    await seedTestData(page)
    await page.goto('/seeds')
    await page.waitForLoadState('domcontentloaded')
    // Wait for page to finish loading
    await page.locator('h1').filter({ hasText: /Seeds/i }).waitFor({ state: 'visible', timeout: 15000 })
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
    await seedTestData(page)
  })

  test('should allow adding infrastructure without a name', async ({ page }) => {
    // First, enable edit mode by clicking the "Edit layout" / "Locked" button
    const lockButton = page.locator('button').filter({ hasText: /Unlock to edit|Lock/ }).first()
    await expect(lockButton).toBeVisible({ timeout: 5000 })
    await lockButton.click()

    // Wait for edit mode to activate
    const addAreaButton = page.locator('button').filter({ hasText: 'Add Area' })
    await expect(addAreaButton).toBeEnabled({ timeout: 3000 })
    await addAreaButton.click()

    // Wait for dialog
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // Select Infrastructure type
    const infrastructureButton = page.locator('button').filter({ hasText: 'Infrastructure' })
    await infrastructureButton.click()

    // Wait for infrastructure subtype selector to appear
    const infraTypeSelect = page.locator('#infra-subtype')
    await expect(infraTypeSelect).toBeVisible({ timeout: 3000 })
    await infraTypeSelect.selectOption('compost')

    // Leave name field empty - it should show placeholder with default
    const nameInput = page.locator('#area-name')
    await expect(nameInput).toHaveAttribute('placeholder', /Optional.*Compost/)

    // Submit button should be enabled even without a name
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: 'Add Area' })
    await expect(submitButton).toBeEnabled()

    // Submit the form
    await submitButton.click()

    // Wait for the dialog to close and area to appear
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // Area should appear with the infrastructure type as name
    const compostArea = page.locator('[class*="react-grid-item"]').filter({ hasText: 'Compost' })
    await expect(compostArea).toBeVisible({ timeout: 5000 })
  })

  test('should use custom name if provided for infrastructure', async ({ page }) => {
    // First, enable edit mode by clicking the "Edit layout" / "Locked" button
    const lockButton = page.locator('button').filter({ hasText: /Unlock to edit|Lock/ }).first()
    await expect(lockButton).toBeVisible({ timeout: 5000 })
    await lockButton.click()

    // Wait for edit mode to activate
    const addAreaButton = page.locator('button').filter({ hasText: 'Add Area' })
    await expect(addAreaButton).toBeEnabled({ timeout: 3000 })
    await addAreaButton.click()

    // Wait for dialog
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // Select Infrastructure type
    const infrastructureButton = page.locator('button').filter({ hasText: 'Infrastructure' })
    await infrastructureButton.click()

    // Wait for infrastructure subtype selector to appear
    const infraTypeSelect = page.locator('#infra-subtype')
    await expect(infraTypeSelect).toBeVisible({ timeout: 3000 })
    await infraTypeSelect.selectOption('shed')

    // Provide custom name
    const nameInput = page.locator('#area-name')
    await nameInput.fill('Tool Shed')

    // Submit the form
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: 'Add Area' })
    await submitButton.click()

    // Wait for the dialog to close and area to appear
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // Area should appear with the custom name
    const toolShedArea = page.locator('[class*="react-grid-item"]').filter({ hasText: 'Tool Shed' })
    await expect(toolShedArea).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Plant Database - New Scottish Plants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await seedTestData(page)
  })

  // Helper to select a plant from the combobox in Add Planting dialog
  async function selectPlantFromCombobox(page: import('@playwright/test').Page, plantName: string) {
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()
    await plantCombobox.fill(plantName)

    // Wait for filtered results and select the matching option
    const listbox = page.getByRole('listbox', { name: 'Plant search results' })
    await expect(listbox).toBeVisible()

    const option = page.getByRole('option', { name: new RegExp(`^${plantName}`, 'i') })
    await expect(option).toBeVisible({ timeout: 5000 })
    await option.click()

    // Verify it was selected (value may include additional names in parentheses)
    const value = await plantCombobox.inputValue()
    expect(value).toContain(plantName)
  }

  test('should show Corn Salad in plant selection', async ({ page }) => {
    // Select a rotation bed
    await selectRotationBed(page)

    // Open Add Planting dialog
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Should be able to select Corn Salad
    await selectPlantFromCombobox(page, 'Corn Salad')
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
    await selectPlantFromCombobox(page, 'Winter Purslane')
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
    await selectPlantFromCombobox(page, 'Hamburg Parsley')
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
    await selectPlantFromCombobox(page, 'Kohlrabi')
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
    await selectPlantFromCombobox(page, 'Lovage')
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
    await selectPlantFromCombobox(page, 'Sorrel')
  })
})

