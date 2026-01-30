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

// Re-export for convenience
export type { SaveStatus, StorageResult } from '@/types/storage'

const SAVE_DEBOUNCE_MS = 500

// Global flag to prevent saves during import/reload
// This is set by DataManagement before triggering reload to prevent
// the hook from overwriting just-imported data with stale in-memory state
declare global {
  interface Window {
    __disablePersistenceUntilReload?: boolean
  }
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

  // Load data on mount
  useEffect(() => {
    const result = load()
    if (result.success && result.data) {
      setDataState(result.data)
      setError(null)
    } else {
      setError(result.error || 'Failed to load data')
    }
    setIsLoading(false)
  }, [load])

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
        onSync?.(result.data)
        setIsSyncedFromOtherTab(true)
        setTimeout(() => setIsSyncedFromOtherTab(false), 3000)
      }
    }
    window.addEventListener('sync-data-updated', handleSyncUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sync-data-updated', handleSyncUpdate)
    }
  }, [storageKey, load, validate, onSync])

  // Debounced save function
  const debouncedSave = useCallback(
    (dataToSave: T) => {
      // Check if saves are disabled (e.g., during import before reload)
      if (typeof window !== 'undefined' && window.__disablePersistenceUntilReload) {
        console.log('[usePersistedStorage] Saves disabled - skipping debouncedSave')
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
        if (typeof window !== 'undefined' && window.__disablePersistenceUntilReload) {
          console.log('[usePersistedStorage] Saves disabled - skipping scheduled save')
          pendingDataRef.current = null
          saveTimeoutRef.current = null
          setSaveStatus('idle')
          return
        }

        if (pendingDataRef.current) {
          // Add to recent saves set before saving to detect our own storage events
          const serialized = JSON.stringify(pendingDataRef.current)
          recentSavesRef.current.add(serialized)
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
          }
          pendingDataRef.current = null
        }
        saveTimeoutRef.current = null
      }, SAVE_DEBOUNCE_MS)
    },
    [save]
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
        save(pendingDataRef.current)
      }
    }
  }, [save])

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

      // Verify write succeeded by re-loading
      const verification = load()
      const verified = verification.success &&
                       verification.data &&
                       JSON.stringify(verification.data) === serialized

      if (verified) {
        pendingDataRef.current = null
        setSaveError(null)
        setSaveStatus('saved')
        setLastSavedAt(new Date())
        setTimeout(() => setSaveStatus('idle'), 2000)
        setTimeout(() => recentSavesRef.current.delete(serialized), 1000)
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
  }, [save, load])

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
    }
  }, [data, save])

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
  }
}
