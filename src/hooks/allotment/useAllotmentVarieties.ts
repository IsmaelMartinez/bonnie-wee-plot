/**
 * useAllotmentVarieties Hook
 *
 * Seed inventory management for varieties.
 * Handles variety CRUD, seed status tracking, and supplier management.
 *
 * Two-branch methods (ADR 027 Step 3, PR-B): see useAllotmentAreas for
 * the convention. The Yjs branch mutates `store.varieties` in place.
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
import { generateId } from '@/lib/utils'
import { USE_YJS_STORAGE } from '@/config/release-visibility'
import type { MutateFn } from './useAllotmentData'
import { assignDefined, withoutUndefined } from './yjs-helpers'

// ============ HOOK TYPES ============

export interface UseAllotmentVarietiesProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
  mutate: MutateFn
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
  mutate,
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

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const newVariety: StoredVariety = withoutUndefined({
          id: generateId('variety'),
          plantId: variety.plantId,
          name: variety.name,
          supplier: variety.supplier,
          price: variety.price,
          notes: variety.notes,
          seedsByYear: variety.seedsByYear || {},
        })
        store.varieties.push(newVariety)
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageAddVariety(data, variety))
  }, [data, setData, mutate])

  const updateVarietyData = useCallback((id: string, updates: VarietyUpdate) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const v = store.varieties.find(x => x.id === id)
        if (!v) return
        assignDefined(v as unknown as Record<string, unknown>, updates as Record<string, unknown>)
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageUpdateVariety(data, id, updates))
  }, [data, setData, mutate])

  const removeVarietyData = useCallback((id: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const idx = store.varieties.findIndex(v => v.id === id)
        if (idx === -1) return
        store.varieties.splice(idx, 1)
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageRemoveVariety(data, id))
  }, [data, setData, mutate])

  const archiveVarietyData = useCallback((id: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const v = store.varieties.find(x => x.id === id)
        if (!v) return
        v.isArchived = true
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageArchiveVariety(data, id))
  }, [data, setData, mutate])

  const unarchiveVarietyData = useCallback((id: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const v = store.varieties.find(x => x.id === id)
        if (!v) return
        v.isArchived = false
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageUnarchiveVariety(data, id))
  }, [data, setData, mutate])

  const getActiveVarietiesData = useCallback((includeArchived = false): StoredVariety[] => {
    if (!data) return []
    return storageGetActiveVarieties(data, includeArchived)
  }, [data])

  // ============ SEED STATUS ============

  const toggleHaveSeedsForYearData = useCallback((varietyId: string, year: number) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const v = store.varieties.find(x => x.id === varietyId)
        if (!v) return
        const current = v.seedsByYear[year] || 'none'
        const next: Record<SeedStatus, SeedStatus> = {
          'none': 'ordered',
          'ordered': 'have',
          'have': 'had',
          'had': 'none',
        }
        // SyncedStore needs a fresh object reference for the seedsByYear
        // map to publish the change. Mutating an existing nested Record
        // in place works, but assigning a new object also works and
        // matches the legacy spread semantics one-for-one.
        v.seedsByYear = { ...v.seedsByYear, [year]: next[current] }
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageToggleHaveSeedsForYear(data, varietyId, year))
  }, [data, setData, mutate])

  const hasSeedsForYearData = useCallback((varietyId: string, year: number): boolean => {
    if (!data) return false
    const variety = data.varieties?.find(v => v.id === varietyId)
    return variety ? storageHasSeedsForYear(variety, year) : false
  }, [data])

  const removeVarietyFromYearData = useCallback((varietyId: string, year: number) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const v = store.varieties.find(x => x.id === varietyId)
        if (!v) return
        // Match the legacy `{ [year]: _, ...rest }` destructuring by
        // copying without the deleted key.
        const next: Record<number, SeedStatus> = {}
        for (const [k, val] of Object.entries(v.seedsByYear)) {
          const kNum = Number(k)
          if (kNum === year) continue
          next[kNum] = val
        }
        v.seedsByYear = next
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageRemoveVarietyFromYear(data, varietyId, year))
  }, [data, setData, mutate])

  const addVarietyToYearData = useCallback((varietyId: string, year: number, status: SeedStatus = 'none') => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const v = store.varieties.find(x => x.id === varietyId)
        if (!v) return
        v.seedsByYear = { ...v.seedsByYear, [year]: status }
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageAddVarietyToYear(data, varietyId, year, status))
  }, [data, setData, mutate])

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
