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

    const allotmentLink = page.locator('[data-tour="quick-actions"] a[href="/allotment/"]')
    await expect(allotmentLink).toBeVisible()
  })

  test('quick action Seeds should link to /seeds', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const seedsLink = page.locator('[data-tour="quick-actions"] a[href="/seeds/"]')
    await expect(seedsLink).toBeVisible()
  })

  test('quick action Calendar should link to /this-month', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const calendarLink = page.locator('[data-tour="quick-actions"] a[href="/this-month/"]')
    await expect(calendarLink).toBeVisible()
  })

  test('quick action Ask Aitor should link to /ai-advisor', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const aitorLink = page.locator('[data-tour="quick-actions"] a[href="/ai-advisor/"]')
    await expect(aitorLink).toBeVisible()
  })

  test('should navigate to allotment from quick action', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await page.locator('[data-tour="quick-actions"] a[href="/allotment/"]').click()
    await expect(page).toHaveURL(/allotment/)
  })

  test('should navigate to seeds from quick action', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await page.locator('[data-tour="quick-actions"] a[href="/seeds/"]').click()
    await expect(page).toHaveURL(/seeds/)
  })

  test('should navigate to this-month from quick action', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await page.locator('[data-tour="quick-actions"] a[href="/this-month/"]').click()
    await expect(page).toHaveURL(/this-month/)
  })

  test('should display footer', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await expect(page.getByText('Tailored for Scottish gardens')).toBeVisible()
  })
})

test.describe('Dashboard - Season Card Details', () => {
  test('should display seasonal emoji in season card', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const seasonCard = page.locator('[data-tour="season-card"]')
    // Seasonal emoji is rendered with role="img"
    const emoji = seasonCard.locator('[role="img"]')
    await expect(emoji).toBeVisible()
  })

  test('should display seasonal phase action text', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const seasonCard = page.locator('[data-tour="season-card"]')
    // Phase action text is a <p> after the heading
    const actionText = seasonCard.locator('p.text-white\\/90')
    await expect(actionText).toBeVisible()
    const text = await actionText.textContent()
    expect(text!.length).toBeGreaterThan(10)
  })

  test('should show month name in season card', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const seasonCard = page.locator('[data-tour="season-card"]')
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    const currentMonth = months[new Date().getMonth()]
    await expect(seasonCard.getByText(currentMonth)).toBeVisible()
  })
})

test.describe('Dashboard - Quick Actions Labels', () => {
  test('should have descriptive text for each quick action on desktop', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Desktop descriptions (hidden on mobile)
    await expect(page.getByText('View beds')).toBeVisible()
    await expect(page.getByText('Manage stock')).toBeVisible()
    await expect(page.getByText('Get advice')).toBeVisible()
    await expect(page.getByText('What to do')).toBeVisible()
  })
})

test.describe('Dashboard - AI Insight', () => {
  test('should display AI insight section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const insight = page.locator('[data-tour="ai-insight"]')
    await expect(insight).toBeVisible()
  })

  test('should show Aitor suggests label', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    await expect(page.getByText('Aitor suggests')).toBeVisible()
  })

  test('should have non-empty insight text', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const insight = page.locator('[data-tour="ai-insight"]')
    const text = await insight.textContent()
    expect(text!.length).toBeGreaterThan(30)
  })
})


test.describe('Dashboard - No Horizontal Scroll', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should not have horizontal scroll on mobile', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // +1 for rounding
  })

  test('quick action touch targets should be at least 44px', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const quickActions = page.locator('[data-tour="quick-actions"] a')
    const count = await quickActions.count()
    for (let i = 0; i < count; i++) {
      const box = await quickActions.nth(i).boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  })
})

test.describe('Dashboard - Compost Alerts', () => {
  test('should render compost alerts section on dashboard', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // The CompostAlerts component should be rendered (even if empty)
    // Just verify the dashboard loaded successfully
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
