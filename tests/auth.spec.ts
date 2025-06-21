import { test, expect } from '@playwright/test'

test.describe('Authentication System', () => {
  test('public pages should be accessible without authentication', async ({ page }) => {
    // Test homepage
    await page.goto('/')
    await expect(page.getByText('Welcome to Community Allotment Association')).toBeVisible()
    
    // Test announcements
    await page.goto('/announcements')
    await expect(page.getByText('Community Announcements')).toBeVisible()
    
    // Test calendar
    await page.goto('/calendar')
    await expect(page.getByText('Community Calendar')).toBeVisible()
    
    // Test AI advisor - use more specific selector
    await page.goto('/ai-advisor')
    await expect(page.getByRole('heading', { name: /Aitor.*Your Gardening Companion/ })).toBeVisible()
  })

  test('should redirect to sign-in page when accessing admin without auth', async ({ page }) => {
    await page.goto('/admin')
    
    // Wait for redirect to occur (client-side redirect)
    await page.waitForURL('**/auth/signin', { timeout: 5000 })
    
    // Should redirect to sign-in page or show sign-in form
    expect(page.url()).toMatch(/\/auth\/signin/)
  })

  test('should display sign-in page correctly', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check page title and content
    await expect(page.getByText('Admin Access Required')).toBeVisible()
    await expect(page.getByText('Sign in with your GitHub account')).toBeVisible()
    
    // Check GitHub sign-in button
    const githubButton = page.getByRole('button', { name: /sign in with github/i })
    await expect(githubButton).toBeVisible()
    await expect(githubButton).toBeEnabled()
    
    // Check public access links
    await expect(page.getByText('Community Announcements')).toBeVisible()
    await expect(page.getByText('Events Calendar')).toBeVisible()
    await expect(page.getByText('AI Gardening Advisor')).toBeVisible()
  })

  test('should navigate to public pages from sign-in page', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Test navigation to announcements
    await page.getByRole('button', { name: /Community Announcements/ }).click({ force: true })
    await page.waitForURL(/\/announcements/)
    expect(page.url()).toMatch(/\/announcements/)
    
    // Go back to sign-in
    await page.goto('/auth/signin')
    
    // Test navigation to calendar
    await page.getByRole('button', { name: /Events Calendar/ }).click({ force: true })
    await page.waitForURL(/\/calendar/)
    expect(page.url()).toMatch(/\/calendar/)
    
    // Go back to sign-in
    await page.goto('/auth/signin')
    
    // Test navigation to AI advisor
    await page.getByRole('button', { name: /AI Gardening Advisor/ }).click({ force: true })
    await page.waitForURL(/\/ai-advisor/)
    expect(page.url()).toMatch(/\/ai-advisor/)
  })

  test('should display error page correctly', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied')
    
    // Check error content
    await expect(page.getByText('Access Denied')).toBeVisible()
    await expect(page.getByText('Only authorized administrators')).toBeVisible()
    
    // Check action buttons
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /go to homepage/i })).toBeVisible()
    
    // Check contact info for access denied
    await expect(page.getByText('Need admin access?')).toBeVisible()
  })

  test('should handle different error types', async ({ page }) => {
    // Test Configuration error
    await page.goto('/auth/error?error=Configuration')
    await expect(page.getByText('Configuration Error')).toBeVisible()
    
    // Test Default error
    await page.goto('/auth/error?error=Unknown')
    await expect(page.getByText('Authentication Error')).toBeVisible()
  })

  test('should show admin sign in link in navigation for non-authenticated users', async ({ page }) => {
    await page.goto('/')
    
    // Check navigation shows admin sign in link
    await expect(page.getByRole('link', { name: 'Admin Sign In' })).toBeVisible()
    
    // Click should go to sign-in page
    await page.getByRole('link', { name: 'Admin Sign In' }).click({ force: true })
    await page.waitForURL(/\/auth\/signin/)
    expect(page.url()).toMatch(/\/auth\/signin/)
  })

  test('should handle missing environment variables gracefully', async ({ page }) => {
    // This test ensures the app doesn't crash with missing env vars
    await page.goto('/auth/signin')
    
    // Should still show the sign-in page even if GitHub OAuth isn't configured
    await expect(page.getByText('Admin Access Required')).toBeVisible()
  })
})

test.describe('Navigation Component', () => {
  test('should show all public navigation links', async ({ page }) => {
    await page.goto('/')
    
    // Check all public navigation links are present in the navigation bar
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Announcements' })).toBeVisible()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Calendar' })).toBeVisible()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Aitor' })).toBeVisible()
  })

  test('should not show admin link for non-authenticated users', async ({ page }) => {
    await page.goto('/')
    
    // Should not show admin navigation link (with shield icon)
    const adminLink = page.getByRole('link', { name: /admin/i }).and(page.locator('[data-lucide="shield"]'))
    await expect(adminLink).not.toBeVisible()
  })

  test('should show correct branding', async ({ page }) => {
    await page.goto('/')
    
    // Check branding
    await expect(page.getByText('🌱 Community Allotment')).toBeVisible()
  })
})
