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
import { getGerminationDays } from '@/lib/date-calculator'

export type GeneratedTaskType = 'harvest' | 'sow-indoors' | 'sow-outdoors' | 'transplant' | 'prune' | 'feed' | 'mulch' | 'succession'
export type TaskUrgency = 'overdue' | 'today' | 'this-week' | 'upcoming' | 'later'

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
  dueDate?: string
  daysRemaining?: number
  urgency?: TaskUrgency
  calculatedFrom?: 'actual-date' | 'calendar-month'
}

interface PlantingWithContext {
  planting: Planting
  areaId: string
  areaName: string
}

// Crops suitable for succession sowing
const SUCCESSION_CROPS = ['lettuce', 'radish', 'spinach', 'rocket', 'beetroot', 'spring-onion']
const SUCCESSION_INTERVAL_DAYS = 21

/**
 * Calculate difference in days between two dates
 */
function differenceInDays(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((date1.getTime() - date2.getTime()) / msPerDay)
}

/**
 * Determine task urgency based on days remaining
 */
export function getUrgency(daysRemaining: number): TaskUrgency {
  if (daysRemaining < 0) return 'overdue'
  if (daysRemaining === 0) return 'today'
  if (daysRemaining <= 7) return 'this-week'
  if (daysRemaining <= 14) return 'upcoming'
  return 'later'
}

/**
 * Generate date-based tasks using actual planting dates
 * These take priority over generic month-based tasks
 */
export function generateDateBasedTasks(
  plantings: PlantingWithContext[],
  today: Date = new Date()
): GeneratedTask[] {
  const tasks: GeneratedTask[] = []
  const currentMonth = (today.getMonth() + 1) as Month

  for (const { planting, areaId, areaName } of plantings) {
    const vegetable = getVegetableById(planting.plantId)
    if (!vegetable) continue

    // Harvest tasks based on calculated dates
    if (planting.expectedHarvestStart && !planting.actualHarvestStart) {
      const harvestDate = new Date(planting.expectedHarvestStart)
      const daysUntil = differenceInDays(harvestDate, today)

      // Show harvest tasks up to 7 days before and any overdue
      if (daysUntil <= 7) {
        const urgency = getUrgency(daysUntil)
        tasks.push({
          ...createHarvestTask(vegetable, areaId, areaName, currentMonth, planting.varietyName),
          dueDate: planting.expectedHarvestStart,
          daysRemaining: daysUntil,
          urgency,
          calculatedFrom: 'actual-date',
          priority: urgency === 'overdue' || urgency === 'today' ? 'high' : 'medium',
          notes: daysUntil === 0
            ? `Ready to harvest today in ${areaName}`
            : daysUntil < 0
              ? `Overdue by ${Math.abs(daysUntil)} days in ${areaName}`
              : `Ready in ${daysUntil} days in ${areaName}`
        })
      }
    }

    // Transplant reminders for indoor sowings
    if (planting.sowMethod === 'indoor' && planting.sowDate && !planting.transplantDate) {
      // Calculate estimated transplant date: sow date + germination time + hardening period
      const germination = getGerminationDays(vegetable.category)
      const sowDate = new Date(planting.sowDate)
      const hardeningDays = 7 // Typical hardening period before transplant
      const daysToTransplant = germination.max + hardeningDays
      const estimatedTransplantDate = new Date(sowDate.getTime() + daysToTransplant * 24 * 60 * 60 * 1000)
      const daysUntil = differenceInDays(estimatedTransplantDate, today)

      // Show transplant tasks 14 days before and any overdue
      if (daysUntil <= 14) {
        const urgency = getUrgency(daysUntil)
        const transplantDateStr = estimatedTransplantDate.toISOString().split('T')[0]
        tasks.push({
          id: `transplant-reminder-${planting.id}-${currentMonth}`,
          type: 'other',
          generatedType: 'transplant',
          description: `Transplant ${vegetable.name} seedlings`,
          plantId: vegetable.id,
          plantName: vegetable.name,
          areaId,
          areaName,
          month: currentMonth,
          priority: urgency === 'overdue' || urgency === 'today' ? 'high' : 'medium',
          dueDate: transplantDateStr,
          daysRemaining: daysUntil,
          urgency,
          calculatedFrom: 'actual-date',
          notes: daysUntil === 0
            ? `Seedlings ready to transplant today to ${areaName}`
            : daysUntil < 0
              ? `Seedlings overdue for transplant by ${Math.abs(daysUntil)} days`
              : `Seedlings ready to transplant in ${daysUntil} days`
        })
      }
    }
  }

  return tasks
}

/**
 * Generate succession sowing reminders for quick-harvest crops
 */
export function generateSuccessionReminders(
  plantings: PlantingWithContext[],
  today: Date = new Date()
): GeneratedTask[] {
  const tasks: GeneratedTask[] = []
  const currentMonth = (today.getMonth() + 1) as Month

  for (const cropId of SUCCESSION_CROPS) {
    const vegetable = getVegetableById(cropId)
    if (!vegetable) continue

    // Check if it's sowing season for this crop
    const canSowOutdoors = vegetable.planting.sowOutdoorsMonths.includes(currentMonth)
    const canSowIndoors = vegetable.planting.sowIndoorsMonths.includes(currentMonth)
    if (!canSowOutdoors && !canSowIndoors) continue

    // Find most recent sowing of this crop
    const sowingsOfCrop = plantings
      .filter(p => p.planting.plantId === cropId && p.planting.sowDate)
      .sort((a, b) => b.planting.sowDate!.localeCompare(a.planting.sowDate!))

    const lastSowing = sowingsOfCrop[0]

    if (lastSowing) {
      const daysSince = differenceInDays(today, new Date(lastSowing.planting.sowDate!))

      if (daysSince >= SUCCESSION_INTERVAL_DAYS) {
        tasks.push({
          id: `succession-${cropId}-${currentMonth}`,
          type: 'other',
          generatedType: 'succession',
          description: `Succession sow ${vegetable.name}`,
          plantId: vegetable.id,
          plantName: vegetable.name,
          month: currentMonth,
          priority: 'medium',
          urgency: 'upcoming',
          calculatedFrom: 'actual-date',
          notes: `Last ${vegetable.name} sown ${daysSince} days ago - time for next batch`
        })
      }
    }
  }

  return tasks
}

/**
 * Generate month-based tasks (fallback when no dates available)
 */
function generateMonthBasedTasks(
  currentMonth: Month,
  plantings: PlantingWithContext[],
  areas: Area[]
): GeneratedTask[] {
  const tasks: GeneratedTask[] = []

  // Generate tasks from actual plantings in the allotment
  for (const { planting, areaId, areaName } of plantings) {
    const vegetable = getVegetableById(planting.plantId)
    if (!vegetable) continue

    // Only generate month-based harvest if no expectedHarvestStart
    if (!planting.expectedHarvestStart && vegetable.planting.harvestMonths.includes(currentMonth)) {
      const task = createHarvestTask(vegetable, areaId, areaName, currentMonth, planting.varietyName)
      tasks.push({ ...task, calculatedFrom: 'calendar-month' })
    }
  }

  // Generate sowing/transplant suggestions for plants already in the allotment
  for (const { planting, areaId, areaName } of plantings) {
    const vegetable = getVegetableById(planting.plantId)
    if (!vegetable) continue

    // Sow indoors tasks
    if (vegetable.planting.sowIndoorsMonths.includes(currentMonth)) {
      const task = createSowIndoorsTask(vegetable, currentMonth, areaId, areaName)
      tasks.push({ ...task, calculatedFrom: 'calendar-month' })
    }

    // Sow outdoors tasks
    if (vegetable.planting.sowOutdoorsMonths.includes(currentMonth)) {
      const task = createSowOutdoorsTask(vegetable, currentMonth, areaId, areaName)
      tasks.push({ ...task, calculatedFrom: 'calendar-month' })
    }

    // Transplant tasks (only if no sow date tracking)
    if (!planting.sowDate && vegetable.planting.transplantMonths.includes(currentMonth)) {
      const task = createTransplantTask(vegetable, currentMonth, areaId, areaName)
      tasks.push({ ...task, calculatedFrom: 'calendar-month' })
    }
  }

  // Generate maintenance tasks for perennial areas
  for (const area of areas) {
    if (!area.primaryPlant?.plantId) continue

    const vegetable = getVegetableById(area.primaryPlant.plantId)
    if (!vegetable?.maintenance) continue

    if (vegetable.maintenance.pruneMonths?.includes(currentMonth)) {
      tasks.push({ ...createPruneTask(vegetable, area, currentMonth), calculatedFrom: 'calendar-month' })
    }

    if (vegetable.maintenance.feedMonths?.includes(currentMonth)) {
      tasks.push({ ...createFeedTask(vegetable, area, currentMonth), calculatedFrom: 'calendar-month' })
    }

    if (vegetable.maintenance.mulchMonths?.includes(currentMonth)) {
      tasks.push({ ...createMulchTask(vegetable, area, currentMonth), calculatedFrom: 'calendar-month' })
    }
  }

  return tasks
}

/**
 * Merge date-based and month-based tasks, preferring date-based
 */
function mergeAndDeduplicateTasks(
  dateBasedTasks: GeneratedTask[],
  monthBasedTasks: GeneratedTask[]
): GeneratedTask[] {
  const taskMap = new Map<string, GeneratedTask>()

  // Add date-based tasks first (they take priority)
  for (const task of dateBasedTasks) {
    const key = `${task.generatedType}-${task.plantId}-${task.areaId || 'general'}`
    taskMap.set(key, task)
  }

  // Add month-based tasks only if no date-based equivalent exists
  for (const task of monthBasedTasks) {
    const key = `${task.generatedType}-${task.plantId}-${task.areaId || 'general'}`
    if (!taskMap.has(key)) {
      taskMap.set(key, task)
    }
  }

  return Array.from(taskMap.values())
}

/**
 * Generate tasks for a specific month based on what's planted
 * Combines date-based (priority) and month-based (fallback) approaches
 */
export function generateTasksForMonth(
  currentMonth: Month,
  plantings: PlantingWithContext[],
  areas: Area[],
  today: Date = new Date()
): GeneratedTask[] {
  // Get date-based tasks (high priority, personalized)
  const dateBasedTasks = generateDateBasedTasks(plantings, today)

  // Get succession sowing reminders
  const successionTasks = generateSuccessionReminders(plantings, today)

  // Get month-based tasks (fallback for plantings without dates)
  const monthBasedTasks = generateMonthBasedTasks(currentMonth, plantings, areas)

  // Merge all tasks, preferring date-based
  const allDateBased = [...dateBasedTasks, ...successionTasks]
  const mergedTasks = mergeAndDeduplicateTasks(allDateBased, monthBasedTasks)

  // Deduplicate any remaining duplicates
  const dedupedTasks = deduplicateTasks(mergedTasks)

  // Sort: urgency first, then priority, then alphabetically
  return dedupedTasks.sort((a, b) => {
    // Date-based tasks first
    if (a.calculatedFrom === 'actual-date' && b.calculatedFrom !== 'actual-date') return -1
    if (b.calculatedFrom === 'actual-date' && a.calculatedFrom !== 'actual-date') return 1

    // Then by urgency if both have it
    if (a.urgency && b.urgency) {
      const urgencyOrder: Record<TaskUrgency, number> = { overdue: 0, today: 1, 'this-week': 2, upcoming: 3, later: 4 }
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      if (urgencyDiff !== 0) return urgencyDiff
    }

    // Then by priority
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
    'mulch': 'Mulch',
    'succession': 'Succession Sow'
  }
  return labels[type] || 'Task'
}

/**
 * Get urgency label for display
 */
export function getUrgencyLabel(urgency: TaskUrgency): string {
  const labels: Record<TaskUrgency, string> = {
    'overdue': 'Overdue',
    'today': 'Today',
    'this-week': 'This Week',
    'upcoming': 'Upcoming',
    'later': 'Later'
  }
  return labels[urgency]
}

/**
 * Get urgency color classes for styling
 */
export function getUrgencyColorClasses(urgency: TaskUrgency): string {
  const classes: Record<TaskUrgency, string> = {
    'overdue': 'bg-zen-ume-100 text-zen-ume-800 border-zen-ume-200',
    'today': 'bg-zen-kitsune-100 text-zen-kitsune-800 border-zen-kitsune-200',
    'this-week': 'bg-zen-water-100 text-zen-water-800 border-zen-water-200',
    'upcoming': 'bg-zen-moss-100 text-zen-moss-800 border-zen-moss-200',
    'later': 'bg-zen-stone-100 text-zen-stone-700 border-zen-stone-200'
  }
  return classes[urgency]
}
