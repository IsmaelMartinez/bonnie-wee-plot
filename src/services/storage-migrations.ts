/**
 * Storage Migrations
 *
 * Schema migration logic for AllotmentData. Only v17 and v18 migrations
 * are supported — data on v16 or earlier requires a fresh start.
 * Minimum supported version: 16.
 */

import {
  AllotmentData,
  Planting,
  SeasonRecord,
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
} from '@/types/unified-allotment'
import { logger } from '@/lib/logger'

import type { StorageResult } from '@/types/unified-allotment'

export const MINIMUM_SUPPORTED_VERSION = 16

/**
 * Create a backup before migration for recovery
 * Stored with version suffix to allow multiple backups
 */
export function createMigrationBackup(data: AllotmentData): void {
  const backupKey = `${STORAGE_KEY}-backup-v${data.version}`
  try {
    localStorage.setItem(backupKey, JSON.stringify(data))
    logger.info('Created migration backup', { backupKey })
  } catch (error) {
    logger.warn('Failed to create migration backup', { backupKey, error: String(error) })
  }
}

/**
 * Restore from backup if available
 */
export function restoreFromBackup(version: number): StorageResult<AllotmentData> {
  const backupKey = `${STORAGE_KEY}-backup-v${version}`
  try {
    const backup = localStorage.getItem(backupKey)
    if (!backup) {
      return { success: false, error: `No backup found for version ${version}` }
    }
    const data = JSON.parse(backup) as AllotmentData
    return { success: true, data }
  } catch (error) {
    logger.error('Failed to restore from backup', { version, error: String(error) })
    return { success: false, error: 'Failed to restore backup' }
  }
}

/**
 * List available backup versions
 */
export function getAvailableBackups(): number[] {
  const backups: number[] = []
  const prefix = `${STORAGE_KEY}-backup-v`
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(prefix)) {
      const version = parseInt(key.slice(prefix.length), 10)
      if (!isNaN(version)) {
        backups.push(version)
      }
    }
  }
  return backups.sort((a, b) => b - a)
}

/**
 * Migrate data from older schema versions to current version
 * Exported for use by import/migration processes
 */
export function migrateSchemaForImport(data: AllotmentData): AllotmentData {
  return migrateSchema(data)
}

/**
 * Migrate data from older schema versions.
 * Only supports v16+ — older data requires a fresh start.
 */
export function migrateSchema(data: AllotmentData): AllotmentData {
  if (data.version < MINIMUM_SUPPORTED_VERSION) {
    logger.error('Data version too old for migration', {
      version: data.version,
      minimum: MINIMUM_SUPPORTED_VERSION,
    })
    throw new Error(
      `Data schema version ${data.version} is too old. Minimum supported version is ${MINIMUM_SUPPORTED_VERSION}. Please export your data and start fresh.`
    )
  }

  // Create backup before any migration
  if (data.version < CURRENT_SCHEMA_VERSION) {
    createMigrationBackup(data)
  }

  const migrated = { ...data }

  // Version 16 -> 17: Add customTasks array
  if (migrated.version < 17) {
    migrated.customTasks = migrated.customTasks || []
    migrated.version = 17
    logger.info('Schema migration complete', { from: 16, to: 17, change: 'added customTasks for free-form user tasks' })
    return migrateSchema(migrated)
  }

  // Version 17 -> 18: Integrate compost data into AllotmentData
  if (migrated.version < 18) {
    const v18Data = migrateToV18(migrated)
    v18Data.version = 18
    logger.info('Schema migration complete', { from: 17, to: 18, change: 'integrated compost data into AllotmentData' })
    return migrateSchema(v18Data)
  }

  // Version 18 -> 19: Added 'water' CareLogType and coordinates for weather-aware watering.
  // No data transform needed — all new fields are optional.
  if (migrated.version < 19) {
    migrated.version = 19
    logger.info('Schema migration complete', { from: 18, to: 19, change: 'added water care log type and coordinates for weather-aware watering' })
    return migrateSchema(migrated)
  }

  // Version 19 -> 20: Repair planting status drift. Earlier versions of
  // updatePlanting did a plain merge so plantings created without a sowDate
  // (status='planned') and later edited to add a sowDate kept status='planned'.
  // This excluded them from watering reminders. Walk every planting and
  // promote stale 'planned' rows to 'active' / 'harvested' based on dates.
  if (migrated.version < 20) {
    const v20Data = migrateToV20(migrated)
    v20Data.version = 20
    logger.info('Schema migration complete', { from: 19, to: 20, change: 'repaired planting status drift for plantings with sow dates' })
    return migrateSchema(v20Data)
  }

  migrated.version = CURRENT_SCHEMA_VERSION
  return migrated
}

/**
 * Migrate from v19 to v20: Repair planting status drift.
 *
 * Walks every planting in every season and re-derives status from dates when
 * the stored status is missing or stuck on 'planned' despite the planting
 * having a sowDate / transplantDate / actualHarvestEnd. 'removed' is preserved
 * (the user explicitly marked it removed). Other statuses are left alone.
 */
function migrateToV20(data: AllotmentData): AllotmentData {
  let repaired = 0
  const seasons = data.seasons.map(season => ({
    ...season,
    areas: (season.areas || []).map(area => ({
      ...area,
      plantings: (area.plantings || []).map(p => {
        if (p.status === 'removed') return p
        const hasDates = !!p.sowDate || !!p.transplantDate
        const hasHarvestEnd = !!p.actualHarvestEnd
        if (!hasDates && !hasHarvestEnd) return p
        const inferred = hasHarvestEnd ? 'harvested' : 'active'
        if (p.status === inferred) return p
        // Only auto-correct undefined or stale 'planned'
        if (p.status !== undefined && p.status !== 'planned') return p
        repaired++
        return { ...p, status: inferred as Planting['status'] }
      }),
    })),
  }))

  if (repaired > 0) {
    logger.info('v20 migration: repaired planting statuses', { count: repaired })
  }

  return { ...data, seasons }
}

/**
 * Migrate from v17 to v18: Integrate compost data into AllotmentData
 * Reads from the old separate `compost-data` localStorage key, extracts
 * the piles array, and stores it in `data.compost`. Removes the old key.
 */
function migrateToV18(data: AllotmentData): AllotmentData {
  const migrated = { ...data }
  migrated.compost = migrated.compost || []

  // Pull in compost piles from the old separate localStorage key
  if (typeof window !== 'undefined') {
    try {
      const oldCompostRaw = localStorage.getItem('compost-data')
      if (oldCompostRaw) {
        const oldCompost = JSON.parse(oldCompostRaw)
        if (oldCompost && Array.isArray(oldCompost.piles) && oldCompost.piles.length > 0) {
          migrated.compost = oldCompost.piles
        }
        localStorage.removeItem('compost-data')
        logger.info('v18 migration: migrated compost piles from separate storage', { pileCount: (migrated.compost || []).length })
      }
    } catch (e) {
      logger.warn('v18 migration: failed to read old compost-data', { error: String(e) })
    }
  }

  logger.info('v18 migration: integrated compost data into AllotmentData')
  return migrated
}

// ============ LEGACY DATA MIGRATION ============

/**
 * Check if migration from legacy data is needed
 */
export function needsLegacyMigration(): boolean {
  if (typeof window === 'undefined') return false

  const stored = localStorage.getItem(STORAGE_KEY)
  return !stored
}

/**
 * Create initial AllotmentData for fresh installation
 * Starts completely empty - users add areas through the UI
 */
export function migrateFromLegacyData(): AllotmentData {
  const now = new Date().toISOString()
  const currentYear = new Date().getFullYear()

  // Create a single empty season for the current year
  const currentSeason: SeasonRecord = {
    year: currentYear,
    status: 'current',
    areas: [], // No areas yet - completely empty start
    createdAt: now,
    updatedAt: now,
  }

  const freshData: AllotmentData = {
    version: CURRENT_SCHEMA_VERSION,
    meta: {
      name: 'My Allotment',
      location: 'Edinburgh, Scotland',
      createdAt: now,
      updatedAt: now,
    },
    layout: {
      areas: [], // No areas - users add via AddAreaForm
    },
    seasons: [currentSeason],
    currentYear,
    varieties: [], // Empty - users add via Seeds page
    maintenanceTasks: [], // Empty - no perennials yet
    gardenEvents: [], // Empty - users add as needed
    compost: [], // Empty - users add via Compost page
  }

  return freshData
}
