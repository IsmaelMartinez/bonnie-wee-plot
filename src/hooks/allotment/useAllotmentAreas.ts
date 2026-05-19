/**
 * useAllotmentAreas Hook
 *
 * Area CRUD operations and item selection.
 * Handles unified area management for beds, trees, berries, infrastructure.
 *
 * Two-branch methods (ADR 027 Step 3, PR-B): each mutation has a
 * legacy `setData` branch (byte-identical to the pre-PR-B
 * implementation) and a Yjs `mutate` branch that performs in-place
 * mutations on the SyncedStore proxy. The branch is picked by the
 * `USE_YJS_STORAGE` flag at the top of each method. While the flag is
 * `false` the Yjs branch is dead code; the parity test exercises it
 * with the flag flipped locally to keep both implementations in lock
 * step.
 */

'use client'

import { useState, useCallback } from 'react'
import {
  AllotmentData,
  Area,
  AreaKind,
  AreaSeason,
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
import { wasAreaActiveInYear } from '@/services/area-mutations'
import { generateSlugId } from '@/lib/utils'
import { USE_YJS_STORAGE } from '@/config/release-visibility'
import type { MutateFn } from './useAllotmentData'
import { assignDefined, withoutUndefined } from './yjs-helpers'

// ============ HOOK TYPES ============

export interface UseAllotmentAreasProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
  mutate: MutateFn
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
  mutate,
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

    // The slug ID has to be computed up front on both paths so the
    // caller gets it back synchronously. The Yjs branch reuses the
    // existing IDs from the proxy snapshot via `data.layout.areas`
    // (the serialized view), which matches what the legacy
    // `storageAddArea` does internally.
    if (USE_YJS_STORAGE) {
      const now = new Date().toISOString()
      const existingIds = new Set(data.layout.areas?.map(a => a.id) || [])
      const id = generateSlugId(area.name, existingIds)
      const newArea: Area = withoutUndefined({
        ...area,
        id,
        createdAt: now,
      })

      mutate(store => {
        store.areas.push(newArea)

        // Backfill AreaSeason for years where the area should exist.
        for (const season of store.seasons) {
          if (!wasAreaActiveInYear(newArea, season.year)) continue
          const newAreaSeason: AreaSeason = withoutUndefined({
            areaId: id,
            rotationGroup:
              newArea.kind === 'rotation-bed'
                ? (newArea.rotationGroup || 'legumes')
                : undefined,
            plantings: [],
            notes: [],
          })
          season.areas.push(newAreaSeason)
          season.updatedAt = now
        }

        store.meta.updatedAt = now
      })

      return id
    }

    const result = storageAddArea(data, area)
    setData(result.data)
    return result.areaId
  }, [data, setData, mutate])

  const updateAreaData = useCallback((areaId: string, updates: Partial<Omit<Area, 'id'>>) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const area = store.areas.find(a => a.id === areaId)
        if (!area) return
        assignDefined(area as unknown as Record<string, unknown>, updates as Record<string, unknown>)
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageUpdateArea(data, areaId, updates))
  }, [data, setData, mutate])

  const removeAreaData = useCallback((areaId: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const now = new Date().toISOString()
        const areaIndex = store.areas.findIndex(a => a.id === areaId)
        if (areaIndex !== -1) {
          store.areas.splice(areaIndex, 1)
        }
        // Remove area seasons across all seasons.
        for (const season of store.seasons) {
          for (let i = season.areas.length - 1; i >= 0; i--) {
            if (season.areas[i].areaId === areaId) {
              season.areas.splice(i, 1)
            }
          }
        }
        // Remove maintenance tasks linked to the area.
        for (let i = store.maintenanceTasks.length - 1; i >= 0; i--) {
          if (store.maintenanceTasks[i].areaId === areaId) {
            store.maintenanceTasks.splice(i, 1)
          }
        }
        store.meta.updatedAt = now
      })
      return
    }

    setData(storageRemoveArea(data, areaId))
  }, [data, setData, mutate])

  const archiveAreaData = useCallback((areaId: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const area = store.areas.find(a => a.id === areaId)
        if (!area) return
        area.isArchived = true
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageArchiveArea(data, areaId))
  }, [data, setData, mutate])

  const restoreAreaData = useCallback((areaId: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const area = store.areas.find(a => a.id === areaId)
        if (!area) return
        area.isArchived = false
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageRestoreArea(data, areaId))
  }, [data, setData, mutate])

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
