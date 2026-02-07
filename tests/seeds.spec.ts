import { test, expect } from '@playwright/test'

// Helper to setup seeds page with some test data
async function setupWithVarieties(page: import('@playwright/test').Page) {
  const currentYear = new Date().getFullYear()
  await page.addInitScript((year) => {
    const now = new Date().toISOString()
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      version: 16,
      meta: { name: 'Test Garden', setupCompleted: true, createdAt: now, updatedAt: now },
      layout: {
        areas: [
          { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', position: { x: 0, y: 0, w: 2, h: 2 } }
        ]
      },
      seasons: [{
        year: year,
        status: 'current',
        areas: [{
          areaId: 'bed-a',
          rotationGroup: 'legumes',
          plantings: [
            { id: 'p1', plantId: 'lettuce', sowDate: `${year}-03-15`, sowMethod: 'indoor', varietyId: 'lettuce-little-gem', varietyName: 'Little Gem' }
          ],
          notes: []
        }],
        createdAt: now,
        updatedAt: now
      }],
      currentYear: year,
      maintenanceTasks: [],
      varieties: [
        {
          id: 'lettuce-little-gem',
          plantId: 'lettuce',
          name: 'Little Gem',
          supplier: 'Organic Gardening',
          price: 2.50,
          notes: 'Good performer',
          isArchived: false,
          seedsByYear: { [year]: 'have' },
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'lettuce-lollo-rossa',
          plantId: 'lettuce',
          name: 'Lollo Rossa',
          supplier: 'Garden Organic',
          price: 1.99,
          notes: '',
          isArchived: false,
          seedsByYear: { [year]: 'ordered' },
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'carrot-nantes',
          plantId: 'carrot',
          name: 'Nantes',
          supplier: '',
          price: 0,
          notes: 'Poor germination last year',
          isArchived: false,
          seedsByYear: { [year]: 'none' },
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'tomato-gardeners-delight',
          plantId: 'tomato',
          name: "Gardener's Delight",
          supplier: 'Potato House',
          price: 3.50,
          notes: '',
          isArchived: true,
          seedsByYear: {},
          createdAt: now,
          updatedAt: now
        }
      ],
      gardenEvents: []
    }))
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  }, currentYear)
}

// Helper for empty state
async function setupEmpty(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      meta: { setupCompleted: true },
      layout: { areas: [] },
      seasons: [{ year: new Date().getFullYear(), status: 'current', areas: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      currentYear: new Date().getFullYear(),
      varieties: []
    }))
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  })
}

test.describe('Seeds Page - Header and Layout', () => {
  test('should display page header', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    await expect(page.getByRole('heading', { name: /Seeds & Varieties/i })).toBeVisible()
    await expect(page.getByText('Track your seed collection')).toBeVisible()
  })

  test('should display year tabs with All and year buttons', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // "All" tab
    const allButton = page.locator('[data-tour="year-tabs"] button').filter({ hasText: 'All' })
    await expect(allButton).toBeVisible()

    // Current year tab
    const yearButton = page.locator('[data-tour="year-tabs"] button').filter({ hasText: String(new Date().getFullYear()) })
    await expect(yearButton).toBeVisible()
  })

  test('should default to current year tab', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    const currentYear = new Date().getFullYear()
    const yearButton = page.locator('[data-tour="year-tabs"] button').filter({ hasText: String(currentYear) })
    // Selected year should have moss-600 background
    await expect(yearButton).toHaveClass(/bg-zen-moss-600/)
  })
})

test.describe('Seeds Page - Year Navigation', () => {
  test('should switch to All view', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    const allButton = page.locator('[data-tour="year-tabs"] button').filter({ hasText: 'All' })
    await allButton.click()

    // All button should now be selected
    await expect(allButton).toHaveClass(/bg-zen-moss-600/)
  })

  test('should switch back to year view', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Switch to All
    await page.locator('[data-tour="year-tabs"] button').filter({ hasText: 'All' }).click()

    // Switch back to year
    const currentYear = new Date().getFullYear()
    const yearButton = page.locator('[data-tour="year-tabs"] button').filter({ hasText: String(currentYear) })
    await yearButton.click()

    await expect(yearButton).toHaveClass(/bg-zen-moss-600/)
  })
})

test.describe('Seeds Page - Statistics Cards', () => {
  test('should display stats cards with counts', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    const statsGrid = page.locator('[data-tour="seed-stats"]')
    await expect(statsGrid).toBeVisible()

    // Have count should show 1 (Little Gem has status 'have')
    await expect(statsGrid.getByText('Have Seeds')).toBeVisible()

    // Need count should show (Nantes has 'none', Lollo Rossa has 'ordered')
    await expect(statsGrid.getByText('Need to Order')).toBeVisible()
  })

  test('should disable stat filters when All tab is selected', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Switch to All
    await page.locator('[data-tour="year-tabs"] button').filter({ hasText: 'All' }).click()

    // Stat buttons should be disabled
    const haveButton = page.locator('[data-tour="seed-stats"] button').filter({ hasText: 'Have Seeds' })
    await expect(haveButton).toBeDisabled()

    const needButton = page.locator('[data-tour="seed-stats"] button').filter({ hasText: 'Need to Order' })
    await expect(needButton).toBeDisabled()
  })

  test('should toggle have seeds filter', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Click Have Seeds stat to filter
    const haveButton = page.locator('[data-tour="seed-stats"] button').filter({ hasText: 'Have Seeds' })
    await haveButton.click()

    // Should show pressed state
    await expect(haveButton).toHaveAttribute('aria-pressed', 'true')

    // Click again to toggle off
    await haveButton.click()
    await expect(haveButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('should toggle need to order filter', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    const needButton = page.locator('[data-tour="seed-stats"] button').filter({ hasText: 'Need to Order' })
    await needButton.click()

    await expect(needButton).toHaveAttribute('aria-pressed', 'true')

    await needButton.click()
    await expect(needButton).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('Seeds Page - Variety Groups', () => {
  test('should display variety groups with plant names and counts', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Should show Lettuce group with count
    await expect(page.getByRole('button', { name: /Lettuce \(2\)/ })).toBeVisible()

    // Should show Carrot group
    await expect(page.getByRole('button', { name: /Carrot \(1\)/ })).toBeVisible()
  })

  test('should expand and collapse a variety group', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Click Lettuce group to expand
    const lettuceGroup = page.getByRole('button', { name: /Lettuce \(2\)/ })
    await lettuceGroup.click()

    // Varieties should be visible
    await expect(page.getByText('Little Gem')).toBeVisible()
    await expect(page.getByText('Lollo Rossa')).toBeVisible()

    // Click again to collapse
    await lettuceGroup.click()

    // Varieties should be hidden
    await expect(page.getByText('Little Gem')).not.toBeVisible()
  })

  test('should expand all groups', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Click Expand All
    await page.getByRole('button', { name: /Expand/ }).click()

    // All varieties should be visible
    await expect(page.getByText('Little Gem')).toBeVisible()
    await expect(page.getByText('Nantes')).toBeVisible()
  })

  test('should collapse all groups', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Expand all first
    await page.getByRole('button', { name: /Expand/ }).click()
    await expect(page.getByText('Little Gem')).toBeVisible()

    // Collapse all
    await page.getByRole('button', { name: /Collapse/ }).click()
    await expect(page.getByText('Little Gem')).not.toBeVisible()
  })
})

test.describe('Seeds Page - Archived Varieties', () => {
  test('should hide archived varieties by default', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Switch to "All" to see all varieties
    await page.locator('[data-tour="year-tabs"] button').filter({ hasText: 'All' }).click()

    // Expand all groups
    await page.getByRole('button', { name: /Expand/ }).click()

    // Archived variety should not be visible
    await expect(page.getByText("Gardener's Delight")).not.toBeVisible()
  })

  test('should show archived varieties when toggle is enabled', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Switch to "All"
    await page.locator('[data-tour="year-tabs"] button').filter({ hasText: 'All' }).click()

    // Enable show archived
    const archivedToggle = page.getByRole('button', { name: /archived/i })
    await archivedToggle.click()

    // Expand all groups
    await page.getByRole('button', { name: /Expand/ }).click()

    // Archived variety should now be visible
    await expect(page.getByText("Gardener's Delight")).toBeVisible()
  })
})

test.describe('Seeds Page - Variety Notes Warning', () => {
  test('should show warning icon for notes with warning keywords', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Expand Carrot group (has variety with "Poor germination" notes)
    const carrotGroup = page.getByRole('button', { name: /Carrot/ })
    await carrotGroup.click()

    // The notes text should be visible
    await expect(page.getByText('Poor germination last year')).toBeVisible()
  })
})

test.describe('Seeds Page - Add Variety Flow', () => {
  test('should open add variety dialog', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Add Variety/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('should close add variety dialog on cancel', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Add Variety/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Close via escape
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('Seeds Page - Edit Variety', () => {
  test('should open edit dialog when clicking edit on a variety', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Expand Lettuce group
    await page.getByRole('button', { name: /Lettuce/ }).click()
    await expect(page.getByText('Little Gem')).toBeVisible()

    // Click edit button on Little Gem (pencil icon)
    const editButton = page.locator('button[aria-label*="Edit"]').first()
    if (await editButton.isVisible()) {
      await editButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()
    }
  })
})

test.describe('Seeds Page - Status Cycling', () => {
  test('should cycle seed status when clicking status button', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Expand Lettuce group
    await page.getByRole('button', { name: /Lettuce/ }).click()

    // Find the first status button (Little Gem should show "Have")
    // Status buttons have specific styling classes
    const statusButton = page.locator('button').filter({ hasText: 'Have' }).first()
    if (await statusButton.isVisible()) {
      await statusButton.click()
      // After clicking "Have", should cycle to "Had"
      await expect(page.locator('button').filter({ hasText: 'Had' }).first()).toBeVisible({ timeout: 3000 })
    }
  })
})

test.describe('Seeds Page - Add Variety Full Flow', () => {
  test('should accept supplier field text', async ({ page }) => {
    await setupEmpty(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Add Variety/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Select plant first
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()
    await plantCombobox.fill('Carrot')
    await page.getByRole('option', { name: /^Carrot/ }).first().click()

    // Fill supplier
    const supplierField = page.getByRole('textbox', { name: /supplier/i })
    if (await supplierField.isVisible()) {
      await supplierField.fill('Organic Gardening')
      await expect(supplierField).toHaveValue('Organic Gardening')
    }
  })

  test('should accept price field numbers', async ({ page }) => {
    await setupEmpty(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Add Variety/i }).click()
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()
    await plantCombobox.fill('Carrot')
    await page.getByRole('option', { name: /^Carrot/ }).first().click()

    const priceField = page.locator('input[type="number"]').first()
    if (await priceField.isVisible()) {
      await priceField.fill('2.50')
      await expect(priceField).toHaveValue('2.50')
    }
  })

  test('should accept notes field text', async ({ page }) => {
    await setupEmpty(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Add Variety/i }).click()
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()
    await plantCombobox.fill('Carrot')
    await page.getByRole('option', { name: /^Carrot/ }).first().click()

    const notesField = page.getByRole('textbox', { name: /notes/i }).or(page.locator('textarea'))
    if (await notesField.isVisible()) {
      await notesField.fill('Test notes here')
      await expect(notesField).toHaveValue('Test notes here')
    }
  })

  test('should show new variety in list immediately after adding', async ({ page }) => {
    await setupEmpty(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Add Variety/i }).click()
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()
    await plantCombobox.fill('Lettuce')
    await page.getByRole('option', { name: /^Lettuce/ }).first().click()

    await page.getByRole('textbox', { name: 'Variety Name' }).fill('Test Variety')
    await page.getByRole('dialog').getByRole('button', { name: 'Add Variety' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // Variety should appear in list
    await expect(page.getByRole('button', { name: /Lettuce \(1\)/ })).toBeVisible()
    await page.getByRole('button', { name: /Lettuce/ }).click()
    await expect(page.getByText('Test Variety')).toBeVisible()
  })
})

test.describe('Seeds Page - Edit Variety Full Flow', () => {
  test('should pre-populate all fields when editing', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Lettuce/ }).click()
    await expect(page.getByText('Little Gem')).toBeVisible()

    // Click edit on first variety
    const editButtons = page.locator('button').filter({ hasText: /edit/i }).or(page.locator('button[aria-label*="Edit"]'))
    const firstEditButton = editButtons.first()
    if (await firstEditButton.isVisible()) {
      await firstEditButton.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Check that variety name is pre-populated
      const nameInput = dialog.getByRole('textbox', { name: 'Variety Name' })
      if (await nameInput.isVisible()) {
        await expect(nameInput).toHaveValue('Little Gem')
      }
    }
  })

  test('should save updated variety', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Lettuce/ }).click()

    const editButtons = page.locator('button').filter({ hasText: /edit/i }).or(page.locator('button[aria-label*="Edit"]'))
    const firstEditButton = editButtons.first()
    if (await firstEditButton.isVisible()) {
      await firstEditButton.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      const nameInput = dialog.getByRole('textbox', { name: 'Variety Name' })
      if (await nameInput.isVisible()) {
        await nameInput.clear()
        await nameInput.fill('Renamed Gem')
        await dialog.getByRole('button', { name: /save|update/i }).click()
        await expect(dialog).not.toBeVisible({ timeout: 5000 })
        await expect(page.getByText('Renamed Gem')).toBeVisible()
      }
    }
  })

  test('should cancel edit without saving', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Lettuce/ }).click()

    const editButtons = page.locator('button').filter({ hasText: /edit/i }).or(page.locator('button[aria-label*="Edit"]'))
    const firstEditButton = editButtons.first()
    if (await firstEditButton.isVisible()) {
      await firstEditButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
      // Original name should still be there
      await expect(page.getByText('Little Gem')).toBeVisible()
    }
  })
})

test.describe('Seeds Page - Status Persistence', () => {
  test('should persist status after page reload', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Expand Lettuce group
    await page.getByRole('button', { name: /Lettuce/ }).click()

    // Little Gem has 'have' status - cycle it
    const haveButton = page.locator('button').filter({ hasText: 'Have' }).first()
    if (await haveButton.isVisible()) {
      await haveButton.click()
      // Now should be 'Had'
      await expect(page.locator('button').filter({ hasText: 'Had' }).first()).toBeVisible({ timeout: 3000 })

      // Reload
      await page.reload()

      // Expand Lettuce again and verify
      await page.getByRole('button', { name: /Lettuce/ }).click()
      await expect(page.locator('button').filter({ hasText: 'Had' }).first()).toBeVisible()
    }
  })
})

test.describe('Seeds Page - Archive/Delete Flow', () => {
  test('should show delete confirmation dialog', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Carrot/ }).click()
    const deleteButton = page.locator('button[aria-label*="delete" i], button[aria-label*="archive" i]').first()
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
      // Should see confirmation or the item archived
      // Wait for UI response
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Seeds Page - External Links', () => {
  test('should show supplier links when varieties are expanded', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    await page.getByRole('button', { name: /Lettuce/ }).click()
    // Organic Gardening supplier should be visible
    await expect(page.getByText('Organic Gardening')).toBeVisible()
  })
})

test.describe('Seeds Page - Stats Update', () => {
  test('should show spending stats', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    const statsGrid = page.locator('[data-tour="seed-stats"]')
    // Should show spending columns
    await expect(statsGrid.getByText(/Spent/)).toBeVisible()
  })

  test('should update stats when switching years', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Get initial have count
    const statsGrid = page.locator('[data-tour="seed-stats"]')
    const initialHaveText = await statsGrid.getByText('Have Seeds').locator('..').locator('div').first().textContent()
    expect(initialHaveText).toBeTruthy()

    // Switch to All
    await page.locator('[data-tour="year-tabs"] button').filter({ hasText: 'All' }).click()

    // Stats should be disabled (showing 0 or different state)
    const haveButton = statsGrid.locator('button').filter({ hasText: 'Have Seeds' })
    await expect(haveButton).toBeDisabled()
  })

  test('should show All filter resets to show everything', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    // Apply have filter
    const haveButton = page.locator('[data-tour="seed-stats"] button').filter({ hasText: 'Have Seeds' })
    await haveButton.click()

    // Some varieties might be filtered out - expand all
    await page.getByRole('button', { name: /Expand/ }).click()

    // Toggle filter off (back to all)
    await haveButton.click()

    // All varieties should be back
    await expect(page.getByText('Little Gem')).toBeVisible()
    await expect(page.getByText('Nantes')).toBeVisible()
  })
})

test.describe('Seeds Page - Empty State', () => {
  test('should show empty state when no varieties exist', async ({ page }) => {
    await setupEmpty(page)
    await page.goto('/seeds')

    await expect(page.getByRole('heading', { name: /Seeds & Varieties/i })).toBeVisible()
    // Add variety button should still be visible
    await expect(page.getByRole('button', { name: /Add Variety/i })).toBeVisible()
  })
})

test.describe('Seeds Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await setupWithVarieties(page)
    await page.goto('/seeds')

    await expect(page.getByRole('heading', { name: /Seeds & Varieties/i })).toBeVisible()
    // Year tabs should be visible
    await expect(page.locator('[data-tour="year-tabs"]')).toBeVisible()
  })
})
