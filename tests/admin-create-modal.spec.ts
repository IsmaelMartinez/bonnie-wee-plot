import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'announcements.json')
const BACKUP_FILE = path.join(process.cwd(), 'data', 'announcements-demo-backup.json')

// Helper to create unique test data file for each worker
async function getTestDataFile(testInfo: any) {
  const workerId = testInfo.workerIndex ?? 0
  const testDataFile = path.join(process.cwd(), 'data', `announcements-test-${workerId}.json`)

  // Copy backup data to test-specific file
  const backupData = await fs.readFile(BACKUP_FILE, 'utf-8')
  await fs.writeFile(testDataFile, backupData)

  return testDataFile
}

async function cleanupTestDataFile(testDataFile: string) {
  try {
    await fs.unlink(testDataFile)
  } catch (error) {
    console.debug('Test data file already cleaned up:', error)
  }
}

// Helper to reset announcements data using test-specific file
async function resetAnnouncementsData(testDataFile: string) {
  try {
    const backupData = await fs.readFile(BACKUP_FILE, 'utf-8')
    await fs.writeFile(testDataFile, backupData)
    // Also copy to main data file for API to read
    await fs.writeFile(DATA_FILE, backupData)
  } catch (error) {
    console.warn('Could not reset announcements data:', error)
  }
}

test.describe('Admin - Create Announcement Modal', () => {
  let testDataFile: string;

  test.beforeEach(async ({ page }, testInfo) => {
    // Create test-specific data file
    testDataFile = await getTestDataFile(testInfo)

    // Reset data for this test
    await resetAnnouncementsData(testDataFile)

    await page.goto('/admin?test-mode=true')
    await page.waitForSelector('[data-testid="new-announcement-button"]')
  })

  test.afterEach(async () => {
    // Clean up test-specific data file
    if (testDataFile) {
      await cleanupTestDataFile(testDataFile)
    }
  })

  test('should open modal when New Announcement button is clicked', async ({ page }) => {
    await page.click('[data-testid="new-announcement-button"]')

    // Modal should be visible
    await expect(page.locator('[data-testid="create-modal"]')).toBeVisible()
    await expect(page.locator('h3:has-text("Create New Announcement")')).toBeVisible()

    // Form fields should be visible
    await expect(page.locator('[data-testid="title-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="content-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="type-select"]')).toBeVisible()
    await expect(page.locator('[data-testid="priority-select"]')).toBeVisible()
    await expect(page.locator('[data-testid="date-input"]')).toBeVisible()
  })

  test('should close modal when close button is clicked', async ({ page }) => {
    await page.click('[data-testid="new-announcement-button"]')
    await expect(page.locator('[data-testid="create-modal"]')).toBeVisible()

    // Use force click to bypass potential overlay issues
    await page.locator('[data-testid="close-modal-button"]').click({ force: true })
    await expect(page.locator('[data-testid="create-modal"]')).not.toBeVisible()
  })

  test('should close modal when cancel button is clicked', async ({ page }) => {
    await page.click('[data-testid="new-announcement-button"]')
    await expect(page.locator('[data-testid="create-modal"]')).toBeVisible()

    // Use force click for mobile compatibility
    await page.locator('[data-testid="cancel-button"]').click({ force: true })
    await expect(page.locator('[data-testid="create-modal"]')).not.toBeVisible()
  })

  test('should show validation errors for empty required fields', async ({ page }) => {
    await page.click('[data-testid="new-announcement-button"]')

    // Clear all fields and try to submit
    await page.fill('[data-testid="title-input"]', '')
    await page.fill('[data-testid="content-input"]', '')
    
    // Use force click for mobile compatibility
    await page.locator('[data-testid="submit-button"]').click({ force: true })

    // Should show validation errors
    await expect(page.locator('text=Title is required')).toBeVisible()
    await expect(page.locator('text=Content is required')).toBeVisible()

    // Modal should still be open
    await expect(page.locator('[data-testid="create-modal"]')).toBeVisible()
  })

  test('should show character count for title and content fields', async ({ page }) => {
    await page.click('[data-testid="new-announcement-button"]')

    // Check initial character counts
    await expect(page.locator('text=0/100 characters')).toBeVisible()
    await expect(page.locator('text=0/1000 characters')).toBeVisible()

    // Type some text and check updated counts
    await page.fill('[data-testid="title-input"]', 'Test Title')
    await page.fill('[data-testid="content-input"]', 'Test content here')

    await expect(page.locator('text=10/100 characters')).toBeVisible()
    await expect(page.locator('text=17/1000 characters')).toBeVisible()
  })

  test('should have correct default values in form fields', async ({ page }) => {
    await page.click('[data-testid="new-announcement-button"]')

    // Check default values
    await expect(page.locator('[data-testid="title-input"]')).toHaveValue('')
    await expect(page.locator('[data-testid="content-input"]')).toHaveValue('')
    await expect(page.locator('[data-testid="type-select"]')).toHaveValue('tip')
    await expect(page.locator('[data-testid="priority-select"]')).toHaveValue('low')

    // Date should be today's date
    const today = new Date().toISOString().split('T')[0]
    await expect(page.locator('[data-testid="date-input"]')).toHaveValue(today)
  })

  test('should create announcement successfully with valid data', async ({ page }) => {
    // Wait for page to fully load and check initial state
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Wait a bit more to ensure all announcements are loaded
    await page.waitForTimeout(1000)

    const initialRows = await page.locator('tbody tr').count()

    // If we don't have the expected 4 rows, there might be an API error - check for error state and reload if needed
    if (initialRows !== 4) {
      const errorState = await page.locator('text=Error loading announcements').isVisible()

      // If there's an error, try to reload
      if (errorState) {
        await page.reload()
        await page.waitForSelector('tbody tr', { timeout: 10000 })
        await page.waitForTimeout(1000)
      }
    }

    // Get final initial count (should be 4 demo announcements)
    const finalInitialRows = await page.locator('tbody tr').count()
    expect(finalInitialRows).toBe(4) // Ensure we start with clean demo data

    await page.click('[data-testid="new-announcement-button"]')

    // Use a more stable unique identifier
    const timestamp = Date.now()
    const uniqueTitle = `Test Modal ${timestamp}`

    // Fill form with valid data
    await page.fill('[data-testid="title-input"]', uniqueTitle)
    await page.fill('[data-testid="content-input"]', 'This is a test announcement content.')
    await page.selectOption('[data-testid="type-select"]', 'delivery')
    await page.selectOption('[data-testid="priority-select"]', 'high')

    // Submit form
    await page.locator('[data-testid="submit-button"]').click({ force: true })

    // Wait for modal to close (indicates success)
    await expect(page.locator('[data-testid="create-modal"]')).not.toBeVisible()

    // Wait for the new announcement to appear in the list
    await expect(page.locator(`text=${uniqueTitle}`).first()).toBeVisible({ timeout: 10000 })

    // Should now have 5 announcements
    const finalRows = await page.locator('tbody tr').count()
    expect(finalRows).toBe(5)
  })

  test('should reset form when modal is reopened after closing', async ({ page }) => {
    await page.click('[data-testid="new-announcement-button"]')

    // Fill some data
    await page.fill('[data-testid="title-input"]', 'Some Title')
    await page.fill('[data-testid="content-input"]', 'Some content')
    await page.selectOption('[data-testid="type-select"]', 'event')

    // Close modal
    await page.locator('[data-testid="cancel-button"]').click({ force: true })

    // Reopen modal
    await page.click('[data-testid="new-announcement-button"]')

    // Form should be reset to defaults
    await expect(page.locator('[data-testid="title-input"]')).toHaveValue('')
    await expect(page.locator('[data-testid="content-input"]')).toHaveValue('')
    await expect(page.locator('[data-testid="type-select"]')).toHaveValue('tip')
    await expect(page.locator('[data-testid="priority-select"]')).toHaveValue('low')
  })

  test('should have all announcement type options available', async ({ page }) => {
    await page.click('[data-testid="new-announcement-button"]')

    const typeSelect = page.locator('[data-testid="type-select"]')

    // Check values can be selected
    await typeSelect.selectOption('tip')
    await expect(typeSelect).toHaveValue('tip')

    await typeSelect.selectOption('delivery')
    await expect(typeSelect).toHaveValue('delivery')

    await typeSelect.selectOption('order')
    await expect(typeSelect).toHaveValue('order')

    await typeSelect.selectOption('event')
    await expect(typeSelect).toHaveValue('event')
  })

  test('should have all priority options available', async ({ page }) => {
    await page.click('[data-testid="new-announcement-button"]')

    const prioritySelect = page.locator('[data-testid="priority-select"]')

    // Check values can be selected
    await prioritySelect.selectOption('low')
    await expect(prioritySelect).toHaveValue('low')

    await prioritySelect.selectOption('medium')
    await expect(prioritySelect).toHaveValue('medium')

    await prioritySelect.selectOption('high')
    await expect(prioritySelect).toHaveValue('high')

    await prioritySelect.selectOption('urgent')
    await expect(prioritySelect).toHaveValue('urgent')
  })
})
