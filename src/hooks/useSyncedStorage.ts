'use client'

/**
 * useSyncedStorage Hook
 *
 * Wraps usePersistedStorage with Supabase cloud sync when authenticated.
 * localStorage always stays active as the offline cache.
 * When signed in, changes are pushed to Supabase asynchronously.
 * On load, cloud data is fetched and reconciled with LWW.
 */

import { useState, useEffect, useRef } from 'react'
import { useOptionalAuth } from './useOptionalAuth'
import { usePersistedStorage, UsePersistedStorageOptions, UsePersistedStorageReturn } from './usePersistedStorage'
import { useNetworkStatus } from './useNetworkStatus'
import { fetchRemote, pushToRemote } from '@/lib/supabase/sync'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { AllotmentData } from '@/types/unified-allotment'

export type SyncStatus = 'disabled' | 'syncing' | 'synced' | 'error' | 'offline'

export interface UseSyncedStorageReturn<T> extends UsePersistedStorageReturn<T> {
  syncStatus: SyncStatus
  syncError: string | null
}

export function useSyncedStorage(
  options: UsePersistedStorageOptions<AllotmentData>
): UseSyncedStorageReturn<AllotmentData> {
  const local = usePersistedStorage<AllotmentData>(options)
  const { getToken, userId, isSignedIn } = useOptionalAuth()
  const { isOnline, justReconnected } = useNetworkStatus()

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disabled')
  const [syncError, setSyncError] = useState<string | null>(null)
  const syncInProgressRef = useRef(false)
  const pulledSnapshotRef = useRef<string | null>(null)
  const lastPushedRef = useRef<string | null>(null)

  const canSync = isSignedIn && isSupabaseConfigured() && isOnline

  // Get Clerk session token for Supabase auth.
  // Uses the default session token (Third-Party Auth) — no JWT template needed.
  const getSupabaseToken = async (): Promise<string | null> => {
    try {
      return await getToken()
    } catch (err) {
      console.error('[useSyncedStorage] Failed to get auth token:', err)
      return null
    }
  }

  // Initial sync: fetch cloud data and reconcile with local
  useEffect(() => {
    if (!canSync || !userId || local.isLoading || !local.data) return
    if (syncInProgressRef.current) return
    syncInProgressRef.current = true

    const doInitialSync = async () => {
      try {
        setSyncStatus('syncing')
        const token = await getSupabaseToken()
        if (!token) {
          setSyncStatus('error')
          setSyncError('JWT template "supabase" not configured in Clerk dashboard')
          return
        }

        const remote = await fetchRemote(token, userId)

        if (!remote) {
          // First-time cloud user — push local data up
          await pushToRemote(token, userId, local.data!)
          lastPushedRef.current = JSON.stringify(local.data)
          setSyncStatus('synced')
          setSyncError(null)
          return
        }

        // Compare timestamps — LWW
        const localTime = new Date(local.data!.meta?.updatedAt || 0).getTime()
        const remoteTime = new Date(remote.updatedAt).getTime()

        if (remoteTime > localTime) {
          // Cloud is newer — update local, record snapshot to skip push-back
          const snapshot = JSON.stringify(remote.data)
          pulledSnapshotRef.current = snapshot
          local.setData(remote.data)
          lastPushedRef.current = snapshot
        } else if (localTime > remoteTime) {
          // Local is newer — push to cloud
          await pushToRemote(token, userId, local.data!)
          lastPushedRef.current = JSON.stringify(local.data)
        } else {
          // Same timestamp — already in sync
          lastPushedRef.current = JSON.stringify(local.data)
        }

        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        console.error('[useSyncedStorage] Initial sync failed:', err)
        setSyncStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      } finally {
        syncInProgressRef.current = false
      }
    }

    doInitialSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync, userId, local.isLoading])

  // Push to cloud after local save completes
  useEffect(() => {
    if (!canSync || !userId || !local.data) return
    if (local.saveStatus !== 'saved') return

    const serialized = JSON.stringify(local.data)

    // Skip push if this save matches the snapshot we just pulled from cloud
    if (pulledSnapshotRef.current && serialized === pulledSnapshotRef.current) {
      pulledSnapshotRef.current = null
      return
    }
    pulledSnapshotRef.current = null

    if (serialized === lastPushedRef.current) return

    const pushAsync = async () => {
      try {
        setSyncStatus('syncing')
        const token = await getSupabaseToken()
        if (!token) return

        await pushToRemote(token, userId, local.data!)
        lastPushedRef.current = serialized
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
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

    const resync = async () => {
      try {
        setSyncStatus('syncing')
        const token = await getSupabaseToken()
        if (!token) return

        const remote = await fetchRemote(token, userId)
        if (!remote) {
          await pushToRemote(token, userId, local.data!)
          lastPushedRef.current = JSON.stringify(local.data)
        } else {
          const localTime = new Date(local.data!.meta?.updatedAt || 0).getTime()
          const remoteTime = new Date(remote.updatedAt).getTime()

          if (remoteTime > localTime) {
            const snapshot = JSON.stringify(remote.data)
            pulledSnapshotRef.current = snapshot
            local.setData(remote.data)
            lastPushedRef.current = snapshot
          } else {
            await pushToRemote(token, userId, local.data!)
            lastPushedRef.current = JSON.stringify(local.data)
          }
        }
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
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

  return {
    ...local,
    syncStatus,
    syncError,
  }
}
