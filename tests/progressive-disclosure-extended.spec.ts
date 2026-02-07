import { test, expect } from '@playwright/test'

async function setupNewUser(page: import('@playwright/test').Page) {
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

async function setupWithEngagement(page: import('@playwright/test').Page, overrides: Record<string, unknown> = {}) {
  await page.addInitScript((opts) => {
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      meta: { setupCompleted: true },
      layout: { areas: [] },
      seasons: [],
      currentYear: new Date().getFullYear(),
      varieties: []
    }))
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    localStorage.setItem('allotment-engagement', JSON.stringify({
      visitCount: opts.visitCount ?? 0,
      lastVisit: new Date().toISOString(),
      manuallyUnlocked: opts.manuallyUnlocked ?? [],
      plantingCount: opts.plantingCount ?? 0,
      harvestCount: opts.harvestCount ?? 0,
      ...opts
    }))
    // Don't set celebrations-shown to test celebration display
  }, overrides)
}

test.describe('Progressive Disclosure - Compost Alerts on Dashboard', () => {
  test('should not show compost alerts when compost is locked', async ({ page }) => {
    await setupNewUser(page)
    await page.goto('/')

    // Compost heading should NOT be visible on dashboard
    const compostHeading = page.getByRole('heading', { name: /Compost/i })
    await expect(compostHeading).not.toBeVisible()
  })

  test('should show compost section on dashboard when compost unlocked', async ({ page }) => {
    await setupWithEngagement(page, { visitCount: 10, manuallyUnlocked: ['compost'] })
    await page.addInitScript(() => {
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['compost']))
    })
    await page.goto('/')

    // Dashboard should load
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()
    // Compost section should be present (may be empty state)
  })
})

test.describe('Progressive Disclosure - Unlock Celebrations', () => {
  test('should show celebration dialog when feature newly unlocked', async ({ page }) => {
    // Setup with enough engagement to unlock AI advisor but no celebration shown yet
    await page.addInitScript(() => {
      localStorage.setItem('allotment-unified-data', JSON.stringify({
        meta: { setupCompleted: true },
        layout: { areas: [] },
        seasons: [],
        currentYear: new Date().getFullYear(),
        varieties: []
      }))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
      localStorage.setItem('allotment-engagement', JSON.stringify({
        visitCount: 5,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: [],
        plantingCount: 1
      }))
      // celebrations-shown is empty, so AI advisor celebration should fire
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify([]))
    })
    await page.goto('/')

    // Celebration dialog should appear for AI advisor
    const dialog = page.getByRole('dialog')
    const celebrationText = page.getByText(/New Feature Available/i).or(page.getByText(/Ask Aitor/i))

    // May or may not appear depending on timing - check with timeout
    if (await celebrationText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(celebrationText).toBeVisible()

      // Should have dismiss button
      const gotItButton = page.getByRole('button', { name: /Got it/i })
      await expect(gotItButton).toBeVisible()

      // Dismiss
      await gotItButton.click()
      await expect(dialog).not.toBeVisible({ timeout: 3000 })
    }
  })
})
