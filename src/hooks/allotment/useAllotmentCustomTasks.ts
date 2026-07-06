/**
 * useAllotmentCustomTasks Hook
 *
 * CRUD operations for free-form custom tasks on the Today dashboard.
 *
 * Writes go through `mutate(fn)` against the SyncedStore proxy (ADR 027;
 * legacy `setData` branch removed in Step 5).
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
} from '@/services/allotment-storage'
import { generateId } from '@/lib/utils'
import type { MutateFn } from './useAllotmentData'
import { withoutUndefined } from '@/lib/yjs/allotment-yjs'

// ============ HOOK TYPES ============

export interface UseAllotmentCustomTasksProps {
  data: AllotmentData | null
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
  mutate,
}: UseAllotmentCustomTasksProps): UseAllotmentCustomTasksReturn {

  const getCustomTasksData = useCallback((): CustomTask[] => {
    if (!data) return []
    return storageGetCustomTasks(data)
  }, [data])

  const addTask = useCallback((task: NewCustomTask) => {
    if (!data) return

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
  }, [data, mutate])

  const toggleTask = useCallback((taskId: string) => {
    if (!data) return

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
  }, [data, mutate])

  const updateTask = useCallback((taskId: string, description: string) => {
    if (!data) return

    mutate(store => {
      const t = store.customTasks.find(x => x.id === taskId)
      if (!t) return
      t.description = description
    })
  }, [data, mutate])

  const removeTask = useCallback((taskId: string) => {
    if (!data) return

    mutate(store => {
      const idx = store.customTasks.findIndex(t => t.id === taskId)
      if (idx === -1) return
      store.customTasks.splice(idx, 1)
    })
  }, [data, mutate])

  return {
    getCustomTasks: getCustomTasksData,
    addCustomTask: addTask,
    toggleCustomTask: toggleTask,
    updateCustomTask: updateTask,
    removeCustomTask: removeTask,
  }
}
