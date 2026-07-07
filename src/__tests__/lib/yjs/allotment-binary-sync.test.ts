/**
 * ADR 027 Step 4 — binary cloud transport correctness.
 *
 * These tests exercise the lineage model the Step 4 sync depends on:
 *  - Independent local docs (hydrated separately, as Step 3/5 produced) would
 *    DUPLICATE shared content under naive merge — the hazard that forces
 *    one-time adoption.
 *  - `clearAllotmentStore` + `Y.applyUpdate` (what `useYjsDoc.adoptRemoteUpdate`
 *    does) collapses to the canonical content with no duplicates, and once
 *    adopted, subsequent edits merge cleanly (the CRDT win).
 *  - The migration / GDPR decode path (binary -> JSON) is loss-free.
 *  - The "local fully contained in remote" check (what `hasUpdatesBeyond`
 *    does) skips a redundant push on a pure pull.
 */

import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import {
  createAllotmentDoc,
  hydrateFromJson,
  serializeToJson,
  encodeDocState,
  decodeDocState,
  clearAllotmentStore,
} from '@/lib/yjs/allotment-yjs'
import type { AllotmentData } from '@/types/unified-allotment'

function makeFixture(): AllotmentData {
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
      ],
    },
    seasons: [
      {
        year: 2026,
        status: 'current',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-05-12T10:00:00.000Z',
        areas: [{ areaId: 'bed-a', plantings: [] }],
      },
    ],
    customTasks: [],
    maintenanceTasks: [],
    gardenEvents: [],
    varieties: [{ id: 'var-1', plantId: 'peas', name: 'Kelvedon Wonder', seedsByYear: { 2026: 'have' } }],
    compost: [],
  } as unknown as AllotmentData
}

/** Mirror of `useYjsDoc.adoptRemoteUpdate`: clear local, then apply remote. */
function adopt(store: ReturnType<typeof createAllotmentDoc>['store'], doc: Y.Doc, remoteUpdate: Uint8Array) {
  doc.transact(() => clearAllotmentStore(store))
  Y.applyUpdate(doc, remoteUpdate)
}

/** Mirror of `useYjsDoc.hasUpdatesBeyond`. */
function hasUpdatesBeyond(doc: Y.Doc, remoteUpdate: Uint8Array): boolean {
  const remoteVector = Y.encodeStateVectorFromUpdate(remoteUpdate)
  const diff = Y.encodeStateAsUpdate(doc, remoteVector)
  const { structs, ds } = Y.decodeUpdate(diff)
  return structs.length > 0 || ds.clients.size > 0
}

describe('yjs Step 4: binary cloud transport', () => {
  describe('the lineage hazard', () => {
    it('naive merge of two INDEPENDENT docs with the same content DUPLICATES it', () => {
      // Two devices that each hydrated the same JSON independently (Step 3/5).
      const { store: a, doc: docA } = createAllotmentDoc()
      hydrateFromJson(a, makeFixture())
      const { store: b, doc: docB } = createAllotmentDoc()
      hydrateFromJson(b, makeFixture())

      Y.applyUpdate(docA, encodeDocState(docB))

      // Both lineages' "bed-a" survive -> duplicate. This is exactly why the
      // first sync must ADOPT one canonical lineage instead of merging.
      const merged = serializeToJson(a)
      expect(merged.layout.areas.length).toBe(2)
      expect(merged.layout.areas.filter((ar) => ar.id === 'bed-a').length).toBe(2)
    })
  })

  describe('adoption', () => {
    it('adopt (clear + applyUpdate) yields the canonical content without duplicates', () => {
      // Fresh device seeded with a DIFFERENT default, then signs in and adopts
      // the canonical cloud doc.
      const cloudFixture = makeFixture()
      const { store: cloudStore, doc: cloudDoc } = createAllotmentDoc()
      hydrateFromJson(cloudStore, cloudFixture)
      const cloudUpdate = encodeDocState(cloudDoc)

      const seed: AllotmentData = {
        ...makeFixture(),
        layout: { areas: [{ id: 'default-seed', name: 'My First Bed', kind: 'rotation-bed', canHavePlantings: true, createdAt: '2026-06-01T00:00:00.000Z' } as unknown as AllotmentData['layout']['areas'][number]] },
        seasons: [],
        varieties: [],
      }
      const { store: local, doc: localDoc } = createAllotmentDoc()
      hydrateFromJson(local, seed)

      adopt(local, localDoc, cloudUpdate)

      const result = serializeToJson(local)
      expect(result).toEqual(cloudFixture)
      // The local default seed is gone, no duplicate beds.
      expect(result.layout.areas.map((ar) => ar.id)).toEqual(['bed-a'])
    })

    it('after both devices adopt the same lineage, concurrent edits merge with no duplicates', () => {
      const cloudFixture = makeFixture()
      const { store: cloudStore, doc: cloudDoc } = createAllotmentDoc()
      hydrateFromJson(cloudStore, cloudFixture)
      const canonical = encodeDocState(cloudDoc)

      // Two devices adopt the canonical lineage.
      const { store: a, doc: docA } = createAllotmentDoc()
      adopt(a, docA, canonical)
      const { store: b, doc: docB } = createAllotmentDoc()
      adopt(b, docB, canonical)

      // Concurrent edits: A renames the bed, B adds a variety.
      a.areas[0].name = 'Bed A — by A'
      b.varieties.push({ id: 'var-2', plantId: 'tomato', name: 'Gardener', seedsByYear: { 2026: 'ordered' } } as unknown as (typeof b.varieties)[number])

      // Exchange full state both ways.
      Y.applyUpdate(docA, encodeDocState(docB))
      Y.applyUpdate(docB, encodeDocState(docA))

      const ra = serializeToJson(a)
      const rb = serializeToJson(b)
      expect(ra).toEqual(rb)
      // No duplicated bed, both edits present.
      expect(ra.layout.areas.map((ar) => ar.id)).toEqual(['bed-a'])
      expect(ra.layout.areas[0].name).toBe('Bed A — by A')
      expect(ra.varieties.map((v) => v.id).sort()).toEqual(['var-1', 'var-2'])
    })
  })

  describe('migration / GDPR decode path (binary -> JSON)', () => {
    it('hydrate -> encode -> decode -> serialize is loss-free', () => {
      const original = makeFixture()
      // Migration seed: hydrate the JSONB mirror, encode to binary.
      const { store, doc } = createAllotmentDoc()
      hydrateFromJson(store, original)
      const binary = encodeDocState(doc)

      // GDPR export / rollback: decode binary back to JSON.
      const { store: decoded } = decodeDocState(binary)
      expect(serializeToJson(decoded)).toEqual(original)
    })
  })

  describe('redundant-push guard', () => {
    it('hasUpdatesBeyond is false for a pure pull and true after a local edit', () => {
      const { store: cloudStore, doc: cloudDoc } = createAllotmentDoc()
      hydrateFromJson(cloudStore, makeFixture())
      const remote = encodeDocState(cloudDoc)

      const { store: local, doc: localDoc } = createAllotmentDoc()
      adopt(local, localDoc, remote)
      // Adopted exactly the remote — nothing new to push.
      expect(hasUpdatesBeyond(localDoc, remote)).toBe(false)

      local.areas[0].name = 'Edited locally'
      expect(hasUpdatesBeyond(localDoc, remote)).toBe(true)
    })
  })
})
