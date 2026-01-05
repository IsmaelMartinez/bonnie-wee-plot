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
} from './garden-planner'

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
}

/**
 * Allotment metadata
 */
export interface AllotmentMeta {
  name: string                       // "My Edinburgh Allotment"
  location?: string                  // "Edinburgh, Scotland"
  createdAt: string                  // ISO date string
  updatedAt: string                  // ISO date string
}

/**
 * Physical layout of the allotment
 * Rarely changes - beds, trees, infrastructure
 */
export interface AllotmentLayoutData {
  beds: PhysicalBed[]
  permanentPlantings: PermanentPlanting[]
  infrastructure: InfrastructureItem[]
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
  beds: BedSeason[]
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

// ============ STORAGE CONSTANTS ============

export const STORAGE_KEY = 'allotment-unified-data'
export const CURRENT_SCHEMA_VERSION = 5 // Bumped for gardenEvents

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

