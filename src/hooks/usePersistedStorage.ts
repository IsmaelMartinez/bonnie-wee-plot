/**
 * usePersistedStorage Hook
 *
 * Generic hook for localStorage persistence with:
 * - Debounced saves (500ms)
 * - Multi-tab sync via storage events
 * - Save status tracking
 * - Pending data refs to avoid stale closures
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SaveStatus, StorageResult } from '@/types/storage'
import { isImportInProgress } from '@/lib/persistence-signal'

// Re-export for convenience
export type { SaveStatus, StorageResult } from '@/types/storage'

const SAVE_DEBOUNCE_MS = 500

/**
 * Same-tab broadcast event for `usePersistedStorage` writes.
 *
 * The browser `storage` event only fires in *other* tabs, so two
 * `usePersistedStorage` instances mounted in the same tab (e.g. Settings page
 * and `AitorAuthGate`) never see each other's writes without an explicit
 * broadcast. We dispatch this CustomEvent after every successful save so
 * sibling instances can refresh their local state immediately. The originating
 * instance includes its `instanceId` in the payload and skips its own event.
 */
const SAME_TAB_UPDATE_EVENT = 'bonnie:storage-update'

interface SameTabUpdateDetail<T> {
  storageKey: string
  instanceId: string
  // Monotonic sequence number from `nextSameTabSeq()`. Lets receivers ignore
  // broadcasts that are older than data we've already adopted or written —
  // critical when two siblings auto-save in parallel and one of them just
  // accepted a fresher user write.
  seq: number
  data: T
  // Pre-computed `JSON.stringify(data)` from the sender. Receivers store this
  // directly into `latestSerializedRef` so the same string flows through both
  // the write and the read path, avoiding a redundant stringify on each
  // sibling.
  serialized: string
}

type SameTabUpdateEvent<T> = CustomEvent<SameTabUpdateDetail<T>>

function dispatchSameTabUpdate<T>(detail: SameTabUpdateDetail<T>): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<SameTabUpdateDetail<T>>(SAME_TAB_UPDATE_EVENT, { detail })
  )
}

// Module-scoped counter for instance ids. `useId` is unsuitable here because
// it returns the same value across independently-mounted React trees (which
// includes `renderHook` test scaffolding), defeating the "skip own broadcast"
// check. A plain monotonic counter is unique per `usePersistedStorage` call.
let instanceCounter = 0

// Module-scoped monotonic sequence shared across all `usePersistedStorage`
// instances in this tab. Combined with `latestSeenSeqRef` per instance it
// gives us last-writer-wins ordering for same-tab broadcasts without any
// timer hacks.
let sameTabSeq = 0
function nextSameTabSeq(): number {
  sameTabSeq += 1
  return sameTabSeq
}

export interface UsePersistedStorageOptions<T> {
  storageKey: string
  load: () => StorageResult<T>
  save: (data: T) => StorageResult<void>
  validate?: (parsed: unknown) => StorageResult<T>
  onSync?: (data: T) => void
}

export interface UsePersistedStorageReturn<T> {
  data: T | null
  setData: (data: T | ((prev: T | null) => T | null)) => void
  saveStatus: SaveStatus
  isLoading: boolean
  error: string | null
  saveError: string | null
  isSyncedFromOtherTab: boolean
  lastSavedAt: Date | null
  reload: () => void
  flushSave: () => Promise<boolean>
  clearSaveError: () => void
  cancelPendingSave: () => void
  retrySave: () => void
}

export function usePersistedStorage<T>(
  options: UsePersistedStorageOptions<T>
): UsePersistedStorageReturn<T> {
  const { storageKey, load, save, validate, onSync } = options

  const [data, setDataState] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSyncedFromOtherTab, setIsSyncedFromOtherTab] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDataRef = useRef<T | null>(null)
  // Track recent saves to detect our own storage events (handles rapid successive saves)
  const recentSavesRef = useRef<Set<string>>(new Set())
  // Serialized snapshot of the latest value this instance has either saved
  // itself or adopted from a sibling. Used by `debouncedSave` to skip
  // re-saving data that just arrived from a sibling broadcast.
  const latestSerializedRef = useRef<string | null>(null)
  // Highest same-tab broadcast sequence number this instance has either
  // emitted itself or accepted from a sibling. Receivers refuse broadcasts
  // with `seq <= latestSeenSeqRef.current` so stale auto-save echoes can't
  // overwrite fresher local state.
  const latestSeenSeqRef = useRef<number>(0)
  // Unique id per hook instance so we can ignore our own same-tab broadcasts.
  // `useState` lazy initializer is pure across renders and runs exactly once
  // per mount, giving each hook instance a distinct id.
  const [instanceId] = useState(() => `usp-${++instanceCounter}`)

  // Records a value that has just been adopted from storage (own write or
  // sibling broadcast). Seeds `latestSerializedRef` so the auto-save effect
  // sees no diff between `data` and what's in storage and bumps
  // `latestSeenSeqRef` so stale broadcasts already in flight (queued from a
  // previous instance or an earlier sibling) are ignored.
  const recordAdoptedState = useCallback(
    (serialized: string, seq: number) => {
      latestSerializedRef.current = serialized
      if (seq > latestSeenSeqRef.current) {
        latestSeenSeqRef.current = seq
      }
    },
    []
  )

  // Records a value that we just wrote to localStorage ourselves and
  // broadcasts it to sibling instances in the same tab. Used by
  // `debouncedSave`, `flushSave`, and `retrySave` — they all share this exact
  // post-save bookkeeping.
  const recordSavedState = useCallback(
    (serialized: string, dataToBroadcast: T) => {
      const seq = nextSameTabSeq()
      latestSerializedRef.current = serialized
      latestSeenSeqRef.current = seq
      dispatchSameTabUpdate<T>({
        storageKey,
        instanceId,
        seq,
        data: dataToBroadcast,
        serialized,
      })
    },
    [storageKey, instanceId]
  )

  // Load data on mount
  useEffect(() => {
    const result = load()
    if (result.success && result.data) {
      setDataState(result.data)
      // Record what we just loaded so the auto-save effect's first run knows
      // the data is already in storage and skips both the redundant write and
      // the resulting broadcast — siblings would otherwise echo each other's
      // initial loads back into freshly-set user state. Also fast-forward
      // `latestSeenSeqRef` to the current sequence so any stale broadcasts
      // already queued from a previous instance are ignored.
      recordAdoptedState(JSON.stringify(result.data), sameTabSeq)
      setError(null)
    } else {
      setError(result.error || 'Failed to load data')
    }
    setIsLoading(false)
  }, [load, recordAdoptedState])

  // Multi-tab sync
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== storageKey) return

      // Ignore our own saves by checking the set of recent saves
      if (event.newValue && recentSavesRef.current.has(event.newValue)) {
        return
      }

      if (event.newValue === null) {
        const result = load()
        if (result.success && result.data) {
          setDataState(result.data)
          // Seed the serialized snapshot so the next auto-save tick sees no
          // diff and skips, instead of treating this remote-driven change as
          // a fresh local edit and echoing it back through localStorage.
          recordAdoptedState(JSON.stringify(result.data), sameTabSeq)
          onSync?.(result.data)
          setIsSyncedFromOtherTab(true)
          setTimeout(() => setIsSyncedFromOtherTab(false), 3000)
        }
        return
      }

      try {
        const parsed = JSON.parse(event.newValue)

        // If custom validation provided, use it
        if (validate) {
          const validation = validate(parsed)
          if (!validation.success || !validation.data) {
            console.warn('Ignoring invalid sync data from other tab:', validation.error)
            return
          }
        }

        // Cancel any pending save (other tab's data is newer)
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }
        pendingDataRef.current = null

        // Re-load from storage to get properly validated data
        const result = load()
        if (result.success && result.data) {
          setDataState(result.data)
          // Seed the serialized snapshot so the next auto-save tick sees no
          // diff and skips, instead of treating this remote-driven change as
          // a fresh local edit and echoing it back through localStorage.
          recordAdoptedState(JSON.stringify(result.data), sameTabSeq)
          onSync?.(result.data)
          setIsSyncedFromOtherTab(true)
          setTimeout(() => setIsSyncedFromOtherTab(false), 3000)
        }
      } catch (e) {
        console.error('Failed to parse storage event data:', e)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom sync events (P2P sync)
    const handleSyncUpdate = () => {
      const result = load()
      if (result.success && result.data) {
        setDataState(result.data)
        // Seed the serialized snapshot so the next auto-save tick sees no
        // diff and skips, instead of treating this remote-driven change as
        // a fresh local edit and echoing it back through localStorage.
        recordAdoptedState(JSON.stringify(result.data), sameTabSeq)
        onSync?.(result.data)
        setIsSyncedFromOtherTab(true)
        setTimeout(() => setIsSyncedFromOtherTab(false), 3000)
      }
    }
    window.addEventListener('sync-data-updated', handleSyncUpdate)

    // Same-tab broadcast from sibling usePersistedStorage instances.
    // The browser `storage` event does not fire in the tab that wrote, so
    // without this two instances in the same tab never see each other's writes.
    // Unlike the cross-tab `storage` handler, we do NOT cancel pending saves
    // here: same-tab broadcasts can race with our own in-flight write of
    // newer state, and killing that pending save would lose user input. The
    // auto-save effect re-runs naturally if the listener's `setDataState`
    // changes `data`.
    const handleSameTabUpdate = (event: Event) => {
      const detail = (event as SameTabUpdateEvent<T>).detail
      if (!detail) return
      if (detail.storageKey !== storageKey) return
      // Skip our own broadcast.
      if (detail.instanceId === instanceId) return
      // Last-writer-wins: ignore broadcasts older than data we've already
      // adopted or written. Without this, two siblings auto-saving in
      // parallel could echo each other's stale loads back into fresh state.
      if (detail.seq <= latestSeenSeqRef.current) return

      // Defensively re-validate the payload before adopting it. Cheaper than
      // a re-read from localStorage and avoids trusting siblings blindly.
      if (validate) {
        const validation = validate(detail.data)
        if (!validation.success || !validation.data) {
          console.warn(
            'Ignoring invalid same-tab broadcast:',
            validation.error
          )
          return
        }
        // Reuse the sender's pre-computed string when the validator returned
        // the data unchanged; only re-stringify if the validator normalised
        // the payload (different reference) so our serialized snapshot
        // matches the data we actually adopted.
        const adoptedSerialized =
          validation.data === detail.data
            ? detail.serialized
            : JSON.stringify(validation.data)
        recordAdoptedState(adoptedSerialized, detail.seq)
        setDataState(validation.data)
        onSync?.(validation.data)
        return
      }

      recordAdoptedState(detail.serialized, detail.seq)
      setDataState(detail.data)
      onSync?.(detail.data)
    }
    window.addEventListener(SAME_TAB_UPDATE_EVENT, handleSameTabUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sync-data-updated', handleSyncUpdate)
      window.removeEventListener(SAME_TAB_UPDATE_EVENT, handleSameTabUpdate)
    }
  }, [storageKey, load, validate, onSync, instanceId, recordAdoptedState])

  // Debounced save function
  const debouncedSave = useCallback(
    (dataToSave: T) => {
      // Check if saves are disabled (e.g., during import before reload)
      if (isImportInProgress()) {
        console.log('[usePersistedStorage] Saves disabled - skipping debouncedSave')
        return
      }

      // Stringify once and reuse for the echo-skip guard, the `recentSavesRef`
      // deduper, and the eventual `recordSavedState` broadcast. Safe to hoist:
      // when `debouncedSave` is invoked twice in quick succession the prior
      // timer is cleared, so only the latest closure's `dataToSave` /
      // `serialized` ever flow into the save path.
      const serialized = JSON.stringify(dataToSave)

      // Skip the save entirely if `dataToSave` matches the snapshot we just
      // adopted from a sibling broadcast. The sibling already wrote it to
      // localStorage; re-saving would loop broadcasts forever.
      if (
        latestSerializedRef.current !== null &&
        serialized === latestSerializedRef.current
      ) {
        return
      }

      pendingDataRef.current = dataToSave
      setSaveError(null)
      setSaveStatus('saving')

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        // Double-check the flag inside the timeout in case it was set after scheduling
        if (isImportInProgress()) {
          console.log('[usePersistedStorage] Saves disabled - skipping scheduled save')
          pendingDataRef.current = null
          saveTimeoutRef.current = null
          setSaveStatus('idle')
          return
        }

        if (pendingDataRef.current) {
          // Add to recent saves set before saving to detect our own storage events
          recentSavesRef.current.add(serialized)
          const dataToBroadcast = pendingDataRef.current
          const result = save(pendingDataRef.current)
          if (!result.success) {
            console.error('Failed to save data:', result.error)
            setSaveError(result.error || 'Failed to save data')
            setSaveStatus('error')
            recentSavesRef.current.delete(serialized)
          } else {
            setSaveError(null)
            setSaveStatus('saved')
            setLastSavedAt(new Date())
            setTimeout(() => setSaveStatus('idle'), 2000)
            // Clean up from recent saves after 1 second
            setTimeout(() => recentSavesRef.current.delete(serialized), 1000)
            // Record our own write so the listener's seq guard recognises any
            // stale sibling echoes as older and refuses them, and broadcast
            // to sibling instances.
            recordSavedState(serialized, dataToBroadcast)
          }
          pendingDataRef.current = null
        }
        saveTimeoutRef.current = null
      }, SAVE_DEBOUNCE_MS)
    },
    [save, recordSavedState]
  )

  // Auto-save on data change
  useEffect(() => {
    if (data && !isLoading) {
      debouncedSave(data)
    }
  }, [data, isLoading, debouncedSave])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (pendingDataRef.current) {
        const dataToSave = pendingDataRef.current
        const result = save(dataToSave)
        // Route through `recordSavedState` so siblings in the same tab receive
        // a broadcast for unmount-flushed writes, matching the symmetry with
        // `debouncedSave` / `flushSave` / `retrySave`. Skip on save failure —
        // there's nothing for siblings to adopt if the write didn't persist.
        if (result.success) {
          recordSavedState(JSON.stringify(dataToSave), dataToSave)
        }
      }
    }
  }, [save, recordSavedState])

  // Wrapper for setData that supports function updates
  const setData = useCallback(
    (update: T | ((prev: T | null) => T | null)) => {
      if (typeof update === 'function') {
        setDataState(update as (prev: T | null) => T | null)
      } else {
        setDataState(update)
      }
    },
    []
  )

  const reload = useCallback(() => {
    setIsLoading(true)
    const result = load()
    if (result.success && result.data) {
      setDataState(result.data)
      setError(null)
    } else {
      setError(result.error || 'Failed to reload data')
    }
    setIsLoading(false)
  }, [load])

  const flushSave = useCallback(async (): Promise<boolean> => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    if (!pendingDataRef.current) return true

    try {
      const dataToSave = pendingDataRef.current
      const serialized = JSON.stringify(dataToSave)
      recentSavesRef.current.add(serialized)

      const result = save(dataToSave)
      if (!result.success) {
        setSaveError(result.error || 'Failed to save data')
        setSaveStatus('error')
        recentSavesRef.current.delete(serialized)
        return false
      }

      // Verify write succeeded by re-loading and checking it was persisted
      // Note: we only check that data loads successfully, not string equality,
      // because migrations may normalize fields during load (changing serialization)
      const verification = load()
      if (verification.success && verification.data) {
        pendingDataRef.current = null
        setSaveError(null)
        setSaveStatus('saved')
        setLastSavedAt(new Date())
        setTimeout(() => setSaveStatus('idle'), 2000)
        setTimeout(() => recentSavesRef.current.delete(serialized), 1000)
        recordSavedState(serialized, dataToSave)
        return true
      } else {
        setSaveError('Verification failed: data did not persist correctly')
        setSaveStatus('error')
        recentSavesRef.current.delete(serialized)
        return false
      }
    } catch (error) {
      console.error('Flush failed:', error)
      setSaveError('Flush failed: unexpected error')
      setSaveStatus('error')
      return false
    }
  }, [save, load, recordSavedState])

  const clearSaveError = useCallback(() => {
    setSaveError(null)
  }, [])

  const retrySave = useCallback(() => {
    // Retry saving current data state (useful after quota exceeded errors)
    if (!data) return

    setSaveError(null)
    setSaveStatus('saving')

    const serialized = JSON.stringify(data)
    recentSavesRef.current.add(serialized)
    const result = save(data)

    if (!result.success) {
      setSaveError(result.error || 'Failed to save data')
      setSaveStatus('error')
      recentSavesRef.current.delete(serialized)
    } else {
      setSaveError(null)
      setSaveStatus('saved')
      setLastSavedAt(new Date())
      setTimeout(() => setSaveStatus('idle'), 2000)
      setTimeout(() => recentSavesRef.current.delete(serialized), 1000)
      recordSavedState(serialized, data)
    }
  }, [data, save, recordSavedState])

  // Cancel any pending debounced save without writing to localStorage.
  // Use before a direct save to prevent stale pending data from overwriting.
  const cancelPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    pendingDataRef.current = null
  }, [])

  return {
    data,
    setData,
    saveStatus,
    isLoading,
    error,
    saveError,
    isSyncedFromOtherTab,
    lastSavedAt,
    reload,
    flushSave,
    clearSaveError,
    retrySave,
    cancelPendingSave,
  }
}
