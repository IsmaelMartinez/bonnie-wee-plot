/**
 * useAllotmentPlantings.updatePlanting against a real SyncedStore.
 *
 * Regression: clearing a date in the planting Dates tab sends the field as
 * `undefined`. The write must delete it from the Yjs doc (assignDefined
 * alone skips undefined), and status must be re-inferred — so clearing
 * "Harvest Finished" turns a harvested planting back to active.
 */
import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useAllotmentPlantings } from '@/hooks/allotment/useAllotmentPlantings'
import { createAllotmentDoc, hydrateFromJson, serializeToJson } from '@/lib/yjs/allotment-yjs'
import type { AllotmentData, Planting } from '@/types/unified-allotment'

const YEAR = 2026

function seed(planting: Planting): AllotmentData {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    version: 23,
    meta: { name: 'Test', createdAt: now, updatedAt: now },
    layout: { areas: [{ id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', canHavePlantings: true }] },
    seasons: [{
      year: YEAR,
      status: 'current',
      createdAt: now,
      updatedAt: now,
      areas: [{ areaId: 'bed-a', rotationGroup: 'roots', notes: [], plantings: [planting] }],
    }],
    currentYear: YEAR,
    maintenanceTasks: [],
    varieties: [],
    gardenEvents: [],
  } as unknown as AllotmentData
}

function setup(planting: Planting) {
  const { store } = createAllotmentDoc()
  hydrateFromJson(store, seed(planting))
  const { result } = renderHook(() =>
    useAllotmentPlantings({
      data: serializeToJson(store),
      mutate: (fn) => fn(store),
      selectedYear: YEAR,
    })
  )
  const read = () => serializeToJson(store).seasons[0].areas[0].plantings[0]
  return { result, read }
}

describe('useAllotmentPlantings.updatePlanting', () => {
  it('marks a planting harvested when a harvest end date is set', () => {
    const { result, read } = setup({ id: 'p1', plantId: 'carrot', sowDate: '2026-04-01', actualHarvestStart: '2026-07-20', status: 'active' })

    act(() => result.current.updatePlanting('bed-a', 'p1', { actualHarvestEnd: '2026-09-05' }))

    expect(read().actualHarvestEnd).toBe('2026-09-05')
    expect(read().status).toBe('harvested')
  })

  it('clears the harvest end date and returns the planting to active', () => {
    const { result, read } = setup({
      id: 'p1', plantId: 'carrot', sowDate: '2026-04-01',
      actualHarvestStart: '2026-07-20', actualHarvestEnd: '2026-09-05', status: 'harvested',
    })

    act(() => result.current.updatePlanting('bed-a', 'p1', { actualHarvestEnd: undefined }))

    expect(read()).not.toHaveProperty('actualHarvestEnd')
    expect(read().status).toBe('active')
  })

  it('clears other emptied fields while leaving untouched ones alone', () => {
    const { result, read } = setup({ id: 'p1', plantId: 'carrot', sowDate: '2026-04-01', notes: 'keep me', status: 'active' })

    act(() => result.current.updatePlanting('bed-a', 'p1', { sowDate: undefined }))

    expect(read()).not.toHaveProperty('sowDate')
    expect(read().notes).toBe('keep me')
    expect(read().status).toBe('planned')
  })
})
