import { test, expect } from '@playwright/test'

test.describe('Growing Guides', () => {
  test.describe('Companion Planting Page', () => {
    test('should display companion planting page with correct heading', async ({ page }) => {
      await page.goto('/companion-planting')
      
      await expect(page).toHaveTitle(/Community Allotment/)
      await expect(page.locator('h1, h2').filter({ hasText: /companion planting/i }).first()).toBeVisible()
    })

    test('should display companion planting information', async ({ page }) => {
      await page.goto('/companion-planting')
      
      // Check for plant companion information
      await expect(page.getByText(/tomato/i).first()).toBeVisible()
    })

    test('should display companion planting principles', async ({ page }) => {
      await page.goto('/companion-planting')
      
      // Check for principles or benefits section - more flexible matching
      const pageContent = await page.content()
      const hasPrinciples = pageContent.toLowerCase().includes('pest') || 
                           pageContent.toLowerCase().includes('benefit') || 
                           pageContent.toLowerCase().includes('together')
      expect(hasPrinciples).toBeTruthy()
    })

    test('should have link to AI advisor', async ({ page }) => {
      await page.goto('/companion-planting')
      
      // Check for any link to AI advisor
      const aiLink = page.locator('a[href*="ai-advisor"], a[href*="aitor"]').first()
      const linkExists = await aiLink.count() > 0
      
      // Or check for text that mentions Aitor/AI
      const hasAiText = await page.getByText(/aitor|ask.*question/i).count() > 0
      
      expect(linkExists || hasAiText).toBeTruthy()
    })

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/companion-planting')
      
      await expect(page.locator('h1, h2').filter({ hasText: /companion planting/i }).first()).toBeVisible()
    })
  })

  test.describe('Composting Page', () => {
    test('should display composting page with correct heading', async ({ page }) => {
      await page.goto('/composting')
      
      await expect(page).toHaveTitle(/Community Allotment/)
      await expect(page.locator('h1, h2').filter({ hasText: /composting/i }).first()).toBeVisible()
    })

    test('should display composting methods', async ({ page }) => {
      await page.goto('/composting')
      
      // Check for composting content
      const pageContent = await page.content()
      const hasMethodInfo = pageContent.toLowerCase().includes('compost') || 
                           pageContent.toLowerCase().includes('bin') || 
                           pageContent.toLowerCase().includes('pile')
      expect(hasMethodInfo).toBeTruthy()
    })

    test('should display what to compost information', async ({ page }) => {
      await page.goto('/composting')
      
      // Check for ingredient information
      const pageContent = await page.content()
      const hasIngredients = pageContent.toLowerCase().includes('green') || 
                            pageContent.toLowerCase().includes('brown') ||
                            pageContent.toLowerCase().includes('nitrogen')
      expect(hasIngredients).toBeTruthy()
    })

    test('should have link to AI advisor', async ({ page }) => {
      await page.goto('/composting')
      
      const aiLink = page.locator('a[href*="ai-advisor"], a[href*="aitor"]').first()
      const linkExists = await aiLink.count() > 0
      const hasAiText = await page.getByText(/aitor|ask.*question/i).count() > 0
      
      expect(linkExists || hasAiText).toBeTruthy()
    })

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/composting')
      
      await expect(page.locator('h1, h2').filter({ hasText: /composting/i }).first()).toBeVisible()
    })
  })

  test.describe('Crop Rotation Page', () => {
    test('should display crop rotation page with correct heading', async ({ page }) => {
      await page.goto('/crop-rotation')
      
      await expect(page).toHaveTitle(/Community Allotment/)
      await expect(page.locator('h1, h2').filter({ hasText: /crop rotation/i }).first()).toBeVisible()
    })

    test('should display crop rotation information', async ({ page }) => {
      await page.goto('/crop-rotation')
      
      // Check for rotation information
      const pageContent = await page.content()
      const hasRotationInfo = pageContent.toLowerCase().includes('rotate') || 
                             pageContent.toLowerCase().includes('family') ||
                             pageContent.toLowerCase().includes('soil')
      expect(hasRotationInfo).toBeTruthy()
    })

    test('should display plant family information', async ({ page }) => {
      await page.goto('/crop-rotation')
      
      // Check for plant families or groups
      const pageContent = await page.content()
      const hasFamilyInfo = pageContent.toLowerCase().includes('family') || 
                           pageContent.toLowerCase().includes('legume') ||
                           pageContent.toLowerCase().includes('brassica') ||
                           pageContent.toLowerCase().includes('root')
      expect(hasFamilyInfo).toBeTruthy()
    })

    test('should have link to AI advisor', async ({ page }) => {
      await page.goto('/crop-rotation')
      
      const aiLink = page.locator('a[href*="ai-advisor"], a[href*="aitor"]').first()
      const linkExists = await aiLink.count() > 0
      const hasAiText = await page.getByText(/aitor|ask.*question/i).count() > 0
      
      expect(linkExists || hasAiText).toBeTruthy()
    })

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/crop-rotation')
      
      await expect(page.locator('h1, h2').filter({ hasText: /crop rotation/i }).first()).toBeVisible()
    })
  })

  test.describe('Direct page access', () => {
    test('should load companion planting page directly', async ({ page }) => {
      await page.goto('/companion-planting')
      await expect(page).toHaveURL(/companion-planting/)
      await expect(page.locator('h1, h2').filter({ hasText: /companion planting/i }).first()).toBeVisible()
    })

    test('should load composting page directly', async ({ page }) => {
      await page.goto('/composting')
      await expect(page).toHaveURL(/composting/)
      await expect(page.locator('h1, h2').filter({ hasText: /composting/i }).first()).toBeVisible()
    })

    test('should load crop rotation page directly', async ({ page }) => {
      await page.goto('/crop-rotation')
      await expect(page).toHaveURL(/crop-rotation/)
      await expect(page.locator('h1, h2').filter({ hasText: /crop rotation/i }).first()).toBeVisible()
    })
  })
})

