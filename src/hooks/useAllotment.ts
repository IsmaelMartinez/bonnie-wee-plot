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
  AreaSeason,
  Planting,
  NewPlanting,
  PlantingUpdate,
  MaintenanceTask,
  NewMaintenanceTask,
  AreaNote,
  NewAreaNote,
  AreaNoteUpdate,
  GardenEvent,
  NewGardenEvent,
  StoredVariety,
  NewVariety,
  VarietyUpdate,
  // v10 unified Area type
  Area,
  AreaKind,
  CareLogEntry,
  NewCareLogEntry,
} from '@/types/unified-allotment'
import { PhysicalBedId, RotationGroup, PhysicalBed, AllotmentItemRef, AllotmentItemType, PermanentPlanting, InfrastructureItem } from '@/types/garden-planner'
import {
  initializeStorage,
  saveAllotmentData,
  validateAllotmentData,
  getSeasonByYear,
  getAvailableYears,
  getAreaSeason as storageGetAreaSeason,
  addPlanting as storageAddPlanting,
  addPlantings as storageAddPlantings,
  updatePlanting as storageUpdatePlanting,
  removePlanting as storageRemovePlanting,
  addSeason,
  removeSeason,
  updateSeason,
  setCurrentYear,
  updateAreaRotationGroup as storageUpdateAreaRotationGroup,
  getPlantingsForArea as storageGetPlantingsForArea,
  getBedById,
  getRotationBeds as storageGetRotationBeds,
  getRotationHistory as storageGetRotationHistory,
  getRecentRotation as storageGetRecentRotation,
  getMaintenanceTasks,
  getTasksForMonth,
  getTasksForArea as storageGetTasksForArea,
  addMaintenanceTask as storageAddTask,
  updateMaintenanceTask as storageUpdateTask,
  completeMaintenanceTask as storageCompleteTask,
  removeMaintenanceTask as storageRemoveTask,
  getAreaNotes as storageGetAreaNotes,
  addAreaNote as storageAddAreaNote,
  updateAreaNote as storageUpdateAreaNote,
  removeAreaNote as storageRemoveAreaNote,
  getGardenEvents,
  addGardenEvent as storageAddGardenEvent,
  removeGardenEvent as storageRemoveGardenEvent,
  // Variety operations
  getVarieties as storageGetVarieties,
  getVarietiesForYear as storageGetVarietiesForYear,
  addVariety as storageAddVariety,
  updateVariety as storageUpdateVariety,
  removeVariety as storageRemoveVariety,
  archiveVariety as storageArchiveVariety,
  unarchiveVariety as storageUnarchiveVariety,
  getActiveVarieties as storageGetActiveVarieties,
  togglePlannedYear as storageTogglePlannedYear,
  toggleHaveSeedsForYear as storageToggleHaveSeedsForYear,
  hasSeedsForYear as storageHasSeedsForYear,
  getSuppliers as storageGetSuppliers,
  getTotalSpendForYear as storageGetTotalSpendForYear,
  getAvailableVarietyYears as storageGetAvailableVarietyYears,
  getSeedsStatsForYear as storageGetSeedsStatsForYear,
  // Legacy unified item operations (for backward compatibility)
  getPermanentPlantingById,
  getInfrastructureById,
  // v10 unified area operations
  getAreaById,
  getAreasByKind as storageGetAreasByKind,
  getAllAreas as storageGetAllAreas,
  addArea as storageAddArea,
  updateArea as storageUpdateArea,
  removeArea as storageRemoveArea,
  archiveArea as storageArchiveArea,
  restoreArea as storageRestoreArea,
  changeAreaKind as storageChangeAreaKind,
  // v10 care log operations
  addCareLogEntry as storageAddCareLogEntry,
  updateCareLogEntry as storageUpdateCareLogEntry,
  removeCareLogEntry as storageRemoveCareLogEntry,
  getCareLogsForArea,
  getAllCareLogsForArea,
  logHarvest as storageLogHarvest,
  getHarvestTotal,
} from '@/services/allotment-storage'
import { syncPlantingToVariety } from '@/services/variety-allotment-sync'
import { STORAGE_KEY } from '@/types/unified-allotment'
import { usePersistedStorage, StorageResult, SaveStatus } from './usePersistedStorage'

// Re-export SaveStatus for backward compatibility
export type { SaveStatus } from './usePersistedStorage'

// ============ HOOK TYPES ============

export interface UseAllotmentState {
  data: AllotmentData | null
  currentSeason: SeasonRecord | null
  selectedYear: number
  selectedBedId: PhysicalBedId | null
  selectedItemRef: AllotmentItemRef | null  // Unified selection (bed, permanent, or infrastructure)
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

  // Unified item selection
  selectItem: (ref: AllotmentItemRef | null) => void
  getSelectedItemType: () => AllotmentItemType | null
  getPermanentPlanting: (id: string) => PermanentPlanting | undefined
  getInfrastructureItem: (id: string) => InfrastructureItem | undefined

  // Bed selection (legacy - prefer selectItem for new code)
  selectBed: (bedId: string | null) => void
  getBed: (bedId: string) => PhysicalBed | undefined

  // Planting CRUD (v10: works with any area)
  addPlanting: (areaId: string, planting: NewPlanting) => void
  addPlantings: (areaId: string, plantings: NewPlanting[]) => void
  updatePlanting: (areaId: string, plantingId: string, updates: PlantingUpdate) => void
  removePlanting: (areaId: string, plantingId: string) => void
  getPlantings: (areaId: string) => Planting[]

  // Area season operations (v10)
  getAreaSeason: (areaId: string) => AreaSeason | undefined
  updateRotationGroup: (areaId: string, group: RotationGroup) => void

  // Season operations
  createSeason: (year: number, notes?: string) => void
  deleteSeason: (year: number) => void
  updateSeasonNotes: (notes: string) => void

  // Layout helpers
  getRotationBeds: () => Area[]
  getPerennialBeds: () => Area[]

  // Rotation history
  getRotationHistory: (areaId: string) => Array<{ year: number; group: RotationGroup }>
  getRecentRotation: (areaId: string, years?: number) => RotationGroup[]

  // Maintenance tasks
  getMaintenanceTasks: () => MaintenanceTask[]
  getTasksForMonth: (month: number) => MaintenanceTask[]
  getTasksForArea: (areaId: string) => MaintenanceTask[]
  addMaintenanceTask: (task: NewMaintenanceTask) => void
  updateMaintenanceTask: (taskId: string, updates: Partial<Omit<MaintenanceTask, 'id'>>) => void
  completeMaintenanceTask: (taskId: string) => void
  removeMaintenanceTask: (taskId: string) => void

  // Area notes (v10)
  getAreaNotes: (areaId: string) => AreaNote[]
  addAreaNote: (areaId: string, note: NewAreaNote) => void
  updateAreaNote: (areaId: string, noteId: string, updates: AreaNoteUpdate) => void
  removeAreaNote: (areaId: string, noteId: string) => void

  // Garden events
  getGardenEvents: () => GardenEvent[]
  addGardenEvent: (event: NewGardenEvent) => void
  removeGardenEvent: (eventId: string) => void

  // Variety operations
  getVarieties: () => StoredVariety[]
  getVarietiesForYear: (year: number) => StoredVariety[]
  addVariety: (variety: NewVariety) => void
  updateVariety: (id: string, updates: VarietyUpdate) => void
  removeVariety: (id: string) => void
  archiveVariety: (id: string) => void
  unarchiveVariety: (id: string) => void
  getActiveVarieties: (includeArchived?: boolean) => StoredVariety[]
  togglePlannedYear: (varietyId: string, year: number) => void
  toggleHaveSeedsForYear: (varietyId: string, year: number) => void
  hasSeedsForYear: (varietyId: string, year: number) => boolean
  getSuppliers: () => string[]
  getTotalSpendForYear: (year: number) => number
  getAvailableVarietyYears: () => number[]
  getSeedsStatsForYear: (year: number) => { total: number; have: number; ordered: number; none: number }

  // v10 unified area operations
  getArea: (id: string) => Area | undefined
  getAreasByKind: (kind: AreaKind) => Area[]
  getAllAreas: () => Area[]
  addArea: (area: Omit<Area, 'id'>) => string
  updateArea: (areaId: string, updates: Partial<Omit<Area, 'id'>>) => void
  removeArea: (areaId: string) => void
  archiveArea: (areaId: string) => void
  restoreArea: (areaId: string) => void
  changeAreaKind: (areaId: string, newKind: AreaKind, options?: { rotationGroup?: RotationGroup }) => void

  // v10 care log operations
  addCareLog: (areaId: string, entry: NewCareLogEntry) => string
  updateCareLog: (areaId: string, entryId: string, updates: Partial<Omit<CareLogEntry, 'id'>>) => void
  removeCareLog: (areaId: string, entryId: string) => void
  getCareLogs: (areaId: string) => CareLogEntry[]
  getAllCareLogs: (areaId: string) => Array<{ year: number; entry: CareLogEntry }>
  logHarvest: (areaId: string, quantity: number, unit: string, date?: string) => string
  getHarvestTotal: (areaId: string) => { quantity: number; unit: string } | null

  // Data operations
  reload: () => void
  flushSave: () => void  // Force immediate save of pending data
  clearSaveError: () => void  // Clear any save error

  // Metadata operations
  updateMeta: (updates: Partial<AllotmentData['meta']>) => void
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
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedBedId, setSelectedBedId] = useState<PhysicalBedId | null>(null)
  const [selectedItemRef, setSelectedItemRef] = useState<AllotmentItemRef | null>(null)

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

  // ============ UNIFIED ITEM SELECTION ============

  const selectItem = useCallback((ref: AllotmentItemRef | null) => {
    setSelectedItemRef(ref)
    // Also update legacy selectedBedId for backwards compatibility
    if (ref && ref.type === 'bed') {
      setSelectedBedId(ref.id as PhysicalBedId)
    } else {
      setSelectedBedId(null)
    }
  }, [])

  const getSelectedItemType = useCallback((): AllotmentItemType | null => {
    return selectedItemRef?.type || null
  }, [selectedItemRef])

  const getPermanentPlantingData = useCallback((id: string): PermanentPlanting | undefined => {
    if (!data) return undefined
    return getPermanentPlantingById(data, id)
  }, [data])

  const getInfrastructureItemData = useCallback((id: string): InfrastructureItem | undefined => {
    if (!data) return undefined
    return getInfrastructureById(data, id)
  }, [data])

  // ============ BED SELECTION (LEGACY) ============

  const selectBed = useCallback((bedId: PhysicalBedId | null) => {
    setSelectedBedId(bedId)
    // Also update unified selection for consistency
    if (bedId) {
      setSelectedItemRef({ type: 'bed', id: bedId })
    } else {
      setSelectedItemRef(null)
    }
  }, [])

  const getBed = useCallback((bedId: PhysicalBedId) => {
    if (!data) return undefined
    return getBedById(data, bedId)
  }, [data])

  // ============ PLANTING CRUD ============

  const addPlanting = useCallback((bedId: PhysicalBedId, planting: NewPlanting) => {
    if (!data) return

    // Add planting to allotment storage
    const updatedData = storageAddPlanting(data, selectedYear, bedId, planting)
    setData(updatedData)

    // Sync to variety storage
    const areaSeason = storageGetAreaSeason(updatedData, selectedYear, bedId)
    const addedPlanting = areaSeason?.plantings[areaSeason.plantings.length - 1]

    if (addedPlanting) {
      syncPlantingToVariety(addedPlanting, selectedYear)
    }
  }, [data, selectedYear, setData])

  const addPlantings = useCallback((bedId: PhysicalBedId, plantings: NewPlanting[]) => {
    if (!data || plantings.length === 0) return

    // Add all plantings in a single state update
    const updatedData = storageAddPlantings(data, selectedYear, bedId, plantings)
    setData(updatedData)

    // Sync each added planting to variety storage
    const areaSeason = storageGetAreaSeason(updatedData, selectedYear, bedId)
    if (areaSeason) {
      // Get the newly added plantings (last N items)
      const addedPlantings = areaSeason.plantings.slice(-plantings.length)
      addedPlantings.forEach(planting => {
        syncPlantingToVariety(planting, selectedYear)
      })
    }
  }, [data, selectedYear, setData])

  const updatePlanting = useCallback((bedId: PhysicalBedId, plantingId: string, updates: PlantingUpdate) => {
    if (!data) return
    setData(storageUpdatePlanting(data, selectedYear, bedId, plantingId, updates))
  }, [data, selectedYear, setData])

  const removePlanting = useCallback((bedId: PhysicalBedId, plantingId: string) => {
    if (!data) return
    setData(storageRemovePlanting(data, selectedYear, bedId, plantingId))
  }, [data, selectedYear, setData])

  const getPlantings = useCallback((areaId: string) => {
    if (!data) return []
    return storageGetPlantingsForArea(data, selectedYear, areaId)
  }, [data, selectedYear])

  // ============ AREA SEASON OPERATIONS (v10) ============

  const getAreaSeasonData = useCallback((areaId: string) => {
    if (!data) return undefined
    return storageGetAreaSeason(data, selectedYear, areaId)
  }, [data, selectedYear])

  const updateRotationGroup = useCallback((areaId: string, group: RotationGroup) => {
    if (!data) return
    setData(storageUpdateAreaRotationGroup(data, selectedYear, areaId, group))
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

  const getRotationBedsData = useCallback((): Area[] => {
    if (!data) return []
    return storageGetRotationBeds(data)
  }, [data])

  const getPerennialBeds = useCallback((): Area[] => {
    if (!data) return []
    return storageGetAreasByKind(data, 'perennial-bed')
  }, [data])

  // ============ ROTATION HISTORY ============

  const getRotationHistoryData = useCallback((areaId: string) => {
    if (!data) return []
    return storageGetRotationHistory(data, areaId)
  }, [data])

  const getRecentRotationData = useCallback((areaId: string, years: number = 3) => {
    if (!data) return []
    return storageGetRecentRotation(data, areaId, years)
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

  const getTasksForAreaData = useCallback((areaId: string): MaintenanceTask[] => {
    if (!data) return []
    return storageGetTasksForArea(data, areaId)
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

  // ============ AREA NOTES (v10) ============

  const getAreaNotesData = useCallback((areaId: string): AreaNote[] => {
    if (!data) return []
    return storageGetAreaNotes(data, selectedYear, areaId)
  }, [data, selectedYear])

  const addAreaNoteData = useCallback((areaId: string, note: NewAreaNote) => {
    if (!data) return
    setData(storageAddAreaNote(data, selectedYear, areaId, note))
  }, [data, selectedYear, setData])

  const updateAreaNoteData = useCallback((areaId: string, noteId: string, updates: AreaNoteUpdate) => {
    if (!data) return
    setData(storageUpdateAreaNote(data, selectedYear, areaId, noteId, updates))
  }, [data, selectedYear, setData])

  const removeAreaNoteData = useCallback((areaId: string, noteId: string) => {
    if (!data) return
    setData(storageRemoveAreaNote(data, selectedYear, areaId, noteId))
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

  // ============ VARIETY OPERATIONS ============

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

  const togglePlannedYearData = useCallback((varietyId: string, year: number) => {
    if (!data) return
    setData(storageTogglePlannedYear(data, varietyId, year))
  }, [data, setData])

  const toggleHaveSeedsForYearData = useCallback((varietyId: string, year: number) => {
    if (!data) return
    setData(storageToggleHaveSeedsForYear(data, varietyId, year))
  }, [data, setData])

  const hasSeedsForYearData = useCallback((varietyId: string, year: number): boolean => {
    if (!data) return false
    const variety = data.varieties?.find(v => v.id === varietyId)
    return variety ? storageHasSeedsForYear(variety, year) : false
  }, [data])

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

  // ============ V10 UNIFIED AREA OPERATIONS ============

  const getAreaData = useCallback((id: string): Area | undefined => {
    if (!data) return undefined
    return getAreaById(data, id)
  }, [data])

  const getAreasByKindData = useCallback((kind: AreaKind): Area[] => {
    if (!data) return []
    return storageGetAreasByKind(data, kind)
  }, [data])

  const getAllAreasData = useCallback((): Area[] => {
    if (!data) return []
    return storageGetAllAreas(data)
  }, [data])

  const addAreaData = useCallback((area: Omit<Area, 'id'>): string => {
    if (!data) return ''
    const result = storageAddArea(data, area)
    setData(result.data)
    return result.areaId
  }, [data, setData])

  const updateAreaData = useCallback((areaId: string, updates: Partial<Omit<Area, 'id'>>) => {
    if (!data) return
    setData(storageUpdateArea(data, areaId, updates))
  }, [data, setData])

  const removeAreaData = useCallback((areaId: string) => {
    if (!data) return
    setData(storageRemoveArea(data, areaId))
  }, [data, setData])

  const archiveAreaData = useCallback((areaId: string) => {
    if (!data) return
    setData(storageArchiveArea(data, areaId))
  }, [data, setData])

  const restoreAreaData = useCallback((areaId: string) => {
    if (!data) return
    setData(storageRestoreArea(data, areaId))
  }, [data, setData])

  const changeAreaKindData = useCallback((areaId: string, newKind: AreaKind, options?: { rotationGroup?: RotationGroup }) => {
    if (!data) return
    setData(storageChangeAreaKind(data, areaId, newKind, options))
  }, [data, setData])

  // ============ V10 CARE LOG OPERATIONS ============

  const addCareLogData = useCallback((areaId: string, entry: NewCareLogEntry): string => {
    if (!data) return ''
    const result = storageAddCareLogEntry(data, selectedYear, areaId, entry)
    setData(result.data)
    return result.entryId
  }, [data, selectedYear, setData])

  const updateCareLogData = useCallback((
    areaId: string,
    entryId: string,
    updates: Partial<Omit<CareLogEntry, 'id'>>
  ) => {
    if (!data) return
    setData(storageUpdateCareLogEntry(data, selectedYear, areaId, entryId, updates))
  }, [data, selectedYear, setData])

  const removeCareLogData = useCallback((areaId: string, entryId: string) => {
    if (!data) return
    setData(storageRemoveCareLogEntry(data, selectedYear, areaId, entryId))
  }, [data, selectedYear, setData])

  const getCareLogsData = useCallback((areaId: string): CareLogEntry[] => {
    if (!data) return []
    return getCareLogsForArea(data, selectedYear, areaId)
  }, [data, selectedYear])

  const getAllCareLogsData = useCallback((areaId: string): Array<{ year: number; entry: CareLogEntry }> => {
    if (!data) return []
    return getAllCareLogsForArea(data, areaId)
  }, [data])

  const logHarvestData = useCallback((
    areaId: string,
    quantity: number,
    unit: string,
    date?: string
  ): string => {
    if (!data) return ''
    const result = storageLogHarvest(data, selectedYear, areaId, quantity, unit, date)
    setData(result.data)
    return result.entryId
  }, [data, selectedYear, setData])

  const getHarvestTotalData = useCallback((areaId: string): { quantity: number; unit: string } | null => {
    if (!data) return null
    return getHarvestTotal(data, selectedYear, areaId)
  }, [data, selectedYear])

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
    currentSeason,
    selectedYear,
    selectedBedId,
    selectedItemRef,
    isLoading,
    error,
    saveError,
    isSyncedFromOtherTab,
    saveStatus,
    lastSavedAt,

    // Year navigation
    selectYear,
    getYears,

    // Unified item selection
    selectItem,
    getSelectedItemType,
    getPermanentPlanting: getPermanentPlantingData,
    getInfrastructureItem: getInfrastructureItemData,

    // Legacy bed selection
    selectBed,
    getBed,

    // Planting CRUD
    addPlanting,
    addPlantings,
    updatePlanting,
    removePlanting,
    getPlantings,

    // Area season operations (v10)
    getAreaSeason: getAreaSeasonData,
    updateRotationGroup,

    // Season operations
    createSeason,
    deleteSeason: deleteSeasonData,
    updateSeasonNotes,

    // Layout helpers
    getRotationBeds: getRotationBedsData,
    getPerennialBeds,

    // Rotation history
    getRotationHistory: getRotationHistoryData,
    getRecentRotation: getRecentRotationData,

    // Maintenance tasks
    getMaintenanceTasks: getMaintenanceTasksData,
    getTasksForMonth: getTasksForMonthData,
    getTasksForArea: getTasksForAreaData,
    addMaintenanceTask: addTask,
    updateMaintenanceTask: updateTask,
    completeMaintenanceTask: completeTask,
    removeMaintenanceTask: removeTask,

    // Area notes (v10)
    getAreaNotes: getAreaNotesData,
    addAreaNote: addAreaNoteData,
    updateAreaNote: updateAreaNoteData,
    removeAreaNote: removeAreaNoteData,

    // Garden events
    getGardenEvents: getGardenEventsData,
    addGardenEvent: addGardenEventData,
    removeGardenEvent: removeGardenEventData,

    // Variety operations
    getVarieties: getVarietiesData,
    getVarietiesForYear: getVarietiesForYearData,
    addVariety: addVarietyData,
    updateVariety: updateVarietyData,
    removeVariety: removeVarietyData,
    archiveVariety: archiveVarietyData,
    unarchiveVariety: unarchiveVarietyData,
    getActiveVarieties: getActiveVarietiesData,
    togglePlannedYear: togglePlannedYearData,
    toggleHaveSeedsForYear: toggleHaveSeedsForYearData,
    hasSeedsForYear: hasSeedsForYearData,
    getSuppliers: getSuppliersData,
    getTotalSpendForYear: getTotalSpendForYearData,
    getAvailableVarietyYears: getAvailableVarietyYearsData,
    getSeedsStatsForYear: getSeedsStatsForYearData,

    // v10 unified area operations
    getArea: getAreaData,
    getAreasByKind: getAreasByKindData,
    getAllAreas: getAllAreasData,
    addArea: addAreaData,
    updateArea: updateAreaData,
    removeArea: removeAreaData,
    archiveArea: archiveAreaData,
    restoreArea: restoreAreaData,
    changeAreaKind: changeAreaKindData,

    // v10 care log operations
    addCareLog: addCareLogData,
    updateCareLog: updateCareLogData,
    removeCareLog: removeCareLogData,
    getCareLogs: getCareLogsData,
    getAllCareLogs: getAllCareLogsData,
    logHarvest: logHarvestData,
    getHarvestTotal: getHarvestTotalData,

    // Data operations
    reload,
    flushSave,
    clearSaveError,

    // Metadata operations
    updateMeta,
  }
}

