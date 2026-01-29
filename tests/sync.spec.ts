import { test, expect } from '@playwright/test'

test.describe('P2P Sync', () => {
  test.skip('shows device settings when navigating to settings', async ({ page }) => {
    // TODO: Enable this test once sync UI is integrated into the app
    await page.goto('/')

    // Look for settings link/button (adjust selector based on actual app structure)
    const settingsLink = page.locator('[href*="settings"], button:has-text("Settings")')
    if (await settingsLink.count() > 0) {
      await settingsLink.first().click()
    }

    // Check for device settings elements
    // Note: These may need adjustment based on where DeviceSettings is mounted
    await expect(page.locator('text=This Device').or(page.locator('text=Paired Devices'))).toBeVisible()
  })

  test('sync components render without errors', async ({ page }) => {
    await page.goto('/')
    // Verify no console errors related to sync
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(1000)

    const syncErrors = errors.filter(e =>
      e.toLowerCase().includes('sync') ||
      e.toLowerCase().includes('yjs') ||
      e.toLowerCase().includes('webrtc')
    )
    expect(syncErrors).toHaveLength(0)
  })
})
