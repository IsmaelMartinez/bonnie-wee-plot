import { describe, it, expect } from 'vitest'
import { diffAllotment, summariseDiff, isEmptyDiff } from '@/lib/allotment-diff'
import type {
  AllotmentData,
  Area,
  Planting,
  StoredVariety,
  SeasonRecord,
} from '@/types/unified-allotment'

function area(id: string, name: string, overrides: Partial<Area> = {}): Area {
  return {
    id,
    name,
    kind: 'rotation-bed',
    canHavePlantings: true,
    ...overrides,
  }
}

function variety(id: string, name: string, overrides: Partial<StoredVariety> = {}): StoredVariety {
  return {
    id,
    plantId: 'tomato',
    name,
    seedsByYear: {},
    ...overrides,
  }
}

function planting(id: string, plantId: string, overrides: Partial<Planting> = {}): Planting {
  return {
    id,
    plantId,
    ...overrides,
  }
}

function season(year: number, areas: Array<{ areaId: string; plantings: Planting[] }>): SeasonRecord {
  return {
    year,
    status: 'current',
    areas: areas.map((a) => ({
      areaId: a.areaId,
      plantings: a.plantings,
    })),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

function buildData(overrides: Partial<AllotmentData> = {}): AllotmentData {
  return {
    version: 21,
    meta: {
      name: 'Test Allotment',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    layout: { areas: [] },
    seasons: [],
    currentYear: 2026,
    varieties: [],
    ...overrides,
  }
}

describe('diffAllotment', () => {
  it('returns empty diff for identical snapshots → "No changes"', () => {
    const data = buildData({
      layout: { areas: [area('bed-a', 'Bed A')] },
      varieties: [variety('v1', 'Kelvedon')],
      seasons: [
        season(2026, [
          { areaId: 'bed-a', plantings: [planting('p1', 'tomato', { sowDate: '2026-04-01' })] },
        ]),
      ],
    })

    const diff = diffAllotment(data, data)
    expect(isEmptyDiff(diff)).toBe(true)
    expect(summariseDiff(diff)).toBe('No changes')
  })

  it('treats timestamp-only meta churn as no meaningful change', () => {
    const oldData = buildData({
      meta: {
        name: 'Test Allotment',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      layout: { areas: [area('bed-a', 'Bed A')] },
    })
    const newData = buildData({
      meta: {
        name: 'Test Allotment',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-05-09T12:34:56Z', // only updatedAt changed
      },
      layout: { areas: [area('bed-a', 'Bed A')] },
    })

    const diff = diffAllotment(oldData, newData)
    expect(isEmptyDiff(diff)).toBe(true)
    expect(summariseDiff(diff)).toBe('No changes')
  })

  describe('areas', () => {
    it('detects added areas', () => {
      const oldData = buildData({ layout: { areas: [area('bed-a', 'Bed A')] } })
      const newData = buildData({
        layout: { areas: [area('bed-a', 'Bed A'), area('bed-b', 'Bed B')] },
      })

      const diff = diffAllotment(oldData, newData)
      expect(diff.areas.added).toEqual(['Bed B'])
      expect(diff.areas.removed).toEqual([])
      expect(diff.areas.renamed).toEqual([])
      expect(summariseDiff(diff)).toBe('+1 area')
    })

    it('detects removed areas', () => {
      const oldData = buildData({
        layout: { areas: [area('bed-a', 'Bed A'), area('bed-b', 'Bed B')] },
      })
      const newData = buildData({ layout: { areas: [area('bed-a', 'Bed A')] } })

      const diff = diffAllotment(oldData, newData)
      expect(diff.areas.added).toEqual([])
      expect(diff.areas.removed).toEqual(['Bed B'])
      expect(summariseDiff(diff)).toBe('−1 area')
    })

    it('detects renamed areas (same id, different name)', () => {
      const oldData = buildData({ layout: { areas: [area('bed-a', 'Old Name')] } })
      const newData = buildData({ layout: { areas: [area('bed-a', 'New Name')] } })

      const diff = diffAllotment(oldData, newData)
      expect(diff.areas.added).toEqual([])
      expect(diff.areas.removed).toEqual([])
      expect(diff.areas.renamed).toEqual([
        { id: 'bed-a', from: 'Old Name', to: 'New Name' },
      ])
      expect(summariseDiff(diff)).toBe('1 renamed')
    })

    it('handles multiple area added/removed pluralisation', () => {
      const oldData = buildData({
        layout: { areas: [area('a', 'A'), area('b', 'B')] },
      })
      const newData = buildData({
        layout: { areas: [area('c', 'C'), area('d', 'D'), area('e', 'E')] },
      })

      const diff = diffAllotment(oldData, newData)
      expect(diff.areas.added).toEqual(['C', 'D', 'E'])
      expect(diff.areas.removed).toEqual(['A', 'B'])
      expect(summariseDiff(diff)).toBe('+3 areas, −2 areas')
    })
  })

  describe('plantings', () => {
    it('detects added plantings', () => {
      const oldData = buildData({
        layout: { areas: [area('bed-a', 'Bed A')] },
        seasons: [season(2026, [{ areaId: 'bed-a', plantings: [] }])],
      })
      const newData = buildData({
        layout: { areas: [area('bed-a', 'Bed A')] },
        seasons: [
          season(2026, [
            {
              areaId: 'bed-a',
              plantings: [planting('p1', 'tomato'), planting('p2', 'pepper')],
            },
          ]),
        ],
      })

      const diff = diffAllotment(oldData, newData)
      expect(diff.plantings).toEqual({ added: 2, removed: 0, edited: 0 })
      expect(summariseDiff(diff)).toBe('+2 plantings')
    })

    it('detects removed plantings', () => {
      const oldData = buildData({
        layout: { areas: [area('bed-a', 'Bed A')] },
        seasons: [
          season(2026, [
            { areaId: 'bed-a', plantings: [planting('p1', 'tomato')] },
          ]),
        ],
      })
      const newData = buildData({
        layout: { areas: [area('bed-a', 'Bed A')] },
        seasons: [season(2026, [{ areaId: 'bed-a', plantings: [] }])],
      })

      const diff = diffAllotment(oldData, newData)
      expect(diff.plantings).toEqual({ added: 0, removed: 1, edited: 0 })
      expect(summariseDiff(diff)).toBe('−1 planting')
    })

    it('detects edited plantings (same id, non-id field differs)', () => {
      const oldData = buildData({
        layout: { areas: [area('bed-a', 'Bed A')] },
        seasons: [
          season(2026, [
            {
              areaId: 'bed-a',
              plantings: [planting('p1', 'tomato', { sowDate: '2026-04-01' })],
            },
          ]),
        ],
      })
      const newData = buildData({
        layout: { areas: [area('bed-a', 'Bed A')] },
        seasons: [
          season(2026, [
            {
              areaId: 'bed-a',
              plantings: [
                planting('p1', 'tomato', { sowDate: '2026-04-01', notes: 'doing well' }),
              ],
            },
          ]),
        ],
      })

      const diff = diffAllotment(oldData, newData)
      expect(diff.plantings).toEqual({ added: 0, removed: 0, edited: 1 })
      expect(summariseDiff(diff)).toBe('1 edited')
    })

    it('walks across all seasons and accumulates counts', () => {
      const oldData = buildData({
        layout: { areas: [area('a', 'A')] },
        seasons: [
          season(2025, [{ areaId: 'a', plantings: [planting('p1', 'tomato')] }]),
          season(2026, [{ areaId: 'a', plantings: [planting('p2', 'pepper')] }]),
        ],
      })
      const newData = buildData({
        layout: { areas: [area('a', 'A')] },
        seasons: [
          season(2025, [
            {
              areaId: 'a',
              plantings: [
                planting('p1', 'tomato', { notes: 'edited' }), // edit
                planting('p3', 'lettuce'), // add
              ],
            },
          ]),
          season(2026, [{ areaId: 'a', plantings: [] }]), // remove p2
        ],
      })

      const diff = diffAllotment(oldData, newData)
      expect(diff.plantings).toEqual({ added: 1, removed: 1, edited: 1 })
    })
  })

  describe('varieties', () => {
    it('detects added varieties', () => {
      const oldData = buildData({ varieties: [variety('v1', 'Kelvedon')] })
      const newData = buildData({
        varieties: [variety('v1', 'Kelvedon'), variety('v2', 'Sungold')],
      })

      const diff = diffAllotment(oldData, newData)
      expect(diff.varieties.added).toEqual(['Sungold'])
      expect(summariseDiff(diff)).toBe('+1 variety')
    })

    it('detects removed varieties', () => {
      const oldData = buildData({
        varieties: [variety('v1', 'Kelvedon'), variety('v2', 'Sungold')],
      })
      const newData = buildData({ varieties: [variety('v1', 'Kelvedon')] })

      const diff = diffAllotment(oldData, newData)
      expect(diff.varieties.removed).toEqual(['Sungold'])
      expect(summariseDiff(diff)).toBe('−1 variety')
    })

    it('detects renamed varieties', () => {
      const oldData = buildData({ varieties: [variety('v1', 'Old Variety')] })
      const newData = buildData({ varieties: [variety('v1', 'New Variety')] })

      const diff = diffAllotment(oldData, newData)
      expect(diff.varieties.renamed).toEqual([
        { id: 'v1', from: 'Old Variety', to: 'New Variety' },
      ])
      expect(summariseDiff(diff)).toBe('1 variety rename')
    })

    it('pluralises varieties summary correctly', () => {
      const oldData = buildData({
        varieties: [variety('v1', 'A'), variety('v2', 'B')],
      })
      const newData = buildData({
        varieties: [
          variety('v1', 'A'),
          variety('v2', 'B'),
          variety('v3', 'C'),
          variety('v4', 'D'),
        ],
      })

      const diff = diffAllotment(oldData, newData)
      expect(summariseDiff(diff)).toBe('+2 varieties')
    })
  })

  describe('schema version', () => {
    it('records schema version bump', () => {
      const oldData = buildData({ version: 20 })
      const newData = buildData({ version: 21 })

      const diff = diffAllotment(oldData, newData)
      expect(diff.meta.schemaVersionChanged).toEqual({ from: 20, to: 21 })
      expect(summariseDiff(diff)).toBe('schema v20→v21')
    })

    it('does not record when schema versions match', () => {
      const oldData = buildData({ version: 21 })
      const newData = buildData({ version: 21 })

      const diff = diffAllotment(oldData, newData)
      expect(diff.meta.schemaVersionChanged).toBeUndefined()
    })
  })

  describe('combined changes', () => {
    it('summarises a multi-axis change in a single line', () => {
      const oldData = buildData({
        version: 20,
        layout: { areas: [area('a', 'A'), area('b', 'B')] },
        varieties: [variety('v1', 'Old')],
        seasons: [
          season(2026, [
            { areaId: 'a', plantings: [planting('p1', 'tomato')] },
          ]),
        ],
      })
      const newData = buildData({
        version: 21,
        layout: { areas: [area('a', 'A renamed'), area('c', 'C')] }, // remove b, add c, rename a
        varieties: [variety('v1', 'Old'), variety('v2', 'New')], // add v2
        seasons: [
          season(2026, [
            {
              areaId: 'a',
              plantings: [
                planting('p1', 'tomato', { notes: 'edit' }), // edit
                planting('p2', 'pepper'), // add
              ],
            },
          ]),
        ],
      })

      const diff = diffAllotment(oldData, newData)
      expect(diff.areas.added).toEqual(['C'])
      expect(diff.areas.removed).toEqual(['B'])
      expect(diff.areas.renamed).toEqual([{ id: 'a', from: 'A', to: 'A renamed' }])
      expect(diff.plantings).toEqual({ added: 1, removed: 0, edited: 1 })
      expect(diff.varieties.added).toEqual(['New'])
      expect(diff.meta.schemaVersionChanged).toEqual({ from: 20, to: 21 })

      expect(summariseDiff(diff)).toBe(
        '+1 area, −1 area, 1 renamed, +1 planting, 1 edited, +1 variety, schema v20→v21',
      )
    })
  })
})
