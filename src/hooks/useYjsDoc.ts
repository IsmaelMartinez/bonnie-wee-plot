/**
 * useYjsDoc Hook (ADR 027)
 *
 * Owns the Y.Doc, the SyncedStore instance, the IndexeddbPersistence
 * provider, and the React state that publishes the derived
 * `AllotmentData | null` snapshot to consumers. This is the canonical
 * local storage engine; `useAllotmentData` composes it with
 * `useCloudSync`.
 *
 * Lifecycle on mount:
 *   1. Construct doc + SyncedStore + IndexeddbPersistence.
 *   2. await provider.whenSynced.
 *   3. If the doc is empty (all top-level arrays empty and meta map has
 *      no keys), seed it via `initializeStorage()` — which reads and
 *      migrates the legacy `allotment-unified-data` key, or creates and
 *      persists a fresh default allotment on a brand-new device — then
 *      `hydrateFromJson` the result into the store.
 *   4. Subscribe `doc.on('update', ...)`. On every update, call
 *      `serializeToJson(store)` and push the result through `setState`.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { getYjsDoc } from '@syncedstore/core'
import { IndexeddbPersistence } from 'y-indexeddb'
import type { AllotmentData } from '@/types/unified-allotment'
import {
  createAllotmentDoc,
  hydrateFromJson,
  serializeToJson,
  type AllotmentStoreShape,
} from '@/lib/yjs/allotment-yjs'
import { initializeStorage } from '@/services/allotment-storage'

/**
 * Name of the IndexedDB database used by `y-indexeddb` for the
 * allotment doc. Distinct from the legacy localStorage key so the two
 * can coexist during the soak window.
 */
const YJS_DOC_NAME = 'bwp-allotment-yjs'

/**
 * Shared singleton state for the tab-wide Yjs doc. Multiple `useYjsDoc`
 * consumers (Navigation, allotment page, modals) all read from and
 * write to the same Y.Doc instance through this singleton. Refcounted so
 * the doc + IDB provider tear down when the last consumer unmounts.
 *
 * Without this, two `useYjsDoc` instances mounting in parallel would
 * each construct their own Y.Doc, both try to hydrate from legacy
 * localStorage, and produce concurrent CRDT inserts that the merger
 * keeps as duplicates — manifesting as duplicate seasons / areas after
 * page reload. The singleton makes hydration single-shot by
 * construction.
 */
type DocUpdateListener = (update: Uint8Array, origin: unknown) => void

interface YjsSingleton {
  doc: Y.Doc
  store: AllotmentStoreShape
  provider: IndexeddbPersistence | null
  /**
   * Resolves once `provider.whenSynced` has resolved and (if needed)
   * the one-shot legacy-localStorage hydration has run. Cached so
   * later consumers await the same work instead of racing it.
   */
  whenReady: Promise<{ providerError: string | null }>
  /** Origin tag for transactions initiated locally by `useYjsDoc` consumers. */
  localOrigin: symbol
  /**
   * Origin tag for updates applied from the cloud transport (ADR 027 Step 4).
   * Distinct from `localOrigin` so the update handler flags
   * `isSyncedFromOtherTab` and the cloud push effect does not treat a
   * just-merged remote update as a fresh local edit to push straight back.
   */
  remoteOrigin: symbol
  /**
   * Per-consumer update listeners. The singleton attaches ONE `boundListener`
   * to the current `doc` and fans out to these, so `adoptRemoteUpdate` can
   * swap the underlying `Y.Doc` (see its docstring) and re-point the single
   * doc listener without every consumer having to re-subscribe.
   */
  listeners: Set<DocUpdateListener>
  /** The one listener attached to `doc`; moved to the new doc on adopt. */
  boundListener: DocUpdateListener
  /** Number of mounted `useYjsDoc` consumers. */
  refCount: number
}

let singleton: YjsSingleton | null = null

/**
 * Delete the Yjs IndexedDB database, resolving even if another tab holds it
 * open (the caller has already torn down this tab's provider). Shared by
 * `adoptRemoteUpdate` (reset persistence to the adopted lineage) and
 * `clearYjsIndexedDb` (import/restore).
 */
function deleteYjsDatabase(): Promise<void> {
  if (typeof indexedDB === 'undefined') return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(YJS_DOC_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to delete Yjs IndexedDB'))
    request.onblocked = () => resolve()
  })
}

function acquireSingleton(): YjsSingleton {
  if (singleton) {
    singleton.refCount += 1
    return singleton
  }

  const doc = new Y.Doc()
  const { store } = createAllotmentDoc(doc)
  let provider: IndexeddbPersistence | null = null
  let providerError: string | null = null
  try {
    provider = new IndexeddbPersistence(YJS_DOC_NAME, doc)
  } catch (err) {
    // `IndexeddbPersistence`'s constructor reads `indexedDB` eagerly;
    // browsers without it (older Safari private mode) throw here. Fall
    // back to a memory-only doc — the session is local-only and dies
    // on reload, same as the legacy chain when localStorage is
    // unavailable.
    providerError = err instanceof Error ? err.message : 'IndexedDB unavailable'
    provider = null
  }

  const localOrigin = Symbol('useYjsDoc-shared-local')
  const remoteOrigin = Symbol('useYjsDoc-shared-remote')
  const listeners = new Set<DocUpdateListener>()
  const boundListener: DocUpdateListener = (update, origin) => {
    for (const listener of listeners) listener(update, origin)
  }
  doc.on('update', boundListener)

  const whenReady = (async () => {
    if (provider) {
      try {
        await provider.whenSynced
      } catch (err) {
        providerError =
          err instanceof Error ? err.message : 'Failed to load IndexedDB state'
      }
    }
    // First-run hydration: if the doc is still empty after IDB sync,
    // seed it from `initializeStorage()` — which reads and migrates the
    // existing legacy `allotment-unified-data` key, or creates and
    // persists a fresh default allotment when the key is absent (a
    // brand-new device). This is the same seed the pre-Step-5 legacy
    // chain produced, so a fresh device gets the default allotment
    // rather than a null doc. Single-shot because the singleton's
    // `whenReady` is the only place that runs it — subsequent
    // `useYjsDoc` mounts await the same Promise and see a non-empty doc.
    // The IDB is authoritative on later boots; the import flow
    // (`clearYjsIndexedDb`) and the in-app Clear Local Data button
    // explicitly clear IDB when the user intends to discard the doc.
    if (isStoreEmpty(store)) {
      const seed = loadSeedAllotment()
      if (seed) {
        doc.transact(() => {
          hydrateFromJson(store, seed)
        }, localOrigin)
      }
    }
    return { providerError }
  })()

  singleton = {
    doc,
    store,
    provider,
    whenReady,
    localOrigin,
    remoteOrigin,
    listeners,
    boundListener,
    refCount: 1,
  }
  return singleton
}

function releaseSingleton(): void {
  if (!singleton) return
  singleton.refCount -= 1
  if (singleton.refCount > 0) return
  // Last consumer unmounted — tear down. We hold the reference local
  // before nulling so the destroy/cleanup runs against the same
  // instance even if another mount races in.
  const current = singleton
  singleton = null
  current.doc.off('update', current.boundListener)
  if (current.provider) {
    // `destroy` returns a Promise but we don't await it during
    // cleanup — React unmount is synchronous. The provider tears
    // down its IDB connection in the background.
    void current.provider.destroy()
  }
  current.doc.destroy()
}

export interface UseYjsDocReturn {
  /** Derived JSON snapshot of the current doc state. */
  data: AllotmentData | null
  /**
   * `true` while the IndexeddbPersistence provider is still loading the
   * on-disk state, the first-run legacy-hydration is in progress, or
   * the first snapshot has not yet been published.
   */
  isLoading: boolean
  /** Initialization error message, if any (e.g. IndexedDB unavailable). */
  error: string | null
  /**
   * Wraps `doc.transact(fn)`. Runs `fn` against the live SyncedStore
   * proxy. Each mutation triggers a `doc.on('update', ...)` callback
   * which serializes and republishes the snapshot.
   */
  mutate: (fn: (store: AllotmentStoreShape) => void) => void
  /**
   * Idempotent replace path: clears the doc and re-hydrates from `json`.
   * Used by the `reload()` import/restore flow and by the Step 4 migration
   * when the only cloud copy is the pre-migration JSONB.
   */
  replaceFromJson: (json: AllotmentData) => void
  /**
   * Read the current snapshot on demand (not from React state). Callers in
   * the async cloud-push path need the live post-merge snapshot rather than a
   * possibly-stale closed-over `data`.
   */
  getSnapshot: () => AllotmentData | null
  /**
   * Encode the whole document as a Yjs binary update
   * (`Y.encodeStateAsUpdate`) for the cloud push. `null` before the doc is
   * ready.
   */
  encodeState: () => Uint8Array | null
  /**
   * Merge a remote Yjs update into the live doc (`Y.applyUpdate`). This is the
   * CRDT merge that replaces last-write-wins: concurrent edits from another
   * device converge instead of one side overwriting the other. Tagged with the
   * remote origin so it lights the "synced from another source" affordance and
   * is not mistaken for a fresh local edit.
   */
  mergeRemoteUpdate: (update: Uint8Array) => void
  /**
   * Adopt a canonical remote lineage on a device's first Step 4 sync so every
   * device converges on one shared document lineage — a prerequisite for
   * duplicate-free CRDT merge, since the per-device local docs were hydrated
   * independently in Step 3/5 and do not share history.
   *
   * The remote update is applied into a FRESH, empty `Y.Doc` (not the seeded
   * local doc) which then replaces the singleton's doc; IndexedDB is reset to
   * the adopted lineage. Applying onto the existing local doc would be unsound:
   * clearing the local seed leaves delete-tombstones, and Yjs resolves a Y.Map
   * key (e.g. every `meta` field) to the item with the highest clientID
   * regardless of deletion — so if the local doc's clientID outranked the
   * remote's, the local delete would win and the field would vanish. Loading
   * into an empty doc has no competing local items, so the remote always wins.
   * Resolves once the adopted state has been persisted.
   */
  adoptRemoteUpdate: (update: Uint8Array) => Promise<void>
  /**
   * Does the live doc hold any structs or deletes that `remoteUpdate` does
   * not? Used by the push path to skip a redundant cloud write when the local
   * doc is already fully contained in the remote state (a pure pull).
   */
  hasUpdatesBeyond: (remoteUpdate: Uint8Array) => boolean
  /**
   * Awaits any pending IndexedDB persistence writes. Callers see the
   * same "everything saved locally" contract the legacy chain offered.
   */
  flushSave: () => Promise<boolean>
  /**
   * Fires when the `y-indexeddb` cross-tab broadcast updates this tab's
   * doc, so existing "synced from another tab" affordances light up.
   */
  isSyncedFromOtherTab: boolean
}

/**
 * Hooks the Yjs document into React state. See module docstring for
 * the lifecycle contract.
 */
export function useYjsDoc(): UseYjsDocReturn {
  const [data, setData] = useState<AllotmentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSyncedFromOtherTab, setIsSyncedFromOtherTab] = useState(false)

  // Hold the shared singleton in a ref so the actions exposed by this
  // hook all close over the same Y.Doc instance. The singleton itself
  // is module-scoped (see `acquireSingleton`); every `useYjsDoc`
  // consumer shares the same Y.Doc to avoid concurrent-hydration races.
  const singletonRef = useRef<YjsSingleton | null>(null)

  useEffect(() => {
    let cancelled = false
    // Track the active "synced from other tab" reset timer so unmount can
    // clear it and avoid a setState-on-unmounted warning.
    let syncedFlagTimeout: ReturnType<typeof setTimeout> | null = null

    const sg = acquireSingleton()
    singletonRef.current = sg

    const handleUpdate = (_update: Uint8Array, origin: unknown) => {
      const snapshot = serializeToJson(sg.store)
      setData(snapshot)
      // Any update that isn't tagged with the shared local origin came
      // from somewhere else: the IndexeddbPersistence cross-tab
      // broadcast, or a `Y.applyUpdate` from the cloud transport (merge /
      // adopt). Flag it so existing UI affordances ("Synced from another
      // tab") light up.
      if (origin !== sg.localOrigin) {
        setIsSyncedFromOtherTab(true)
        if (syncedFlagTimeout) clearTimeout(syncedFlagTimeout)
        syncedFlagTimeout = setTimeout(() => {
          syncedFlagTimeout = null
          if (!cancelled) setIsSyncedFromOtherTab(false)
        }, 3000)
      }
    }
    // Subscribe via the singleton's listener set (not `doc.on` directly) so
    // `adoptRemoteUpdate` can swap the underlying doc without us re-subscribing.
    sg.listeners.add(handleUpdate)

    const init = async () => {
      try {
        const { providerError } = await sg.whenReady
        if (cancelled) return

        if (providerError) {
          setError(providerError)
        }

        // Publish the initial snapshot. After `whenReady` resolves the
        // doc may already have content (from IndexedDB or first-run
        // hydration) without us having received a fresh update event,
        // so emit a snapshot explicitly. If the store is still empty
        // (truly first-run device with no legacy data), keep `data` at
        // its initial `null` — first-run consumers (e.g. the setup
        // wizard) rely on the `null` signal.
        if (!cancelled) {
          if (!isStoreEmpty(sg.store)) {
            setData(serializeToJson(sg.store))
          }
          setIsLoading(false)
        }
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to initialize Yjs doc'
        setError(message)
        setIsLoading(false)
      }
    }

    init()

    return () => {
      cancelled = true
      if (syncedFlagTimeout) {
        clearTimeout(syncedFlagTimeout)
        syncedFlagTimeout = null
      }
      sg.listeners.delete(handleUpdate)
      singletonRef.current = null
      releaseSingleton()
    }
  }, [])

  const mutate = useCallback(
    (fn: (store: AllotmentStoreShape) => void) => {
      const sg = singletonRef.current
      if (!sg) return
      sg.doc.transact(() => {
        fn(sg.store)
      }, sg.localOrigin)
    },
    [],
  )

  const replaceFromJson = useCallback((json: AllotmentData) => {
    const sg = singletonRef.current
    if (!sg) return
    sg.doc.transact(() => {
      hydrateFromJson(sg.store, json)
    }, sg.localOrigin)
  }, [])

  const getSnapshot = useCallback((): AllotmentData | null => {
    const sg = singletonRef.current
    if (!sg) return null
    return serializeToJson(sg.store)
  }, [])

  const encodeState = useCallback((): Uint8Array | null => {
    const sg = singletonRef.current
    if (!sg) return null
    return Y.encodeStateAsUpdate(sg.doc)
  }, [])

  const mergeRemoteUpdate = useCallback((update: Uint8Array) => {
    const sg = singletonRef.current
    if (!sg) return
    Y.applyUpdate(sg.doc, update, sg.remoteOrigin)
  }, [])

  const adoptRemoteUpdate = useCallback(async (update: Uint8Array): Promise<void> => {
    const sg = singletonRef.current
    if (!sg) return
    // Load the canonical remote lineage into a FRESH, empty doc (see the
    // interface docstring for why this must not reuse the seeded local doc).
    const freshDoc = new Y.Doc()
    const { store: freshStore } = createAllotmentDoc(freshDoc)
    Y.applyUpdate(freshDoc, update)

    // Re-point the single doc listener from the old doc to the fresh one, then
    // swap the singleton's references so every consumer (and mutate / encode /
    // merge) now operates on the adopted doc.
    const oldDoc = sg.doc
    const oldProvider = sg.provider
    oldDoc.off('update', sg.boundListener)
    freshDoc.on('update', sg.boundListener)
    sg.doc = freshDoc
    sg.store = freshStore

    // Reset IndexedDB to the adopted lineage: without this, on reload the old
    // provider's on-disk local lineage would load and re-merge, reintroducing
    // the duplicate/`meta`-loss the adoption just avoided.
    if (oldProvider) {
      try {
        await oldProvider.destroy()
        await deleteYjsDatabase()
        const provider = new IndexeddbPersistence(YJS_DOC_NAME, freshDoc)
        sg.provider = provider
        await provider.whenSynced
      } catch {
        sg.provider = null
      }
    }
    oldDoc.destroy()

    // Publish the adopted snapshot to all consumers (the applyUpdate above
    // fired before the listener was attached to `freshDoc`, on purpose, so we
    // emit once here with the remote origin).
    sg.boundListener(new Uint8Array(0), sg.remoteOrigin)
  }, [])

  const hasUpdatesBeyond = useCallback((remoteUpdate: Uint8Array): boolean => {
    const sg = singletonRef.current
    if (!sg) return false
    // Encode only what the local doc has beyond the remote's state vector,
    // then check whether that diff carries any real content (new structs or
    // deletes). An empty diff means the local doc is fully contained in the
    // remote — nothing to push.
    const remoteVector = Y.encodeStateVectorFromUpdate(remoteUpdate)
    const diff = Y.encodeStateAsUpdate(sg.doc, remoteVector)
    const { structs, ds } = Y.decodeUpdate(diff)
    return structs.length > 0 || ds.clients.size > 0
  }, [])

  const flushSave = useCallback(async (): Promise<boolean> => {
    const sg = singletonRef.current
    if (!sg || !sg.provider) return true
    try {
      await sg.provider.whenSynced
      return true
    } catch {
      return false
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    mutate,
    replaceFromJson,
    getSnapshot,
    encodeState,
    mergeRemoteUpdate,
    adoptRemoteUpdate,
    hasUpdatesBeyond,
    flushSave,
    isSyncedFromOtherTab,
  }
}

/**
 * Produce the first-run seed for the Yjs doc.
 *
 * Delegates to `initializeStorage()`, the canonical storage entry point:
 * it reads and validates/migrates the existing legacy
 * `allotment-unified-data` key, or — on a brand-new device where the key
 * is absent — creates and persists a fresh default allotment. Both cases
 * return current-schema data to hydrate. This matches the pre-Step-5
 * behaviour where the legacy chain ran `initializeStorage()` and the Yjs
 * doc hydrated from whatever it wrote to localStorage; a fresh device
 * therefore gets the default allotment rather than a null doc.
 *
 * Returns `null` only when there is no `window` (SSR) or the storage
 * layer fails outright, leaving the doc empty for the caller to surface
 * the loading/error state.
 */
function loadSeedAllotment(): AllotmentData | null {
  if (typeof window === 'undefined') return null
  try {
    const result = initializeStorage()
    return result.success && result.data ? result.data : null
  } catch {
    return null
  }
}

/**
 * A doc is considered "empty" when every top-level collection has zero
 * entries and the meta map has no keys. Matches the freshly-constructed
 * shape produced by `createAllotmentDoc` — anything else means
 * IndexedDB already restored content for this user.
 */
function isStoreEmpty(store: AllotmentStoreShape): boolean {
  return (
    store.areas.length === 0 &&
    store.seasons.length === 0 &&
    store.customTasks.length === 0 &&
    store.maintenanceTasks.length === 0 &&
    store.gardenEvents.length === 0 &&
    store.varieties.length === 0 &&
    store.compost.length === 0 &&
    Object.keys(store.meta).length === 0
  )
}

// Re-export for callers that need to reference the underlying Yjs Doc
// (e.g. tests).
export { getYjsDoc }

/**
 * Drop the Yjs IndexedDB store so a subsequent `useYjsDoc` mount
 * hydrates fresh from legacy localStorage. The import flow uses this
 * after writing imported data to localStorage but before
 * `window.location.reload()` — otherwise, on reload the Yjs path would
 * load the *previous* session's state from IDB, ignore the freshly-
 * imported localStorage, and then mirror the stale state back over the
 * imported data.
 *
 * Tears down the singleton in-process so any post-reset `useYjsDoc`
 * mount starts from scratch instead of reusing the in-memory cache.
 * Safe to call when the singleton hasn't been constructed yet (e.g.
 * if the flag is `false` and no consumer ever mounted).
 *
 * Returns a promise that resolves once the IDB database has been
 * deleted, or rejects with the underlying browser error if the
 * deletion fails. Callers (the import flow) are expected to `await`
 * this before the reload so the deletion is guaranteed durable.
 */
export async function clearYjsIndexedDb(): Promise<void> {
  // First, tear down the in-process singleton if it exists. This
  // closes the IDB connection so the `deleteDatabase` call below can
  // succeed (browsers reject open-handle deletions silently or with a
  // blocked event).
  if (singleton) {
    const current = singleton
    singleton = null
    if (current.provider) {
      try {
        await current.provider.destroy()
      } catch {
        // Best-effort: continue to the database delete even if the
        // provider tear-down failed.
      }
    }
    current.doc.destroy()
  }

  if (typeof indexedDB === 'undefined') return
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(YJS_DOC_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to delete Yjs IndexedDB'))
    // `blocked` fires when another tab has the DB open. Resolve anyway
    // — the import is about to reload this tab, and any other tabs will
    // see the same localStorage on their next mount.
    request.onblocked = () => resolve()
  })
}
