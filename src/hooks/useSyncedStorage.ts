'use client'

/**
 * useSyncedStorage Hook
 *
 * Wraps usePersistedStorage with Supabase cloud sync when authenticated.
 * localStorage always stays active as the offline cache.
 * When signed in, changes are pushed to Supabase asynchronously.
 * On load, cloud data is fetched and reconciled with LWW.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useOptionalAuth } from './useOptionalAuth'
import { usePersistedStorage, UsePersistedStorageOptions, UsePersistedStorageReturn } from './usePersistedStorage'
import { useNetworkStatus } from './useNetworkStatus'
import { fetchRemote, pushToRemote } from '@/lib/supabase/sync'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { AllotmentData } from '@/types/unified-allotment'

export type SyncStatus = 'disabled' | 'syncing' | 'synced' | 'error' | 'offline' | 'conflict'

export interface SyncConflict {
  local: AllotmentData
  cloud: AllotmentData
  cloudUpdatedAt: string
}

export interface UseSyncedStorageReturn<T> extends UsePersistedStorageReturn<T> {
  syncStatus: SyncStatus
  syncError: string | null
  syncConflict: SyncConflict | null
  resolveConflict: (choice: 'local' | 'cloud') => void
}

const SYNC_FLAG_PREFIX = 'bonnie-synced-'

interface SyncFlag {
  synced: boolean
  lastSyncedAt: string
}

function toTimestamp(value?: string): number {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isNaN(ts) ? 0 : ts
}

function getSyncFlag(userId: string): SyncFlag | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${SYNC_FLAG_PREFIX}${userId}`)
    if (!raw) return null
    // Handle legacy flag format (plain 'true' string)
    if (raw === 'true') return { synced: true, lastSyncedAt: '' }
    return JSON.parse(raw) as SyncFlag
  } catch {
    return null
  }
}

function markSynced(userId: string): void {
  if (typeof window === 'undefined') return
  try {
    const flag: SyncFlag = { synced: true, lastSyncedAt: new Date().toISOString() }
    localStorage.setItem(`${SYNC_FLAG_PREFIX}${userId}`, JSON.stringify(flag))
  } catch {
    // Ignore storage errors
  }
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
  const pulledSnapshotRef = useRef<string | null>(null)
  const lastPushedRef = useRef<string | null>(null)
  const activeUserIdRef = useRef<string | null>(userId)
  // Store token/userId for conflict resolution (async callback needs them)
  const pendingConflictTokenRef = useRef<string | null>(null)
  const pendingConflictUserRef = useRef<string | null>(null)

  const canSync = isSignedIn && isSupabaseConfigured() && isOnline

  useEffect(() => {
    activeUserIdRef.current = userId
  }, [userId])

  const isStaleSyncUser = (expectedUserId: string): boolean =>
    activeUserIdRef.current !== expectedUserId

  const applyRemoteSnapshot = (remoteData: AllotmentData) => {
    const snapshot = JSON.stringify(remoteData)
    pulledSnapshotRef.current = snapshot
    local.setData(remoteData)
    lastPushedRef.current = snapshot
  }

  // Get Clerk JWT for Supabase auth using the "supabase" JWT template.
  // Clerk automatically sets the `sub` claim to the user ID (reserved claim).
  // RLS policies in sql/001-allotments.sql match rows via auth.jwt() ->> 'sub'.
  const getSupabaseToken = async (): Promise<string | null> => {
    try {
      return await getToken({ template: 'supabase' })
    } catch (err) {
      console.error('[useSyncedStorage] Failed to get auth token:', err)
      return null
    }
  }

  // Initial sync: fetch cloud data and reconcile with local
  useEffect(() => {
    if (!canSync || !userId || local.isLoading || !local.data) return
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
          lastPushedRef.current = JSON.stringify(local.data)
          markSynced(syncUserId)
          setSyncStatus('synced')
          setSyncError(null)
          return
        }

        const flag = getSyncFlag(syncUserId)
        const synced = flag?.synced === true

        if (!synced) {
          // New device or new browser — cloud is authoritative.
          applyRemoteSnapshot(remote.data)
        } else {
          // Returning user — check for bidirectional conflict
          const localData = local.data!
          const localTime = toTimestamp(localData.meta?.updatedAt)
          const remoteTime = toTimestamp(remote.updatedAt)
          const lastSyncTime = toTimestamp(flag?.lastSyncedAt)

          const localChanged = lastSyncTime > 0 && localTime > lastSyncTime
          const cloudChanged = lastSyncTime > 0 && remoteTime > lastSyncTime

          if (localChanged && cloudChanged) {
            // Both sides changed since last sync — ask the user
            pendingConflictTokenRef.current = token
            pendingConflictUserRef.current = syncUserId
            setSyncConflict({ local: localData, cloud: remote.data, cloudUpdatedAt: remote.updatedAt })
            setSyncStatus('conflict')
            return
          } else if (remoteTime > localTime) {
            applyRemoteSnapshot(remote.data)
          } else if (localTime > remoteTime) {
            await pushToRemote(token, syncUserId, local.data!)
            if (isStaleSyncUser(syncUserId)) return
            lastPushedRef.current = JSON.stringify(local.data)
          } else {
            lastPushedRef.current = JSON.stringify(local.data)
          }
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
      }
    }

    doInitialSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync, userId, local.isLoading])

  // Push to cloud after local save completes
  useEffect(() => {
    if (!canSync || !userId || !local.data) return
    if (local.saveStatus !== 'saved') return
    if (syncInProgressRef.current) return

    const serialized = JSON.stringify(local.data)

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
          lastPushedRef.current = JSON.stringify(local.data)
        } else {
          const localData = local.data!
          const localTime = toTimestamp(localData.meta?.updatedAt)
          const remoteTime = toTimestamp(remote.updatedAt)

          if (remoteTime > localTime) {
            applyRemoteSnapshot(remote.data)
          } else {
            await pushToRemote(token, syncUserId, local.data!)
            if (isStaleSyncUser(syncUserId)) return
            lastPushedRef.current = JSON.stringify(local.data)
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
    } else if (!isOnline) {
      setSyncStatus('offline')
      syncInProgressRef.current = false
    }
  }, [isSignedIn, isOnline])

  const resolveConflict = useCallback(async (choice: 'local' | 'cloud') => {
    if (!syncConflict) return
    const token = pendingConflictTokenRef.current
    const syncUserId = pendingConflictUserRef.current

    if (choice === 'cloud') {
      applyRemoteSnapshot(syncConflict.cloud)
    } else if (token && syncUserId) {
      // User chose local — push it to cloud
      try {
        await pushToRemote(token, syncUserId, syncConflict.local)
        lastPushedRef.current = JSON.stringify(syncConflict.local)
      } catch (err) {
        console.error('[useSyncedStorage] Failed to push after conflict resolution:', err)
      }
    }

    if (syncUserId) markSynced(syncUserId)
    setSyncConflict(null)
    pendingConflictTokenRef.current = null
    pendingConflictUserRef.current = null
    setSyncStatus('synced')
    setSyncError(null)
    // Release the sync lock
    syncInProgressRef.current = false
    syncInProgressUserRef.current = null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncConflict])

  return {
    ...local,
    syncStatus,
    syncError,
    syncConflict,
    resolveConflict,
  }
}
