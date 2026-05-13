import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import {
  createAllotmentDoc,
  hydrateFromJson,
  serializeToJson,
  encodeDocState,
  decodeDocState,
} from '@/lib/yjs-spike/allotment-yjs'
import type { AllotmentData } from '@/types/unified-allotment'

function makeFixture(): AllotmentData {
  return {
    version: 22,
    currentYear: 2026,
    meta: {
      name: 'Test Allotment',
      location: 'Edinburgh',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2026-05-12T10:00:00.000Z',
      coordinates: { latitude: 55.9533, longitude: -3.1883 },
      frostDates: {
        lastSpring: '2026-05-15',
        firstAutumn: '2026-10-31',
        fetchedAt: '2026-05-01T00:00:00.000Z',
      },
      aiAdvisorEnabled: true,
    },
    layout: {
      areas: [
        {
          id: 'bed-a',
          name: 'Bed A',
          kind: 'rotation-bed',
          canHavePlantings: true,
          rotationGroup: 'legumes',
          gridPosition: { x: 0, y: 0, w: 2, h: 1 },
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'apple-north',
          name: 'North Apple',
          kind: 'tree',
          canHavePlantings: false,
          primaryPlant: {
            plantId: 'apple',
            variety: 'Bramley',
            plantedYear: 2020,
            status: 'productive',
          },
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    },
    seasons: [
      {
        year: 2026,
        status: 'current',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-05-12T10:00:00.000Z',
        areas: [
          {
            areaId: 'bed-a',
            rotationGroup: 'legumes',
            plantings: [
              {
                id: 'planting-1',
                plantId: 'peas',
                varietyName: 'Kelvedon Wonder',
                sowDate: '2026-04-01',
                sowMethod: 'outdoor',
                status: 'active',
              },
              {
                id: 'planting-2',
                plantId: 'broad-beans',
                sowDate: '2026-03-15',
                sowMethod: 'outdoor',
                status: 'active',
              },
            ],
            notes: [
              {
                id: 'note-1',
                content: 'Watch for slugs',
                type: 'warning',
                createdAt: '2026-04-02T00:00:00.000Z',
                updatedAt: '2026-04-02T00:00:00.000Z',
              },
            ],
          },
        ],
      },
    ],
    customTasks: [
      {
        id: 'task-1',
        description: 'Order tomato seeds',
        completed: false,
        createdAt: '2026-01-10T00:00:00.000Z',
      },
    ],
    maintenanceTasks: [
      {
        id: 'maint-1',
        areaId: 'apple-north',
        type: 'prune',
        month: 1,
        description: 'Winter prune',
      },
    ],
    gardenEvents: [],
    varieties: [
      {
        id: 'var-1',
        plantId: 'peas',
        name: 'Kelvedon Wonder',
        supplier: 'Thompson & Morgan',
        seedsByYear: { 2026: 'have', 2025: 'had' },
      },
      {
        id: 'var-2',
        plantId: 'tomato',
        name: 'Gardener’s Delight',
        seedsByYear: { 2026: 'ordered' },
      },
    ],
    compost: [
      {
        id: 'pile-1',
        name: 'Bay 1',
        systemType: 'cold-compost',
        status: 'active',
        startDate: '2026-02-01',
        inputs: [
          {
            id: 'input-1',
            date: '2026-02-01',
            material: 'Kitchen scraps',
            type: 'green',
          },
        ],
        events: [],
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
    ],
  }
}

describe('yjs-spike: allotment-yjs', () => {
  describe('hydrate + serialize round-trip', () => {
    it('preserves the full AllotmentData shape', () => {
      const original = makeFixture()
      const { store } = createAllotmentDoc()
      hydrateFromJson(store, original)

      const result = serializeToJson(store)

      expect(result).toEqual(original)
    })

    it('is idempotent — re-hydrating with the same data does not duplicate', () => {
      const original = makeFixture()
      const { store } = createAllotmentDoc()
      hydrateFromJson(store, original)
      hydrateFromJson(store, original)

      const result = serializeToJson(store)
      expect(result).toEqual(original)
    })

    it('replaces rather than appends when re-hydrating with different data', () => {
      const first = makeFixture()
      const second: AllotmentData = {
        ...first,
        layout: {
          areas: [
            {
              id: 'bed-z',
              name: 'New Layout — Bed Z',
              kind: 'rotation-bed',
              canHavePlantings: true,
              createdAt: '2026-06-01T00:00:00.000Z',
            },
          ],
        },
        seasons: [],
        varieties: [],
        compost: [],
      }
      const { store } = createAllotmentDoc()
      hydrateFromJson(store, first)
      hydrateFromJson(store, second)

      const result = serializeToJson(store)
      expect(result.layout.areas).toHaveLength(1)
      expect(result.layout.areas[0].id).toBe('bed-z')
      expect(result.seasons).toHaveLength(0)
      expect(result.varieties).toHaveLength(0)
    })

    it('clears meta keys absent from the new input on re-hydrate', () => {
      // Re-hydration must reset stale meta fields, not preserve them.
      // assignDefined skips undefined source values, so an explicit
      // clear of the meta Y.Map is required for the missing-key case.
      const withRichMeta: AllotmentData = {
        ...makeFixture(),
        meta: {
          name: 'Edinburgh Allotment',
          location: 'Edinburgh',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2026-05-12T00:00:00.000Z',
          aiAdvisorEnabled: true,
          coordinates: { latitude: 55.95, longitude: -3.18 },
        },
      }
      const withMinimalMeta: AllotmentData = {
        ...withRichMeta,
        meta: {
          name: 'Renamed',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2026-05-13T00:00:00.000Z',
        },
      }

      const { store } = createAllotmentDoc()
      hydrateFromJson(store, withRichMeta)
      hydrateFromJson(store, withMinimalMeta)

      const result = serializeToJson(store)
      expect(result.meta.name).toBe('Renamed')
      expect(result.meta.aiAdvisorEnabled).toBeUndefined()
      expect(result.meta.coordinates).toBeUndefined()
      expect(result.meta.location).toBeUndefined()
    })

    it('normalises optional top-level undefined arrays to empty arrays', () => {
      // SyncedStore cannot distinguish "field never set" from "field
      // is an empty array" once hydrate runs — both leave a 0-length
      // Y.Array. The canonical serialized form is the empty-array
      // case, matching how the rest of the codebase treats these
      // fields (`data.gardenEvents ?? []`). Asymmetric round-trip
      // when the original input had these fields undefined.
      const minimal: AllotmentData = {
        version: 22,
        currentYear: 2026,
        meta: {
          name: 'Minimal',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        layout: { areas: [] },
        seasons: [],
        varieties: [],
        // customTasks, maintenanceTasks, gardenEvents, compost left undefined
      }
      const { store } = createAllotmentDoc()
      hydrateFromJson(store, minimal)

      const result = serializeToJson(store)
      expect(result.customTasks).toEqual([])
      expect(result.maintenanceTasks).toEqual([])
      expect(result.gardenEvents).toEqual([])
      expect(result.compost).toEqual([])
      expect(result.seasons).toEqual([])
      expect(result.varieties).toEqual([])
      expect(result.layout.areas).toEqual([])
    })

    it('drops undefined fields without throwing', () => {
      const original: AllotmentData = {
        ...makeFixture(),
        // Optional meta fields left undefined — must not blow up the hydrate path
        meta: {
          name: 'Minimal',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      }
      const { store } = createAllotmentDoc()
      hydrateFromJson(store, original)

      const result = serializeToJson(store)
      expect(result.meta).toEqual(original.meta)
      expect(result.meta.coordinates).toBeUndefined()
    })
  })

  describe('mutations through the proxy', () => {
    it('reflects a new planting added via proxy mutation', () => {
      const { store } = createAllotmentDoc()
      hydrateFromJson(store, makeFixture())

      store.seasons[0].areas[0].plantings.push({
        id: 'planting-3',
        plantId: 'carrot',
        sowDate: '2026-05-01',
        sowMethod: 'outdoor',
        status: 'active',
      })

      const result = serializeToJson(store)
      expect(result.seasons[0].areas[0].plantings).toHaveLength(3)
      expect(result.seasons[0].areas[0].plantings[2].plantId).toBe('carrot')
    })

    it('reflects a variety seedsByYear update', () => {
      const { store } = createAllotmentDoc()
      hydrateFromJson(store, makeFixture())

      store.varieties[1].seedsByYear[2026] = 'have'

      const result = serializeToJson(store)
      expect(result.varieties[1].seedsByYear[2026]).toBe('have')
    })

    it('reflects an area name rename', () => {
      const { store } = createAllotmentDoc()
      hydrateFromJson(store, makeFixture())

      store.areas[0].name = 'Bed A — peas + beans'

      const result = serializeToJson(store)
      expect(result.layout.areas[0].name).toBe('Bed A — peas + beans')
    })
  })

  describe('binary state encoding', () => {
    it('round-trips through encodeDocState / decodeDocState', () => {
      const original = makeFixture()
      const { store: src, doc: srcDoc } = createAllotmentDoc()
      hydrateFromJson(src, original)

      const update = encodeDocState(srcDoc)
      expect(update).toBeInstanceOf(Uint8Array)
      expect(update.length).toBeGreaterThan(0)

      const { store: dst } = decodeDocState(update)
      const result = serializeToJson(dst)
      expect(result).toEqual(original)
    })

    it('logs the binary-to-JSON size ratio (cost-line smoke test)', () => {
      // Data point for the cost-line risk in ADR 027. The fixture is
      // small (~2 KB) so the Yjs binary is expected to be larger than
      // the JSON here — CRDT metadata is a fixed overhead that only
      // amortises away on bigger documents. We log the ratio rather
      // than asserting a bound; a realistic multi-season fixture is
      // tracked separately.
      const original = makeFixture()
      const { store, doc } = createAllotmentDoc()
      hydrateFromJson(store, original)

      const binarySize = encodeDocState(doc).length
      const jsonSize = new TextEncoder().encode(JSON.stringify(original)).length

      console.log(
        `[yjs-spike] fixture sizes — JSON: ${jsonSize}B, Yjs binary: ${binarySize}B, ratio: ${(
          binarySize / jsonSize
        ).toFixed(2)}`,
      )
      // Sanity floor — we just want a non-empty encoding.
      expect(binarySize).toBeGreaterThan(0)
    })
  })

  describe('CRDT semantics — the headline win', () => {
    it('merges concurrent edits on different plantings without conflict', () => {
      const original = makeFixture()
      const { store: storeA, doc: docA } = createAllotmentDoc()
      hydrateFromJson(storeA, original)

      // Snapshot the doc and clone it to a second instance — simulates
      // two devices that have synced the same baseline.
      const baseline = encodeDocState(docA)
      const { store: storeB, doc: docB } = decodeDocState(baseline)

      // Device A renames Bed A. Device B adds a planting to Bed A.
      // Pre-CRDT this would be a conflict requiring user resolution;
      // here both should land.
      storeA.areas[0].name = 'Bed A — renamed by A'
      storeB.seasons[0].areas[0].plantings.push({
        id: 'planting-3',
        plantId: 'lettuce',
        sowDate: '2026-05-01',
        sowMethod: 'outdoor',
        status: 'active',
      })

      // Cross-apply each side's updates to the other.
      const updateFromA = Y.encodeStateAsUpdate(docA)
      const updateFromB = Y.encodeStateAsUpdate(docB)
      Y.applyUpdate(docB, updateFromA)
      Y.applyUpdate(docA, updateFromB)

      const resultA = serializeToJson(storeA)
      const resultB = serializeToJson(storeB)

      expect(resultA).toEqual(resultB)
      expect(resultA.layout.areas[0].name).toBe('Bed A — renamed by A')
      expect(resultA.seasons[0].areas[0].plantings).toHaveLength(3)
      expect(resultA.seasons[0].areas[0].plantings[2].plantId).toBe('lettuce')
    })

    it('handles concurrent edits to the same field via last-writer-wins on the Y.Map', () => {
      const original = makeFixture()
      const { store: storeA, doc: docA } = createAllotmentDoc()
      hydrateFromJson(storeA, original)
      const baseline = encodeDocState(docA)
      const { store: storeB, doc: docB } = decodeDocState(baseline)

      // Same field, two writers. Yjs resolves at the Y.Map level by
      // origin/clock; either value can win but both docs must converge.
      storeA.areas[0].name = 'A-name'
      storeB.areas[0].name = 'B-name'

      Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))
      Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB))

      const resultA = serializeToJson(storeA)
      const resultB = serializeToJson(storeB)

      expect(resultA.layout.areas[0].name).toEqual(
        resultB.layout.areas[0].name,
      )
      expect(['A-name', 'B-name']).toContain(resultA.layout.areas[0].name)
    })
  })
})
