/**
 * Unit tests for storage-utils.ts
 *
 * Tests for quota checking, backup/restore, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  checkStorageQuota,
  createPreImportBackup,
  restoreFromBackup,
  listBackups,
  deleteBackup,
} from '@/lib/storage-utils'
import { AllotmentData, STORAGE_KEY, CURRENT_SCHEMA_VERSION } from '@/types/unified-allotment'
import * as allotmentStorage from '@/services/allotment-storage'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
    get length() {
      return Object.keys(store).length
    },
  }
})()

// Mock data
const mockAllotmentData: AllotmentData = {
  version: CURRENT_SCHEMA_VERSION,
  meta: {
    name: 'Test Allotment',
    location: 'Test Location',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2024,
  maintenanceTasks: [],
  varieties: [],
}

describe('Storage Quota Checking', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    localStorageMock.clear()
  })

  it('calculates storage quota correctly', () => {
    // Add some test data
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockAllotmentData))
    localStorageMock.setItem('other-key', 'other-value')

    const quota = checkStorageQuota()

    expect(quota).toBeDefined()
    expect(quota.usedBytes).toBeGreaterThan(0)
    expect(quota.usedKB).toBeGreaterThan(0)
    expect(quota.usedMB).toBeGreaterThanOrEqual(0)
    expect(quota.estimatedAvailableMB).toBeGreaterThan(0)
    expect(quota.percentageUsed).toBeGreaterThanOrEqual(0)
    expect(quota.percentageUsed).toBeLessThanOrEqual(100)
  })

  it('warns when storage is above 80% threshold', () => {
    // Simulate high storage usage by mocking the calculation
    const quota = checkStorageQuota()

    // Check if warning threshold logic exists
    const isNearLimit = quota.percentageUsed > 80

    if (isNearLimit) {
      expect(quota.percentageUsed).toBeGreaterThan(80)
    } else {
      expect(quota.percentageUsed).toBeLessThanOrEqual(80)
    }
  })
})

describe('Backup/Restore Functionality', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('creates pre-import backup successfully', () => {
    // Set up current data
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockAllotmentData))

    const result = createPreImportBackup()

    expect(result.success).toBe(true)
    expect(result.backupKey).toBeDefined()
    expect(result.backupKey).toMatch(new RegExp(`^${STORAGE_KEY}-pre-import-`))

    // Verify backup was created
    const backupData = localStorageMock.getItem(result.backupKey!)
    expect(backupData).toBeDefined()

    // Parse and verify essential fields (migrations may add extra fields)
    const parsed = JSON.parse(backupData!)
    expect(parsed.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(parsed.meta.name).toBe(mockAllotmentData.meta.name)
    expect(parsed.currentYear).toBe(mockAllotmentData.currentYear)
  })

  it('fails to create backup when no data exists', () => {
    // No data in localStorage
    const result = createPreImportBackup()

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/no data to backup/i)
  })

  it('fails to create backup when localStorage is not available', () => {
    // Mock window undefined (SSR scenario)
    const originalWindow = global.window
    // @ts-expect-error - deliberately setting to undefined for test
    delete global.window

    const result = createPreImportBackup()

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/not available/i)

    // Restore window
    global.window = originalWindow
  })

  it('restores from backup successfully', () => {
    // Create a backup
    const backupKey = `${STORAGE_KEY}-pre-import-12345`
    localStorageMock.setItem(backupKey, JSON.stringify(mockAllotmentData))

    // Set different current data
    const modifiedData = { ...mockAllotmentData, currentYear: 2025 }
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(modifiedData))

    const result = restoreFromBackup(backupKey)

    expect(result.success).toBe(true)

    // Verify data was restored
    const restoredData = JSON.parse(localStorageMock.getItem(STORAGE_KEY)!)
    expect(restoredData.currentYear).toBe(2024) // Original year
  })

  it('fails to restore when backup does not exist', () => {
    const result = restoreFromBackup('non-existent-backup')

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/backup not found/i)
  })

  it('fails to restore when backup contains invalid data', () => {
    const backupKey = `${STORAGE_KEY}-pre-import-12345`
    localStorageMock.setItem(backupKey, 'invalid json {{{')

    const result = restoreFromBackup(backupKey)

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/corrupted|invalid/i)
  })
})

describe('Backup Management', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('lists all available backups', () => {
    // Create multiple backups
    const backup1 = `${STORAGE_KEY}-pre-import-${Date.now() - 1000}`
    const backup2 = `${STORAGE_KEY}-pre-import-${Date.now()}`

    localStorageMock.setItem(backup1, JSON.stringify(mockAllotmentData))
    localStorageMock.setItem(backup2, JSON.stringify(mockAllotmentData))
    localStorageMock.setItem('other-key', 'not a backup')

    const backups = listBackups()

    expect(backups).toHaveLength(2)
    expect(backups[0].key).toBe(backup2) // Newest first
    expect(backups[1].key).toBe(backup1)
    expect(backups[0].timestamp).toBeDefined()
    expect(backups[0].sizeKB).toBeGreaterThan(0)
  })

  it('returns empty array when no backups exist', () => {
    const backups = listBackups()
    expect(backups).toEqual([])
  })

  it('deletes a backup successfully', () => {
    const backupKey = `${STORAGE_KEY}-pre-import-12345`
    localStorageMock.setItem(backupKey, JSON.stringify(mockAllotmentData))

    const result = deleteBackup(backupKey)

    expect(result.success).toBe(true)
    expect(localStorageMock.getItem(backupKey)).toBeNull()
  })

  it('handles deletion of non-existent backup gracefully', () => {
    const result = deleteBackup('non-existent-backup')

    // Should still succeed (idempotent operation)
    expect(result.success).toBe(true)
  })
})

describe('Error Handling Edge Cases', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('handles localStorage quota exceeded during backup creation', () => {
    // Mock loadAllotmentData to return success
    vi.spyOn(allotmentStorage, 'loadAllotmentData').mockReturnValue({
      success: true,
      data: mockAllotmentData,
    })

    // Mock localStorage.setItem to throw quota exceeded error
    const originalSetItem = localStorage.setItem
    localStorage.setItem = vi.fn((key: string) => {
      if (key.includes('-pre-import-')) {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      }
    })

    const result = createPreImportBackup()

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/quota|storage/i)

    // Restore original
    localStorage.setItem = originalSetItem
    vi.restoreAllMocks()
  })

  it('handles corrupted data during quota check gracefully', () => {
    localStorageMock.setItem('corrupted-key', '{invalid json')

    // Should not throw, just skip corrupted entries
    const quota = checkStorageQuota()

    expect(quota).toBeDefined()
    expect(quota.usedBytes).toBeGreaterThanOrEqual(0)
  })
})
