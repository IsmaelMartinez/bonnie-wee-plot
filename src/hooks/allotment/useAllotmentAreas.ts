/**
 * useAllotmentAreas Hook
 *
 * Area CRUD operations and item selection.
 * Handles unified area management for beds, trees, berries, infrastructure.
 */

'use client'

import { useState, useCallback } from 'react'
import {
  AllotmentData,
  Area,
  AreaKind,
} from '@/types/unified-allotment'
import {
  PhysicalBedId,
  PhysicalBed,
  AllotmentItemRef,
  AllotmentItemType,
  PermanentPlanting,
  InfrastructureItem,
} from '@/types/garden-planner'
import {
  getBedById,
  getPermanentPlantingById,
  getInfrastructureById,
  getAreaById,
  getAreasByKind as storageGetAreasByKind,
  getAllAreas as storageGetAllAreas,
  addArea as storageAddArea,
  updateArea as storageUpdateArea,
  removeArea as storageRemoveArea,
  archiveArea as storageArchiveArea,
  restoreArea as storageRestoreArea,
} from '@/services/allotment-storage'

// ============ HOOK TYPES ============

export interface UseAllotmentAreasProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
}

export interface UseAllotmentAreasReturn {
  // Selection state
  selectedBedId: PhysicalBedId | null
  selectedItemRef: AllotmentItemRef | null

  // Selection actions
  selectItem: (ref: AllotmentItemRef | null) => void
  selectBed: (bedId: PhysicalBedId | null) => void
  getSelectedItemType: () => AllotmentItemType | null

  // Legacy getters (for backward compatibility)
  getPermanentPlanting: (id: string) => PermanentPlanting | undefined
  getInfrastructureItem: (id: string) => InfrastructureItem | undefined
  getBed: (bedId: PhysicalBedId) => PhysicalBed | undefined

  // v10 Area CRUD
  getArea: (id: string) => Area | undefined
  getAreasByKind: (kind: AreaKind) => Area[]
  getAllAreas: () => Area[]
  addArea: (area: Omit<Area, 'id'>) => string
  updateArea: (areaId: string, updates: Partial<Omit<Area, 'id'>>) => void
  removeArea: (areaId: string) => void
  archiveArea: (areaId: string) => void
  restoreArea: (areaId: string) => void
}

// ============ HOOK IMPLEMENTATION ============

export function useAllotmentAreas({
  data,
  setData,
}: UseAllotmentAreasProps): UseAllotmentAreasReturn {
  const [selectedBedId, setSelectedBedId] = useState<PhysicalBedId | null>(null)
  const [selectedItemRef, setSelectedItemRef] = useState<AllotmentItemRef | null>(null)

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

  // ============ LEGACY GETTERS ============

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

  return {
    // Selection state
    selectedBedId,
    selectedItemRef,

    // Selection actions
    selectItem,
    selectBed,
    getSelectedItemType,

    // Legacy getters
    getPermanentPlanting: getPermanentPlantingData,
    getInfrastructureItem: getInfrastructureItemData,
    getBed,

    // v10 Area CRUD
    getArea: getAreaData,
    getAreasByKind: getAreasByKindData,
    getAllAreas: getAllAreasData,
    addArea: addAreaData,
    updateArea: updateAreaData,
    removeArea: removeAreaData,
    archiveArea: archiveAreaData,
    restoreArea: restoreAreaData,
  }
}
