import { test, expect } from '@playwright/test'

test.describe('Garden Planner', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/garden-planner')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should display garden planner page with default bed', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Check page loads with header
    await expect(page.locator('h1').filter({ hasText: /Garden/i })).toBeVisible()
    
    // Should show default bed tab (Bed 1)
    await expect(page.getByRole('button', { name: /Bed 1/i })).toBeVisible()
    
    // Should show Add Bed button
    await expect(page.getByRole('button', { name: /Add Bed/i })).toBeVisible()
  })

  test('should display grid with size controls', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Wait for grid to load
    await expect(page.getByText(/Rows:/i)).toBeVisible()
    await expect(page.getByText(/Cols:/i)).toBeVisible()
    
    // Size adjustment buttons should be visible
    const minusButtons = page.locator('button').filter({ has: page.locator('svg.lucide-minus') })
    const plusButtons = page.locator('button').filter({ has: page.locator('svg.lucide-plus') })
    
    expect(await minusButtons.count()).toBeGreaterThanOrEqual(2)
    expect(await plusButtons.count()).toBeGreaterThanOrEqual(2)
  })

  test('should add a new bed', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Click Add Bed
    await page.getByRole('button', { name: /Add Bed/i }).click()
    
    // Should now show Bed 2
    await expect(page.getByRole('button', { name: /Bed 2/i })).toBeVisible()
  })

  test('should switch between beds', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Add a second bed
    await page.getByRole('button', { name: /Add Bed/i }).click()
    await expect(page.getByRole('button', { name: /Bed 2/i })).toBeVisible()
    
    // Switch to Bed 1
    await page.getByRole('button', { name: /Bed 1/i }).click()
    
    // Bed 1 should be active (has different styling)
    const bed1Button = page.getByRole('button', { name: /Bed 1/i })
    await expect(bed1Button).toHaveClass(/bg-green-600/)
  })

  test('should display plant selection when clicking grid cell', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Click on a grid cell (they're buttons in the grid)
    const gridCell = page.locator('button').filter({ hasText: '' }).first()
    
    // Find and click an empty cell
    const emptyCells = page.locator('div[class*="grid"] button')
    const firstEmptyCell = emptyCells.first()
    
    if (await firstEmptyCell.isVisible()) {
      await firstEmptyCell.click()
      
      // Plant selection dialog should appear with search
      await expect(page.getByPlaceholder(/search/i)).toBeVisible()
    }
  })

  test('should show calendar toggle button', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Calendar button should be visible
    await expect(page.getByRole('button', { name: /Calendar/i })).toBeVisible()
  })

  test('should toggle calendar view', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Click calendar button
    await page.getByRole('button', { name: /Calendar/i }).click()
    
    // Calendar content should be visible
    await expect(page.getByText(/Planting Calendar/i)).toBeVisible()
    
    // Click again to hide
    await page.getByRole('button', { name: /Calendar/i }).click()
    
    // Calendar should be hidden
    await expect(page.getByText(/Planting Calendar/i)).not.toBeVisible()
  })

  test('should display quick links to guides', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Quick links should be visible
    await expect(page.getByRole('link', { name: /Companions/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Composting/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Rotation/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ask Aitor/i })).toBeVisible()
  })

  test('should persist data across page reloads', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Add a second bed
    await page.getByRole('button', { name: /Add Bed/i }).click()
    await expect(page.getByRole('button', { name: /Bed 2/i })).toBeVisible()
    
    // Reload the page
    await page.reload()
    
    // Bed 2 should still be there
    await expect(page.getByRole('button', { name: /Bed 2/i })).toBeVisible()
  })
})

test.describe('Garden Planner - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Main content should be visible
    await expect(page.locator('h1').filter({ hasText: /Garden/i })).toBeVisible()
    
    // Grid should be visible
    await expect(page.getByText(/Rows:/i)).toBeVisible()
  })

  test('should show bed tabs on mobile', async ({ page }) => {
    await page.goto('/garden-planner')
    
    // Bed tabs should be visible
    await expect(page.getByRole('button', { name: /Bed 1/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Add Bed/i })).toBeVisible()
  })
})
