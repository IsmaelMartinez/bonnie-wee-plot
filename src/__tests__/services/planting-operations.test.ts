import { describe, it, expect } from 'vitest'
import { updatePlanting } from '@/services/planting-operations'
import type { AllotmentData, Planting } from '@/types/unified-allotment'

const YEAR = 2026

function makeData(planting: Planting): AllotmentData {
  return {
    version: 20,
    currentYear: YEAR,
    meta: {
      name: 'Test',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    layout: {
      areas: [{ id: 'bed-a', kind: 'rotation-bed', name: 'Bed A', canHavePlantings: true }],
    },
    seasons: [
      {
        year: YEAR,
        status: 'current',
        areas: [{ areaId: 'bed-a', plantings: [planting] }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ],
    varieties: [],
  }
}

describe('updatePlanting status auto-derivation', () => {
  it('promotes planned -> active when sowDate is added', () => {
    const data = makeData({ id: 'p1', plantId: 'lettuce', status: 'planned' })

    const result = updatePlanting(data, YEAR, 'bed-a', 'p1', { sowDate: '2026-04-06' })

    expect(result.seasons[0].areas[0].plantings[0].status).toBe('active')
    expect(result.seasons[0].areas[0].plantings[0].sowDate).toBe('2026-04-06')
  })

  it('promotes active -> harvested when actualHarvestEnd is added', () => {
    const data = makeData({
      id: 'p1',
      plantId: 'lettuce',
      status: 'active',
      sowDate: '2026-04-06',
    })

    const result = updatePlanting(data, YEAR, 'bed-a', 'p1', {
      actualHarvestEnd: '2026-06-15',
    })

    expect(result.seasons[0].areas[0].plantings[0].status).toBe('harvested')
  })

  it('preserves removed status when dates change', () => {
    const data = makeData({
      id: 'p1',
      plantId: 'lettuce',
      status: 'removed',
      sowDate: '2026-04-06',
    })

    const result = updatePlanting(data, YEAR, 'bed-a', 'p1', { sowDate: '2026-04-10' })

    expect(result.seasons[0].areas[0].plantings[0].status).toBe('removed')
  })

  it('does not override an explicitly set status', () => {
    const data = makeData({ id: 'p1', plantId: 'lettuce', status: 'planned' })

    const result = updatePlanting(data, YEAR, 'bed-a', 'p1', {
      sowDate: '2026-04-06',
      status: 'planned',
    })

    expect(result.seasons[0].areas[0].plantings[0].status).toBe('planned')
  })

  it('demotes active back to planned when sowDate is cleared', () => {
    const data = makeData({
      id: 'p1',
      plantId: 'lettuce',
      status: 'active',
      sowDate: '2026-04-06',
    })

    const result = updatePlanting(data, YEAR, 'bed-a', 'p1', { sowDate: undefined })

    expect(result.seasons[0].areas[0].plantings[0].status).toBe('planned')
  })

  it('leaves status alone when only non-date fields change', () => {
    const data = makeData({
      id: 'p1',
      plantId: 'lettuce',
      status: 'planned',
      varietyName: 'Old',
    })

    const result = updatePlanting(data, YEAR, 'bed-a', 'p1', { varietyName: 'New' })

    expect(result.seasons[0].areas[0].plantings[0].status).toBe('planned')
  })
})
