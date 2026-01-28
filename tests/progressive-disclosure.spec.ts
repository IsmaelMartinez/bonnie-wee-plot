import { test, expect, Page } from '@playwright/test';

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

    // Primary nav should show exactly 3 items
    const todayLink = page.getByRole('link', { name: 'Today' })
    const thisMonthLink = page.getByRole('link', { name: 'This Month' })
    const seedsLink = page.getByRole('link', { name: 'Seeds' })

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

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Check for lock icons (locked features show Lock icon overlay)
    const lockIcons = page.locator('[role="menu"]').locator('svg').filter({ has: page.locator('path[d*="M16"]') })
    await expect(lockIcons.first()).toBeVisible()

    // Check that progress bars are visible for locked features
    const progressBars = page.locator('[role="menu"]').locator('.bg-zen-stone-100.rounded-full')
    await expect(progressBars.first()).toBeVisible()
  })

  test('shows progress text for locked features', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')

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
    })
    await page.goto('/')

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // AI Advisor should be unlocked (clickable link, not locked)
    const aiAdvisorLink = page.getByRole('menuitem', { name: /Ask Aitor/i })
    await expect(aiAdvisorLink).toBeVisible()

    // Click should navigate to AI Advisor
    await aiAdvisorLink.click()
    await expect(page).toHaveURL(/ai-advisor/)
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
    }, allotmentData)
    await page.goto('/')

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // AI Advisor should be unlocked
    const aiAdvisorLink = page.getByRole('menuitem', { name: /Ask Aitor/i })
    await aiAdvisorLink.click()
    await expect(page).toHaveURL(/ai-advisor/)
  })

  test('AI Advisor stays locked with 0 visits and 0 plantings', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Should see "Unlock now" button for AI Advisor (indicates locked)
    const askAitorSection = page.locator('[role="menuitem"]').filter({ hasText: 'Ask Aitor' })
    await expect(askAitorSection).toBeVisible()

    // Look for unlock button within that section
    const unlockButton = askAitorSection.getByText('Unlock now')
    await expect(unlockButton).toBeVisible()
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
    })
    await page.goto('/')

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Compost should be unlocked (clickable link)
    const compostLink = page.getByRole('menuitem', { name: /Compost/i })
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
    }, allotmentData)
    await page.goto('/')

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Compost should be unlocked
    const compostLink = page.getByRole('menuitem', { name: /Compost/i })
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
    })
    await page.goto('/')

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
    }, allotmentData)
    await page.goto('/')

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Allotment should be unlocked
    const allotmentLink = page.getByRole('menuitem', { name: /Allotment/i })
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
    }, allotmentData)
    await page.goto('/')

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

  test('clicking "Unlock now" manually unlocks AI Advisor', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Find the Ask Aitor section and click Unlock now
    const askAitorSection = page.locator('[role="menuitem"]').filter({ hasText: 'Ask Aitor' })
    const unlockButton = askAitorSection.getByText('Unlock now')
    await unlockButton.click()

    // Re-open More dropdown (it closes after unlock)
    await moreButton.click()

    // AI Advisor should now be unlocked (clickable link without unlock button)
    const aiAdvisorLink = page.getByRole('menuitem', { name: /Ask Aitor/i })
    await aiAdvisorLink.click()
    await expect(page).toHaveURL(/ai-advisor/)
  })

  test('clicking "Unlock now" manually unlocks Compost', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Find the Compost section and click Unlock now
    const compostSection = page.locator('[role="menuitem"]').filter({ hasText: 'Compost' })
    const unlockButton = compostSection.getByText('Unlock now')
    await unlockButton.click()

    // Re-open More dropdown
    await moreButton.click()

    // Compost should now be unlocked
    const compostLink = page.getByRole('menuitem', { name: /Compost/i })
    await compostLink.click()
    await expect(page).toHaveURL(/compost/)
  })

  test('clicking "Unlock now" manually unlocks Allotment', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')

    // Open More dropdown
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    // Find the Allotment section and click Unlock now
    const allotmentSection = page.locator('[role="menuitem"]').filter({ hasText: 'Allotment' })
    const unlockButton = allotmentSection.getByText('Unlock now')
    await unlockButton.click()

    // Re-open More dropdown
    await moreButton.click()

    // Allotment should now be unlocked
    const allotmentLink = page.getByRole('menuitem', { name: /Allotment/i })
    await allotmentLink.click()
    await expect(page).toHaveURL(/allotment/)
  })

  test('manual unlock persists after page reload', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')

    // Open More dropdown and manually unlock AI Advisor
    const moreButton = page.locator('header button').filter({ hasText: 'More' })
    await moreButton.click()

    const askAitorSection = page.locator('[role="menuitem"]').filter({ hasText: 'Ask Aitor' })
    const unlockButton = askAitorSection.getByText('Unlock now')
    await unlockButton.click()

    // Reload the page
    await page.reload()

    // Open More dropdown
    await moreButton.click()

    // AI Advisor should still be unlocked (no Unlock now button)
    const aiAdvisorLink = page.getByRole('menuitem', { name: /Ask Aitor/i })
    await aiAdvisorLink.click()
    await expect(page).toHaveURL(/ai-advisor/)
  })
})

test.describe('Progressive Disclosure - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('mobile menu shows locked features with progress', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')

    // Open mobile menu
    const menuButton = page.getByLabel('Open menu')
    await menuButton.click()

    // Expand More section
    const moreButton = page.locator('button').filter({ hasText: 'More' })
    await moreButton.click()

    // Should show locked features with unlock buttons
    await expect(page.getByText('Unlock now').first()).toBeVisible()
  })

  test('manual unlock works on mobile', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')

    // Open mobile menu
    const menuButton = page.getByLabel('Open menu')
    await menuButton.click()

    // Expand More section
    const moreButton = page.locator('button').filter({ hasText: 'More' })
    await moreButton.click()

    // Find and click the first "Unlock now" button (Ask Aitor)
    const unlockButtons = page.getByText('Unlock now')
    await unlockButtons.first().click()

    // After unlock, menu closes. Re-open it
    await page.getByLabel('Open menu').click()
    await page.locator('button').filter({ hasText: 'More' }).click()

    // Now Ask Aitor should be a clickable link
    const aiAdvisorLink = page.locator('a').filter({ hasText: 'Ask Aitor' })
    await aiAdvisorLink.click()
    await expect(page).toHaveURL(/ai-advisor/)
  })
})
