/**
 * Unified Allotment Data Model
 * 
 * Single source of truth for all allotment data.
 * Replaces the disconnected data models from:
 * - allotment-layout.ts (hardcoded layout)
 * - historical-plans.ts (hardcoded seasons)
 * - garden-storage.ts (localStorage with different IDs)
 * 
 * Note: Types like PhysicalBedId, RotationGroup, PhysicalBed, etc. should be
 * imported directly from '@/types/garden-planner'
 */

import type {
  PhysicalBedId,
  RotationGroup,
  PlantingSuccess,
  PhysicalBed,
  PermanentPlanting,
  InfrastructureItem,
  AllotmentItemType,
  AllotmentItemRef,
} from './garden-planner'

// Re-export unified item types for convenience
export type { AllotmentItemType, AllotmentItemRef }

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
 * Rarely changes - beds, trees, infrastructure
 *
 * v9+ uses unified areas array as the primary storage mechanism.
 * Legacy arrays (beds, permanentPlantings, infrastructure) are optional
 * and maintained only for backward compatibility during migration.
 *
 * @see Area - the unified area type (BedArea | PermanentArea | InfrastructureArea)
 */
export interface AllotmentLayoutData {
  // Primary storage (v9+) - unified area system
  areas: Area[]
  permanentUnderplantings: PermanentUnderplanting[]
  // Legacy arrays (v8 and earlier) - optional for backward compatibility only
  /** @deprecated Use areas array instead. Only present for backward compatibility. */
  beds?: PhysicalBed[]
  /** @deprecated Use areas array instead. Only present for backward compatibility. */
  permanentPlantings?: PermanentPlanting[]
  /** @deprecated Use areas array instead. Only present for backward compatibility. */
  infrastructure?: InfrastructureItem[]
}

// ============ SEASON RECORDS ============

/**
 * Status of a season record
 */
export type SeasonStatus = 'historical' | 'current' | 'planned'

/**
 * Complete record for one growing season (year)
 *
 * v9 adds permanents array for per-year tracking of permanent plantings.
 */
export interface SeasonRecord {
  year: number
  status: SeasonStatus
  beds: BedSeason[]
  permanents?: PermanentSeason[]     // v9: per-year tracking for permanent areas
  notes?: string                     // General notes for the season
  createdAt: string
  updatedAt: string
}

/**
 * Type of bed note (visual indicator)
 */
export type BedNoteType = 'warning' | 'error' | 'success' | 'info'

/**
 * A note attached to a bed for a specific season
 */
export interface BedNote {
  id: string
  content: string
  type: BedNoteType
  createdAt: string
  updatedAt: string
}

/**
 * One bed's plantings for a season
 */
export interface BedSeason {
  bedId: PhysicalBedId
  rotationGroup: RotationGroup
  plantings: Planting[]              // Multiple plantings per bed
  notes?: BedNote[]                  // Per-bed notes for this season
}

// ============ PLANTINGS ============

/**
 * A single planting within a bed for a season
 * Simplified from the old PlantedVariety type
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
  plantingId: string                 // Links to permanent planting ID
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
  bedId?: string                   // Optional - which bed(s) affected
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
  plannedYears: number[]             // Years user plans to use this variety
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
  plannedYears?: number[]
  seedsByYear?: Record<number, SeedStatus>
}

/**
 * Input for updating a variety (partial, without ID)
 */
export type VarietyUpdate = Partial<Omit<StoredVariety, 'id'>>

// ============ UNIFIED AREA SYSTEM (v9) ============

/**
 * Area type discriminator for unified area system
 */
export type AreaType = 'bed' | 'permanent' | 'infrastructure'

/**
 * Common fields for all areas
 */
export interface AreaBase {
  id: string
  type: AreaType
  name: string
  description?: string
  gridPosition?: {
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }
}

/**
 * Bed area - for annual rotation crops
 */
export interface BedArea extends AreaBase {
  type: 'bed'
  status: 'rotation' | 'perennial'
  rotationGroup?: RotationGroup
}

/**
 * Permanent planting area - trees, berries, perennial vegetables
 */
export interface PermanentArea extends AreaBase {
  type: 'permanent'
  plantingType: 'fruit-tree' | 'berry' | 'perennial-veg' | 'herb'
  plantId?: string              // Reference to vegetable database
  variety?: string
  plantedYear?: number
}

/**
 * Infrastructure area - non-plant features
 */
export interface InfrastructureArea extends AreaBase {
  type: 'infrastructure'
  infrastructureType: 'shed' | 'compost' | 'water-butt' | 'path' | 'greenhouse' | 'pond' | 'wildlife' | 'other'
}

/**
 * Discriminated union of all area types
 */
export type Area = BedArea | PermanentArea | InfrastructureArea

// ============ UNDERPLANTING TYPES ============

/**
 * Permanent underplanting - persists across years
 * Example: strawberries under damson tree
 */
export interface PermanentUnderplanting {
  id: string
  parentAreaId: string          // The area this is under (e.g., 'damson')
  plantId: string               // Reference to vegetable database
  variety?: string
  plantedYear?: number
  notes?: string
}

/**
 * Seasonal underplanting - tracked per year like regular plantings
 * Example: lettuce under apple tree in summer 2026
 */
export interface SeasonalUnderplanting extends Planting {
  parentAreaId: string          // The permanent area this is under
}

/**
 * Input for creating a new permanent underplanting
 */
export type NewPermanentUnderplanting = Omit<PermanentUnderplanting, 'id'>

/**
 * Input for creating a new seasonal underplanting
 * Note: parentAreaId is passed separately to the storage function
 */
export type NewSeasonalUnderplanting = Omit<SeasonalUnderplanting, 'id' | 'parentAreaId'>

// ============ CARE LOGGING TYPES ============

/**
 * Type of care log entry
 */
export type CareLogType = 'prune' | 'feed' | 'mulch' | 'spray' | 'harvest' | 'observation' | 'other'

/**
 * Care log entry for a permanent planting in a specific year
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

/**
 * Per-year record for a permanent planting
 * Stored in SeasonRecord similar to BedSeason
 */
export interface PermanentSeason {
  areaId: string                // Reference to permanent area
  careLogs: CareLogEntry[]
  seasonNotes?: string          // General notes for this year
  harvestTotal?: number         // Aggregated harvest for the year
  harvestUnit?: string
  underplantings: SeasonalUnderplanting[]  // Seasonal underplantings for this area/year
}

// ============ UNIFIED LAYOUT DATA (v9) ============

/**
 * Updated layout data with unified areas array
 * Replaces separate beds/permanentPlantings/infrastructure arrays
 */
export interface AllotmentLayoutDataV9 {
  areas: Area[]
  permanentUnderplantings: PermanentUnderplanting[]
}

/**
 * Updated season record with permanent plantings tracking
 */
export interface SeasonRecordV9 {
  year: number
  status: SeasonStatus
  beds: BedSeason[]             // Unchanged - annual bed plantings
  permanents: PermanentSeason[] // NEW - per-year tracking for permanent areas
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * Root data structure for schema v9
 */
export interface AllotmentDataV9 {
  version: 9
  meta: AllotmentMeta
  layout: AllotmentLayoutDataV9
  seasons: SeasonRecordV9[]
  currentYear: number
  maintenanceTasks?: MaintenanceTask[]
  gardenEvents?: GardenEvent[]
  varieties: StoredVariety[]
}

// ============ STORAGE CONSTANTS ============

export const STORAGE_KEY = 'allotment-unified-data'
export const CURRENT_SCHEMA_VERSION = 9 // Unified area system with underplantings and care logging

// ============ HELPER TYPES ============

// Re-export from shared storage types
export type { StorageResult } from './storage'

/**
 * Input for creating a new planting (without ID)
 */
export type NewPlanting = Omit<Planting, 'id'>

/**
 * Input for updating a planting (partial, without ID)
 */
export type PlantingUpdate = Partial<Omit<Planting, 'id'>>

/**
 * Input for creating a new season
 */
export interface NewSeasonInput {
  year: number
  status?: SeasonStatus
  notes?: string
}

/**
 * Input for creating a new bed note (without ID and timestamps)
 */
export type NewBedNote = Omit<BedNote, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Input for updating a bed note (partial, without ID)
 */
export type BedNoteUpdate = Partial<Omit<BedNote, 'id' | 'createdAt'>>

