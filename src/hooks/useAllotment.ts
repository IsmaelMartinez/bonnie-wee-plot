/**
 * useAllotment Hook
 *
 * Unified state management for allotment data.
 * Single source of truth for all allotment operations.
 *
 * This hook composes multiple focused sub-hooks from ./allotment/
 * while maintaining a stable external interface.
 */

'use client'

import { useCallback } from 'react'
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
  SeedStatus,
  // v10 unified Area type
  Area,
  AreaKind,
  CareLogEntry,
  NewCareLogEntry,
  // v14 grid position
  GridPosition,
} from '@/types/unified-allotment'
import { PhysicalBedId, RotationGroup, PhysicalBed, AllotmentItemRef, AllotmentItemType, PermanentPlanting, InfrastructureItem } from '@/types/garden-planner'
import { SaveStatus } from './usePersistedStorage'

// Import sub-hooks
import { useAllotmentData } from './allotment/useAllotmentData'
import { useAllotmentAreas } from './allotment/useAllotmentAreas'
import { useAllotmentVarieties } from './allotment/useAllotmentVarieties'
import { useAllotmentPlantings } from './allotment/useAllotmentPlantings'
import { useAllotmentMaintenance } from './allotment/useAllotmentMaintenance'
import { useAllotmentNotes } from './allotment/useAllotmentNotes'
import { useAllotmentCareLogs } from './allotment/useAllotmentCareLogs'

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
  updateAreaSeasonPosition: (areaId: string, position: GridPosition) => void

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
  toggleHaveSeedsForYear: (varietyId: string, year: number) => void
  hasSeedsForYear: (varietyId: string, year: number) => boolean
  removeVarietyFromYear: (varietyId: string, year: number) => void
  addVarietyToYear: (varietyId: string, year: number, status?: SeedStatus) => void
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
  flushSave: () => Promise<boolean>  // Force immediate save of pending data, returns true if successful
  clearSaveError: () => void  // Clear any save error

  // Metadata operations
  updateMeta: (updates: Partial<AllotmentData['meta']>) => void
}

export type UseAllotmentReturn = UseAllotmentState & UseAllotmentActions

// ============ HOOK IMPLEMENTATION ============

export function useAllotment(): UseAllotmentReturn {
  // Phase 1: Core data management
  const dataHook = useAllotmentData()
  const {
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
    selectYear: baseSelectYear,
    getYears,
    reload,
    flushSave,
    clearSaveError,
    updateMeta,
  } = dataHook

  // Wrapper to also pass year changes to plantings hook
  const selectYear = useCallback((year: number) => {
    baseSelectYear(year)
  }, [baseSelectYear])

  // Phase 2: Areas and Varieties (parallel)
  const areasHook = useAllotmentAreas({ data, setData })
  const {
    selectedBedId,
    selectedItemRef,
    selectItem,
    selectBed,
    getSelectedItemType,
    getPermanentPlanting,
    getInfrastructureItem,
    getBed,
    getArea,
    getAreasByKind,
    getAllAreas,
    addArea,
    updateArea,
    removeArea,
    archiveArea,
    restoreArea,
  } = areasHook

  const varietiesHook = useAllotmentVarieties({ data, setData })
  const {
    getVarieties,
    getVarietiesForYear,
    addVariety,
    updateVariety,
    removeVariety,
    archiveVariety,
    unarchiveVariety,
    getActiveVarieties,
    toggleHaveSeedsForYear,
    hasSeedsForYear,
    removeVarietyFromYear,
    addVarietyToYear,
    getSuppliers,
    getTotalSpendForYear,
    getAvailableVarietyYears,
    getSeedsStatsForYear,
  } = varietiesHook

  // Phase 3: Plantings (depends on data and selectedYear)
  const plantingsHook = useAllotmentPlantings({
    data,
    setData,
    selectedYear,
    setSelectedYear: baseSelectYear,
  })
  const {
    addPlanting,
    addPlantings,
    updatePlanting,
    removePlanting,
    getPlantings,
    getAreaSeason,
    updateRotationGroup,
    updateAreaSeasonPosition,
    createSeason,
    deleteSeason,
    updateSeasonNotes,
    getRotationBeds,
    getPerennialBeds,
    getRotationHistory,
    getRecentRotation,
  } = plantingsHook

  // Phase 4: Maintenance, Notes, CareLogs (parallel)
  const maintenanceHook = useAllotmentMaintenance({ data, setData })
  const {
    getMaintenanceTasks,
    getTasksForMonth,
    getTasksForArea,
    addMaintenanceTask,
    updateMaintenanceTask,
    completeMaintenanceTask,
    removeMaintenanceTask,
  } = maintenanceHook

  const notesHook = useAllotmentNotes({ data, setData, selectedYear })
  const {
    getAreaNotes,
    addAreaNote,
    updateAreaNote,
    removeAreaNote,
    getGardenEvents,
    addGardenEvent,
    removeGardenEvent,
  } = notesHook

  const careLogsHook = useAllotmentCareLogs({ data, setData, selectedYear })
  const {
    addCareLog,
    updateCareLog,
    removeCareLog,
    getCareLogs,
    getAllCareLogs,
    logHarvest,
    getHarvestTotal,
  } = careLogsHook

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
    getPermanentPlanting,
    getInfrastructureItem,

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
    getAreaSeason,
    updateRotationGroup,
    updateAreaSeasonPosition,

    // Season operations
    createSeason,
    deleteSeason,
    updateSeasonNotes,

    // Layout helpers
    getRotationBeds,
    getPerennialBeds,

    // Rotation history
    getRotationHistory,
    getRecentRotation,

    // Maintenance tasks
    getMaintenanceTasks,
    getTasksForMonth,
    getTasksForArea,
    addMaintenanceTask,
    updateMaintenanceTask,
    completeMaintenanceTask,
    removeMaintenanceTask,

    // Area notes (v10)
    getAreaNotes,
    addAreaNote,
    updateAreaNote,
    removeAreaNote,

    // Garden events
    getGardenEvents,
    addGardenEvent,
    removeGardenEvent,

    // Variety operations
    getVarieties,
    getVarietiesForYear,
    addVariety,
    updateVariety,
    removeVariety,
    archiveVariety,
    unarchiveVariety,
    getActiveVarieties,
    toggleHaveSeedsForYear,
    hasSeedsForYear,
    removeVarietyFromYear,
    addVarietyToYear,
    getSuppliers,
    getTotalSpendForYear,
    getAvailableVarietyYears,
    getSeedsStatsForYear,

    // v10 unified area operations
    getArea,
    getAreasByKind,
    getAllAreas,
    addArea,
    updateArea,
    removeArea,
    archiveArea,
    restoreArea,

    // v10 care log operations
    addCareLog,
    updateCareLog,
    removeCareLog,
    getCareLogs,
    getAllCareLogs,
    logHarvest,
    getHarvestTotal,

    // Data operations
    reload,
    flushSave,
    clearSaveError,

    // Metadata operations
    updateMeta,
  }
}
