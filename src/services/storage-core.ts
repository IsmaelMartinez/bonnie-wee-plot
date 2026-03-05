/**
 * Storage Core
 *
 * Core localStorage operations for the main allotment data blob.
 * This is the only module that directly touches localStorage for the main data.
 */

import {
  AllotmentData,
  StorageResult,
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
} from '@/types/unified-allotment'
import { isLocalStorageAvailable, getStorageUnavailableMessage } from '@/lib/storage-detection'
import { isQuotaExceededError } from '@/lib/storage-ops'
import { logger } from '@/lib/logger'
import { validateAllotmentData, attemptDataRepair } from './storage-validation'
import { migrateSchema, migrateFromLegacyData, MINIMUM_SUPPORTED_VERSION } from './storage-migrations'
import { ensureCurrentYearSeason } from './season-operations'

/**
 * Calculate approximate size of data in bytes
 */
function getDataSizeBytes(data: AllotmentData): number {
  try {
    return new Blob([JSON.stringify(data)]).size
  } catch {
    return JSON.stringify(data).length * 2 // Rough estimate: 2 bytes per char
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Load allotment data from localStorage
 * Includes schema validation and repair attempts
 */
export function loadAllotmentData(): StorageResult<AllotmentData> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  // Check localStorage availability
  if (!isLocalStorageAvailable()) {
    const message = getStorageUnavailableMessage()
    return { success: false, error: message }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      // No data exists - will need to migrate from legacy or create fresh
      return { success: false, error: 'No data found' }
    }

    let data: unknown
    try {
      data = JSON.parse(stored)
    } catch (parseError) {
      logger.error('Failed to parse stored JSON', { error: String(parseError) })
      return { success: false, error: 'Corrupted data: invalid JSON' }
    }

    // Validate the parsed data
    const validation = validateAllotmentData(data)

    if (!validation.valid) {
      logger.warn('Schema validation failed', { errors: validation.errors })

      // Attempt to repair
      const repaired = attemptDataRepair(data)
      if (repaired) {
        logger.info('Data repaired successfully')
        saveAllotmentData(repaired)
        return { success: true, data: repaired }
      }

      return {
        success: false,
        error: `Invalid data schema: ${validation.errors.join(', ')}`
      }
    }

    const validData = data as AllotmentData

    // Reject data that's too old for our supported migration path
    if (validData.version < MINIMUM_SUPPORTED_VERSION) {
      return {
        success: false,
        error: `Data schema version ${validData.version} is too old. Minimum supported is v${MINIMUM_SUPPORTED_VERSION}. Please export and start fresh.`
      }
    }

    // Check version and migrate if needed
    if (validData.version !== CURRENT_SCHEMA_VERSION) {
      const migrated = migrateSchema(validData)
      saveAllotmentData(migrated)
      return { success: true, data: migrated }
    }

    // Auto-update currentYear if it's in the past
    const actualCurrentYear = new Date().getFullYear()
    if (validData.currentYear < actualCurrentYear) {
      logger.info('Updating stale currentYear', { from: validData.currentYear, to: actualCurrentYear })
      const updatedData = ensureCurrentYearSeason(validData, actualCurrentYear)
      const saveResult = saveAllotmentData(updatedData)
      if (!saveResult.success) {
        logger.error('Failed to persist auto-updated currentYear', { error: saveResult.error })
        return { success: false, error: saveResult.error ?? 'Failed to persist auto-updated current year data' }
      }
      return { success: true, data: updatedData }
    }

    return { success: true, data: validData }
  } catch (error) {
    logger.error('Failed to load allotment data', { error: String(error) })
    return { success: false, error: 'Failed to load stored data' }
  }
}

/**
 * Save allotment data to localStorage
 * Handles quota exceeded errors gracefully
 */
export function saveAllotmentData(data: AllotmentData): StorageResult<void> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  // Check localStorage availability
  if (!isLocalStorageAvailable()) {
    const message = getStorageUnavailableMessage()
    return { success: false, error: message }
  }

  try {
    // Update the updatedAt timestamp
    const dataToSave: AllotmentData = {
      ...data,
      meta: {
        ...data.meta,
        updatedAt: new Date().toISOString(),
      },
    }

    const jsonString = JSON.stringify(dataToSave)

    try {
      localStorage.setItem(STORAGE_KEY, jsonString)
      return { success: true }
    } catch (error) {
      if (isQuotaExceededError(error)) {
        const dataSize = formatBytes(getDataSizeBytes(dataToSave))
        logger.error('localStorage quota exceeded', { dataSize })

        return {
          success: false,
          error: `Storage quota exceeded (data size: ${dataSize}). Consider exporting and clearing old seasons.`
        }
      }
      throw error // Re-throw if not quota error
    }
  } catch (error) {
    logger.error('Failed to save allotment data', { error: String(error) })
    return { success: false, error: 'Failed to save data' }
  }
}

/**
 * Get current localStorage usage statistics
 */
export function getStorageStats(): { used: string; dataSize: string } | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const dataSize = stored ? formatBytes(stored.length * 2) : '0 B'

    // Estimate total localStorage usage
    let totalUsed = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        totalUsed += localStorage.getItem(key)?.length ?? 0
      }
    }

    return {
      used: formatBytes(totalUsed * 2),
      dataSize,
    }
  } catch {
    return null
  }
}

/**
 * Clear all allotment data (use with caution!)
 */
export function clearAllotmentData(): StorageResult<void> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to clear data' }
  }
}

/**
 * Initialize storage with legacy data if empty
 * Returns the loaded or migrated data
 */
export function initializeStorage(): StorageResult<AllotmentData> {
  // Try to load existing data first
  const loadResult = loadAllotmentData()

  if (loadResult.success && loadResult.data) {
    return loadResult
  }

  // No existing data - migrate from legacy
  const migratedData = migrateFromLegacyData()
  const saveResult = saveAllotmentData(migratedData)

  if (!saveResult.success) {
    return { success: false, error: 'Failed to save migrated data' }
  }

  return { success: true, data: migratedData }
}
