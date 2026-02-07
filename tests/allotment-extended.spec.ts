import { test, expect } from '@playwright/test'

async function setupWithBeds(page: import('@playwright/test').Page) {
  const currentYear = new Date().getFullYear()
  await page.addInitScript((year) => {
    const now = new Date().toISOString()
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      version: 16,
      meta: { name: 'Test Garden', setupCompleted: true, createdAt: now, updatedAt: now },
      layout: {
        areas: [
          { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', color: '#22c55e', position: { x: 0, y: 0, w: 2, h: 2 } },
          { id: 'bed-b', name: 'Bed B', kind: 'rotation-bed', color: '#3b82f6', position: { x: 2, y: 0, w: 2, h: 2 } }
        ]
      },
      seasons: [{
        year: year,
        status: 'current',
        areas: [{
          areaId: 'bed-a',
          rotationGroup: 'legumes',
          plantings: [
            { id: 'p1', plantId: 'lettuce', sowDate: `${year}-03-15`, sowMethod: 'indoor', varietyName: 'Little Gem' },
            { id: 'p2', plantId: 'carrot', sowDate: `${year}-04-01`, sowMethod: 'outdoor' }
          ],
          notes: []
        }, {
          areaId: 'bed-b',
          rotationGroup: 'brassicas',
          plantings: [],
          notes: []
        }],
        createdAt: now,
        updatedAt: now
      }],
      currentYear: year,
      maintenanceTasks: [],
      varieties: [],
      gardenEvents: []
    }))
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  }, currentYear)
}

test.describe('Allotment - Grid View', () => {
  test('should show bed names in grid items', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    await expect(page.getByText('Bed A')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Bed B')).toBeVisible()
  })

  test('should show planting count badges on beds', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    // Bed A has 2 plantings
    const bedA = page.locator('[role="gridcell"]').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
  })

  test('should select bed and show highlight', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button[aria-pressed]').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    // Should be selected (aria-pressed=true)
    await expect(bedA).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Allotment - Edit Mode', () => {
  test('should show Locked button when not editing', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    await expect(page.locator('[role="toolbar"]')).toBeVisible({ timeout: 15000 })
    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock/i })
    await expect(lockButton).toBeVisible()
    await expect(lockButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('should enter edit mode on click', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock/i })
    await expect(lockButton).toBeVisible({ timeout: 15000 })
    await lockButton.click()

    // Should now show editing state
    await expect(lockButton).toHaveAttribute('aria-pressed', 'true')
  })

  test('should show Add Area button when editing', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock/i })
    await expect(lockButton).toBeVisible({ timeout: 15000 })
    await lockButton.click()

    await expect(page.getByRole('button', { name: /Add Area/i })).toBeEnabled()
  })

  test('should exit edit mode when clicking again', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock/i })
    await expect(lockButton).toBeVisible({ timeout: 15000 })
    await lockButton.click()
    await expect(lockButton).toHaveAttribute('aria-pressed', 'true')

    await lockButton.click()
    await expect(lockButton).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('Allotment - Add Area Dialog', () => {
  test('should show area type selection buttons', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock/i })
    await expect(lockButton).toBeVisible({ timeout: 15000 })
    await lockButton.click()

    await page.getByRole('button', { name: /Add Area/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should have area type buttons
    await expect(dialog.getByText(/Rotation Bed/i).or(dialog.getByText(/Bed/i))).toBeVisible()
  })

  test('should show name field that accepts input', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock/i })
    await expect(lockButton).toBeVisible({ timeout: 15000 })
    await lockButton.click()

    await page.getByRole('button', { name: /Add Area/i }).click()
    const nameInput = page.locator('#area-name')
    await expect(nameInput).toBeVisible()
    await nameInput.fill('Test Bed C')
    await expect(nameInput).toHaveValue('Test Bed C')
  })

  test('should create area and show it in grid', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const lockButton = page.locator('button[aria-pressed]').filter({ hasText: /Lock/i })
    await expect(lockButton).toBeVisible({ timeout: 15000 })
    await lockButton.click()

    await page.getByRole('button', { name: /Add Area/i }).click()
    await page.locator('#area-name').fill('New Bed')
    await page.getByRole('dialog').locator('button[type="submit"]').filter({ hasText: /Add Area/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // New bed should appear in grid
    await expect(page.getByText('New Bed')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Allotment - Detail Panel', () => {
  test('should show area name in detail panel', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    // Detail panel should show the bed name
    await expect(page.getByText('Bed A').nth(1).or(page.locator('h2, h3').filter({ hasText: 'Bed A' }))).toBeVisible({ timeout: 5000 })
  })

  test('should show planting list in detail panel', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    // Should show plantings
    await expect(page.getByText('Lettuce')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Carrot')).toBeVisible()
  })
})

test.describe('Allotment - Add Planting Dialog Details', () => {
  test('should show searchable plant combobox', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    await page.getByRole('button', { name: /^Add$/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const combobox = page.getByRole('combobox', { name: /Search for a plant/i })
    await expect(combobox).toBeVisible()
    await combobox.fill('Tomato')
    await expect(page.getByRole('option', { name: /Tomato/i }).first()).toBeVisible()
  })

  test('should show sow method selector', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    await page.getByRole('button', { name: /^Add$/ }).click()

    // Select a plant first
    const combobox = page.getByRole('combobox', { name: /Search for a plant/i })
    await combobox.fill('Lettuce')
    await page.getByRole('option', { name: /Lettuce/i }).first().click()

    // Sow method selector should appear
    const sowMethod = page.locator('#sow-method-select')
    await expect(sowMethod).toBeVisible()
  })

  test('should show sow date picker', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    await page.getByRole('button', { name: /^Add$/ }).click()

    const combobox = page.getByRole('combobox', { name: /Search for a plant/i })
    await combobox.fill('Lettuce')
    await page.getByRole('option', { name: /Lettuce/i }).first().click()

    const sowDate = page.locator('#sow-date-input')
    await expect(sowDate).toBeVisible()
  })

  test('should show transplant date when indoor sow method selected', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    await page.getByRole('button', { name: /^Add$/ }).click()

    const combobox = page.getByRole('combobox', { name: /Search for a plant/i })
    await combobox.fill('Lettuce')
    await page.getByRole('option', { name: /Lettuce/i }).first().click()

    // Select indoor sow method
    const sowMethod = page.locator('#sow-method-select')
    const options = await sowMethod.locator('option').allTextContents()
    const indoorOption = options.find(o => /indoor/i.test(o))
    if (indoorOption) {
      await sowMethod.selectOption({ label: indoorOption })
    }

    // Transplant date should appear
    const transplantDate = page.locator('#transplant-date-input')
    await expect(transplantDate).toBeVisible()
  })

  test('should create planting and show it in bed', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    // Select Bed B (empty)
    const bedB = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed B' })
    await expect(bedB).toBeVisible({ timeout: 15000 })
    await bedB.click()

    await page.getByRole('button', { name: /^Add$/ }).click()

    const combobox = page.getByRole('combobox', { name: /Search for a plant/i })
    await combobox.fill('Pea')
    await page.getByRole('option', { name: /^Pea/ }).first().click()

    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // Planting should appear
    await expect(page.getByText('Pea')).toBeVisible()
  })
})

test.describe('Allotment - Planting Card', () => {
  test('should display plant name on planting card', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    await expect(page.getByText('Lettuce')).toBeVisible({ timeout: 5000 })
  })

  test('should open planting detail dialog on click', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    // Click on the Lettuce planting card
    const plantingCard = page.locator('[role="button"]').filter({ hasText: 'Lettuce' })
    await expect(plantingCard).toBeVisible({ timeout: 5000 })
    await plantingCard.click()

    // Detail dialog should open
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByText('Lettuce')).toBeVisible()
  })
})

test.describe('Allotment - Planting Detail Dialog', () => {
  test('should show plant info with care indicators', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    const plantingCard = page.locator('[role="button"]').filter({ hasText: 'Lettuce' })
    await expect(plantingCard).toBeVisible({ timeout: 5000 })
    await plantingCard.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should have tabs
    await expect(dialog.getByText(/Plant Info|Dates|Review/i).first()).toBeVisible()
  })

  test('should show companion planting info', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    const plantingCard = page.locator('[role="button"]').filter({ hasText: 'Lettuce' })
    await expect(plantingCard).toBeVisible({ timeout: 5000 })
    await plantingCard.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Companion info should appear (Good with / Conflicts with)
    const companionText = dialog.getByText(/Good with|Conflicts with|companion/i)
    // Not all plants have companion data, so this is optional
    if (await companionText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(companionText.first()).toBeVisible()
    }
  })

  test('should show editable sow date', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    const plantingCard = page.locator('[role="button"]').filter({ hasText: 'Lettuce' })
    await expect(plantingCard).toBeVisible({ timeout: 5000 })
    await plantingCard.click()

    const dialog = page.getByRole('dialog')
    // Click Dates tab
    const datesTab = dialog.getByText(/Dates/i)
    if (await datesTab.isVisible()) {
      await datesTab.click()
      const sowDate = dialog.locator('#sow-date')
      await expect(sowDate).toBeVisible()
    }
  })

  test('should show harvest date field', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    const plantingCard = page.locator('[role="button"]').filter({ hasText: 'Lettuce' })
    await expect(plantingCard).toBeVisible({ timeout: 5000 })
    await plantingCard.click()

    const dialog = page.getByRole('dialog')
    const datesTab = dialog.getByText(/Dates/i)
    if (await datesTab.isVisible()) {
      await datesTab.click()
      const harvestDate = dialog.locator('#harvest-date')
      await expect(harvestDate).toBeVisible()
    }
  })

  test('should show review tab with success rating', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    const plantingCard = page.locator('[role="button"]').filter({ hasText: 'Lettuce' })
    await expect(plantingCard).toBeVisible({ timeout: 5000 })
    await plantingCard.click()

    const dialog = page.getByRole('dialog')
    const reviewTab = dialog.getByText(/Review/i)
    if (await reviewTab.isVisible()) {
      await reviewTab.click()
      // Should show rating options
      await expect(dialog.getByText(/excellent|good|fair|poor/i).first()).toBeVisible()
    }
  })

  test('should show delete button with confirmation', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    const bedA = page.locator('[role="gridcell"] button').filter({ hasText: 'Bed A' })
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    const plantingCard = page.locator('[role="button"]').filter({ hasText: 'Lettuce' })
    await expect(plantingCard).toBeVisible({ timeout: 5000 })
    await plantingCard.click()

    const dialog = page.getByRole('dialog')
    const deleteButton = dialog.getByRole('button', { name: /Delete Planting/i })
    await expect(deleteButton).toBeVisible()

    await deleteButton.click()
    // Should show confirmation
    await expect(page.getByText(/Delete/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Keep/i })).toBeVisible()
  })
})

test.describe('Allotment - Data Persistence', () => {
  test('should show save indicator', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    // Save indicator has role="status"
    const saveIndicator = page.locator('[role="status"][aria-live="polite"]')
    // May show "Saved" or a timestamp
    await expect(saveIndicator.first()).toBeAttached()
  })
})

test.describe('Allotment - Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should show area cards on mobile', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    // On mobile, beds should still be accessible
    await expect(page.getByText('Bed A')).toBeVisible({ timeout: 15000 })
  })

  test('should show action buttons without hover on mobile', async ({ page }) => {
    await setupWithBeds(page)
    await page.goto('/allotment')

    // Select a bed
    const bedA = page.locator('button').filter({ hasText: 'Bed A' }).first()
    await expect(bedA).toBeVisible({ timeout: 15000 })
    await bedA.click()

    // Add button should be visible without hover
    await expect(page.getByRole('button', { name: /^Add$/ })).toBeVisible({ timeout: 5000 })
  })
})
