/**
 * Unified Allotment Data Model (v10)
 *
 * Single source of truth for all allotment data.
 *
 * v10 introduces a simplified unified Area type that consolidates
 * the previous BedArea, PermanentArea, and InfrastructureArea types.
 * All areas can now have plantings (strawberries under trees, flowers by shed, etc.)
 */

import type {
  RotationGroup,
  PlantingSuccess,
} from './garden-planner'

// ============ UNIFIED AREA SYSTEM (v10) ============

/**
 * What kind of area this is (for UI grouping/display)
 */
export type AreaKind =
  | 'rotation-bed'      // Annual crops with rotation tracking
  | 'perennial-bed'     // Perennial vegetables (asparagus, rhubarb)
  | 'tree'              // Fruit trees
  | 'berry'             // Berry bushes/patches
  | 'herb'              // Perennial herb areas
  | 'infrastructure'    // Shed, compost, paths, etc.
  | 'other'             // Catch-all for flexibility

/**
 * Infrastructure subtypes for areas with kind='infrastructure'
 */
export type InfrastructureSubtype =
  | 'shed'
  | 'compost'
  | 'water-butt'
  | 'path'
  | 'greenhouse'
  | 'pond'
  | 'wildlife'
  | 'other'

/**
 * Grid position for visual layout (react-grid-layout compatible)
 */
export interface GridPosition {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Primary/permanent plant for an area (trees, berries, perennial beds)
 */
export interface PrimaryPlant {
  plantId: string                 // Reference to vegetable database
  variety?: string
  plantedYear?: number
}

/**
 * Unified Area type - the single type for all allotment areas
 *
 * Every area can have plantings (annual crops, underplantings, flowers, etc.)
 * The 'kind' field determines how it's displayed and what UI is shown.
 */
export interface Area {
  id: string                        // Dynamic string ID (e.g., 'bed-a', 'apple-north')
  name: string                      // Display name
  kind: AreaKind
  description?: string

  // Grid position (for visual layout)
  gridPosition?: GridPosition

  // Visual customization
  icon?: string                     // Emoji for display
  color?: string                    // Background color (hex)

  // Plantings - all areas can have seasonal plantings
  canHavePlantings: boolean         // Whether this area accepts seasonal plantings
  rotationGroup?: RotationGroup     // For rotation-bed only - tracks crop rotation

  // For areas with a primary/permanent plant (tree, berry, herb, perennial-bed)
  primaryPlant?: PrimaryPlant

  // For infrastructure areas
  infrastructureSubtype?: InfrastructureSubtype

  // Lifecycle
  isArchived?: boolean              // Soft delete - preserves historical data
  createdAt?: string                // ISO date string

  // Temporal metadata for area history
  /**
   * Year this area was physically built/established.
   * If undefined, area is treated as having always existed (backward compat).
   */
  createdYear?: number

  /**
   * Year this area was removed/demolished.
   * If undefined, area is still active.
   */
  retiredYear?: number

  /**
   * Explicit list of years this area was active.
   * Takes precedence over createdYear/retiredYear if specified.
   * Useful for beds that were temporarily removed and rebuilt.
   */
  activeYears?: number[]
}

/**
 * Input for creating a new area (without id and createdAt)
 */
export type NewArea = Omit<Area, 'id' | 'createdAt'>

/**
 * Input for updating an area (partial, without id)
 */
export type AreaUpdate = Partial<Omit<Area, 'id'>>

// ============ UNIFIED DATA MODEL ============

/**
 * Root data structure for the entire allotment
 * Stored in localStorage as a single JSON object
 */
export interface AllotmentData {
  version: number                    // Schema version for migrations
  meta: AllotmentMeta
  layout: AllotmentLayoutData
  seasons: SeasonRecord[]            // All historical + current seasons
  currentYear: number                // Which year is "active"
  maintenanceTasks?: MaintenanceTask[] // Perennial plant care tasks
  gardenEvents?: GardenEvent[]       // Log of garden events (pruning, feeding, etc.)
  varieties: StoredVariety[]         // Seed varieties (consolidated from separate storage)
}

/**
 * Allotment metadata
 */
export interface AllotmentMeta {
  name: string                       // "My Edinburgh Allotment"
  location?: string                  // "Edinburgh, Scotland"
  createdAt: string                  // ISO date string
  updatedAt: string                  // ISO date string
  migrationState?: MigrationState    // Track incomplete migrations for recovery
  setupCompleted?: boolean           // Whether the setup wizard has been completed
}

/**
 * Tracks migration progress for interrupted migration recovery
 */
export interface MigrationState {
  targetVersion: number              // Version we're migrating to
  startedAt: string                  // ISO date when migration started
  step: string                       // Current step for debugging
}

/**
 * Physical layout of the allotment
 * v10 uses unified Area type for all areas
 */
export interface AllotmentLayoutData {
  areas: Area[]
}

// ============ SEASON RECORDS ============

/**
 * Status of a season record
 */
export type SeasonStatus = 'historical' | 'current' | 'planned'

/**
 * Complete record for one growing season (year)
 */
export interface SeasonRecord {
  year: number
  status: SeasonStatus
  areas: AreaSeason[]                // Per-area plantings and notes for this year
  notes?: string                     // General notes for the season
  createdAt: string
  updatedAt: string
}

/**
 * Type of area note (visual indicator)
 */
export type AreaNoteType = 'warning' | 'error' | 'success' | 'info'

/**
 * A note attached to an area for a specific season
 */
export interface AreaNote {
  id: string
  content: string
  type: AreaNoteType
  createdAt: string
  updatedAt: string
}

/**
 * One area's plantings and data for a season
 */
export interface AreaSeason {
  areaId: string                     // Reference to Area.id
  rotationGroup?: RotationGroup      // Snapshot for this year (can change year-to-year)
  plantings: Planting[]              // Seasonal plantings in this area
  notes?: AreaNote[]                 // Per-area notes for this season
  careLogs?: CareLogEntry[]          // Care logs for permanent areas
  harvestTotal?: number              // Aggregated harvest for the year
  harvestUnit?: string               // kg, lbs, count, etc.
}

// ============ PLANTINGS ============

/**
 * A single planting within an area for a season
 */
export interface Planting {
  id: string                         // Unique ID (generated)
  plantId: string                    // Reference to Vegetable.id from database
  varietyName?: string               // "Kelvedon Wonder", "Nantes 2", etc.

  // Dates (all optional)
  sowDate?: string                   // ISO date string
  transplantDate?: string            // ISO date string
  harvestDate?: string               // ISO date string

  // Outcome tracking
  success?: PlantingSuccess
  notes?: string                     // Free-form notes

  // Optional quantity
  quantity?: number
}

/**
 * Input for creating a new planting (without ID)
 */
export type NewPlanting = Omit<Planting, 'id'>

/**
 * Input for updating a planting (partial, without ID)
 */
export type PlantingUpdate = Partial<Omit<Planting, 'id'>>

// ============ MAINTENANCE TASKS ============

/**
 * Type of maintenance task
 */
export type MaintenanceTaskType = 'prune' | 'feed' | 'spray' | 'mulch' | 'harvest' | 'other'

/**
 * A maintenance task for perennial plants (trees, shrubs, berries)
 */
export interface MaintenanceTask {
  id: string                         // Unique ID
  areaId: string                     // Links to area ID (was plantingId)
  type: MaintenanceTaskType
  month: number                      // 1-12 when task should be done
  description: string                // e.g., "Winter prune apple trees"
  lastCompleted?: string             // ISO date of last completion
  notes?: string                     // Additional notes
}

/**
 * Input for creating a new maintenance task
 */
export type NewMaintenanceTask = Omit<MaintenanceTask, 'id'>

// ============ CARE LOGGING TYPES ============

/**
 * Type of care log entry
 */
export type CareLogType = 'prune' | 'feed' | 'mulch' | 'spray' | 'harvest' | 'observation' | 'other'

/**
 * Care log entry for an area in a specific year
 */
export interface CareLogEntry {
  id: string
  type: CareLogType
  date: string                  // ISO date string
  description?: string
  quantity?: number             // For harvest: yield amount
  unit?: string                 // For harvest: kg, lbs, count
}

/**
 * Input for creating a new care log entry
 */
export type NewCareLogEntry = Omit<CareLogEntry, 'id'>

// ============ GARDEN EVENTS ============

/**
 * Type of garden event
 */
export type GardenEventType =
  | 'prune'
  | 'feed'
  | 'spray'
  | 'mulch'
  | 'soil-amendment'
  | 'pest-treatment'
  | 'harvest'
  | 'other'

/**
 * A garden event log entry
 */
export interface GardenEvent {
  id: string                       // Unique ID
  type: GardenEventType
  date: string                     // ISO date string
  description: string              // What was done
  areaId?: string                  // Optional - which area affected
  product?: string                 // Optional - what product/material used
  notes?: string                   // Additional notes
  createdAt: string
}

/**
 * Input for creating a new garden event
 */
export type NewGardenEvent = Omit<GardenEvent, 'id' | 'createdAt'>

// ============ SEED VARIETIES ============

/**
 * Seed inventory status for a specific year
 */
export type SeedStatus = 'none' | 'ordered' | 'have'

/**
 * A stored seed variety with year tracking
 */
export interface StoredVariety {
  id: string
  plantId: string                    // Reference to vegetable index
  name: string                       // Variety name, e.g., "Kelvedon Wonder"
  supplier?: string
  price?: number
  notes?: string
  yearsUsed: number[]                // Historical record of years used
  plannedYears: number[]             // @deprecated - inferred from plantings in allotment
  available?: boolean                // If true, available for selection in any year
  seedsByYear: Record<number, SeedStatus>  // Per-year inventory status
  perenualId?: string                // Future: external API integration
  gbifId?: string                    // Future: taxonomic validation
}

/**
 * Input for creating a new variety
 */
export interface NewVariety {
  plantId: string
  name: string
  supplier?: string
  price?: number
  notes?: string
  available?: boolean                // If true, available for selection in any year
  plannedYears?: number[]            // @deprecated - kept for backward compatibility
  seedsByYear?: Record<number, SeedStatus>
}

/**
 * Input for updating a variety (partial, without ID)
 */
export type VarietyUpdate = Partial<Omit<StoredVariety, 'id'>>

// ============ STORAGE CONSTANTS ============

export const STORAGE_KEY = 'allotment-unified-data'
export const CURRENT_SCHEMA_VERSION = 11 // Synchronized plant IDs between index and database

// ============ HELPER TYPES ============

// Re-export from shared storage types
export type { StorageResult } from './storage'

/**
 * Input for creating a new season
 */
export interface NewSeasonInput {
  year: number
  status?: SeasonStatus
  notes?: string
}

/**
 * Input for creating a new area note (without ID and timestamps)
 */
export type NewAreaNote = Omit<AreaNote, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Input for updating an area note (partial, without ID)
 */
export type AreaNoteUpdate = Partial<Omit<AreaNote, 'id' | 'createdAt'>>

// ============ LEGACY TYPE ALIASES (for migration compatibility) ============

/**
 * @deprecated Use AreaNote instead
 */
export type BedNote = AreaNote

/**
 * @deprecated Use AreaNoteType instead
 */
export type BedNoteType = AreaNoteType

/**
 * @deprecated Use NewAreaNote instead
 */
export type NewBedNote = NewAreaNote

/**
 * @deprecated Use AreaNoteUpdate instead
 */
export type BedNoteUpdate = AreaNoteUpdate

/**
 * @deprecated Use AreaSeason instead. Kept for v9 migration.
 */
export interface BedSeason {
  bedId: string                      // Now string, was PhysicalBedId
  rotationGroup: RotationGroup
  plantings: Planting[]
  notes?: AreaNote[]
}

/**
 * @deprecated v9 area types - kept for migration compatibility
 */
export type AreaType = 'bed' | 'permanent' | 'infrastructure'

/**
 * @deprecated Use Area with kind='rotation-bed' or 'perennial-bed'
 */
export interface BedArea {
  id: string
  type: 'bed'
  name: string
  description?: string
  status: 'rotation' | 'perennial'
  rotationGroup?: RotationGroup
  gridPosition?: { startRow: number; startCol: number; endRow: number; endCol: number }
}

/**
 * @deprecated Use Area with kind='tree', 'berry', 'herb', or 'perennial-bed'
 */
export interface PermanentArea {
  id: string
  type: 'permanent'
  name: string
  description?: string
  plantingType: 'fruit-tree' | 'berry' | 'perennial-veg' | 'herb'
  plantId?: string
  variety?: string
  plantedYear?: number
  gridPosition?: { startRow: number; startCol: number; endRow: number; endCol: number }
}

/**
 * @deprecated Use Area with kind='infrastructure'
 */
export interface InfrastructureArea {
  id: string
  type: 'infrastructure'
  name: string
  description?: string
  infrastructureType: InfrastructureSubtype
  gridPosition?: { startRow: number; startCol: number; endRow: number; endCol: number }
}

/**
 * @deprecated v9 discriminated union - use Area instead
 */
export type LegacyArea = BedArea | PermanentArea | InfrastructureArea

/**
 * @deprecated v9 permanent underplanting - now just use Planting in any area
 */
export interface PermanentUnderplanting {
  id: string
  parentAreaId: string
  plantId: string
  variety?: string
  plantedYear?: number
  notes?: string
}

/**
 * @deprecated v9 seasonal underplanting - now just use Planting in any area
 */
export interface SeasonalUnderplanting extends Planting {
  parentAreaId: string
}

/**
 * @deprecated v9 permanent season - now merged into AreaSeason
 */
export interface PermanentSeason {
  areaId: string
  careLogs: CareLogEntry[]
  seasonNotes?: string
  harvestTotal?: number
  harvestUnit?: string
  underplantings: SeasonalUnderplanting[]
}

// ============ UNIFIED ITEM SELECTION TYPES ============

/**
 * Type discriminator for allotment items (for UI selection)
 * In v10, all items are Areas but we keep this for backward compatibility
 */
export type AllotmentItemType = 'area'

/**
 * Reference to any item in the allotment (for selection)
 */
export interface AllotmentItemRef {
  type: AllotmentItemType
  id: string
}
