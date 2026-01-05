/**
 * Year-aware Seed Variety Tracking Types
 *
 * Stores user's seed varieties with year planning and tracking.
 * Supports both historical records and future planning.
 */

import type { StorageResult } from './unified-allotment'

export { StorageResult }

export interface VarietyData {
  version: number
  varieties: StoredVariety[]
  haveSeeds: string[]  // Global - IDs of varieties user has
  lastMigrationYear?: number  // Track when year migration last ran
  meta: { createdAt: string; updatedAt: string }
}

export interface StoredVariety {
  id: string
  vegetableId: string
  name: string
  supplier?: string
  price?: number
  notes?: string
  yearsUsed: number[]      // Historical record
  plannedYears: number[]   // Years user plans to use this
}

export interface NewVariety {
  vegetableId: string
  name: string
  supplier?: string
  price?: number
  notes?: string
  plannedYears?: number[]
}

export type VarietyUpdate = Partial<Omit<StoredVariety, 'id'>>

export const VARIETY_STORAGE_KEY = 'community-allotment-varieties'
export const VARIETY_SCHEMA_VERSION = 1
