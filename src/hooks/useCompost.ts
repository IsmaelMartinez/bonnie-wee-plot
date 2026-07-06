/**
 * useCompost Hook
 *
 * State management for compost pile tracking.
 * Reads/writes through useAllotment since compost data is part of AllotmentData (v18).
 *
 * Writes go through `mutate(fn)`, performing in-place mutations on the
 * SyncedStore proxy (ADR 027; the legacy `setData` branch was removed in
 * Step 5).
 *
 * Unlike the seven hooks ported in PR-B, `useCompost` is consumed directly
 * (not composed inside `useAllotment.ts`), so it pulls `mutate` from
 * `useAllotmentData()` itself rather than taking it as a prop.
 */

'use client'

import { useCallback, useMemo } from 'react'
import {
  CompostPile,
  CompostInput,
  CompostEvent,
  NewCompostPile,
  NewCompostInput,
  NewCompostEvent,
} from '@/types/compost'
import {
  getCompostPileById,
  getCompostPilesByStatus,
  getActiveCompostPiles,
} from '@/services/allotment-storage'
import type { CompostData } from '@/types/compost'
import type { AllotmentData } from '@/types/unified-allotment'
import { generateId } from '@/lib/utils'
import { useAllotmentData } from './allotment/useAllotmentData'
import { assignDefined, withoutUndefined } from '@/lib/yjs/allotment-yjs'
import type { SaveStatus } from '@/types/storage'

// Re-export SaveStatus for backward compatibility
export type { SaveStatus } from '@/types/storage'

// ============ HOOK TYPES ============

export interface UseCompostState {
  data: CompostData | null
  isLoading: boolean
  error: string | null
  saveError: string | null
  saveStatus: SaveStatus
  lastSavedAt: Date | null
}

export interface UseCompostActions {
  // Pile operations
  addPile: (pile: NewCompostPile) => void
  updatePile: (pileId: string, updates: Partial<Omit<CompostPile, 'id' | 'inputs' | 'events' | 'createdAt'>>) => void
  removePile: (pileId: string) => void
  getPile: (pileId: string) => CompostPile | undefined
  getPilesByStatus: (status: CompostPile['status']) => CompostPile[]
  getActivePiles: () => CompostPile[]

  // Input operations
  addInput: (pileId: string, input: NewCompostInput) => void
  removeInput: (pileId: string, inputId: string) => void

  // Event operations
  addEvent: (pileId: string, event: NewCompostEvent) => void
  removeEvent: (pileId: string, eventId: string) => void

  // Data operations
  reload: () => void
  flushSave: () => void
  clearSaveError: () => void
}

export type UseCompostReturn = UseCompostState & UseCompostActions

/**
 * Build a CompostData wrapper from AllotmentData for use with the
 * compost-operations pure functions (which operate on CompostData).
 */
function toCompostData(allotmentData: AllotmentData): CompostData {
  return {
    version: 1,
    piles: allotmentData.compost || [],
    createdAt: allotmentData.meta.createdAt,
    updatedAt: allotmentData.meta.updatedAt,
  }
}

// ============ HOOK IMPLEMENTATION ============

export function useCompost(): UseCompostReturn {
  const {
    data: allotmentData,
    mutate,
    isLoading,
    error,
    saveError,
    saveStatus,
    lastSavedAt,
    reload,
    flushSave: baseFlushSave,
    clearSaveError,
  } = useAllotmentData()

  // Derive CompostData view from AllotmentData
  const compostData = useMemo(() => {
    if (!allotmentData) return null
    return toCompostData(allotmentData)
  }, [allotmentData])

  // ============ PILE OPERATIONS ============

  const addPile = useCallback((pile: NewCompostPile) => {
    if (!allotmentData) return

    mutate(store => {
      const now = new Date().toISOString()
      const newPile: CompostPile = withoutUndefined({
        ...pile,
        id: generateId('pile'),
        inputs: [],
        events: [],
        createdAt: now,
        updatedAt: now,
      })
      store.compost.push(newPile)
    })
  }, [allotmentData, mutate])

  const updatePile = useCallback((
    pileId: string,
    updates: Partial<Omit<CompostPile, 'id' | 'inputs' | 'events' | 'createdAt'>>
  ) => {
    if (!allotmentData) return

    mutate(store => {
      const pile = store.compost.find(p => p.id === pileId)
      if (!pile) return
      assignDefined(pile, updates)
      pile.updatedAt = new Date().toISOString()
    })
  }, [allotmentData, mutate])

  const removePile = useCallback((pileId: string) => {
    if (!allotmentData) return

    mutate(store => {
      const idx = store.compost.findIndex(p => p.id === pileId)
      if (idx === -1) return
      store.compost.splice(idx, 1)
    })
  }, [allotmentData, mutate])

  const getPile = useCallback((pileId: string) => {
    if (!compostData) return undefined
    return getCompostPileById(compostData, pileId)
  }, [compostData])

  const getPilesByStatusData = useCallback((status: CompostPile['status']) => {
    if (!compostData) return []
    return getCompostPilesByStatus(compostData, status)
  }, [compostData])

  const getActivePilesData = useCallback(() => {
    if (!compostData) return []
    return getActiveCompostPiles(compostData)
  }, [compostData])

  // ============ INPUT OPERATIONS ============

  const addInput = useCallback((pileId: string, input: NewCompostInput) => {
    if (!allotmentData) return

    mutate(store => {
      const pile = store.compost.find(p => p.id === pileId)
      if (!pile) return
      const newInput: CompostInput = withoutUndefined({
        ...input,
        id: generateId('input'),
      })
      pile.inputs.push(newInput)
      pile.updatedAt = new Date().toISOString()
    })
  }, [allotmentData, mutate])

  const removeInput = useCallback((pileId: string, inputId: string) => {
    if (!allotmentData) return

    mutate(store => {
      const pile = store.compost.find(p => p.id === pileId)
      if (!pile) return
      const idx = pile.inputs.findIndex(i => i.id === inputId)
      if (idx === -1) return
      pile.inputs.splice(idx, 1)
      pile.updatedAt = new Date().toISOString()
    })
  }, [allotmentData, mutate])

  // ============ EVENT OPERATIONS ============

  const addEvent = useCallback((pileId: string, event: NewCompostEvent) => {
    if (!allotmentData) return

    mutate(store => {
      const pile = store.compost.find(p => p.id === pileId)
      if (!pile) return
      const newEvent: CompostEvent = withoutUndefined({
        ...event,
        id: generateId('event'),
      })
      pile.events.push(newEvent)
      pile.updatedAt = new Date().toISOString()
    })
  }, [allotmentData, mutate])

  const removeEvent = useCallback((pileId: string, eventId: string) => {
    if (!allotmentData) return

    mutate(store => {
      const pile = store.compost.find(p => p.id === pileId)
      if (!pile) return
      const idx = pile.events.findIndex(e => e.id === eventId)
      if (idx === -1) return
      pile.events.splice(idx, 1)
      pile.updatedAt = new Date().toISOString()
    })
  }, [allotmentData, mutate])

  // ============ DATA OPERATIONS ============

  const flushSave = useCallback(() => {
    baseFlushSave()
  }, [baseFlushSave])

  return {
    // State
    data: compostData,
    isLoading,
    error,
    saveError,
    saveStatus,
    lastSavedAt,

    // Pile operations
    addPile,
    updatePile,
    removePile,
    getPile,
    getPilesByStatus: getPilesByStatusData,
    getActivePiles: getActivePilesData,

    // Input operations
    addInput,
    removeInput,

    // Event operations
    addEvent,
    removeEvent,

    // Data operations
    reload,
    flushSave,
    clearSaveError,
  }
}
