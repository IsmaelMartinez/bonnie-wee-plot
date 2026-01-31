/**
 * useAllotmentPlantings Hook
 *
 * Planting CRUD with variety auto-sync.
 * Handles plantings, area seasons, season operations, and rotation tracking.
 */

'use client'

import { useCallback } from 'react'
import {
  AllotmentData,
  AreaSeason,
  Planting,
  NewPlanting,
  PlantingUpdate,
  Area,
  GridPosition,
} from '@/types/unified-allotment'
import { PhysicalBedId, RotationGroup } from '@/types/garden-planner'
import {
  getAreaSeason as storageGetAreaSeason,
  addPlanting as storageAddPlanting,
  addPlantings as storageAddPlantings,
  updatePlanting as storageUpdatePlanting,
  removePlanting as storageRemovePlanting,
  addSeason,
  removeSeason,
  updateSeason,
  updateAreaRotationGroup as storageUpdateAreaRotationGroup,
  updateAreaSeasonPosition as storageUpdateAreaSeasonPosition,
  getPlantingsForArea as storageGetPlantingsForArea,
  getRotationBeds as storageGetRotationBeds,
  getAreasByKind as storageGetAreasByKind,
  getRotationHistory as storageGetRotationHistory,
  getRecentRotation as storageGetRecentRotation,
} from '@/services/allotment-storage'
import { generateId } from '@/lib/utils/id'
import { normalizeVarietyName } from '@/lib/variety-queries'
import { trackEvent } from '@/lib/analytics'

// ============ HOOK TYPES ============

export interface UseAllotmentPlantingsProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
  selectedYear: number
  setSelectedYear?: (year: number) => void
}

export interface UseAllotmentPlantingsReturn {
  // Planting CRUD
  addPlanting: (areaId: string, planting: NewPlanting) => void
  addPlantings: (areaId: string, plantings: NewPlanting[]) => void
  updatePlanting: (areaId: string, plantingId: string, updates: PlantingUpdate) => void
  removePlanting: (areaId: string, plantingId: string) => void
  getPlantings: (areaId: string) => Planting[]

  // Area season operations
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
}

// ============ HOOK IMPLEMENTATION ============

export function useAllotmentPlantings({
  data,
  setData,
  selectedYear,
  setSelectedYear,
}: UseAllotmentPlantingsProps): UseAllotmentPlantingsReturn {

  // ============ PLANTING CRUD ============

  const addPlanting = useCallback((bedId: PhysicalBedId, planting: NewPlanting) => {
    if (!data) return

    // Track planting addition
    trackEvent('planting', 'added', planting.plantId)

    // Add planting to allotment storage
    let updatedData = storageAddPlanting(data, selectedYear, bedId, planting)

    // Inline variety sync (no separate storage)
    if (planting.varietyName) {
      const normalizedName = normalizeVarietyName(planting.varietyName)

      const variety = updatedData.varieties.find(v =>
        v.plantId === planting.plantId &&
        normalizeVarietyName(v.name) === normalizedName
      )

      if (!variety) {
        // Auto-create variety with seed status for this year
        updatedData = {
          ...updatedData,
          varieties: [
            ...updatedData.varieties,
            {
              id: generateId('variety'),
              plantId: planting.plantId,
              name: planting.varietyName,
              notes: '(Auto-created from planting)',
              seedsByYear: { [selectedYear]: 'none' },
              isArchived: false
            }
          ]
        }
      } else if (!(selectedYear in (variety.seedsByYear || {}))) {
        // Add year to existing variety's seedsByYear if not already tracked
        updatedData = {
          ...updatedData,
          varieties: updatedData.varieties.map(v =>
            v.id === variety.id
              ? { ...v, seedsByYear: { ...v.seedsByYear, [selectedYear]: 'none' } }
              : v
          )
        }
      }
    }

    setData(updatedData)
  }, [data, selectedYear, setData])

  const addPlantings = useCallback((bedId: PhysicalBedId, plantings: NewPlanting[]) => {
    if (!data || plantings.length === 0) return

    // Add all plantings in a single state update
    let updatedData = storageAddPlantings(data, selectedYear, bedId, plantings)

    // Sync each planting's variety (inline, no separate storage)
    plantings.forEach(planting => {
      if (planting.varietyName) {
        const normalizedName = normalizeVarietyName(planting.varietyName)

        const variety = updatedData.varieties.find(v =>
          v.plantId === planting.plantId &&
          normalizeVarietyName(v.name) === normalizedName
        )

        if (!variety) {
          // Auto-create variety with seed status for this year
          updatedData = {
            ...updatedData,
            varieties: [
              ...updatedData.varieties,
              {
                id: generateId('variety'),
                plantId: planting.plantId,
                name: planting.varietyName,
                notes: '(Auto-created from planting)',
                seedsByYear: { [selectedYear]: 'none' },
                isArchived: false
              }
            ]
          }
        } else if (!(selectedYear in (variety.seedsByYear || {}))) {
          // Add year to existing variety's seedsByYear if not already tracked
          updatedData = {
            ...updatedData,
            varieties: updatedData.varieties.map(v =>
              v.id === variety.id
                ? { ...v, seedsByYear: { ...v.seedsByYear, [selectedYear]: 'none' } }
                : v
            )
          }
        }
      }
    })

    setData(updatedData)
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

  // ============ AREA SEASON OPERATIONS ============

  const getAreaSeasonData = useCallback((areaId: string) => {
    if (!data) return undefined
    return storageGetAreaSeason(data, selectedYear, areaId)
  }, [data, selectedYear])

  const updateRotationGroup = useCallback((areaId: string, group: RotationGroup) => {
    if (!data) return
    setData(storageUpdateAreaRotationGroup(data, selectedYear, areaId, group))
  }, [data, selectedYear, setData])

  const updateAreaSeasonPositionFn = useCallback((areaId: string, position: GridPosition) => {
    setData(prevData => {
      if (!prevData) return prevData
      return storageUpdateAreaSeasonPosition(prevData, selectedYear, areaId, position)
    })
  }, [selectedYear, setData])

  // ============ SEASON OPERATIONS ============

  const createSeason = useCallback((year: number, notes?: string) => {
    if (!data) return
    setData(addSeason(data, { year, status: 'planned', notes }))
    setSelectedYear?.(year)
  }, [data, setData, setSelectedYear])

  const deleteSeasonData = useCallback((year: number) => {
    if (!data) return
    // Don't allow deleting the last season
    if (data.seasons.length <= 1) return
    const newData = removeSeason(data, year)
    setData(newData)
    setSelectedYear?.(newData.currentYear)
  }, [data, setData, setSelectedYear])

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

  return {
    // Planting CRUD
    addPlanting,
    addPlantings,
    updatePlanting,
    removePlanting,
    getPlantings,

    // Area season operations
    getAreaSeason: getAreaSeasonData,
    updateRotationGroup,
    updateAreaSeasonPosition: updateAreaSeasonPositionFn,

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
  }
}
