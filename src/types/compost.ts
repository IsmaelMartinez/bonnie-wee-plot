/**
 * Compost Domain Types
 *
 * Tracks compost pile management including inputs, turnings, and maturity.
 */

// ============ COMPOST PILE TYPES ============

/**
 * Type of compost system
 */
export type CompostSystemType = 'hot-compost' | 'cold-compost' | 'tumbler' | 'bokashi' | 'worm-bin'

/**
 * Status of a compost pile
 */
export type CompostStatus = 'active' | 'maturing' | 'ready' | 'applied'

/**
 * Type of compost input material
 */
export type CompostInputType = 'green' | 'brown' | 'other'

/**
 * A compost input (material added to the pile)
 */
export interface CompostInput {
  id: string
  date: string                    // ISO date string
  material: string                // e.g., "Kitchen scraps", "Grass clippings"
  type: CompostInputType          // green (nitrogen-rich), brown (carbon-rich)
  quantity?: string               // e.g., "1 bucket", "wheelbarrow"
  notes?: string
}

/**
 * A compost turning/management event
 */
export interface CompostEvent {
  id: string
  date: string                    // ISO date string
  type: 'turn' | 'water' | 'check-temp' | 'harvest' | 'other'
  notes?: string
  temperature?: number            // Optional temp reading in Celsius
}

/**
 * A compost pile
 */
export interface CompostPile {
  id: string
  name: string                    // e.g., "Bay 1", "Main Tumbler"
  systemType: CompostSystemType
  status: CompostStatus
  startDate: string               // ISO date string when pile was started
  inputs: CompostInput[]
  events: CompostEvent[]
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * Root data structure for compost tracking
 */
export interface CompostData {
  version: number
  piles: CompostPile[]
  createdAt: string
  updatedAt: string
}

// ============ STORAGE CONSTANTS ============

export const COMPOST_STORAGE_KEY = 'compost-data'
export const COMPOST_SCHEMA_VERSION = 1

// ============ HELPER TYPES ============

/**
 * Input for creating a new compost pile
 */
export type NewCompostPile = Omit<CompostPile, 'id' | 'inputs' | 'events' | 'createdAt' | 'updatedAt'>

/**
 * Input for adding a compost input
 */
export type NewCompostInput = Omit<CompostInput, 'id'>

/**
 * Input for adding a compost event
 */
export type NewCompostEvent = Omit<CompostEvent, 'id'>
