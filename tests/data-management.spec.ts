import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Helper function to enable edit mode and add an area
async function addAreaInEditMode(page: import('@playwright/test').Page, areaName: string) {
  // Click Lock/Locked button to enter edit mode
  const lockButton = page.locator('button').filter({ hasText: /Lock/ })
  await expect(lockButton).toBeVisible({ timeout: 5000 })
  await lockButton.click()
  await page.waitForTimeout(300)

  // Now click Add Area button
  const addAreaButton = page.locator('button').filter({ hasText: 'Add Area' })
  await expect(addAreaButton).toBeEnabled({ timeout: 5000 })
  await addAreaButton.click()
  await page.waitForTimeout(300)

  // Fill in the area name and submit
  await page.locator('#area-name').fill(areaName)
  await page.locator('button[type="submit"]').filter({ hasText: 'Add Area' }).click()
  await page.waitForTimeout(500)
}

test.describe('Data Management - Export/Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/allotment')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('should open data management dialog', async ({ page }) => {
    // Find and click the data management button (Download icon)
    const dataManagementButton = page.locator('button[aria-label="Data management"]')
    await expect(dataManagementButton).toBeVisible()
    await dataManagementButton.click()

    // Dialog should open
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Data Management')).toBeVisible()
  })

  test('should show storage statistics', async ({ page }) => {
    // Open data management dialog
    const dataManagementButton = page.locator('button[aria-label="Data management"]')
    await dataManagementButton.click()

    // Should show storage stats
    await expect(page.getByText('Storage Usage')).toBeVisible()
    await expect(page.getByText('Allotment Data', { exact: true })).toBeVisible()
    await expect(page.getByText('Total localStorage')).toBeVisible()
  })

  test('should export data as JSON file', async ({ page }) => {
    // Open data management dialog
    const dataManagementButton = page.locator('button[aria-label="Data management"]')
    await dataManagementButton.click()

    // Start waiting for the download before clicking
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    const exportButton = page.getByRole('button', { name: /Export Backup/i })
    await exportButton.click()

    // Get the download
    const download = await downloadPromise

    // Verify filename format
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/^allotment-backup-\d{4}-\d{2}-\d{2}\.json$/)

    // Read and verify the content
    const filePath = await download.path()
    if (filePath) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)

      // Verify export structure
      expect(data).toHaveProperty('allotment')
      expect(data).toHaveProperty('varieties')
      expect(data).toHaveProperty('exportedAt')
      expect(data).toHaveProperty('exportVersion')

      // Verify allotment data structure
      expect(data.allotment).toHaveProperty('version')
      expect(data.allotment).toHaveProperty('meta')
      expect(data.allotment).toHaveProperty('seasons')
      expect(data.allotment).toHaveProperty('layout')
    }
  })

  test('should import file and show success message', async ({ page }) => {
    // Create a minimal valid import file
    const tempFilePath = path.join(__dirname, 'test-import.json')
    const testAreaName = `Import Test ${Date.now()}`
    const importData = {
      allotment: {
        version: 11,
        meta: {
          name: 'Imported Garden',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        layout: { areas: [{ id: 'test-area', name: testAreaName, kind: 'rotation-bed', canHavePlantings: true }] },
        seasons: [{
          year: new Date().getFullYear(),
          status: 'current',
          areas: [{ areaId: 'test-area', plantings: [] }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }],
        currentYear: new Date().getFullYear(),
        varieties: []
      },
      varieties: {
        version: 2,
        varieties: [],
        meta: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      exportedAt: new Date().toISOString(),
      exportVersion: 11
    }
    fs.writeFileSync(tempFilePath, JSON.stringify(importData))

    // Open data management dialog
    const dataManagementButton = page.locator('button[aria-label="Data management"]')
    await dataManagementButton.click()

    // Use file chooser for import
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Select Backup File').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(tempFilePath)

    // Wait for import success message
    await expect(page.getByText('Data imported successfully!')).toBeVisible()

    // Clean up temp file
    fs.unlinkSync(tempFilePath)
  })

  test('should create pre-import backup before importing', async ({ page }) => {
    // Add some initial data
    await addAreaInEditMode(page, 'Initial Area')
    await page.waitForTimeout(700)

    // Create and save a minimal import file
    const tempFilePath = path.join(__dirname, 'temp-import.json')
    const importData = {
      allotment: {
        version: 11,
        meta: {
          name: 'Imported Garden',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        layout: { areas: [] },
        seasons: [{
          year: new Date().getFullYear(),
          status: 'current',
          areas: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }],
        currentYear: new Date().getFullYear(),
        varieties: []
      },
      varieties: {
        version: 2,
        varieties: [],
        meta: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      exportedAt: new Date().toISOString(),
      exportVersion: 11
    }
    fs.writeFileSync(tempFilePath, JSON.stringify(importData))

    // Count pre-import backups before import
    const backupsBefore = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => k.includes('pre-import')).length
    })

    // Import the file
    const dataManagementButton = page.locator('button[aria-label="Data management"]')
    await dataManagementButton.click()

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Select Backup File').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(tempFilePath)

    // Wait for import
    await expect(page.getByText('Data imported successfully!')).toBeVisible()
    await page.waitForTimeout(2000)

    // Check that a pre-import backup was created
    const backupsAfter = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => k.includes('pre-import')).length
    })

    expect(backupsAfter).toBeGreaterThan(backupsBefore)

    // Clean up
    fs.unlinkSync(tempFilePath)
  })

  test('should show error for invalid JSON file', async ({ page }) => {
    // Create an invalid JSON file
    const tempFilePath = path.join(__dirname, 'invalid.json')
    fs.writeFileSync(tempFilePath, 'not valid json {{{')

    // Open data management dialog
    const dataManagementButton = page.locator('button[aria-label="Data management"]')
    await dataManagementButton.click()

    // Try to import invalid file
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Select Backup File').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(tempFilePath)

    // Should show error message
    await expect(page.getByText(/Invalid JSON file/i)).toBeVisible()

    // Clean up
    fs.unlinkSync(tempFilePath)
  })

  test('should show error for backup from newer version', async ({ page }) => {
    // Create a backup with a very high version number
    const tempFilePath = path.join(__dirname, 'future-version.json')
    const futureData = {
      allotment: {
        version: 9999,  // Very high version
        meta: {
          name: 'Future Garden',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        layout: { areas: [] },
        seasons: [],
        currentYear: new Date().getFullYear(),
        varieties: []
      },
      varieties: {
        version: 2,
        varieties: [],
        meta: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      exportedAt: new Date().toISOString(),
      exportVersion: 9999
    }
    fs.writeFileSync(tempFilePath, JSON.stringify(futureData))

    // Open data management dialog
    const dataManagementButton = page.locator('button[aria-label="Data management"]')
    await dataManagementButton.click()

    // Try to import
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Select Backup File').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(tempFilePath)

    // Should show version error
    await expect(page.getByText(/newer version/i)).toBeVisible()

    // Clean up
    fs.unlinkSync(tempFilePath)
  })

  test('should handle old export format (AllotmentData only)', async ({ page }) => {
    // Create an old-format export (just AllotmentData, no wrapper)
    const tempFilePath = path.join(__dirname, 'old-format.json')
    const oldFormatData = {
      version: 11,
      meta: {
        name: 'Old Format Garden',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      layout: { areas: [] },
      seasons: [{
        year: new Date().getFullYear(),
        status: 'current',
        areas: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }],
      currentYear: new Date().getFullYear(),
      varieties: []
    }
    fs.writeFileSync(tempFilePath, JSON.stringify(oldFormatData))

    // Open data management dialog
    const dataManagementButton = page.locator('button[aria-label="Data management"]')
    await dataManagementButton.click()

    // Import old format file
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Select Backup File').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(tempFilePath)

    // Should import successfully
    await expect(page.getByText('Data imported successfully!')).toBeVisible()
    await page.waitForTimeout(2000)

    // Verify the data was imported
    await page.waitForLoadState('networkidle')

    // The allotment name should match
    await expect(page.locator('h1').filter({ hasText: 'Old Format Garden' })).toBeVisible()

    // Clean up
    fs.unlinkSync(tempFilePath)
  })

  test('should show clear confirmation dialog', async ({ page }) => {
    // Open data management dialog
    const dataManagementButton = page.locator('button[aria-label="Data management"]')
    await dataManagementButton.click()

    // Click clear button
    await page.getByRole('button', { name: /Clear All Data/i }).click()

    // Confirmation dialog should appear
    await expect(page.getByText('Clear All Data?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete Everything' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Keep Data' })).toBeVisible()
  })

  test('should cancel clear when clicking Keep Data', async ({ page }) => {
    // Add an area first
    const areaName = `Keep Me ${Date.now()}`
    await addAreaInEditMode(page, areaName)
    await page.waitForTimeout(700)

    // Open data management dialog
    const dataManagementButton = page.locator('button[aria-label="Data management"]')
    await dataManagementButton.click()

    // Click clear button
    await page.getByRole('button', { name: /Clear All Data/i }).click()

    // Click Keep Data
    await page.getByRole('button', { name: 'Keep Data' }).click()

    // Dialog should close
    await expect(page.getByText('Clear All Data?')).not.toBeVisible()

    // Close data management dialog
    await page.getByRole('button', { name: 'Close', exact: true }).click()

    // Data should still be there
    await expect(page.locator('[class*="react-grid-item"]').filter({ hasText: areaName })).toBeVisible()
  })
})
