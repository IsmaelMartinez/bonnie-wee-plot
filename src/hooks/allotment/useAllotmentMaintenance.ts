/**
 * useAllotmentMaintenance Hook
 *
 * Task scheduling for perennial plant maintenance.
 * Handles maintenance task CRUD and completion tracking.
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

// ============ HOOK TYPES ============

export interface UseAllotmentMaintenanceProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
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
    setData(storageAddTask(data, task))
  }, [data, setData])

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<MaintenanceTask, 'id'>>) => {
    if (!data) return
    setData(storageUpdateTask(data, taskId, updates))
  }, [data, setData])

  const completeTask = useCallback((taskId: string) => {
    if (!data) return
    setData(storageCompleteTask(data, taskId))
  }, [data, setData])

  const removeTask = useCallback((taskId: string) => {
    if (!data) return
    setData(storageRemoveTask(data, taskId))
  }, [data, setData])

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
