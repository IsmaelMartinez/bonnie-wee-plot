import { test, expect } from '@playwright/test'
import { clearYjsIdbOnFirstLoad } from './utils/storage'

// Clear any stale Yjs IndexedDB before the app first boots so the seeded
// localStorage below hydrates the Yjs doc instead of being shadowed by IDB
// left over from a prior test in the same worker.
test.beforeEach(async ({ page }) => {
  await clearYjsIdbOnFirstLoad(page)
})

// Seed onboarding-complete data with one loggable bed and a current season,
// so the /log bed picker and save path have something to work with.
async function seedBed(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const now = new Date().toISOString()
    const currentYear = new Date().getFullYear()
    localStorage.setItem(
      'allotment-unified-data',
      JSON.stringify({
        version: 18,
        meta: { name: 'My Allotment', setupCompleted: true, createdAt: now, updatedAt: now },
        layout: {
          areas: [
            { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', canHavePlantings: true },
          ],
        },
        seasons: [
          { year: currentYear, status: 'current', areas: [], createdAt: now, updatedAt: now },
        ],
        currentYear,
        maintenanceTasks: [],
        gardenEvents: [],
        varieties: [],
      })
    )
    localStorage.setItem(
      'bonnie-wee-plot-tours',
      JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} })
    )
  })
}

test.describe('Quick Log capture', () => {
  test('renders and logs an observation against a bed', async ({ page }) => {
    await seedBed(page)
    await page.goto('/log')

    // Page renders.
    await expect(page.getByRole('heading', { name: /Quick Log/i })).toBeVisible()

    // Step 1 — pick the seeded bed.
    await page.getByRole('button', { name: /Bed A/ }).click()

    // Step 2 — pick an event (the free-form Note maps to an observation).
    await page.getByRole('button', { name: 'Note', exact: true }).click()

    // Step 3 — save. Everything past bed + event is optional.
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    // Confirmation flash names the event and the bed.
    await expect(page.getByRole('status')).toContainText(/logged in Bed A/i)
  })

  test('shows the setup prompt when there are no beds', async ({ page }) => {
    // No seed — a brand-new plot has no loggable beds yet.
    await page.goto('/log')
    await expect(page.getByRole('heading', { name: /Quick Log/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /set up my allotment/i })).toBeVisible()
  })
})
