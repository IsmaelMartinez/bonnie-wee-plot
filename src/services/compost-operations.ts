/**
 * Compost Operations
 *
 * Pure mutation and query helpers for compost piles. Operate on a
 * `CompostData` view that `useCompost` derives from `AllotmentData`.
 *
 * Compost data itself lives in `AllotmentData.compost` as of schema v18 —
 * this module no longer owns any localStorage state.
 */

import {
  CompostData,
  CompostPile,
  CompostInput,
  CompostEvent,
  NewCompostPile,
  NewCompostInput,
  NewCompostEvent,
} from '@/types/compost'
import { generateId } from '@/lib/utils/id'

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
