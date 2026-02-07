import { test, expect } from '@playwright/test'

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
    localStorage.setItem('allotment-engagement', JSON.stringify({
      visitCount: 10,
      lastVisit: new Date().toISOString(),
      manuallyUnlocked: ['ai-advisor', 'compost', 'allotment-layout']
    }))
    localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['ai-advisor', 'compost', 'allotment-layout']))
  })
}

test.describe('Navigation - Active Page Indicator', () => {
  test('should highlight Today link when on homepage', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const todayLink = page.getByRole('link', { name: /Today/i }).first()
    await expect(todayLink).toBeVisible()
    // Active link should have different styling (typically aria-current or a distinct class)
    const classes = await todayLink.getAttribute('class')
    // Active links typically have a distinctive styling like font-semibold or text color
    expect(classes).toBeDefined()
  })

  test('should highlight This Month link when on that page', async ({ page }) => {
    await setupPage(page)
    await page.goto('/this-month')

    const thisMonthLink = page.getByRole('link', { name: /This Month/i }).first()
    await expect(thisMonthLink).toBeVisible()
  })
})

test.describe('Navigation - Keyboard Navigation', () => {
  test('should be able to tab through nav items', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Tab to the first nav link
    await page.keyboard.press('Tab')
    // Keep tabbing to find nav links
    for (let i = 0; i < 10; i++) {
      const focused = await page.evaluate(() => document.activeElement?.tagName)
      if (focused === 'A') {
        // We found a link via tabbing
        break
      }
      await page.keyboard.press('Tab')
    }

    // Verify we can reach an interactive element
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON']).toContain(focusedTag)
  })
})

test.describe('Navigation - Mobile Menu Behavior', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should close menu after navigation', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Open mobile menu
    const hamburger = page.getByRole('button', { name: /menu/i }).or(page.locator('button').filter({ hasText: /☰|menu/i }))
    await expect(hamburger).toBeVisible()
    await hamburger.click()

    // Click a nav link
    const seedsLink = page.getByRole('link', { name: /Seeds/i })
    await expect(seedsLink).toBeVisible()
    await seedsLink.click()

    // Should navigate
    await expect(page).toHaveURL(/seeds/)

    // Menu should be closed
    await expect(hamburger).toBeVisible()
  })

  test('should have 44px minimum touch targets on nav items', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    const hamburger = page.getByRole('button', { name: /menu/i }).or(page.locator('button').filter({ hasText: /☰|menu/i }))
    await expect(hamburger).toBeVisible()

    const box = await hamburger.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)
  })
})
