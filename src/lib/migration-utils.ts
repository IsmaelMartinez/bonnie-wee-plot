/**
 * Storage Migration Utilities (Issue #5)
 *
 * Provides tools for migrating variety data from separate storage
 * into AllotmentData with backup and rollback capabilities.
 */

import type { AllotmentData, StoredVariety } from '@/types/unified-allotment'
import type { VarietyData } from '@/types/variety-data'
import { STORAGE_KEY } from '@/types/unified-allotment'
import { VARIETY_STORAGE_KEY } from '@/types/variety-data'
import { saveAllotmentData } from '@/services/allotment-storage'

// ============ TYPES ============

export interface DuplicateVariety {
  plantId: string
  normalizedName: string
  allotmentVersion: StoredVariety
  varietyStorageVersion: StoredVariety
}

export interface ConflictResolution {
  plantId: string
  normalizedName: string
  action: 'keep-allotment' | 'keep-variety-storage'
  reason: string
}

export interface MigrationPlan {
  needsMigration: boolean
  varietiesToMerge: StoredVariety[]
  duplicatesFound: DuplicateVariety[]
  conflictResolution: ConflictResolution[]
  totalVarietiesAfterMigration: number
}

export interface MigrationResult {
  success: boolean
  varietiesMerged: number
  duplicatesSkipped: number
  backupKey?: string
  error?: string
}

// ============ HELPERS ============

/**
 * Normalize variety name for duplicate detection
 * Lowercase, trim, and collapse multiple spaces
 */
function normalizeVarietyName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Check if two varieties are duplicates
 * Match by plantId + normalized name
 */
function areDuplicates(v1: StoredVariety, v2: StoredVariety): boolean {
  return (
    v1.plantId === v2.plantId &&
    normalizeVarietyName(v1.name) === normalizeVarietyName(v2.name)
  )
}

/**
 * Create backup keys for migration
 */
function createBackupKeys(): { allotmentKey: string; varietyKey: string } {
  const timestamp = Date.now()
  return {
    allotmentKey: `migration-backup-${timestamp}-allotment`,
    varietyKey: `migration-backup-${timestamp}-varieties`,
  }
}

// ============ DRY RUN ============

/**
 * Analyze what would happen during migration without executing it
 * Returns a detailed plan showing varieties to merge and duplicates found
 */
export function migrateDryRun(allotmentData: AllotmentData): MigrationPlan {
  // Load variety storage directly from localStorage
  const varietyStorageRaw = localStorage.getItem(VARIETY_STORAGE_KEY)

  // If no variety storage exists or is empty, no migration needed
  if (!varietyStorageRaw) {
    return {
      needsMigration: false,
      varietiesToMerge: [],
      duplicatesFound: [],
      conflictResolution: [],
      totalVarietiesAfterMigration: allotmentData.varieties.length,
    }
  }

  let varietyData: VarietyData
  try {
    varietyData = JSON.parse(varietyStorageRaw) as VarietyData
  } catch {
    return {
      needsMigration: false,
      varietiesToMerge: [],
      duplicatesFound: [],
      conflictResolution: [],
      totalVarietiesAfterMigration: allotmentData.varieties.length,
    }
  }

  if (!varietyData.varieties || varietyData.varieties.length === 0) {
    return {
      needsMigration: false,
      varietiesToMerge: [],
      duplicatesFound: [],
      conflictResolution: [],
      totalVarietiesAfterMigration: allotmentData.varieties.length,
    }
  }
  const allotmentVarieties = allotmentData.varieties
  const varietyStorageVarieties = varietyData.varieties

  const varietiesToMerge: StoredVariety[] = []
  const duplicatesFound: DuplicateVariety[] = []
  const conflictResolution: ConflictResolution[] = []

  // Check each variety in variety storage
  for (const varietyStorageItem of varietyStorageVarieties) {
    // Look for duplicates in allotment
    const duplicate = allotmentVarieties.find(allotmentItem =>
      areDuplicates(allotmentItem, varietyStorageItem)
    )

    if (duplicate) {
      // Found a duplicate - will skip this one
      duplicatesFound.push({
        plantId: varietyStorageItem.plantId,
        normalizedName: normalizeVarietyName(varietyStorageItem.name),
        allotmentVersion: duplicate,
        varietyStorageVersion: varietyStorageItem,
      })

      conflictResolution.push({
        plantId: varietyStorageItem.plantId,
        normalizedName: normalizeVarietyName(varietyStorageItem.name),
        action: 'keep-allotment',
        reason: 'Allotment version takes precedence',
      })
    } else {
      // No duplicate - will merge this one
      varietiesToMerge.push(varietyStorageItem)
    }
  }

  return {
    needsMigration: varietyStorageVarieties.length > 0,
    varietiesToMerge,
    duplicatesFound,
    conflictResolution,
    totalVarietiesAfterMigration: allotmentVarieties.length + varietiesToMerge.length,
  }
}

// ============ MIGRATION ============

/**
 * Execute migration with backup and verification
 * Merges varieties from variety storage into AllotmentData
 * Creates backup before migration for rollback capability
 */
export function migrateVarietyStorage(allotmentData: AllotmentData): MigrationResult {
  try {
    // Get migration plan first
    const plan = migrateDryRun(allotmentData)

    if (!plan.needsMigration) {
      return {
        success: true,
        varietiesMerged: 0,
        duplicatesSkipped: 0,
      }
    }

    // Create backups before migration
    const backupKeys = createBackupKeys()

    // Backup allotment data
    const allotmentBackup = localStorage.getItem(STORAGE_KEY)
    if (allotmentBackup) {
      try {
        localStorage.setItem(backupKeys.allotmentKey, allotmentBackup)

        // Verify backup was created successfully
        const verifiedAllotment = localStorage.getItem(backupKeys.allotmentKey)
        if (!verifiedAllotment || verifiedAllotment !== allotmentBackup) {
          return {
            success: false,
            varietiesMerged: 0,
            duplicatesSkipped: 0,
            error: 'Failed to create allotment backup - storage quota may be full',
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          return {
            success: false,
            varietiesMerged: 0,
            duplicatesSkipped: 0,
            error: 'Storage quota exceeded - cannot create backup',
          }
        }
        throw error
      }
    }

    // Backup variety data
    const varietyBackup = localStorage.getItem(VARIETY_STORAGE_KEY)
    if (varietyBackup) {
      try {
        localStorage.setItem(backupKeys.varietyKey, varietyBackup)

        // Verify backup was created successfully
        const verifiedVariety = localStorage.getItem(backupKeys.varietyKey)
        if (!verifiedVariety || verifiedVariety !== varietyBackup) {
          // Clean up partial backup
          localStorage.removeItem(backupKeys.allotmentKey)
          return {
            success: false,
            varietiesMerged: 0,
            duplicatesSkipped: 0,
            error: 'Failed to create variety backup - storage quota may be full',
          }
        }
      } catch (error) {
        // Clean up partial backup
        localStorage.removeItem(backupKeys.allotmentKey)
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          return {
            success: false,
            varietiesMerged: 0,
            duplicatesSkipped: 0,
            error: 'Storage quota exceeded - cannot create backup',
          }
        }
        throw error
      }
    }

    // Merge varieties (keep allotment versions for duplicates)
    const updatedData: AllotmentData = {
      ...allotmentData,
      varieties: [
        ...allotmentData.varieties,
        ...plan.varietiesToMerge,
      ],
      meta: {
        ...allotmentData.meta,
        updatedAt: new Date().toISOString(),
      },
    }

    // Save updated data
    const saveResult = saveAllotmentData(updatedData)
    if (!saveResult.success) {
      // Rollback BOTH storages on save failure
      if (allotmentBackup) {
        localStorage.setItem(STORAGE_KEY, allotmentBackup)
      }
      if (varietyBackup) {
        localStorage.setItem(VARIETY_STORAGE_KEY, varietyBackup)
      } else {
        // If variety storage was empty before, remove it
        localStorage.removeItem(VARIETY_STORAGE_KEY)
      }
      return {
        success: false,
        varietiesMerged: 0,
        duplicatesSkipped: 0,
        error: saveResult.error || 'Failed to save migrated data - rolled back both storages',
      }
    }

    // Verify data persisted correctly
    const verifyData = localStorage.getItem(STORAGE_KEY)
    if (!verifyData) {
      return {
        success: false,
        varietiesMerged: 0,
        duplicatesSkipped: 0,
        error: 'Verification failed: data did not persist',
      }
    }

    const parsed = JSON.parse(verifyData) as AllotmentData
    if (parsed.varieties.length !== plan.totalVarietiesAfterMigration) {
      return {
        success: false,
        varietiesMerged: 0,
        duplicatesSkipped: 0,
        error: 'Verification failed: variety count mismatch',
      }
    }

    return {
      success: true,
      varietiesMerged: plan.varietiesToMerge.length,
      duplicatesSkipped: plan.duplicatesFound.length,
      backupKey: backupKeys.allotmentKey,
    }
  } catch (error) {
    console.error('Migration failed:', error)
    return {
      success: false,
      varietiesMerged: 0,
      duplicatesSkipped: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============ ROLLBACK ============

/**
 * Restore both storages from a backup created during migration
 * Returns both allotment and variety storage to their pre-migration state
 */
export function rollbackMigration(backupKey: string): { success: boolean; error?: string } {
  try {
    // Validate backup key format
    if (!backupKey.startsWith('migration-backup-')) {
      return {
        success: false,
        error: 'Invalid backup key format',
      }
    }

    // Extract timestamp and construct variety backup key
    const timestamp = backupKey.replace('migration-backup-', '').replace('-allotment', '')
    const varietyBackupKey = `migration-backup-${timestamp}-varieties`

    // Check if backups exist
    const allotmentBackup = localStorage.getItem(backupKey)
    const varietyBackup = localStorage.getItem(varietyBackupKey)

    if (!allotmentBackup) {
      return {
        success: false,
        error: 'Allotment backup not found',
      }
    }

    // Restore allotment storage
    localStorage.setItem(STORAGE_KEY, allotmentBackup)

    // Restore variety storage (if it existed)
    if (varietyBackup) {
      localStorage.setItem(VARIETY_STORAGE_KEY, varietyBackup)
    } else {
      // If no variety backup exists, clear variety storage
      localStorage.removeItem(VARIETY_STORAGE_KEY)
    }

    // Verify restoration
    const verifyAllotment = localStorage.getItem(STORAGE_KEY)
    if (!verifyAllotment) {
      return {
        success: false,
        error: 'Verification failed: allotment data not restored',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Rollback failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============ UTILITIES ============

/**
 * List all migration backup keys in localStorage
 */
export function listMigrationBackups(): string[] {
  const backups: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('migration-backup-') && key.endsWith('-allotment')) {
      backups.push(key)
    }
  }

  return backups.sort().reverse() // Most recent first
}

/**
 * Delete a migration backup (both allotment and variety)
 */
export function deleteMigrationBackup(backupKey: string): { success: boolean; error?: string } {
  try {
    if (!backupKey.startsWith('migration-backup-')) {
      return {
        success: false,
        error: 'Invalid backup key format',
      }
    }

    const timestamp = backupKey.replace('migration-backup-', '').replace('-allotment', '')
    const varietyBackupKey = `migration-backup-${timestamp}-varieties`

    localStorage.removeItem(backupKey)
    localStorage.removeItem(varietyBackupKey)

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get backup metadata
 */
export interface BackupMetadata {
  key: string
  timestamp: number
  date: string
  allotmentSize: number
  varietySize: number
}

export function getBackupMetadata(backupKey: string): BackupMetadata | null {
  try {
    const timestampStr = backupKey.replace('migration-backup-', '').replace('-allotment', '')
    const timestamp = parseInt(timestampStr, 10)

    if (isNaN(timestamp)) {
      return null
    }

    const varietyBackupKey = `migration-backup-${timestampStr}-varieties`

    const allotmentBackup = localStorage.getItem(backupKey)
    const varietyBackup = localStorage.getItem(varietyBackupKey)

    return {
      key: backupKey,
      timestamp,
      date: new Date(timestamp).toISOString(),
      allotmentSize: allotmentBackup?.length || 0,
      varietySize: varietyBackup?.length || 0,
    }
  } catch {
    return null
  }
}
