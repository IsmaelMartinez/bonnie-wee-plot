/**
 * useCompost Hook
 *
 * State management for compost pile tracking.
 * Reads/writes through useAllotment since compost data is part of AllotmentData (v18).
 */

'use client'

import { useCallback, useMemo } from 'react'
import {
  CompostPile,
  NewCompostPile,
  NewCompostInput,
  NewCompostEvent,
} from '@/types/compost'
import {
  addPile as storageAddPile,
  updatePile as storageUpdatePile,
  removePile as storageRemovePile,
  addInput as storageAddInput,
  removeInput as storageRemoveInput,
  addEvent as storageAddEvent,
  removeEvent as storageRemoveEvent,
  getPileById,
  getPilesByStatus,
  getActivePiles,
} from '@/services/compost-storage'
import type { CompostData } from '@/types/compost'
import type { AllotmentData } from '@/types/unified-allotment'
import { useAllotmentData } from './allotment/useAllotmentData'
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
 * Build a CompostData wrapper from AllotmentData for use with the existing
 * compost-storage pure functions (which operate on CompostData).
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

  // Helper: apply a compost-storage mutation and write back to AllotmentData
  const applyCompostMutation = useCallback(
    (mutate: (cd: CompostData) => CompostData) => {
      if (!allotmentData) return
      const cd = toCompostData(allotmentData)
      const updated = mutate(cd)
      setData({ ...allotmentData, compost: updated.piles })
    },
    [allotmentData, setData],
  )

  // ============ PILE OPERATIONS ============

  const addPile = useCallback((pile: NewCompostPile) => {
    applyCompostMutation(cd => storageAddPile(cd, pile))
  }, [applyCompostMutation])

  const updatePile = useCallback((
    pileId: string,
    updates: Partial<Omit<CompostPile, 'id' | 'inputs' | 'events' | 'createdAt'>>
  ) => {
    applyCompostMutation(cd => storageUpdatePile(cd, pileId, updates))
  }, [applyCompostMutation])

  const removePile = useCallback((pileId: string) => {
    applyCompostMutation(cd => storageRemovePile(cd, pileId))
  }, [applyCompostMutation])

  const getPile = useCallback((pileId: string) => {
    if (!compostData) return undefined
    return getPileById(compostData, pileId)
  }, [compostData])

  const getPilesByStatusData = useCallback((status: CompostPile['status']) => {
    if (!compostData) return []
    return getPilesByStatus(compostData, status)
  }, [compostData])

  const getActivePilesData = useCallback(() => {
    if (!compostData) return []
    return getActivePiles(compostData)
  }, [compostData])

  // ============ INPUT OPERATIONS ============

  const addInput = useCallback((pileId: string, input: NewCompostInput) => {
    applyCompostMutation(cd => storageAddInput(cd, pileId, input))
  }, [applyCompostMutation])

  const removeInput = useCallback((pileId: string, inputId: string) => {
    applyCompostMutation(cd => storageRemoveInput(cd, pileId, inputId))
  }, [applyCompostMutation])

  // ============ EVENT OPERATIONS ============

  const addEvent = useCallback((pileId: string, event: NewCompostEvent) => {
    applyCompostMutation(cd => storageAddEvent(cd, pileId, event))
  }, [applyCompostMutation])

  const removeEvent = useCallback((pileId: string, eventId: string) => {
    applyCompostMutation(cd => storageRemoveEvent(cd, pileId, eventId))
  }, [applyCompostMutation])

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
