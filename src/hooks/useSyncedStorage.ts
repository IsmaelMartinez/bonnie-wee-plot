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

const DEFAULT_ALLOTMENT_NAME = 'My Allotment'
const DEFAULT_ALLOTMENT_LOCATION = 'Edinburgh, Scotland'

function toTimestamp(value?: string): number {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isNaN(ts) ? 0 : ts
}

function hasSeasonContent(data: AllotmentData): boolean {
  return data.seasons.some(season => {
    if (season.notes?.trim()) return true

    return season.areas.some(areaSeason => {
      if (areaSeason.plantings.length > 0) return true
      if ((areaSeason.notes?.length ?? 0) > 0) return true
      if ((areaSeason.careLogs?.length ?? 0) > 0) return true
      if (typeof areaSeason.harvestTotal === 'number') return true
      if (typeof areaSeason.harvestUnit === 'string' && areaSeason.harvestUnit.trim().length > 0) return true
      if (areaSeason.rotationGroup) return true
      if (areaSeason.gridPosition) return true
      return false
    })
  })
}

function isBootstrapLocalData(data: AllotmentData): boolean {
  if (data.layout.areas.length > 0) return false
  if ((data.varieties?.length ?? 0) > 0) return false
  if ((data.customTasks?.length ?? 0) > 0) return false
  if ((data.maintenanceTasks?.length ?? 0) > 0) return false
  if ((data.gardenEvents?.length ?? 0) > 0) return false
  if ((data.compost?.length ?? 0) > 0) return false
  if (hasSeasonContent(data)) return false

  const name = data.meta?.name?.trim() ?? ''
  const location = data.meta?.location?.trim() ?? ''

  const defaultName = name === DEFAULT_ALLOTMENT_NAME
  const defaultLocation = location === '' || location === DEFAULT_ALLOTMENT_LOCATION
  const setupCompleted = Boolean(data.meta?.setupCompleted)

  return defaultName && defaultLocation && !setupCompleted
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
  const syncInProgressUserRef = useRef<string | null>(null)
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
          setSyncStatus('synced')
          setSyncError(null)
          return
        }

        const localData = local.data!
        const localTime = toTimestamp(localData.meta?.updatedAt)
        const remoteTime = toTimestamp(remote.updatedAt)

        if (isBootstrapLocalData(localData) || remoteTime > localTime) {
          // Bootstrap local snapshots and older local data must not override cloud state.
          applyRemoteSnapshot(remote.data)
        } else if (localTime > remoteTime) {
          // Local is newer — push to cloud
          await pushToRemote(token, syncUserId, local.data!)
          if (isStaleSyncUser(syncUserId)) return
          lastPushedRef.current = JSON.stringify(local.data)
        } else {
          // Same timestamp — already in sync
          lastPushedRef.current = JSON.stringify(local.data)
        }

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

          if (isBootstrapLocalData(localData) || remoteTime > localTime) {
            applyRemoteSnapshot(remote.data)
          } else {
            await pushToRemote(token, syncUserId, local.data!)
            if (isStaleSyncUser(syncUserId)) return
            lastPushedRef.current = JSON.stringify(local.data)
          }
        }
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

  return {
    ...local,
    syncStatus,
    syncError,
  }
}
