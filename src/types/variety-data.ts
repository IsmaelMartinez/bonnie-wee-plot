/**
 * Year-aware Seed Variety Tracking Types
 *
 * Stores user's seed varieties with year planning and tracking.
 * Supports both historical records and future planning.
 *
 * Core types (StoredVariety, NewVariety, VarietyUpdate, SeedStatus) are defined
 * in unified-allotment.ts and re-exported here for backward compatibility.
 */

// Re-export shared types from unified-allotment (single source of truth)
export type {
  StorageResult,
  StoredVariety,
  NewVariety,
  VarietyUpdate,
  SeedStatus,
} from './unified-allotment'

import type { StoredVariety } from './unified-allotment'

/**
 * Wrapper for variety storage (separate from AllotmentData for legacy compatibility)
 * Used by variety-storage.ts and export/import operations
 */
export interface VarietyData {
  version: number
  varieties: StoredVariety[]
  haveSeeds?: string[]  // DEPRECATED: Will be removed in v2 migration - kept for backward compatibility
  lastMigrationYear?: number  // Track when year migration last ran
  meta: { createdAt: string; updatedAt: string }
}

export const VARIETY_STORAGE_KEY = 'community-allotment-varieties'
export const VARIETY_SCHEMA_VERSION = 2
