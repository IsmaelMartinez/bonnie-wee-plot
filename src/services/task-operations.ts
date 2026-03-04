/**
 * Task Operations
 *
 * CRUD operations for custom tasks and maintenance tasks.
 */

import {
  AllotmentData,
  CustomTask,
  NewCustomTask,
  MaintenanceTask,
  NewMaintenanceTask,
} from '@/types/unified-allotment'
import { generateId } from '@/lib/utils'

// ============ CUSTOM TASK OPERATIONS ============

/**
 * Get all custom tasks (newest first)
 */
export function getCustomTasks(data: AllotmentData): CustomTask[] {
  return data.customTasks || []
}

/**
 * Add a new custom task
 */
export function addCustomTask(
  data: AllotmentData,
  task: NewCustomTask
): AllotmentData {
  const newTask: CustomTask = {
    id: generateId('custom-task'),
    description: task.description,
    completed: false,
    createdAt: new Date().toISOString(),
  }

  return {
    ...data,
    customTasks: [newTask, ...(data.customTasks || [])],
  }
}

/**
 * Toggle a custom task's completed status
 */
export function toggleCustomTask(
  data: AllotmentData,
  taskId: string
): AllotmentData {
  return {
    ...data,
    customTasks: (data.customTasks || []).map(task =>
      task.id === taskId
        ? {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : undefined,
          }
        : task
    ),
  }
}

/**
 * Update a custom task's description
 */
export function updateCustomTask(
  data: AllotmentData,
  taskId: string,
  description: string
): AllotmentData {
  return {
    ...data,
    customTasks: (data.customTasks || []).map(task =>
      task.id === taskId ? { ...task, description } : task
    ),
  }
}

/**
 * Remove a custom task
 */
export function removeCustomTask(
  data: AllotmentData,
  taskId: string
): AllotmentData {
  return {
    ...data,
    customTasks: (data.customTasks || []).filter(t => t.id !== taskId),
  }
}

// ============ MAINTENANCE TASK OPERATIONS ============

/**
 * Generate a unique ID for a maintenance task
 */
export function generateMaintenanceTaskId(): string {
  return generateId('task')
}

/**
 * Get all maintenance tasks
 */
export function getMaintenanceTasks(data: AllotmentData): MaintenanceTask[] {
  return data.maintenanceTasks || []
}

/**
 * Get maintenance tasks for a specific area
 */
export function getTasksForArea(
  data: AllotmentData,
  areaId: string
): MaintenanceTask[] {
  return (data.maintenanceTasks || []).filter(t => t.areaId === areaId)
}

/**
 * Get maintenance tasks due in a specific month
 */
export function getTasksForMonth(
  data: AllotmentData,
  month: number
): MaintenanceTask[] {
  return (data.maintenanceTasks || []).filter(t => t.month === month)
}

/**
 * Add a new maintenance task
 */
export function addMaintenanceTask(
  data: AllotmentData,
  task: NewMaintenanceTask
): AllotmentData {
  const newTask: MaintenanceTask = {
    ...task,
    id: generateMaintenanceTaskId(),
  }

  return {
    ...data,
    maintenanceTasks: [...(data.maintenanceTasks || []), newTask],
  }
}

/**
 * Update a maintenance task
 */
export function updateMaintenanceTask(
  data: AllotmentData,
  taskId: string,
  updates: Partial<Omit<MaintenanceTask, 'id'>>
): AllotmentData {
  return {
    ...data,
    maintenanceTasks: (data.maintenanceTasks || []).map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ),
  }
}

/**
 * Mark a maintenance task as completed
 */
export function completeMaintenanceTask(
  data: AllotmentData,
  taskId: string,
  completedDate: string = new Date().toISOString()
): AllotmentData {
  return updateMaintenanceTask(data, taskId, { lastCompleted: completedDate })
}

/**
 * Remove a maintenance task
 */
export function removeMaintenanceTask(
  data: AllotmentData,
  taskId: string
): AllotmentData {
  return {
    ...data,
    maintenanceTasks: (data.maintenanceTasks || []).filter(t => t.id !== taskId),
  }
}
