/**
 * useAllotmentAreas Hook
 *
 * Area CRUD operations and item selection.
 * Handles unified area management for beds, trees, berries, infrastructure.
 *
 * All writes go through `mutate(fn)`, performing in-place mutations on
 * the SyncedStore proxy (ADR 027). The legacy `setData` branch was
 * removed in Step 5.
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
} from '@/services/allotment-storage'
import { wasAreaActiveInYear } from '@/services/area-mutations'
import { generateSlugId } from '@/lib/utils'
import type { MutateFn } from './useAllotmentData'
import { assignDefined, withoutUndefined } from '@/lib/yjs/allotment-yjs'

// ============ HOOK TYPES ============

export interface UseAllotmentAreasProps {
  data: AllotmentData | null
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

    // The slug ID has to be computed up front so the caller gets it
    // back synchronously. Existing IDs come from the proxy snapshot
    // via `data.layout.areas` (the serialized view).
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
  }, [data, mutate])

  const updateAreaData = useCallback((areaId: string, updates: Partial<Omit<Area, 'id'>>) => {
    if (!data) return

    mutate(store => {
      const area = store.areas.find(a => a.id === areaId)
      if (!area) return
      assignDefined(area as unknown as Record<string, unknown>, updates as Record<string, unknown>)
      store.meta.updatedAt = new Date().toISOString()
    })
  }, [data, mutate])

  const removeAreaData = useCallback((areaId: string) => {
    if (!data) return

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
  }, [data, mutate])

  const archiveAreaData = useCallback((areaId: string) => {
    if (!data) return

    mutate(store => {
      const area = store.areas.find(a => a.id === areaId)
      if (!area) return
      area.isArchived = true
      store.meta.updatedAt = new Date().toISOString()
    })
  }, [data, mutate])

  const restoreAreaData = useCallback((areaId: string) => {
    if (!data) return

    mutate(store => {
      const area = store.areas.find(a => a.id === areaId)
      if (!area) return
      area.isArchived = false
      store.meta.updatedAt = new Date().toISOString()
    })
  }, [data, mutate])

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
