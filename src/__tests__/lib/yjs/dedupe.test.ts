/**
 * Allotment de-duplication (ADR 027 Step 4 safety net).
 *
 * `dedupeAllotmentData` is the convergence guarantee that repairs a document
 * duplicated by a bad lineage-merge, without depending on the adoption gate
 * holding. These tests pin the two contracts `useYjsDoc` relies on:
 *  - a clean document is returned unchanged (`changed: false`) so a healthy
 *    doc is never rewritten;
 *  - every id-keyed collection (and the season/area/planting nesting) collapses
 *    to a single copy, unioning plantings so none are lost.
 */

import { describe, expect, it } from 'vitest'
import { dedupeAllotmentData } from '@/lib/yjs/dedupe'
import type { AllotmentData } from '@/types/unified-allotment'

function makeClean(): AllotmentData {
  return {
    version: 22,
    currentYear: 2026,
    meta: {
      name: 'Test Allotment',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2026-05-12T10:00:00.000Z',
    },
    layout: {
      areas: [
        { id: 'bed-a', name: 'Bed A', kind: 'rotation-bed', canHavePlantings: true, createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'bed-b', name: 'Bed B', kind: 'rotation-bed', canHavePlantings: true, createdAt: '2025-01-01T00:00:00.000Z' },
      ],
    },
    seasons: [
      {
        year: 2026,
        status: 'current',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-05-12T10:00:00.000Z',
        areas: [
          { areaId: 'bed-a', plantings: [{ id: 'p1', plantId: 'peas' }, { id: 'p2', plantId: 'beans' }] },
        ],
      },
    ],
    customTasks: [{ id: 't1', description: 'Weed', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }],
    maintenanceTasks: [],
    gardenEvents: [{ id: 'e1', type: 'prune', date: '2026-02-01', createdAt: '2026-02-01T00:00:00.000Z' }],
    varieties: [{ id: 'var-1', plantId: 'peas', name: 'Kelvedon Wonder', seedsByYear: { 2026: 'have' } }],
    compost: [{ id: 'compost-1', name: 'Main bin', createdAt: '2026-01-01T00:00:00.000Z' }],
  } as unknown as AllotmentData
}

describe('dedupeAllotmentData', () => {
  it('returns a clean document unchanged', () => {
    const clean = makeClean()
    const { data, changed } = dedupeAllotmentData(clean)
    expect(changed).toBe(false)
    expect(data).toEqual(clean)
  })

  it('collapses duplicated areas, varieties, compost, tasks and events by id', () => {
    const dup = makeClean()
    // Simulate a whole-document lineage merge: every collection doubled.
    dup.layout.areas = [...dup.layout.areas, ...dup.layout.areas.map((a) => ({ ...a }))]
    dup.varieties = [...dup.varieties, ...dup.varieties.map((v) => ({ ...v }))]
    dup.compost = [...dup.compost!, ...dup.compost!.map((c) => ({ ...c }))]
    dup.customTasks = [...dup.customTasks!, ...dup.customTasks!.map((t) => ({ ...t }))]
    dup.gardenEvents = [...dup.gardenEvents!, ...dup.gardenEvents!.map((e) => ({ ...e }))]

    const { data, changed } = dedupeAllotmentData(dup)

    expect(changed).toBe(true)
    expect(data.layout.areas.map((a) => a.id)).toEqual(['bed-a', 'bed-b'])
    expect(data.varieties.map((v) => v.id)).toEqual(['var-1'])
    expect(data.compost!.map((c) => c.id)).toEqual(['compost-1'])
    expect(data.customTasks!.map((t) => t.id)).toEqual(['t1'])
    expect(data.gardenEvents!.map((e) => e.id)).toEqual(['e1'])
  })

  it('collapses duplicated seasons by year and unions their plantings', () => {
    const dup = makeClean()
    // Two copies of the 2026 season; the second copy carries an extra planting
    // that must survive the union.
    const season = dup.seasons[0]
    const secondCopy = JSON.parse(JSON.stringify(season)) as typeof season
    secondCopy.areas[0].plantings.push({ id: 'p3', plantId: 'kale' } as never)
    dup.seasons = [season, secondCopy]

    const { data, changed } = dedupeAllotmentData(dup)

    expect(changed).toBe(true)
    expect(data.seasons.map((s) => s.year)).toEqual([2026])
    const plantings = data.seasons[0].areas[0].plantings
    expect(plantings.map((p) => p.id).sort()).toEqual(['p1', 'p2', 'p3'])
  })

  it('collapses duplicated plantings within a single area', () => {
    const dup = makeClean()
    const area = dup.seasons[0].areas[0]
    area.plantings = [...area.plantings, ...area.plantings.map((p) => ({ ...p }))]

    const { data, changed } = dedupeAllotmentData(dup)

    expect(changed).toBe(true)
    expect(data.seasons[0].areas[0].plantings.map((p) => p.id)).toEqual(['p1', 'p2'])
  })

  it('collapses duplicated area entries within a single season, unioning plantings', () => {
    const dup = makeClean()
    const season = dup.seasons[0]
    season.areas = [
      { areaId: 'bed-a', plantings: [{ id: 'p1', plantId: 'peas' } as never] },
      { areaId: 'bed-a', plantings: [{ id: 'p2', plantId: 'beans' } as never] },
    ]

    const { data, changed } = dedupeAllotmentData(dup)

    expect(changed).toBe(true)
    expect(data.seasons[0].areas.map((a) => a.areaId)).toEqual(['bed-a'])
    expect(data.seasons[0].areas[0].plantings.map((p) => p.id).sort()).toEqual(['p1', 'p2'])
  })

  it('unions notes and careLogs (by id) when collapsing duplicate area entries', () => {
    const dup = makeClean()
    const season = dup.seasons[0]
    season.areas = [
      {
        areaId: 'bed-a',
        plantings: [],
        notes: [{ id: 'n1', content: 'shared', type: 'info', createdAt: 'x', updatedAt: 'x' }],
        careLogs: [{ id: 'cl1', type: 'water', date: '2026-03-01' }],
      },
      {
        areaId: 'bed-a',
        plantings: [],
        notes: [
          { id: 'n1', content: 'shared', type: 'info', createdAt: 'x', updatedAt: 'x' },
          { id: 'n2', content: 'only on the duplicate', type: 'warning', createdAt: 'x', updatedAt: 'x' },
        ],
        careLogs: [{ id: 'cl2', type: 'feed', date: '2026-03-02' }],
      },
    ] as never

    const { data, changed } = dedupeAllotmentData(dup)

    expect(changed).toBe(true)
    const area = data.seasons[0].areas[0]
    // n1 not doubled, n2 preserved from the dropped duplicate.
    expect(area.notes!.map((n) => n.id).sort()).toEqual(['n1', 'n2'])
    expect(area.careLogs!.map((c) => c.id).sort()).toEqual(['cl1', 'cl2'])
  })

  it('fills area fields the kept copy is missing from the dropped duplicate', () => {
    const dup = makeClean()
    dup.seasons[0].areas = [
      { areaId: 'bed-a', plantings: [] },
      { areaId: 'bed-a', plantings: [], harvestTotal: 3, harvestUnit: 'kg' },
    ] as never

    const { data } = dedupeAllotmentData(dup)

    const area = data.seasons[0].areas[0]
    expect(area.harvestTotal).toBe(3)
    expect(area.harvestUnit).toBe('kg')
  })

  it('preserves season metadata (earliest createdAt, latest updatedAt) when collapsing by year', () => {
    const dup = makeClean()
    const base = dup.seasons[0]
    base.createdAt = '2026-01-05T00:00:00.000Z'
    base.updatedAt = '2026-05-01T00:00:00.000Z'
    const other = JSON.parse(JSON.stringify(base)) as typeof base
    other.createdAt = '2026-01-01T00:00:00.000Z' // earlier
    other.updatedAt = '2026-06-01T00:00:00.000Z' // later
    dup.seasons = [base, other]

    const { data, changed } = dedupeAllotmentData(dup)

    expect(changed).toBe(true)
    expect(data.seasons).toHaveLength(1)
    expect(data.seasons[0].createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(data.seasons[0].updatedAt).toBe('2026-06-01T00:00:00.000Z')
  })

  it('does not mutate the input', () => {
    const dup = makeClean()
    dup.layout.areas.push({ ...dup.layout.areas[0] })
    const before = JSON.stringify(dup)
    dedupeAllotmentData(dup)
    expect(JSON.stringify(dup)).toBe(before)
  })
})
