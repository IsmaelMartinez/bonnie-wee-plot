/**
 * Task grouping for the Today dashboard.
 *
 * The task generator emits one task per plant/area ("Harvest Kale",
 * "Harvest Leeks", "Water Bed A", ...). Listing them individually makes the
 * dashboard busy, so the Today list collapses them into one summary row per
 * task kind ("Harvest: Kale, Leeks and Parsnips"), in the spirit of the
 * This Month page. The individual tasks stay reachable by expanding a group.
 */

import type { GeneratedTask, GeneratedTaskType, TaskUrgency } from '@/lib/task-generator'

export interface TaskGroup {
  type: GeneratedTaskType
  tasks: GeneratedTask[]
  /** Unique plant or area names the group covers, in task order. */
  subjects: string[]
}

/** Task kinds that act on a whole area, so the area name is the subject. */
const AREA_SUBJECT_TYPES: ReadonlySet<GeneratedTaskType> = new Set(['water', 'feed', 'prune', 'mulch'])

function subjectFor(task: GeneratedTask): string {
  if (AREA_SUBJECT_TYPES.has(task.generatedType)) return task.areaName ?? task.plantName
  return task.plantName
}

/**
 * Group tasks by generated type. Groups keep the order in which their first
 * task appears, so the generator's priority sort still decides which kinds
 * of work are listed first.
 */
export function groupGeneratedTasks(tasks: GeneratedTask[]): TaskGroup[] {
  const groups = new Map<GeneratedTaskType, TaskGroup>()
  for (const task of tasks) {
    let group = groups.get(task.generatedType)
    if (!group) {
      group = { type: task.generatedType, tasks: [], subjects: [] }
      groups.set(task.generatedType, group)
    }
    group.tasks.push(task)
    const subject = subjectFor(task)
    if (!group.subjects.includes(subject)) group.subjects.push(subject)
  }
  return Array.from(groups.values())
}

/**
 * Join names into a short readable list: "Kale", "Kale and Leeks",
 * "Kale, Leeks and Parsnips", "Kale, Leeks, Parsnips and 2 more". Never
 * says "and 1 more": one extra name is shown instead.
 */
export function formatSubjects(subjects: string[], maxShown = 3): string {
  if (subjects.length === 0) return ''
  if (subjects.length === 1) return subjects[0]
  if (subjects.length <= maxShown + 1) {
    return `${subjects.slice(0, -1).join(', ')} and ${subjects[subjects.length - 1]}`
  }
  const shown = subjects.slice(0, maxShown)
  return `${shown.join(', ')} and ${subjects.length - maxShown} more`
}

export interface TaskBadge {
  text: string
  /** Lower is more urgent. */
  rank: number
  urgency: TaskUrgency | 'ready'
  daysRemaining?: number
}

/** The badge a single task shows, or null when it has none. */
export function getTaskBadge(task: GeneratedTask): TaskBadge | null {
  // Overdue is flagged whatever the task was calculated from: a feed reminder
  // is month-based but still overdue when the last feed was long ago.
  if (task.urgency === 'overdue') return { text: 'Overdue', rank: 0, urgency: 'overdue' }
  if (task.urgency && task.calculatedFrom === 'actual-date') {
    if (task.urgency === 'today') return { text: 'Today', rank: 1, urgency: 'today' }
    if ((task.urgency === 'this-week' || task.urgency === 'upcoming') && task.daysRemaining !== undefined) {
      return {
        text: `${task.daysRemaining}d`,
        rank: task.urgency === 'this-week' ? 2 : 3,
        urgency: task.urgency,
        daysRemaining: task.daysRemaining,
      }
    }
  }
  if (task.priority === 'high') return { text: 'Ready', rank: 4, urgency: 'ready' }
  return null
}

/** The most urgent badge across a group's tasks, so a summary row still flags overdue work. */
export function getGroupBadge(tasks: GeneratedTask[]): TaskBadge | null {
  let best: TaskBadge | null = null
  for (const task of tasks) {
    const badge = getTaskBadge(task)
    if (!badge) continue
    if (
      !best ||
      badge.rank < best.rank ||
      (badge.rank === best.rank && (badge.daysRemaining ?? Infinity) < (best.daysRemaining ?? Infinity))
    ) {
      best = badge
    }
  }
  return best
}
