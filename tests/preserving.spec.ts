import { test, expect } from '@playwright/test'

async function disableTours(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  })
}

test.describe('Preserving Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/preserving')
    await disableTours(page)
  })

  test('should load with heading and crop guides', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Preserving', exact: true })).toBeVisible()
    // Cucurbits are authored — courgette should be listed
    await expect(page.locator('details summary').filter({ hasText: 'Courgette' })).toBeVisible()
    await expect(page.getByText(/\d+ crops? found/)).toBeVisible()
  })

  test('search should filter crops', async ({ page }) => {
    await page.getByLabel('Search crops').fill('pumpkin')
    await expect(page.locator('details summary').filter({ hasText: 'Pumpkin' })).toBeVisible()
    await expect(page.locator('details summary').filter({ hasText: 'Courgette' })).toBeHidden()

    await page.getByLabel('Search crops').fill('zzz-no-such-crop')
    await expect(page.getByText('No crops match your search.')).toBeVisible()
  })

  test('method filter should narrow the list', async ({ page }) => {
    await page.getByLabel('Filter by preservation method').selectOption('cure')
    // Courgette has no cure method; winter squash does
    await expect(page.locator('details summary').filter({ hasText: 'Winter Squash' })).toBeVisible()
    await expect(page.locator('details summary').filter({ hasText: 'Courgette' })).toBeHidden()
  })

  test('card should expand with method details and external links', async ({ page }) => {
    const card = page.locator('details').filter({
      has: page.locator('summary', { hasText: 'Courgette' }),
    })
    await card.locator('summary').click()

    await expect(card.getByText(/grate raw and freeze/i)).toBeVisible()

    // External resource links open in a new tab
    const externalLink = card.locator('a[href^="https://"]').first()
    await expect(externalLink).toHaveAttribute('target', '_blank')
    await expect(externalLink).toHaveAttribute('rel', /noopener/)

    // Cross-link to the plant guide
    await expect(card.locator('a[href="/plants/courgette"]')).toBeVisible()
  })
})
