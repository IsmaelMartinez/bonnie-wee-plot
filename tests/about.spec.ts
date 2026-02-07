import { test, expect } from '@playwright/test'

async function disableTours(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  })
}

test.describe('About Page', () => {
  test('should display header with app name and tagline', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    await expect(page.getByRole('heading', { name: 'Bonnie Wee Plot' })).toBeVisible()
    await expect(page.getByText('Your personal digital companion for growing in Scottish weather')).toBeVisible()
  })

  test('should display intro card with mission statement', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    await expect(page.getByText(/Plan your garden with intention/)).toBeVisible()
  })

  test('should display three core feature cards', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    // "What You Can Do" heading
    await expect(page.getByRole('heading', { name: 'What You Can Do' })).toBeVisible()

    // Three feature cards
    await expect(page.getByRole('heading', { name: 'Plan Your Plot' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Track Seeds' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Seasonal Timing' })).toBeVisible()
  })

  test('should display quick action cards with working links', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    // My Allotment card
    await expect(page.getByRole('heading', { name: 'My Allotment' })).toBeVisible()
    const allotmentLink = page.getByRole('link', { name: 'Open Allotment' })
    await expect(allotmentLink).toBeVisible()
    await expect(allotmentLink).toHaveAttribute('href', '/allotment')

    // This Month card
    await expect(page.getByRole('heading', { name: 'This Month' })).toBeVisible()
    const calendarLink = page.getByRole('link', { name: 'View Tasks' })
    await expect(calendarLink).toBeVisible()
    await expect(calendarLink).toHaveAttribute('href', '/this-month')
  })

  test('should display AI Advisor section with BYO badge', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    await expect(page.getByRole('heading', { name: 'Ask Aitor' })).toBeVisible()
    await expect(page.getByText('BYO API Key')).toBeVisible()
    await expect(page.getByText(/personalized gardening advice/)).toBeVisible()

    const aitorLink = page.getByRole('link', { name: /Talk to Aitor/ })
    await expect(aitorLink).toBeVisible()
    await expect(aitorLink).toHaveAttribute('href', '/ai-advisor')
  })

  test('should display keyboard shortcuts section', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible()

    // Check that keyboard shortcut descriptions are visible
    await expect(page.getByText('Close dialogs and dropdowns')).toBeVisible()
    await expect(page.getByText('Select option or confirm')).toBeVisible()
    await expect(page.getByText('Navigate options in lists')).toBeVisible()
    await expect(page.getByText('Jump to first or last option')).toBeVisible()
    await expect(page.getByText('Move focus within dialogs')).toBeVisible()
  })

  test('should display kbd elements for keyboard shortcuts', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    // Check for kbd elements
    const kbdElements = page.locator('kbd')
    const count = await kbdElements.count()
    expect(count).toBeGreaterThanOrEqual(5) // Esc, Enter, arrows, Home, End, Tab
  })

  test('should display philosophy section', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    await expect(page.getByRole('heading', { name: 'Growing with Intention' })).toBeVisible()
    await expect(page.getByText(/built for allotment gardeners/)).toBeVisible()
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    await expect(page.getByText('Tailored for Scottish gardens')).toBeVisible()
  })

  test('should navigate to allotment when clicking Open Allotment', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    await page.getByRole('link', { name: 'Open Allotment' }).click()
    await expect(page).toHaveURL(/allotment/)
  })

  test('should navigate to this-month when clicking View Tasks', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    await page.getByRole('link', { name: 'View Tasks' }).click()
    await expect(page).toHaveURL(/this-month/)
  })
})

test.describe('About Page - BYO API Key Section', () => {
  test('should explain the BYO concept clearly', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    // Should have explanation text about bringing your own key
    await expect(page.getByText(/personalized gardening advice/)).toBeVisible()
    await expect(page.getByText(/BYO API Key/)).toBeVisible()
  })

  test('should mention benefits of AI advisor', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    // Should have text about what Aitor can help with
    await expect(page.getByText(/pests|planting|companion|garden/i)).toBeVisible()
  })

  test('should use approachable language', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    // Verify the section doesn't use intimidating technical jargon
    const aitorSection = page.locator('section').filter({ hasText: 'Ask Aitor' })
    const text = await aitorSection.textContent()
    // Should use friendly language
    expect(text).toContain('advice')
    expect(text).not.toContain('endpoint')
    expect(text).not.toContain('REST')
  })
})

test.describe('About Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/about')
    await disableTours(page)

    await expect(page.getByRole('heading', { name: 'Bonnie Wee Plot' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'What You Can Do' })).toBeVisible()
  })
})
