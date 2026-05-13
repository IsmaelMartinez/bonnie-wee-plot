/**
 * Yjs spike (ADR 027 Step 2)
 *
 * Maps the mutable parts of AllotmentData onto a Yjs document via the
 * SyncedStore proxy wrapper. The 192-entry vegetable database stays in
 * TypeScript modules and is not in scope for this file.
 *
 * Scope of this file: shape definition, doc creation, hydration from an
 * existing AllotmentData JSON snapshot, and serialization back to plain
 * AllotmentData JSON. Consumers of the existing useAllotment API should
 * be able to read the resulting shape with no destructuring changes;
 * writes change from "replace the root object" to "mutate the proxy in
 * place".
 *
 * Not yet covered: useAllotmentData / useAllotment integration, the
 * useYjsDoc hook (Step 3), live-user migration (Step 4).
 */

import * as Y from 'yjs'
import { syncedStore, getYjsDoc } from '@syncedstore/core'
import type {
  AllotmentData,
  AllotmentMeta,
  Area,
  SeasonRecord,
  CustomTask,
  MaintenanceTask,
  GardenEvent,
  StoredVariety,
} from '@/types/unified-allotment'
import type { CompostPile } from '@/types/compost'

/**
 * Top-level shape of the collaborative document.
 *
 * SyncedStore's shape API only accepts empty `{}` / `[]` (plus `"xml"` /
 * `"text"`) at the top level — the runtime initializer must be empty
 * and only the TypeScript cast carries the shape. Two consequences for
 * the legacy AllotmentData mapping: the schema version and the active
 * year live inside a `state` Y.Map rather than as bare primitives, and
 * the legacy `layout.areas` is hoisted to a top-level `areas` Y.Array
 * (the `layout` wrapper is reconstructed by serializeToJson on the way
 * back out).
 */
export interface AllotmentStoreShape {
  state: AllotmentState
  meta: AllotmentMeta
  areas: Area[]
  seasons: SeasonRecord[]
  customTasks: CustomTask[]
  maintenanceTasks: MaintenanceTask[]
  gardenEvents: GardenEvent[]
  varieties: StoredVariety[]
  compost: CompostPile[]
}

export interface AllotmentState {
  currentYear: number
  schemaVersion: number
}

/**
 * Create an empty Yjs-backed allotment store. Caller can pass an
 * existing Y.Doc (used for migration / multi-doc scenarios) or let one
 * be created.
 */
export function createAllotmentDoc(doc: Y.Doc = new Y.Doc()): {
  store: AllotmentStoreShape
  doc: Y.Doc
} {
  const store = syncedStore(
    {
      state: {} as AllotmentState,
      meta: {} as AllotmentMeta,
      areas: [] as Area[],
      seasons: [] as SeasonRecord[],
      customTasks: [] as CustomTask[],
      maintenanceTasks: [] as MaintenanceTask[],
      gardenEvents: [] as GardenEvent[],
      varieties: [] as StoredVariety[],
      compost: [] as CompostPile[],
    },
    doc,
  ) as unknown as AllotmentStoreShape

  return { store, doc }
}

/**
 * Hydrate a store from an existing AllotmentData JSON snapshot. Clears
 * the existing collections first so a re-hydrate produces the same
 * result as a hydrate of an empty store — calling this twice with the
 * same input is a no-op rather than producing duplicates. Runs inside a
 * single Yjs transaction so all the bulk inserts emit one update.
 */
export function hydrateFromJson(
  store: AllotmentStoreShape,
  data: AllotmentData,
): void {
  const doc = getYjsDoc(store)

  doc.transact(() => {
    // Clear top-level collections so re-hydration replaces rather than
    // appends. `meta` is also cleared key-by-key: assignDefined skips
    // undefined values, so without an explicit clear, fields present in
    // the previous hydrate that are absent in the new input would
    // silently persist (a hydrate of a backup without `aiAdvisorEnabled`
    // should leave the proxy without that field, not preserve a stale
    // `true`). `state` has a closed set of fields all written below, so
    // it does not need clearing.
    store.areas.splice(0, store.areas.length)
    store.seasons.splice(0, store.seasons.length)
    store.customTasks.splice(0, store.customTasks.length)
    store.maintenanceTasks.splice(0, store.maintenanceTasks.length)
    store.gardenEvents.splice(0, store.gardenEvents.length)
    store.varieties.splice(0, store.varieties.length)
    store.compost.splice(0, store.compost.length)
    for (const key of Object.keys(store.meta)) {
      delete (store.meta as unknown as Record<string, unknown>)[key]
    }

    // Top-level primitives go into the `state` map.
    store.state.currentYear = data.currentYear
    store.state.schemaVersion = data.version

    // meta: copy field-by-field so undefined props are dropped (Yjs
    // does not store undefined; assigning it can throw).
    assignDefined(store.meta, data.meta)

    // Areas: deep-clone each area into a fresh plain object so
    // SyncedStore expands it into a Y.Map. The legacy `layout.areas`
    // wrapper is collapsed away — `serializeToJson` puts it back.
    for (const area of data.layout.areas) {
      store.areas.push(cloneJson(area) as Area)
    }

    for (const season of data.seasons) {
      store.seasons.push(cloneJson(season) as SeasonRecord)
    }

    for (const task of data.customTasks ?? []) {
      store.customTasks.push(cloneJson(task) as CustomTask)
    }

    for (const task of data.maintenanceTasks ?? []) {
      store.maintenanceTasks.push(cloneJson(task) as MaintenanceTask)
    }

    for (const event of data.gardenEvents ?? []) {
      store.gardenEvents.push(cloneJson(event) as GardenEvent)
    }

    for (const variety of data.varieties) {
      store.varieties.push(cloneJson(variety) as StoredVariety)
    }

    for (const pile of data.compost ?? []) {
      store.compost.push(cloneJson(pile) as CompostPile)
    }
  })
}

/**
 * Serialize a populated store back into an AllotmentData JSON object.
 * Used for export, debugging, and the dual-write phase of the live-user
 * migration. The output matches the in-memory shape of the legacy
 * localStorage / Supabase JSONB representation byte-for-byte modulo
 * field ordering and dropped-undefined fields.
 */
export function serializeToJson(store: AllotmentStoreShape): AllotmentData {
  // SyncedStore proxies are JSON-stringify-friendly, so a parse/stringify
  // round-trip is the lazy and correct way to detach the snapshot from
  // the live document.
  //
  // Asymmetry to know: optional top-level arrays in the legacy
  // AllotmentData shape (`customTasks`, `maintenanceTasks`,
  // `gardenEvents`, `compost`) are always emitted here, even when
  // empty. SyncedStore cannot distinguish "field never set" from
  // "field is an empty array" once hydrate has run — both leave a
  // zero-length Y.Array — so the canonical serialized form normalises
  // to the empty-array case. This matches how the rest of the
  // codebase treats these fields (`data.gardenEvents ?? []`).
  const snapshot = JSON.parse(JSON.stringify(store)) as AllotmentStoreShape

  return {
    version: snapshot.state.schemaVersion,
    currentYear: snapshot.state.currentYear,
    meta: snapshot.meta,
    layout: { areas: snapshot.areas },
    seasons: snapshot.seasons,
    customTasks: snapshot.customTasks,
    maintenanceTasks: snapshot.maintenanceTasks,
    gardenEvents: snapshot.gardenEvents,
    varieties: snapshot.varieties,
    compost: snapshot.compost,
  }
}

/**
 * Encode the document as a Yjs binary update suitable for storage in a
 * BYTEA column. Step 4 of ADR 027 will use this to populate
 * `allotments.yjs_state` during the dual-write migration.
 */
export function encodeDocState(doc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(doc)
}

/**
 * Decode a Yjs binary update into a new document. Mirror of
 * encodeDocState — together they're the persistence round-trip.
 */
export function decodeDocState(update: Uint8Array): {
  store: AllotmentStoreShape
  doc: Y.Doc
} {
  const doc = new Y.Doc()
  const { store } = createAllotmentDoc(doc)
  Y.applyUpdate(doc, update)
  return { store, doc }
}

// ============ internals ============

/**
 * Assign a source object's defined-only fields into a Yjs-backed target
 * object. Skips `undefined` values — Yjs cannot represent undefined and
 * SyncedStore will throw or silently lose them depending on the path.
 */
function assignDefined<T extends object>(target: T, source: T): void {
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue
    // SyncedStore expands plain object values into Y.Maps. Clone first
    // so we don't accidentally share a reference with the source.
    ;(target as Record<string, unknown>)[key] =
      isPlainObject(value) || Array.isArray(value) ? cloneJson(value) : value
  }
}

/**
 * Plain structural clone via JSON. We already serialize ISO date strings
 * everywhere and the codebase doesn't use Date / Map / Set instances in
 * AllotmentData, so the cheap round-trip is safe. If this stops being
 * true (e.g. a future field stores a Date object) this helper is the
 * place to upgrade to a structured clone.
 */
function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}
