import { test, expect } from '@playwright/test'

// Helper to wait for page to be ready
async function waitForPageReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle')
}

test.describe('Compost Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compost')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await waitForPageReady(page)
  })

  test('should display compost page with header', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: 'Compost' })).toBeVisible()
    await expect(page.getByText('Monitor your compost status and care')).toBeVisible()
  })

  test('should display stats section', async ({ page }) => {
    await expect(page.getByText('Active')).toBeVisible()
    await expect(page.getByText('Maturing')).toBeVisible()
    await expect(page.getByText('Ready')).toBeVisible()
    await expect(page.getByText('Applied')).toBeVisible()
  })

  test('should display New Compost Pile button', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: 'New Compost Pile' })).toBeVisible()
  })
})

test.describe('Compost Pile CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compost')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await waitForPageReady(page)
  })

  test('should open add pile dialog', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('New Compost Pile')).toBeVisible()
  })

  test('should create a new compost pile', async ({ page }) => {
    const pileName = `Test Pile ${Date.now()}`

    // Open dialog
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()

    // Fill form
    await page.locator('#pile-name').fill(pileName)
    await page.locator('#pile-system').selectOption('hot-compost')
    await page.locator('#pile-notes').fill('Test notes for pile')

    // Submit
    await page.getByRole('dialog').getByRole('button', { name: 'Create Pile' }).click()

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Pile should appear in list
    await expect(page.getByText(pileName)).toBeVisible()
  })

  test('should require pile name to submit', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()

    // Submit button should be disabled without name
    const submitButton = page.getByRole('dialog').getByRole('button', { name: 'Create Pile' })
    await expect(submitButton).toBeDisabled()

    // Fill name
    await page.locator('#pile-name').fill('Test Pile')
    await expect(submitButton).not.toBeDisabled()
  })

  test('should close dialog on cancel', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should close dialog on Escape', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should delete a compost pile', async ({ page }) => {
    const pileName = `Delete Test ${Date.now()}`

    // Create pile first
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
    await page.locator('#pile-name').fill(pileName)
    await page.getByRole('dialog').getByRole('button', { name: 'Create Pile' }).click()
    await expect(page.getByText(pileName)).toBeVisible()

    // Find the pile card and expand tracking details
    const pileCard = page.locator('.zen-card').filter({ hasText: pileName })
    await pileCard.getByRole('button', { name: /Tracking Details/ }).click()

    // Wait for expanded content and click delete
    await pileCard.getByText('Delete pile').click()

    // Confirm delete in dialog
    await expect(page.getByRole('dialog').getByText('Delete Compost Pile')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()

    // Pile should be gone
    await expect(page.getByText(pileName)).not.toBeVisible()
  })

  test('should cancel pile deletion', async ({ page }) => {
    const pileName = `Keep Test ${Date.now()}`

    // Create pile first
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
    await page.locator('#pile-name').fill(pileName)
    await page.getByRole('dialog').getByRole('button', { name: 'Create Pile' }).click()
    await expect(page.getByText(pileName)).toBeVisible()

    // Find the pile card and expand tracking details
    const pileCard = page.locator('.zen-card').filter({ hasText: pileName })
    await pileCard.getByRole('button', { name: /Tracking Details/ }).click()

    // Click delete pile link
    await pileCard.getByText('Delete pile').click()

    // Cancel delete
    await page.getByRole('dialog').getByRole('button', { name: 'Keep' }).click()

    // Pile should still exist
    await expect(page.getByText(pileName)).toBeVisible()
  })
})

test.describe('Compost Inputs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compost')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await waitForPageReady(page)
  })

  test('should log input to a pile', async ({ page }) => {
    const pileName = `Input Test ${Date.now()}`

    // Create pile
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
    await page.locator('#pile-name').fill(pileName)
    await page.getByRole('dialog').getByRole('button', { name: 'Create Pile' }).click()
    await expect(page.getByText(pileName)).toBeVisible()

    // Click Add Material button in the pile card
    const pileCard = page.locator('.zen-card').filter({ hasText: pileName })
    await pileCard.getByRole('button', { name: 'Add Material' }).click()

    // Fill input form
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Add Material' })).toBeVisible()
    await page.locator('#input-material').fill('Kitchen scraps')
    await page.locator('#input-quantity').fill('2 buckets')

    // Submit
    await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click()

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Expand the tracking details to see input was added
    await pileCard.getByRole('button', { name: /Tracking Details/ }).click()
    await expect(pileCard.getByText('Kitchen scraps')).toBeVisible()
  })

  test('should require material to log input', async ({ page }) => {
    // Create pile
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
    await page.locator('#pile-name').fill('Test Pile')
    await page.getByRole('dialog').getByRole('button', { name: 'Create Pile' }).click()

    // Open log input dialog using the Add Material button in pile card
    const pileCard = page.locator('.zen-card').filter({ hasText: 'Test Pile' })
    await pileCard.getByRole('button', { name: 'Add Material' }).click()

    // Submit button should be disabled
    const submitButton = page.getByRole('dialog').getByRole('button', { name: 'Add' })
    await expect(submitButton).toBeDisabled()
  })
})

test.describe('Compost Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compost')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await waitForPageReady(page)
  })

  test('should log event to a pile', async ({ page }) => {
    const pileName = `Event Test ${Date.now()}`

    // Create pile
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
    await page.locator('#pile-name').fill(pileName)
    await page.getByRole('dialog').getByRole('button', { name: 'Create Pile' }).click()
    await expect(page.getByText(pileName)).toBeVisible()

    // Click Log Event button in the pile card
    const pileCard = page.locator('.zen-card').filter({ hasText: pileName })
    await pileCard.getByRole('button', { name: 'Log Event' }).click()

    // Fill event form
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Log Event' })).toBeVisible()
    await page.locator('#event-notes').fill('Turned the pile thoroughly')

    // Submit
    await page.getByRole('dialog').getByRole('button', { name: 'Log Event' }).click()

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('Compost Status Changes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compost')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await waitForPageReady(page)
  })

  test('should change pile status', async ({ page }) => {
    const pileName = `Status Test ${Date.now()}`

    // Create pile
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
    await page.locator('#pile-name').fill(pileName)
    await page.getByRole('dialog').getByRole('button', { name: 'Create Pile' }).click()
    await expect(page.getByText(pileName)).toBeVisible()

    // Find the pile card and expand tracking details
    const pileCard = page.locator('.zen-card').filter({ hasText: pileName })
    await pileCard.getByRole('button', { name: /Tracking Details/ }).click()

    // Change status to Maturing
    await pileCard.locator('select').selectOption('maturing')

    // Wait for UI update - look for the badge
    await expect(pileCard.locator('span').filter({ hasText: 'Maturing' })).toBeVisible()
  })
})

test.describe('Compost Data Persistence', () => {
  test('should persist piles across page reloads', async ({ page }) => {
    await page.goto('/compost')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await waitForPageReady(page)

    const pileName = `Persist Test ${Date.now()}`

    // Create pile
    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
    await page.locator('#pile-name').fill(pileName)
    await page.getByRole('dialog').getByRole('button', { name: 'Create Pile' }).click()
    await expect(page.getByText(pileName)).toBeVisible()

    // Wait for save (debounced at 500ms)
    await page.waitForTimeout(700)

    // Reload
    await page.reload()
    await waitForPageReady(page)

    // Pile should still be there
    await expect(page.getByText(pileName)).toBeVisible()
  })
})

test.describe('Compost Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/compost')
    await waitForPageReady(page)

    await expect(page.locator('h1').filter({ hasText: 'Compost' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'New Compost Pile' })).toBeVisible()
  })

  test('dialogs should be usable on mobile', async ({ page }) => {
    await page.goto('/compost')
    await waitForPageReady(page)

    await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Form should be visible
    await expect(page.locator('#pile-name')).toBeVisible()

    // Close
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })
})

test.describe('Compost Navigation', () => {
  test('should navigate to allotment page', async ({ page }) => {
    await page.goto('/compost')
    await waitForPageReady(page)

    // Click the Allotment button in the page header (not nav)
    await page.locator('#main-content').getByRole('link', { name: 'Allotment' }).click()

    await expect(page).toHaveURL(/allotment/)
  })
})

test.describe('Compost Empty State', () => {
  test('should show empty state when no piles exist', async ({ page }) => {
    await page.goto('/compost')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await waitForPageReady(page)

    await expect(page.getByText('No compost piles yet')).toBeVisible()
    await expect(page.getByText('Create your first pile')).toBeVisible()
  })

  test('should create pile from empty state button', async ({ page }) => {
    await page.goto('/compost')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await waitForPageReady(page)

    // Click empty state button
    await page.locator('button').filter({ hasText: 'Create your first pile' }).click()

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
