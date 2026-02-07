import { test, expect } from '@playwright/test'

async function setupPage(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      meta: { setupCompleted: true },
      layout: { areas: [] },
      seasons: [],
      currentYear: new Date().getFullYear(),
      varieties: []
    }))
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  })
}


test.describe('Settings Page - Page Load', () => {
  test('should display page header', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('should display all settings sections', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    await expect(page.getByRole('heading', { name: /AI Assistant/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Data Management' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Share Allotment' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Receive Allotment' })).toBeVisible()
  })
})

test.describe('Settings Page - AI Assistant Section', () => {
  test('should show AI assistant section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    const aiSection = page.locator('[data-tour="ai-settings"]')
    await expect(aiSection).toBeVisible()
  })

  test('should show API key input', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    const tokenInput = page.locator('input#openai-token')
    await expect(tokenInput).toBeVisible()
  })

  test('should show Save Token button', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    await expect(page.getByRole('button', { name: /Save Token/i })).toBeVisible()
  })

  test('should show Clear Token button', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    await expect(page.getByRole('button', { name: /Clear Token/i })).toBeVisible()
  })

  test('should show privacy notice', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    const privacyNote = page.locator('[role="note"]')
    await expect(privacyNote).toBeVisible()
  })

  test('should show link to OpenAI dashboard', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    const openaiLink = page.locator('a[href*="openai"]')
    await expect(openaiLink).toBeVisible()
  })
})

test.describe('Settings Page - Location Settings', () => {
  test('should show location section', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    const locationSection = page.locator('[data-tour="location-settings"]')
    await expect(locationSection).toBeVisible()
  })

  test('should show Detect Location button', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    await expect(page.getByRole('button', { name: /Detect Location/i })).toBeVisible()
  })

  test('should show explanation text for location', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    const locationSection = page.locator('[data-tour="location-settings"]')
    // Should have some explanatory text
    const textContent = await locationSection.textContent()
    expect(textContent!.length).toBeGreaterThan(20)
  })
})

test.describe('Settings Page - Share Allotment', () => {
  test('should show share button', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    await expect(page.getByRole('button', { name: /Share My Allotment/i })).toBeVisible()
  })

  test('should open share dialog when clicking share button', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    await page.getByRole('button', { name: /Share My Allotment/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/Share Your Allotment/i)).toBeVisible()
  })

  test('should show expiration dropdown in share dialog', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    await page.getByRole('button', { name: /Share My Allotment/i }).click()
    await expect(page.locator('select#expiration-select')).toBeVisible()
  })

  test('should show Create Share Link button', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    await page.getByRole('button', { name: /Share My Allotment/i }).click()
    await expect(page.getByRole('button', { name: /Create Share Link/i })).toBeVisible()
  })
})

test.describe('Settings Page - Receive Allotment', () => {
  test('should show link to /receive', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    const receiveLink = page.getByRole('link', { name: /Receive Data/i })
    await expect(receiveLink).toBeVisible()
    await expect(receiveLink).toHaveAttribute('href', '/receive')
  })
})

test.describe('Receive Page', () => {
  test('should display receive page with heading', async ({ page }) => {
    await setupPage(page)
    await page.goto('/receive')

    await expect(page.getByRole('heading', { name: /Receive Allotment/i })).toBeVisible()
  })

  test('should show code entry option', async ({ page }) => {
    await setupPage(page)
    await page.goto('/receive')

    await expect(page.getByRole('button', { name: /Enter Code/i })).toBeVisible()
  })

  test('should show code entry field when Enter Code is clicked', async ({ page }) => {
    await setupPage(page)
    await page.goto('/receive')

    await page.getByRole('button', { name: /Enter Code/i }).click()
    await expect(page.locator('input#code')).toBeVisible()
  })

  test('should accept code input in uppercase mono format', async ({ page }) => {
    await setupPage(page)
    await page.goto('/receive')

    await page.getByRole('button', { name: /Enter Code/i }).click()
    const codeInput = page.locator('input#code')
    await codeInput.fill('ABC123')
    await expect(codeInput).toHaveValue('ABC123')
  })

  test('should show error for invalid code', async ({ page }) => {
    await setupPage(page)
    await page.goto('/receive')

    await page.getByRole('button', { name: /Enter Code/i }).click()
    await page.locator('input#code').fill('XXXXXX')
    await page.getByRole('button', { name: /Continue/i }).click()

    // Should show some error
    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 10000 })
  })

  test('should have Go Home button', async ({ page }) => {
    await setupPage(page)
    await page.goto('/receive')

    await expect(page.getByRole('button', { name: /Go Home/i }).or(page.getByRole('link', { name: /Go Home/i }))).toBeVisible()
  })
})
