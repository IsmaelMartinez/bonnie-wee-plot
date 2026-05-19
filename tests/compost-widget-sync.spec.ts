import { test, expect, Page } from '@playwright/test'
import { clearAllStorage } from './utils/storage'

async function disableTours(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem(
      'bonnie-wee-plot-tours',
      JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} })
    )
  })
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

async function createBackdatedPile(page: Page, name: string, startDateIso: string) {
  // Open dialog and create pile (start date defaults to today).
  await page.locator('button').filter({ hasText: 'New Compost Pile' }).click()
  await page.locator('#pile-name').fill(name)
  await page.getByRole('dialog').getByRole('button', { name: 'Create Pile' }).click()
  await expect(page.getByText(name)).toBeVisible()

  // Re-date the pile to the requested start date by clicking the "Started N days ago"
  // button to reveal the date input, then typing the new value.
  const pileCard = page.locator('.zen-card').filter({ hasText: name })
  await pileCard.getByRole('button', { name: /Started/ }).click()
  // The page commits the new date in the input's onChange handler and then
  // removes the input from the DOM, so don't try to blur it afterwards.
  await pileCard.locator('input[type="date"]').fill(startDateIso)
  await expect(pileCard.locator('input[type="date"]')).toHaveCount(0)
}

test.describe('Today widget compost sync', () => {
  test('reflects pile mutations when navigating between /compost and /', async ({ page }) => {
    // Start fresh on /compost.
    await page.goto('/compost')
    await clearAllStorage(page)
    await disableTours(page)
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Seed two piles, both back-dated past the 7-day threshold so the widget
    // should report 2 piles needing turning.
    const oldStart = isoDaysAgo(10)
    await createBackdatedPile(page, 'Bay 1', oldStart)
    await createBackdatedPile(page, 'Bay 2', oldStart)

    // Allow the debounced save (500ms) to flush before navigating.
    await page.waitForTimeout(700)

    // Navigate to Today and read the initial count.
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const compostCard = page.locator('[data-tour="compost-alerts"]')
    await expect(compostCard).toBeVisible()
    await expect(compostCard.getByText('2 piles need turning')).toBeVisible()

    // Go back to /compost and log a turn on Bay 1.
    await page.goto('/compost')
    await page.waitForLoadState('networkidle')
    const bay1 = page.locator('.zen-card').filter({ hasText: 'Bay 1' })
    await bay1.getByRole('button', { name: 'Log Event' }).click()
    // Default event type is 'turn'.
    await page.getByRole('dialog').getByRole('button', { name: 'Log Event' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Allow the debounced save to flush before navigating away.
    await page.waitForTimeout(700)

    // Back to Today: the widget should now report only 1 pile needing turning,
    // proving it re-derived from the latest pile state.
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(compostCard).toBeVisible()
    await expect(compostCard.getByText('Bay 2 needs turning')).toBeVisible()
    await expect(compostCard.getByText('2 piles need turning')).not.toBeVisible()
  })
})
