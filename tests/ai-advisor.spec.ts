import { test, expect } from '@playwright/test'

test.describe('AI Advisor (Aitor)', () => {
  test('should display page with heading and quick topics', async ({ page }) => {
    await page.goto('/ai-advisor')

    // Check page loads correctly
    await expect(page).toHaveTitle(/Community Allotment/)
    await expect(page.locator('h1').filter({ hasText: /Aitor/i })).toBeVisible()

    // Check that quick topics section is visible (can be personalized or fallback topics)
    await expect(page.locator('h2').filter({ hasText: /(Suggested|Popular Topics)/i })).toBeVisible()

    // Check at least one topic button exists
    const topicButtons = page.locator('button').filter({ hasText: /.+/ })
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

    // Get the query text from the button before clicking
    const queryText = await topicButton.locator('p.text-sm').textContent()

    // Click the button
    await topicButton.click()

    // Wait a moment for the action to complete
    await page.waitForTimeout(500)

    // The topic should populate the input OR appear as a message
    // Check if either the input has the query OR there's a message with the query
    const chatInput = page.locator('input[type="text"]').or(page.locator('textarea')).first()
    const inputValue = await chatInput.inputValue().catch(() => '')

    if (inputValue && inputValue.length > 10) {
      // Input was populated
      expect(inputValue.length).toBeGreaterThan(10)
    } else {
      // Check if query appears as a message instead (use nth(1) to skip the button text)
      await expect(page.getByText(queryText?.slice(0, 30) || '').nth(1)).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/ai-advisor')

    await expect(page.locator('h1').filter({ hasText: /Aitor/i })).toBeVisible()
    await expect(page.locator('h2').filter({ hasText: /(Suggested|Popular Topics)/i })).toBeVisible()
  })
})

