/**
 * useCompost Hook
 *
 * State management for compost pile tracking.
 * Follows the same patterns as useAllotment.
 */

'use client'

import { useCallback } from 'react'
import {
  CompostData,
  CompostPile,
  NewCompostPile,
  NewCompostInput,
  NewCompostEvent,
  COMPOST_STORAGE_KEY,
} from '@/types/compost'
import {
  initializeCompostStorage,
  saveCompostData,
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
import { usePersistedStorage, StorageResult, SaveStatus } from './usePersistedStorage'

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

// ============ STORAGE OPTIONS ============

const loadCompost = (): StorageResult<CompostData> => {
  return initializeCompostStorage()
}

const saveCompost = (data: CompostData): StorageResult<void> => {
  return saveCompostData(data)
}

const validateCompost = (parsed: unknown): StorageResult<CompostData> => {
  if (!parsed || typeof parsed !== 'object') {
    return { success: false, error: 'Invalid data format' }
  }
  const obj = parsed as Record<string, unknown>
  if (typeof obj.version !== 'number' || !Array.isArray(obj.piles)) {
    return { success: false, error: 'Invalid data schema' }
  }
  return { success: true, data: parsed as CompostData }
}

// ============ HOOK IMPLEMENTATION ============

export function useCompost(): UseCompostReturn {
  const {
    data,
    setData,
    isLoading,
    error,
    saveError,
    saveStatus,
    lastSavedAt,
    reload: baseReload,
    flushSave,
    clearSaveError,
  } = usePersistedStorage<CompostData>({
    storageKey: COMPOST_STORAGE_KEY,
    load: loadCompost,
    save: saveCompost,
    validate: validateCompost,
  })

  // ============ PILE OPERATIONS ============

  const addPile = useCallback((pile: NewCompostPile) => {
    if (!data) return
    setData(storageAddPile(data, pile))
  }, [data, setData])

  const updatePile = useCallback((
    pileId: string,
    updates: Partial<Omit<CompostPile, 'id' | 'inputs' | 'events' | 'createdAt'>>
  ) => {
    if (!data) return
    setData(storageUpdatePile(data, pileId, updates))
  }, [data, setData])

  const removePile = useCallback((pileId: string) => {
    if (!data) return
    setData(storageRemovePile(data, pileId))
  }, [data, setData])

  const getPile = useCallback((pileId: string) => {
    if (!data) return undefined
    return getPileById(data, pileId)
  }, [data])

  const getPilesByStatusData = useCallback((status: CompostPile['status']) => {
    if (!data) return []
    return getPilesByStatus(data, status)
  }, [data])

  const getActivePilesData = useCallback(() => {
    if (!data) return []
    return getActivePiles(data)
  }, [data])

  // ============ INPUT OPERATIONS ============

  const addInput = useCallback((pileId: string, input: NewCompostInput) => {
    if (!data) return
    setData(storageAddInput(data, pileId, input))
  }, [data, setData])

  const removeInput = useCallback((pileId: string, inputId: string) => {
    if (!data) return
    setData(storageRemoveInput(data, pileId, inputId))
  }, [data, setData])

  // ============ EVENT OPERATIONS ============

  const addEvent = useCallback((pileId: string, event: NewCompostEvent) => {
    if (!data) return
    setData(storageAddEvent(data, pileId, event))
  }, [data, setData])

  const removeEvent = useCallback((pileId: string, eventId: string) => {
    if (!data) return
    setData(storageRemoveEvent(data, pileId, eventId))
  }, [data, setData])

  // ============ DATA OPERATIONS ============

  const reload = useCallback(() => {
    baseReload()
  }, [baseReload])

  return {
    // State
    data,
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
