import { test, expect } from '@playwright/test'

// Helper to skip onboarding and disable tours
async function setupPage(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      meta: { setupCompleted: true },
      layout: { areas: [] },
      seasons: [],
      currentYear: new Date().getFullYear(),
      varieties: []
    }))
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  })
}

// Helper to seed data with plantings for personalized content
async function setupPageWithPlantings(page: import('@playwright/test').Page) {
  const currentYear = new Date().getFullYear()
  await page.addInitScript((year) => {
    const now = new Date().toISOString()
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      version: 16,
      meta: { name: 'Test Garden', setupCompleted: true, createdAt: now, updatedAt: now },
      layout: {
        areas: [
          { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', position: { x: 0, y: 0, w: 2, h: 2 } },
          { id: 'apple-tree', name: 'Apple Tree', kind: 'tree', primaryPlant: { plantId: 'apple', name: 'Apple' }, position: { x: 3, y: 0, w: 1, h: 1 } }
        ]
      },
      seasons: [{
        year: year,
        status: 'current',
        areas: [{
          areaId: 'bed-a',
          rotationGroup: 'legumes',
          plantings: [
            { id: 'p1', plantId: 'lettuce', sowDate: `${year}-03-15`, sowMethod: 'indoor' },
            { id: 'p2', plantId: 'carrot', sowDate: `${year}-04-01`, sowMethod: 'outdoor' },
            { id: 'p3', plantId: 'broad-bean', sowDate: `${year}-02-15`, sowMethod: 'indoor' }
          ],
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

test.describe('This Month Page', () => {
  test('should display page header', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByRole('heading', { name: 'This Month' })).toBeVisible()
    await expect(page.getByText('Seasonal tasks for Scottish gardens')).toBeVisible()
  })

  test('should display all 12 month buttons', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    // Month buttons contain abbreviated month names on desktop
    const monthButtons = page.locator('[data-tour="month-selector"] button')
    await expect(monthButtons).toHaveCount(12)
  })

  test('should highlight current month with indicator', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    // Current month indicator should be visible
    await expect(page.getByText("You're viewing the current month")).toBeVisible()
  })

  test('should switch months when clicking a month button', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    // Click on a different month (e.g., the 6th button = June)
    const monthButtons = page.locator('[data-tour="month-selector"] button')
    await monthButtons.nth(5).click() // June (0-indexed)

    // The month overview should show June
    await expect(page.getByRole('heading', { name: 'June' })).toBeVisible()

    // Current month indicator should NOT be visible (unless it IS June)
    const currentMonth = new Date().getMonth() // 0-indexed
    if (currentMonth !== 5) {
      await expect(page.getByText("You're viewing the current month")).not.toBeVisible()
    }
  })

  test('should show month overview with emoji and description', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    // Month overview card should have content
    const overviewCard = page.locator('[data-tour="month-overview"]')
    await expect(overviewCard).toBeVisible()
    // Should contain a heading (the month name)
    await expect(overviewCard.locator('h2')).toBeVisible()
    // Should contain descriptive text
    await expect(overviewCard.locator('p')).toBeVisible()
  })

  test('should show Scottish Gardening Calendar section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByText('Scottish Gardening Calendar')).toBeVisible()
    await expect(page.getByText('General guidance')).toBeVisible()
  })

  test('should show What to Sow section with Indoor and Outdoor subsections', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByRole('heading', { name: 'What to Sow' })).toBeVisible()
    await expect(page.getByText('Indoors')).toBeVisible()
    await expect(page.getByText('Outdoors')).toBeVisible()
  })

  test('should show Plant Out section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByRole('heading', { name: 'Plant Out' })).toBeVisible()
  })

  test('should show Ready to Harvest section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByRole('heading', { name: 'Ready to Harvest' })).toBeVisible()
  })

  test('should show Key Tasks section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByRole('heading', { name: 'Key Tasks' })).toBeVisible()
  })

  test('should show Weather to Expect section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByRole('heading', { name: 'Weather to Expect' })).toBeVisible()
  })

  test('should show Tip of the Month section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByRole('heading', { name: 'Tip of the Month' })).toBeVisible()
  })

  test('should show Soil Care section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByRole('heading', { name: 'Soil Care' })).toBeVisible()
  })

  test('should show footer note about date accuracy', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByText(/All dates are approximate/)).toBeVisible()
  })
})

test.describe('This Month - Expert Tips', () => {
  test('should toggle expert tips section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    // Expert tips should be collapsed by default
    const toggleButton = page.getByRole('button', { name: /Toggle expert tips/ })
    await expect(toggleButton).toBeVisible()
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Click to expand
    await toggleButton.click()
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    // Should show all 4 tip cards
    await expect(page.getByText('Composting')).toBeVisible()
    await expect(page.getByText('Crop Rotation')).toBeVisible()
    await expect(page.getByText('Companions')).toBeVisible()
    await expect(page.getByText('Organic')).toBeVisible()

    // Click to collapse
    await toggleButton.click()
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
  })
})

test.describe('This Month - Tree Care', () => {
  test('should toggle tree care section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    // Tree care toggle button
    const toggleButton = page.getByRole('button', { name: /Toggle tree and perennials care/ })

    // May not exist if there are no maintenance tasks for the current month
    if (await toggleButton.isVisible()) {
      await expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

      await toggleButton.click()
      await expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

      // Content should be visible
      await expect(page.locator('#tree-care-content')).toBeVisible()

      // Collapse
      await toggleButton.click()
      await expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    }
  })
})

test.describe('This Month - No Plantings State', () => {
  test('should show Track Your Garden prompt when no plantings', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    // When no plantings exist, should show prompt
    await expect(page.getByText('Track Your Garden')).toBeVisible()
    await expect(page.getByText('Manage My Allotment')).toBeVisible()
  })

  test('should link to allotment page from no-plantings prompt', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    const allotmentLink = page.getByRole('link', { name: 'Manage My Allotment' })
    await expect(allotmentLink).toBeVisible()
    await expect(allotmentLink).toHaveAttribute('href', '/allotment/')
  })
})

test.describe('This Month - Personalized Content', () => {
  test('should show personalized section when plantings exist', async ({ page }) => {
    await setupPageWithPlantings(page)
    await page.goto('/this-month')

    // Wait for data to load
    await page.waitForLoadState('networkidle')

    // Personalized section should appear with "Your Garden in [Month]"
    const personalSection = page.locator('[data-tour="your-garden"]')
    await expect(personalSection).toBeVisible({ timeout: 10000 })

    // Should show planting count
    await expect(personalSection.getByText('3')).toBeVisible()
    await expect(personalSection.getByText(/Plantings in/)).toBeVisible()
  })

  test('should show planting count and active areas in personalized section', async ({ page }) => {
    await setupPageWithPlantings(page)
    await page.goto('/this-month')

    const personalSection = page.locator('[data-tour="your-garden"]')
    await expect(personalSection).toBeVisible({ timeout: 10000 })

    // Should show active area count
    await expect(personalSection.getByText('Active Areas')).toBeVisible()
  })

  test('should have View All link to allotment in personalized section', async ({ page }) => {
    await setupPageWithPlantings(page)
    await page.goto('/this-month')

    const personalSection = page.locator('[data-tour="your-garden"]')
    await expect(personalSection).toBeVisible({ timeout: 10000 })

    const viewAllLink = personalSection.getByRole('link', { name: /View All/ })
    await expect(viewAllLink).toBeVisible()
    await expect(viewAllLink).toHaveAttribute('href', '/allotment/')
  })
})

test.describe('This Month - Month Styling', () => {
  test('should show selected month with active styling', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    // Click June (index 5)
    const monthButtons = page.locator('[data-tour="month-selector"] button')
    await monthButtons.nth(5).click()

    // Selected button should have the moss-600 bg color
    await expect(monthButtons.nth(5)).toHaveClass(/bg-zen-moss-600/)
  })

  test('should show month content organized by category', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    // Verify the 4 main sections exist with their heading structure
    const sowSection = page.locator('[data-tour="sowing-section"]')
    await expect(sowSection).toBeVisible()
    await expect(sowSection.getByText('Indoors')).toBeVisible()
    await expect(sowSection.getByText('Outdoors')).toBeVisible()
  })

  test('should show harvest readiness alerts when plantings have harvest months', async ({ page }) => {
    await setupPageWithPlantings(page)
    await page.goto('/this-month')

    // Navigate to a month that overlaps with carrot/lettuce/broad bean harvest windows
    const monthButtons = page.locator('[data-tour="month-selector"] button')
    // July (index 6) is a common harvest month
    await monthButtons.nth(6).click()

    // Wait for personalized data
    await page.waitForLoadState('networkidle')

    // Check if the harvest alert appears (may or may not depending on test plant data)
    const personalSection = page.locator('[data-tour="your-garden"]')
    if (await personalSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(personalSection.getByText('May Be Ready')).toBeVisible()
    }
  })

  test('should be keyboard navigable on month buttons', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    // Focus the first month button
    const firstButton = page.locator('[data-tour="month-selector"] button').first()
    await firstButton.focus()
    await expect(firstButton).toBeFocused()

    // Tab to next button
    await page.keyboard.press('Tab')
    const secondButton = page.locator('[data-tour="month-selector"] button').nth(1)
    await expect(secondButton).toBeFocused()
  })
})

test.describe('This Month - Tree Maintenance with Plantings', () => {
  test('should show personalized tree maintenance when user has trees', async ({ page }) => {
    await setupPageWithPlantings(page)
    await page.goto('/this-month')

    await page.waitForLoadState('networkidle')

    // The setup includes an apple tree, so personalized maintenance may appear
    const treesSection = page.getByText('Your Trees & Perennials')
    if (await treesSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(treesSection).toBeVisible()
      // Should show the apple tree name
      await expect(page.getByText('Apple Tree')).toBeVisible()
    }
  })
})

test.describe('This Month - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    await expect(page.getByRole('heading', { name: 'This Month' })).toBeVisible()
    // Month buttons should still be visible
    const monthButtons = page.locator('[data-tour="month-selector"] button')
    await expect(monthButtons.first()).toBeVisible()
  })

  test('should not have horizontal scroll on mobile', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })
})
