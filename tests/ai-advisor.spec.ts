import { test, expect } from '@playwright/test'

// Helper to set up test data with AI advisor unlocked
async function setupWithAiAdvisor(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    // Set up allotment data with setup completed to skip onboarding
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      meta: { setupCompleted: true },
      layout: { areas: [] },
      seasons: [],
      currentYear: new Date().getFullYear(),
      varieties: []
    }))
    // Unlock AI advisor feature
    localStorage.setItem('allotment-engagement', JSON.stringify({
      visitCount: 5,
      lastVisit: new Date().toISOString(),
      manuallyUnlocked: ['ai-advisor']
    }))
    // Mark all celebrations as shown to prevent modals
    localStorage.setItem('allotment-celebrations-shown', JSON.stringify(['ai-advisor', 'compost', 'allotment-layout']))
    // Disable tours to prevent overlays blocking interactions
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  })
}

test.describe('AI Advisor (Aitor)', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithAiAdvisor(page)
  })

  test('should open modal when clicking floating button', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click the floating Aitor button
    const aitorButton = page.locator('button[aria-label*="Aitor"]')
    await expect(aitorButton).toBeVisible()
    await aitorButton.click()

    // Check modal opens with correct title
    await expect(page.locator('h2').filter({ hasText: /Ask Aitor/i })).toBeVisible()
  })

  test('should have functional chat input in modal', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open the modal
    await page.locator('button[aria-label*="Aitor"]').click()
    await expect(page.locator('h2').filter({ hasText: /Ask Aitor/i })).toBeVisible()

    // Check for text input
    const input = page.locator('[role="dialog"] input[type="text"]').or(page.locator('[role="dialog"] textarea')).first()
    await expect(input).toBeVisible()

    // Type in the input field
    await input.fill('How do I grow tomatoes?')
    await expect(input).toHaveValue('How do I grow tomatoes?')
  })

  test('should display quick topics in modal', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open the modal
    await page.locator('button[aria-label*="Aitor"]').click()
    await expect(page.locator('h2').filter({ hasText: /Ask Aitor/i })).toBeVisible()

    // Check that quick topics are visible
    const topicButtons = page.locator('[role="dialog"] button.border-l-4')
    await expect(topicButtons.first()).toBeVisible()
  })

  test('should populate chat when clicking quick topic', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open the modal
    await page.locator('button[aria-label*="Aitor"]').click()
    await expect(page.locator('h2').filter({ hasText: /Ask Aitor/i })).toBeVisible()

    // Find the first topic button
    const topicButton = page.locator('[role="dialog"] button.border-l-4').first()
    await expect(topicButton).toBeVisible()

    // Get the query text from the button before clicking
    const queryText = await topicButton.locator('p').last().textContent()
    expect(queryText).toBeTruthy()

    // Click the button
    await topicButton.click()

    // Wait for the message to appear in the chat
    const chatLog = page.locator('[role="dialog"] [role="log"]')
    await expect(chatLog.getByText(queryText?.substring(0, 20) || '', { exact: false })).toBeVisible({ timeout: 5000 })
  })

  test('should close modal on close button', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open the modal
    await page.locator('button[aria-label*="Aitor"]').click()
    await expect(page.locator('h2').filter({ hasText: /Ask Aitor/i })).toBeVisible()

    // Close the modal
    await page.locator('[role="dialog"] button[aria-label="Close dialog"]').click()

    // Modal should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('should redirect from /ai-advisor and open modal', async ({ page }) => {
    // Go directly to the old URL
    await page.goto('/ai-advisor')

    // Should redirect to home
    await expect(page).toHaveURL('/')

    // Modal should be open
    await expect(page.locator('h2').filter({ hasText: /Ask Aitor/i })).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // On mobile, the floating button should still be visible (but may be smaller)
    const aitorButton = page.locator('button[aria-label*="Aitor"]')
    await expect(aitorButton).toBeVisible()

    // Open modal
    await aitorButton.click()
    await expect(page.locator('h2').filter({ hasText: /Ask Aitor/i })).toBeVisible()
  })
})

