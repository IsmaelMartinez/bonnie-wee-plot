/**
 * useAllotmentMaintenance Hook
 *
 * Task scheduling for perennial plant maintenance.
 * Handles maintenance task CRUD and completion tracking.
 *
 * Writes go through `mutate(fn)` against the SyncedStore proxy (ADR 027;
 * legacy `setData` branch removed in Step 5).
 */

'use client'

import { useCallback } from 'react'
import {
  AllotmentData,
  MaintenanceTask,
  NewMaintenanceTask,
} from '@/types/unified-allotment'
import {
  getMaintenanceTasks,
  getTasksForMonth,
  getTasksForArea as storageGetTasksForArea,
} from '@/services/allotment-storage'
import { generateId } from '@/lib/utils'
import type { MutateFn } from './useAllotmentData'
import { assignDefined, withoutUndefined } from '@/lib/yjs/allotment-yjs'

// ============ HOOK TYPES ============

export interface UseAllotmentMaintenanceProps {
  data: AllotmentData | null
  mutate: MutateFn
}

export interface UseAllotmentMaintenanceReturn {
  getMaintenanceTasks: () => MaintenanceTask[]
  getTasksForMonth: (month: number) => MaintenanceTask[]
  getTasksForArea: (areaId: string) => MaintenanceTask[]
  addMaintenanceTask: (task: NewMaintenanceTask) => void
  updateMaintenanceTask: (taskId: string, updates: Partial<Omit<MaintenanceTask, 'id'>>) => void
  completeMaintenanceTask: (taskId: string) => void
  removeMaintenanceTask: (taskId: string) => void
}

// ============ HOOK IMPLEMENTATION ============

export function useAllotmentMaintenance({
  data,
  mutate,
}: UseAllotmentMaintenanceProps): UseAllotmentMaintenanceReturn {

  const getMaintenanceTasksData = useCallback((): MaintenanceTask[] => {
    if (!data) return []
    return getMaintenanceTasks(data)
  }, [data])

  const getTasksForMonthData = useCallback((month: number): MaintenanceTask[] => {
    if (!data) return []
    return getTasksForMonth(data, month)
  }, [data])

  const getTasksForAreaData = useCallback((areaId: string): MaintenanceTask[] => {
    if (!data) return []
    return storageGetTasksForArea(data, areaId)
  }, [data])

  const addTask = useCallback((task: NewMaintenanceTask) => {
    if (!data) return

    mutate(store => {
      const newTask: MaintenanceTask = withoutUndefined({
        ...task,
        id: generateId('task'),
      })
      store.maintenanceTasks.push(newTask)
    })
  }, [data, mutate])

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<MaintenanceTask, 'id'>>) => {
    if (!data) return

    mutate(store => {
      const t = store.maintenanceTasks.find(x => x.id === taskId)
      if (!t) return
      assignDefined(t as unknown as Record<string, unknown>, updates as Record<string, unknown>)
    })
  }, [data, mutate])

  const completeTask = useCallback((taskId: string) => {
    if (!data) return

    mutate(store => {
      const t = store.maintenanceTasks.find(x => x.id === taskId)
      if (!t) return
      t.lastCompleted = new Date().toISOString()
    })
  }, [data, mutate])

  const removeTask = useCallback((taskId: string) => {
    if (!data) return

    mutate(store => {
      const idx = store.maintenanceTasks.findIndex(t => t.id === taskId)
      if (idx === -1) return
      store.maintenanceTasks.splice(idx, 1)
    })
  }, [data, mutate])

  return {
    getMaintenanceTasks: getMaintenanceTasksData,
    getTasksForMonth: getTasksForMonthData,
    getTasksForArea: getTasksForAreaData,
    addMaintenanceTask: addTask,
    updateMaintenanceTask: updateTask,
    completeMaintenanceTask: completeTask,
    removeMaintenanceTask: removeTask,
  }
}
