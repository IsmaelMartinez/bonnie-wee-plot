/**
 * Allotment Storage Service
 * 
 * Handles all localStorage operations for the unified allotment data.
 * Single source of truth for persisting allotment state.
 */

import {
  AllotmentData,
  SeasonRecord,
  AreaSeason,
  Planting,
  NewPlanting,
  PlantingUpdate,
  NewSeasonInput,
  StorageResult,
  MaintenanceTask,
  NewMaintenanceTask,
  AreaNote,
  NewAreaNote,
  AreaNoteUpdate,
  GardenEvent,
  NewGardenEvent,
  StoredVariety,
  NewVariety,
  VarietyUpdate,
  SeedStatus,
  AllotmentItemRef,
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
  // v10 unified Area type
  Area,
  AreaKind,
  GridPosition,
  CareLogEntry,
  NewCareLogEntry,
  // Legacy types for migration compatibility
  BedSeason,
  BedArea,
  PermanentArea,
  InfrastructureArea,
  LegacyArea,
  PermanentUnderplanting,
  PermanentSeason,
} from '@/types/unified-allotment'
import { RotationGroup, PermanentPlanting, InfrastructureItem, PhysicalBedId } from '@/types/garden-planner'
import { generateId } from '@/lib/utils'
import { getNextRotationGroup } from '@/lib/rotation'
import { DEFAULT_GRID_LAYOUT } from '@/data/allotment-layout'
import { isLocalStorageAvailable, getStorageUnavailableMessage } from '@/lib/storage-detection'
import { logger } from '@/lib/logger'
// Note: variety-allotment-sync.ts removed - varieties now embedded in AllotmentData

// Import legacy data for migration (empty arrays for fresh start, but needed for old data migrations)
import { permanentPlantings, infrastructure } from '@/data/allotment-layout'

// ============ SCHEMA VALIDATION ============

interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate that data conforms to the AllotmentData schema
 * Returns detailed errors for debugging
 * Exported for use in multi-tab sync validation
 */
export function validateAllotmentData(data: unknown): ValidationResult {
  const errors: string[] = []
  
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data is not an object'] }
  }
  
  const obj = data as Record<string, unknown>
  
  // Check required top-level fields
  if (typeof obj.version !== 'number') {
    errors.push('Missing or invalid "version" field (expected number)')
  }
  
  if (typeof obj.currentYear !== 'number') {
    errors.push('Missing or invalid "currentYear" field (expected number)')
  }
  
  // Validate meta
  if (!obj.meta || typeof obj.meta !== 'object') {
    errors.push('Missing or invalid "meta" field (expected object)')
  } else {
    const meta = obj.meta as Record<string, unknown>
    if (typeof meta.name !== 'string') {
      errors.push('Missing or invalid "meta.name" field (expected string)')
    }
  }
  
  // Validate layout - v10 uses areas array only
  if (!obj.layout || typeof obj.layout !== 'object') {
    errors.push('Missing or invalid "layout" field (expected object)')
  } else {
    const layout = obj.layout as Record<string, unknown>
    const hasAreasArray = Array.isArray(layout.areas)

    // v10 requires areas array (can be empty for new allotments)
    if (!hasAreasArray) {
      // Check for legacy format (v9 and earlier)
      const hasLegacyArrays = Array.isArray(layout.beds) &&
                             Array.isArray(layout.permanentPlantings) &&
                             Array.isArray(layout.infrastructure)
      if (!hasLegacyArrays) {
        errors.push('Layout must have "areas" array (v10) or legacy arrays (v9 and earlier)')
      }
    }

    // Validate areas array if present
    if (hasAreasArray) {
      const areas = layout.areas as unknown[]
      const seenIds = new Set<string>()
      const validKinds = ['rotation-bed', 'perennial-bed', 'tree', 'berry', 'herb', 'infrastructure', 'other']
      // Also accept legacy v9 types for migration
      const validLegacyTypes = ['bed', 'permanent', 'infrastructure']

      areas.forEach((area, index) => {
        if (!area || typeof area !== 'object') {
          errors.push(`Area at index ${index} is not an object`)
          return
        }
        const a = area as Record<string, unknown>

        // Validate required fields
        if (typeof a.id !== 'string') {
          errors.push(`Area at index ${index}: missing or invalid "id" field`)
        } else {
          if (seenIds.has(a.id)) {
            errors.push(`Area at index ${index}: duplicate id "${a.id}"`)
          }
          seenIds.add(a.id)
        }

        if (typeof a.name !== 'string') {
          errors.push(`Area at index ${index}: missing or invalid "name" field`)
        }

        // Accept either v10 'kind' or v9 'type' for migration compatibility
        const hasKind = validKinds.includes(a.kind as string)
        const hasLegacyType = validLegacyTypes.includes(a.type as string)
        if (!hasKind && !hasLegacyType) {
          errors.push(`Area at index ${index}: must have valid "kind" (v10) or "type" (v9)`)
        }
      })
    }
  }

  // Validate seasons
  if (!Array.isArray(obj.seasons)) {
    errors.push('Missing or invalid "seasons" field (expected array)')
  } else {
    // Validate each season - accept either v10 'areas' or v9 'beds'
    (obj.seasons as unknown[]).forEach((season, index) => {
      if (!season || typeof season !== 'object') {
        errors.push(`Season at index ${index} is not an object`)
        return
      }
      const s = season as Record<string, unknown>
      if (typeof s.year !== 'number') {
        errors.push(`Season at index ${index}: missing or invalid "year" field`)
      }
      // Accept either v10 'areas' or v9 'beds'
      if (!Array.isArray(s.areas) && !Array.isArray(s.beds)) {
        errors.push(`Season at index ${index}: must have "areas" (v10) or "beds" (v9) array`)
      }
    })
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Attempt to repair common data issues
 * Returns repaired data or null if unrepairable
 * v10: Uses unified Area system
 */
function attemptDataRepair(data: unknown): AllotmentData | null {
  if (!data || typeof data !== 'object') return null

  const obj = data as Record<string, unknown>

  try {
    const layout = obj.layout && typeof obj.layout === 'object' ? obj.layout as Record<string, unknown> : {}

    // Ensure required fields have defaults
    const repaired: AllotmentData = {
      version: typeof obj.version === 'number' ? obj.version : CURRENT_SCHEMA_VERSION,
      currentYear: typeof obj.currentYear === 'number' ? obj.currentYear : new Date().getFullYear(),
      meta: {
        name: 'My Allotment',
        location: 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(obj.meta && typeof obj.meta === 'object' ? obj.meta as object : {}),
      },
      layout: {
        // v10 only needs areas array
        areas: Array.isArray(layout.areas) ? layout.areas as Area[] : [],
      },
      seasons: Array.isArray(obj.seasons) ? obj.seasons as AllotmentData['seasons'] : [],
      varieties: Array.isArray(obj.varieties) ? obj.varieties as AllotmentData['varieties'] : [],
    }

    // Validate the repaired data
    const validation = validateAllotmentData(repaired)
    if (validation.valid) {
      console.warn('Data was repaired with defaults')
      return repaired
    }

    return null
  } catch {
    return null
  }
}

// ============ CORE STORAGE OPERATIONS ============

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
      console.warn('Schema validation failed:', validation.errors)
      
      // Attempt to repair
      const repaired = attemptDataRepair(data)
      if (repaired) {
        console.log('Data repaired successfully')
        saveAllotmentData(repaired)
        return { success: true, data: repaired }
      }
      
      return { 
        success: false, 
        error: `Invalid data schema: ${validation.errors.join(', ')}` 
      }
    }
    
    const validData = data as AllotmentData

    // Check for incomplete migration and resume if needed
    if (validData.meta.migrationState) {
      console.log(`Detected incomplete migration to v${validData.meta.migrationState.targetVersion}, resuming...`)
      const migrated = migrateSchema(validData)
      const cleaned = clearMigrationState(migrated)
      saveAllotmentData(cleaned)
      return { success: true, data: cleaned }
    }

    // Check version and migrate if needed
    if (validData.version !== CURRENT_SCHEMA_VERSION) {
      const migrated = migrateSchema(validData)
      const cleaned = clearMigrationState(migrated)
      saveAllotmentData(cleaned)
      return { success: true, data: cleaned }
    }

    // Ensure areas is populated (v10 unified system)
    if (!validData.layout.areas || validData.layout.areas.length === 0) {
      console.log('Repairing: populating empty areas from default layout')
      // Re-run migration to populate areas
      const repaired = migrateSchema({ ...validData, version: 1 })
      saveAllotmentData(repaired)
      return { success: true, data: repaired }
    }

    return { success: true, data: validData }
  } catch (error) {
    logger.error('Failed to load allotment data', { error: String(error) })
    return { success: false, error: 'Failed to load stored data' }
  }
}

/**
 * Check if an error is a quota exceeded error
 */
function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // Most browsers
    if (error.code === 22 || error.name === 'QuotaExceededError') {
      return true
    }
    // Firefox
    if (error.code === 1014 || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return true
    }
  }
  return false
}

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

// ============ SCHEMA MIGRATION ============

/**
 * Create a backup before migration for recovery
 * Stored with version suffix to allow multiple backups
 */
function createMigrationBackup(data: AllotmentData): void {
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
 * Clear migration state after successful completion
 */
function clearMigrationState(data: AllotmentData): AllotmentData {
  if (!data.meta.migrationState) return data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { migrationState, ...cleanMeta } = data.meta
  return { ...data, meta: cleanMeta }
}

/**
 * Migrate data from older schema versions
 *
 * NOTE: This function works with legacy data formats.
 * TypeScript checks are bypassed using 'any' because we're
 * transforming data from older schemas to the current format.
 */
function migrateSchema(data: AllotmentData): AllotmentData {
  // Create backup before any migration
  if (data.version < CURRENT_SCHEMA_VERSION) {
    createMigrationBackup(data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migrated = { ...data } as any

  // Version 1 -> 2: Add maintenance tasks array
  if (migrated.version < 2) {
    migrated.maintenanceTasks = migrated.maintenanceTasks || []
    console.log('Migrated to schema v2: added maintenanceTasks')
  }

  // Version 2 -> 3: Add notes array to BedSeason (no action needed, notes is optional)
  if (migrated.version < 3) {
    console.log('Migrated to schema v3: bed notes support added')
  }

  // Version 3 -> 4: Migrate problemNotes from layout.beds to BedNotes for 2025
  if (migrated.version < 4) {
    const now = new Date().toISOString()
    const problemNotesMap: Record<string, string> = {
      'C': 'Too shaded by apple tree. Peas did poorly. Consider shade-tolerant perennials like asparagus or rhubarb expansion.',
      'E': 'French beans + sunflowers competition failed. Retry with just beans or consider perennials.',
      'raspberries': 'Area is too large - plan to reduce and reclaim space for rotation beds.',
    }

    // Add notes to 2025 season beds (working with legacy data structure)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacyMigrated = migrated as any
    legacyMigrated.seasons = legacyMigrated.seasons.map((season: { year: number; beds?: Array<{ bedId: string; notes?: unknown[] }> }) => {
      if (season.year !== 2025) return season
      if (!season.beds) return season

      return {
        ...season,
        beds: season.beds.map((bed: { bedId: string; notes?: unknown[] }) => {
          const problemNote = problemNotesMap[bed.bedId]
          if (!problemNote) return bed

          // Only add if no notes exist yet
          if (bed.notes && bed.notes.length > 0) return bed

          return {
            ...bed,
            notes: [{
              id: generateId('note'),
              content: problemNote,
              type: 'warning' as const,
              createdAt: now,
              updatedAt: now,
            }],
          }
        }),
      }
    })

    // Remove problemNotes from layout.beds (create new objects without the field)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacyLayout = legacyMigrated.layout as any
    if (legacyLayout.beds) {
      legacyMigrated.layout = {
        ...legacyLayout,
        beds: legacyLayout.beds.map(({ id, name, description, status, rotationGroup }: { id: string; name: string; description?: string; status: string; rotationGroup?: string }) => ({
          id, name, description, status, rotationGroup,
        })),
      }
    }

    console.log('Migrated to schema v4: problemNotes converted to BedNotes for 2025')
  }

  // Version 4 -> 5: Add gardenEvents array
  if (migrated.version < 5) {
    migrated.gardenEvents = migrated.gardenEvents || []
    console.log('Migrated to schema v5: added gardenEvents')
  }

  // Version 5 -> 6: Add varieties array (consolidated from separate storage)
  if (migrated.version < 6) {
    migrated.varieties = migrated.varieties || []
    console.log('Migrated to schema v6: added varieties')
  }

  // Version 6 -> 7: Add plantId to permanent plantings for vegetable database lookup
  if (migrated.version < 7) {
    // Map permanent planting IDs to vegetable database IDs
    const PERMANENT_TO_PLANT_ID: Record<string, string> = {
      'apple-north': 'apple-tree',
      'apple-south-west': 'apple-tree',
      'apple-south': 'apple-tree',
      'cherry-tree': 'cherry-tree',
      'damson': 'damson-tree',
      'raspberries-main': 'raspberry',
      'blueberry': 'blueberry',
      'gooseberry': 'gooseberry',
      'blackcurrant': 'blackcurrant',
      'rhubarb': 'rhubarb',
      'strawberries-damson': 'strawberry',
      'strawberries-b1prime': 'strawberry',
      'oregano': 'oregano',
      'herbs-shed': 'mixed-herbs',
    }

    // If permanentPlantings is empty, populate from default layout
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v7Layout = migrated.layout as any
    if (!v7Layout.permanentPlantings || v7Layout.permanentPlantings.length === 0) {
      v7Layout.permanentPlantings = permanentPlantings.map(planting => {
        const plantId = PERMANENT_TO_PLANT_ID[planting.id]
        return plantId ? { ...planting, plantId } : planting
      })
      console.log('Migrated to schema v7: populated permanentPlantings from default layout')
    } else {
      // Add plantId to existing permanentPlantings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      v7Layout.permanentPlantings = v7Layout.permanentPlantings.map((planting: any) => {
        const plantId = PERMANENT_TO_PLANT_ID[planting.id]
        return plantId ? { ...planting, plantId } : planting
      })
      console.log('Migrated to schema v7: added plantId to permanent plantings')
    }

    // If infrastructure is empty, populate from default layout
    if (!v7Layout.infrastructure || v7Layout.infrastructure.length === 0) {
      v7Layout.infrastructure = infrastructure
      console.log('Migrated to schema v7: populated infrastructure from default layout')
    }
  }

  // Version 8 -> 9: Unified Area System with underplantings and care logging
  if (migrated.version < 9) {
    const v9Data = migrateToV9(migrated)
    // Continue to v10 migration
    const v10Data = migrateToV10(v9Data)
    v10Data.version = CURRENT_SCHEMA_VERSION
    console.log('Migrated to schema v10: unified Area type with dynamic add/remove')
    return v10Data
  }

  // Version 9 -> 10: Simplified unified Area type
  if (migrated.version < 10) {
    const v10Data = migrateToV10(migrated)
    v10Data.version = 10
    console.log('Migrated to schema v10: unified Area type with dynamic add/remove')
    // Continue to v11 migration
    return migrateSchema(v10Data)
  }

  // Version 10 -> 11: Synchronize plant IDs (plural to singular)
  if (migrated.version < 11) {
    const v11Data = migrateToV11(migrated)
    v11Data.version = CURRENT_SCHEMA_VERSION
    console.log('Migrated to schema v11: synchronized plant IDs')
    return v11Data
  }

  migrated.version = CURRENT_SCHEMA_VERSION
  return migrated
}

/**
 * Migrate from v8 to v9: Unified Area System
 * - Converts beds, permanentPlantings, infrastructure to unified areas array
 * - Detects existing underplantings (strawberries-damson)
 * - Initializes PermanentSeason for each permanent area in each year
 */
function migrateToV9(data: AllotmentData): AllotmentData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migrated = { ...data } as any

  // Map permanent planting types to PermanentArea plantingType
  const TYPE_MAP: Record<string, PermanentArea['plantingType']> = {
    'fruit-tree': 'fruit-tree',
    'berry': 'berry',
    'perennial-veg': 'perennial-veg',
    'herb': 'herb',
  }

  // Convert beds to BedArea (legacy arrays are optional in v9+)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bedAreas: BedArea[] = (migrated.layout.beds || []).map((bed: any) => ({
    id: bed.id,
    type: 'bed' as const,
    name: bed.name,
    description: bed.description,
    status: bed.status,
    rotationGroup: bed.rotationGroup,
    gridPosition: bed.gridPosition,
  }))

  // Convert permanentPlantings to PermanentArea
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const permanentAreas: PermanentArea[] = (migrated.layout.permanentPlantings || []).map((p: any) => ({
    id: p.id,
    type: 'permanent' as const,
    name: p.name,
    description: p.notes,
    plantingType: TYPE_MAP[p.type] || 'perennial-veg',
    plantId: p.plantId,
    variety: p.variety,
    plantedYear: p.plantedYear,
    gridPosition: p.gridPosition ? {
      startRow: p.gridPosition.row,
      startCol: p.gridPosition.col,
      endRow: p.gridPosition.row,
      endCol: p.gridPosition.col,
    } : undefined,
  }))

  // Convert infrastructure to InfrastructureArea
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const infrastructureAreas: InfrastructureArea[] = (migrated.layout.infrastructure || []).map((i: any) => ({
    id: i.id,
    type: 'infrastructure' as const,
    name: i.name,
    infrastructureType: i.type,
    gridPosition: i.gridPosition,
  }))

  // Combine all areas (v9 LegacyArea format)
  const areas: LegacyArea[] = [...bedAreas, ...permanentAreas, ...infrastructureAreas]

  // Detect underplantings from existing data
  // strawberries-damson is a separate permanent planting but should be an underplanting of damson
  const permanentUnderplantings: PermanentUnderplanting[] = []
  const UNDERPLANTING_PATTERNS: Array<{ childId: string; parentId: string; plantId: string }> = [
    { childId: 'strawberries-damson', parentId: 'damson', plantId: 'strawberry' },
  ]

  for (const pattern of UNDERPLANTING_PATTERNS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const child = (migrated.layout.permanentPlantings || []).find((p: any) => p.id === pattern.childId)
    if (child) {
      permanentUnderplantings.push({
        id: generateId('underplanting'),
        parentAreaId: pattern.parentId,
        plantId: pattern.plantId,
        variety: child.variety,
        plantedYear: child.plantedYear,
        notes: child.notes,
      })
    }
  }

  // Initialize PermanentSeason for each permanent area in each existing year
  const permanentAreaIds = permanentAreas.map(a => a.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrated.seasons = migrated.seasons.map((season: any) => ({
    ...season,
    permanents: permanentAreaIds.map(areaId => ({
      areaId,
      careLogs: [],
      underplantings: [],
    })),
  }))

  // Update layout with v9 format (areas as LegacyArea[])
  migrated.layout = {
    areas,
    permanentUnderplantings,
  }

  return migrated as AllotmentData
}

/**
 * Migrate from v9 to v10: Simplified unified Area type
 * - Converts BedArea/PermanentArea/InfrastructureArea to single Area with 'kind'
 * - Converts SeasonRecord.beds + permanents to single 'areas' array
 * - All areas can now have plantings
 */
function migrateToV10(data: AllotmentData): AllotmentData {
  const migrated = { ...data }

  // Map v9 area types to v10 AreaKind
  function convertLegacyAreaToV10(legacyArea: LegacyArea): Area {
    const base = {
      id: legacyArea.id,
      name: legacyArea.name,
      description: legacyArea.description,
      createdAt: new Date().toISOString(),
    }

    // Convert grid position if present
    let gridPosition: GridPosition | undefined
    if (legacyArea.gridPosition) {
      const gp = legacyArea.gridPosition
      gridPosition = {
        x: 'startCol' in gp ? gp.startCol : 0,
        y: 'startRow' in gp ? gp.startRow : 0,
        w: 'endCol' in gp && 'startCol' in gp ? gp.endCol - gp.startCol + 1 : 2,
        h: 'endRow' in gp && 'startRow' in gp ? gp.endRow - gp.startRow + 1 : 2,
      }
    }

    // If no gridPosition from legacy data, seed from DEFAULT_GRID_LAYOUT
    if (!gridPosition) {
      const defaultItem = DEFAULT_GRID_LAYOUT.find(item => item.i === legacyArea.id)
      if (defaultItem) {
        gridPosition = {
          x: defaultItem.x,
          y: defaultItem.y,
          w: defaultItem.w,
          h: defaultItem.h,
        }
      }
    }

    if (legacyArea.type === 'bed') {
      const bed = legacyArea as BedArea
      return {
        ...base,
        kind: bed.status === 'perennial' ? 'perennial-bed' : 'rotation-bed',
        canHavePlantings: true,
        rotationGroup: bed.rotationGroup,
        gridPosition,
      }
    }

    if (legacyArea.type === 'permanent') {
      const perm = legacyArea as PermanentArea
      // Map plantingType to AreaKind
      const kindMap: Record<string, AreaKind> = {
        'fruit-tree': 'tree',
        'berry': 'berry',
        'perennial-veg': 'perennial-bed',
        'herb': 'herb',
      }
      return {
        ...base,
        kind: kindMap[perm.plantingType] || 'other',
        canHavePlantings: true,
        primaryPlant: perm.plantId ? {
          plantId: perm.plantId,
          variety: perm.variety,
          plantedYear: perm.plantedYear,
        } : undefined,
        gridPosition,
      }
    }

    // Infrastructure
    const infra = legacyArea as InfrastructureArea
    return {
      ...base,
      kind: 'infrastructure',
      canHavePlantings: true, // v10: all areas can have plantings!
      infrastructureSubtype: infra.infrastructureType,
      gridPosition,
    }
  }

  // Convert layout areas from v9 to v10
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyAreas = ((migrated.layout as any).areas || []) as LegacyArea[]
  const v10Areas: Area[] = legacyAreas.map(convertLegacyAreaToV10)

  // Convert seasons: merge beds and permanents into single areas array
  migrated.seasons = migrated.seasons.map(season => {
    const legacySeason = season as { beds?: BedSeason[]; permanents?: PermanentSeason[] }
    const areaSeasonsMap = new Map<string, AreaSeason>()

    // Convert bed seasons
    if (legacySeason.beds) {
      for (const bed of legacySeason.beds) {
        areaSeasonsMap.set(bed.bedId, {
          areaId: bed.bedId,
          rotationGroup: bed.rotationGroup,
          plantings: bed.plantings || [],
          notes: bed.notes,
        })
      }
    }

    // Merge permanent seasons (care logs, underplantings become regular plantings)
    if (legacySeason.permanents) {
      for (const perm of legacySeason.permanents) {
        const existing = areaSeasonsMap.get(perm.areaId)
        if (existing) {
          // Merge care logs and harvest data
          existing.careLogs = perm.careLogs
          existing.harvestTotal = perm.harvestTotal
          existing.harvestUnit = perm.harvestUnit
          // Convert underplantings to regular plantings
          if (perm.underplantings?.length) {
            const convertedPlantings = perm.underplantings.map(u => ({
              id: u.id,
              plantId: u.plantId,
              varietyName: u.varietyName,
              sowDate: u.sowDate,
              transplantDate: u.transplantDate,
              harvestDate: u.harvestDate,
              success: u.success,
              notes: u.notes,
              quantity: u.quantity,
            }))
            existing.plantings = [...existing.plantings, ...convertedPlantings]
          }
        } else {
          // Create new area season from permanent
          areaSeasonsMap.set(perm.areaId, {
            areaId: perm.areaId,
            plantings: perm.underplantings?.map(u => ({
              id: u.id,
              plantId: u.plantId,
              varietyName: u.varietyName,
              sowDate: u.sowDate,
              transplantDate: u.transplantDate,
              harvestDate: u.harvestDate,
              success: u.success,
              notes: u.notes,
              quantity: u.quantity,
            })) || [],
            careLogs: perm.careLogs,
            harvestTotal: perm.harvestTotal,
            harvestUnit: perm.harvestUnit,
          })
        }
      }
    }

    // Ensure all areas have an AreaSeason entry
    for (const area of v10Areas) {
      if (!areaSeasonsMap.has(area.id)) {
        areaSeasonsMap.set(area.id, {
          areaId: area.id,
          plantings: [],
          rotationGroup: area.kind === 'rotation-bed' ? area.rotationGroup : undefined,
        })
      }
    }

    return {
      year: season.year,
      status: season.status,
      areas: Array.from(areaSeasonsMap.values()),
      notes: season.notes,
      createdAt: season.createdAt,
      updatedAt: season.updatedAt,
    }
  })

  // Update layout to v10 format (just areas, no legacy fields)
  migrated.layout = {
    areas: v10Areas,
  }

  return migrated
}

/**
 * Migrate from v10 to v11: Synchronize plant IDs
 * - Remaps plural IDs to singular IDs to match the vegetable index
 * - Affects plantings in seasons and primaryPlant in areas
 */
function migrateToV11(data: AllotmentData): AllotmentData {
  // Map of old plural/variant IDs to new singular IDs
  const PLANT_ID_MIGRATION_MAP: Record<string, string> = {
    'carrots': 'carrot',
    'onions': 'onion',
    'leeks': 'leek',
    'radishes': 'radish',
    'potatoes': 'potato',
    'parsnips': 'parsnip',
    'turnips': 'turnip',
    'tomatoes': 'tomato',
    'courgettes': 'courgette',
    'spring-onions': 'spring-onion',
    'claytonia': 'winter-purslane',
    'kohl-rabi': 'kohlrabi',
  }

  const migrated = { ...data }

  // Migrate plantings in seasons
  migrated.seasons = migrated.seasons.map(season => ({
    ...season,
    areas: season.areas.map(areaSeason => ({
      ...areaSeason,
      plantings: areaSeason.plantings.map(planting => {
        const newPlantId = PLANT_ID_MIGRATION_MAP[planting.plantId]
        if (newPlantId) {
          return { ...planting, plantId: newPlantId }
        }
        return planting
      }),
    })),
  }))

  // Migrate primaryPlant in areas
  migrated.layout = {
    ...migrated.layout,
    areas: migrated.layout.areas.map(area => {
      if (area.primaryPlant?.plantId) {
        const newPlantId = PLANT_ID_MIGRATION_MAP[area.primaryPlant.plantId]
        if (newPlantId) {
          return {
            ...area,
            primaryPlant: { ...area.primaryPlant, plantId: newPlantId },
          }
        }
      }
      return area
    }),
  }

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

  // Create minimal v10 data structure
  const v10Data: AllotmentData = {
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
  }

  return v10Data
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

// ============ SEASON OPERATIONS ============

/**
 * Get all available years from the data
 */
export function getAvailableYears(data: AllotmentData): number[] {
  return data.seasons
    .map(s => s.year)
    .sort((a, b) => b - a) // Descending (most recent first)
}

/**
 * Get a specific season by year
 */
export function getSeasonByYear(data: AllotmentData, year: number): SeasonRecord | undefined {
  return data.seasons.find(s => s.year === year)
}

/**
 * Get the current season
 */
export function getCurrentSeason(data: AllotmentData): SeasonRecord | undefined {
  return getSeasonByYear(data, data.currentYear)
}

/**
 * Add a new season
 * Automatically rotates beds based on previous year's rotation groups
 * v10: Creates AreaSeason for all areas
 */
export function addSeason(data: AllotmentData, input: NewSeasonInput): AllotmentData {
  const now = new Date().toISOString()

  // Find previous year's season for auto-rotation
  const previousYear = input.year - 1
  const previousSeason = data.seasons.find(s => s.year === previousYear)

  // Create AreaSeason for all areas
  const areaSeasons: AreaSeason[] = (data.layout.areas || [])
    .filter(area => !area.isArchived) // Don't create seasons for archived areas
    .map(area => {
      // For rotation beds, auto-rotate based on previous year
      let rotationGroup: RotationGroup | undefined
      if (area.kind === 'rotation-bed') {
        const previousAreaSeason = previousSeason?.areas?.find(a => a.areaId === area.id)
        rotationGroup = previousAreaSeason?.rotationGroup
          ? getNextRotationGroup(previousAreaSeason.rotationGroup)
          : area.rotationGroup || 'legumes'

        console.log(`[AUTO-ROTATE] Area ${area.id} for ${input.year}:`, {
          previousYear,
          previousRotation: previousAreaSeason?.rotationGroup,
          newRotation: rotationGroup,
          rotated: !!previousAreaSeason?.rotationGroup
        })
      }

      return {
        areaId: area.id,
        rotationGroup,
        plantings: [],
      }
    })

  const newSeason: SeasonRecord = {
    year: input.year,
    status: input.status || 'planned',
    areas: areaSeasons,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...data,
    seasons: [...data.seasons, newSeason],
    currentYear: input.year, // Switch to the new season
  }
}

/**
 * Remove a season by year
 * Cannot remove if it's the only season
 */
export function removeSeason(data: AllotmentData, year: number): AllotmentData {
  // Don't allow removing the last season
  if (data.seasons.length <= 1) {
    return data
  }

  const filteredSeasons = data.seasons.filter(s => s.year !== year)

  // If we removed the current year, switch to the most recent remaining year
  let newCurrentYear = data.currentYear
  if (data.currentYear === year) {
    const years = filteredSeasons.map(s => s.year).sort((a, b) => b - a)
    newCurrentYear = years[0]
  }

  return {
    ...data,
    seasons: filteredSeasons,
    currentYear: newCurrentYear,
  }
}

/**
 * Update a season's metadata (notes, status)
 */
export function updateSeason(
  data: AllotmentData,
  year: number,
  updates: Partial<Pick<SeasonRecord, 'notes' | 'status'>>
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(s =>
      s.year === year
        ? { ...s, ...updates, updatedAt: new Date().toISOString() }
        : s
    ),
  }
}

/**
 * Set the current year
 */
export function setCurrentYear(data: AllotmentData, year: number): AllotmentData {
  return {
    ...data,
    currentYear: year,
  }
}

// ============ AREA SEASON OPERATIONS ============

/**
 * Get a specific area's season data (v10)
 */
export function getAreaSeason(
  data: AllotmentData,
  year: number,
  areaId: string
): AreaSeason | undefined {
  const season = getSeasonByYear(data, year)
  return season?.areas?.find(a => a.areaId === areaId)
}

/**
 * @deprecated Use getAreaSeason instead. Kept for backward compatibility.
 */
export function getBedSeason(
  data: AllotmentData,
  year: number,
  bedId: string
): AreaSeason | undefined {
  return getAreaSeason(data, year, bedId)
}

/**
 * Update an area's rotation group for a season (v10)
 */
export function updateAreaRotationGroup(
  data: AllotmentData,
  year: number,
  areaId: string,
  rotationGroup: RotationGroup
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      const existingArea = season.areas?.find(a => a.areaId === areaId)

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: existingArea
          ? (season.areas || []).map(area =>
              area.areaId === areaId
                ? { ...area, rotationGroup }
                : area
            )
          : [...(season.areas || []), { areaId, rotationGroup, plantings: [] }],
      }
    }),
  }
}

/**
 * @deprecated Use updateAreaRotationGroup instead
 */
export function updateBedRotationGroup(
  data: AllotmentData,
  year: number,
  bedId: string,
  rotationGroup: RotationGroup
): AllotmentData {
  return updateAreaRotationGroup(data, year, bedId, rotationGroup)
}

// ============ PLANTING OPERATIONS ============

/**
 * Generate a unique ID for a planting
 */
export function generatePlantingId(): string {
  return generateId('planting')
}

/**
 * Add a planting to an area in a season (v10)
 */
export function addPlanting(
  data: AllotmentData,
  year: number,
  areaId: string,
  planting: NewPlanting
): AllotmentData {
  const newPlanting: Planting = {
    ...planting,
    id: generatePlantingId(),
  }

  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: (season.areas || []).map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            plantings: [...area.plantings, newPlanting],
          }
        }),
      }
    }),
  }
}

/**
 * Update a planting (v10)
 */
export function updatePlanting(
  data: AllotmentData,
  year: number,
  areaId: string,
  plantingId: string,
  updates: PlantingUpdate
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: (season.areas || []).map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            plantings: area.plantings.map(p =>
              p.id === plantingId ? { ...p, ...updates } : p
            ),
          }
        }),
      }
    }),
  }
}

/**
 * Remove a planting (v10)
 */
export function removePlanting(
  data: AllotmentData,
  year: number,
  areaId: string,
  plantingId: string
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: (season.areas || []).map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            plantings: area.plantings.filter(p => p.id !== plantingId),
          }
        }),
      }
    }),
  }
}

/**
 * Get all plantings for an area in a season (v10)
 */
export function getPlantingsForArea(
  data: AllotmentData,
  year: number,
  areaId: string
): Planting[] {
  const areaSeason = getAreaSeason(data, year, areaId)
  return areaSeason?.plantings || []
}

/**
 * @deprecated Use getPlantingsForArea instead
 */
export function getPlantingsForBed(
  data: AllotmentData,
  year: number,
  bedId: string
): Planting[] {
  return getPlantingsForArea(data, year, bedId)
}

// ============ AREA NOTE OPERATIONS ============

/**
 * Generate a unique ID for an area note
 */
export function generateAreaNoteId(): string {
  return generateId('note')
}

/** @deprecated Use generateAreaNoteId */
export function generateBedNoteId(): string {
  return generateAreaNoteId()
}

/**
 * Get all notes for an area in a season (v10)
 */
export function getAreaNotes(
  data: AllotmentData,
  year: number,
  areaId: string
): AreaNote[] {
  const areaSeason = getAreaSeason(data, year, areaId)
  return areaSeason?.notes || []
}

/** @deprecated Use getAreaNotes */
export function getBedNotes(
  data: AllotmentData,
  year: number,
  bedId: string
): AreaNote[] {
  return getAreaNotes(data, year, bedId)
}

/**
 * Add a note to an area in a season (v10)
 */
export function addAreaNote(
  data: AllotmentData,
  year: number,
  areaId: string,
  note: NewAreaNote
): AllotmentData {
  const now = new Date().toISOString()
  const newNote: AreaNote = {
    ...note,
    id: generateAreaNoteId(),
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: now,
        areas: (season.areas || []).map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            notes: [...(area.notes || []), newNote],
          }
        }),
      }
    }),
  }
}

/** @deprecated Use addAreaNote */
export function addBedNote(
  data: AllotmentData,
  year: number,
  bedId: string,
  note: NewAreaNote
): AllotmentData {
  return addAreaNote(data, year, bedId, note)
}

/**
 * Update an area note (v10)
 */
export function updateAreaNote(
  data: AllotmentData,
  year: number,
  areaId: string,
  noteId: string,
  updates: AreaNoteUpdate
): AllotmentData {
  const now = new Date().toISOString()

  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: now,
        areas: (season.areas || []).map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            notes: (area.notes || []).map(note =>
              note.id === noteId
                ? { ...note, ...updates, updatedAt: now }
                : note
            ),
          }
        }),
      }
    }),
  }
}

/** @deprecated Use updateAreaNote */
export function updateBedNote(
  data: AllotmentData,
  year: number,
  bedId: string,
  noteId: string,
  updates: AreaNoteUpdate
): AllotmentData {
  return updateAreaNote(data, year, bedId, noteId, updates)
}

/**
 * Remove an area note (v10)
 */
export function removeAreaNote(
  data: AllotmentData,
  year: number,
  areaId: string,
  noteId: string
): AllotmentData {
  return {
    ...data,
    seasons: data.seasons.map(season => {
      if (season.year !== year) return season

      return {
        ...season,
        updatedAt: new Date().toISOString(),
        areas: (season.areas || []).map(area => {
          if (area.areaId !== areaId) return area

          return {
            ...area,
            notes: (area.notes || []).filter(note => note.id !== noteId),
          }
        }),
      }
    }),
  }
}

/** @deprecated Use removeAreaNote */
export function removeBedNote(
  data: AllotmentData,
  year: number,
  bedId: string,
  noteId: string
): AllotmentData {
  return removeAreaNote(data, year, bedId, noteId)
}

// ============ GARDEN EVENTS OPERATIONS ============

/**
 * Get all garden events
 */
export function getGardenEvents(data: AllotmentData): GardenEvent[] {
  return data.gardenEvents || []
}

/**
 * Get garden events for a specific date range
 */
export function getGardenEventsInRange(
  data: AllotmentData,
  startDate: string,
  endDate: string
): GardenEvent[] {
  return (data.gardenEvents || []).filter(event => {
    return event.date >= startDate && event.date <= endDate
  })
}

/**
 * Add a garden event
 */
export function addGardenEvent(
  data: AllotmentData,
  event: NewGardenEvent
): AllotmentData {
  const now = new Date().toISOString()
  const newEvent: GardenEvent = {
    ...event,
    id: generateId('event'),
    createdAt: now,
  }

  return {
    ...data,
    gardenEvents: [...(data.gardenEvents || []), newEvent],
    meta: {
      ...data.meta,
      updatedAt: now,
    },
  }
}

/**
 * Remove a garden event
 */
export function removeGardenEvent(
  data: AllotmentData,
  eventId: string
): AllotmentData {
  return {
    ...data,
    gardenEvents: (data.gardenEvents || []).filter(e => e.id !== eventId),
    meta: {
      ...data.meta,
      updatedAt: new Date().toISOString(),
    },
  }
}

// ============ LAYOUT OPERATIONS ============

// ============ BACKWARD COMPATIBILITY HELPERS (v9) ============

// ============ AREA HELPER FUNCTIONS (v10) ============

/**
 * Get an area by ID from the unified areas array
 */
export function getAreaById(data: AllotmentData, id: string): Area | undefined {
  return data.layout.areas?.find(a => a.id === id && !a.isArchived)
}

/**
 * Get all areas (non-archived)
 */
export function getAllAreas(data: AllotmentData): Area[] {
  return data.layout.areas?.filter(a => !a.isArchived) || []
}

/**
 * Get areas by kind
 */
export function getAreasByKind(data: AllotmentData, kind: AreaKind): Area[] {
  return data.layout.areas?.filter(a => a.kind === kind && !a.isArchived) || []
}

/**
 * Get rotation beds (areas with kind='rotation-bed')
 */
export function getRotationBeds(data: AllotmentData): Area[] {
  return getAreasByKind(data, 'rotation-bed')
}

/**
 * Get all beds (rotation and perennial)
 */
export function getAllBeds(data: AllotmentData): Area[] {
  return data.layout.areas?.filter(a =>
    (a.kind === 'rotation-bed' || a.kind === 'perennial-bed') && !a.isArchived
  ) || []
}

/**
 * Get permanent areas (trees, berries, herbs)
 */
export function getPermanentAreas(data: AllotmentData): Area[] {
  return data.layout.areas?.filter(a =>
    (a.kind === 'tree' || a.kind === 'berry' || a.kind === 'herb' || a.kind === 'perennial-bed') && !a.isArchived
  ) || []
}

/**
 * Get infrastructure areas
 */
export function getInfrastructureAreas(data: AllotmentData): Area[] {
  return getAreasByKind(data, 'infrastructure')
}

/**
 * Check if an area is a rotation bed
 */
export function isRotationBed(area: Area): boolean {
  return area.kind === 'rotation-bed'
}

/**
 * Check if an area can have plantings
 */
export function canHavePlantings(area: Area): boolean {
  return area.canHavePlantings
}

// ============ LEGACY COMPATIBILITY FUNCTIONS ============

/**
 * @deprecated Use getAllBeds instead
 * Get beds from unified areas array - backward compatibility wrapper
 */
export function getBedsFromAreas(data: AllotmentData): import('@/types/garden-planner').PhysicalBed[] {
  return getAllBeds(data).map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    status: a.kind === 'rotation-bed' ? 'rotation' : 'perennial',
    rotationGroup: a.rotationGroup,
    gridPosition: a.gridPosition ? {
      startRow: a.gridPosition.y,
      startCol: a.gridPosition.x,
      endRow: a.gridPosition.y + a.gridPosition.h - 1,
      endCol: a.gridPosition.x + a.gridPosition.w - 1,
    } : undefined,
  }))
}

/**
 * @deprecated Use getPermanentAreas instead
 * Get permanent plantings - backward compatibility wrapper
 */
export function getPermanentPlantingsFromAreas(data: AllotmentData): PermanentPlanting[] {
  return getPermanentAreas(data)
    .filter(a => a.primaryPlant) // Only areas with a primary plant
    .map(a => ({
      id: a.id,
      name: a.name,
      type: a.kind === 'tree' ? 'fruit-tree' :
            a.kind === 'berry' ? 'berry' :
            a.kind === 'herb' ? 'herb' : 'perennial-veg',
      plantId: a.primaryPlant?.plantId,
      variety: a.primaryPlant?.variety,
      plantedYear: a.primaryPlant?.plantedYear,
      notes: a.description,
      gridPosition: a.gridPosition ? {
        row: a.gridPosition.y,
        col: a.gridPosition.x,
      } : undefined,
    }))
}

/**
 * @deprecated Use getInfrastructureAreas instead
 * Get infrastructure - backward compatibility wrapper
 */
export function getInfrastructureFromAreas(data: AllotmentData): InfrastructureItem[] {
  return getInfrastructureAreas(data).map(a => ({
    id: a.id,
    type: a.infrastructureSubtype || 'other',
    name: a.name,
    gridPosition: a.gridPosition ? {
      startRow: a.gridPosition.y,
      startCol: a.gridPosition.x,
      endRow: a.gridPosition.y + a.gridPosition.h - 1,
      endCol: a.gridPosition.x + a.gridPosition.w - 1,
    } : undefined,
  }))
}

/**
 * @deprecated Use getAreaById directly - v10 no longer uses type discriminator
 */
export function getBedAreaById(data: AllotmentData, bedId: string): Area | undefined {
  const area = getAreaById(data, bedId)
  return area && (area.kind === 'rotation-bed' || area.kind === 'perennial-bed') ? area : undefined
}

/**
 * @deprecated Use getAreaById directly
 */
export function getPermanentAreaById(data: AllotmentData, id: string): Area | undefined {
  const area = getAreaById(data, id)
  return area && (area.kind === 'tree' || area.kind === 'berry' || area.kind === 'herb' || area.kind === 'perennial-bed') ? area : undefined
}

/**
 * @deprecated Use getAreaById directly
 */
export function getInfrastructureAreaById(data: AllotmentData, id: string): Area | undefined {
  const area = getAreaById(data, id)
  return area?.kind === 'infrastructure' ? area : undefined
}

/**
 * @deprecated v10 uses 'area' type only
 * Resolved item from an AllotmentItemRef
 */
export type ResolvedItem =
  | { type: 'area'; item: Area }
  | null

/**
 * @deprecated Use getAreaById directly
 * Resolve an AllotmentItemRef to the actual item data
 */
export function resolveItemRef(data: AllotmentData, ref: AllotmentItemRef): ResolvedItem {
  const area = getAreaById(data, ref.id)
  return area ? { type: 'area', item: area } : null
}

/**
 * @deprecated Use getPermanentAreas instead
 * Get a permanent planting by ID - backward compatibility wrapper
 */
export function getPermanentPlantingById(
  data: AllotmentData,
  id: string
): PermanentPlanting | undefined {
  const area = getPermanentAreaById(data, id)
  if (!area) return undefined

  // Convert v10 Area to legacy PermanentPlanting
  const kindToType: Record<string, PermanentPlanting['type']> = {
    'tree': 'fruit-tree',
    'berry': 'berry',
    'herb': 'herb',
    'perennial-bed': 'perennial-veg',
  }
  return {
    id: area.id,
    name: area.name,
    type: kindToType[area.kind] || 'perennial-veg',
    plantId: area.primaryPlant?.plantId,
    variety: area.primaryPlant?.variety,
    plantedYear: area.primaryPlant?.plantedYear,
    notes: area.description,
    gridPosition: area.gridPosition ? {
      row: area.gridPosition.y,
      col: area.gridPosition.x,
    } : undefined,
  }
}

/**
 * @deprecated Use getInfrastructureAreas instead
 * Get an infrastructure item by ID - backward compatibility wrapper
 */
export function getInfrastructureById(
  data: AllotmentData,
  id: string
): InfrastructureItem | undefined {
  const area = getInfrastructureAreaById(data, id)
  if (!area) return undefined

  // Convert v10 Area to legacy InfrastructureItem
  return {
    id: area.id,
    type: area.infrastructureSubtype || 'other',
    name: area.name,
    gridPosition: area.gridPosition ? {
      startRow: area.gridPosition.y,
      startCol: area.gridPosition.x,
      endRow: area.gridPosition.y + area.gridPosition.h - 1,
      endCol: area.gridPosition.x + area.gridPosition.w - 1,
    } : undefined,
  }
}

/**
 * @deprecated Use getAreaById instead
 * Get a bed by ID - backward compatibility wrapper
 */
export function getBedById(
  data: AllotmentData,
  bedId: PhysicalBedId
): import('@/types/garden-planner').PhysicalBed | undefined {
  const area = getBedAreaById(data, bedId)
  if (!area) return undefined

  // Convert v10 Area to legacy PhysicalBed
  return {
    id: area.id as PhysicalBedId,
    name: area.name,
    description: area.description,
    status: area.kind === 'rotation-bed' ? 'rotation' : 'perennial',
    rotationGroup: area.rotationGroup,
    gridPosition: area.gridPosition ? {
      startRow: area.gridPosition.y,
      startCol: area.gridPosition.x,
      endRow: area.gridPosition.y + area.gridPosition.h - 1,
      endCol: area.gridPosition.x + area.gridPosition.w - 1,
    } : undefined,
  }
}

/**
 * @deprecated Use getAreasByKind instead
 * Get beds by status - backward compatibility wrapper
 */
export function getBedsByStatus(
  data: AllotmentData,
  status: import('@/types/garden-planner').BedStatus
): import('@/types/garden-planner').PhysicalBed[] {
  const bedAreas = getAllBeds(data)
  const targetKind = status === 'rotation' ? 'rotation-bed' : 'perennial-bed'
  return bedAreas
    .filter(area => area.kind === targetKind)
    .map(area => ({
      id: area.id as PhysicalBedId,
      name: area.name,
      description: area.description,
      status: status,
      rotationGroup: area.rotationGroup,
      gridPosition: area.gridPosition ? {
        startRow: area.gridPosition.y,
        startCol: area.gridPosition.x,
        endRow: area.gridPosition.y + area.gridPosition.h - 1,
        endCol: area.gridPosition.x + area.gridPosition.w - 1,
      } : undefined,
    }))
}

/**
 * @deprecated Use getAreasByKind(data, 'rotation-bed') instead
 * Get all rotation beds as legacy PhysicalBed format - backward compatibility wrapper
 */
export function getRotationBedsLegacy(
  data: AllotmentData
): import('@/types/garden-planner').PhysicalBed[] {
  const rotationAreas = getAreasByKind(data, 'rotation-bed')
  return rotationAreas
    .map(area => ({
      id: area.id as PhysicalBedId,
      name: area.name,
      description: area.description,
      status: 'rotation' as const,
      rotationGroup: area.rotationGroup,
      gridPosition: area.gridPosition ? {
        startRow: area.gridPosition.y,
        startCol: area.gridPosition.x,
        endRow: area.gridPosition.y + area.gridPosition.h - 1,
        endCol: area.gridPosition.x + area.gridPosition.w - 1,
      } : undefined,
    }))
}

// ============ ROTATION HISTORY ============

/**
 * Get rotation history for an area across all years
 */
export function getRotationHistory(
  data: AllotmentData,
  areaId: string
): Array<{ year: number; group: RotationGroup }> {
  return data.seasons
    .map(season => {
      const areaSeason = season.areas.find(a => a.areaId === areaId)
      return areaSeason?.rotationGroup
        ? { year: season.year, group: areaSeason.rotationGroup }
        : null
    })
    .filter((item): item is { year: number; group: RotationGroup } => item !== null)
    .sort((a, b) => b.year - a.year)
}

/**
 * Get the last N years of rotation for an area
 */
export function getRecentRotation(
  data: AllotmentData,
  areaId: string,
  years: number = 3
): RotationGroup[] {
  return getRotationHistory(data, areaId)
    .slice(0, years)
    .map(h => h.group)
}

// ============ MAINTENANCE TASK OPERATIONS ============

/**
 * Generate a unique ID for a maintenance task
 */
export function generateMaintenanceTaskId(): string {
  return generateId('task')
}

/**
 * Get all maintenance tasks
 */
export function getMaintenanceTasks(data: AllotmentData): MaintenanceTask[] {
  return data.maintenanceTasks || []
}

/**
 * Get maintenance tasks for a specific area
 */
export function getTasksForArea(
  data: AllotmentData,
  areaId: string
): MaintenanceTask[] {
  return (data.maintenanceTasks || []).filter(t => t.areaId === areaId)
}

/**
 * Get maintenance tasks due in a specific month
 */
export function getTasksForMonth(
  data: AllotmentData,
  month: number
): MaintenanceTask[] {
  return (data.maintenanceTasks || []).filter(t => t.month === month)
}

/**
 * Add a new maintenance task
 */
export function addMaintenanceTask(
  data: AllotmentData,
  task: NewMaintenanceTask
): AllotmentData {
  const newTask: MaintenanceTask = {
    ...task,
    id: generateMaintenanceTaskId(),
  }
  
  return {
    ...data,
    maintenanceTasks: [...(data.maintenanceTasks || []), newTask],
  }
}

/**
 * Update a maintenance task
 */
export function updateMaintenanceTask(
  data: AllotmentData,
  taskId: string,
  updates: Partial<Omit<MaintenanceTask, 'id'>>
): AllotmentData {
  return {
    ...data,
    maintenanceTasks: (data.maintenanceTasks || []).map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ),
  }
}

/**
 * Mark a maintenance task as completed
 */
export function completeMaintenanceTask(
  data: AllotmentData,
  taskId: string,
  completedDate: string = new Date().toISOString()
): AllotmentData {
  return updateMaintenanceTask(data, taskId, { lastCompleted: completedDate })
}

/**
 * Remove a maintenance task
 */
export function removeMaintenanceTask(
  data: AllotmentData,
  taskId: string
): AllotmentData {
  return {
    ...data,
    maintenanceTasks: (data.maintenanceTasks || []).filter(t => t.id !== taskId),
  }
}

// ============ GENERIC STORAGE UTILITIES ============

/**
 * Generic get item from localStorage with JSON parsing
 * Use this for any non-allotment data that needs to be stored
 */
export function getStorageItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

/**
 * Generic set item to localStorage with JSON serialization
 * Use this for any non-allotment data that needs to be stored
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Remove an item from localStorage
 */
export function removeStorageItem(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

// ============ VARIETY OPERATIONS ============

/**
 * Generate a unique ID for a variety
 */
export function generateVarietyId(): string {
  return generateId('variety')
}

/**
 * Get all varieties
 */
export function getVarieties(data: AllotmentData): StoredVariety[] {
  return data.varieties || []
}

/**
 * Get a variety by ID
 */
export function getVarietyById(data: AllotmentData, id: string): StoredVariety | undefined {
  return data.varieties?.find(v => v.id === id)
}

/**
 * Get varieties for a specific vegetable/plant
 */
export function getVarietiesByPlant(data: AllotmentData, plantId: string): StoredVariety[] {
  return (data.varieties || []).filter(v => v.plantId === plantId)
}

/**
 * Add a new variety
 */
export function addVariety(data: AllotmentData, variety: NewVariety): AllotmentData {
  const newVariety: StoredVariety = {
    id: generateVarietyId(),
    plantId: variety.plantId,
    name: variety.name,
    supplier: variety.supplier,
    price: variety.price,
    notes: variety.notes,
    yearsUsed: [],
    plannedYears: variety.plannedYears || [],
    seedsByYear: variety.seedsByYear || {},
  }

  return {
    ...data,
    varieties: [...(data.varieties || []), newVariety],
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Update an existing variety
 */
export function updateVariety(
  data: AllotmentData,
  id: string,
  updates: VarietyUpdate
): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v =>
      v.id === id ? { ...v, ...updates } : v
    ),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Remove a variety
 */
export function removeVariety(data: AllotmentData, id: string): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).filter(v => v.id !== id),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Toggle whether a variety is planned for a specific year
 */
export function togglePlannedYear(
  data: AllotmentData,
  varietyId: string,
  year: number
): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v => {
      if (v.id !== varietyId) return v

      const hasYear = v.plannedYears.includes(year)
      return {
        ...v,
        plannedYears: hasYear
          ? v.plannedYears.filter(y => y !== year)
          : [...v.plannedYears, year].sort((a, b) => a - b),
      }
    }),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Cycle seed status for a variety in a specific year
 * Cycles: none → ordered → have → none
 */
export function toggleHaveSeedsForYear(
  data: AllotmentData,
  varietyId: string,
  year: number
): AllotmentData {
  return {
    ...data,
    varieties: (data.varieties || []).map(v => {
      if (v.id !== varietyId) return v

      const current = v.seedsByYear[year] || 'none'
      const next: Record<SeedStatus, SeedStatus> = {
        'none': 'ordered',
        'ordered': 'have',
        'have': 'none'
      }
      const nextState = next[current]

      // Remove entry when cycling back to 'none'
      if (nextState === 'none') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [year]: _, ...rest } = v.seedsByYear
        return { ...v, seedsByYear: rest }
      }

      return {
        ...v,
        seedsByYear: { ...v.seedsByYear, [year]: nextState }
      }
    }),
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Check if user has seeds for a variety in a specific year
 */
export function hasSeedsForYear(variety: StoredVariety, year: number): boolean {
  return variety.seedsByYear?.[year] === 'have'
}

/**
 * Get varieties planned or used for a specific year
 */
export function getVarietiesForYear(data: AllotmentData, year: number): StoredVariety[] {
  return (data.varieties || []).filter(
    v => v.yearsUsed.includes(year) || v.plannedYears.includes(year)
  )
}

/**
 * Get unique list of suppliers
 */
export function getSuppliers(data: AllotmentData): string[] {
  const suppliers = (data.varieties || [])
    .map(v => v.supplier)
    .filter((s): s is string => s !== undefined)
  return [...new Set(suppliers)].sort()
}

/**
 * Calculate total spend for varieties used or planned in a specific year
 */
export function getTotalSpendForYear(data: AllotmentData, year: number): number {
  return (data.varieties || [])
    .filter(v =>
      (v.yearsUsed.includes(year) || v.plannedYears.includes(year)) &&
      v.price !== undefined
    )
    .reduce((sum, v) => sum + (v.price || 0), 0)
}

/**
 * Get all years that have variety data (used or planned)
 */
export function getAvailableVarietyYears(data: AllotmentData): number[] {
  const years = new Set<number>()
  for (const v of data.varieties || []) {
    v.yearsUsed.forEach(y => years.add(y))
    v.plannedYears.forEach(y => years.add(y))
  }
  return [...years].sort((a, b) => b - a)
}

/**
 * Get seed stats for a specific year
 */
export function getSeedsStatsForYear(
  data: AllotmentData,
  year: number
): { total: number; have: number; ordered: number; none: number } {
  const varieties = getVarietiesForYear(data, year)
  let have = 0
  let ordered = 0
  let none = 0

  for (const v of varieties) {
    const status = v.seedsByYear[year] || 'none'
    if (status === 'have') have++
    else if (status === 'ordered') ordered++
    else none++
  }

  return { total: varieties.length, have, ordered, none }
}

// ============ UNIFIED AREA CRUD OPERATIONS (v10) ============

/**
 * Add a new area to the unified areas array
 */
export function addArea(
  data: AllotmentData,
  area: Omit<Area, 'id'>
): { data: AllotmentData; areaId: string } {
  const id = generateId()
  const newArea: Area = {
    ...area,
    id,
    createdAt: new Date().toISOString(),
    // Keep createdYear as undefined if not specified - means area exists in all years
    createdYear: area.createdYear
  }

  const areas = data.layout.areas || []

  // Backfill AreaSeason ONLY to years where area should exist
  const updatedSeasons = data.seasons.map(season => {
    // Check if area should exist in this season
    const shouldExist = wasAreaActiveInYear(newArea, season.year)

    if (!shouldExist) {
      console.log('addArea: Skipping season backfill', {
        areaId: id,
        areaName: newArea.name,
        seasonYear: season.year,
        createdYear: newArea.createdYear,
        retiredYear: newArea.retiredYear,
        reason: 'Area not active in this year'
      })
      return season
    }

    console.log('addArea: Backfilling season', {
      areaId: id,
      areaName: newArea.name,
      seasonYear: season.year
    })

    const newAreaSeason: AreaSeason = {
      areaId: id,
      rotationGroup: newArea.kind === 'rotation-bed' ? (newArea.rotationGroup || 'legumes') : undefined,
      plantings: [],
      notes: [],
    }

    return {
      ...season,
      areas: [...(season.areas || []), newAreaSeason],
      updatedAt: new Date().toISOString(),
    }
  })

  return {
    data: {
      ...data,
      layout: {
        ...data.layout,
        areas: [...areas, newArea],
      },
      seasons: updatedSeasons,
      meta: { ...data.meta, updatedAt: new Date().toISOString() },
    },
    areaId: id,
  }
}

/**
 * Update an existing area
 */
export function updateArea(
  data: AllotmentData,
  areaId: string,
  updates: Partial<Omit<Area, 'id'>>
): AllotmentData {
  const areas = data.layout.areas || []
  const areaIndex = areas.findIndex(a => a.id === areaId)

  if (areaIndex === -1) {
    return data
  }

  const updatedArea = { ...areas[areaIndex], ...updates }
  const newAreas = [...areas]
  newAreas[areaIndex] = updatedArea

  return {
    ...data,
    layout: {
      ...data.layout,
      areas: newAreas,
    },
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Archive an area (soft delete)
 * Preserves the area in data but marks it as archived
 */
export function archiveArea(data: AllotmentData, areaId: string): AllotmentData {
  return updateArea(data, areaId, { isArchived: true })
}

/**
 * Restore an archived area
 */
export function restoreArea(data: AllotmentData, areaId: string): AllotmentData {
  return updateArea(data, areaId, { isArchived: false })
}

/**
 * Remove an area from the unified areas array (hard delete)
 * Also removes any associated season data for this area
 */
export function removeArea(data: AllotmentData, areaId: string): AllotmentData {
  const areas = data.layout.areas || []

  // Remove area seasons for this area from all seasons
  const updatedSeasons = data.seasons.map(season => ({
    ...season,
    areas: season.areas.filter(a => a.areaId !== areaId),
  }))

  // Remove maintenance tasks for this area
  const updatedTasks = (data.maintenanceTasks || []).filter(t => t.areaId !== areaId)

  return {
    ...data,
    layout: {
      ...data.layout,
      areas: areas.filter(a => a.id !== areaId),
    },
    seasons: updatedSeasons,
    maintenanceTasks: updatedTasks,
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Change an area's kind (simplified v10 type conversion)
 * In v10, all data stays in AreaSeason - we just change the area's kind
 */
export function changeAreaKind(
  data: AllotmentData,
  areaId: string,
  newKind: AreaKind,
  options?: {
    rotationGroup?: RotationGroup
    primaryPlant?: { plantId: string; variety?: string; plantedYear?: number }
    infrastructureSubtype?: Area['infrastructureSubtype']
  }
): AllotmentData {
  const area = getAreaById(data, areaId)
  if (!area) return data

  const updates: Partial<Area> = { kind: newKind }

  // Add/remove rotation group based on new kind
  if (newKind === 'rotation-bed') {
    updates.rotationGroup = options?.rotationGroup || 'legumes'
    updates.canHavePlantings = true
  } else {
    updates.rotationGroup = undefined
  }

  // Add/remove primary plant based on new kind
  if (newKind === 'tree' || newKind === 'berry' || newKind === 'herb' || newKind === 'perennial-bed') {
    updates.primaryPlant = options?.primaryPlant
    updates.canHavePlantings = true
  } else if (newKind !== 'rotation-bed') {
    updates.primaryPlant = undefined
  }

  // Handle infrastructure subtype
  if (newKind === 'infrastructure') {
    updates.infrastructureSubtype = options?.infrastructureSubtype || 'other'
    updates.canHavePlantings = false // Most infrastructure can't have plantings by default
  } else {
    updates.infrastructureSubtype = undefined
  }

  // Other kinds can have plantings
  if (newKind === 'other') {
    updates.canHavePlantings = true
  }

  return updateArea(data, areaId, updates)
}

// ============ CARE LOG CRUD OPERATIONS (v10) ============

/**
 * Add a care log entry for any area
 * Care logs are now stored in AreaSeason.careLogs
 */
export function addCareLogEntry(
  data: AllotmentData,
  year: number,
  areaId: string,
  entry: NewCareLogEntry
): { data: AllotmentData; entryId: string } {
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return { data, entryId: '' }
  }

  const id = generateId()
  const newEntry: CareLogEntry = { ...entry, id }

  const season = data.seasons[seasonIndex]
  const areas = season.areas || []
  const areaIndex = areas.findIndex(a => a.areaId === areaId)

  let updatedAreas: AreaSeason[]

  if (areaIndex === -1) {
    // Create new area season entry
    updatedAreas = [
      ...areas,
      {
        areaId,
        plantings: [],
        careLogs: [newEntry],
      },
    ]
  } else {
    // Add to existing area season
    updatedAreas = [...areas]
    updatedAreas[areaIndex] = {
      ...areas[areaIndex],
      careLogs: [...(areas[areaIndex].careLogs || []), newEntry],
    }
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    areas: updatedAreas,
    updatedAt: new Date().toISOString(),
  }

  return {
    data: {
      ...data,
      seasons: updatedSeasons,
      meta: { ...data.meta, updatedAt: new Date().toISOString() },
    },
    entryId: id,
  }
}

/**
 * Update a care log entry
 */
export function updateCareLogEntry(
  data: AllotmentData,
  year: number,
  areaId: string,
  entryId: string,
  updates: Partial<Omit<CareLogEntry, 'id'>>
): AllotmentData {
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return data
  }

  const season = data.seasons[seasonIndex]
  const areas = season.areas || []
  const areaIndex = areas.findIndex(a => a.areaId === areaId)

  if (areaIndex === -1) {
    return data
  }

  const careLogs = areas[areaIndex].careLogs || []
  const logIndex = careLogs.findIndex(l => l.id === entryId)

  if (logIndex === -1) {
    return data
  }

  const updatedLogs = [...careLogs]
  updatedLogs[logIndex] = { ...careLogs[logIndex], ...updates }

  const updatedAreas = [...areas]
  updatedAreas[areaIndex] = {
    ...areas[areaIndex],
    careLogs: updatedLogs,
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    areas: updatedAreas,
    updatedAt: new Date().toISOString(),
  }

  return {
    ...data,
    seasons: updatedSeasons,
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Remove a care log entry
 */
export function removeCareLogEntry(
  data: AllotmentData,
  year: number,
  areaId: string,
  entryId: string
): AllotmentData {
  const seasonIndex = data.seasons.findIndex(s => s.year === year)

  if (seasonIndex === -1) {
    return data
  }

  const season = data.seasons[seasonIndex]
  const areas = season.areas || []
  const areaIndex = areas.findIndex(a => a.areaId === areaId)

  if (areaIndex === -1) {
    return data
  }

  const updatedAreas = [...areas]
  updatedAreas[areaIndex] = {
    ...areas[areaIndex],
    careLogs: (areas[areaIndex].careLogs || []).filter(l => l.id !== entryId),
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = {
    ...season,
    areas: updatedAreas,
    updatedAt: new Date().toISOString(),
  }

  return {
    ...data,
    seasons: updatedSeasons,
    meta: { ...data.meta, updatedAt: new Date().toISOString() },
  }
}

/**
 * Get care logs for an area in a specific year
 */
export function getCareLogsForArea(
  data: AllotmentData,
  year: number,
  areaId: string
): CareLogEntry[] {
  const areaSeason = getAreaSeason(data, year, areaId)
  return areaSeason?.careLogs || []
}

/**
 * Get all care logs for an area across all years
 */
export function getAllCareLogsForArea(
  data: AllotmentData,
  areaId: string
): Array<{ year: number; entry: CareLogEntry }> {
  const result: Array<{ year: number; entry: CareLogEntry }> = []

  for (const season of data.seasons) {
    const areaSeason = season.areas.find(a => a.areaId === areaId)
    if (areaSeason?.careLogs) {
      for (const entry of areaSeason.careLogs) {
        result.push({ year: season.year, entry })
      }
    }
  }

  return result.sort((a, b) => new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime())
}

/**
 * Log a harvest for any area (convenience function)
 */
export function logHarvest(
  data: AllotmentData,
  year: number,
  areaId: string,
  quantity: number,
  unit: string,
  date?: string
): { data: AllotmentData; entryId: string } {
  return addCareLogEntry(data, year, areaId, {
    type: 'harvest',
    date: date || new Date().toISOString().split('T')[0],
    quantity,
    unit,
  })
}

/**
 * Get total harvest for an area in a specific year
 */
export function getHarvestTotal(
  data: AllotmentData,
  year: number,
  areaId: string
): { quantity: number; unit: string } | null {
  const careLogs = getCareLogsForArea(data, year, areaId)
  const harvests = careLogs.filter(l => l.type === 'harvest' && l.quantity !== undefined)

  if (harvests.length === 0) {
    return null
  }

  // Assume all harvests use the same unit (use first unit found)
  const unit = harvests[0].unit || 'units'
  const total = harvests.reduce((sum, h) => sum + (h.quantity || 0), 0)

  return { quantity: total, unit }
}

/**
 * Update the harvest total for an area in a specific year
 * Sets the aggregated harvest values in AreaSeason
 */
export function updateAreaHarvestTotal(
  data: AllotmentData,
  year: number,
  areaId: string,
  quantity: number,
  unit: string
): AllotmentData {
  const seasonIndex = data.seasons.findIndex(s => s.year === year)
  if (seasonIndex === -1) return data

  const season = data.seasons[seasonIndex]
  const areas = season.areas || []
  const areaIndex = areas.findIndex(a => a.areaId === areaId)

  let updatedAreas: AreaSeason[]
  if (areaIndex === -1) {
    updatedAreas = [...areas, { areaId, plantings: [], harvestTotal: quantity, harvestUnit: unit }]
  } else {
    updatedAreas = [...areas]
    updatedAreas[areaIndex] = { ...areas[areaIndex], harvestTotal: quantity, harvestUnit: unit }
  }

  const updatedSeasons = [...data.seasons]
  updatedSeasons[seasonIndex] = { ...season, areas: updatedAreas, updatedAt: new Date().toISOString() }

  return { ...data, seasons: updatedSeasons, meta: { ...data.meta, updatedAt: new Date().toISOString() } }
}

// ============ AREA TEMPORAL FILTERING ============

/**
 * Check if an area was active/existed in a specific year
 *
 * This function only checks temporal metadata (createdYear/retiredYear/activeYears).
 * It does NOT check isArchived - that filtering is handled by getAllAreas().
 *
 * @param area - The area to check
 * @param year - The year to check
 * @returns true if area existed in that year (based on temporal metadata only)
 */
export function wasAreaActiveInYear(area: Area, year: number): boolean {
  // Validate inputs
  if (!area || typeof area !== 'object') {
    console.error('wasAreaActiveInYear called with invalid area', { area })
    return false
  }

  if (typeof year !== 'number' || !Number.isFinite(year) || !Number.isInteger(year)) {
    console.error('wasAreaActiveInYear called with invalid year', {
      year,
      areaId: area.id,
      areaName: area.name
    })
    return false
  }

  // Backward compatibility: if no temporal metadata, assume always existed
  if (!area.createdYear && !area.retiredYear && !area.activeYears) {
    return true
  }

  // Explicit activeYears list takes precedence (handles edge cases)
  if (area.activeYears && area.activeYears.length > 0) {
    return area.activeYears.includes(year)
  }

  // Use createdYear/retiredYear range
  const created = area.createdYear || 0  // undefined = always existed
  const retired = area.retiredYear || Infinity  // undefined = still active

  return year >= created && year < retired
}

/**
 * Get all areas that were active in a specific year
 *
 * @param data - Allotment data
 * @param year - Year to filter by
 * @returns Areas active in that year
 */
export function getAreasForYear(data: AllotmentData, year: number): Area[] {
  return getAllAreas(data).filter(a => wasAreaActiveInYear(a, year))
}

/**
 * Get the year range an area was active
 *
 * @param area - The area
 * @returns { from: number, to: number | null } or null if always active
 */
export function getAreaActiveRange(area: Area): { from: number; to: number | null } | null {
  // Validate area input
  if (!area || typeof area !== 'object') {
    console.error('getAreaActiveRange called with invalid area', { area })
    return null
  }

  if (!area.createdYear && !area.retiredYear) {
    return null  // Always active
  }

  return {
    from: area.createdYear || 0,
    to: area.retiredYear || null  // null = still active
  }
}

/**
 * Validate that a planting can be added to an area in a specific year
 */
export function validatePlantingForYear(
  data: AllotmentData,
  year: number,
  areaId: string
): { valid: boolean; error?: string } {
  const area = getAreaById(data, areaId)
  if (!area) {
    console.error('validatePlantingForYear: Area not found', { areaId, year })
    return { valid: false, error: `Area ${areaId} does not exist` }
  }

  if (!wasAreaActiveInYear(area, year)) {
    const range = getAreaActiveRange(area)
    const rangeStr = range
      ? `${range.from}-${range.to || 'present'}`
      : 'unknown (area has inconsistent temporal metadata)'

    console.warn('validatePlantingForYear: Area not active in year', {
      areaId,
      areaName: area.name,
      year,
      activeRange: rangeStr
    })

    return {
      valid: false,
      error: `Area "${area.name}" was not active in ${year}. Active years: ${rangeStr}`
    }
  }

  console.log('validatePlantingForYear: Validation passed', {
    areaId,
    areaName: area.name,
    year
  })

  return { valid: true }
}

