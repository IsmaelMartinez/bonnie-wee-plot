import { describe, it, expect } from 'vitest'
import { formatSubjects, getGroupBadge, groupGeneratedTasks } from '@/lib/task-grouping'
import type { GeneratedTask } from '@/lib/task-generator'

function task(overrides: Partial<GeneratedTask>): GeneratedTask {
  return {
    id: 'id',
    type: 'harvest',
    generatedType: 'harvest',
    description: 'Harvest Kale',
    plantId: 'kale',
    plantName: 'Kale',
    month: 11,
    priority: 'medium',
    ...overrides,
  }
}

describe('groupGeneratedTasks', () => {
  it('groups by type in order of first appearance', () => {
    const groups = groupGeneratedTasks([
      task({ id: '1', generatedType: 'harvest', plantName: 'Kale' }),
      task({ id: '2', generatedType: 'water', plantName: 'Kale', areaName: 'Bed A' }),
      task({ id: '3', generatedType: 'harvest', plantName: 'Leeks' }),
    ])

    expect(groups.map((g) => g.type)).toEqual(['harvest', 'water'])
    expect(groups[0].tasks.map((t) => t.id)).toEqual(['1', '3'])
  })

  it('uses plant names for crop tasks and area names for area tasks', () => {
    const groups = groupGeneratedTasks([
      task({ id: '1', generatedType: 'harvest', plantName: 'Kale', areaName: 'Bed A' }),
      task({ id: '2', generatedType: 'feed', plantName: 'Apple', areaName: 'Apple Tree' }),
    ])

    expect(groups[0].subjects).toEqual(['Kale'])
    expect(groups[1].subjects).toEqual(['Apple Tree'])
  })

  it('lists a crop grown in several areas once', () => {
    const [group] = groupGeneratedTasks([
      task({ id: '1', plantName: 'Kale', areaName: 'Bed A' }),
      task({ id: '2', plantName: 'Kale', areaName: 'Bed B' }),
    ])

    expect(group.tasks).toHaveLength(2)
    expect(group.subjects).toEqual(['Kale'])
  })
})

describe('formatSubjects', () => {
  it('formats short and long lists', () => {
    expect(formatSubjects([])).toBe('')
    expect(formatSubjects(['Kale'])).toBe('Kale')
    expect(formatSubjects(['Kale', 'Leeks'])).toBe('Kale and Leeks')
    expect(formatSubjects(['Kale', 'Leeks', 'Parsnips'])).toBe('Kale, Leeks and Parsnips')
    expect(formatSubjects(['A', 'B', 'C', 'D'])).toBe('A, B, C and D')
    expect(formatSubjects(['A', 'B', 'C', 'D', 'E'])).toBe('A, B, C and 2 more')
  })
})

describe('getGroupBadge', () => {
  it('picks the most urgent badge, then the soonest day count', () => {
    expect(getGroupBadge([
      task({ urgency: 'upcoming', calculatedFrom: 'actual-date', daysRemaining: 10 }),
      task({ urgency: 'this-week', calculatedFrom: 'actual-date', daysRemaining: 5 }),
      task({ urgency: 'this-week', calculatedFrom: 'actual-date', daysRemaining: 2 }),
    ])?.text).toBe('2d')

    expect(getGroupBadge([
      task({ priority: 'high' }),
      task({ urgency: 'today', calculatedFrom: 'actual-date' }),
    ])?.text).toBe('Today')
  })

  it('returns null when no task has a badge', () => {
    expect(getGroupBadge([task({ priority: 'low' })])).toBeNull()
  })
})
