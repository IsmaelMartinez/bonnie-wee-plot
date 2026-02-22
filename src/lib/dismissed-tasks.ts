/**
 * Dismissed Tasks
 *
 * Tracks which generated tasks have been marked as done on the dashboard.
 * Tasks are dismissed per-month so they reappear next month if still relevant.
 * Stored in localStorage as a simple JSON object.
 */

import { STORAGE_KEY_DISMISSED_TASKS } from '@/lib/storage-keys'

interface DismissedTasksData {
  /** Month (1-12) when tasks were dismissed */
  month: number
  /** Year when tasks were dismissed */
  year: number
  /** Set of dismissed task IDs */
  taskIds: string[]
}

/**
 * Load dismissed task IDs for the current month.
 * Returns empty set if month/year doesn't match (auto-clears stale data).
 */
export function loadDismissedTaskIds(currentMonth: number, currentYear: number): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISMISSED_TASKS)
    if (!raw) return new Set()

    const data: DismissedTasksData = JSON.parse(raw)
    if (data.month !== currentMonth || data.year !== currentYear) {
      // Different month — clear stale dismissals
      localStorage.removeItem(STORAGE_KEY_DISMISSED_TASKS)
      return new Set()
    }

    return new Set(data.taskIds)
  } catch {
    return new Set()
  }
}

/**
 * Dismiss a task by ID for the current month.
 */
export function dismissTask(taskId: string, currentMonth: number, currentYear: number): void {
  const existing = loadDismissedTaskIds(currentMonth, currentYear)
  existing.add(taskId)
  const data: DismissedTasksData = {
    month: currentMonth,
    year: currentYear,
    taskIds: Array.from(existing),
  }
  localStorage.setItem(STORAGE_KEY_DISMISSED_TASKS, JSON.stringify(data))
}

/**
 * Restore a previously dismissed task.
 */
export function restoreTask(taskId: string, currentMonth: number, currentYear: number): void {
  const existing = loadDismissedTaskIds(currentMonth, currentYear)
  existing.delete(taskId)
  if (existing.size === 0) {
    localStorage.removeItem(STORAGE_KEY_DISMISSED_TASKS)
  } else {
    const data: DismissedTasksData = {
      month: currentMonth,
      year: currentYear,
      taskIds: Array.from(existing),
    }
    localStorage.setItem(STORAGE_KEY_DISMISSED_TASKS, JSON.stringify(data))
  }
}
