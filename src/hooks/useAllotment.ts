/**
 * useAllotment Hook
 *
 * Unified state management for allotment data.
 * Single source of truth for all allotment operations.
 */

'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
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
  GardenEvent,
  NewGardenEvent,
} from '@/types/unified-allotment'
import { PhysicalBedId, RotationGroup, PhysicalBed, SoilMethod } from '@/types/garden-planner'
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
  updateBedSoilMethod as storageUpdateSoilMethod,
  getGardenEvents,
  addGardenEvent as storageAddGardenEvent,
  removeGardenEvent as storageRemoveGardenEvent,
} from '@/services/allotment-storage'
import { STORAGE_KEY } from '@/types/unified-allotment'
import { usePersistedStorage, StorageResult } from './usePersistedStorage'

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
  updateSoilMethod: (bedId: PhysicalBedId, soilMethod: SoilMethod | undefined) => void
  
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

  // Garden events
  getGardenEvents: () => GardenEvent[]
  addGardenEvent: (event: NewGardenEvent) => void
  removeGardenEvent: (eventId: string) => void

  // Data operations
  reload: () => void
  flushSave: () => void  // Force immediate save of pending data
  clearSaveError: () => void  // Clear any save error
}

export type UseAllotmentReturn = UseAllotmentState & UseAllotmentActions

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

// ============ HOOK IMPLEMENTATION ============

export function useAllotment(): UseAllotmentReturn {
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [selectedBedId, setSelectedBedId] = useState<PhysicalBedId | null>(null)

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
    if (data) {
      setData(setCurrentYear(data, year))
    }
  }, [data, setData])

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
  }, [data, selectedYear, setData])

  const updatePlanting = useCallback((bedId: PhysicalBedId, plantingId: string, updates: PlantingUpdate) => {
    if (!data) return
    setData(storageUpdatePlanting(data, selectedYear, bedId, plantingId, updates))
  }, [data, selectedYear, setData])

  const removePlanting = useCallback((bedId: PhysicalBedId, plantingId: string) => {
    if (!data) return
    setData(storageRemovePlanting(data, selectedYear, bedId, plantingId))
  }, [data, selectedYear, setData])

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
  }, [data, selectedYear, setData])

  // ============ SEASON OPERATIONS ============

  const createSeason = useCallback((year: number, notes?: string) => {
    if (!data) return
    setData(addSeason(data, { year, status: 'planned', notes }))
    setSelectedYear(year)
  }, [data, setData])

  const deleteSeasonData = useCallback((year: number) => {
    if (!data) return
    // Don't allow deleting the last season
    if (data.seasons.length <= 1) return
    const newData = removeSeason(data, year)
    setData(newData)
    setSelectedYear(newData.currentYear)
  }, [data, setData])

  const updateSeasonNotes = useCallback((notes: string) => {
    if (!data) return
    setData(updateSeason(data, selectedYear, { notes }))
  }, [data, selectedYear, setData])

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

  const updateSoilMethod = useCallback((bedId: PhysicalBedId, soilMethod: SoilMethod | undefined) => {
    if (!data) return
    setData(storageUpdateSoilMethod(data, bedId, soilMethod))
  }, [data, setData])

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
    baseReload()
    // After reload, sync the selectedYear with the loaded data
    const result = initializeStorage()
    if (result.success && result.data) {
      setSelectedYear(result.data.currentYear)
    }
  }, [baseReload])

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
  }, [data, setData])

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<MaintenanceTask, 'id'>>) => {
    if (!data) return
    setData(storageUpdateTask(data, taskId, updates))
  }, [data, setData])

  const completeTask = useCallback((taskId: string) => {
    if (!data) return
    setData(storageCompleteTask(data, taskId))
  }, [data, setData])

  const removeTask = useCallback((taskId: string) => {
    if (!data) return
    setData(storageRemoveTask(data, taskId))
  }, [data, setData])

  // ============ BED NOTES ============

  const getBedNotesData = useCallback((bedId: PhysicalBedId): BedNote[] => {
    if (!data) return []
    return getBedNotes(data, selectedYear, bedId)
  }, [data, selectedYear])

  const addBedNoteData = useCallback((bedId: PhysicalBedId, note: NewBedNote) => {
    if (!data) return
    setData(storageAddBedNote(data, selectedYear, bedId, note))
  }, [data, selectedYear, setData])

  const updateBedNoteData = useCallback((bedId: PhysicalBedId, noteId: string, updates: BedNoteUpdate) => {
    if (!data) return
    setData(storageUpdateBedNote(data, selectedYear, bedId, noteId, updates))
  }, [data, selectedYear, setData])

  const removeBedNoteData = useCallback((bedId: PhysicalBedId, noteId: string) => {
    if (!data) return
    setData(storageRemoveBedNote(data, selectedYear, bedId, noteId))
  }, [data, selectedYear, setData])

  // ============ GARDEN EVENTS ============

  const getGardenEventsData = useCallback((): GardenEvent[] => {
    if (!data) return []
    return getGardenEvents(data)
  }, [data])

  const addGardenEventData = useCallback((event: NewGardenEvent) => {
    if (!data) return
    setData(storageAddGardenEvent(data, event))
  }, [data, setData])

  const removeGardenEventData = useCallback((eventId: string) => {
    if (!data) return
    setData(storageRemoveGardenEvent(data, eventId))
  }, [data, setData])

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
    updateSoilMethod,
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
    getGardenEvents: getGardenEventsData,
    addGardenEvent: addGardenEventData,
    removeGardenEvent: removeGardenEventData,
    reload,
    flushSave,
    clearSaveError,
  }
}

