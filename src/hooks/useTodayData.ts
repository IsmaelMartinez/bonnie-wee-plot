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

import { useMemo, useState, useCallback, useEffect } from 'react'
import { useAllotment } from '@/hooks/useAllotment'
import { getSeasonalPhase, SeasonalPhase } from '@/lib/seasons'
import { generateTasksForMonth, GeneratedTask, CareLogDaysMap } from '@/lib/task-generator'
import { CustomTask, NewCustomTask, MaintenanceTask, Planting, AreaSeason, CareLogType } from '@/types/unified-allotment'
import { Month } from '@/types/garden-planner'
import { loadDismissedTaskIds, dismissTask, restoreTask } from '@/lib/dismissed-tasks'
import { getDaysSinceLastCareLog } from '@/services/allotment-storage'
import { fetchRainfall, RainfallSummary } from '@/lib/weather/open-meteo'
import { fetchFrostDates } from '@/lib/weather/frost-dates'

export interface TodayData {
  currentMonth: number
  currentYear: number
  seasonalPhase: SeasonalPhase
  customTasks: CustomTask[]
  maintenanceTasks: MaintenanceTask[]
  generatedTasks: GeneratedTask[]
  dismissedTasks: GeneratedTask[]
  rainfall: RainfallSummary | null
  hasCoordinates: boolean
  isLoading: boolean
  onAddCustomTask: (task: NewCustomTask) => void
  onToggleCustomTask: (taskId: string) => void
  onUpdateCustomTask: (taskId: string, description: string) => void
  onRemoveCustomTask: (taskId: string) => void
  onDismissTask: (taskId: string) => void
  onCompleteTask: (task: GeneratedTask) => void
  onRestoreTask: (taskId: string) => void
  onRequestLocation: () => void
  // Onboarding support - exposed to avoid duplicate useAllotment() calls
  showOnboarding: boolean
  completeOnboarding: () => void
}

const GEOLOCATION_DENIED_KEY = 'bwp-geolocation-denied'

/** Local-time YYYY-MM-DD for the current day. */
function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA')
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
    getCustomTasks,
    addCustomTask,
    toggleCustomTask,
    updateCustomTask,
    removeCustomTask,
    getTasksForMonth,
    getAllAreas,
    updateMeta,
    addCareLog,
  } = useAllotment()

  // Current month (1-12 for January-December, matching vegetable database)
  const currentMonth = useMemo(() => new Date().getMonth() + 1, [])
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  // Seasonal phase uses 0-indexed month
  const seasonalPhase = useMemo(() => getSeasonalPhase(currentMonth - 1), [currentMonth])

  // Custom tasks (free-form, persistent)
  const customTasks = useMemo(() => getCustomTasks(), [getCustomTasks])

  const onAddCustomTask = useCallback((task: NewCustomTask) => {
    addCustomTask(task)
  }, [addCustomTask])

  const onToggleCustomTask = useCallback((taskId: string) => {
    toggleCustomTask(taskId)
  }, [toggleCustomTask])

  const onUpdateCustomTask = useCallback((taskId: string, description: string) => {
    updateCustomTask(taskId, description)
  }, [updateCustomTask])

  const onRemoveCustomTask = useCallback((taskId: string) => {
    removeCustomTask(taskId)
  }, [removeCustomTask])

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
    setDismissedIds(dismissTask(taskId, currentMonth, currentYear))
  }, [currentMonth, currentYear])

  const onRestoreTask = useCallback((taskId: string) => {
    setDismissedIds(restoreTask(taskId, currentMonth, currentYear))
  }, [currentMonth, currentYear])

  // Build a map of days-since-last-feed/water per area, used by the task
  // generator to suppress reminders when the area was tended recently.
  const careLogDays = useMemo<CareLogDaysMap>(() => {
    if (!data) return {}
    const map: CareLogDaysMap = {}
    for (const area of allAreas) {
      const feed = getDaysSinceLastCareLog(data, area.id, 'feed')
      const water = getDaysSinceLastCareLog(data, area.id, 'water')
      if (feed !== null || water !== null) {
        map[area.id] = {
          feed: feed ?? undefined,
          water: water ?? undefined,
        }
      }
    }
    return map
  }, [data, allAreas])

  // Fetch rainfall data when coordinates are available. The weather service
  // caches in localStorage so this re-runs cheaply across renders.
  const [rainfall, setRainfall] = useState<RainfallSummary | null>(null)
  const coords = data?.meta?.coordinates
  useEffect(() => {
    if (!coords) {
      setRainfall(null)
      return
    }
    let cancelled = false
    fetchRainfall(coords.latitude, coords.longitude).then((result) => {
      if (!cancelled) setRainfall(result)
    })
    return () => {
      cancelled = true
    }
  }, [coords])

  // Populate average frost dates the first time we see coordinates. The
  // result is cached in-memory + localStorage by frost-dates.ts and persisted
  // on meta.frostDates so the rest of the app (validateSowDate, etc.) can
  // read it without refetching.
  const haveFrostDates = !!data?.meta?.frostDates
  useEffect(() => {
    if (!coords) return
    if (haveFrostDates) return
    let cancelled = false
    fetchFrostDates(coords.latitude, coords.longitude).then((result) => {
      if (cancelled || !result) return
      updateMeta({ frostDates: result })
    })
    return () => {
      cancelled = true
    }
  }, [coords, haveFrostDates, updateMeta])

  // Generate automatic tasks based on plantings, varieties, and month
  const allGeneratedTasks = useMemo(() => {
    if (!data) return []
    return generateTasksForMonth(
      currentMonth as Month,
      plantingsWithContext,
      allAreas,
      new Date(),
      data.varieties || [],
      currentYear,
      careLogDays,
      rainfall
    )
  }, [currentMonth, plantingsWithContext, allAreas, data, currentYear, careLogDays, rainfall])

  // Split into active and dismissed
  const generatedTasks = useMemo(() =>
    allGeneratedTasks.filter((t: GeneratedTask) => !dismissedIds.has(t.id)),
    [allGeneratedTasks, dismissedIds]
  )

  const dismissedTasks = useMemo(() =>
    allGeneratedTasks.filter((t: GeneratedTask) => dismissedIds.has(t.id)),
    [allGeneratedTasks, dismissedIds]
  )

  // Tapping ✓ on a feed/water task is the user telling us they did it.
  // Record a minimal care log entry (type + today) so the cadence engine
  // can suppress reminders, and dismiss the task. Other generated tasks
  // (harvest, sow, etc.) just dismiss.
  const onCompleteTask = useCallback((task: GeneratedTask) => {
    if ((task.generatedType === 'feed' || task.generatedType === 'water') && task.areaId) {
      const careType: CareLogType = task.generatedType === 'water' ? 'water' : 'feed'
      addCareLog(task.areaId, { type: careType, date: todayLocal() })
    }
    setDismissedIds(dismissTask(task.id, currentMonth, currentYear))
  }, [addCareLog, currentMonth, currentYear])

  const onRequestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          localStorage.removeItem(GEOLOCATION_DENIED_KEY)
        } catch {
          // ignore storage errors
        }
        updateMeta({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        })
      },
      () => {
        try {
          localStorage.setItem(GEOLOCATION_DENIED_KEY, 'true')
        } catch {
          // ignore storage errors
        }
      },
      { timeout: 10000, maximumAge: 24 * 60 * 60 * 1000 }
    )
  }, [updateMeta])

  // Onboarding: show wizard only on first visit.
  // Uses a separate localStorage key to avoid race conditions with debounced saves.
  const [setupDone, setSetupDone] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('bonnie-wee-plot-setup-completed') === 'true'
  })
  const showOnboarding = !isLoading && !!data && !setupDone && !data.meta?.setupCompleted

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('bonnie-wee-plot-setup-completed', 'true')
    setSetupDone(true)
    // Also update allotment meta for backward compatibility
    updateMeta({ setupCompleted: true })
  }, [updateMeta])

  return {
    currentMonth,
    currentYear,
    seasonalPhase,
    customTasks,
    maintenanceTasks,
    generatedTasks,
    dismissedTasks,
    rainfall,
    hasCoordinates: !!coords,
    isLoading,
    onAddCustomTask,
    onToggleCustomTask,
    onUpdateCustomTask,
    onRemoveCustomTask,
    onDismissTask,
    onCompleteTask,
    onRestoreTask,
    onRequestLocation,
    showOnboarding,
    completeOnboarding,
  }
}
