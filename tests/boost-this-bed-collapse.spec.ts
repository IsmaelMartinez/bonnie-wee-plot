import { test, expect } from '@playwright/test'
import { clearAllStorage } from './utils/storage'

// Seeds a rotation bed containing a single Carrot planting. Carrot has
// `enhancedCompanions` in the bundled vegetable database, so the
// "Boost this bed" section will produce at least one suggestion.
async function seedBedWithCarrot(page: import('@playwright/test').Page) {
  // Clear Yjs IDB before seeding so the Yjs path hydrates from the
  // seeded legacy localStorage instead of stale IDB state from a
  // prior test in the same worker.
  await clearAllStorage(page)
  await page.evaluate(() => {
    const now = new Date().toISOString()
    const currentYear = new Date().getFullYear()
    const testData = {
      version: 18,
      meta: {
        name: 'My Allotment',
        location: 'Edinburgh, Scotland',
        createdAt: now,
        updatedAt: now,
      },
      layout: {
        areas: [
          {
            id: 'test-bed-a',
            name: 'Test Bed A',
            kind: 'rotation-bed',
            position: { x: 0, y: 0, w: 2, h: 2 },
          },
        ],
      },
      seasons: [
        {
          year: currentYear,
          status: 'current',
          areas: [
            {
              areaId: 'test-bed-a',
              rotationGroup: 'roots',
              plantings: [
                {
                  id: 'planting-carrot-1',
                  plantId: 'carrot',
                  status: 'planned',
                },
              ],
              notes: [],
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ],
      currentYear,
      maintenanceTasks: [],
      varieties: [],
      gardenEvents: [],
    }
    localStorage.setItem('allotment-unified-data', JSON.stringify(testData))
    localStorage.setItem(
      'bonnie-wee-plot-tours',
      JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} })
    )
  })
  await page.reload()
  await page.waitForLoadState('domcontentloaded')
  await page.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {})
  await page.locator('h1').filter({ hasText: /Plot Layout/i }).waitFor({ state: 'visible', timeout: 30000 })
}

async function openTestBed(page: import('@playwright/test').Page) {
  const gridItem = page.locator('[class*="react-grid-item"]').filter({ hasText: 'Test Bed A' }).first()
  const mobileItem = page.getByRole('button').filter({ hasText: 'Test Bed A' }).first()
  const target = (await gridItem.isVisible({ timeout: 5000 }).catch(() => false))
    ? gridItem
    : mobileItem
  await expect(target).toBeVisible({ timeout: 10000 })
  await target.click()
}

test.describe('Boost this bed — collapsible', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await seedBedWithCarrot(page)
  })

  test('is collapsed by default and can be expanded and re-collapsed', async ({ page }) => {
    await openTestBed(page)

    // The toggle is rendered with the section title and chevron.
    const toggle = page.getByRole('button', { name: /Boost this bed/i }).first()
    await expect(toggle).toBeVisible({ timeout: 10000 })

    // Default state: collapsed.
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    // Suggestion list is not in the DOM while collapsed.
    const controlsId = await toggle.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    const list = page.locator(`#${controlsId}`)
    await expect(list).toHaveCount(0)

    // Expand: aria-expanded flips and the list appears.
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(list).toBeVisible()
    // At least one suggestion item is rendered.
    await expect(list.locator('li').first()).toBeVisible()

    // Collapse again: list goes away.
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(list).toHaveCount(0)
  })
})
