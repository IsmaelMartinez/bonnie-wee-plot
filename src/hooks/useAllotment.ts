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
  StoredVariety,
  NewVariety,
  VarietyUpdate,
  // v9 types for unified area system
  Area,
  BedArea,
  PermanentArea,
  InfrastructureArea,
  PermanentUnderplanting,
  NewPermanentUnderplanting,
  SeasonalUnderplanting,
  NewSeasonalUnderplanting,
  CareLogEntry,
  NewCareLogEntry,
  PermanentSeason,
} from '@/types/unified-allotment'
import { PhysicalBedId, RotationGroup, PhysicalBed, AllotmentItemRef, AllotmentItemType, PermanentPlanting, InfrastructureItem } from '@/types/garden-planner'
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
  getGardenEvents,
  addGardenEvent as storageAddGardenEvent,
  removeGardenEvent as storageRemoveGardenEvent,
  // Variety operations
  getVarieties as storageGetVarieties,
  getVarietiesForYear as storageGetVarietiesForYear,
  addVariety as storageAddVariety,
  updateVariety as storageUpdateVariety,
  removeVariety as storageRemoveVariety,
  togglePlannedYear as storageTogglePlannedYear,
  toggleHaveSeedsForYear as storageToggleHaveSeedsForYear,
  hasSeedsForYear as storageHasSeedsForYear,
  getSuppliers as storageGetSuppliers,
  getTotalSpendForYear as storageGetTotalSpendForYear,
  getAvailableVarietyYears as storageGetAvailableVarietyYears,
  getSeedsStatsForYear as storageGetSeedsStatsForYear,
  // Unified item operations
  getPermanentPlantingById,
  getInfrastructureById,
  // v9 unified area operations
  getAreaById,
  getAreasByType,
  getBedAreaById,
  getPermanentAreaById,
  getInfrastructureAreaById,
  addArea as storageAddArea,
  updateArea as storageUpdateArea,
  removeArea as storageRemoveArea,
  convertAreaType as storageConvertAreaType,
  validateAreaConversion,
  type ConversionValidationResult,
  // v9 underplanting operations
  addPermanentUnderplanting as storageAddPermanentUnderplanting,
  updatePermanentUnderplanting as storageUpdatePermanentUnderplanting,
  removePermanentUnderplanting as storageRemovePermanentUnderplanting,
  getPermanentUnderplantingsForArea,
  addSeasonalUnderplanting as storageAddSeasonalUnderplanting,
  removeSeasonalUnderplanting as storageRemoveSeasonalUnderplanting,
  getSeasonalUnderplantingsForArea,
  // v9 care log operations
  addCareLogEntry as storageAddCareLogEntry,
  updateCareLogEntry as storageUpdateCareLogEntry,
  removeCareLogEntry as storageRemoveCareLogEntry,
  getCareLogsForArea,
  getAllCareLogsForArea,
  logHarvest as storageLogHarvest,
  getHarvestTotal,
  updatePermanentSeasonNotes as storageUpdatePermanentSeasonNotes,
  getPermanentSeason,
} from '@/services/allotment-storage'
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
  togglePlannedYear: (varietyId: string, year: number) => void
  toggleHaveSeedsForYear: (varietyId: string, year: number) => void
  hasSeedsForYear: (varietyId: string, year: number) => boolean
  getSuppliers: () => string[]
  getTotalSpendForYear: (year: number) => number
  getAvailableVarietyYears: () => number[]
  getSeedsStatsForYear: (year: number) => { total: number; have: number; ordered: number; none: number }

  // v9 unified area operations
  getArea: (id: string) => Area | undefined
  getAreas: <T extends Area['type']>(type: T) => Extract<Area, { type: T }>[]
  getBedArea: (bedId: string) => BedArea | undefined
  getPermanentArea: (id: string) => PermanentArea | undefined
  getInfrastructureArea: (id: string) => InfrastructureArea | undefined
  addArea: (area: Omit<Area, 'id'>) => string
  updateArea: (areaId: string, updates: Partial<Omit<Area, 'id' | 'type'>>) => void
  removeArea: (areaId: string) => void
  convertAreaType: (areaId: string, newType: Area['type'], typeConfig?: Partial<BedArea | PermanentArea | InfrastructureArea>) => ConversionValidationResult
  validateAreaConversion: (areaId: string, newType: Area['type']) => ConversionValidationResult

  // v9 underplanting operations
  addPermanentUnderplanting: (underplanting: NewPermanentUnderplanting) => string
  updatePermanentUnderplanting: (underplantingId: string, updates: Partial<Omit<PermanentUnderplanting, 'id'>>) => void
  removePermanentUnderplanting: (underplantingId: string) => void
  getPermanentUnderplantings: (parentAreaId: string) => PermanentUnderplanting[]
  addSeasonalUnderplanting: (parentAreaId: string, planting: NewSeasonalUnderplanting) => string
  removeSeasonalUnderplanting: (parentAreaId: string, underplantingId: string) => void
  getSeasonalUnderplantings: (parentAreaId: string) => SeasonalUnderplanting[]

  // v9 care log operations
  addCareLog: (areaId: string, entry: NewCareLogEntry) => string
  updateCareLog: (areaId: string, entryId: string, updates: Partial<Omit<CareLogEntry, 'id'>>) => void
  removeCareLog: (areaId: string, entryId: string) => void
  getCareLogs: (areaId: string) => CareLogEntry[]
  getAllCareLogs: (areaId: string) => Array<{ year: number; entry: CareLogEntry }>
  logHarvest: (areaId: string, quantity: number, unit: string, date?: string) => string
  getHarvestTotal: (areaId: string) => { quantity: number; unit: string } | null
  updatePermanentSeasonNotes: (areaId: string, notes: string) => void
  getPermanentSeason: (areaId: string) => PermanentSeason | undefined

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

  // ============ V9 UNIFIED AREA OPERATIONS ============

  const getAreaData = useCallback((id: string): Area | undefined => {
    if (!data) return undefined
    return getAreaById(data, id)
  }, [data])

  const getAreasData = useCallback(<T extends Area['type']>(type: T): Extract<Area, { type: T }>[] => {
    if (!data) return []
    return getAreasByType(data, type)
  }, [data])

  const getBedAreaData = useCallback((bedId: string): BedArea | undefined => {
    if (!data) return undefined
    return getBedAreaById(data, bedId)
  }, [data])

  const getPermanentAreaData = useCallback((id: string): PermanentArea | undefined => {
    if (!data) return undefined
    return getPermanentAreaById(data, id)
  }, [data])

  const getInfrastructureAreaData = useCallback((id: string): InfrastructureArea | undefined => {
    if (!data) return undefined
    return getInfrastructureAreaById(data, id)
  }, [data])

  const addAreaData = useCallback((area: Omit<Area, 'id'>): string => {
    if (!data) return ''
    const result = storageAddArea(data, area)
    setData(result.data)
    return result.areaId
  }, [data, setData])

  const updateAreaData = useCallback((areaId: string, updates: Partial<Omit<Area, 'id' | 'type'>>) => {
    if (!data) return
    setData(storageUpdateArea(data, areaId, updates))
  }, [data, setData])

  const removeAreaData = useCallback((areaId: string) => {
    if (!data) return
    setData(storageRemoveArea(data, areaId))
  }, [data, setData])

  const validateAreaConversionData = useCallback((
    areaId: string,
    newType: Area['type']
  ): ConversionValidationResult => {
    if (!data) return { isValid: false, warnings: [], errors: ['No data loaded'] }
    return validateAreaConversion(data, areaId, newType)
  }, [data])

  const convertAreaTypeData = useCallback((
    areaId: string,
    newType: Area['type'],
    typeConfig?: Partial<BedArea | PermanentArea | InfrastructureArea>
  ): ConversionValidationResult => {
    if (!data) return { isValid: false, warnings: [], errors: ['No data loaded'] }
    const result = storageConvertAreaType(data, areaId, newType, typeConfig)
    if (result.validation.isValid) {
      setData(result.data)
    }
    return result.validation
  }, [data, setData])

  // ============ V9 UNDERPLANTING OPERATIONS ============

  const addPermanentUnderplantingData = useCallback((underplanting: NewPermanentUnderplanting): string => {
    if (!data) return ''
    const result = storageAddPermanentUnderplanting(data, underplanting)
    setData(result.data)
    return result.underplantingId
  }, [data, setData])

  const updatePermanentUnderplantingData = useCallback((
    underplantingId: string,
    updates: Partial<Omit<PermanentUnderplanting, 'id'>>
  ) => {
    if (!data) return
    setData(storageUpdatePermanentUnderplanting(data, underplantingId, updates))
  }, [data, setData])

  const removePermanentUnderplantingData = useCallback((underplantingId: string) => {
    if (!data) return
    setData(storageRemovePermanentUnderplanting(data, underplantingId))
  }, [data, setData])

  const getPermanentUnderplantingsData = useCallback((parentAreaId: string): PermanentUnderplanting[] => {
    if (!data) return []
    return getPermanentUnderplantingsForArea(data, parentAreaId)
  }, [data])

  const addSeasonalUnderplantingData = useCallback((
    parentAreaId: string,
    planting: NewSeasonalUnderplanting
  ): string => {
    if (!data) return ''
    const result = storageAddSeasonalUnderplanting(data, selectedYear, parentAreaId, planting)
    setData(result.data)
    return result.underplantingId
  }, [data, selectedYear, setData])

  const removeSeasonalUnderplantingData = useCallback((parentAreaId: string, underplantingId: string) => {
    if (!data) return
    setData(storageRemoveSeasonalUnderplanting(data, selectedYear, parentAreaId, underplantingId))
  }, [data, selectedYear, setData])

  const getSeasonalUnderplantingsData = useCallback((parentAreaId: string): SeasonalUnderplanting[] => {
    if (!data) return []
    return getSeasonalUnderplantingsForArea(data, selectedYear, parentAreaId)
  }, [data, selectedYear])

  // ============ V9 CARE LOG OPERATIONS ============

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

  const updatePermanentSeasonNotesData = useCallback((areaId: string, notes: string) => {
    if (!data) return
    setData(storageUpdatePermanentSeasonNotes(data, selectedYear, areaId, notes))
  }, [data, selectedYear, setData])

  const getPermanentSeasonData = useCallback((areaId: string): PermanentSeason | undefined => {
    if (!data) return undefined
    return getPermanentSeason(data, selectedYear, areaId)
  }, [data, selectedYear])

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

    // Actions
    selectYear,
    getYears,
    selectItem,
    getSelectedItemType,
    getPermanentPlanting: getPermanentPlantingData,
    getInfrastructureItem: getInfrastructureItemData,
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
    getGardenEvents: getGardenEventsData,
    addGardenEvent: addGardenEventData,
    removeGardenEvent: removeGardenEventData,
    getVarieties: getVarietiesData,
    getVarietiesForYear: getVarietiesForYearData,
    addVariety: addVarietyData,
    updateVariety: updateVarietyData,
    removeVariety: removeVarietyData,
    togglePlannedYear: togglePlannedYearData,
    toggleHaveSeedsForYear: toggleHaveSeedsForYearData,
    hasSeedsForYear: hasSeedsForYearData,
    getSuppliers: getSuppliersData,
    getTotalSpendForYear: getTotalSpendForYearData,
    getAvailableVarietyYears: getAvailableVarietyYearsData,
    getSeedsStatsForYear: getSeedsStatsForYearData,
    // v9 unified area operations
    getArea: getAreaData,
    getAreas: getAreasData,
    getBedArea: getBedAreaData,
    getPermanentArea: getPermanentAreaData,
    getInfrastructureArea: getInfrastructureAreaData,
    addArea: addAreaData,
    updateArea: updateAreaData,
    removeArea: removeAreaData,
    convertAreaType: convertAreaTypeData,
    validateAreaConversion: validateAreaConversionData,
    // v9 underplanting operations
    addPermanentUnderplanting: addPermanentUnderplantingData,
    updatePermanentUnderplanting: updatePermanentUnderplantingData,
    removePermanentUnderplanting: removePermanentUnderplantingData,
    getPermanentUnderplantings: getPermanentUnderplantingsData,
    addSeasonalUnderplanting: addSeasonalUnderplantingData,
    removeSeasonalUnderplanting: removeSeasonalUnderplantingData,
    getSeasonalUnderplantings: getSeasonalUnderplantingsData,
    // v9 care log operations
    addCareLog: addCareLogData,
    updateCareLog: updateCareLogData,
    removeCareLog: removeCareLogData,
    getCareLogs: getCareLogsData,
    getAllCareLogs: getAllCareLogsData,
    logHarvest: logHarvestData,
    getHarvestTotal: getHarvestTotalData,
    updatePermanentSeasonNotes: updatePermanentSeasonNotesData,
    getPermanentSeason: getPermanentSeasonData,
    reload,
    flushSave,
    clearSaveError,
  }
}

