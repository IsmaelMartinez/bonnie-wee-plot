/**
 * useAllotmentCustomTasks Hook
 *
 * CRUD operations for free-form custom tasks on the Today dashboard.
 *
 * Two-branch methods (ADR 027 Step 3, PR-B): see useAllotmentAreas for
 * the convention. The Yjs branch mutates `store.customTasks` in place.
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
import { generateId } from '@/lib/utils'
import { USE_YJS_STORAGE } from '@/config/release-visibility'
import type { MutateFn } from './useAllotmentData'
import { withoutUndefined } from './yjs-helpers'

// ============ HOOK TYPES ============

export interface UseAllotmentCustomTasksProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
  mutate: MutateFn
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
  mutate,
}: UseAllotmentCustomTasksProps): UseAllotmentCustomTasksReturn {

  const getCustomTasksData = useCallback((): CustomTask[] => {
    if (!data) return []
    return storageGetCustomTasks(data)
  }, [data])

  const addTask = useCallback((task: NewCustomTask) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const newTask: CustomTask = withoutUndefined({
          id: generateId('custom-task'),
          description: task.description,
          completed: false,
          createdAt: new Date().toISOString(),
        })
        // Legacy storage prepends new tasks (newest first); mirror that
        // ordering so the parity snapshot matches.
        store.customTasks.unshift(newTask)
      })
      return
    }

    setData(storageAddCustomTask(data, task))
  }, [data, setData, mutate])

  const toggleTask = useCallback((taskId: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const t = store.customTasks.find(x => x.id === taskId)
        if (!t) return
        const nextCompleted = !t.completed
        t.completed = nextCompleted
        if (nextCompleted) {
          t.completedAt = new Date().toISOString()
        } else {
          // Legacy assigns `undefined` here; on Yjs delete the field so
          // the serialized snapshot omits it (matches the JSON.stringify
          // behaviour of the legacy path).
          delete (t as Partial<CustomTask>).completedAt
        }
      })
      return
    }

    setData(storageToggleCustomTask(data, taskId))
  }, [data, setData, mutate])

  const updateTask = useCallback((taskId: string, description: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const t = store.customTasks.find(x => x.id === taskId)
        if (!t) return
        t.description = description
      })
      return
    }

    setData(storageUpdateCustomTask(data, taskId, description))
  }, [data, setData, mutate])

  const removeTask = useCallback((taskId: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const idx = store.customTasks.findIndex(t => t.id === taskId)
        if (idx === -1) return
        store.customTasks.splice(idx, 1)
      })
      return
    }

    setData(storageRemoveCustomTask(data, taskId))
  }, [data, setData, mutate])

  return {
    getCustomTasks: getCustomTasksData,
    addCustomTask: addTask,
    toggleCustomTask: toggleTask,
    updateCustomTask: updateTask,
    removeCustomTask: removeTask,
  }
}
