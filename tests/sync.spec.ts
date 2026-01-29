import { test, expect, type Page } from '@playwright/test'

// Helper to set up basic app state (skip onboarding and unlock features)
async function setupAppState(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      version: 16,
      meta: { name: 'Test Plot', setupCompleted: true, createdAt: '2026-01-01', updatedAt: '2026-01-29' },
      layout: { areas: [{ id: 'a', name: 'Bed A', kind: 'rotation-bed', canHavePlantings: true }] },
      seasons: [],
      currentYear: 2026,
      varieties: []
    }))
    // Unlock all features to access settings
    localStorage.setItem('allotment-engagement', JSON.stringify({
      visitCount: 10,
      lastVisit: new Date().toISOString(),
      manuallyUnlocked: ['ai-advisor', 'compost', 'allotment-layout']
    }))
    // Mark celebrations as shown to prevent modal popup
    localStorage.setItem('allotment-celebrations-shown', JSON.stringify([
      'ai-advisor', 'compost', 'allotment-layout'
    ]))
  })
}

test.describe('P2P Sync - Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAppState(page)
  })

  test('navigates to settings page via More menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click More dropdown (desktop)
    await page.getByRole('button', { name: 'More' }).click()

    // Click Settings link
    await page.getByRole('menuitem', { name: /Settings/i }).click()

    // Verify we're on settings page (handle trailing slash)
    await expect(page).toHaveURL(/\/settings\/?$/)
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('shows device settings section', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Check for device sync section
    await expect(page.getByRole('heading', { name: 'Device Sync' })).toBeVisible()

    // Check for This Device section
    await expect(page.getByRole('heading', { name: 'This Device' })).toBeVisible()

    // Check for Paired Devices section
    await expect(page.getByRole('heading', { name: 'Paired Devices' })).toBeVisible()

    // Check for Add Device button
    await expect(page.getByRole('button', { name: /Add Device/i })).toBeVisible()
  })

  test('can edit device name', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Wait for content to load
    await expect(page.getByRole('heading', { name: 'This Device' })).toBeVisible()

    // Click Edit button to enter edit mode
    await page.getByRole('button', { name: 'Edit' }).click()

    // Find the input that appears and edit it
    const nameInput = page.locator('input[type="text"]').first()
    await nameInput.fill('My Test Device')

    // Click Save
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify the name was saved (now shown as text)
    await expect(page.getByText('My Test Device')).toBeVisible()
  })

  test('opens pairing modal when clicking Add Device', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Wait for content to load
    await expect(page.getByRole('heading', { name: 'This Device' })).toBeVisible()

    // Click Add Device button
    await page.getByRole('button', { name: /Add Device/i }).click()

    // Verify modal appears with pairing options
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Add Device' })).toBeVisible()

    // Should show two options
    await expect(page.getByText('Show QR Code')).toBeVisible()
    await expect(page.getByText('Scan QR Code')).toBeVisible()
  })

  test('shows QR code when selecting Show QR Code option', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Wait for content to load
    await expect(page.getByRole('heading', { name: 'This Device' })).toBeVisible()

    // Open pairing modal
    await page.getByRole('button', { name: /Add Device/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click Show QR Code button (the one in the modal)
    await page.locator('[role="dialog"]').getByText('Show QR Code').click()

    // Wait for QR code to appear (rendered as SVG by qrcode.react)
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 5000 })

    // Should show confirmation code text
    await expect(page.getByText(/Confirmation Code/i)).toBeVisible()
  })

  test('can close pairing modal by clicking backdrop', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Wait for content to load
    await expect(page.getByRole('heading', { name: 'This Device' })).toBeVisible()

    // Open modal
    await page.getByRole('button', { name: /Add Device/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click the backdrop to close
    await page.locator('.bg-black\\/50').click({ position: { x: 10, y: 10 } })

    // Modal should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('P2P Sync - Console Error Monitoring', () => {
  test('no sync-related errors on homepage', async ({ page }) => {
    await setupAppState(page)

    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500) // Wait for any async errors

    const syncErrors = errors.filter(e =>
      e.toLowerCase().includes('sync') ||
      e.toLowerCase().includes('yjs') ||
      e.toLowerCase().includes('webrtc') ||
      e.toLowerCase().includes('ydoc')
    )
    expect(syncErrors).toHaveLength(0)
  })

  test('no sync-related errors on settings page', async ({ page }) => {
    await setupAppState(page)

    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const syncErrors = errors.filter(e =>
      e.toLowerCase().includes('sync') ||
      e.toLowerCase().includes('yjs') ||
      e.toLowerCase().includes('webrtc') ||
      e.toLowerCase().includes('ydoc')
    )
    expect(syncErrors).toHaveLength(0)
  })
})

test.describe('P2P Sync - Device Identity', () => {
  test('generates device identity on first visit to settings', async ({ page }) => {
    await setupAppState(page)

    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Wait for component to initialize
    await expect(page.getByRole('heading', { name: 'This Device' })).toBeVisible()

    // Check that device identity was created in localStorage
    const identity = await page.evaluate(() => {
      return localStorage.getItem('bonnieplot-device-identity')
    })

    expect(identity).toBeTruthy()

    if (identity) {
      const parsed = JSON.parse(identity)
      expect(parsed).toHaveProperty('publicKey')
      expect(parsed).toHaveProperty('privateKey')
      expect(parsed).toHaveProperty('deviceName')
    }
  })

  test('persists device identity across page reloads', async ({ page }) => {
    await setupAppState(page)

    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'This Device' })).toBeVisible()

    // Get initial identity
    const identity1 = await page.evaluate(() => {
      return localStorage.getItem('bonnieplot-device-identity')
    })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'This Device' })).toBeVisible()

    // Get identity again
    const identity2 = await page.evaluate(() => {
      return localStorage.getItem('bonnieplot-device-identity')
    })

    // Should be the same
    expect(identity1).toBe(identity2)
  })
})

test.describe('P2P Sync - Mobile Navigation', () => {
  test('can access settings from mobile menu', async ({ page }) => {
    await setupAppState(page)

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open mobile menu
    await page.getByRole('button', { name: /Open menu/i }).click()

    // Expand More section
    await page.getByRole('button', { name: 'More' }).click()

    // Click Settings
    await page.getByRole('link', { name: /Settings/i }).click()

    // Verify navigation (handle trailing slash)
    await expect(page).toHaveURL(/\/settings\/?$/)
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })
})

test.describe('P2P Sync - Direct URL Access', () => {
  test('can access settings page directly', async ({ page }) => {
    await setupAppState(page)

    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Settings page should load without navigation
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByText('Device Sync')).toBeVisible()
  })
})
