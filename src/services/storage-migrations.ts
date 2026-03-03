/**
 * Storage Migrations
 *
 * Schema migration logic for AllotmentData, including all version migrations
 * from v1 through v17, legacy data migration, and backup/restore functionality.
 */

import {
  AllotmentData,
  SeasonRecord,
  AreaSeason,
  Planting,
  StoredVariety,
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
  Area,
  AreaKind,
  GridPosition,
  // Legacy types for migration compatibility
  BedSeason,
  BedArea,
  PermanentArea,
  InfrastructureArea,
  LegacyArea,
  PermanentUnderplanting,
  PermanentSeason,
} from '@/types/unified-allotment'
import { generateId } from '@/lib/utils'
import { DEFAULT_GRID_LAYOUT } from '@/data/allotment-layout'
import { logger } from '@/lib/logger'

// Import legacy data for migration (empty arrays for fresh start, but needed for old data migrations)
import { permanentPlantings, infrastructure } from '@/data/allotment-layout'

import type { StorageResult } from '@/types/unified-allotment'

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
 * Clear migration state after successful completion
 */
export function clearMigrationState(data: AllotmentData): AllotmentData {
  if (!data.meta.migrationState) return data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { migrationState, ...cleanMeta } = data.meta
  return { ...data, meta: cleanMeta }
}

/**
 * Migrate data from older schema versions to current version
 * Exported for use by import/migration processes
 */
export function migrateSchemaForImport(data: AllotmentData): AllotmentData {
  return migrateSchema(data)
}

/**
 * Migrate data from older schema versions
 *
 * NOTE: This function works with legacy data formats.
 * TypeScript checks are bypassed using 'any' because we're
 * transforming data from older schemas to the current format.
 */
export function migrateSchema(data: AllotmentData): AllotmentData {
  // Create backup before any migration
  if (data.version < CURRENT_SCHEMA_VERSION) {
    createMigrationBackup(data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migrated = { ...data } as any

  // Version 1 -> 2: Add maintenance tasks array
  if (migrated.version < 2) {
    migrated.maintenanceTasks = migrated.maintenanceTasks || []
    logger.info('Schema migration complete', { from: 1, to: 2, change: 'added maintenanceTasks' })
  }

  // Version 2 -> 3: Add notes array to BedSeason (no action needed, notes is optional)
  if (migrated.version < 3) {
    logger.info('Schema migration complete', { from: 2, to: 3, change: 'bed notes support added' })
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

    logger.info('Schema migration complete', { from: 3, to: 4, change: 'problemNotes converted to BedNotes for 2025' })
  }

  // Version 4 -> 5: Add gardenEvents array
  if (migrated.version < 5) {
    migrated.gardenEvents = migrated.gardenEvents || []
    logger.info('Schema migration complete', { from: 4, to: 5, change: 'added gardenEvents' })
  }

  // Version 5 -> 6: Add varieties array (consolidated from separate storage)
  if (migrated.version < 6) {
    migrated.varieties = migrated.varieties || []
    logger.info('Schema migration complete', { from: 5, to: 6, change: 'added varieties' })
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
      logger.info('Schema migration complete', { from: 6, to: 7, change: 'populated permanentPlantings from default layout' })
    } else {
      // Add plantId to existing permanentPlantings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      v7Layout.permanentPlantings = v7Layout.permanentPlantings.map((planting: any) => {
        const plantId = PERMANENT_TO_PLANT_ID[planting.id]
        return plantId ? { ...planting, plantId } : planting
      })
      logger.info('Schema migration complete', { from: 6, to: 7, change: 'added plantId to permanent plantings' })
    }

    // If infrastructure is empty, populate from default layout
    if (!v7Layout.infrastructure || v7Layout.infrastructure.length === 0) {
      v7Layout.infrastructure = infrastructure
      logger.info('Schema migration complete', { from: 6, to: 7, change: 'populated infrastructure from default layout' })
    }
  }

  // Version 8 -> 9: Unified Area System with underplantings and care logging
  if (migrated.version < 9) {
    const v9Data = migrateToV9(migrated)
    // Continue to v10 migration
    const v10Data = migrateToV10(v9Data)
    v10Data.version = CURRENT_SCHEMA_VERSION
    logger.info('Schema migration complete', { from: 8, to: 10, change: 'unified Area type with dynamic add/remove' })
    return v10Data
  }

  // Version 9 -> 10: Simplified unified Area type
  if (migrated.version < 10) {
    const v10Data = migrateToV10(migrated)
    v10Data.version = 10
    logger.info('Schema migration complete', { from: 9, to: 10, change: 'unified Area type with dynamic add/remove' })
    // Continue to v11 migration
    return migrateSchema(v10Data)
  }

  // Version 10 -> 11: Synchronize plant IDs (plural to singular)
  if (migrated.version < 11) {
    const v11Data = migrateToV11(migrated)
    v11Data.version = 11
    logger.info('Schema migration complete', { from: 10, to: 11, change: 'synchronized plant IDs' })
    // Continue to v12 migration
    return migrateSchema(v11Data)
  }

  // Version 11 -> 12: Add SowMethod and rename harvestDate
  if (migrated.version < 12) {
    const v12Data = migrateToV12(migrated)
    v12Data.version = 12
    logger.info('Schema migration complete', { from: 11, to: 12, change: 'added SowMethod and calculated harvest fields' })
    // Continue to v13 migration
    return migrateSchema(v12Data)
  }

  // Version 12 -> 13: Remove yearsUsed from StoredVariety (computed from plantings)
  if (migrated.version < 13) {
    const v13Data = migrateToV13(migrated)
    v13Data.version = 13
    logger.info('Schema migration complete', { from: 12, to: 13, change: 'removed yearsUsed from StoredVariety' })
    // Continue to v14 migration
    return migrateSchema(v13Data)
  }

  // Version 13 -> 14: Add gridPosition to AreaSeason for per-year layouts
  if (migrated.version < 14) {
    const v14Data = migrateToV14(migrated)
    v14Data.version = 14
    logger.info('Schema migration complete', { from: 13, to: 14, change: 'added per-year grid positions to AreaSeason' })
    // Continue to v15 migration
    return migrateSchema(v14Data)
  }

  // Version 14 -> 15: Add PlantingStatus for lifecycle tracking
  if (migrated.version < 15) {
    const v15Data = migrateToV15(migrated)
    v15Data.version = 15
    logger.info('Schema migration complete', { from: 14, to: 15, change: 'added PlantingStatus for lifecycle tracking' })
    // Continue to v16 migration
    return migrateSchema(v15Data)
  }

  // Version 15 -> 16: Remove plannedYears from StoredVariety (use seedsByYear instead)
  if (migrated.version < 16) {
    const v16Data = migrateToV16(migrated)
    v16Data.version = 16
    logger.info('Schema migration complete', { from: 15, to: 16, change: 'removed plannedYears from StoredVariety' })
    // Continue to v17 migration
    return migrateSchema(v16Data)
  }

  // Version 16 -> 17: Add customTasks array
  if (migrated.version < 17) {
    const v17Data = migrateToV17(migrated)
    v17Data.version = CURRENT_SCHEMA_VERSION
    logger.info('Schema migration complete', { from: 16, to: 17, change: 'added customTasks for free-form user tasks' })
    return v17Data
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
          // Note: uses harvestDate (old field) - v12 migration will rename to actualHarvestStart
          if (perm.underplantings?.length) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const convertedPlantings = perm.underplantings.map((u: any) => ({
              id: u.id,
              plantId: u.plantId,
              varietyName: u.varietyName,
              sowDate: u.sowDate,
              transplantDate: u.transplantDate,
              harvestDate: u.harvestDate, // Legacy field - renamed in v12
              success: u.success,
              notes: u.notes,
              quantity: u.quantity,
            }))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            existing.plantings = [...existing.plantings, ...convertedPlantings] as any
          }
        } else {
          // Create new area season from permanent
          // Note: uses harvestDate (old field) - v12 migration will rename to actualHarvestStart
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const plantingsFromUnderplantings = perm.underplantings?.map((u: any) => ({
            id: u.id,
            plantId: u.plantId,
            varietyName: u.varietyName,
            sowDate: u.sowDate,
            transplantDate: u.transplantDate,
            harvestDate: u.harvestDate, // Legacy field - renamed in v12
            success: u.success,
            notes: u.notes,
            quantity: u.quantity,
          })) || []
          areaSeasonsMap.set(perm.areaId, {
            areaId: perm.areaId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            plantings: plantingsFromUnderplantings as any,
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

/**
 * Migrate from v11 to v12: Add SowMethod and rename harvestDate
 * - Rename harvestDate to actualHarvestStart
 * - Default sowMethod to 'outdoor' when sowDate exists
 * - Leave expectedHarvest* undefined (calculated on demand)
 */
function migrateToV12(data: AllotmentData): AllotmentData {
  const migrated = { ...data }

  // Migrate plantings in seasons
  migrated.seasons = migrated.seasons.map(season => ({
    ...season,
    areas: season.areas.map(areaSeason => ({
      ...areaSeason,
      plantings: areaSeason.plantings.map(planting => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oldPlanting = planting as any
        const newPlanting: Planting = {
          id: planting.id,
          plantId: planting.plantId,
          varietyName: planting.varietyName,
          sowDate: planting.sowDate,
          transplantDate: planting.transplantDate,
          success: planting.success,
          notes: planting.notes,
          quantity: planting.quantity,
        }

        // Rename harvestDate -> actualHarvestStart
        if (oldPlanting.harvestDate) {
          newPlanting.actualHarvestStart = oldPlanting.harvestDate
        }

        // Default sowMethod when sowDate exists
        if (planting.sowDate && !planting.sowMethod) {
          newPlanting.sowMethod = 'outdoor'
        }

        return newPlanting
      }),
    })),
  }))

  return migrated
}

/**
 * Migrate from v12 to v13: Remove yearsUsed from StoredVariety
 * - Remove yearsUsed field (now computed from plantings via variety-queries)
 * - Initialize isArchived to false for all existing varieties
 */
function migrateToV13(data: AllotmentData): AllotmentData {
  const migrated = { ...data }

  // Remove yearsUsed from varieties and initialize isArchived
  if (migrated.varieties) {
    migrated.varieties = migrated.varieties.map(variety => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      const { yearsUsed, ...rest } = variety as any
      return {
        ...rest,
        isArchived: false,
      } as StoredVariety
    })
  }

  return migrated
}

/**
 * Migrate from v13 to v14: Add gridPosition to AreaSeason for per-year layouts
 * - Populate AreaSeason.gridPosition from separate 'allotment-grid-layout' localStorage key (if exists)
 * - Fallback to Area.gridPosition in layout.areas[]
 * - Delete the separate layout key after migration
 */
function migrateToV14(data: AllotmentData): AllotmentData {
  const migrated = { ...data }

  // Try to load saved positions from separate localStorage key
  let savedLayoutPositions: Record<string, GridPosition> = {}
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('allotment-grid-layout')
      if (saved) {
        const savedLayout = JSON.parse(saved) as Array<{ i: string; x: number; y: number; w: number; h: number }>
        savedLayoutPositions = savedLayout.reduce((acc, item) => {
          acc[item.i] = { x: item.x, y: item.y, w: item.w, h: item.h }
          return acc
        }, {} as Record<string, GridPosition>)
        logger.info('v14 migration: loaded positions from allotment-grid-layout', { count: Object.keys(savedLayoutPositions).length })
      }
    } catch (e) {
      logger.warn('v14 migration: failed to load saved layout positions', { error: String(e) })
    }
  }

  // Build area position lookup from layout.areas
  const areaPositions: Record<string, GridPosition> = {}
  for (const area of migrated.layout.areas || []) {
    if (area.gridPosition) {
      areaPositions[area.id] = area.gridPosition
    }
  }

  // Update each season's areas with gridPosition
  migrated.seasons = migrated.seasons.map(season => ({
    ...season,
    areas: (season.areas || []).map(areaSeason => {
      // Priority: savedLayoutPositions > areaPositions > undefined
      const position = savedLayoutPositions[areaSeason.areaId] ?? areaPositions[areaSeason.areaId]
      return position ? { ...areaSeason, gridPosition: position } : areaSeason
    }),
  }))

  // Delete the separate layout key after migration
  if (typeof window !== 'undefined') {
    try {
      if (localStorage.getItem('allotment-grid-layout')) {
        localStorage.removeItem('allotment-grid-layout')
        logger.info('v14 migration: removed allotment-grid-layout key')
      }
    } catch (e) {
      logger.warn('v14 migration: failed to remove allotment-grid-layout key', { error: String(e) })
    }
  }

  return migrated
}

/**
 * Migrate from v14 to v15: Add PlantingStatus for lifecycle tracking
 * - Infer status from existing dates: harvested if actualHarvestEnd, active if sowDate, planned otherwise
 */
function migrateToV15(data: AllotmentData): AllotmentData {
  const migrated = { ...data }

  // Update each season's plantings with inferred status
  migrated.seasons = migrated.seasons.map(season => ({
    ...season,
    areas: (season.areas || []).map(areaSeason => ({
      ...areaSeason,
      plantings: (areaSeason.plantings || []).map(planting => {
        // Infer status from dates
        let status: 'planned' | 'active' | 'harvested' | 'removed'
        if (planting.actualHarvestEnd) {
          status = 'harvested'
        } else if (planting.sowDate || planting.transplantDate) {
          status = 'active'
        } else {
          status = 'planned'
        }
        return { ...planting, status }
      }),
    })),
  }))

  logger.info('v15 migration: added PlantingStatus to all plantings')
  return migrated
}

/**
 * Migrate from v15 to v16: Remove plannedYears from StoredVariety
 * - plannedYears is replaced by seedsByYear - a variety is "planned" when it has a seedsByYear entry
 * - If a variety had plannedYears but no seedsByYear for those years, add 'none' status for them
 */
function migrateToV16(data: AllotmentData): AllotmentData {
  const migrated = { ...data }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrated.varieties = (migrated.varieties || []).map((v: any) => {
    const { plannedYears, ...rest } = v

    // If variety had plannedYears, ensure those years exist in seedsByYear
    const seedsByYear = { ...(rest.seedsByYear || {}) }
    if (Array.isArray(plannedYears)) {
      for (const year of plannedYears) {
        if (!(year in seedsByYear)) {
          seedsByYear[year] = 'none'
        }
      }
    }

    return { ...rest, seedsByYear }
  })

  logger.info('v16 migration: removed plannedYears from StoredVariety, migrated to seedsByYear')
  return migrated
}

/**
 * Migrate from v16 to v17: Add customTasks array
 */
function migrateToV17(data: AllotmentData): AllotmentData {
  const migrated = { ...data }
  migrated.customTasks = migrated.customTasks || []
  logger.info('v17 migration: added customTasks array')
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

