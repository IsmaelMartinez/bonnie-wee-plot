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
 * - Seed varieties the user has but hasn't planted yet
 */

'use client'

import { useMemo, useState, useCallback } from 'react'
import { useAllotment } from '@/hooks/useAllotment'
import { getSeasonalPhase, SeasonalPhase } from '@/lib/seasons'
import { generateTasksForMonth, GeneratedTask } from '@/lib/task-generator'
import { MaintenanceTask, Planting, AreaSeason } from '@/types/unified-allotment'
import { Month } from '@/types/garden-planner'
import { loadDismissedTaskIds, dismissTask, restoreTask } from '@/lib/dismissed-tasks'

export interface TodayData {
  currentMonth: number
  currentYear: number
  seasonalPhase: SeasonalPhase
  maintenanceTasks: MaintenanceTask[]
  generatedTasks: GeneratedTask[]
  dismissedTasks: GeneratedTask[]
  isLoading: boolean
  onDismissTask: (taskId: string) => void
  onRestoreTask: (taskId: string) => void
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
  const currentYear = useMemo(() => new Date().getFullYear(), [])

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

  // Dismissed task IDs — stored in state so React re-renders on change
  const [dismissedIds, setDismissedIds] = useState(
    () => loadDismissedTaskIds(currentMonth, currentYear)
  )

  const onDismissTask = useCallback((taskId: string) => {
    dismissTask(taskId, currentMonth, currentYear)
    setDismissedIds(loadDismissedTaskIds(currentMonth, currentYear))
  }, [currentMonth, currentYear])

  const onRestoreTask = useCallback((taskId: string) => {
    restoreTask(taskId, currentMonth, currentYear)
    setDismissedIds(loadDismissedTaskIds(currentMonth, currentYear))
  }, [currentMonth, currentYear])

  // Generate automatic tasks based on plantings, varieties, and month
  const allGeneratedTasks = useMemo(() => {
    if (!data) return []
    return generateTasksForMonth(
      currentMonth as Month,
      plantingsWithContext,
      allAreas,
      new Date(),
      data.varieties || [],
      currentYear
    )
  }, [currentMonth, plantingsWithContext, allAreas, data, currentYear])

  // Split into active and dismissed
  const generatedTasks = useMemo(() =>
    allGeneratedTasks.filter((t: GeneratedTask) => !dismissedIds.has(t.id)),
    [allGeneratedTasks, dismissedIds]
  )

  const dismissedTasks = useMemo(() =>
    allGeneratedTasks.filter((t: GeneratedTask) => dismissedIds.has(t.id)),
    [allGeneratedTasks, dismissedIds]
  )

  return {
    currentMonth,
    currentYear,
    seasonalPhase,
    maintenanceTasks,
    generatedTasks,
    dismissedTasks,
    isLoading,
    onDismissTask,
    onRestoreTask,
  }
}
