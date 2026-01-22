/**
 * useTodayData Hook
 *
 * Aggregates data from multiple sources for the Today Dashboard.
 * Provides current month context, seasonal phase, maintenance tasks,
 * problem beds, and plantings ready for harvest or needing attention.
 *
 * Now includes auto-generated tasks based on:
 * - Current month and plantings in the allotment
 * - Vegetable database planting/harvesting schedules
 * - Maintenance info for perennial areas (trees, berries)
 */

'use client'

import { useMemo } from 'react'
import { useAllotment } from '@/hooks/useAllotment'
import { getSeasonalPhase, SeasonalPhase } from '@/lib/seasons'
import { getVegetableById } from '@/lib/vegetable-database'
import { generateTasksForMonth, GeneratedTask } from '@/lib/task-generator'
import { MaintenanceTask, Planting, AreaSeason } from '@/types/unified-allotment'
import { Month } from '@/types/garden-planner'

export interface TodayData {
  currentMonth: number
  seasonalPhase: SeasonalPhase
  maintenanceTasks: MaintenanceTask[]
  generatedTasks: GeneratedTask[]
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
    getAllAreas,
  } = useAllotment()

  // Current month (1-12 for January-December, matching vegetable database)
  const currentMonth = useMemo(() => new Date().getMonth() + 1, [])

  // Seasonal phase uses 0-indexed month
  const seasonalPhase = useMemo(() => getSeasonalPhase(currentMonth - 1), [currentMonth])

  // Manual maintenance tasks for current month (user-created)
  const maintenanceTasks = useMemo(() => {
    return getTasksForMonth(currentMonth)
  }, [getTasksForMonth, currentMonth])

  // Get all areas for perennial maintenance tasks
  const allAreas = useMemo(() => getAllAreas(), [getAllAreas])

  // Collect all plantings from current season with area context
  const plantingsWithContext = useMemo(() => {
    if (!currentSeason || !data) return []

    const result: Array<{ planting: Planting; areaId: string; areaName: string }> = []

    for (const areaSeason of currentSeason.areas) {
      const area = allAreas.find(a => a.id === areaSeason.areaId)
      const areaName = area?.name || areaSeason.areaId

      for (const planting of (areaSeason as AreaSeason).plantings) {
        result.push({
          planting,
          areaId: areaSeason.areaId,
          areaName,
        })
      }
    }

    return result
  }, [currentSeason, data, allAreas])

  // Generate automatic tasks based on plantings and month
  const generatedTasks = useMemo(() => {
    if (!data) return []
    return generateTasksForMonth(
      currentMonth as Month,
      plantingsWithContext,
      allAreas
    )
  }, [currentMonth, plantingsWithContext, allAreas, data])

  // Collect all plantings from current season with vegetable data (for legacy harvestReady/needsAttention)
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

  // Plantings ready for harvest (current month is in harvestMonths)
  const harvestReady = useMemo(() => {
    return allPlantingsWithVegetable
      .filter(({ harvestMonths }) => harvestMonths.includes(currentMonth))
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
    generatedTasks,
    harvestReady,
    needsAttention,
    isLoading,
  }
}
