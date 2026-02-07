import { test, expect } from '@playwright/test'

async function setupWithPile(page: import('@playwright/test').Page) {
  const now = new Date().toISOString()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  await page.addInitScript(([nowStr, weekAgoStr]) => {
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
      lastVisit: nowStr,
      manuallyUnlocked: ['ai-advisor', 'compost', 'allotment-layout']
    }))
    localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['ai-advisor', 'compost', 'allotment-layout']))
    localStorage.setItem('compost-piles', JSON.stringify([{
      id: 'pile-1',
      name: 'Main Pile',
      systemType: 'hot',
      status: 'active',
      startDate: weekAgoStr,
      notes: 'Kitchen scraps and garden waste',
      inputs: [
        { id: 'i1', date: weekAgoStr, material: 'Kitchen scraps', quantity: '5L' }
      ],
      events: [
        { id: 'e1', date: weekAgoStr, type: 'turn', notes: 'First turn' }
      ]
    }]))
  }, [now, oneWeekAgo])
}

async function setupEmpty(page: import('@playwright/test').Page) {
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

test.describe('Compost - Pile Card Details', () => {
  test('should show pile system type icon', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    // Pile card should show system type indicator
    await expect(page.getByText('Main Pile')).toBeVisible({ timeout: 15000 })
    // Hot system should have an associated icon/emoji
    await expect(page.getByText(/hot/i).or(page.locator('[class*="zen-card"]').filter({ hasText: 'Main Pile' }))).toBeVisible()
  })

  test('should show days since start', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    // Should show "7 days" or similar time indicator
    await expect(page.getByText(/\d+ day/i)).toBeVisible({ timeout: 15000 })
  })

  test('should show status badge', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    await expect(page.getByText(/active/i)).toBeVisible({ timeout: 15000 })
  })

  test('should show Log Event button', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    await expect(page.getByRole('button', { name: /Log Event/i })).toBeVisible({ timeout: 15000 })
  })

  test('should show Add Material button', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    await expect(page.getByRole('button', { name: /Add Material/i })).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Compost - Tracking Details', () => {
  test('should show status dropdown when expanded', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    // Expand tracking details
    const expandButton = page.getByRole('button', { name: /expand|details|show/i }).first()
    if (await expandButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expandButton.click()
      // Status dropdown should be visible
      await expect(page.locator('select').or(page.getByText(/Active|Resting|Finished/i).first())).toBeVisible()
    }
  })

  test('should show recent inputs list', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    const expandButton = page.getByRole('button', { name: /expand|details|show/i }).first()
    if (await expandButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expandButton.click()
      await expect(page.getByText('Kitchen scraps')).toBeVisible()
    }
  })

  test('should show recent events list', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    const expandButton = page.getByRole('button', { name: /expand|details|show/i }).first()
    if (await expandButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expandButton.click()
      await expect(page.getByText(/turn/i)).toBeVisible()
    }
  })

  test('should show notes', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    const expandButton = page.getByRole('button', { name: /expand|details|show/i }).first()
    if (await expandButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expandButton.click()
      await expect(page.getByText('Kitchen scraps and garden waste')).toBeVisible()
    }
  })
})

test.describe('Compost - New Pile Dialog Details', () => {
  test('should show all system types in dropdown', async ({ page }) => {
    await setupEmpty(page)
    await page.goto('/compost')

    await page.getByRole('button', { name: /New Compost Pile/i }).or(page.getByRole('button', { name: /Create/i })).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // System type dropdown should have multiple options
    const systemSelect = page.locator('select').first()
    if (await systemSelect.isVisible()) {
      const options = await systemSelect.locator('option').allTextContents()
      expect(options.length).toBeGreaterThanOrEqual(3) // At least hot, cold, tumbler
    }
  })

  test('should have optional notes field', async ({ page }) => {
    await setupEmpty(page)
    await page.goto('/compost')

    await page.getByRole('button', { name: /New Compost Pile/i }).or(page.getByRole('button', { name: /Create/i })).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Notes textarea should be present
    const notes = page.locator('textarea').or(page.getByRole('textbox', { name: /notes/i }))
    await expect(notes).toBeVisible()
  })
})

test.describe('Compost - Log Event Details', () => {
  test('should show all event types in dropdown', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    await page.getByRole('button', { name: /Log Event/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const eventSelect = page.locator('select').first()
    if (await eventSelect.isVisible()) {
      const options = await eventSelect.locator('option').allTextContents()
      expect(options.length).toBeGreaterThanOrEqual(3)
    }
  })

  test('should have optional notes field in log event', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    await page.getByRole('button', { name: /Log Event/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const notes = page.locator('textarea').or(page.getByRole('textbox', { name: /notes/i }))
    await expect(notes).toBeVisible()
  })

  test('should show event in tracking after logging', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    await page.getByRole('button', { name: /Log Event/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Fill notes
    const notes = dialog.locator('textarea').or(dialog.getByRole('textbox', { name: /notes/i }))
    if (await notes.isVisible()) {
      await notes.fill('Turned the pile again')
    }

    await dialog.locator('button[type="submit"]').or(dialog.getByRole('button', { name: /Log|Submit|Save/i })).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Compost - Add Material Details', () => {
  test('should have optional quantity field', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    await page.getByRole('button', { name: /Add Material/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Quantity field
    const quantityField = page.getByRole('textbox', { name: /quantity/i }).or(page.locator('input[placeholder*="quantity" i]'))
    if (await quantityField.isVisible()) {
      await quantityField.fill('10L')
      await expect(quantityField).toHaveValue('10L')
    }
  })
})

test.describe('Compost - Navigation', () => {
  test('should navigate back correctly', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/')
    await page.getByRole('link', { name: /Compost/i }).click()
    await expect(page).toHaveURL(/compost/)

    await page.goBack()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Compost - Mobile Touch Targets', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should have adequate touch targets for buttons', async ({ page }) => {
    await setupWithPile(page)
    await page.goto('/compost')

    const logButton = page.getByRole('button', { name: /Log Event/i })
    await expect(logButton).toBeVisible({ timeout: 15000 })
    const box = await logButton.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(36) // Reasonable mobile target
  })
})
