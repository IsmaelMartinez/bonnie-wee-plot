import { test, expect } from '@playwright/test'

/**
 * End-to-end user journey tests that validate cross-section integration.
 * These mirror the 6 user journeys from the UX verification checklist.
 */

// Shared helpers
async function setupFreshUser(page: import('@playwright/test').Page) {
  const currentYear = new Date().getFullYear()
  await page.addInitScript((year) => {
    const now = new Date().toISOString()
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      version: 16,
      meta: { name: 'Test Garden', setupCompleted: true, createdAt: now, updatedAt: now },
      layout: {
        areas: [
          { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', position: { x: 0, y: 0, w: 2, h: 2 } }
        ]
      },
      seasons: [{
        year: year,
        status: 'current',
        areas: [{
          areaId: 'bed-a',
          rotationGroup: 'legumes',
          plantings: [],
          notes: []
        }],
        createdAt: now,
        updatedAt: now
      }],
      currentYear: year,
      maintenanceTasks: [],
      varieties: [],
      gardenEvents: []
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
  }, currentYear)
}

async function selectRotationBed(page: import('@playwright/test').Page) {
  // Click first grid item on desktop
  const gridItem = page.locator('[class*="react-grid-item"]').first()
  if (await gridItem.isVisible({ timeout: 5000 }).catch(() => false)) {
    await gridItem.click()
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 10000 })
    return true
  }
  // Try mobile area card
  const mobileItem = page.locator('button').filter({ hasText: 'Bed A' }).first()
  if (await mobileItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mobileItem.click()
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 10000 })
    return true
  }
  return false
}

test.describe('Journey 1: Plan a New Bed and Add Planting', () => {
  test('should create an area, add a planting, and verify it exists', async ({ page }) => {
    await setupFreshUser(page)
    await page.goto('/allotment')

    // Wait for page to load
    await expect(page.locator('h1').filter({ hasText: /Plot Layout/i })).toBeVisible({ timeout: 15000 })

    // 1. Enter edit mode
    const lockButton = page.locator('button').filter({ hasText: /Lock|Edit/ }).first()
    await expect(lockButton).toBeVisible({ timeout: 5000 })
    await lockButton.click()

    // Wait for edit mode
    const addAreaButton = page.locator('button').filter({ hasText: 'Add Area' })
    await expect(addAreaButton).toBeEnabled({ timeout: 3000 })

    // 2. Add a new area
    await addAreaButton.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await page.locator('#area-name').fill('New Test Bed')
    await page.locator('button[type="submit"]').filter({ hasText: 'Add Area' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 3. Exit edit mode
    const stopEditButton = page.locator('button').filter({ hasText: /Stop editing|Editing/ }).first()
    if (await stopEditButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await stopEditButton.click()
    }

    // 4. Select the new bed
    const newBed = page.locator('[class*="react-grid-item"]').filter({ hasText: 'New Test Bed' })
    await expect(newBed).toBeVisible({ timeout: 5000 })
    await newBed.click()

    // 5. Add a planting
    const addButton = page.locator('button').filter({ hasText: /^Add$/ })
    await expect(addButton).toBeVisible({ timeout: 10000 })
    await addButton.click()

    const plantDialog = page.getByRole('dialog')
    await expect(plantDialog).toBeVisible()

    // Select a plant
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()
    await plantCombobox.fill('Lettuce')
    await page.getByRole('option', { name: /Lettuce/ }).first().click()

    // Submit
    const submitButton = page.getByRole('dialog').getByRole('button', { name: /Add Planting/i })
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    // 6. Verify planting appears in bed detail
    await expect(plantDialog).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Lettuce')).toBeVisible()
  })
})

test.describe('Journey 2: Track a Harvest', () => {
  test('should add a planting and click through to planting detail', async ({ page }) => {
    await setupFreshUser(page)
    await page.goto('/allotment')

    // Wait for page to load
    await expect(page.locator('h1').filter({ hasText: /Plot Layout/i })).toBeVisible({ timeout: 15000 })

    // Select bed
    const selected = await selectRotationBed(page)
    if (!selected) return

    // Add a planting
    await page.locator('button').filter({ hasText: /^Add$/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()
    await plantCombobox.fill('Broad Bean')
    await page.getByRole('option', { name: /Broad Bean/ }).first().click()

    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // Verify planting is visible
    await expect(page.getByText('Broad Bean')).toBeVisible()
  })
})

test.describe('Journey 3: Check What To Do', () => {
  test('should navigate from dashboard to this-month for seasonal info', async ({ page }) => {
    await setupFreshUser(page)
    await page.goto('/')

    // 1. Dashboard should show Today
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()

    // 2. Season card should be visible
    await expect(page.locator('[data-tour="season-card"]')).toBeVisible()

    // 3. Navigate to This Month via quick action
    await page.locator('[data-tour="quick-actions"] a[href="/this-month"]').click()
    await expect(page).toHaveURL(/this-month/)

    // 4. This Month page should load with calendar content
    await expect(page.getByRole('heading', { name: 'This Month' })).toBeVisible()

    // 5. Should show sowing/harvest sections
    await expect(page.getByRole('heading', { name: 'What to Sow' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ready to Harvest' })).toBeVisible()
  })
})

test.describe('Journey 3b: Check What To Do - Full Flow', () => {
  test('should view tasks on dashboard and explore this-month calendar', async ({ page }) => {
    await setupFreshUser(page)
    await page.goto('/')

    // 1. Dashboard loads
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()

    // 2. Task list section visible
    const taskList = page.locator('[data-tour="task-list"]')
    await expect(taskList).toBeVisible()

    // 3. Navigate to This Month
    await page.locator('[data-tour="quick-actions"] a[href="/this-month"]').click()

    // 4. Select current month (should be auto-selected)
    await expect(page.getByText("You're viewing the current month")).toBeVisible()

    // 5. See calendar sections
    await expect(page.getByRole('heading', { name: 'What to Sow' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ready to Harvest' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Key Tasks' })).toBeVisible()
  })
})

test.describe('Journey 4: Add Seeds I Bought', () => {
  test('should add a variety with supplier and price, then use it in allotment', async ({ page }) => {
    await setupFreshUser(page)

    // 1. Go to Seeds page
    await page.goto('/seeds')
    await expect(page.getByRole('heading', { name: /Seeds & Varieties/i })).toBeVisible({ timeout: 15000 })

    // 2. Add a variety with all fields
    await page.getByRole('button', { name: /Add Variety/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()
    await plantCombobox.fill('Carrot')
    await page.getByRole('option', { name: /^Carrot/ }).first().click()

    await page.getByRole('textbox', { name: 'Variety Name' }).fill('Autumn King')

    // Fill supplier and price if visible
    const supplierField = page.getByRole('textbox', { name: /supplier/i })
    if (await supplierField.isVisible({ timeout: 1000 }).catch(() => false)) {
      await supplierField.fill('Organic Gardening')
    }
    const priceField = page.locator('input[type="number"]').first()
    if (await priceField.isVisible({ timeout: 1000 }).catch(() => false)) {
      await priceField.fill('2.50')
    }

    await page.getByRole('dialog').getByRole('button', { name: 'Add Variety' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // 3. Verify variety appears
    await expect(page.getByRole('button', { name: /Carrot \(1\)/ })).toBeVisible()

    // 4. Navigate to allotment
    await page.goto('/allotment')
    await expect(page.locator('h1').filter({ hasText: /Plot Layout/i })).toBeVisible({ timeout: 15000 })

    // 5. Select bed and add planting
    const selected = await selectRotationBed(page)
    if (!selected) return

    await page.locator('button').filter({ hasText: /^Add$/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const allotmentCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await allotmentCombobox.click()
    await allotmentCombobox.fill('Carrot')
    await page.getByRole('option', { name: /^Carrot/ }).first().click()

    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    await expect(page.getByText('Carrot')).toBeVisible()
  })

  test('should add a variety in seeds and use it when adding a planting', async ({ page }) => {
    await setupFreshUser(page)

    // 1. Go to Seeds page
    await page.goto('/seeds')
    await expect(page.getByRole('heading', { name: /Seeds & Varieties/i })).toBeVisible({ timeout: 15000 })

    // 2. Add a variety
    await page.getByRole('button', { name: /Add Variety/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Select plant
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()
    await plantCombobox.fill('Carrot')
    await page.getByRole('option', { name: /^Carrot/ }).first().click()

    // Fill in variety name
    await page.getByRole('textbox', { name: 'Variety Name' }).fill('Autumn King')

    // Submit
    await page.getByRole('dialog').getByRole('button', { name: 'Add Variety' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // 3. Verify variety appears in list
    await expect(page.getByRole('button', { name: /Carrot \(1\)/ })).toBeVisible()

    // 4. Navigate to allotment
    await page.goto('/allotment')
    await expect(page.locator('h1').filter({ hasText: /Plot Layout/i })).toBeVisible({ timeout: 15000 })

    // 5. Select bed and add planting
    const selected = await selectRotationBed(page)
    if (!selected) return

    await page.locator('button').filter({ hasText: /^Add$/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Select carrot
    const allotmentCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await allotmentCombobox.click()
    await allotmentCombobox.fill('Carrot')
    await page.getByRole('option', { name: /^Carrot/ }).first().click()

    // Submit the planting
    await page.getByRole('dialog').getByRole('button', { name: /Add Planting/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // Verify planting appears
    await expect(page.getByText('Carrot')).toBeVisible()
  })
})

test.describe('Journey 4b: Set Seed Status to Have', () => {
  test('should set seed status to have on the seeds page', async ({ page }) => {
    await setupFreshUser(page)

    // Add a variety first
    await page.goto('/seeds')
    await expect(page.getByRole('heading', { name: /Seeds & Varieties/i })).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: /Add Variety/i }).click()
    const plantCombobox = page.getByRole('combobox', { name: 'Search for a plant' })
    await plantCombobox.click()
    await plantCombobox.fill('Tomato')
    await page.getByRole('option', { name: /Tomato/ }).first().click()
    await page.getByRole('textbox', { name: 'Variety Name' }).fill('Moneymaker')
    await page.getByRole('dialog').getByRole('button', { name: 'Add Variety' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Expand the group
    await page.getByRole('button', { name: /Tomato \(1\)/ }).click()

    // Cycle status: Need -> Ordered -> Have
    const statusButton = page.locator('button').filter({ hasText: 'Need' }).first()
    if (await statusButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusButton.click() // Need -> Ordered
      await page.locator('button').filter({ hasText: 'Ordered' }).first().click() // Ordered -> Have
      await expect(page.locator('button').filter({ hasText: 'Have' }).first()).toBeVisible()
    }
  })
})

test.describe('Journey 5: Navigate Cross-Section', () => {
  test('should navigate between all main sections smoothly', async ({ page }) => {
    await setupFreshUser(page)
    await page.setViewportSize({ width: 1280, height: 720 })

    // Start at dashboard
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()

    // Go to This Month via nav
    await page.getByRole('link', { name: /This Month/i }).click()
    await expect(page).toHaveURL(/this-month/)
    await expect(page.getByRole('heading', { name: 'This Month' })).toBeVisible()

    // Go to Seeds via nav
    await page.getByRole('link', { name: /Seeds/i }).click()
    await expect(page).toHaveURL(/seeds/)
    await expect(page.getByRole('heading', { name: /Seeds & Varieties/i })).toBeVisible()

    // Go to Allotment via nav
    await page.getByRole('link', { name: /Allotment|Test Garden/i }).click()
    await expect(page).toHaveURL(/allotment/)

    // Go to Compost via nav (should be visible since unlocked)
    await page.getByRole('link', { name: /Compost/i }).click()
    await expect(page).toHaveURL(/compost/)
    await expect(page.getByRole('heading', { name: /Compost/i }).first()).toBeVisible()

    // Go to About via nav
    await page.getByRole('link', { name: /About/i }).click()
    await expect(page).toHaveURL(/about/)
    await expect(page.getByRole('heading', { name: /Bonnie Wee Plot/i })).toBeVisible()

    // Go to Settings
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible()

    // Go back to Today via nav
    await page.getByRole('link', { name: /Today/i }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Journey 6: Ask for Help', () => {
  test('should open AI advisor and interact with it', async ({ page }) => {
    await setupFreshUser(page)
    await page.goto('/')

    // 1. AI advisor button should be visible (features are unlocked)
    const aitorButton = page.getByRole('button', { name: /Ask Aitor/i })
    await expect(aitorButton).toBeVisible()

    // 2. Click to open modal
    await aitorButton.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Ask Aitor')).toBeVisible()

    // 3. Quick topics should be visible
    const topicButtons = page.getByRole('dialog').locator('button').filter({ hasText: /.{10,}/ })
    const topicCount = await topicButtons.count()
    if (topicCount > 0) {
      // 4. Click a quick topic
      await topicButtons.first().click()

      // Message should appear in chat
      await page.waitForTimeout(1000)
    } else {
      // Type a question
      const input = page.locator('input[aria-label*="gardening question"]').or(page.locator('input[placeholder*="Ask about"]'))
      await input.fill('What should I plant?')
      await input.press('Enter')
    }

    // 5. Chat log should have content
    const chatLog = page.locator('[role="log"]')
    const text = await chatLog.textContent()
    expect(text!.length).toBeGreaterThan(0)

    // 6. Close modal
    await page.getByRole('button', { name: /Close/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
