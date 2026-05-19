/**
 * useAllotmentMaintenance Hook
 *
 * Task scheduling for perennial plant maintenance.
 * Handles maintenance task CRUD and completion tracking.
 *
 * Two-branch methods (ADR 027 Step 3, PR-B): see useAllotmentAreas for
 * the convention. The Yjs branch mutates `store.maintenanceTasks` in
 * place.
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
  addMaintenanceTask as storageAddTask,
  updateMaintenanceTask as storageUpdateTask,
  completeMaintenanceTask as storageCompleteTask,
  removeMaintenanceTask as storageRemoveTask,
} from '@/services/allotment-storage'
import { generateId } from '@/lib/utils'
import { USE_YJS_STORAGE } from '@/config/release-visibility'
import type { MutateFn } from './useAllotmentData'
import { assignDefined, withoutUndefined } from './yjs-helpers'

// ============ HOOK TYPES ============

export interface UseAllotmentMaintenanceProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
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
  setData,
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

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const newTask: MaintenanceTask = withoutUndefined({
          ...task,
          id: generateId('task'),
        })
        store.maintenanceTasks.push(newTask)
      })
      return
    }

    setData(storageAddTask(data, task))
  }, [data, setData, mutate])

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<MaintenanceTask, 'id'>>) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const t = store.maintenanceTasks.find(x => x.id === taskId)
        if (!t) return
        assignDefined(t as unknown as Record<string, unknown>, updates as Record<string, unknown>)
      })
      return
    }

    setData(storageUpdateTask(data, taskId, updates))
  }, [data, setData, mutate])

  const completeTask = useCallback((taskId: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const t = store.maintenanceTasks.find(x => x.id === taskId)
        if (!t) return
        t.lastCompleted = new Date().toISOString()
      })
      return
    }

    setData(storageCompleteTask(data, taskId))
  }, [data, setData, mutate])

  const removeTask = useCallback((taskId: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const idx = store.maintenanceTasks.findIndex(t => t.id === taskId)
        if (idx === -1) return
        store.maintenanceTasks.splice(idx, 1)
      })
      return
    }

    setData(storageRemoveTask(data, taskId))
  }, [data, setData, mutate])

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
