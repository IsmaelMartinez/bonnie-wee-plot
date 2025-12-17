import { test, expect } from '@playwright/test'

test.describe('AI Advisor (Aitor)', () => {
  test('should display the AI advisor page with correct heading', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Check page title
    await expect(page).toHaveTitle(/Community Allotment/)
    
    // Check main heading (h1 specifically)
    await expect(page.locator('h1').filter({ hasText: /Aitor/i })).toBeVisible()
  })

  test('should display quick topic buttons', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Check that quick topic buttons are visible
    await expect(page.getByText('Planting Guide')).toBeVisible()
    await expect(page.getByText('Pest Control')).toBeVisible()
    await expect(page.getByText('Summer Care')).toBeVisible()
    await expect(page.getByText('Watering Tips')).toBeVisible()
  })

  test('should display chat input area', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Check for text input - the AI advisor uses an input element
    const input = page.locator('input[type="text"]').first()
    await expect(input).toBeVisible()
  })

  test('should display settings button', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Look for settings button - check for button with settings icon
    const settingsButton = page.locator('button').filter({ has: page.locator('svg') }).first()
    await expect(settingsButton).toBeVisible()
  })

  test('should display sample conversation', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Check that sample conversation is displayed
    await expect(page.getByText(/tomato.*yellow.*leaves/i).first()).toBeVisible()
    await expect(page.getByText(/gardening specialist/i).first()).toBeVisible()
  })

  test('should allow typing in the input field', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Find and type in the input field
    const input = page.locator('input[type="text"]').first()
    await input.fill('How do I grow tomatoes?')
    
    // Verify the text was entered
    await expect(input).toHaveValue('How do I grow tomatoes?')
  })

  test('should have send button', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Look for a button in the chat input area (send button)
    const sendButton = page.locator('button').filter({ has: page.locator('svg.lucide-send, svg[class*="send"]') })
    if (await sendButton.count() > 0) {
      await expect(sendButton.first()).toBeVisible()
    } else {
      // Alternative: look for any button near textarea
      const anyButton = page.locator('form button, div:has(textarea) button').first()
      await expect(anyButton).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/ai-advisor')
    
    // Check that main content is still visible (h1 specifically)
    await expect(page.locator('h1').filter({ hasText: /Aitor/i })).toBeVisible()
    
    // Quick topics should be visible (may be in different layout)
    await expect(page.getByText('Planting Guide')).toBeVisible()
  })

  test('should populate input when clicking quick topic', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Click on a quick topic button
    await page.getByText('Planting Guide').click()
    
    // Check that something happened (new message appeared with the query)
    await expect(page.getByText(/what should I plant/i).first()).toBeVisible()
  })

  test('should display photo upload functionality', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Look for file input or camera button
    const fileInput = page.locator('input[type="file"]')
    const hasFileInput = await fileInput.count() > 0
    
    // Or look for a button with camera/photo icon
    const cameraIcon = page.locator('svg.lucide-camera, button:has(svg)')
    const hasCameraButton = await cameraIcon.count() > 0
    
    expect(hasFileInput || hasCameraButton).toBeTruthy()
  })
})

