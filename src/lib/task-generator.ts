/**
 * Task Generator
 *
 * Generates automatic tasks based on:
 * 1. Current month and what's planted in the allotment
 * 2. Vegetable database planting/harvesting schedules
 * 3. Maintenance info for perennials (pruning, feeding)
 */

import { MaintenanceTask, MaintenanceTaskType, Planting, Area } from '@/types/unified-allotment'
import { Vegetable, Month } from '@/types/garden-planner'
import { getVegetableById } from '@/lib/vegetable-database'

export type GeneratedTaskType = 'harvest' | 'sow-indoors' | 'sow-outdoors' | 'transplant' | 'prune' | 'feed' | 'mulch'

export interface GeneratedTask {
  id: string
  type: MaintenanceTaskType
  generatedType: GeneratedTaskType
  description: string
  plantId: string
  plantName: string
  areaId?: string
  areaName?: string
  month: number
  priority: 'high' | 'medium' | 'low'
  notes?: string
}

interface PlantingWithContext {
  planting: Planting
  areaId: string
  areaName: string
}

/**
 * Generate tasks for a specific month based on what's planted
 */
export function generateTasksForMonth(
  currentMonth: Month,
  plantings: PlantingWithContext[],
  areas: Area[]
): GeneratedTask[] {
  const tasks: GeneratedTask[] = []
  const seenPlantIds = new Set<string>()

  // Generate tasks from actual plantings in the allotment
  for (const { planting, areaId, areaName } of plantings) {
    const vegetable = getVegetableById(planting.plantId)
    if (!vegetable) continue

    // Generate harvest tasks
    if (vegetable.planting.harvestMonths.includes(currentMonth)) {
      tasks.push(createHarvestTask(vegetable, areaId, areaName, currentMonth, planting.varietyName))
    }

    // Track seen plant IDs for sowing suggestions
    seenPlantIds.add(planting.plantId)
  }

  // Generate sowing/transplant suggestions for plants already in the allotment
  // (these are more relevant because user has grown them before)
  for (const { planting, areaId, areaName } of plantings) {
    const vegetable = getVegetableById(planting.plantId)
    if (!vegetable) continue

    // Sow indoors tasks
    if (vegetable.planting.sowIndoorsMonths.includes(currentMonth)) {
      tasks.push(createSowIndoorsTask(vegetable, currentMonth, areaId, areaName))
    }

    // Sow outdoors tasks
    if (vegetable.planting.sowOutdoorsMonths.includes(currentMonth)) {
      tasks.push(createSowOutdoorsTask(vegetable, currentMonth, areaId, areaName))
    }

    // Transplant tasks
    if (vegetable.planting.transplantMonths.includes(currentMonth)) {
      tasks.push(createTransplantTask(vegetable, currentMonth, areaId, areaName))
    }
  }

  // Generate maintenance tasks for perennial areas (trees, berries, etc.)
  for (const area of areas) {
    if (!area.primaryPlant?.plantId) continue

    const vegetable = getVegetableById(area.primaryPlant.plantId)
    if (!vegetable?.maintenance) continue

    // Pruning tasks
    if (vegetable.maintenance.pruneMonths?.includes(currentMonth)) {
      tasks.push(createPruneTask(vegetable, area, currentMonth))
    }

    // Feeding tasks
    if (vegetable.maintenance.feedMonths?.includes(currentMonth)) {
      tasks.push(createFeedTask(vegetable, area, currentMonth))
    }

    // Mulching tasks
    if (vegetable.maintenance.mulchMonths?.includes(currentMonth)) {
      tasks.push(createMulchTask(vegetable, area, currentMonth))
    }
  }

  // Deduplicate tasks (same plant + same task type)
  const dedupedTasks = deduplicateTasks(tasks)

  // Sort by priority then alphabetically
  return dedupedTasks.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return a.description.localeCompare(b.description)
  })
}

function createHarvestTask(
  vegetable: Vegetable,
  areaId: string,
  areaName: string,
  month: Month,
  varietyName?: string
): GeneratedTask {
  const displayName = varietyName ? `${vegetable.name} (${varietyName})` : vegetable.name
  return {
    id: `harvest-${vegetable.id}-${areaId}-${month}`,
    type: 'harvest',
    generatedType: 'harvest',
    description: `Harvest ${displayName}`,
    plantId: vegetable.id,
    plantName: vegetable.name,
    areaId,
    areaName,
    month,
    priority: 'high',
    notes: `Ready for harvest in ${areaName}`
  }
}

function createSowIndoorsTask(
  vegetable: Vegetable,
  month: Month,
  areaId?: string,
  areaName?: string
): GeneratedTask {
  return {
    id: `sow-indoors-${vegetable.id}-${month}`,
    type: 'other',
    generatedType: 'sow-indoors',
    description: `Sow ${vegetable.name} indoors`,
    plantId: vegetable.id,
    plantName: vegetable.name,
    areaId,
    areaName,
    month,
    priority: 'medium',
    notes: areaName ? `For planting in ${areaName}` : undefined
  }
}

function createSowOutdoorsTask(
  vegetable: Vegetable,
  month: Month,
  areaId?: string,
  areaName?: string
): GeneratedTask {
  return {
    id: `sow-outdoors-${vegetable.id}-${month}`,
    type: 'other',
    generatedType: 'sow-outdoors',
    description: `Direct sow ${vegetable.name} outdoors`,
    plantId: vegetable.id,
    plantName: vegetable.name,
    areaId,
    areaName,
    month,
    priority: 'medium',
    notes: areaName ? `Can be sown in ${areaName}` : undefined
  }
}

function createTransplantTask(
  vegetable: Vegetable,
  month: Month,
  areaId?: string,
  areaName?: string
): GeneratedTask {
  return {
    id: `transplant-${vegetable.id}-${month}`,
    type: 'other',
    generatedType: 'transplant',
    description: `Transplant ${vegetable.name} seedlings`,
    plantId: vegetable.id,
    plantName: vegetable.name,
    areaId,
    areaName,
    month,
    priority: 'medium',
    notes: areaName ? `Ready to transplant to ${areaName}` : undefined
  }
}

function createPruneTask(
  vegetable: Vegetable,
  area: Area,
  month: Month
): GeneratedTask {
  const variety = area.primaryPlant?.variety
  const displayName = variety ? `${area.name} (${variety})` : area.name
  const maintenanceNotes = vegetable.maintenance?.notes?.find(n =>
    n.toLowerCase().includes('prune') || n.toLowerCase().includes('cut')
  )

  return {
    id: `prune-${area.id}-${month}`,
    type: 'prune',
    generatedType: 'prune',
    description: `Prune ${displayName}`,
    plantId: vegetable.id,
    plantName: vegetable.name,
    areaId: area.id,
    areaName: area.name,
    month,
    priority: 'medium',
    notes: maintenanceNotes
  }
}

function createFeedTask(
  vegetable: Vegetable,
  area: Area,
  month: Month
): GeneratedTask {
  const variety = area.primaryPlant?.variety
  const displayName = variety ? `${area.name} (${variety})` : area.name

  return {
    id: `feed-${area.id}-${month}`,
    type: 'feed',
    generatedType: 'feed',
    description: `Feed ${displayName}`,
    plantId: vegetable.id,
    plantName: vegetable.name,
    areaId: area.id,
    areaName: area.name,
    month,
    priority: 'low',
    notes: 'Apply general-purpose fertiliser'
  }
}

function createMulchTask(
  vegetable: Vegetable,
  area: Area,
  month: Month
): GeneratedTask {
  const variety = area.primaryPlant?.variety
  const displayName = variety ? `${area.name} (${variety})` : area.name

  return {
    id: `mulch-${area.id}-${month}`,
    type: 'mulch',
    generatedType: 'mulch',
    description: `Mulch ${displayName}`,
    plantId: vegetable.id,
    plantName: vegetable.name,
    areaId: area.id,
    areaName: area.name,
    month,
    priority: 'low',
    notes: 'Apply organic mulch around base'
  }
}

/**
 * Remove duplicate tasks (same plant + same action type)
 * Keeps the one with the most context (area info)
 */
function deduplicateTasks(tasks: GeneratedTask[]): GeneratedTask[] {
  const taskMap = new Map<string, GeneratedTask>()

  for (const task of tasks) {
    // Create a key based on plant + task type (not area-specific)
    const key = `${task.generatedType}-${task.plantId}`
    const existing = taskMap.get(key)

    if (!existing) {
      taskMap.set(key, task)
    } else if (!existing.areaId && task.areaId) {
      // Prefer tasks with area context
      taskMap.set(key, task)
    }
  }

  return Array.from(taskMap.values())
}

/**
 * Convert GeneratedTask to MaintenanceTask format for compatibility
 */
export function toMaintenanceTask(task: GeneratedTask): MaintenanceTask {
  return {
    id: task.id,
    areaId: task.areaId || '',
    type: task.type,
    month: task.month,
    description: task.description,
    notes: task.notes
  }
}

/**
 * Get task icon label for display
 */
export function getTaskLabel(type: GeneratedTaskType): string {
  const labels: Record<GeneratedTaskType, string> = {
    'harvest': 'Harvest',
    'sow-indoors': 'Sow Indoors',
    'sow-outdoors': 'Sow Outdoors',
    'transplant': 'Transplant',
    'prune': 'Prune',
    'feed': 'Feed',
    'mulch': 'Mulch'
  }
  return labels[type] || 'Task'
}
