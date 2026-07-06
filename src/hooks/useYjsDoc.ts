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
 *      no keys), read the legacy `allotment-unified-data` key from
 *      localStorage (written by import / restore / fresh-init), run it
 *      through the schema migration to bring it to the current version,
 *      then `hydrateFromJson` it into the store.
 *   4. Subscribe `doc.on('update', ...)`. On every update, call
 *      `serializeToJson(store)` and push the result through `setState`.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { getYjsDoc } from '@syncedstore/core'
import { IndexeddbPersistence } from 'y-indexeddb'
import type { AllotmentData } from '@/types/unified-allotment'
import { STORAGE_KEY } from '@/types/unified-allotment'
import {
  createAllotmentDoc,
  hydrateFromJson,
  serializeToJson,
  type AllotmentStoreShape,
} from '@/lib/yjs/allotment-yjs'
import {
  validateAllotmentData,
  migrateSchemaForImport,
} from '@/services/allotment-storage'

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
  /** Number of mounted `useYjsDoc` consumers. */
  refCount: number
}

let singleton: YjsSingleton | null = null

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
    // pull the legacy localStorage snapshot in. This is single-shot
    // because the singleton's `whenReady` is the only place that runs
    // it — subsequent `useYjsDoc` mounts await the same Promise and
    // see a non-empty doc. The IDB is authoritative on later boots;
    // the import flow (`clearYjsIndexedDb`) and the in-app Clear Local
    // Data button explicitly clear IDB when the user intends to
    // discard the doc.
    if (isStoreEmpty(store)) {
      const legacy = readLegacyAllotment()
      if (legacy) {
        doc.transact(() => {
          hydrateFromJson(store, legacy)
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
   * Used by the cloud-sync conflict-resolution callback when the user
   * picks "use cloud".
   */
  replaceFromJson: (json: AllotmentData) => void
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
      // broadcast, or a `Y.applyUpdate` from a future cloud transport.
      // Flag it so existing UI affordances ("Synced from another tab")
      // light up.
      if (origin !== sg.localOrigin) {
        setIsSyncedFromOtherTab(true)
        if (syncedFlagTimeout) clearTimeout(syncedFlagTimeout)
        syncedFlagTimeout = setTimeout(() => {
          syncedFlagTimeout = null
          if (!cancelled) setIsSyncedFromOtherTab(false)
        }, 3000)
      }
    }
    sg.doc.on('update', handleUpdate)

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
      sg.doc.off('update', handleUpdate)
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
    flushSave,
    isSyncedFromOtherTab,
  }
}

/**
 * Read the legacy `allotment-unified-data` key directly, validate it,
 * and run any pending schema migrations. Returns `null` when the key is
 * absent, malformed, or fails validation — letting the caller leave
 * the Yjs doc empty rather than back-filling fresh-init data.
 *
 * Importantly, this does NOT call `initializeStorage`: that function
 * auto-creates a fresh allotment when the key is missing, which is the
 * right behaviour for the legacy chain on a brand-new device but the
 * wrong behaviour for the Yjs path's first-run signal.
 */
function readLegacyAllotment(): AllotmentData | null {
  if (typeof window === 'undefined') return null
  let stored: string | null = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!stored) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(stored)
  } catch {
    return null
  }
  const validation = validateAllotmentData(parsed)
  if (!validation.valid) return null
  const data = parsed as AllotmentData
  // Run schema migrations so the Yjs hydrate sees current-shape data.
  // `migrateSchemaForImport` is the same migration entry point the
  // import path already uses, so we inherit its tested coverage rather
  // than duplicating the version-by-version walk here.
  try {
    return migrateSchemaForImport(data)
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
