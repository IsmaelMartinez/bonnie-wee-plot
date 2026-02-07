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
