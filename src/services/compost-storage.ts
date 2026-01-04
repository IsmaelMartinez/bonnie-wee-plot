/**
 * Compost Storage Service
 *
 * Handles all localStorage operations for compost pile tracking.
 * Follows the same patterns as allotment-storage.ts.
 */

import {
  CompostData,
  CompostPile,
  CompostInput,
  CompostEvent,
  NewCompostPile,
  NewCompostInput,
  NewCompostEvent,
  COMPOST_STORAGE_KEY,
  COMPOST_SCHEMA_VERSION,
} from '@/types/compost'
import { generateId } from '@/lib/utils/id'
import { StorageResult } from '@/types/storage'

export type { StorageResult } from '@/types/storage'

// ============ VALIDATION ============

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.code === 22)
  )
}

function validateCompostData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>

  if (typeof obj.version !== 'number') return false
  if (!Array.isArray(obj.piles)) return false

  return true
}

// ============ CORE STORAGE OPERATIONS ============

/**
 * Load compost data from localStorage
 */
export function loadCompostData(): StorageResult<CompostData> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    const stored = localStorage.getItem(COMPOST_STORAGE_KEY)

    if (!stored) {
      return { success: false, error: 'No data found' }
    }

    let data: unknown
    try {
      data = JSON.parse(stored)
    } catch {
      return { success: false, error: 'Corrupted data: invalid JSON' }
    }

    if (!validateCompostData(data)) {
      return { success: false, error: 'Invalid data schema' }
    }

    return { success: true, data: data as CompostData }
  } catch (error) {
    console.error('Failed to load compost data:', error)
    return { success: false, error: 'Failed to load stored data' }
  }
}

/**
 * Save compost data to localStorage
 */
export function saveCompostData(data: CompostData): StorageResult<void> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' }
  }

  try {
    const dataToSave: CompostData = {
      ...data,
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem(COMPOST_STORAGE_KEY, JSON.stringify(dataToSave))
    return { success: true }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      return { success: false, error: 'Storage quota exceeded' }
    }
    console.error('Failed to save compost data:', error)
    return { success: false, error: 'Failed to save data' }
  }
}

/**
 * Initialize compost storage with empty data if needed
 */
export function initializeCompostStorage(): StorageResult<CompostData> {
  const loadResult = loadCompostData()

  if (loadResult.success && loadResult.data) {
    return loadResult
  }

  // Create empty data structure
  const now = new Date().toISOString()
  const emptyData: CompostData = {
    version: COMPOST_SCHEMA_VERSION,
    piles: [],
    createdAt: now,
    updatedAt: now,
  }

  const saveResult = saveCompostData(emptyData)
  if (!saveResult.success) {
    return { success: false, error: 'Failed to initialize compost storage' }
  }

  return { success: true, data: emptyData }
}

// ============ PILE OPERATIONS ============

/**
 * Add a new compost pile
 */
export function addPile(data: CompostData, pile: NewCompostPile): CompostData {
  const now = new Date().toISOString()
  const newPile: CompostPile = {
    ...pile,
    id: generateId('pile'),
    inputs: [],
    events: [],
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...data,
    piles: [...data.piles, newPile],
    updatedAt: now,
  }
}

/**
 * Update a compost pile
 */
export function updatePile(
  data: CompostData,
  pileId: string,
  updates: Partial<Omit<CompostPile, 'id' | 'inputs' | 'events' | 'createdAt'>>
): CompostData {
  const now = new Date().toISOString()

  return {
    ...data,
    piles: data.piles.map(pile =>
      pile.id === pileId
        ? { ...pile, ...updates, updatedAt: now }
        : pile
    ),
    updatedAt: now,
  }
}

/**
 * Remove a compost pile
 */
export function removePile(data: CompostData, pileId: string): CompostData {
  return {
    ...data,
    piles: data.piles.filter(pile => pile.id !== pileId),
    updatedAt: new Date().toISOString(),
  }
}

// ============ INPUT OPERATIONS ============

/**
 * Add an input to a compost pile
 */
export function addInput(
  data: CompostData,
  pileId: string,
  input: NewCompostInput
): CompostData {
  const now = new Date().toISOString()
  const newInput: CompostInput = {
    ...input,
    id: generateId('input'),
  }

  return {
    ...data,
    piles: data.piles.map(pile =>
      pile.id === pileId
        ? { ...pile, inputs: [...pile.inputs, newInput], updatedAt: now }
        : pile
    ),
    updatedAt: now,
  }
}

/**
 * Remove an input from a compost pile
 */
export function removeInput(
  data: CompostData,
  pileId: string,
  inputId: string
): CompostData {
  const now = new Date().toISOString()

  return {
    ...data,
    piles: data.piles.map(pile =>
      pile.id === pileId
        ? { ...pile, inputs: pile.inputs.filter(i => i.id !== inputId), updatedAt: now }
        : pile
    ),
    updatedAt: now,
  }
}

// ============ EVENT OPERATIONS ============

/**
 * Add an event to a compost pile
 */
export function addEvent(
  data: CompostData,
  pileId: string,
  event: NewCompostEvent
): CompostData {
  const now = new Date().toISOString()
  const newEvent: CompostEvent = {
    ...event,
    id: generateId('event'),
  }

  return {
    ...data,
    piles: data.piles.map(pile =>
      pile.id === pileId
        ? { ...pile, events: [...pile.events, newEvent], updatedAt: now }
        : pile
    ),
    updatedAt: now,
  }
}

/**
 * Remove an event from a compost pile
 */
export function removeEvent(
  data: CompostData,
  pileId: string,
  eventId: string
): CompostData {
  const now = new Date().toISOString()

  return {
    ...data,
    piles: data.piles.map(pile =>
      pile.id === pileId
        ? { ...pile, events: pile.events.filter(e => e.id !== eventId), updatedAt: now }
        : pile
    ),
    updatedAt: now,
  }
}

// ============ QUERY OPERATIONS ============

/**
 * Get a pile by ID
 */
export function getPileById(data: CompostData, pileId: string): CompostPile | undefined {
  return data.piles.find(pile => pile.id === pileId)
}

/**
 * Get piles by status
 */
export function getPilesByStatus(data: CompostData, status: CompostPile['status']): CompostPile[] {
  return data.piles.filter(pile => pile.status === status)
}

/**
 * Get active piles (not yet applied)
 */
export function getActivePiles(data: CompostData): CompostPile[] {
  return data.piles.filter(pile => pile.status !== 'applied')
}
