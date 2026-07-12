/**
 * ADR 027 Step 4 — binary cloud transport correctness.
 *
 * These tests exercise the lineage model the Step 4 sync depends on:
 *  - Independent local docs (hydrated separately, as Step 3/5 produced) would
 *    DUPLICATE shared content under naive merge — the hazard that forces
 *    one-time adoption.
 *  - Adopting the remote into a FRESH doc (what `useYjsDoc.adoptRemoteUpdate`
 *    does) collapses to the canonical content with no duplicates and no `meta`
 *    loss, and once adopted, subsequent edits merge cleanly (the CRDT win).
 *  - The migration / GDPR decode path (binary -> JSON) is loss-free.
 *  - The "local fully contained in remote" check (what `hasUpdatesBeyond`
 *    does) skips a redundant push on a pure pull.
 *
 * Every doc that participates in a cross-lineage merge/adopt is created with an
 * explicit, distinct `clientID`. Yjs derives clientIDs from lib0's RNG, which
 * falls back to a low-entropy generator when browser crypto is absent (as in
 * CI). Two independently-created docs can then collide, and `applyUpdate` would
 * silently drop the "already-seen" structs of the colliding client — a test-only
 * artifact (production uses real random clientIDs). Fixed ids make these tests
 * deterministic regardless of environment.
 */

import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import {
  createAllotmentDoc,
  hydrateFromJson,
  serializeToJson,
  dedupeStore,
  encodeDocState,
  decodeDocState,
  type AllotmentStoreShape,
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

/** Create a store/doc with an explicit clientID (see file docstring). */
function docWithClientId(clientId: number): { store: AllotmentStoreShape; doc: Y.Doc } {
  const doc = new Y.Doc()
  doc.clientID = clientId
  const { store } = createAllotmentDoc(doc)
  return { store, doc }
}

/**
 * Mirror of `useYjsDoc.adoptRemoteUpdate`: load the remote lineage into a
 * FRESH, empty doc (never the seeded local doc), so there are no competing
 * local Y.Map items — the remote's `meta` fields always win regardless of
 * clientID ordering. `clientId` fixes the adopting doc's id for deterministic
 * future-edit merges (see file docstring).
 */
function adopt(remoteUpdate: Uint8Array, clientId: number): { store: AllotmentStoreShape; doc: Y.Doc } {
  const { store, doc } = docWithClientId(clientId)
  Y.applyUpdate(doc, remoteUpdate)
  return { store, doc }
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
      const { store: a, doc: docA } = docWithClientId(101)
      hydrateFromJson(a, makeFixture())
      const { store: b, doc: docB } = docWithClientId(202)
      hydrateFromJson(b, makeFixture())

      Y.applyUpdate(docA, encodeDocState(docB))

      // Both lineages' "bed-a" survive -> duplicate. This is exactly why the
      // first sync must ADOPT one canonical lineage instead of merging.
      const merged = serializeToJson(a)
      expect(merged.layout.areas.length).toBe(2)
      expect(merged.layout.areas.filter((ar) => ar.id === 'bed-a').length).toBe(2)
    })

    it('dedupeStore repairs a document duplicated by a naive lineage-merge', () => {
      // The safety net (`useYjsDoc` runs `dedupeStore` after every merge/adopt
      // and on load): even if the adoption gate leaks and two same-content
      // lineages merge, the duplication is collapsed back to one copy — and the
      // repair is a real Yjs mutation, so it propagates to the cloud.
      const { store: a, doc: docA } = docWithClientId(101)
      hydrateFromJson(a, makeFixture())
      const { store: b, doc: docB } = docWithClientId(202)
      hydrateFromJson(b, makeFixture())
      Y.applyUpdate(docA, encodeDocState(docB))

      expect(serializeToJson(a).layout.areas.length).toBe(2) // duplicated

      const changed = dedupeStore(a)
      expect(changed).toBe(true)

      const repaired = serializeToJson(a)
      expect(repaired.layout.areas.map((ar) => ar.id)).toEqual(['bed-a'])
      expect(repaired.varieties.map((v) => v.id)).toEqual(['var-1'])
      expect(repaired.seasons.map((s) => s.year)).toEqual([2026])
      // A second pass is a no-op — the repair is idempotent.
      expect(dedupeStore(a)).toBe(false)
    })

    it('in-place dedupe preserves a concurrent edit from a device on the shared lineage', () => {
      // The repair deletes only the duplicate structs, not the canonical ones,
      // so an edit another device makes to a canonical entity still merges in.
      // (A clear-and-reload repair would tombstone that entity and drop the
      // edit.)
      const canonicalDoc = new Y.Doc()
      canonicalDoc.clientID = 101
      const { store: canonicalStore } = createAllotmentDoc(canonicalDoc)
      hydrateFromJson(canonicalStore, makeFixture())
      const canonical = encodeDocState(canonicalDoc)

      // Device A adopts the canonical lineage, then suffers a bad merge with an
      // INDEPENDENT same-content lineage — bed-a is now duplicated on A.
      const { store: a, doc: docA } = adopt(canonical, 202)
      const { store: rogueStore, doc: rogueDoc } = docWithClientId(303)
      hydrateFromJson(rogueStore, makeFixture())
      Y.applyUpdate(docA, encodeDocState(rogueDoc))
      expect(serializeToJson(a).layout.areas.length).toBe(2)

      // Device B is on the shared canonical lineage and renames the bed.
      const { store: b, doc: docB } = adopt(canonical, 404)
      b.areas[0].name = 'Bed A — renamed by B'

      // A repairs its duplication in place, then B's edit merges in.
      dedupeStore(a)
      Y.applyUpdate(docA, encodeDocState(docB))

      const result = serializeToJson(a)
      expect(result.layout.areas.map((ar) => ar.id)).toEqual(['bed-a'])
      // B's concurrent rename survived the repair.
      expect(result.layout.areas[0].name).toBe('Bed A — renamed by B')
    })
  })

  describe('adoption', () => {
    it('adopt (fresh doc + applyUpdate) yields the canonical content without duplicates', () => {
      // A device that adopts must end up with exactly the cloud content, even
      // though it had a different local default seed. The seed is discarded —
      // adoption loads the remote into a fresh doc — so `meta` (a Y.Map) is not
      // subject to the local-delete-vs-remote-set clientID race.
      const cloudFixture = makeFixture()
      const { store: cloudStore, doc: cloudDoc } = docWithClientId(101)
      hydrateFromJson(cloudStore, cloudFixture)
      const cloudUpdate = encodeDocState(cloudDoc)

      // Adopting doc has a HIGHER clientID than the cloud — the exact case that
      // broke the old clear-in-place approach (local meta delete would win).
      const { store: local } = adopt(cloudUpdate, 202)

      const result = serializeToJson(local)
      expect(result).toEqual(cloudFixture)
      // No duplicate beds, meta intact.
      expect(result.layout.areas.map((ar) => ar.id)).toEqual(['bed-a'])
      expect(result.meta.name).toBe('Test Allotment')
    })

    it('after both devices adopt the same lineage, concurrent edits merge with no duplicates', () => {
      const cloudFixture = makeFixture()
      const { store: cloudStore, doc: cloudDoc } = docWithClientId(101)
      hydrateFromJson(cloudStore, cloudFixture)
      const canonical = encodeDocState(cloudDoc)

      // Two devices adopt the canonical lineage into fresh docs.
      const { store: a, doc: docA } = adopt(canonical, 202)
      const { store: b, doc: docB } = adopt(canonical, 303)

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
      const { store, doc } = docWithClientId(101)
      hydrateFromJson(store, original)
      const binary = encodeDocState(doc)

      // GDPR export / rollback: decode binary back to JSON.
      const { store: decoded } = decodeDocState(binary)
      expect(serializeToJson(decoded)).toEqual(original)
    })
  })

  describe('redundant-push guard', () => {
    it('hasUpdatesBeyond is false for a pure pull and true after a local edit', () => {
      const { store: cloudStore, doc: cloudDoc } = docWithClientId(101)
      hydrateFromJson(cloudStore, makeFixture())
      const remote = encodeDocState(cloudDoc)

      const { store: local, doc: localDoc } = adopt(remote, 202)
      // Adopted exactly the remote — nothing new to push.
      expect(hasUpdatesBeyond(localDoc, remote)).toBe(false)

      local.areas[0].name = 'Edited locally'
      expect(hasUpdatesBeyond(localDoc, remote)).toBe(true)
    })
  })
})
