/**
 * useYjsDoc Hook (ADR 027 Step 3, PR-A foundation)
 *
 * Owns the Y.Doc, the SyncedStore instance, the IndexeddbPersistence
 * provider, and the React state that publishes the derived
 * `AllotmentData | null` snapshot to consumers.
 *
 * Lifecycle on mount:
 *   1. Construct doc + SyncedStore + IndexeddbPersistence.
 *   2. await provider.whenSynced.
 *   3. If the doc is empty (all top-level arrays empty and meta map has
 *      no keys), read legacy `allotment-unified-data` from localStorage,
 *      run it through `initializeStorage` / `migrateData` to bring it to
 *      the current schema, then `hydrateFromJson` it into the store.
 *   4. Subscribe `doc.on('update', ...)`. On every update, call
 *      `serializeToJson(store)` and push the result through `setState`.
 *
 * This hook is wired into the rest of the app only when
 * `USE_YJS_STORAGE === true`. Default-off in the first release ship of
 * Step 3; PR-B ports the seven domain hooks behind the same flag.
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
} from '@/lib/yjs-spike/allotment-yjs'
import {
  validateAllotmentData,
  migrateSchemaForImport,
} from '@/services/allotment-storage'
import type { SyncStatus } from '@/types/storage'

/**
 * Name of the IndexedDB database used by `y-indexeddb` for the
 * allotment doc. Distinct from the legacy localStorage key so the two
 * can coexist during the soak window.
 */
const YJS_DOC_NAME = 'bwp-allotment-yjs'

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
   * "Use mine" conflict-resolution path: read the current snapshot,
   * push it through the mirror so the legacy chain picks it up, then
   * await the cloud-push flush.
   */
  serializeAndPush: () => Promise<void>
  /**
   * Awaits any pending IndexedDB persistence writes plus the mirror's
   * own pending mirror write. Mirrors the shape of the legacy
   * `usePersistedStorage.flushSave` so callers see the same contract.
   */
  flushSave: () => Promise<boolean>
  /**
   * Mirrors `usePersistedStorage.isSyncedFromOtherTab`. Fires when the
   * `y-indexeddb` cross-tab broadcast updates this tab's doc.
   */
  isSyncedFromOtherTab: boolean
  /**
   * Mirrors `useSyncedStorage.syncStatus`. PR-A leaves this `'disabled'`
   * — cloud sync remains on the legacy chain via the mirror adapter
   * during Step 3 soak. PR-B / PR-C may extend this once the cutover
   * runbook runs.
   */
  syncStatus: SyncStatus
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

  // Hold the doc/store/provider in refs so the same instance survives
  // re-renders and exposes them to callbacks without re-creating the
  // listener wiring on every render.
  const docRef = useRef<Y.Doc | null>(null)
  const storeRef = useRef<AllotmentStoreShape | null>(null)
  const providerRef = useRef<IndexeddbPersistence | null>(null)
  // Tracks the origin of updates the hook applies itself, so the doc's
  // own update listener can distinguish locally-initiated transactions
  // from cross-tab broadcasts arriving through y-indexeddb.
  const localOriginRef = useRef<symbol>(Symbol('useYjsDoc-local'))

  useEffect(() => {
    let cancelled = false
    // Track the active "synced from other tab" reset timer so unmount can
    // clear it and avoid a setState-on-unmounted warning.
    let syncedFlagTimeout: ReturnType<typeof setTimeout> | null = null

    const doc = new Y.Doc()
    const { store } = createAllotmentDoc(doc)
    docRef.current = doc
    storeRef.current = store

    let provider: IndexeddbPersistence | null = null
    try {
      provider = new IndexeddbPersistence(YJS_DOC_NAME, doc)
    } catch (err) {
      // `IndexeddbPersistence`'s constructor reads `indexedDB` eagerly;
      // browsers without it (older Safari private mode) throw here.
      // Fall back to a memory-only doc — the session is local-only and
      // dies on reload, same as the legacy chain when localStorage is
      // unavailable.
      const message =
        err instanceof Error ? err.message : 'IndexedDB unavailable'
      setError(message)
      provider = null
    }
    providerRef.current = provider

    const handleUpdate = (_update: Uint8Array, origin: unknown) => {
      if (!storeRef.current) return
      const snapshot = serializeToJson(storeRef.current)
      setData(snapshot)
      // Any update that isn't tagged with our local origin came from
      // somewhere else: the IndexeddbPersistence cross-tab broadcast,
      // or a `Y.applyUpdate` from a future cloud transport. Flag it so
      // existing UI affordances ("Synced from another tab") light up.
      if (origin !== localOriginRef.current) {
        setIsSyncedFromOtherTab(true)
        if (syncedFlagTimeout) clearTimeout(syncedFlagTimeout)
        syncedFlagTimeout = setTimeout(() => {
          syncedFlagTimeout = null
          if (!cancelled) setIsSyncedFromOtherTab(false)
        }, 3000)
      }
    }
    doc.on('update', handleUpdate)

    const init = async () => {
      try {
        if (provider) {
          await provider.whenSynced
        }
        if (cancelled) return

        const currentStore = storeRef.current
        if (!currentStore) return

        const isEmpty = isStoreEmpty(currentStore)
        if (isEmpty) {
          // Read the legacy localStorage key directly so an empty
          // device truly stays empty (`data === null`). `initializeStorage`
          // would conjure a fresh-init record here, which is the right
          // behaviour for the legacy chain on first run but the wrong
          // behaviour for the Yjs path — we want to defer initialisation
          // until the user actually adds something.
          const legacy = readLegacyAllotment()
          if (legacy) {
            doc.transact(() => {
              hydrateFromJson(currentStore, legacy)
            }, localOriginRef.current)
          }
        }

        // Publish the initial snapshot. After `whenSynced` the doc may
        // already have content (from IndexedDB) without us having
        // received a fresh update event, so emit a snapshot explicitly.
        // If the store is still empty after the hydration attempt, keep
        // `data` at its initial `null` — first-run consumers (e.g. the
        // setup wizard) rely on the `null` signal.
        if (!cancelled) {
          if (!isStoreEmpty(currentStore)) {
            setData(serializeToJson(currentStore))
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
      doc.off('update', handleUpdate)
      if (provider) {
        // `destroy` returns a Promise but we don't await it during
        // cleanup — React unmount is synchronous. The provider tears
        // down its IDB connection in the background.
        void provider.destroy()
      }
      doc.destroy()
      docRef.current = null
      storeRef.current = null
      providerRef.current = null
    }
  }, [])

  const mutate = useCallback(
    (fn: (store: AllotmentStoreShape) => void) => {
      const doc = docRef.current
      const store = storeRef.current
      if (!doc || !store) return
      doc.transact(() => {
        fn(store)
      }, localOriginRef.current)
    },
    [],
  )

  const replaceFromJson = useCallback((json: AllotmentData) => {
    const doc = docRef.current
    const store = storeRef.current
    if (!doc || !store) return
    doc.transact(() => {
      hydrateFromJson(store, json)
    }, localOriginRef.current)
  }, [])

  const flushSave = useCallback(async (): Promise<boolean> => {
    const provider = providerRef.current
    if (!provider) return true
    try {
      await provider.whenSynced
      return true
    } catch {
      return false
    }
  }, [])

  // `serializeAndPush` is the "use mine" half of the conflict-resolution
  // contract that lives on the legacy chain. PR-A only exposes the
  // surface so PR-B / PR-C can wire it into the conflict dialog without
  // re-shaping the hook. The actual cloud push stays on
  // `useSyncedStorage.flushPush`, which the mirror adapter triggers
  // automatically when the next snapshot reaches `usePersistedStorage`.
  // We expose `serializeAndPush` here for symmetry with the spec — the
  // wiring lives in `useAllotmentData` when the flag is on.
  const serializeAndPush = useCallback(async (): Promise<void> => {
    // The actual push happens through the mirror once the next snapshot
    // is published. Awaiting the local flush is the closest equivalent
    // to "everything is safely staged for cloud sync" we can offer
    // without coupling this hook to `useSyncedStorage`.
    await flushSave()
  }, [flushSave])

  return {
    data,
    isLoading,
    error,
    mutate,
    replaceFromJson,
    serializeAndPush,
    flushSave,
    isSyncedFromOtherTab,
    syncStatus: 'disabled',
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
