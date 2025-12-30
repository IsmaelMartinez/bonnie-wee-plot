/**
 * useAllotment Hook
 * 
 * Unified state management for allotment data.
 * Single source of truth for all allotment operations.
 */

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  AllotmentData,
  SeasonRecord,
  BedSeason,
  Planting,
  NewPlanting,
  PlantingUpdate,
  MaintenanceTask,
  NewMaintenanceTask,
  BedNote,
  NewBedNote,
  BedNoteUpdate,
} from '@/types/unified-allotment'
import { PhysicalBedId, RotationGroup, PhysicalBed } from '@/types/garden-planner'
import {
  initializeStorage,
  saveAllotmentData,
  validateAllotmentData,
  getSeasonByYear,
  getAvailableYears,
  getBedSeason,
  addPlanting as storageAddPlanting,
  updatePlanting as storageUpdatePlanting,
  removePlanting as storageRemovePlanting,
  addSeason,
  removeSeason,
  updateSeason,
  setCurrentYear,
  updateBedRotationGroup,
  getPlantingsForBed,
  getBedById,
  getBedsByStatus,
  getRotationBeds,
  getRotationHistory,
  getRecentRotation,
  getMaintenanceTasks,
  getTasksForMonth,
  getTasksForPlanting,
  addMaintenanceTask as storageAddTask,
  updateMaintenanceTask as storageUpdateTask,
  completeMaintenanceTask as storageCompleteTask,
  removeMaintenanceTask as storageRemoveTask,
  getBedNotes,
  addBedNote as storageAddBedNote,
  updateBedNote as storageUpdateBedNote,
  removeBedNote as storageRemoveBedNote,
} from '@/services/allotment-storage'
import { STORAGE_KEY } from '@/types/unified-allotment'

// Debounce delay for save operations (ms)
const SAVE_DEBOUNCE_MS = 500

// ============ HOOK TYPES ============

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseAllotmentState {
  data: AllotmentData | null
  currentSeason: SeasonRecord | null
  selectedYear: number
  selectedBedId: PhysicalBedId | null
  isLoading: boolean
  error: string | null
  saveError: string | null  // Error from save operations (e.g., quota exceeded)
  isSyncedFromOtherTab: boolean  // True if data was just synced from another tab
  saveStatus: SaveStatus  // Current save status (idle, saving, saved, error)
  lastSavedAt: Date | null  // Timestamp of last successful save
}

export interface UseAllotmentActions {
  // Year navigation
  selectYear: (year: number) => void
  getYears: () => number[]
  
  // Bed selection
  selectBed: (bedId: PhysicalBedId | null) => void
  getBed: (bedId: PhysicalBedId) => PhysicalBed | undefined
  
  // Planting CRUD
  addPlanting: (bedId: PhysicalBedId, planting: NewPlanting) => void
  updatePlanting: (bedId: PhysicalBedId, plantingId: string, updates: PlantingUpdate) => void
  removePlanting: (bedId: PhysicalBedId, plantingId: string) => void
  getPlantings: (bedId: PhysicalBedId) => Planting[]
  
  // Bed season operations
  getBedSeason: (bedId: PhysicalBedId) => BedSeason | undefined
  updateRotationGroup: (bedId: PhysicalBedId, group: RotationGroup) => void
  
  // Season operations
  createSeason: (year: number, notes?: string) => void
  deleteSeason: (year: number) => void
  updateSeasonNotes: (notes: string) => void
  
  // Layout helpers
  getRotationBeds: () => PhysicalBed[]
  getProblemBeds: () => PhysicalBed[]
  getPerennialBeds: () => PhysicalBed[]
  
  // Rotation history
  getRotationHistory: (bedId: PhysicalBedId) => Array<{ year: number; group: RotationGroup }>
  getRecentRotation: (bedId: PhysicalBedId, years?: number) => RotationGroup[]
  
  // Maintenance tasks
  getMaintenanceTasks: () => MaintenanceTask[]
  getTasksForMonth: (month: number) => MaintenanceTask[]
  getTasksForPlanting: (plantingId: string) => MaintenanceTask[]
  addMaintenanceTask: (task: NewMaintenanceTask) => void
  updateMaintenanceTask: (taskId: string, updates: Partial<Omit<MaintenanceTask, 'id'>>) => void
  completeMaintenanceTask: (taskId: string) => void
  removeMaintenanceTask: (taskId: string) => void

  // Bed notes
  getBedNotes: (bedId: PhysicalBedId) => BedNote[]
  addBedNote: (bedId: PhysicalBedId, note: NewBedNote) => void
  updateBedNote: (bedId: PhysicalBedId, noteId: string, updates: BedNoteUpdate) => void
  removeBedNote: (bedId: PhysicalBedId, noteId: string) => void

  // Data operations
  reload: () => void
  flushSave: () => void  // Force immediate save of pending data
  clearSaveError: () => void  // Clear any save error
}

export type UseAllotmentReturn = UseAllotmentState & UseAllotmentActions

// ============ HOOK IMPLEMENTATION ============

export function useAllotment(): UseAllotmentReturn {
  const [data, setData] = useState<AllotmentData | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [selectedBedId, setSelectedBedId] = useState<PhysicalBedId | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSyncedFromOtherTab, setIsSyncedFromOtherTab] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // Derived state: current season based on selected year
  const currentSeason = useMemo(() => {
    if (!data) return null
    return getSeasonByYear(data, selectedYear) || null
  }, [data, selectedYear])

  // Ref for debounced save timeout
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDataRef = useRef<AllotmentData | null>(null)
  // Ref to track if we just saved (to ignore our own storage events)
  const justSavedRef = useRef(false)
  
  // Load data on mount
  useEffect(() => {
    const result = initializeStorage()
    if (result.success && result.data) {
      setData(result.data)
      setSelectedYear(result.data.currentYear)
      setError(null)
    } else {
      setError(result.error || 'Failed to load data')
    }
    setIsLoading(false)
  }, [])

  // Multi-tab sync: listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Only react to changes to our storage key
      if (event.key !== STORAGE_KEY) return
      
      // Ignore if we just saved (this is our own event)
      if (justSavedRef.current) {
        justSavedRef.current = false
        return
      }
      
      // If data was cleared in another tab
      if (event.newValue === null) {
        console.log('Data cleared in another tab, reloading...')
        const result = initializeStorage()
        if (result.success && result.data) {
          setData(result.data)
          setSelectedYear(result.data.currentYear)
          setIsSyncedFromOtherTab(true)
          // Clear the sync flag after a short delay
          setTimeout(() => setIsSyncedFromOtherTab(false), 3000)
        }
        return
      }
      
      // Parse the new data from the other tab
      try {
        const parsed = JSON.parse(event.newValue)
        
        // Validate the data before accepting it
        const validation = validateAllotmentData(parsed)
        if (!validation.valid) {
          console.warn('Ignoring invalid sync data from other tab:', validation.errors)
          return
        }
        
        const newData = parsed as AllotmentData
        console.log('Data updated in another tab, syncing...')
        
        // Cancel any pending save (other tab's data is newer)
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }
        pendingDataRef.current = null
        
        // Update state with data from other tab
        setData(newData)
        setSelectedYear(newData.currentYear)
        setIsSyncedFromOtherTab(true)
        
        // Clear the sync flag after a short delay
        setTimeout(() => setIsSyncedFromOtherTab(false), 3000)
      } catch (e) {
        console.error('Failed to parse storage event data:', e)
      }
    }
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Debounced save function
  const debouncedSave = useCallback((dataToSave: AllotmentData) => {
    pendingDataRef.current = dataToSave
    // Clear any previous save error when attempting a new save
    setSaveError(null)
    setSaveStatus('saving')
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        // Mark that we're about to save (to ignore our own storage event)
        justSavedRef.current = true
        const result = saveAllotmentData(pendingDataRef.current)
        if (!result.success) {
          console.error('Failed to save allotment data:', result.error)
          setSaveError(result.error || 'Failed to save data')
          setSaveStatus('error')
          justSavedRef.current = false // Reset on error
        } else {
          setSaveError(null) // Clear error on successful save
          setSaveStatus('saved')
          setLastSavedAt(new Date())
          // Reset to idle after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
        pendingDataRef.current = null
      }
      saveTimeoutRef.current = null
    }, SAVE_DEBOUNCE_MS)
  }, [])

  // Save data whenever it changes (debounced)
  useEffect(() => {
    if (data && !isLoading) {
      debouncedSave(data)
    }
  }, [data, isLoading, debouncedSave])

  // Flush pending saves on unmount (important for data integrity)
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // Flush any pending data immediately on unmount
      if (pendingDataRef.current) {
        saveAllotmentData(pendingDataRef.current)
      }
    }
  }, [])

  // ============ YEAR NAVIGATION ============

  const selectYear = useCallback((year: number) => {
    setSelectedYear(year)
    if (data) {
      setData(setCurrentYear(data, year))
    }
  }, [data])

  const getYears = useCallback(() => {
    if (!data) return []
    return getAvailableYears(data)
  }, [data])

  // ============ BED SELECTION ============

  const selectBed = useCallback((bedId: PhysicalBedId | null) => {
    setSelectedBedId(bedId)
  }, [])

  const getBed = useCallback((bedId: PhysicalBedId) => {
    if (!data) return undefined
    return getBedById(data, bedId)
  }, [data])

  // ============ PLANTING CRUD ============

  const addPlanting = useCallback((bedId: PhysicalBedId, planting: NewPlanting) => {
    if (!data) return
    setData(storageAddPlanting(data, selectedYear, bedId, planting))
  }, [data, selectedYear])

  const updatePlanting = useCallback((bedId: PhysicalBedId, plantingId: string, updates: PlantingUpdate) => {
    if (!data) return
    setData(storageUpdatePlanting(data, selectedYear, bedId, plantingId, updates))
  }, [data, selectedYear])

  const removePlanting = useCallback((bedId: PhysicalBedId, plantingId: string) => {
    if (!data) return
    setData(storageRemovePlanting(data, selectedYear, bedId, plantingId))
  }, [data, selectedYear])

  const getPlantings = useCallback((bedId: PhysicalBedId) => {
    if (!data) return []
    return getPlantingsForBed(data, selectedYear, bedId)
  }, [data, selectedYear])

  // ============ BED SEASON OPERATIONS ============

  const getBedSeasonData = useCallback((bedId: PhysicalBedId) => {
    if (!data) return undefined
    return getBedSeason(data, selectedYear, bedId)
  }, [data, selectedYear])

  const updateRotationGroup = useCallback((bedId: PhysicalBedId, group: RotationGroup) => {
    if (!data) return
    setData(updateBedRotationGroup(data, selectedYear, bedId, group))
  }, [data, selectedYear])

  // ============ SEASON OPERATIONS ============

  const createSeason = useCallback((year: number, notes?: string) => {
    if (!data) return
    setData(addSeason(data, { year, status: 'planned', notes }))
    setSelectedYear(year)
  }, [data])

  const deleteSeasonData = useCallback((year: number) => {
    if (!data) return
    // Don't allow deleting the last season
    if (data.seasons.length <= 1) return
    const newData = removeSeason(data, year)
    setData(newData)
    setSelectedYear(newData.currentYear)
  }, [data])

  const updateSeasonNotes = useCallback((notes: string) => {
    if (!data) return
    setData(updateSeason(data, selectedYear, { notes }))
  }, [data, selectedYear])

  // ============ LAYOUT HELPERS ============

  const getRotationBedsData = useCallback(() => {
    if (!data) return []
    return getRotationBeds(data)
  }, [data])

  const getProblemBeds = useCallback(() => {
    if (!data) return []
    return getBedsByStatus(data, 'problem')
  }, [data])

  const getPerennialBeds = useCallback(() => {
    if (!data) return []
    return getBedsByStatus(data, 'perennial')
  }, [data])

  // ============ ROTATION HISTORY ============

  const getRotationHistoryData = useCallback((bedId: PhysicalBedId) => {
    if (!data) return []
    return getRotationHistory(data, bedId)
  }, [data])

  const getRecentRotationData = useCallback((bedId: PhysicalBedId, years: number = 3) => {
    if (!data) return []
    return getRecentRotation(data, bedId, years)
  }, [data])

  // ============ DATA REFRESH ============

  const reload = useCallback(() => {
    setIsLoading(true)
    const result = initializeStorage()
    if (result.success && result.data) {
      setData(result.data)
      setSelectedYear(result.data.currentYear)
      setError(null)
    } else {
      setError(result.error || 'Failed to reload data')
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
      const result = saveAllotmentData(pendingDataRef.current)
      if (!result.success) {
        setSaveError(result.error || 'Failed to save data')
      }
      pendingDataRef.current = null
    }
  }, [])

  // Clear save error (for user dismissal)
  const clearSaveError = useCallback(() => {
    setSaveError(null)
  }, [])

  // ============ MAINTENANCE TASKS ============

  const getMaintenanceTasksData = useCallback((): MaintenanceTask[] => {
    if (!data) return []
    return getMaintenanceTasks(data)
  }, [data])

  const getTasksForMonthData = useCallback((month: number): MaintenanceTask[] => {
    if (!data) return []
    return getTasksForMonth(data, month)
  }, [data])

  const getTasksForPlantingData = useCallback((plantingId: string): MaintenanceTask[] => {
    if (!data) return []
    return getTasksForPlanting(data, plantingId)
  }, [data])

  const addTask = useCallback((task: NewMaintenanceTask) => {
    if (!data) return
    setData(storageAddTask(data, task))
  }, [data])

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<MaintenanceTask, 'id'>>) => {
    if (!data) return
    setData(storageUpdateTask(data, taskId, updates))
  }, [data])

  const completeTask = useCallback((taskId: string) => {
    if (!data) return
    setData(storageCompleteTask(data, taskId))
  }, [data])

  const removeTask = useCallback((taskId: string) => {
    if (!data) return
    setData(storageRemoveTask(data, taskId))
  }, [data])

  // ============ BED NOTES ============

  const getBedNotesData = useCallback((bedId: PhysicalBedId): BedNote[] => {
    if (!data) return []
    return getBedNotes(data, selectedYear, bedId)
  }, [data, selectedYear])

  const addBedNoteData = useCallback((bedId: PhysicalBedId, note: NewBedNote) => {
    if (!data) return
    setData(storageAddBedNote(data, selectedYear, bedId, note))
  }, [data, selectedYear])

  const updateBedNoteData = useCallback((bedId: PhysicalBedId, noteId: string, updates: BedNoteUpdate) => {
    if (!data) return
    setData(storageUpdateBedNote(data, selectedYear, bedId, noteId, updates))
  }, [data, selectedYear])

  const removeBedNoteData = useCallback((bedId: PhysicalBedId, noteId: string) => {
    if (!data) return
    setData(storageRemoveBedNote(data, selectedYear, bedId, noteId))
  }, [data, selectedYear])

  return {
    // State
    data,
    currentSeason,
    selectedYear,
    selectedBedId,
    isLoading,
    error,
    saveError,
    isSyncedFromOtherTab,
    saveStatus,
    lastSavedAt,
    
    // Actions
    selectYear,
    getYears,
    selectBed,
    getBed,
    addPlanting,
    updatePlanting,
    removePlanting,
    getPlantings,
    getBedSeason: getBedSeasonData,
    updateRotationGroup,
    createSeason,
    deleteSeason: deleteSeasonData,
    updateSeasonNotes,
    getRotationBeds: getRotationBedsData,
    getProblemBeds,
    getPerennialBeds,
    getRotationHistory: getRotationHistoryData,
    getRecentRotation: getRecentRotationData,
    getMaintenanceTasks: getMaintenanceTasksData,
    getTasksForMonth: getTasksForMonthData,
    getTasksForPlanting: getTasksForPlantingData,
    addMaintenanceTask: addTask,
    updateMaintenanceTask: updateTask,
    completeMaintenanceTask: completeTask,
    removeMaintenanceTask: removeTask,
    getBedNotes: getBedNotesData,
    addBedNote: addBedNoteData,
    updateBedNote: updateBedNoteData,
    removeBedNote: removeBedNoteData,
    reload,
    flushSave,
    clearSaveError,
  }
}

