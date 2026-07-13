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
        // Seed the current schema version so this /log smoke test doesn't run
        // migrations (the v23 additions are optional). Keep in step with
        // CURRENT_SCHEMA_VERSION in src/types/unified-allotment.ts.
        version: 23,
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
    // useTour only reads { completed, dismissed }; seed exactly that shape so
    // the intent is clear and matches production. (/log has no tour anyway.)
    localStorage.setItem(
      'bonnie-wee-plot-tours',
      JSON.stringify({ completed: [], dismissed: [] })
    )
  })
}

test.describe('Quick Log capture', () => {
  test('renders and logs an observation against a bed', async ({ page }) => {
    await seedBed(page)
    await page.goto('/log')

    // Page renders.
    await expect(page.getByRole('heading', { name: /Quick Log/i })).toBeVisible()

    const bed = page.getByRole('button', { name: /Bed A/ })
    const noteButton = page.getByRole('button', { name: 'Note', exact: true })
    const saveButton = page.getByRole('button', { name: 'Save', exact: true })
    const flash = page.getByRole('status')

    // Drive bed → event → save inside a single retry. The bed/event buttons are
    // server-rendered, so during the initial data-load window a tap can land
    // before React hydration wires up the handler (or the element re-renders and
    // detaches). Retrying the whole sequence tolerates that churn; re-runs just
    // re-tap the same bed/event (idempotent) and add another identical log until
    // the confirmation appears.
    await expect(async () => {
      await bed.click()
      await expect(noteButton).toBeVisible({ timeout: 1000 })
      await noteButton.click()
      await expect(saveButton).toBeVisible({ timeout: 1000 })
      await saveButton.click()
      await expect(flash).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 20000 })

    // Confirmation flash names the event and the bed.
    await expect(flash).toContainText(/logged in Bed A/i)
  })

  test('shows the setup prompt when there are no beds', async ({ page }) => {
    // No seed — a brand-new plot has no loggable beds yet.
    await page.goto('/log')
    await expect(page.getByRole('heading', { name: /Quick Log/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /set up my allotment/i })).toBeVisible()
  })
})
