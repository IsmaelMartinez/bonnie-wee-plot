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
export function addCompostPile(data: CompostData, pile: NewCompostPile): CompostData {
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
export function updateCompostPile(
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
export function removeCompostPile(data: CompostData, pileId: string): CompostData {
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
export function addCompostInput(
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
export function removeCompostInput(
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
export function addCompostEvent(
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
export function removeCompostEvent(
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
export function getCompostPileById(data: CompostData, pileId: string): CompostPile | undefined {
  return data.piles.find(pile => pile.id === pileId)
}

/**
 * Get piles by status
 */
export function getCompostPilesByStatus(data: CompostData, status: CompostPile['status']): CompostPile[] {
  return data.piles.filter(pile => pile.status === status)
}

/**
 * Get active piles (not yet applied)
 */
export function getActiveCompostPiles(data: CompostData): CompostPile[] {
  return data.piles.filter(pile => pile.status !== 'applied')
}

// ============ NEEDS-TURNING PREDICATE ============

/**
 * Days of inactivity after which an active/maturing pile is considered to
 * "need turning". Activity = a turn or harvest event, an input added, or the
 * pile being created. Anything that signals the user has touched the pile
 * resets the clock.
 */
export const NEEDS_TURNING_THRESHOLD_DAYS = 7

/**
 * Most recent timestamp (ISO string) at which the pile was meaningfully
 * touched: turned, harvested, or had material added. Falls back to the
 * pile's start date when nothing has happened yet.
 */
export function getLastActivityDate(pile: CompostPile): string {
  let latest = pile.startDate
  for (const event of pile.events) {
    if ((event.type === 'turn' || event.type === 'harvest') && event.date > latest) {
      latest = event.date
    }
  }
  for (const input of pile.inputs) {
    if (input.date > latest) {
      latest = input.date
    }
  }
  return latest
}

/**
 * True when an active/maturing pile has not been touched for at least
 * `NEEDS_TURNING_THRESHOLD_DAYS` days. Ready and applied piles never
 * "need turning".
 */
export function pileNeedsTurning(pile: CompostPile, now: Date = new Date()): boolean {
  if (pile.status !== 'active' && pile.status !== 'maturing') return false
  const lastActivity = new Date(getLastActivityDate(pile))
  const daysSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince >= NEEDS_TURNING_THRESHOLD_DAYS
}

/**
 * Active/maturing piles that have not been touched within the threshold.
 */
export function getCompostPilesNeedingTurn(data: CompostData, now: Date = new Date()): CompostPile[] {
  return data.piles.filter(pile => pileNeedsTurning(pile, now))
}
