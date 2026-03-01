/**
 * useAllotmentCustomTasks Hook
 *
 * CRUD operations for free-form custom tasks on the Today dashboard.
 */

'use client'

import { useCallback } from 'react'
import {
  AllotmentData,
  CustomTask,
  NewCustomTask,
} from '@/types/unified-allotment'
import {
  getCustomTasks as storageGetCustomTasks,
  addCustomTask as storageAddCustomTask,
  toggleCustomTask as storageToggleCustomTask,
  updateCustomTask as storageUpdateCustomTask,
  removeCustomTask as storageRemoveCustomTask,
} from '@/services/allotment-storage'

// ============ HOOK TYPES ============

export interface UseAllotmentCustomTasksProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
}

export interface UseAllotmentCustomTasksReturn {
  getCustomTasks: () => CustomTask[]
  addCustomTask: (task: NewCustomTask) => void
  toggleCustomTask: (taskId: string) => void
  updateCustomTask: (taskId: string, description: string) => void
  removeCustomTask: (taskId: string) => void
}

// ============ HOOK IMPLEMENTATION ============

export function useAllotmentCustomTasks({
  data,
  setData,
}: UseAllotmentCustomTasksProps): UseAllotmentCustomTasksReturn {

  const getCustomTasksData = useCallback((): CustomTask[] => {
    if (!data) return []
    return storageGetCustomTasks(data)
  }, [data])

  const addTask = useCallback((task: NewCustomTask) => {
    if (!data) return
    setData(storageAddCustomTask(data, task))
  }, [data, setData])

  const toggleTask = useCallback((taskId: string) => {
    if (!data) return
    setData(storageToggleCustomTask(data, taskId))
  }, [data, setData])

  const updateTask = useCallback((taskId: string, description: string) => {
    if (!data) return
    setData(storageUpdateCustomTask(data, taskId, description))
  }, [data, setData])

  const removeTask = useCallback((taskId: string) => {
    if (!data) return
    setData(storageRemoveCustomTask(data, taskId))
  }, [data, setData])

  return {
    getCustomTasks: getCustomTasksData,
    addCustomTask: addTask,
    toggleCustomTask: toggleTask,
    updateCustomTask: updateTask,
    removeCustomTask: removeTask,
  }
}
