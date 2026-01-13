/**
 * Year-aware Seed Variety Tracking Types
 *
 * Stores user's seed varieties with year planning and tracking.
 * Supports both historical records and future planning.
 */

import type { StorageResult } from './unified-allotment'

export { StorageResult }

export type SeedStatus = 'none' | 'ordered' | 'have'

export interface VarietyData {
  version: number
  varieties: StoredVariety[]
  haveSeeds?: string[]  // DEPRECATED: Will be removed in v2 migration - kept for backward compatibility
  lastMigrationYear?: number  // Track when year migration last ran
  meta: { createdAt: string; updatedAt: string }
}

export interface StoredVariety {
  id: string
  plantId: string
  name: string
  supplier?: string
  price?: number
  notes?: string
  yearsUsed: number[]      // Historical record
  plannedYears: number[]   // @deprecated - inferred from plantings in allotment
  available?: boolean      // If true, available for selection in any year
  seedsByYear: Record<number, SeedStatus>  // Per-year seed inventory: { 2026: 'have', 2027: 'ordered' }
}

export interface NewVariety {
  plantId: string
  name: string
  supplier?: string
  price?: number
  notes?: string
  available?: boolean      // If true, available for selection in any year
  plannedYears?: number[]  // @deprecated - kept for backward compatibility
}

export type VarietyUpdate = Partial<Omit<StoredVariety, 'id'>>

export const VARIETY_STORAGE_KEY = 'community-allotment-varieties'
export const VARIETY_SCHEMA_VERSION = 2
