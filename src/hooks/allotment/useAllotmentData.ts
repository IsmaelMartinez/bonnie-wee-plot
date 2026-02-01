/**
 * useAllotmentData Hook
 *
 * Core data lifecycle and year/season management.
 * Foundation hook that other allotment hooks depend on.
 */

'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  AllotmentData,
  SeasonRecord,
  STORAGE_KEY,
} from '@/types/unified-allotment'
import {
  initializeStorage,
  saveAllotmentData,
  validateAllotmentData,
  getSeasonByYear,
  getAvailableYears,
  setCurrentYear,
} from '@/services/allotment-storage'
import { usePersistedStorage, StorageResult, SaveStatus } from '../usePersistedStorage'

// Re-export SaveStatus for backward compatibility
export type { SaveStatus } from '../usePersistedStorage'

// ============ STORAGE OPTIONS ============

const loadAllotment = (): StorageResult<AllotmentData> => {
  return initializeStorage()
}

const saveAllotment = (data: AllotmentData): StorageResult<void> => {
  return saveAllotmentData(data)
}

const validateAllotment = (parsed: unknown): StorageResult<AllotmentData> => {
  const validation = validateAllotmentData(parsed)
  if (!validation.valid) {
    return { success: false, error: validation.errors?.join(', ') }
  }
  return { success: true, data: parsed as AllotmentData }
}

// ============ HOOK TYPES ============

export interface UseAllotmentDataReturn {
  // State
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
  currentSeason: SeasonRecord | null
  selectedYear: number
  isLoading: boolean
  error: string | null
  saveError: string | null
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  isSyncedFromOtherTab: boolean

  // Actions
  selectYear: (year: number) => void
  getYears: () => number[]
  reload: () => void
  flushSave: () => Promise<boolean>
  clearSaveError: () => void
  updateMeta: (updates: Partial<AllotmentData['meta']>) => void
}

// ============ HOOK IMPLEMENTATION ============

export function useAllotmentData(): UseAllotmentDataReturn {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Handle year sync when data changes from another tab
  const handleSync = useCallback((newData: AllotmentData) => {
    setSelectedYear(newData.currentYear)
  }, [])

  const {
    data,
    setData,
    saveStatus,
    isLoading,
    error,
    saveError,
    isSyncedFromOtherTab,
    lastSavedAt,
    reload: baseReload,
    flushSave,
    clearSaveError,
  } = usePersistedStorage<AllotmentData>({
    storageKey: STORAGE_KEY,
    load: loadAllotment,
    save: saveAllotment,
    validate: validateAllotment,
    onSync: handleSync,
  })

  // Update selectedYear when data first loads
  const initializedRef = useRef(false)
  useEffect(() => {
    if (data && !initializedRef.current) {
      initializedRef.current = true
      setSelectedYear(data.currentYear)
    }
  }, [data])

  // Derived state: current season based on selected year
  const currentSeason = useMemo(() => {
    if (!data) return null
    return getSeasonByYear(data, selectedYear) || null
  }, [data, selectedYear])

  // ============ YEAR NAVIGATION ============

  const selectYear = useCallback((year: number) => {
    setSelectedYear(year)
    // Use functional update to avoid stale data when called after createSeason
    setData(prevData => prevData ? setCurrentYear(prevData, year) : prevData)
  }, [setData])

  const getYears = useCallback(() => {
    if (!data) return []
    return getAvailableYears(data)
  }, [data])

  // ============ DATA REFRESH ============

  const reload = useCallback(() => {
    baseReload()
    // After reload, sync the selectedYear with the loaded data
    const result = initializeStorage()
    if (result.success && result.data) {
      setSelectedYear(result.data.currentYear)
    }
  }, [baseReload])

  // ============ METADATA OPERATIONS ============

  const updateMeta = useCallback((updates: Partial<AllotmentData['meta']>) => {
    if (!data) return
    setData({
      ...data,
      meta: {
        ...data.meta,
        ...updates
      }
    })
  }, [data, setData])

  return {
    // State
    data,
    setData,
    currentSeason,
    selectedYear,
    isLoading,
    error,
    saveError,
    saveStatus,
    lastSavedAt,
    isSyncedFromOtherTab,

    // Actions
    selectYear,
    getYears,
    reload,
    flushSave,
    clearSaveError,
    updateMeta,
  }
}
