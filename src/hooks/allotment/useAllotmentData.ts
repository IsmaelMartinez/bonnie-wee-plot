/**
 * useAllotmentData Hook
 *
 * Core data lifecycle and year/season management.
 * Foundation hook that other allotment hooks depend on.
 *
 * Strategy switch (ADR 027 Step 3): when `USE_YJS_STORAGE` is `false`
 * (default), routes everything through the legacy `useSyncedStorage`
 * chain exactly as before. When `true`, composes `useYjsDoc` with the
 * legacy chain via `useYjsToLegacyMirror` — the Yjs doc is the
 * canonical engine and the legacy chain runs in parallel as the
 * cloud-sync mirror. PR-A ships the seam only; the seven domain hooks
 * stay on the legacy `setData` API until PR-B ports them.
 */

'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  AllotmentData,
  SeasonRecord,
  STORAGE_KEY,
} from '@/types/unified-allotment'
import {
  initializeStorage,
  saveAllotmentData,
  validateAllotmentData,
  getSeasonByYear,
  getAvailableYears,
  setCurrentYear,
} from '@/services/allotment-storage'
import { StorageResult, SaveStatus, UsePersistedStorageReturn } from '../usePersistedStorage'
import { useSyncedStorage } from '../useSyncedStorage'
import { useYjsDoc } from '../useYjsDoc'
import { useYjsToLegacyMirror } from '../useYjsToLegacyMirror'
import { USE_YJS_STORAGE } from '@/config/release-visibility'
import type { SyncStatus } from '@/types/storage'
import type { SyncConflict } from '../useSyncedStorage'
import type { AllotmentStoreShape } from '@/lib/yjs-spike/allotment-yjs'

// Re-export SaveStatus for backward compatibility
export type { SaveStatus } from '../usePersistedStorage'

// ============ STORAGE OPTIONS ============

const loadAllotment = (): StorageResult<AllotmentData> => {
  return initializeStorage()
}

const saveAllotment = (data: AllotmentData): StorageResult<void> => {
  return saveAllotmentData(data)
}

const validateAllotment = (parsed: unknown): StorageResult<AllotmentData> => {
  const validation = validateAllotmentData(parsed)
  if (!validation.valid) {
    return { success: false, error: validation.errors?.join(', ') }
  }
  return { success: true, data: parsed as AllotmentData }
}

// ============ HOOK TYPES ============

/**
 * Mutate function exposed on the Yjs path so domain hooks can apply
 * in-place changes against the SyncedStore proxy. The legacy path
 * provides a no-op implementation; domain hooks pick between `setData`
 * (legacy) and `mutate` (Yjs) via the `USE_YJS_STORAGE` flag.
 */
export type MutateFn = (fn: (store: AllotmentStoreShape) => void) => void

export interface UseAllotmentDataReturn {
  // State
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
  /**
   * Runs `fn` inside a Yjs transaction against the live SyncedStore
   * proxy. On the legacy path this is a no-op — the flag-gated Yjs
   * branch in domain hooks never runs while `USE_YJS_STORAGE` is
   * `false`, so the legacy `mutate` is reached only when a future
   * caller invokes it unconditionally (which would be a bug).
   */
  mutate: MutateFn
  currentSeason: SeasonRecord | null
  selectedYear: number
  isLoading: boolean
  error: string | null
  saveError: string | null
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  isSyncedFromOtherTab: boolean
  syncStatus: SyncStatus
  syncError: string | null
  syncConflict: SyncConflict | null
  resolveConflict: (choice: 'cloud' | 'local') => void

  // Actions
  selectYear: (year: number) => void
  getYears: () => number[]
  reload: () => void
  flushSave: () => Promise<boolean>
  flushPush: () => Promise<void>
  clearSaveError: () => void
  cancelPendingSave: () => void
  updateMeta: (updates: Partial<AllotmentData['meta']>) => void
}

// ============ HOOK IMPLEMENTATION ============

// `USE_YJS_STORAGE` is a build-time constant from
// `src/config/release-visibility.ts`. Picking the implementation at module
// load (rather than inside the hook body) keeps the hook-call order stable
// for React, lets the bundler tree-shake the unused branch in production,
// and avoids the conditional-hook pattern that `react-hooks/rules-of-hooks`
// would flag.
const useAllotmentDataImpl: () => UseAllotmentDataReturn = USE_YJS_STORAGE
  ? useAllotmentDataYjs
  : useAllotmentDataLegacy

export function useAllotmentData(): UseAllotmentDataReturn {
  return useAllotmentDataImpl()
}

// ----- legacy branch -----

// On the legacy branch the `mutate` shape exists only so the domain
// hooks can take it as a prop unconditionally; the Yjs branch in each
// method is gated on `USE_YJS_STORAGE` (a build-time `false` here), so
// this no-op is never reached during normal operation. If a future
// caller invokes it unconditionally, the warning surfaces the bug.
const legacyMutateNoop: MutateFn = () => {
  console.warn(
    'useAllotmentData.mutate called on legacy path — only reachable if a caller ignores the USE_YJS_STORAGE flag gate',
  )
}

function useAllotmentDataLegacy(): UseAllotmentDataReturn {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Handle year sync when data changes from another tab
  const handleSync = useCallback((newData: AllotmentData) => {
    setSelectedYear(newData.currentYear)
  }, [])

  const {
    data,
    setData,
    saveStatus,
    isLoading,
    error,
    saveError,
    isSyncedFromOtherTab,
    lastSavedAt,
    reload: baseReload,
    flushSave,
    flushPush,
    clearSaveError,
    cancelPendingSave,
    syncStatus,
    syncError,
    syncConflict,
    resolveConflict,
  } = useSyncedStorage({
    storageKey: STORAGE_KEY,
    load: loadAllotment,
    save: saveAllotment,
    validate: validateAllotment,
    onSync: handleSync,
  })

  // Update selectedYear when data first loads
  const initializedRef = useRef(false)
  useEffect(() => {
    if (data && !initializedRef.current) {
      initializedRef.current = true
      setSelectedYear(data.currentYear)
    }
  }, [data])

  // Derived state: current season based on selected year
  const currentSeason = useMemo(() => {
    if (!data) return null
    return getSeasonByYear(data, selectedYear) || null
  }, [data, selectedYear])

  // ============ YEAR NAVIGATION ============

  const selectYear = useCallback((year: number) => {
    setSelectedYear(year)
    // Use functional update to avoid stale data when called after createSeason
    setData(prevData => prevData ? setCurrentYear(prevData, year) : prevData)
  }, [setData])

  const getYears = useCallback(() => {
    if (!data) return []
    return getAvailableYears(data)
  }, [data])

  // ============ DATA REFRESH ============

  const reload = useCallback(() => {
    baseReload()
    // After reload, sync the selectedYear with the loaded data
    const result = initializeStorage()
    if (result.success && result.data) {
      setSelectedYear(result.data.currentYear)
    }
  }, [baseReload])

  // ============ METADATA OPERATIONS ============

  const updateMeta = useCallback((updates: Partial<AllotmentData['meta']>) => {
    if (!data) return
    setData({
      ...data,
      meta: {
        ...data.meta,
        ...updates
      }
    })
  }, [data, setData])

  return {
    // State
    data,
    setData,
    mutate: legacyMutateNoop,
    currentSeason,
    selectedYear,
    isLoading,
    error,
    saveError,
    saveStatus,
    lastSavedAt,
    isSyncedFromOtherTab,
    syncStatus,
    syncError,
    syncConflict,
    resolveConflict,

    // Actions
    selectYear,
    getYears,
    reload,
    flushSave,
    flushPush,
    clearSaveError,
    cancelPendingSave,
    updateMeta,
  }
}

// ----- Yjs branch -----

/**
 * Tracks `setData` call sites we have already warned about during the
 * Yjs soak. Each unported domain-hook call site fires the warning
 * exactly once. De-duplication keys on the full captured stack trace so
 * it works regardless of engine-specific stack frame formatting; multiple
 * unported sites still surface independently because their stacks differ.
 */
const warnedSetDataStacks = new Set<string>()

function emitUnportedSetDataWarning(): void {
  const stack = new Error().stack ?? '<no stack available>'
  if (warnedSetDataStacks.has(stack)) return
  warnedSetDataStacks.add(stack)
  console.warn(
    'useAllotmentData.setData called on Yjs path — unported domain-hook call site\n' + stack,
  )
}

function useAllotmentDataYjs(): UseAllotmentDataReturn {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Yjs side: canonical engine on this path. Constructed before
  // `handleSync` so the callback can close over `yjs.replaceFromJson`
  // and propagate cross-context updates into the Y.Doc — without this
  // step the legacy chain would adopt sibling-tab / cloud writes while
  // the Yjs doc stayed stale, and the mirror would push the stale doc
  // straight back, undoing the remote change.
  const yjs = useYjsDoc()

  // Propagate cross-context writes (sibling-tab `storage` events, P2P
  // sync events, post-conflict cloud snapshots adopted via the legacy
  // chain's `applyRemoteSnapshot`) into the Yjs doc. `replaceFromJson`
  // runs inside a Yjs transaction tagged with the hook's local origin,
  // so the doc's own `update` listener publishes a fresh snapshot but
  // doesn't trip the "synced from another tab" flag — the legacy chain
  // already raised that affordance.
  //
  // The downstream mirror (`useYjsToLegacyMirror`) will see the new
  // snapshot and call `synced.setData(snapshot)`. The legacy chain just
  // adopted the same data, so `usePersistedStorage`'s content-equality
  // dedup on `latestSerializedRef` short-circuits the redundant save +
  // cloud push.
  const handleSync = useCallback((newData: AllotmentData) => {
    yjs.replaceFromJson(newData)
    setSelectedYear(newData.currentYear)
  }, [yjs])

  // Legacy side: kept alive as the cloud-sync mirror. `useSyncedStorage`
  // continues to listen for `saveStatus === 'saved'` and pushes to
  // Supabase via the existing chain.
  const synced = useSyncedStorage({
    storageKey: STORAGE_KEY,
    load: loadAllotment,
    save: saveAllotment,
    validate: validateAllotment,
    onSync: handleSync,
  })

  // Mirror Yjs → legacy. Driving `synced.setData` here causes
  // `usePersistedStorage` to debounce-save to localStorage and
  // `useSyncedStorage` to push to the cloud, exactly as a legacy
  // `setData` call would.
  useYjsToLegacyMirror(yjs.data, synced as unknown as UsePersistedStorageReturn<AllotmentData>)

  // Update selectedYear when the Yjs snapshot first arrives.
  const initializedRef = useRef(false)
  useEffect(() => {
    if (yjs.data && !initializedRef.current) {
      initializedRef.current = true
      setSelectedYear(yjs.data.currentYear)
    }
  }, [yjs.data])

  // `setData` is no longer the write path on the Yjs branch. Domain
  // hooks should call `mutate(fn)` instead (PR-B). Until they do, every
  // call from an unported site lands here — the warning surfaces those
  // sites during development so PR-B can find and port them. The Yjs
  // path is effectively read-only in PR-A because no domain hooks have
  // been ported; that is intentional.
  const setData = useCallback<UseAllotmentDataReturn['setData']>(
    () => {
      emitUnportedSetDataWarning()
    },
    [],
  )

  // Derived state: current season based on selected year
  const currentSeason = useMemo(() => {
    if (!yjs.data) return null
    return getSeasonByYear(yjs.data, selectedYear) || null
  }, [yjs.data, selectedYear])

  // Year navigation routes through the Yjs doc directly. Even on the
  // Yjs path, year navigation is a write path that the domain-hook
  // ports in PR-B will need to keep functional — we provide a working
  // implementation up front so the foundation PR doesn't break the
  // year picker if the flag is ever flipped locally for spot-check.
  const selectYear = useCallback((year: number) => {
    setSelectedYear(year)
    yjs.mutate(store => {
      store.state.currentYear = year
    })
  }, [yjs])

  const getYears = useCallback(() => {
    if (!yjs.data) return []
    return getAvailableYears(yjs.data)
  }, [yjs.data])

  const reload = useCallback(() => {
    // On the Yjs path, "reload" maps onto re-reading the legacy
    // localStorage snapshot and re-hydrating the Yjs doc from it.
    // `useYjsDoc` already runs this exact pipeline on mount; the
    // explicit reload here lets settings flows trigger it after, e.g.,
    // an import overwrites legacy localStorage.
    const result = initializeStorage()
    if (result.success && result.data) {
      yjs.replaceFromJson(result.data)
      setSelectedYear(result.data.currentYear)
    }
  }, [yjs])

  const updateMeta = useCallback((updates: Partial<AllotmentData['meta']>) => {
    yjs.mutate(store => {
      Object.assign(store.meta, updates)
    })
  }, [yjs])

  // `flushSave` on the Yjs path awaits IndexedDB persistence plus the
  // pending mirror write so callers see the same "everything saved"
  // contract as the legacy chain.
  const flushSave = useCallback(async (): Promise<boolean> => {
    const yjsFlushed = await yjs.flushSave()
    const mirrorFlushed = await synced.flushSave()
    return yjsFlushed && mirrorFlushed
  }, [yjs, synced])

  // Wrap the legacy `resolveConflict` so a `'cloud'` choice also writes
  // the remote snapshot into the Yjs doc. `synced.resolveConflict`
  // clears `syncConflict` after running, so we capture the conflict
  // payload *before* delegating. For the `'local'` choice the Yjs state
  // is canonical — the mirror is already pushing it out, no action
  // needed here.
  const resolveConflict = useCallback(
    (choice: 'cloud' | 'local') => {
      const conflict = synced.syncConflict
      synced.resolveConflict(choice)
      if (choice === 'cloud' && conflict?.remote) {
        yjs.replaceFromJson(conflict.remote)
      }
    },
    [yjs, synced],
  )

  return {
    data: yjs.data,
    setData,
    mutate: yjs.mutate,
    currentSeason,
    selectedYear,
    isLoading: yjs.isLoading,
    error: yjs.error,
    saveError: synced.saveError,
    saveStatus: synced.saveStatus,
    lastSavedAt: synced.lastSavedAt,
    isSyncedFromOtherTab: yjs.isSyncedFromOtherTab || synced.isSyncedFromOtherTab,
    syncStatus: synced.syncStatus,
    syncError: synced.syncError,
    syncConflict: synced.syncConflict,
    resolveConflict,

    selectYear,
    getYears,
    reload,
    flushSave,
    flushPush: synced.flushPush,
    clearSaveError: synced.clearSaveError,
    cancelPendingSave: synced.cancelPendingSave,
    updateMeta,
  }
}
