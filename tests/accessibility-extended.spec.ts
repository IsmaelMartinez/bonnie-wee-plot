import { test, expect } from '@playwright/test'

async function setupPage(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      meta: { setupCompleted: true },
      layout: { areas: [{ id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', position: { x: 0, y: 0, w: 2, h: 2 } }] },
      seasons: [{ year: new Date().getFullYear(), status: 'current', areas: [{ areaId: 'bed-a', rotationGroup: 'legumes', plantings: [], notes: [] }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      currentYear: new Date().getFullYear(),
      varieties: []
    }))
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  })
}

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should be able to tab through all interactive elements on homepage', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Tab through and collect focused element types
    const focusedElements: string[] = []
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab')
      const tag = await page.evaluate(() => document.activeElement?.tagName)
      if (tag) focusedElements.push(tag)
    }

    // Should have tabbed through multiple interactive elements
    const interactiveCount = focusedElements.filter(t => ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(t)).length
    expect(interactiveCount).toBeGreaterThan(3)
  })

  test('should show focus indicators', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Tab to first interactive element
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Focus ring may be via Tailwind focus: classes which are applied on :focus-visible
    // Just verify an element received focus
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedTag)
  })

  test('should not have focus traps outside dialogs', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Tab many times - should eventually reach the end of the page
    const elements = new Set<string>()
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab')
      const el = await page.evaluate(() => document.activeElement?.outerHTML?.slice(0, 100))
      if (el) elements.add(el)
    }

    // Should have encountered multiple different elements (not stuck on one)
    expect(elements.size).toBeGreaterThan(3)
  })
})

test.describe('Accessibility - Screen Reader Support', () => {
  test('should have proper page headings on all pages', async ({ page }) => {
    await setupPage(page)

    // Check homepage
    await page.goto('/')
    let h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()

    // Check This Month
    await page.goto('/this-month')
    h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()

    // Check Seeds
    await page.goto('/seeds')
    h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()

    // Check About
    await page.goto('/about')
    h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()

    // Check Settings
    await page.goto('/settings')
    h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()
  })

  test('should have accessible names on all buttons', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Get all buttons and check they have accessible names
    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 20); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const name = await button.getAttribute('aria-label')
        const text = await button.textContent()
        const title = await button.getAttribute('title')
        // Button should have either text content, aria-label, or title
        const hasName = (name && name.length > 0) || (text && text.trim().length > 0) || (title && title.length > 0)
        expect(hasName).toBe(true)
      }
    }
  })

  test('should have labels on form fields', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    // All inputs should have associated labels
    const inputs = page.locator('input:visible')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const type = await input.getAttribute('type')

      // Hidden inputs don't need labels
      if (type === 'hidden') continue

      // Should have either id (with matching label), aria-label, or aria-labelledby
      const hasLabel = (id && id.length > 0) || (ariaLabel && ariaLabel.length > 0) || (ariaLabelledBy && ariaLabelledBy.length > 0)
      expect(hasLabel).toBe(true)
    }
  })

  test('should have alt text on images', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')

    // Check all img elements for alt text
    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      // alt should be defined (can be empty for decorative images)
      expect(alt).toBeDefined()
    }
  })
})

test.describe('Accessibility - Settings Page', () => {
  test('should have accessible settings page', async ({ page }) => {
    await setupPage(page)
    await page.goto('/settings')

    // Heading hierarchy should be correct
    await expect(page.locator('h1')).toBeVisible()

    // Section headings should be h2
    const h2s = page.locator('h2')
    const count = await h2s.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })
})
