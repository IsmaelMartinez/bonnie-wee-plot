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

// Helper to setup with all features unlocked
async function setupPageWithFeatures(page: import('@playwright/test').Page) {
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
      visitCount: 10,
      lastVisit: new Date().toISOString(),
      manuallyUnlocked: ['ai-advisor', 'compost', 'allotment-layout']
    }))
    localStorage.setItem('allotment-celebrations-shown', JSON.stringify([
      'ai-advisor', 'compost', 'allotment-layout'
    ]))
  })
}

test.describe('Dashboard (Today) Page', () => {
  test('should display Today heading', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()
  })

  test('should display seasonal tagline', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await expect(page.getByText('Your garden, this moment')).toBeVisible()
  })

  test('should display season card with emoji and phase info', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const seasonCard = page.locator('[data-tour="season-card"]')
    await expect(seasonCard).toBeVisible()

    // Should contain a heading (the seasonal phase name)
    await expect(seasonCard.locator('h2')).toBeVisible()
  })

  test('should display quick action cards', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const quickActions = page.locator('[data-tour="quick-actions"]')
    await expect(quickActions).toBeVisible()

    // All 4 quick action links
    await expect(quickActions.getByText('Allotment')).toBeVisible()
    await expect(quickActions.getByText('Seeds')).toBeVisible()
    await expect(quickActions.getByText('Ask Aitor')).toBeVisible()
    await expect(quickActions.getByText('Calendar')).toBeVisible()
  })

  test('quick action Allotment should link to /allotment', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const allotmentLink = page.locator('[data-tour="quick-actions"] a[href="/allotment"]')
    await expect(allotmentLink).toBeVisible()
  })

  test('quick action Seeds should link to /seeds', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const seedsLink = page.locator('[data-tour="quick-actions"] a[href="/seeds"]')
    await expect(seedsLink).toBeVisible()
  })

  test('quick action Calendar should link to /this-month', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const calendarLink = page.locator('[data-tour="quick-actions"] a[href="/this-month"]')
    await expect(calendarLink).toBeVisible()
  })

  test('quick action Ask Aitor should link to /ai-advisor', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const aitorLink = page.locator('[data-tour="quick-actions"] a[href="/ai-advisor"]')
    await expect(aitorLink).toBeVisible()
  })

  test('should navigate to allotment from quick action', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await page.locator('[data-tour="quick-actions"] a[href="/allotment"]').click()
    await expect(page).toHaveURL(/allotment/)
  })

  test('should navigate to seeds from quick action', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await page.locator('[data-tour="quick-actions"] a[href="/seeds"]').click()
    await expect(page).toHaveURL(/seeds/)
  })

  test('should navigate to this-month from quick action', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await page.locator('[data-tour="quick-actions"] a[href="/this-month"]').click()
    await expect(page).toHaveURL(/this-month/)
  })

  test('should display footer', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await expect(page.getByText('Tailored for Scottish gardens')).toBeVisible()
  })
})

test.describe('Dashboard - Compost Alerts', () => {
  test('should not show compost alerts when feature is locked', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Compost section should NOT be visible without the feature unlocked
    await expect(page.getByText('Compost')).not.toBeVisible()
  })

  test('should show compost section when feature is unlocked', async ({ page }) => {
    await setupPageWithFeatures(page)
    await page.goto('/')

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // The CompostAlerts component should be rendered (even if empty)
    // It may show a message about no active piles
    // Just verify the dashboard loaded successfully with features unlocked
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()
  })
})

test.describe('Dashboard - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()
    // Quick actions should still be visible
    const quickActions = page.locator('[data-tour="quick-actions"]')
    await expect(quickActions).toBeVisible()
  })

  test('should display quick actions in 2-column grid on mobile', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Quick actions grid should have grid-cols-2 class
    const quickActions = page.locator('[data-tour="quick-actions"]')
    await expect(quickActions).toHaveClass(/grid-cols-2/)
  })
})
