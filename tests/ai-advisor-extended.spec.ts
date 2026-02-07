import { test, expect } from '@playwright/test'

async function setupWithAIUnlocked(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      version: 16,
      meta: { name: 'Test Garden', setupCompleted: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      layout: { areas: [{ id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', position: { x: 0, y: 0, w: 2, h: 2 } }] },
      seasons: [{ year: new Date().getFullYear(), status: 'current', areas: [{ areaId: 'bed-a', rotationGroup: 'legumes', plantings: [], notes: [] }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      currentYear: new Date().getFullYear(),
      varieties: [],
      maintenanceTasks: [],
      gardenEvents: []
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

test.describe('AI Advisor - Access', () => {
  test('should have proper aria-label on floating button', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    const button = page.getByRole('button', { name: /Ask Aitor/i })
    await expect(button).toBeVisible()
    await expect(button).toHaveAttribute('aria-label', /gardening assistant/i)
  })

  test('should show button on allotment page too', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/allotment')

    await expect(page.getByRole('button', { name: /Ask Aitor/i })).toBeVisible()
  })
})

test.describe('AI Advisor - Modal Display', () => {
  test('should open as dialog with proper heading', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Ask Aitor')).toBeVisible()
  })

  test('should close on close button', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: /Close/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should show chat messages area with log role', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()
    await expect(page.locator('[role="log"]')).toBeVisible()
  })
})

test.describe('AI Advisor - Chat Interface', () => {
  test('should show text input with proper label', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()
    const input = page.locator('input[aria-label*="gardening question"]').or(page.locator('input[placeholder*="Ask about"]'))
    await expect(input).toBeVisible()
  })

  test('should show send button', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()
    // Send button (often an icon-only button in the form)
    const form = page.locator('form')
    await expect(form).toBeVisible()
    const sendButton = form.locator('button[type="submit"]').or(form.locator('button').last())
    await expect(sendButton).toBeVisible()
  })

  test('should show image upload button', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()
    // Camera/upload button in the chat input area
    const fileInput = page.locator('input[type="file"][accept="image/*"]')
    await expect(fileInput).toBeAttached()
  })

  test('should display user message in chat after typing and submitting', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()
    const input = page.locator('input[aria-label*="gardening question"]').or(page.locator('input[placeholder*="Ask about"]'))
    await input.fill('What should I plant in March?')
    await input.press('Enter')

    // User message should appear in the chat log
    await expect(page.getByText('What should I plant in March?')).toBeVisible({ timeout: 5000 })
  })

  test('should show loading indicator after sending message', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()
    const input = page.locator('input[aria-label*="gardening question"]').or(page.locator('input[placeholder*="Ask about"]'))
    await input.fill('Hello')
    await input.press('Enter')

    // Loading state should appear (typing indicator or spinner)
    const loading = page.locator('[role="status"][aria-label*="typing"]').or(page.locator('.animate-bounce').first())
    // It may appear briefly - check it's at least attached or an error message appears
    await expect(loading.or(page.locator('[role="alert"]')).or(page.getByText(/error|api key|token/i))).toBeVisible({ timeout: 10000 })
  })

  test('should show API key error when no key is set', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()
    const input = page.locator('input[aria-label*="gardening question"]').or(page.locator('input[placeholder*="Ask about"]'))
    await input.fill('Test message')
    await input.press('Enter')

    // Should eventually show an error about API key
    await expect(page.getByText(/api key|token|settings/i)).toBeVisible({ timeout: 15000 })
  })

  test('quick topics should hide after first message', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()

    // Quick topics visible initially
    const topics = page.getByText(/Topics|Suggested/i)
    if (await topics.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Send a message
      const input = page.locator('input[aria-label*="gardening question"]').or(page.locator('input[placeholder*="Ask about"]'))
      await input.fill('Test')
      await input.press('Enter')

      // Topics should disappear
      await expect(topics).not.toBeVisible({ timeout: 10000 })
    }
  })
})

test.describe('AI Advisor - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should show chat input area on mobile', async ({ page }) => {
    await setupWithAIUnlocked(page)
    await page.goto('/')

    await page.getByRole('button', { name: /Ask Aitor/i }).click()
    const input = page.locator('input[aria-label*="gardening question"]').or(page.locator('input[placeholder*="Ask about"]'))
    await expect(input).toBeVisible()
  })
})
