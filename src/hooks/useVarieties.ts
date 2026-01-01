/**
 * useVarieties Hook
 *
 * State management for seed variety tracking.
 * Follows the same patterns as useAllotment.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

const SAVE_DEBOUNCE_MS = 500

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

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

export function useVarieties(): UseVarietiesReturn {
  const [data, setData] = useState<VarietyData | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDataRef = useRef<VarietyData | null>(null)
  const justSavedRef = useRef(false)

  // Load data on mount
  useEffect(() => {
    const result = initializeVarietyStorage()
    if (result.success && result.data) {
      setData(result.data)
      setError(null)
    } else {
      setError(result.error || 'Failed to load variety data')
    }
    setIsLoading(false)
  }, [])

  // Multi-tab sync with validation
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== VARIETY_STORAGE_KEY) return
      if (justSavedRef.current) {
        justSavedRef.current = false
        return
      }

      if (event.newValue === null) {
        const result = initializeVarietyStorage()
        if (result.success && result.data) {
          setData(result.data)
        }
        return
      }

      // Validate the data from other tab using our load function
      const result = loadVarietyData()
      if (result.success && result.data) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }
        pendingDataRef.current = null
        setData(result.data)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Debounced save
  const debouncedSave = useCallback((dataToSave: VarietyData) => {
    pendingDataRef.current = dataToSave
    setSaveStatus('saving')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        justSavedRef.current = true
        const result = saveVarietyData(pendingDataRef.current)
        if (!result.success) {
          console.error('Failed to save variety data:', result.error)
          setSaveStatus('error')
          justSavedRef.current = false
        } else {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
        pendingDataRef.current = null
      }
      saveTimeoutRef.current = null
    }, SAVE_DEBOUNCE_MS)
  }, [])

  // Auto-save on data change
  useEffect(() => {
    if (data && !isLoading) {
      debouncedSave(data)
    }
  }, [data, isLoading, debouncedSave])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (pendingDataRef.current) {
        saveVarietyData(pendingDataRef.current)
      }
    }
  }, [])

  // ============ CRUD ============

  const addVariety = useCallback((variety: NewVariety) => {
    if (!data) return
    setData(storageAddVariety(data, variety))
  }, [data])

  const updateVariety = useCallback((id: string, updates: VarietyUpdate) => {
    if (!data) return
    setData(storageUpdateVariety(data, id, updates))
  }, [data])

  const removeVariety = useCallback((id: string) => {
    if (!data) return
    setData(storageRemoveVariety(data, id))
  }, [data])

  // ============ YEAR PLANNING ============

  const togglePlannedYear = useCallback((varietyId: string, year: number) => {
    if (!data) return
    setData(storageTogglePlannedYear(data, varietyId, year))
  }, [data])

  const toggleHaveSeeds = useCallback((varietyId: string) => {
    if (!data) return
    setData(storageToggleHaveSeeds(data, varietyId))
  }, [data])

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

  const reload = useCallback(() => {
    setIsLoading(true)
    const result = initializeVarietyStorage()
    if (result.success && result.data) {
      setData(result.data)
      setError(null)
    } else {
      setError(result.error || 'Failed to reload variety data')
    }
    setIsLoading(false)
  }, [])

  // Force immediate save of any pending data
  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    if (pendingDataRef.current) {
      justSavedRef.current = true
      const result = saveVarietyData(pendingDataRef.current)
      if (!result.success) {
        setSaveStatus('error')
        justSavedRef.current = false
      } else {
        setSaveStatus('saved')
      }
      pendingDataRef.current = null
    }
  }, [])

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
