/**
 * Storage utility functions for quota checking and backup/restore
 *
 * Provides helpers for managing localStorage quota and creating
 * safety backups before risky operations like data import.
 */

import { AllotmentData, STORAGE_KEY } from '@/types/unified-allotment'
import { loadAllotmentData } from '@/services/allotment-storage'

/**
 * Storage quota information
 */
export interface StorageQuota {
  usedBytes: number
  usedKB: number
  usedMB: number
  estimatedAvailableMB: number
  percentageUsed: number
}

/**
 * Backup metadata
 */
export interface BackupInfo {
  key: string
  timestamp: number
  sizeKB: number
}

/**
 * Result of backup operation
 */
export interface BackupResult {
  success: boolean
  backupKey?: string
  error?: string
}

/**
 * Result of restore operation
 */
export interface RestoreResult {
  success: boolean
  error?: string
}

/**
 * Check current localStorage usage
 *
 * Returns information about storage quota usage. Note that localStorage
 * quota is typically 5-10MB depending on the browser.
 */
export function checkStorageQuota(): StorageQuota {
  if (typeof window === 'undefined') {
    return {
      usedBytes: 0,
      usedKB: 0,
      usedMB: 0,
      estimatedAvailableMB: 5,
      percentageUsed: 0,
    }
  }

  // Calculate total bytes used in localStorage
  let totalBytes = 0

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          // Calculate size: key + value + overhead
          totalBytes += key.length + value.length
        }
      }
    }
  } catch (error) {
    // If we can't read localStorage, return safe defaults
    console.error('Failed to calculate storage usage:', error)
  }

  const usedKB = totalBytes / 1024
  const usedMB = usedKB / 1024

  // Most browsers provide 5-10MB for localStorage
  // We'll use a conservative estimate of 5MB
  const estimatedAvailableMB = 5
  const percentageUsed = (usedMB / estimatedAvailableMB) * 100

  return {
    usedBytes: totalBytes,
    usedKB,
    usedMB,
    estimatedAvailableMB,
    percentageUsed: Math.min(percentageUsed, 100), // Cap at 100%
  }
}

/**
 * Create a timestamped backup of current data before import
 *
 * This creates a safety backup that can be restored if the import fails
 * or produces unexpected results.
 */
export function createPreImportBackup(): BackupResult {
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'localStorage not available (running on server)',
    }
  }

  try {
    // Load current data
    const result = loadAllotmentData()
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'No data to backup - cannot create pre-import backup',
      }
    }

    // Create backup key with timestamp
    const backupKey = `${STORAGE_KEY}-pre-import-${Date.now()}`

    // Save backup
    try {
      localStorage.setItem(backupKey, JSON.stringify(result.data))
    } catch (error) {
      // Check if it's a quota error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        return {
          success: false,
          error: 'Storage quota exceeded - cannot create backup. Please free up space.',
        }
      }
      throw error
    }

    console.log(`Created pre-import backup: ${backupKey}`)

    return {
      success: true,
      backupKey,
    }
  } catch (error) {
    console.error('Failed to create pre-import backup:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating backup',
    }
  }
}

/**
 * Restore data from a backup
 *
 * @param backupKey The key of the backup to restore
 */
export function restoreFromBackup(backupKey: string): RestoreResult {
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'localStorage not available (running on server)',
    }
  }

  try {
    // Check if backup exists
    const backupData = localStorage.getItem(backupKey)
    if (!backupData) {
      return {
        success: false,
        error: 'Backup not found - it may have been deleted or expired',
      }
    }

    // Parse and validate backup data
    let parsedData: AllotmentData
    try {
      parsedData = JSON.parse(backupData)
    } catch {
      return {
        success: false,
        error: 'Backup data is corrupted - cannot restore',
      }
    }

    // Restore the backup to main storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData))

    console.log(`Restored data from backup: ${backupKey}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Failed to restore from backup:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error restoring backup',
    }
  }
}

/**
 * List all available backups
 *
 * Returns backups sorted by timestamp (newest first)
 */
export function listBackups(): BackupInfo[] {
  if (typeof window === 'undefined') {
    return []
  }

  const backups: BackupInfo[] = []
  const backupPrefix = `${STORAGE_KEY}-pre-import-`

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(backupPrefix)) {
        const value = localStorage.getItem(key)
        if (value) {
          // Extract timestamp from key
          const timestampStr = key.replace(backupPrefix, '')
          const timestamp = parseInt(timestampStr, 10)

          backups.push({
            key,
            timestamp,
            sizeKB: value.length / 1024,
          })
        }
      }
    }
  } catch (error) {
    console.error('Failed to list backups:', error)
  }

  // Sort by timestamp (newest first)
  return backups.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Delete a backup
 *
 * @param backupKey The key of the backup to delete
 */
export function deleteBackup(backupKey: string): RestoreResult {
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'localStorage not available (running on server)',
    }
  }

  try {
    localStorage.removeItem(backupKey)
    return {
      success: true,
    }
  } catch (error) {
    console.error('Failed to delete backup:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting backup',
    }
  }
}
