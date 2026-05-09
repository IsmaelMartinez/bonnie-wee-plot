import { describe, it, expect } from 'vitest'
import {
  addCompostPile,
  addCompostInput,
  addCompostEvent,
  updateCompostPile,
  removeCompostPile,
  getCompostPilesNeedingTurn,
  pileNeedsTurning,
  getLastActivityDate,
  NEEDS_TURNING_THRESHOLD_DAYS,
} from '@/services/compost-operations'
import type {
  CompostData,
  CompostPile,
  NewCompostPile,
} from '@/types/compost'

const NOW = new Date('2026-05-09T12:00:00.000Z')

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function emptyData(): CompostData {
  return {
    version: 1,
    piles: [],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  }
}

function makePile(overrides: Partial<CompostPile> = {}): CompostPile {
  return {
    id: 'pile-1',
    name: 'Bay 1',
    systemType: 'hot-compost',
    status: 'active',
    startDate: daysAgo(10),
    inputs: [],
    events: [],
    createdAt: daysAgo(10),
    updatedAt: NOW.toISOString(),
    ...overrides,
  }
}

describe('compost needs-turning predicate', () => {
  it('flags an active pile that has never been turned and is older than the threshold', () => {
    const pile = makePile({ startDate: daysAgo(NEEDS_TURNING_THRESHOLD_DAYS + 1) })
    expect(pileNeedsTurning(pile, NOW)).toBe(true)
  })

  it('does not flag a brand new pile within the threshold window', () => {
    const pile = makePile({ startDate: daysAgo(2) })
    expect(pileNeedsTurning(pile, NOW)).toBe(false)
  })

  it('resets the clock when the pile was turned recently', () => {
    const pile = makePile({
      startDate: daysAgo(60),
      events: [{ id: 'e1', date: daysAgo(1), type: 'turn' }],
    })
    expect(pileNeedsTurning(pile, NOW)).toBe(false)
  })

  it('resets the clock when a harvest event was logged recently', () => {
    const pile = makePile({
      startDate: daysAgo(30),
      events: [{ id: 'e1', date: daysAgo(2), type: 'harvest' }],
    })
    expect(pileNeedsTurning(pile, NOW)).toBe(false)
  })

  it('resets the clock when fresh material was added recently', () => {
    const pile = makePile({
      startDate: daysAgo(30),
      inputs: [{ id: 'i1', date: daysAgo(1), material: 'Grass clippings', type: 'green' }],
    })
    expect(pileNeedsTurning(pile, NOW)).toBe(false)
  })

  it('ignores water and other events when computing last activity', () => {
    const pile = makePile({
      startDate: daysAgo(30),
      events: [
        { id: 'e1', date: daysAgo(1), type: 'water' },
        { id: 'e2', date: daysAgo(1), type: 'other' },
      ],
    })
    expect(pileNeedsTurning(pile, NOW)).toBe(true)
  })

  it('never flags a ready pile', () => {
    const pile = makePile({ status: 'ready', startDate: daysAgo(60) })
    expect(pileNeedsTurning(pile, NOW)).toBe(false)
  })

  it('never flags an applied pile', () => {
    const pile = makePile({ status: 'applied', startDate: daysAgo(60) })
    expect(pileNeedsTurning(pile, NOW)).toBe(false)
  })

  it('flags a maturing pile that has gone quiet', () => {
    const pile = makePile({ status: 'maturing', startDate: daysAgo(30) })
    expect(pileNeedsTurning(pile, NOW)).toBe(true)
  })

  it('uses the most recent activity across events and inputs', () => {
    const pile = makePile({
      startDate: daysAgo(60),
      events: [{ id: 'e1', date: daysAgo(20), type: 'turn' }],
      inputs: [{ id: 'i1', date: daysAgo(1), material: 'Veg peelings', type: 'green' }],
    })
    expect(getLastActivityDate(pile)).toBe(daysAgo(1))
    expect(pileNeedsTurning(pile, NOW)).toBe(false)
  })
})

describe('getCompostPilesNeedingTurn reactivity across mutations', () => {
  function seed(): { data: CompostData; pileId: string } {
    let data = emptyData()
    const newPile: NewCompostPile = {
      name: 'Bay 1',
      systemType: 'hot-compost',
      status: 'active',
      startDate: daysAgo(NEEDS_TURNING_THRESHOLD_DAYS + 3),
    }
    data = addCompostPile(data, newPile)
    return { data, pileId: data.piles[0].id }
  }

  it('reports the pile when it has gone unturned past the threshold', () => {
    const { data } = seed()
    expect(getCompostPilesNeedingTurn(data, NOW)).toHaveLength(1)
  })

  it('drops the pile from the list after a turn event is logged', () => {
    const { data, pileId } = seed()
    const updated = addCompostEvent(data, pileId, { date: NOW.toISOString(), type: 'turn' })
    expect(getCompostPilesNeedingTurn(updated, NOW)).toHaveLength(0)
  })

  it('drops the pile from the list after a harvest event is logged', () => {
    const { data, pileId } = seed()
    const updated = addCompostEvent(data, pileId, { date: NOW.toISOString(), type: 'harvest' })
    expect(getCompostPilesNeedingTurn(updated, NOW)).toHaveLength(0)
  })

  it('drops the pile from the list after fresh material is added', () => {
    const { data, pileId } = seed()
    const updated = addCompostInput(data, pileId, {
      date: NOW.toISOString(),
      material: 'Coffee grounds',
      type: 'green',
    })
    expect(getCompostPilesNeedingTurn(updated, NOW)).toHaveLength(0)
  })

  it('drops the pile from the list when the user marks it ready (harvested out)', () => {
    const { data, pileId } = seed()
    const updated = updateCompostPile(data, pileId, { status: 'ready' })
    expect(getCompostPilesNeedingTurn(updated, NOW)).toHaveLength(0)
  })

  it('drops the pile from the list when the user empties it (status applied)', () => {
    const { data, pileId } = seed()
    const updated = updateCompostPile(data, pileId, { status: 'applied' })
    expect(getCompostPilesNeedingTurn(updated, NOW)).toHaveLength(0)
  })

  it('drops the pile from the list when the pile is removed entirely', () => {
    const { data, pileId } = seed()
    const updated = removeCompostPile(data, pileId)
    expect(getCompostPilesNeedingTurn(updated, NOW)).toHaveLength(0)
  })
})
