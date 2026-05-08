'use client'

/**
 * useSyncedStorage Hook
 *
 * Wraps usePersistedStorage with Supabase cloud sync when authenticated.
 * localStorage always stays active as the offline cache.
 * When signed in, changes are pushed to Supabase asynchronously.
 * On load, cloud data is fetched and reconciled:
 *  - First sync for a device/user: cloud always wins
 *  - Subsequent syncs: LWW (last-write-wins) with conflict detection
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useOptionalAuth } from './useOptionalAuth'
import { usePersistedStorage, UsePersistedStorageOptions, UsePersistedStorageReturn } from './usePersistedStorage'
import { useNetworkStatus } from './useNetworkStatus'
import {
  fetchRemote,
  pushToRemote,
  contentSnapshot,
  isLocalStructurallySmaller,
} from '@/lib/supabase/sync'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { AllotmentData } from '@/types/unified-allotment'
import type { SyncStatus } from '@/types/storage'

export type { SyncStatus } from '@/types/storage'

export interface SyncConflict {
  local: AllotmentData
  remote: AllotmentData
  remoteUpdatedAt: string
}

export interface UseSyncedStorageReturn<T> extends UsePersistedStorageReturn<T> {
  syncStatus: SyncStatus
  syncError: string | null
  syncConflict: SyncConflict | null
  resolveConflict: (choice: 'cloud' | 'local') => void
}

// Per-user sync flag stored in localStorage
interface SyncFlag {
  lastSyncedAt: string
}

function getSyncFlagKey(userId: string): string {
  return `bonnie-synced-${userId}`
}

export function getSyncFlag(userId: string): SyncFlag | null {
  try {
    const raw = localStorage.getItem(getSyncFlagKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as SyncFlag
  } catch {
    return null
  }
}

export function markSynced(userId: string): void {
  const flag: SyncFlag = { lastSyncedAt: new Date().toISOString() }
  localStorage.setItem(getSyncFlagKey(userId), JSON.stringify(flag))
}

function toTimestamp(value?: string): number {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isNaN(ts) ? 0 : ts
}

export function useSyncedStorage(
  options: UsePersistedStorageOptions<AllotmentData>
): UseSyncedStorageReturn<AllotmentData> {
  const local = usePersistedStorage<AllotmentData>(options)
  const { getToken, userId, isSignedIn } = useOptionalAuth()
  const { isOnline, justReconnected } = useNetworkStatus()

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disabled')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncConflict, setSyncConflict] = useState<SyncConflict | null>(null)
  const syncInProgressRef = useRef(false)
  const syncInProgressUserRef = useRef<string | null>(null)
  const initialSyncDoneRef = useRef(false)
  const pulledSnapshotRef = useRef<string | null>(null)
  const lastPushedRef = useRef<string | null>(null)
  const activeUserIdRef = useRef<string | null>(userId)

  const canSync = isSignedIn && isSupabaseConfigured() && isOnline

  useEffect(() => {
    activeUserIdRef.current = userId
  }, [userId])

  const isStaleSyncUser = (expectedUserId: string): boolean =>
    activeUserIdRef.current !== expectedUserId

  const applyRemoteSnapshot = (remoteData: AllotmentData) => {
    // Use content-only fingerprint so a subsequent local save (which may
    // re-stamp meta.updatedAt) doesn't look like a content change to the
    // push effect.
    const snapshot = contentSnapshot(remoteData)
    pulledSnapshotRef.current = snapshot
    local.setData(remoteData)
    lastPushedRef.current = snapshot
  }

  // Get Clerk JWT for Supabase auth using the "supabase" JWT template.
  const getSupabaseToken = async (): Promise<string | null> => {
    try {
      return await getToken({ template: 'supabase' })
    } catch (err) {
      console.error('[useSyncedStorage] Failed to get auth token:', err)
      return null
    }
  }

  // Resolve a sync conflict by choosing cloud or local data
  const resolveConflict = useCallback(async (choice: 'cloud' | 'local') => {
    const conflict = syncConflict
    if (!conflict || !userId) return

    const syncUserId = userId

    if (choice === 'cloud') {
      applyRemoteSnapshot(conflict.remote)
    } else {
      // Push local data to cloud
      try {
        const token = await getSupabaseToken()
        if (token && !isStaleSyncUser(syncUserId)) {
          await pushToRemote(token, syncUserId, conflict.local)
          lastPushedRef.current = contentSnapshot(conflict.local)
        }
      } catch (err) {
        console.error('[useSyncedStorage] Failed to push after conflict resolution:', err)
      }
    }

    markSynced(syncUserId)
    setSyncConflict(null)
    setSyncStatus('synced')
    setSyncError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncConflict, userId])

  // Reset initial sync tracking when user changes
  useEffect(() => {
    initialSyncDoneRef.current = false
  }, [userId])

  // Initial sync: fetch cloud data and reconcile with local
  // Depends on !!local.data to re-trigger when data becomes available after loading
  const hasLocalData = !!local.data
  useEffect(() => {
    if (!canSync || !userId || local.isLoading || !local.data) return
    if (initialSyncDoneRef.current) return
    if (syncInProgressRef.current && syncInProgressUserRef.current === userId) return
    syncInProgressRef.current = true
    syncInProgressUserRef.current = userId
    const syncUserId = userId

    const doInitialSync = async () => {
      try {
        setSyncStatus('syncing')
        const token = await getSupabaseToken()
        if (isStaleSyncUser(syncUserId)) return
        if (!token) {
          setSyncStatus('error')
          setSyncError('JWT template "supabase" not configured in Clerk dashboard')
          return
        }

        const remote = await fetchRemote(token, syncUserId)
        if (isStaleSyncUser(syncUserId)) return

        if (!remote) {
          // First-time cloud user — push local data up
          await pushToRemote(token, syncUserId, local.data!)
          if (isStaleSyncUser(syncUserId)) return
          lastPushedRef.current = contentSnapshot(local.data!)
          markSynced(syncUserId)
          setSyncStatus('synced')
          setSyncError(null)
          return
        }

        const localData = local.data!
        const flag = getSyncFlag(syncUserId)
        const isFirstSync = !flag

        if (isFirstSync) {
          // First sync for this device/user: cloud always wins
          applyRemoteSnapshot(remote.data)
          markSynced(syncUserId)
          setSyncStatus('synced')
          setSyncError(null)
          return
        }

        // Subsequent sync: check for conflicts
        const localTime = toTimestamp(localData.meta?.updatedAt)
        const remoteTime = toTimestamp(remote.updatedAt)
        const lastSyncTime = toTimestamp(flag.lastSyncedAt)

        const localChanged = localTime > lastSyncTime
        const remoteChanged = remoteTime > lastSyncTime

        // Content-level short-circuit: if local and remote serialise to the
        // same content (ignoring meta.updatedAt), there is nothing to push
        // or pull. Just refresh the sync flag and move on.
        const localSnap = contentSnapshot(localData)
        const remoteSnap = contentSnapshot(remote.data)
        if (localSnap === remoteSnap) {
          lastPushedRef.current = localSnap
          markSynced(syncUserId)
          setSyncStatus('synced')
          setSyncError(null)
          return
        }

        if (localChanged && remoteChanged) {
          // Both sides changed since last sync — conflict
          setSyncConflict({
            local: localData,
            remote: remote.data,
            remoteUpdatedAt: remote.updatedAt,
          })
          setSyncStatus('conflict')
          return
        }

        if (remoteChanged || remoteTime > localTime) {
          // Only remote changed, or remote is newer
          applyRemoteSnapshot(remote.data)
        } else if (localChanged || localTime > remoteTime) {
          // Local appears newer. Belt-and-braces: if local is structurally
          // smaller than remote on any axis (plantings/areas/varieties),
          // route through the conflict UI rather than silently overwriting
          // the cloud — this is the failure mode that cost the user a few
          // days of activity in the 2026-05-08 incident.
          if (isLocalStructurallySmaller(localData, remote.data)) {
            setSyncConflict({
              local: localData,
              remote: remote.data,
              remoteUpdatedAt: remote.updatedAt,
            })
            setSyncStatus('conflict')
            return
          }
          await pushToRemote(token, syncUserId, local.data!)
          if (isStaleSyncUser(syncUserId)) return
          lastPushedRef.current = contentSnapshot(local.data!)
        } else {
          // Same timestamp — already in sync
          lastPushedRef.current = contentSnapshot(local.data!)
        }

        markSynced(syncUserId)
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        if (isStaleSyncUser(syncUserId)) return
        console.error('[useSyncedStorage] Initial sync failed:', err)
        setSyncStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      } finally {
        if (syncInProgressUserRef.current === syncUserId) {
          syncInProgressRef.current = false
          syncInProgressUserRef.current = null
        }
        if (!isStaleSyncUser(syncUserId)) {
          initialSyncDoneRef.current = true
        }
      }
    }

    doInitialSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync, userId, local.isLoading, hasLocalData])

  // Push to cloud after local save completes (only after initial sync is done)
  useEffect(() => {
    if (!canSync || !userId || !local.data) return
    if (local.saveStatus !== 'saved') return
    if (syncInProgressRef.current) return
    if (!initialSyncDoneRef.current) return

    const serialized = contentSnapshot(local.data)

    // Skip push if this save matches the snapshot we just pulled from cloud
    if (pulledSnapshotRef.current && serialized === pulledSnapshotRef.current) {
      pulledSnapshotRef.current = null
      return
    }
    pulledSnapshotRef.current = null

    if (serialized === lastPushedRef.current) return

    const pushAsync = async () => {
      const syncUserId = userId
      try {
        setSyncStatus('syncing')
        const token = await getSupabaseToken()
        if (isStaleSyncUser(syncUserId)) return
        if (!token) return

        await pushToRemote(token, syncUserId, local.data!)
        if (isStaleSyncUser(syncUserId)) return
        lastPushedRef.current = serialized
        markSynced(syncUserId)
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        if (isStaleSyncUser(syncUserId)) return
        console.error('[useSyncedStorage] Push failed:', err)
        setSyncStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      }
    }

    pushAsync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.saveStatus, canSync, userId])

  // Reconnect sync
  useEffect(() => {
    if (!justReconnected || !canSync || !userId || !local.data) return
    const syncUserId = userId

    const resync = async () => {
      try {
        setSyncStatus('syncing')
        const token = await getSupabaseToken()
        if (isStaleSyncUser(syncUserId)) return
        if (!token) return

        const remote = await fetchRemote(token, syncUserId)
        if (isStaleSyncUser(syncUserId)) return
        if (!remote) {
          await pushToRemote(token, syncUserId, local.data!)
          if (isStaleSyncUser(syncUserId)) return
          lastPushedRef.current = contentSnapshot(local.data!)
        } else {
          const localData = local.data!
          const localTime = toTimestamp(localData.meta?.updatedAt)
          const remoteTime = toTimestamp(remote.updatedAt)
          const flag = getSyncFlag(syncUserId)
          const lastSyncTime = flag ? toTimestamp(flag.lastSyncedAt) : 0

          const localChanged = localTime > lastSyncTime
          const remoteChanged = remoteTime > lastSyncTime

          // Content-level short-circuit: nothing to do if both sides match.
          const localSnap = contentSnapshot(localData)
          const remoteSnap = contentSnapshot(remote.data)
          if (localSnap === remoteSnap) {
            lastPushedRef.current = localSnap
            markSynced(syncUserId)
            setSyncStatus('synced')
            setSyncError(null)
            return
          }

          if (localChanged && remoteChanged) {
            setSyncConflict({
              local: localData,
              remote: remote.data,
              remoteUpdatedAt: remote.updatedAt,
            })
            setSyncStatus('conflict')
            return
          }

          if (remoteChanged || remoteTime > localTime) {
            applyRemoteSnapshot(remote.data)
          } else {
            // Local appears newer — but bail to a conflict if it looks like a
            // stale or freshly-initialised copy that would shrink the cloud.
            if (isLocalStructurallySmaller(localData, remote.data)) {
              setSyncConflict({
                local: localData,
                remote: remote.data,
                remoteUpdatedAt: remote.updatedAt,
              })
              setSyncStatus('conflict')
              return
            }
            await pushToRemote(token, syncUserId, local.data!)
            if (isStaleSyncUser(syncUserId)) return
            lastPushedRef.current = contentSnapshot(local.data!)
          }
        }
        markSynced(syncUserId)
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        if (isStaleSyncUser(syncUserId)) return
        setSyncStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      }
    }

    resync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justReconnected])

  // Update sync status based on auth/network, and reset sync lock when sync is disabled
  useEffect(() => {
    if (!isSignedIn || !isSupabaseConfigured()) {
      setSyncStatus('disabled')
      syncInProgressRef.current = false
      initialSyncDoneRef.current = false
    } else if (!isOnline) {
      setSyncStatus('offline')
      syncInProgressRef.current = false
    }
  }, [isSignedIn, isOnline])

  return {
    ...local,
    syncStatus,
    syncError,
    syncConflict,
    resolveConflict,
  }
}
