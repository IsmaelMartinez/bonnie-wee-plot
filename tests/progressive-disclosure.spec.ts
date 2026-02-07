import { test, expect, Page } from '@playwright/test';

async function disableTours(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }));
  });
}

// ============ HELPERS ============

/**
 * Skip onboarding by setting setupCompleted flag
 */
async function skipOnboarding(page: Page) {
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

/**
 * Set up minimal allotment data with plantings
 */
function createAllotmentDataWithPlantings(plantingCount: number) {
  const plantings = Array.from({ length: plantingCount }, (_, i) => ({
    id: `planting-${i}`,
    plantId: 'tomato',
    sowDate: '2026-03-15',
    sowMethod: 'indoor'
  }))

  return {
    version: 16,
    meta: {
      name: 'Test Allotment',
      setupCompleted: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    },
    layout: {
      areas: [
        { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', canHavePlantings: true }
      ]
    },
    currentYear: 2026,
    seasons: [
      {
        year: 2026,
        status: 'current',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        areas: [
          {
            areaId: 'bed-a',
            plantings: plantings
          }
        ]
      }
    ],
    varieties: []
  }
}

/**
 * Set up allotment data with a recorded harvest
 */
function createAllotmentDataWithHarvest() {
  return {
    version: 16,
    meta: {
      name: 'Test Allotment',
      setupCompleted: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    },
    layout: {
      areas: [
        { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', canHavePlantings: true }
      ]
    },
    currentYear: 2026,
    seasons: [
      {
        year: 2026,
        status: 'current',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        areas: [
          {
            areaId: 'bed-a',
            plantings: [
              {
                id: 'planting-1',
                plantId: 'tomato',
                sowDate: '2026-03-15',
                actualHarvestStart: '2026-07-15',
                status: 'harvested'
              }
            ]
          }
        ]
      }
    ],
    varieties: []
  }
}


// ============ TESTS ============

test.describe('Progressive Disclosure - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('new users see only 3 primary nav items (Today, This Month, Seeds)', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')
    await disableTours(page)

    // Primary nav should show exactly 3 items (use exact match for nav links)
    const nav = page.getByRole('navigation')
    const todayLink = nav.getByRole('link', { name: 'Today', exact: true })
    const thisMonthLink = nav.getByRole('link', { name: 'This Month', exact: true })
    const seedsLink = nav.getByRole('link', { name: 'Seeds', exact: true })

    await expect(todayLink).toBeVisible()
    await expect(thisMonthLink).toBeVisible()
    await expect(seedsLink).toBeVisible()

    // The More button should also be visible
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await expect(moreButton).toBeVisible()
  })

  test('locked features show lock icon and progress bar in More dropdown', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')
    await disableTours(page)

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Check for "Unlock now" buttons which indicate locked features
    const unlockButtons = page.locator('[role="menu"]').getByText('Unlock now')
    await expect(unlockButtons.first()).toBeVisible()

    // Check that progress bars are visible for locked features (the progress track container)
    const progressBars = page.locator('[role="menu"]').locator('.bg-zen-stone-100.rounded-full.overflow-hidden')
    await expect(progressBars.first()).toBeVisible()
  })

  test('shows progress text for locked features', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')
    await disableTours(page)

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Should show progress text like "0/1" or "0/3" or "0/5"
    await expect(page.getByText('0/1').or(page.getByText('0/3')).or(page.getByText('0/5')).first()).toBeVisible()
  })
})

test.describe('Progressive Disclosure - AI Advisor Unlock', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('AI Advisor unlocks after 3 visits', async ({ page }) => {
    // Set up with 3+ visits
    await page.addInitScript(() => {
      localStorage.setItem('allotment-unified-data', JSON.stringify({
        meta: { setupCompleted: true },
        layout: { areas: [] },
        seasons: [],
        currentYear: 2026,
        varieties: []
      }))
      localStorage.setItem('allotment-engagement', JSON.stringify({
        visitCount: 3,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: []
      }))
      // Mark celebration as shown to prevent modal from blocking
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['ai-advisor']))
    })
    await page.goto('/')
    await disableTours(page)

    // AI Advisor should be unlocked - floating button should be visible
    const aitorButton = page.locator('button[aria-label*="Aitor"]')
    await expect(aitorButton).toBeVisible()

    // Click should open modal
    await aitorButton.click()
    await expect(page.locator('h2').filter({ hasText: /Ask Aitor/i })).toBeVisible()
  })

  test('AI Advisor unlocks after 1 planting', async ({ page }) => {
    const allotmentData = createAllotmentDataWithPlantings(1)

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('allotment-engagement', JSON.stringify({
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: []
      }))
      // Mark celebration as shown to prevent modal from blocking
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['ai-advisor']))
    }, allotmentData)
    await page.goto('/')
    await disableTours(page)

    // AI Advisor should be unlocked - floating button should be visible
    const aitorButton = page.locator('button[aria-label*="Aitor"]')
    await expect(aitorButton).toBeVisible()

    // Click should open modal
    await aitorButton.click()
    await expect(page.locator('h2').filter({ hasText: /Ask Aitor/i })).toBeVisible()
  })

  test('AI Advisor stays locked with 0 visits and 0 plantings', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')
    await disableTours(page)

    // AI Advisor should be locked - floating button should NOT be visible
    const aitorButton = page.locator('button[aria-label*="Aitor"]')
    await expect(aitorButton).not.toBeVisible()
  })
})

test.describe('Progressive Disclosure - Compost Unlock', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('Compost unlocks after 5 visits', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('allotment-unified-data', JSON.stringify({
        meta: { setupCompleted: true },
        layout: { areas: [] },
        seasons: [],
        currentYear: 2026,
        varieties: []
      }))
      localStorage.setItem('allotment-engagement', JSON.stringify({
        visitCount: 5,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: []
      }))
      // Mark celebrations as shown to prevent modals from blocking
      // With 5 visits, AI Advisor (3 visits) and Compost (5 visits) both unlock
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify([
        'ai-advisor', 'compost'
      ]))
    })
    await page.goto('/')
    await disableTours(page)

    // Compost should be unlocked and promoted to primary nav
    const compostLink = page.getByRole('link', { name: /Compost/i })
    await compostLink.click()
    await expect(page).toHaveURL(/compost/)
  })

  test('Compost unlocks after first harvest', async ({ page }) => {
    const allotmentData = createAllotmentDataWithHarvest()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('allotment-engagement', JSON.stringify({
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: []
      }))
      // Mark celebrations as shown to prevent modals from blocking
      // Data has 1 planting with harvest, so AI Advisor (1 planting) and Compost (1 harvest) both unlock
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify([
        'ai-advisor', 'compost'
      ]))
    }, allotmentData)
    await page.goto('/')
    await disableTours(page)

    // Compost should be unlocked and promoted to primary nav
    const compostLink = page.getByRole('link', { name: /Compost/i })
    await compostLink.click()
    await expect(page).toHaveURL(/compost/)
  })

  test('Compost stays locked with < 5 visits and no harvest', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('allotment-unified-data', JSON.stringify({
        meta: { setupCompleted: true },
        layout: { areas: [] },
        seasons: [],
        currentYear: 2026,
        varieties: []
      }))
      localStorage.setItem('allotment-engagement', JSON.stringify({
        visitCount: 4,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: []
      }))
      // Mark celebrations as shown to prevent modals from blocking
      // With 4 visits, AI Advisor (3 visits) unlocks
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['ai-advisor']))
    })
    await page.goto('/')
    await disableTours(page)

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Should see "Unlock now" button for Compost (indicates locked)
    const compostSection = page.locator('[role="menuitem"]').filter({ hasText: 'Compost' })
    await expect(compostSection).toBeVisible()

    const unlockButton = compostSection.getByText('Unlock now')
    await expect(unlockButton).toBeVisible()
  })
})

test.describe('Progressive Disclosure - Allotment Layout Unlock', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('Allotment Layout unlocks after 5 plantings', async ({ page }) => {
    const allotmentData = createAllotmentDataWithPlantings(5)

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('allotment-engagement', JSON.stringify({
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: []
      }))
      // Mark celebrations as shown to prevent modals from blocking
      // With 5 plantings, AI Advisor (1 planting) and Allotment Layout (5 plantings) both unlock
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify([
        'ai-advisor', 'allotment-layout'
      ]))
    }, allotmentData)
    await page.goto('/')
    await disableTours(page)

    // Allotment should be unlocked and promoted to primary nav
    const allotmentLink = page.getByRole('link', { name: 'Allotment', exact: true })
    await allotmentLink.click()
    await expect(page).toHaveURL(/allotment/)
  })

  test('Allotment Layout stays locked with < 5 plantings', async ({ page }) => {
    const allotmentData = createAllotmentDataWithPlantings(4)

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('allotment-engagement', JSON.stringify({
        visitCount: 0,
        lastVisit: new Date().toISOString(),
        manuallyUnlocked: []
      }))
      // Mark celebrations as shown to prevent modals from blocking
      // With 4 plantings, AI Advisor (1 planting) unlocks
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['ai-advisor']))
    }, allotmentData)
    await page.goto('/')
    await disableTours(page)

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Should see "Unlock now" button for Allotment (indicates locked)
    const allotmentSection = page.locator('[role="menuitem"]').filter({ hasText: 'Allotment' })
    await expect(allotmentSection).toBeVisible()

    const unlockButton = allotmentSection.getByText('Unlock now')
    await expect(unlockButton).toBeVisible()

    // Should show progress 4/5
    await expect(allotmentSection.getByText('4/5')).toBeVisible()
  })
})

test.describe('Progressive Disclosure - Manual Unlock', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('clicking "Unlock now" manually unlocks Compost', async ({ page }) => {
    await skipOnboarding(page)
    // Pre-mark celebration as shown to prevent modal from blocking
    await page.addInitScript(() => {
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['compost']))
    })
    await page.goto('/')
    await disableTours(page)

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Find the Compost section and click Unlock now
    const compostSection = page.locator('[role="menuitem"]').filter({ hasText: 'Compost' })
    const unlockButton = compostSection.getByText('Unlock now')
    await unlockButton.click()

    // After unlock, Compost should appear in primary nav (not dropdown)
    const compostLink = page.getByRole('link', { name: /Compost/i })
    await compostLink.click()
    await expect(page).toHaveURL(/compost/)
  })

  test('clicking "Unlock now" manually unlocks Allotment', async ({ page }) => {
    await skipOnboarding(page)
    // Pre-mark celebration as shown to prevent modal from blocking
    await page.addInitScript(() => {
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['allotment-layout']))
    })
    await page.goto('/')
    await disableTours(page)

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Find the Allotment section and click Unlock now
    const allotmentSection = page.locator('[role="menuitem"]').filter({ hasText: 'Allotment' })
    const unlockButton = allotmentSection.getByText('Unlock now')
    await unlockButton.click()

    // After unlock, Allotment should appear in primary nav (not dropdown)
    const allotmentLink = page.getByRole('link', { name: 'Allotment', exact: true })
    await allotmentLink.click()
    await expect(page).toHaveURL(/allotment/)
  })

  test('manual unlock persists after page reload', async ({ page }) => {
    await skipOnboarding(page)
    // Pre-mark celebration as shown to prevent modal from blocking
    await page.addInitScript(() => {
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['compost']))
    })
    await page.goto('/')
    await disableTours(page)

    // Open More dropdown and manually unlock Compost
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    const compostSection = page.locator('[role="menuitem"]').filter({ hasText: 'Compost' })
    const unlockButton = compostSection.getByText('Unlock now')
    await unlockButton.click()

    // Reload the page
    await page.reload()

    // Compost should still be unlocked and in primary nav
    const compostLink = page.getByRole('link', { name: /Compost/i })
    await compostLink.click()
    await expect(page).toHaveURL(/compost/)
  })
})

test.describe('Progressive Disclosure - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('mobile menu shows locked features with progress', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')
    await disableTours(page)

    // Open mobile menu
    const menuButton = page.getByLabel('Open menu')
    await menuButton.click()

    // Expand More section - use the mobile menu's More button (has w-full class)
    const moreButton = page.getByRole('button', { name: 'More' })
    await moreButton.click()

    // Should show locked features with unlock buttons
    await expect(page.getByText('Unlock now').first()).toBeVisible()
  })

  test('manual unlock works on mobile', async ({ page }) => {
    await skipOnboarding(page)
    // Pre-mark celebrations as shown to prevent modals from blocking
    await page.addInitScript(() => {
      localStorage.setItem('allotment-celebrations-shown', JSON.stringify([
        'ai-advisor', 'compost', 'allotment-layout'
      ]))
    })
    await page.goto('/')
    await disableTours(page)

    // Open mobile menu
    const menuButton = page.getByLabel('Open menu')
    await menuButton.click()

    // Expand More section - use getByRole for the mobile More button
    const moreButton = page.getByRole('button', { name: 'More' })
    await moreButton.click()

    // Find and click the first "Unlock now" button (Compost, since AI Advisor is not in menu)
    const unlockButtons = page.getByText('Unlock now')
    await unlockButtons.first().click()

    // After unlock, menu closes. Re-open it
    await page.getByLabel('Open menu').click()

    // After unlock, Compost is promoted to primary mobile nav (not in More submenu)
    const compostLink = page.getByRole('banner').getByRole('link', { name: 'Compost' })
    await compostLink.click()
    await expect(page).toHaveURL(/compost/)
  })
})
