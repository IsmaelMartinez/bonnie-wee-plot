import { test, expect } from '@playwright/test'

test.describe('AI Advisor (Aitor)', () => {
  test('should display page with heading and quick topics', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Check page loads correctly
    await expect(page).toHaveTitle(/Community Allotment/)
    await expect(page.locator('h1').filter({ hasText: /Aitor/i })).toBeVisible()
    
    // Check quick topic buttons are visible
    await expect(page.getByText('Planting Guide')).toBeVisible()
    await expect(page.getByText('Pest Control')).toBeVisible()
  })

  test('should have functional chat input', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Check for text input
    const input = page.locator('input[type="text"]').first()
    await expect(input).toBeVisible()
    
    // Type in the input field
    await input.fill('How do I grow tomatoes?')
    await expect(input).toHaveValue('How do I grow tomatoes?')
  })

  test('should display sample conversation', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Check that sample conversation is displayed
    await expect(page.getByText(/tomato.*yellow.*leaves/i).first()).toBeVisible()
    await expect(page.getByText(/gardening specialist/i).first()).toBeVisible()
  })

  test('should populate chat when clicking quick topic', async ({ page }) => {
    await page.goto('/ai-advisor')
    
    // Click on a quick topic button
    await page.getByText('Planting Guide').click()
    
    // Check that the query appears as a message
    await expect(page.getByText(/what should I plant/i).first()).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/ai-advisor')
    
    await expect(page.locator('h1').filter({ hasText: /Aitor/i })).toBeVisible()
    await expect(page.getByText('Planting Guide')).toBeVisible()
  })
})

