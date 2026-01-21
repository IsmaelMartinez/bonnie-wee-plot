/**
 * useTodayData Hook
 *
 * Aggregates data from multiple sources for the Today Dashboard.
 * Provides current month context, seasonal phase, maintenance tasks,
 * problem beds, and plantings ready for harvest or needing attention.
 */

'use client'

import { useMemo } from 'react'
import { useAllotment } from '@/hooks/useAllotment'
import { getSeasonalPhase, SeasonalPhase } from '@/lib/seasons'
import { getVegetableById } from '@/lib/vegetable-database'
import { MaintenanceTask, Planting, AreaSeason } from '@/types/unified-allotment'

export interface TodayData {
  currentMonth: number
  seasonalPhase: SeasonalPhase
  maintenanceTasks: MaintenanceTask[]
  harvestReady: Planting[]
  needsAttention: Planting[]
  isLoading: boolean
}

/**
 * Hook that aggregates data for the Today Dashboard
 *
 * Uses useMemo for all derived computations to prevent unnecessary re-renders.
 * Depends on useAllotment() for the underlying data.
 */
export function useTodayData(): TodayData {
  const {
    data,
    currentSeason,
    isLoading,
    getTasksForMonth,
  } = useAllotment()

  // Current month (1-12 for January-December, matching vegetable database)
  const currentMonth = useMemo(() => new Date().getMonth() + 1, [])

  // Seasonal phase uses 0-indexed month
  const seasonalPhase = useMemo(() => getSeasonalPhase(currentMonth - 1), [currentMonth])

  // Maintenance tasks for current month
  const maintenanceTasks = useMemo(() => {
    return getTasksForMonth(currentMonth)
  }, [getTasksForMonth, currentMonth])

  // Collect all plantings from current season with vegetable data
  const allPlantingsWithVegetable = useMemo(() => {
    if (!currentSeason || !data) return []

    const result: Array<{ planting: Planting; harvestMonths: number[]; sowMonths: number[] }> = []

    for (const area of currentSeason.areas) {
      for (const planting of (area as AreaSeason).plantings) {
        const vegetable = getVegetableById(planting.plantId)
        if (vegetable) {
          const harvestMonths = vegetable.planting?.harvestMonths || []
          const sowIndoors = vegetable.planting?.sowIndoorsMonths || []
          const sowOutdoors = vegetable.planting?.sowOutdoorsMonths || []
          const transplant = vegetable.planting?.transplantMonths || []
          const sowMonths = [...sowIndoors, ...sowOutdoors, ...transplant]

          result.push({
            planting,
            harvestMonths,
            sowMonths,
          })
        }
      }
    }

    return result
  }, [currentSeason, data])

  // Plantings ready for harvest (current month is in harvestMonths AND planting has been sown)
  const harvestReady = useMemo(() => {
    return allPlantingsWithVegetable
      .filter(({ planting, harvestMonths }) => {
        // Only show harvest-ready if the plant was actually planted
        const wasPlanted = planting.sowDate || planting.transplantDate
        return wasPlanted && harvestMonths.includes(currentMonth)
      })
      .map(({ planting }) => planting)
  }, [allPlantingsWithVegetable, currentMonth])

  // Plantings needing attention (current month is in sowMonths or transplantMonths)
  const needsAttention = useMemo(() => {
    return allPlantingsWithVegetable
      .filter(({ sowMonths }) => sowMonths.includes(currentMonth))
      .map(({ planting }) => planting)
  }, [allPlantingsWithVegetable, currentMonth])

  return {
    currentMonth,
    seasonalPhase,
    maintenanceTasks,
    harvestReady,
    needsAttention,
    isLoading,
  }
}
