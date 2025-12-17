import { test, expect } from '@playwright/test'

test.describe('Growing Guides', () => {
  test('should load companion planting page with content', async ({ page }) => {
    await page.goto('/companion-planting')
    
    await expect(page).toHaveTitle(/Community Allotment/)
    await expect(page.locator('h1, h2').filter({ hasText: /companion planting/i }).first()).toBeVisible()
    await expect(page.getByText(/tomato/i).first()).toBeVisible()
    
    // Check for AI advisor link
    const aiLink = page.locator('a[href*="ai-advisor"]')
    await expect(aiLink.first()).toBeVisible()
  })

  test('should load composting page with content', async ({ page }) => {
    await page.goto('/composting')
    
    await expect(page).toHaveTitle(/Community Allotment/)
    await expect(page.locator('h1, h2').filter({ hasText: /composting/i }).first()).toBeVisible()
    
    // Check for composting content
    const pageContent = await page.content()
    expect(pageContent.toLowerCase()).toContain('compost')
    
    // Check for AI advisor link
    const aiLink = page.locator('a[href*="ai-advisor"]')
    await expect(aiLink.first()).toBeVisible()
  })

  test('should load crop rotation page with content', async ({ page }) => {
    await page.goto('/crop-rotation')
    
    await expect(page).toHaveTitle(/Community Allotment/)
    await expect(page.locator('h1, h2').filter({ hasText: /crop rotation/i }).first()).toBeVisible()
    
    // Check for rotation content
    const pageContent = await page.content()
    expect(pageContent.toLowerCase()).toMatch(/rotate|family|soil/)
    
    // Check for AI advisor link
    const aiLink = page.locator('a[href*="ai-advisor"]')
    await expect(aiLink.first()).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Test all three pages are mobile responsive
    await page.goto('/companion-planting')
    await expect(page.locator('h1, h2').filter({ hasText: /companion planting/i }).first()).toBeVisible()
    
    await page.goto('/composting')
    await expect(page.locator('h1, h2').filter({ hasText: /composting/i }).first()).toBeVisible()
    
    await page.goto('/crop-rotation')
    await expect(page.locator('h1, h2').filter({ hasText: /crop rotation/i }).first()).toBeVisible()
  })
})

