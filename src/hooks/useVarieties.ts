/**
 * useVarieties Hook
 *
 * State management for seed variety tracking.
 * Follows the same patterns as useAllotment.
 */

'use client'

import { useState, useCallback } from 'react'
import {
  VarietyData,
  StoredVariety,
  NewVariety,
  VarietyUpdate,
  VARIETY_STORAGE_KEY,
} from '@/types/variety-data'
import {
  initializeVarietyStorage,
  saveVarietyData,
  loadVarietyData,
  addVariety as storageAddVariety,
  updateVariety as storageUpdateVariety,
  removeVariety as storageRemoveVariety,
  togglePlannedYear as storageTogglePlannedYear,
  toggleHaveSeeds as storageToggleHaveSeeds,
  getVarietiesForYear as storageGetVarietiesForYear,
  getSuppliers as storageGetSuppliers,
  getTotalSpendForYear as storageGetTotalSpendForYear,
} from '@/services/variety-storage'
import { usePersistedStorage, StorageResult, SaveStatus } from './usePersistedStorage'

// Re-export SaveStatus for backward compatibility
export type { SaveStatus } from './usePersistedStorage'

export interface UseVarietiesState {
  data: VarietyData | null
  selectedYear: number | 'all'
  isLoading: boolean
  error: string | null
  saveStatus: SaveStatus
}

export interface UseVarietiesActions {
  setSelectedYear: (year: number | 'all') => void
  addVariety: (variety: NewVariety) => void
  updateVariety: (id: string, updates: VarietyUpdate) => void
  removeVariety: (id: string) => void
  togglePlannedYear: (varietyId: string, year: number) => void
  toggleHaveSeeds: (varietyId: string) => void
  getDisplayVarieties: () => StoredVariety[]
  getSuppliers: () => string[]
  getTotalSpendForYear: (year: number) => number
  hasSeeds: (varietyId: string) => boolean
  reload: () => void
  flushSave: () => void
}

export type UseVarietiesReturn = UseVarietiesState & UseVarietiesActions

// ============ STORAGE OPTIONS ============

const loadVarieties = (): StorageResult<VarietyData> => {
  return initializeVarietyStorage()
}

const saveVarieties = (data: VarietyData): StorageResult<void> => {
  return saveVarietyData(data)
}

const validateVarieties = (): StorageResult<VarietyData> => {
  // Use loadVarietyData which performs validation
  return loadVarietyData()
}

// ============ HOOK IMPLEMENTATION ============

export function useVarieties(): UseVarietiesReturn {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  const {
    data,
    setData,
    saveStatus,
    isLoading,
    error,
    reload,
    flushSave,
  } = usePersistedStorage<VarietyData>({
    storageKey: VARIETY_STORAGE_KEY,
    load: loadVarieties,
    save: saveVarieties,
    validate: validateVarieties,
  })

  // ============ CRUD ============

  const addVariety = useCallback((variety: NewVariety) => {
    if (!data) return
    setData(storageAddVariety(data, variety))
  }, [data, setData])

  const updateVariety = useCallback((id: string, updates: VarietyUpdate) => {
    if (!data) return
    setData(storageUpdateVariety(data, id, updates))
  }, [data, setData])

  const removeVariety = useCallback((id: string) => {
    if (!data) return
    setData(storageRemoveVariety(data, id))
  }, [data, setData])

  // ============ YEAR PLANNING ============

  const togglePlannedYear = useCallback((varietyId: string, year: number) => {
    if (!data) return
    setData(storageTogglePlannedYear(data, varietyId, year))
  }, [data, setData])

  const toggleHaveSeeds = useCallback((varietyId: string) => {
    if (!data) return
    setData(storageToggleHaveSeeds(data, varietyId))
  }, [data, setData])

  // ============ QUERIES ============

  const getDisplayVarieties = useCallback((): StoredVariety[] => {
    if (!data) return []
    if (selectedYear === 'all') {
      return data.varieties
    }
    return storageGetVarietiesForYear(data, selectedYear)
  }, [data, selectedYear])

  const getSuppliers = useCallback((): string[] => {
    if (!data) return []
    return storageGetSuppliers(data)
  }, [data])

  const getTotalSpendForYear = useCallback((year: number): number => {
    if (!data) return 0
    return storageGetTotalSpendForYear(data, year)
  }, [data])

  const hasSeeds = useCallback((varietyId: string): boolean => {
    if (!data) return false
    return data.haveSeeds.includes(varietyId)
  }, [data])

  return {
    data,
    selectedYear,
    isLoading,
    error,
    saveStatus,
    setSelectedYear,
    addVariety,
    updateVariety,
    removeVariety,
    togglePlannedYear,
    toggleHaveSeeds,
    getDisplayVarieties,
    getSuppliers,
    getTotalSpendForYear,
    hasSeeds,
    reload,
    flushSave,
  }
}
