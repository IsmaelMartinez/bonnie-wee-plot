/**
 * useAllotmentData Hook
 *
 * Core data lifecycle and year/season management. Foundation hook that
 * the other allotment hooks depend on.
 *
 * Storage engine (ADR 027): the Yjs document (`useYjsDoc`) is the
 * canonical local engine, backed by IndexedDB via `y-indexeddb`. Cloud
 * sync runs through `useCloudSync`, which consumes the Yjs snapshot
 * directly (fetch / push / LWW-guard / conflict dialog). Domain hooks
 * write through `mutate(fn)` against the SyncedStore proxy; there is no
 * legacy `setData`/localStorage chain any more (Step 5 retired it).
 */

'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  AllotmentData,
  SeasonRecord,
} from '@/types/unified-allotment'
import {
  initializeStorage,
  getSeasonByYear,
  getAvailableYears,
} from '@/services/allotment-storage'
import { useYjsDoc } from '../useYjsDoc'
import { useCloudSync } from '../useCloudSync'
import type { SaveStatus, SyncStatus } from '@/types/storage'
import type { SyncConflict } from '../useCloudSync'
import type { AllotmentStoreShape } from '@/lib/yjs/allotment-yjs'

// Re-export SaveStatus for backward compatibility
export type { SaveStatus } from '@/types/storage'

// ============ HOOK TYPES ============

/**
 * Mutate function domain hooks use to apply in-place changes against the
 * SyncedStore proxy inside a Yjs transaction.
 */
export type MutateFn = (fn: (store: AllotmentStoreShape) => void) => void

export interface UseAllotmentDataReturn {
  // State
  data: AllotmentData | null
  /** Runs `fn` inside a Yjs transaction against the live SyncedStore proxy. */
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

export function useAllotmentData(): UseAllotmentDataReturn {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Canonical local engine: the Yjs doc backed by IndexedDB.
  const yjs = useYjsDoc()

  // Cloud sync consumes the Yjs snapshot directly. On a `'cloud'`
  // conflict resolution it adopts the remote snapshot into the doc via
  // `replaceFromJson`; on `'local'` it pushes the current snapshot. The
  // unload flush drives IndexedDB persistence (`flushSave`) before the
  // final push.
  const cloud = useCloudSync({
    data: yjs.data,
    applyRemote: yjs.replaceFromJson,
    flushLocal: yjs.flushSave,
    isSyncedFromOtherTab: yjs.isSyncedFromOtherTab,
  })

  // Initialise `selectedYear` from the first published snapshot.
  const initializedRef = useRef(false)
  useEffect(() => {
    if (yjs.data && !initializedRef.current) {
      initializedRef.current = true
      setSelectedYear(yjs.data.currentYear)
    }
  }, [yjs.data])

  // Local-save indicator. `y-indexeddb` persists each doc update
  // near-immediately, so a mutation is effectively saved the moment the
  // new snapshot publishes. Track a brief saved → idle transition so the
  // existing save affordance keeps working without the legacy 500ms
  // localStorage debounce. The first snapshot (initial load / hydration)
  // is not a user save, so it is skipped.
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const sawFirstSnapshotRef = useRef(false)
  useEffect(() => {
    if (!yjs.data) return
    if (!sawFirstSnapshotRef.current) {
      sawFirstSnapshotRef.current = true
      return
    }
    // A cross-tab / cloud update also republishes `yjs.data`; that isn't
    // a local save, so don't flash "Saved" for it. `isSyncedFromOtherTab`
    // is read but kept out of the dep array on purpose: it self-resets to
    // `false` ~3s later, and re-running on that reset (with `data`
    // unchanged) would flash a spurious "Saved".
    if (yjs.isSyncedFromOtherTab) return
    setSaveStatus('saved')
    setLastSavedAt(new Date())
    const timer = setTimeout(() => setSaveStatus('idle'), 2000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yjs.data])

  // Save-error surfacing. There is no separate local-save error channel
  // on the Yjs path; the one persistence failure worth showing is an
  // unavailable IndexedDB (`yjs.error`), which the allotment page renders
  // in its dismissible banner. `clearSaveError` dismisses it locally.
  const [saveErrorDismissed, setSaveErrorDismissed] = useState(false)
  const saveError = saveErrorDismissed ? null : yjs.error
  const clearSaveError = useCallback(() => setSaveErrorDismissed(true), [])

  // No debounced local save to cancel on the Yjs path.
  const cancelPendingSave = useCallback(() => {}, [])

  // Derived state: current season based on selected year
  const currentSeason = useMemo(() => {
    if (!yjs.data) return null
    return getSeasonByYear(yjs.data, selectedYear) || null
  }, [yjs.data, selectedYear])

  // ============ YEAR NAVIGATION ============

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

  // ============ DATA REFRESH ============

  const reload = useCallback(() => {
    // "reload" re-reads the legacy `allotment-unified-data` snapshot
    // (written by import / restore / fresh-init flows) and re-hydrates
    // the Yjs doc from it. `useYjsDoc` runs the same pipeline on mount;
    // the explicit reload lets settings flows trigger it after an import
    // or restore overwrites that key.
    const result = initializeStorage()
    if (result.success && result.data) {
      yjs.replaceFromJson(result.data)
      setSelectedYear(result.data.currentYear)
    }
  }, [yjs])

  // ============ METADATA OPERATIONS ============

  const updateMeta = useCallback((updates: Partial<AllotmentData['meta']>) => {
    yjs.mutate(store => {
      Object.assign(store.meta, updates)
    })
  }, [yjs])

  // `flushSave` awaits IndexedDB persistence so callers see the same
  // "everything saved locally" contract the legacy chain offered.
  const flushSave = useCallback(async (): Promise<boolean> => {
    return yjs.flushSave()
  }, [yjs])

  return {
    // State
    data: yjs.data,
    mutate: yjs.mutate,
    currentSeason,
    selectedYear,
    isLoading: yjs.isLoading,
    error: yjs.error,
    saveError,
    saveStatus,
    lastSavedAt,
    isSyncedFromOtherTab: yjs.isSyncedFromOtherTab,
    syncStatus: cloud.syncStatus,
    syncError: cloud.syncError,
    syncConflict: cloud.syncConflict,
    resolveConflict: cloud.resolveConflict,

    // Actions
    selectYear,
    getYears,
    reload,
    flushSave,
    flushPush: cloud.flushPush,
    clearSaveError,
    cancelPendingSave,
    updateMeta,
  }
}
