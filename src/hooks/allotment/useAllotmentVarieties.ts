/**
 * useAllotmentVarieties Hook
 *
 * Seed inventory management for varieties.
 * Handles variety CRUD, seed status tracking, and supplier management.
 */

'use client'

import { useCallback } from 'react'
import {
  AllotmentData,
  StoredVariety,
  NewVariety,
  VarietyUpdate,
} from '@/types/unified-allotment'
import {
  getVarieties as storageGetVarieties,
  getVarietiesForYear as storageGetVarietiesForYear,
  addVariety as storageAddVariety,
  updateVariety as storageUpdateVariety,
  removeVariety as storageRemoveVariety,
  archiveVariety as storageArchiveVariety,
  unarchiveVariety as storageUnarchiveVariety,
  getActiveVarieties as storageGetActiveVarieties,
  toggleHaveSeedsForYear as storageToggleHaveSeedsForYear,
  hasSeedsForYear as storageHasSeedsForYear,
  removeVarietyFromYear as storageRemoveVarietyFromYear,
  addVarietyToYear as storageAddVarietyToYear,
  getSuppliers as storageGetSuppliers,
  getTotalSpendForYear as storageGetTotalSpendForYear,
  getAvailableVarietyYears as storageGetAvailableVarietyYears,
  getSeedsStatsForYear as storageGetSeedsStatsForYear,
} from '@/services/allotment-storage'
import { SeedStatus } from '@/types/unified-allotment'

// ============ HOOK TYPES ============

export interface UseAllotmentVarietiesProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
}

export interface UseAllotmentVarietiesReturn {
  // Variety CRUD
  getVarieties: () => StoredVariety[]
  getVarietiesForYear: (year: number) => StoredVariety[]
  addVariety: (variety: NewVariety) => void
  updateVariety: (id: string, updates: VarietyUpdate) => void
  removeVariety: (id: string) => void
  archiveVariety: (id: string) => void
  unarchiveVariety: (id: string) => void
  getActiveVarieties: (includeArchived?: boolean) => StoredVariety[]

  // Seed status
  toggleHaveSeedsForYear: (varietyId: string, year: number) => void
  hasSeedsForYear: (varietyId: string, year: number) => boolean
  removeVarietyFromYear: (varietyId: string, year: number) => void
  addVarietyToYear: (varietyId: string, year: number, status?: SeedStatus) => void

  // Supplier and stats
  getSuppliers: () => string[]
  getTotalSpendForYear: (year: number) => number
  getAvailableVarietyYears: () => number[]
  getSeedsStatsForYear: (year: number) => { total: number; have: number; ordered: number; none: number }
}

// ============ HOOK IMPLEMENTATION ============

export function useAllotmentVarieties({
  data,
  setData,
}: UseAllotmentVarietiesProps): UseAllotmentVarietiesReturn {

  // ============ VARIETY CRUD ============

  const getVarietiesData = useCallback((): StoredVariety[] => {
    if (!data) return []
    return storageGetVarieties(data)
  }, [data])

  const getVarietiesForYearData = useCallback((year: number): StoredVariety[] => {
    if (!data) return []
    return storageGetVarietiesForYear(data, year)
  }, [data])

  const addVarietyData = useCallback((variety: NewVariety) => {
    if (!data) return
    setData(storageAddVariety(data, variety))
  }, [data, setData])

  const updateVarietyData = useCallback((id: string, updates: VarietyUpdate) => {
    if (!data) return
    setData(storageUpdateVariety(data, id, updates))
  }, [data, setData])

  const removeVarietyData = useCallback((id: string) => {
    if (!data) return
    setData(storageRemoveVariety(data, id))
  }, [data, setData])

  const archiveVarietyData = useCallback((id: string) => {
    if (!data) return
    setData(storageArchiveVariety(data, id))
  }, [data, setData])

  const unarchiveVarietyData = useCallback((id: string) => {
    if (!data) return
    setData(storageUnarchiveVariety(data, id))
  }, [data, setData])

  const getActiveVarietiesData = useCallback((includeArchived = false): StoredVariety[] => {
    if (!data) return []
    return storageGetActiveVarieties(data, includeArchived)
  }, [data])

  // ============ SEED STATUS ============

  const toggleHaveSeedsForYearData = useCallback((varietyId: string, year: number) => {
    if (!data) return
    setData(storageToggleHaveSeedsForYear(data, varietyId, year))
  }, [data, setData])

  const hasSeedsForYearData = useCallback((varietyId: string, year: number): boolean => {
    if (!data) return false
    const variety = data.varieties?.find(v => v.id === varietyId)
    return variety ? storageHasSeedsForYear(variety, year) : false
  }, [data])

  const removeVarietyFromYearData = useCallback((varietyId: string, year: number) => {
    if (!data) return
    setData(storageRemoveVarietyFromYear(data, varietyId, year))
  }, [data, setData])

  const addVarietyToYearData = useCallback((varietyId: string, year: number, status: SeedStatus = 'none') => {
    if (!data) return
    setData(storageAddVarietyToYear(data, varietyId, year, status))
  }, [data, setData])

  // ============ SUPPLIER AND STATS ============

  const getSuppliersData = useCallback((): string[] => {
    if (!data) return []
    return storageGetSuppliers(data)
  }, [data])

  const getTotalSpendForYearData = useCallback((year: number): number => {
    if (!data) return 0
    return storageGetTotalSpendForYear(data, year)
  }, [data])

  const getAvailableVarietyYearsData = useCallback((): number[] => {
    if (!data) {
      // Fallback to standard 3-year window
      const currentYear = new Date().getFullYear()
      return [currentYear + 1, currentYear, currentYear - 1]
    }
    // Get years from variety data plus standard 3-year window
    const yearsFromData = storageGetAvailableVarietyYears(data)
    const currentYear = new Date().getFullYear()
    const standardYears = [currentYear - 1, currentYear, currentYear + 1]
    const allYears = new Set([...yearsFromData, ...standardYears])
    return Array.from(allYears).sort((a, b) => b - a)
  }, [data])

  const getSeedsStatsForYearData = useCallback((year: number) => {
    if (!data) return { total: 0, have: 0, ordered: 0, none: 0 }
    return storageGetSeedsStatsForYear(data, year)
  }, [data])

  return {
    // Variety CRUD
    getVarieties: getVarietiesData,
    getVarietiesForYear: getVarietiesForYearData,
    addVariety: addVarietyData,
    updateVariety: updateVarietyData,
    removeVariety: removeVarietyData,
    archiveVariety: archiveVarietyData,
    unarchiveVariety: unarchiveVarietyData,
    getActiveVarieties: getActiveVarietiesData,

    // Seed status
    toggleHaveSeedsForYear: toggleHaveSeedsForYearData,
    hasSeedsForYear: hasSeedsForYearData,
    removeVarietyFromYear: removeVarietyFromYearData,
    addVarietyToYear: addVarietyToYearData,

    // Supplier and stats
    getSuppliers: getSuppliersData,
    getTotalSpendForYear: getTotalSpendForYearData,
    getAvailableVarietyYears: getAvailableVarietyYearsData,
    getSeedsStatsForYear: getSeedsStatsForYearData,
  }
}
