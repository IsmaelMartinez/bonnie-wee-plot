/**
 * useCompost Hook
 *
 * State management for compost pile tracking.
 * Reads/writes through useAllotment since compost data is part of AllotmentData (v18).
 *
 * Two-branch methods (ADR 027 Step 3, PR-B.2): closes the spec-inventory
 * gap left by PR-B. Each mutation has a legacy `setData`/`applyCompostMutation`
 * branch (byte-identical to the pre-PR-B.2 implementation) and a Yjs `mutate`
 * branch that performs in-place mutations on the SyncedStore proxy. The
 * branch is picked by the `USE_YJS_STORAGE` flag at the top of each method.
 * While the flag is `false` the Yjs branch is dead code; the parity test
 * exercises it with the flag flipped locally to keep both implementations
 * in lock step.
 *
 * Unlike the seven hooks ported in PR-B, `useCompost` is consumed directly
 * (not composed inside `useAllotment.ts`), so it pulls `mutate` from
 * `useAllotmentData()` itself rather than taking it as a prop. The Yjs
 * branches in this file are otherwise identical in shape to the PR-B ports.
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
  addCompostPile as storageAddPile,
  updateCompostPile as storageUpdatePile,
  removeCompostPile as storageRemovePile,
  addCompostInput as storageAddInput,
  removeCompostInput as storageRemoveInput,
  addCompostEvent as storageAddEvent,
  removeCompostEvent as storageRemoveEvent,
  getCompostPileById,
  getCompostPilesByStatus,
  getActiveCompostPiles,
} from '@/services/allotment-storage'
import type { CompostData } from '@/types/compost'
import type { AllotmentData } from '@/types/unified-allotment'
import { generateId } from '@/lib/utils'
import { USE_YJS_STORAGE } from '@/config/release-visibility'
import { useAllotmentData } from './allotment/useAllotmentData'
import { assignDefined, withoutUndefined } from './allotment/yjs-helpers'
import type { SaveStatus } from './usePersistedStorage'

// Re-export SaveStatus for backward compatibility
export type { SaveStatus } from './usePersistedStorage'

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
    setData,
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

  // Helper: apply a compost-operations mutation and write back to AllotmentData.
  // Legacy path only — the Yjs branches mutate `store.compost` in place and
  // never call this helper.
  const applyCompostMutation = useCallback(
    (mutateCd: (cd: CompostData) => CompostData) => {
      if (!allotmentData) return
      const cd = toCompostData(allotmentData)
      const updated = mutateCd(cd)
      setData({ ...allotmentData, compost: updated.piles })
    },
    [allotmentData, setData],
  )

  // ============ PILE OPERATIONS ============

  const addPile = useCallback((pile: NewCompostPile) => {
    if (!allotmentData) return

    if (USE_YJS_STORAGE) {
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
      return
    }

    applyCompostMutation(cd => storageAddPile(cd, pile))
  }, [allotmentData, applyCompostMutation, mutate])

  const updatePile = useCallback((
    pileId: string,
    updates: Partial<Omit<CompostPile, 'id' | 'inputs' | 'events' | 'createdAt'>>
  ) => {
    if (!allotmentData) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const pile = store.compost.find(p => p.id === pileId)
        if (!pile) return
        assignDefined(pile as unknown as Record<string, unknown>, updates as Record<string, unknown>)
        pile.updatedAt = new Date().toISOString()
      })
      return
    }

    applyCompostMutation(cd => storageUpdatePile(cd, pileId, updates))
  }, [allotmentData, applyCompostMutation, mutate])

  const removePile = useCallback((pileId: string) => {
    if (!allotmentData) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const idx = store.compost.findIndex(p => p.id === pileId)
        if (idx === -1) return
        store.compost.splice(idx, 1)
      })
      return
    }

    applyCompostMutation(cd => storageRemovePile(cd, pileId))
  }, [allotmentData, applyCompostMutation, mutate])

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

    if (USE_YJS_STORAGE) {
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
      return
    }

    applyCompostMutation(cd => storageAddInput(cd, pileId, input))
  }, [allotmentData, applyCompostMutation, mutate])

  const removeInput = useCallback((pileId: string, inputId: string) => {
    if (!allotmentData) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const pile = store.compost.find(p => p.id === pileId)
        if (!pile) return
        const idx = pile.inputs.findIndex(i => i.id === inputId)
        if (idx === -1) return
        pile.inputs.splice(idx, 1)
        pile.updatedAt = new Date().toISOString()
      })
      return
    }

    applyCompostMutation(cd => storageRemoveInput(cd, pileId, inputId))
  }, [allotmentData, applyCompostMutation, mutate])

  // ============ EVENT OPERATIONS ============

  const addEvent = useCallback((pileId: string, event: NewCompostEvent) => {
    if (!allotmentData) return

    if (USE_YJS_STORAGE) {
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
      return
    }

    applyCompostMutation(cd => storageAddEvent(cd, pileId, event))
  }, [allotmentData, applyCompostMutation, mutate])

  const removeEvent = useCallback((pileId: string, eventId: string) => {
    if (!allotmentData) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const pile = store.compost.find(p => p.id === pileId)
        if (!pile) return
        const idx = pile.events.findIndex(e => e.id === eventId)
        if (idx === -1) return
        pile.events.splice(idx, 1)
        pile.updatedAt = new Date().toISOString()
      })
      return
    }

    applyCompostMutation(cd => storageRemoveEvent(cd, pileId, eventId))
  }, [allotmentData, applyCompostMutation, mutate])

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
