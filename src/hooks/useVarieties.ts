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
  toggleHaveSeedsForYear as storageToggleHaveSeedsForYear,
  hasSeedsForYear as storageHasSeedsForYear,
  getVarietiesForYear as storageGetVarietiesForYear,
  getSuppliers as storageGetSuppliers,
  getTotalSpendForYear as storageGetTotalSpendForYear,
} from '@/services/variety-storage'
import { usePersistedStorage, SaveStatus } from './usePersistedStorage'

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
  toggleHaveSeedsForYear: (varietyId: string, year: number) => void
  hasSeedsForYear: (varietyId: string, year: number) => boolean
  getAvailableYears: () => number[]
  getSeedsStatsForYear: (year: number) => { have: number; need: number }
  getDisplayVarieties: () => StoredVariety[]
  getSuppliers: () => string[]
  getTotalSpendForYear: (year: number) => number
  reload: () => void
  flushSave: () => void
}

export type UseVarietiesReturn = UseVarietiesState & UseVarietiesActions

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
    load: initializeVarietyStorage,
    save: saveVarietyData,
    validate: loadVarietyData,
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

  const toggleHaveSeedsForYear = useCallback((varietyId: string, year: number) => {
    if (!data) return
    setData(storageToggleHaveSeedsForYear(data, varietyId, year))
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

  const hasSeedsForYear = useCallback((varietyId: string, year: number): boolean => {
    if (!data) return false
    const variety = data.varieties.find(v => v.id === varietyId)
    return variety ? storageHasSeedsForYear(variety, year) : false
  }, [data])

  const getAvailableYears = useCallback((): number[] => {
    if (!data) {
      return []
    }

    const yearsSet = new Set<number>()

    // Collect years from variety data
    data.varieties.forEach(v => {
      // Add years from plannedYears
      v.plannedYears.forEach(year => yearsSet.add(year))

      // Add years from seedsByYear
      if (v.seedsByYear) {
        Object.keys(v.seedsByYear).forEach(yearStr => {
          yearsSet.add(parseInt(yearStr))
        })
      }
    })

    // If no years found, add current and next year as defaults
    if (yearsSet.size === 0) {
      const currentYear = new Date().getFullYear()
      yearsSet.add(currentYear)
      yearsSet.add(currentYear + 1)
    }

    // Return sorted descending
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [data])

  const getSeedsStatsForYear = useCallback((year: number): { have: number; need: number } => {
    if (!data) return { have: 0, need: 0 }

    // Get varieties for the specified year (not selectedYear)
    const varietiesForYear = storageGetVarietiesForYear(data, year)

    let have = 0
    let need = 0

    varietiesForYear.forEach(v => {
      const status = v.seedsByYear?.[year] || 'none'

      if (status === 'have') {
        have++
      } else if (status === 'ordered' || status === 'none') {
        need++
      }
    })

    return { have, need }
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
    toggleHaveSeedsForYear,
    hasSeedsForYear,
    getAvailableYears,
    getSeedsStatsForYear,
    getDisplayVarieties,
    getSuppliers,
    getTotalSpendForYear,
    reload,
    flushSave,
  }
}
