/**
 * useAllotmentPlantings Hook
 *
 * Planting CRUD with variety auto-sync.
 * Handles plantings, area seasons, season operations, and rotation tracking.
 *
 * Writes go through `mutate(fn)` against the SyncedStore proxy (ADR 027;
 * the legacy `setData` branch was removed in Step 5). `addPlanting` and
 * `addPlantings` are cross-collection — they touch
 * `store.seasons[...].areas[...].plantings` AND `store.varieties` in
 * one Yjs transaction.
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
  SeasonRecord,
  StoredVariety,
} from '@/types/unified-allotment'
import { PhysicalBedId, RotationGroup } from '@/types/garden-planner'
import {
  getAreaSeason as storageGetAreaSeason,
  getPlantingsForArea as storageGetPlantingsForArea,
  getRotationBeds as storageGetRotationBeds,
  getAreasByKind as storageGetAreasByKind,
  getRotationHistory as storageGetRotationHistory,
  getRecentRotation as storageGetRecentRotation,
} from '@/services/allotment-storage'
import { generateId } from '@/lib/utils/id'
import { normalizeVarietyName } from '@/lib/variety-queries'
import { inferStatusFromDates } from '@/lib/planting-utils'
import { getNextRotationGroup } from '@/lib/rotation'
import type { MutateFn } from './useAllotmentData'
import { assignDefined, withoutUndefined } from '@/lib/yjs/allotment-yjs'

// ============ HOOK TYPES ============

export interface UseAllotmentPlantingsProps {
  data: AllotmentData | null
  mutate: MutateFn
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
  mutate,
  selectedYear,
  setSelectedYear,
}: UseAllotmentPlantingsProps): UseAllotmentPlantingsReturn {

  // ============ PLANTING CRUD ============

  const addPlanting = useCallback((bedId: PhysicalBedId, planting: NewPlanting) => {
    if (!data) return

    // Cross-collection: writes plantings AND varieties in one
    // transaction so a single Yjs update emits and both observers see
    // a consistent state.
    const plantingId = generateId('planting')
    mutate(store => {
      const season = store.seasons.find(s => s.year === selectedYear)
      if (!season) return
      const now = new Date().toISOString()

      // Ensure AreaSeason exists.
      let areaSeason = season.areas.find(a => a.areaId === bedId)
      if (!areaSeason) {
        const fresh: AreaSeason = withoutUndefined({
          areaId: bedId,
          plantings: [],
        })
        season.areas.push(fresh)
        areaSeason = season.areas[season.areas.length - 1]
      }

      const newPlanting: Planting = withoutUndefined({
        ...planting,
        id: plantingId,
      })
      areaSeason.plantings.push(newPlanting)
      season.updatedAt = now

      // Variety auto-sync: if the planting has a variety name, find
      // or create the matching StoredVariety so the seed inventory
      // stays in step with what's actually planted.
      if (planting.varietyName) {
        const normalizedName = normalizeVarietyName(planting.varietyName)
        const existing = store.varieties.find(v =>
          v.plantId === planting.plantId &&
          normalizeVarietyName(v.name) === normalizedName,
        )

        if (!existing) {
          const newVariety: StoredVariety = withoutUndefined({
            id: generateId('variety'),
            plantId: planting.plantId,
            name: planting.varietyName,
            notes: '(Auto-created from planting)',
            seedsByYear: { [selectedYear]: 'none' as const },
            isArchived: false,
          })
          store.varieties.push(newVariety)
        } else if (!(selectedYear in (existing.seedsByYear || {}))) {
          existing.seedsByYear = { ...existing.seedsByYear, [selectedYear]: 'none' }
        }
      }
    })
  }, [data, selectedYear, mutate])

  const addPlantings = useCallback((bedId: PhysicalBedId, plantings: NewPlanting[]) => {
    if (!data || plantings.length === 0) return

    // Cross-collection: same shape as addPlanting but bulk. Generate
    // all IDs up front so the parity test stays deterministic under a
    // mocked `generateId`.
    const plantingIds = plantings.map(() => generateId('planting'))
    mutate(store => {
      const season = store.seasons.find(s => s.year === selectedYear)
      if (!season) return
      const now = new Date().toISOString()

      let areaSeason = season.areas.find(a => a.areaId === bedId)
      if (!areaSeason) {
        const fresh: AreaSeason = withoutUndefined({
          areaId: bedId,
          plantings: [],
        })
        season.areas.push(fresh)
        areaSeason = season.areas[season.areas.length - 1]
      }

      plantings.forEach((planting, i) => {
        const newPlanting: Planting = withoutUndefined({
          ...planting,
          id: plantingIds[i],
        })
        areaSeason!.plantings.push(newPlanting)

        if (planting.varietyName) {
          const normalizedName = normalizeVarietyName(planting.varietyName)
          const existing = store.varieties.find(v =>
            v.plantId === planting.plantId &&
            normalizeVarietyName(v.name) === normalizedName,
          )

          if (!existing) {
            const newVariety: StoredVariety = withoutUndefined({
              id: generateId('variety'),
              plantId: planting.plantId,
              name: planting.varietyName,
              notes: '(Auto-created from planting)',
              seedsByYear: { [selectedYear]: 'none' as const },
              isArchived: false,
            })
            store.varieties.push(newVariety)
          } else if (!(selectedYear in (existing.seedsByYear || {}))) {
            existing.seedsByYear = { ...existing.seedsByYear, [selectedYear]: 'none' }
          }
        }
      })

      season.updatedAt = now
    })
  }, [data, selectedYear, mutate])

  const updatePlanting = useCallback((bedId: PhysicalBedId, plantingId: string, updates: PlantingUpdate) => {
    if (!data) return

    mutate(store => {
      const season = store.seasons.find(s => s.year === selectedYear)
      if (!season) return
      const areaSeason = season.areas.find(a => a.areaId === bedId)
      if (!areaSeason) return
      const p = areaSeason.plantings.find(x => x.id === plantingId)
      if (!p) return

      const datesChanged =
        'sowDate' in updates || 'transplantDate' in updates || 'actualHarvestEnd' in updates
      const statusExplicitlySet = 'status' in updates

      assignDefined(p as unknown as Record<string, unknown>, updates as Record<string, unknown>)
      if (datesChanged && !statusExplicitlySet && p.status !== 'removed') {
        p.status = inferStatusFromDates(p)
      }
      season.updatedAt = new Date().toISOString()
    })
  }, [data, selectedYear, mutate])

  const removePlanting = useCallback((bedId: PhysicalBedId, plantingId: string) => {
    if (!data) return

    mutate(store => {
      const season = store.seasons.find(s => s.year === selectedYear)
      if (!season) return
      const areaSeason = season.areas.find(a => a.areaId === bedId)
      if (!areaSeason) return
      const idx = areaSeason.plantings.findIndex(p => p.id === plantingId)
      if (idx === -1) return
      areaSeason.plantings.splice(idx, 1)
      season.updatedAt = new Date().toISOString()
    })
  }, [data, selectedYear, mutate])

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

    mutate(store => {
      const season = store.seasons.find(s => s.year === selectedYear)
      if (!season) return
      const existing = season.areas.find(a => a.areaId === areaId)
      if (existing) {
        existing.rotationGroup = group
      } else {
        const fresh: AreaSeason = withoutUndefined({
          areaId,
          rotationGroup: group,
          plantings: [],
        })
        season.areas.push(fresh)
      }
      season.updatedAt = new Date().toISOString()
    })
  }, [data, selectedYear, mutate])

  const updateAreaSeasonPositionFn = useCallback((areaId: string, position: GridPosition) => {
    mutate(store => {
      const season = store.seasons.find(s => s.year === selectedYear)
      if (!season) return
      const existing = season.areas.find(a => a.areaId === areaId)
      if (existing) {
        existing.gridPosition = position
      } else {
        const fresh: AreaSeason = withoutUndefined({
          areaId,
          plantings: [],
          gridPosition: position,
        })
        season.areas.push(fresh)
      }
      season.updatedAt = new Date().toISOString()
    })
  }, [selectedYear, mutate])

  // ============ SEASON OPERATIONS ============

  const createSeason = useCallback((year: number, notes?: string) => {
    if (!data) return

    mutate(store => {
      const now = new Date().toISOString()
      const previousYear = year - 1
      const previousSeason = store.seasons.find(s => s.year === previousYear)

      // Mirror the legacy area-season creation: one AreaSeason per
      // non-archived area, rotating the rotation group for
      // rotation-beds and copying grid positions where available.
      const areaSeasons: AreaSeason[] = []
      for (const area of store.areas) {
        if (area.isArchived) continue
        const previousAreaSeason = previousSeason?.areas.find(a => a.areaId === area.id)
        let rotationGroup: RotationGroup | undefined
        if (area.kind === 'rotation-bed') {
          rotationGroup = previousAreaSeason?.rotationGroup
            ? getNextRotationGroup(previousAreaSeason.rotationGroup)
            : area.rotationGroup || 'legumes'
        }
        const gridPosition = previousAreaSeason?.gridPosition ?? area.gridPosition
        areaSeasons.push(withoutUndefined({
          areaId: area.id,
          rotationGroup,
          plantings: [],
          gridPosition,
        }))
      }

      const newSeason: SeasonRecord = withoutUndefined({
        year,
        status: 'planned',
        areas: areaSeasons,
        notes,
        createdAt: now,
        updatedAt: now,
      })
      store.seasons.push(newSeason)
      store.state.currentYear = year
    })
    setSelectedYear?.(year)
  }, [data, setSelectedYear, mutate])

  const deleteSeasonData = useCallback((year: number) => {
    if (!data) return
    // Don't allow deleting the last season
    if (data.seasons.length <= 1) return

    // Capture new currentYear synchronously so we can update the
    // selected year after the transaction returns.
    const yearNum = Number(year)
    let newCurrentYear = data.currentYear
    mutate(store => {
      const idx = store.seasons.findIndex(s => Number(s.year) === yearNum)
      if (idx === -1) return
      store.seasons.splice(idx, 1)

      if (Number(store.state.currentYear) === yearNum) {
        const years = store.seasons.map(s => Number(s.year)).sort((a, b) => b - a)
        store.state.currentYear = years[0]
        newCurrentYear = years[0]
      }
    })
    setSelectedYear?.(newCurrentYear)
  }, [data, setSelectedYear, mutate])

  const updateSeasonNotes = useCallback((notes: string) => {
    if (!data) return

    mutate(store => {
      const season = store.seasons.find(s => s.year === selectedYear)
      if (!season) return
      season.notes = notes
      season.updatedAt = new Date().toISOString()
    })
  }, [data, selectedYear, mutate])

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
