'use client'

/**
 * useCloudSync Hook (ADR 027 Step 5)
 *
 * Supabase cloud sync driven directly off the Yjs snapshot publisher.
 *
 * Before Step 5 this logic lived in `useSyncedStorage`, wrapped around
 * the legacy `usePersistedStorage` localStorage chain and fed by the
 * Yjs → legacy mirror. Step 5 deletes that chain; the cloud half —
 * fetch / push / LWW-guard / conflict dialog, the 30 s push debounce,
 * and the unload flush — is preserved here and consumes the Yjs
 * `AllotmentData` snapshot instead of a `usePersistedStorage` instance.
 *
 * Reconciliation model (unchanged from `useSyncedStorage`):
 *  - First sync for a device/user: cloud always wins.
 *  - Subsequent syncs: LWW on `meta.updatedAt` with content-equality
 *    short-circuit, a "structurally smaller" safety net (the 2026-05-08
 *    incident guard), and a conflict dialog when both sides diverge.
 *
 * The CRDT-merge win that Yjs unlocks lands when Step 4 moves the cloud
 * transport onto Yjs itself; until then the cloud copy stays JSONB + LWW
 * and this hook is the bridge.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useOptionalAuth } from './useOptionalAuth'
import { useNetworkStatus } from './useNetworkStatus'
import {
  fetchRemote,
  pushToRemote,
  contentSnapshot,
  isLocalStructurallySmaller,
} from '@/lib/supabase/sync'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import {
  createAllotmentDoc,
  hydrateFromJson,
  serializeToJson,
} from '@/lib/yjs/allotment-yjs'
import type { AllotmentData } from '@/types/unified-allotment'
import type { SyncStatus } from '@/types/storage'

export type { SyncStatus } from '@/types/storage'

export interface SyncConflict {
  local: AllotmentData
  remote: AllotmentData
  remoteUpdatedAt: string
}

export interface UseCloudSyncOptions {
  /**
   * The live Yjs snapshot (`null` while the doc is still loading). This
   * is the canonical local state; `useCloudSync` never writes to it
   * except through `applyRemote`.
   */
  data: AllotmentData | null
  /**
   * Adopt a remote snapshot into the Yjs doc — the Step 5 replacement
   * for the legacy `usePersistedStorage.setData`. Wired to
   * `useYjsDoc.replaceFromJson`.
   */
  applyRemote: (data: AllotmentData) => void
  /**
   * Flush pending local (IndexedDB) persistence — wired to
   * `useYjsDoc.flushSave`. Used by the unload handler so the local cache
   * is durable before the final cloud push.
   */
  flushLocal: () => Promise<boolean>
}

export interface UseCloudSyncReturn {
  syncStatus: SyncStatus
  syncError: string | null
  syncConflict: SyncConflict | null
  resolveConflict: (choice: 'cloud' | 'local') => void
  /**
   * Cancel the pending push debounce (if any) and immediately push the
   * latest pending snapshot to the cloud. Resolves once the push
   * completes (or immediately if there is nothing pending). Used by the
   * unload listener and exposed for callers that need to force a flush
   * before navigating away.
   */
  flushPush: () => Promise<void>
}

/**
 * How long to coalesce push-to-cloud calls after a local change. A burst
 * of mutations (e.g. toggling tasks, editing a name) all collapse to one
 * push and one history row instead of one per change. Cloud lags local
 * by up to this much, which is fine for a single-user app — the local
 * cache is always current.
 */
const PUSH_DEBOUNCE_MS = 30_000

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

/**
 * Round-trip a raw remote snapshot through the same hydrate/serialize
 * path the live Yjs doc uses. `applyRemote` writes the remote into the
 * doc, which then republishes a *normalized* snapshot (undefined fields
 * dropped, optional arrays defaulted to `[]`). Recording the normalized
 * content fingerprint as the "just pulled" marker means the push effect
 * recognises the republished snapshot and skips re-pushing it — the same
 * no-redundant-push guarantee `useSyncedStorage` had when it wrote the
 * raw remote straight to localStorage.
 */
function normalizedContentSnapshot(data: AllotmentData): string {
  const { store } = createAllotmentDoc()
  hydrateFromJson(store, data)
  return contentSnapshot(serializeToJson(store))
}

export function useCloudSync({
  data,
  applyRemote,
  flushLocal,
}: UseCloudSyncOptions): UseCloudSyncReturn {
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
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPushDataRef = useRef<AllotmentData | null>(null)
  const pendingPushUserRef = useRef<string | null>(null)

  const canSync = isSignedIn && isSupabaseConfigured() && isOnline

  useEffect(() => {
    activeUserIdRef.current = userId
  }, [userId])

  const isStaleSyncUser = (expectedUserId: string): boolean =>
    activeUserIdRef.current !== expectedUserId

  const applyRemoteSnapshot = (remoteData: AllotmentData) => {
    // Mark the (normalized) content we're adopting so the push effect,
    // which fires when the Yjs doc republishes the adopted snapshot,
    // recognises it and skips the round-trip back to the cloud.
    const snapshot = normalizedContentSnapshot(remoteData)
    pulledSnapshotRef.current = snapshot
    applyRemote(remoteData)
    lastPushedRef.current = snapshot
  }

  // Get Clerk JWT for Supabase auth using the "supabase" JWT template.
  const getSupabaseToken = async (): Promise<string | null> => {
    try {
      return await getToken({ template: 'supabase' })
    } catch (err) {
      console.error('[useCloudSync] Failed to get auth token:', err)
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
        console.error('[useCloudSync] Failed to push after conflict resolution:', err)
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

  // Initial sync: fetch cloud data and reconcile with local.
  // Depends on !!data to re-trigger once the Yjs snapshot becomes available.
  const hasData = !!data
  useEffect(() => {
    if (!canSync || !userId || !data) return
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
          await pushToRemote(token, syncUserId, data)
          if (isStaleSyncUser(syncUserId)) return
          lastPushedRef.current = contentSnapshot(data)
          markSynced(syncUserId)
          setSyncStatus('synced')
          setSyncError(null)
          return
        }

        const localData = data
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
          await pushToRemote(token, syncUserId, data)
          if (isStaleSyncUser(syncUserId)) return
          lastPushedRef.current = contentSnapshot(data)
        } else {
          // Equal timestamps but the content snapshots disagree (otherwise
          // we'd have short-circuited above). Neither side claims to have
          // changed since the last sync, yet they no longer match — most
          // likely a load-time data repair / migration on one device that
          // didn't make it to the other. Surface a conflict so the user
          // picks rather than silently keeping local; that's exactly the
          // class of silent overwrite the rest of this PR is closing.
          setSyncConflict({
            local: localData,
            remote: remote.data,
            remoteUpdatedAt: remote.updatedAt,
          })
          setSyncStatus('conflict')
          return
        }

        markSynced(syncUserId)
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        if (isStaleSyncUser(syncUserId)) return
        console.error('[useCloudSync] Initial sync failed:', err)
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
  }, [canSync, userId, hasData])

  // Perform a push immediately. Used by the debounce timer, flushPush, and the
  // unload listener. Updates lastPushedRef + sync status on success.
  const performPush = useCallback(async (dataToPush: AllotmentData, syncUserId: string) => {
    try {
      setSyncStatus('syncing')
      const token = await getSupabaseToken()
      if (isStaleSyncUser(syncUserId)) return
      if (!token) return

      await pushToRemote(token, syncUserId, dataToPush)
      if (isStaleSyncUser(syncUserId)) return
      lastPushedRef.current = contentSnapshot(dataToPush)
      markSynced(syncUserId)
      setSyncStatus('synced')
      setSyncError(null)
    } catch (err) {
      if (isStaleSyncUser(syncUserId)) return
      console.error('[useCloudSync] Push failed:', err)
      setSyncStatus('error')
      setSyncError(err instanceof Error ? err.message : 'Sync failed')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cancel the pending debounce timer (if any) and push whatever is queued
  // immediately. Safe to call when nothing is pending — resolves to a no-op.
  const flushPush = useCallback(async (): Promise<void> => {
    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current)
      pushTimerRef.current = null
    }
    const dataToPush = pendingPushDataRef.current
    const syncUserId = pendingPushUserRef.current
    pendingPushDataRef.current = null
    pendingPushUserRef.current = null
    if (!dataToPush || !syncUserId) return
    if (isStaleSyncUser(syncUserId)) return
    await performPush(dataToPush, syncUserId)
  }, [performPush])

  // Push to cloud after the Yjs snapshot changes (only after initial sync is
  // done). Coalesces a burst of edits into a single push via
  // PUSH_DEBOUNCE_MS — every new snapshot resets the timer; the latest data
  // wins. The Yjs doc republishes a fresh `data` reference on every mutation,
  // so a reference change is the change signal (the old chain used
  // `usePersistedStorage.saveStatus === 'saved'`).
  useEffect(() => {
    if (!canSync || !userId || !data) return
    if (syncInProgressRef.current) return
    if (!initialSyncDoneRef.current) return

    const serialized = contentSnapshot(data)

    // Skip push if this snapshot matches the one we just pulled from cloud.
    if (pulledSnapshotRef.current && serialized === pulledSnapshotRef.current) {
      pulledSnapshotRef.current = null
      return
    }
    pulledSnapshotRef.current = null

    if (serialized === lastPushedRef.current) return

    // Schedule (or reset) the debounced push. Capture the latest data + user
    // in refs so the timer always pushes the most recent snapshot.
    pendingPushDataRef.current = data
    pendingPushUserRef.current = userId
    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current)
    }
    pushTimerRef.current = setTimeout(() => {
      pushTimerRef.current = null
      const dataToPush = pendingPushDataRef.current
      const syncUserId = pendingPushUserRef.current
      pendingPushDataRef.current = null
      pendingPushUserRef.current = null
      if (!dataToPush || !syncUserId) return
      if (isStaleSyncUser(syncUserId)) return
      void performPush(dataToPush, syncUserId)
    }, PUSH_DEBOUNCE_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, canSync, userId])

  // Cleanup pending timer on unmount so stray timers don't fire after the
  // component is gone (would set state on an unmounted hook).
  useEffect(() => {
    return () => {
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current)
        pushTimerRef.current = null
      }
    }
  }, [])

  // Flush both local persistence and the pending cloud push when the tab is
  // closing. Flush the local (IndexedDB) cache first, then bypass the debounce
  // by calling flushPush() directly so the queued snapshot reaches the cloud.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!canSync) return

    const handleUnload = () => {
      void flushLocal().then(() => flushPush())
    }
    window.addEventListener('pagehide', handleUnload)
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('pagehide', handleUnload)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [canSync, flushPush, flushLocal])

  // Reconnect sync
  useEffect(() => {
    if (!justReconnected || !canSync || !userId || !data) return
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
          await pushToRemote(token, syncUserId, data)
          if (isStaleSyncUser(syncUserId)) return
          lastPushedRef.current = contentSnapshot(data)
        } else {
          const localData = data
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
            await pushToRemote(token, syncUserId, data)
            if (isStaleSyncUser(syncUserId)) return
            lastPushedRef.current = contentSnapshot(data)
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
      // Drop any pending debounced push — the user is no longer signed in,
      // so the push has nowhere to go.
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current)
        pushTimerRef.current = null
      }
      pendingPushDataRef.current = null
      pendingPushUserRef.current = null
    } else if (!isOnline) {
      setSyncStatus('offline')
      syncInProgressRef.current = false
    }
  }, [isSignedIn, isOnline])

  return {
    syncStatus,
    syncError,
    syncConflict,
    resolveConflict,
    flushPush,
  }
}
