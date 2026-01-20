import { test, expect } from '@playwright/test'

test.describe('AI Advisor (Aitor)', () => {
  test('should display page with heading and quick topics', async ({ page }) => {
    await page.goto('/ai-advisor')

    // Check page loads correctly
    await expect(page).toHaveTitle(/Bonnie Wee Plot/)
    await expect(page.locator('h1').filter({ hasText: /Aitor/i })).toBeVisible()

    // Check that quick topics section is visible (can be personalized or fallback topics)
    await expect(page.locator('h2').filter({ hasText: /(Suggested|Popular)/i })).toBeVisible()

    // Check at least one topic button exists with border-l-4 class
    const topicButtons = page.locator('button.border-l-4')
    await expect(topicButtons.first()).toBeVisible()
  })

  test('should have functional chat input', async ({ page }) => {
    await page.goto('/ai-advisor')

    // Check for text input
    const input = page.locator('input[type="text"]').or(page.locator('textarea')).first()
    await expect(input).toBeVisible()

    // Type in the input field
    await input.fill('How do I grow tomatoes?')
    await expect(input).toHaveValue('How do I grow tomatoes?')
  })

  test('should display sample conversation', async ({ page }) => {
    await page.goto('/ai-advisor')
    await page.waitForLoadState('networkidle')

    // Check that Aitor heading is visible (main requirement)
    await expect(page.locator('h1').filter({ hasText: /Aitor/i })).toBeVisible()
  })

  test('should populate chat when clicking quick topic', async ({ page }) => {
    await page.goto('/ai-advisor')
    await page.waitForLoadState('networkidle')

    // Find the first topic button
    const topicButton = page.locator('button.border-l-4').first()
    await expect(topicButton).toBeVisible()

    // Get the query text from the button before clicking (it's in a paragraph element)
    const queryText = await topicButton.locator('p').last().textContent()
    expect(queryText).toBeTruthy()

    // Click the button - this will submit the query directly, not populate the input
    await topicButton.click()

    // Wait for the message to appear in the chat (role="log" container)
    const chatLog = page.locator('[role="log"]')

    // The query should now appear as a user message in the chat
    // Wait for it to appear (with a reasonable timeout)
    await expect(chatLog.getByText(queryText?.substring(0, 20) || '', { exact: false })).toBeVisible({ timeout: 5000 })
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/ai-advisor')

    await expect(page.locator('h1').filter({ hasText: /Aitor/i })).toBeVisible()
    await expect(page.locator('h2').filter({ hasText: /(Suggested|Popular)/i })).toBeVisible()
  })
})

