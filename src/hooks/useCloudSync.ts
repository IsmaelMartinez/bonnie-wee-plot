'use client'

/**
 * useCloudSync Hook (ADR 027 Step 4)
 *
 * Supabase cloud sync that exchanges the Yjs document as *binary* CRDT state
 * instead of full JSON with last-write-wins. Concurrent edits across devices
 * merge via `Y.applyUpdate` rather than one snapshot overwriting the other, so
 * the LWW machinery (content fingerprints, the "structurally smaller" guard,
 * and the conflict dialog) is gone.
 *
 * Reconciliation model:
 *  - First cloud row for the user: push the local doc as the canonical
 *    document.
 *  - First sync on a *device* (no adopted-lineage flag): adopt the canonical
 *    cloud lineage — clear the local default seed / independent pre-migration
 *    lineage and `Y.applyUpdate` the cloud state on top. This is required
 *    because each device's local doc was hydrated independently in Step 3/5 and
 *    does not share history; naively merging independent lineages with the same
 *    content would duplicate it. Migration (cloud has JSONB but no binary yet)
 *    hydrates the JSONB and CAS-seeds the binary; a lost CAS means another
 *    device migrated first, so this device adopts that.
 *  - Subsequent syncs on an adopted device: fetch, `mergeRemoteUpdate`, and
 *    push the merged state with optimistic-concurrency (CAS) retry. A pure pull
 *    (local fully contained in remote) skips the write.
 *
 * The cloud copy keeps a derived JSONB mirror (`data`) written on every push so
 * the history trigger, GDPR export, and Studio inspection keep working — see
 * sql/004-allotment-yjs.sql.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useOptionalAuth } from './useOptionalAuth'
import { useNetworkStatus } from './useNetworkStatus'
import {
  fetchRemoteBinary,
  pushBinary,
  type RemoteBinary,
} from '@/lib/supabase/sync-binary'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { AllotmentData } from '@/types/unified-allotment'
import type { SyncStatus } from '@/types/storage'

export type { SyncStatus } from '@/types/storage'

export interface UseCloudSyncOptions {
  /**
   * The live Yjs snapshot (`null` while the doc is still loading). Used as the
   * change signal for the debounced push and to gate sync until the doc is
   * ready. Cloud writes read the live doc via `encodeState` / `getSnapshot`,
   * not this reference.
   */
  data: AllotmentData | null
  /** Read the live JSON snapshot on demand (for the JSONB mirror write). */
  getSnapshot: () => AllotmentData | null
  /** Encode the live doc as a Yjs binary update for the cloud push. */
  encodeState: () => Uint8Array | null
  /** Merge a remote Yjs update into the live doc (the CRDT merge). */
  mergeRemoteUpdate: (update: Uint8Array) => void
  /** Adopt a canonical remote lineage (load remote into a fresh doc + swap). */
  adoptRemoteUpdate: (update: Uint8Array) => void | Promise<void>
  /** Replace the doc from JSON — used to migrate a JSONB-only cloud row. */
  replaceFromJson: (data: AllotmentData) => void
  /** Does the live doc hold anything the remote update does not? */
  hasUpdatesBeyond: (remoteUpdate: Uint8Array) => boolean
  /**
   * Flush pending local (IndexedDB) persistence. Used by the unload handler so
   * the local cache is durable before the final cloud push.
   */
  flushLocal: () => Promise<boolean>
  /**
   * `true` when the current snapshot change was driven by another tab's
   * `y-indexeddb` broadcast (or a just-applied remote merge) rather than a
   * local edit. The push effect skips scheduling in that case.
   */
  isSyncedFromOtherTab?: boolean
}

export interface UseCloudSyncReturn {
  syncStatus: SyncStatus
  syncError: string | null
  /**
   * Cancel the pending push debounce (if any) and immediately fetch-merge-push
   * the latest state. Resolves once the push completes (or immediately if
   * nothing is pending). Used by the unload listener.
   */
  flushPush: () => Promise<void>
}

/**
 * How long to coalesce push-to-cloud calls after a local change. A burst of
 * mutations collapses to one fetch-merge-push. Cloud lags local by up to this
 * much, which is fine for a single-user app — the local cache is always
 * current.
 */
const PUSH_DEBOUNCE_MS = 30_000

/**
 * How many times to re-pull-merge-retry when a CAS write loses to a concurrent
 * writer. Merge is commutative, so each retry incorporates the winner's state
 * before trying again.
 */
const MERGE_RETRIES = 3

// Per-user "this device has adopted the shared binary lineage" flag. A NEW
// key (distinct from the LWW-era `bonnie-synced-*` flag) so that every device
// runs the one-time adoption when Step 4 ships, regardless of prior LWW syncs.
interface LineageFlag {
  adoptedAt: string
}

function getLineageFlagKey(userId: string): string {
  return `bwp-yjs-synced-${userId}`
}

export function hasAdoptedLineage(userId: string): boolean {
  try {
    return localStorage.getItem(getLineageFlagKey(userId)) !== null
  } catch {
    return false
  }
}

export function markLineageAdopted(userId: string): void {
  try {
    const flag: LineageFlag = { adoptedAt: new Date().toISOString() }
    localStorage.setItem(getLineageFlagKey(userId), JSON.stringify(flag))
  } catch {
    // Storage unavailable — the device will re-adopt on next sync, which is
    // idempotent (adopt clears + reapplies the same canonical state).
  }
}

export function useCloudSync({
  data,
  getSnapshot,
  encodeState,
  mergeRemoteUpdate,
  adoptRemoteUpdate,
  replaceFromJson,
  hasUpdatesBeyond,
  flushLocal,
  isSyncedFromOtherTab,
}: UseCloudSyncOptions): UseCloudSyncReturn {
  const { getToken, userId, isSignedIn } = useOptionalAuth()
  const { isOnline, justReconnected } = useNetworkStatus()

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disabled')
  const [syncError, setSyncError] = useState<string | null>(null)
  const syncInProgressRef = useRef(false)
  const syncInProgressUserRef = useRef<string | null>(null)
  const initialSyncDoneRef = useRef(false)
  const activeUserIdRef = useRef<string | null>(userId)
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPushUserRef = useRef<string | null>(null)
  // Latest `runSync` closure, so timers / callbacks scheduled earlier invoke
  // the current one (props are stable, but this avoids any stale-closure risk).
  const runSyncRef = useRef<(userId: string) => Promise<void>>(async () => {})

  const canSync = isSignedIn && isSupabaseConfigured() && isOnline

  useEffect(() => {
    activeUserIdRef.current = userId
  }, [userId])

  const isStaleSyncUser = (expectedUserId: string): boolean =>
    activeUserIdRef.current !== expectedUserId

  // Get Clerk JWT for Supabase auth using the "supabase" JWT template.
  const getSupabaseToken = async (): Promise<string | null> => {
    try {
      return await getToken({ template: 'supabase' })
    } catch (err) {
      console.error('[useCloudSync] Failed to get auth token:', err)
      return null
    }
  }

  // ---- reconciliation primitives (binary merge) --------------------------

  // Adopted device, ongoing sync: merge remote into local, then push the merged
  // state with CAS retry. Skips the write when local is fully contained in
  // remote (a pure pull).
  const mergeAndPush = async (
    token: string,
    syncUserId: string,
    remote: RemoteBinary,
    attempts: number,
  ): Promise<void> => {
    if (remote.update) {
      mergeRemoteUpdate(remote.update)
      if (!hasUpdatesBeyond(remote.update)) return // pure pull — nothing to push
    }
    const state = encodeState()
    const json = getSnapshot()
    if (!state || !json) return
    // `expected = null` seeds the binary on a row that only has JSONB (the
    // defensive migration path for a device flagged as adopted but whose cloud
    // row predates binary); otherwise CAS against the token we just read.
    const expected = remote.update ? remote.yjsUpdatedAt : null
    const res = await pushBinary(token, syncUserId, state, json, {
      rowExists: true,
      expectedYjsUpdatedAt: expected,
    })
    if (res.casConflict) {
      if (attempts <= 0) return
      const fresh = await fetchRemoteBinary(token, syncUserId)
      if (isStaleSyncUser(syncUserId)) return
      await mergeAndPush(token, syncUserId, fresh, attempts - 1)
    }
  }

  // Full reconcile for one sync pass.
  const reconcile = async (
    token: string,
    syncUserId: string,
    remote: RemoteBinary,
    firstDeviceSync: boolean,
  ): Promise<void> => {
    // No cloud row yet — push local as the canonical document.
    if (!remote.exists) {
      const state = encodeState()
      const json = getSnapshot()
      if (!state || !json) return
      const res = await pushBinary(token, syncUserId, state, json, {
        rowExists: false,
        expectedYjsUpdatedAt: null,
      })
      if (res.casConflict) {
        // A row appeared concurrently — re-fetch and reconcile against it.
        const fresh = await fetchRemoteBinary(token, syncUserId)
        if (isStaleSyncUser(syncUserId)) return
        await reconcile(token, syncUserId, fresh, firstDeviceSync)
      }
      return
    }

    // First sync on this device: adopt the canonical cloud lineage rather than
    // merge (see module docstring).
    if (firstDeviceSync) {
      if (remote.update) {
        await adoptRemoteUpdate(remote.update)
        return
      }
      // Migration: cloud has JSONB but no binary. Hydrate it and CAS-seed the
      // binary. A lost CAS means another device migrated first — adopt theirs.
      if (remote.jsonb) replaceFromJson(remote.jsonb)
      const state = encodeState()
      const json = getSnapshot()
      if (!state || !json) return
      const res = await pushBinary(token, syncUserId, state, json, {
        rowExists: true,
        expectedYjsUpdatedAt: remote.yjsUpdatedAt, // null pre-migration
      })
      if (res.casConflict) {
        const fresh = await fetchRemoteBinary(token, syncUserId)
        if (isStaleSyncUser(syncUserId)) return
        if (fresh.update) await adoptRemoteUpdate(fresh.update)
      }
      return
    }

    // Adopted device, ongoing sync: CRDT merge.
    await mergeAndPush(token, syncUserId, remote, MERGE_RETRIES)
  }

  // One full sync pass: fetch + reconcile + status. Shared by the initial-sync,
  // debounced-push, reconnect, and flush paths.
  const runSync = async (syncUserId: string): Promise<void> => {
    try {
      setSyncStatus('syncing')
      const token = await getSupabaseToken()
      if (isStaleSyncUser(syncUserId)) return
      if (!token) {
        setSyncStatus('error')
        setSyncError('JWT template "supabase" not configured in Clerk dashboard')
        return
      }

      const remote = await fetchRemoteBinary(token, syncUserId)
      if (isStaleSyncUser(syncUserId)) return

      await reconcile(token, syncUserId, remote, !hasAdoptedLineage(syncUserId))
      if (isStaleSyncUser(syncUserId)) return

      markLineageAdopted(syncUserId)
      setSyncStatus('synced')
      setSyncError(null)
    } catch (err) {
      if (isStaleSyncUser(syncUserId)) return
      console.error('[useCloudSync] Sync failed:', err)
      setSyncStatus('error')
      setSyncError(err instanceof Error ? err.message : 'Sync failed')
    }
  }
  runSyncRef.current = runSync

  // Reset initial-sync tracking when the user changes.
  useEffect(() => {
    initialSyncDoneRef.current = false
  }, [userId])

  // Initial sync: fetch cloud state and reconcile with local. Depends on
  // `!!data` so it re-triggers once the Yjs snapshot becomes available.
  const hasData = !!data
  useEffect(() => {
    if (!canSync || !userId || !data) return
    if (initialSyncDoneRef.current) return
    if (syncInProgressRef.current && syncInProgressUserRef.current === userId) return
    syncInProgressRef.current = true
    syncInProgressUserRef.current = userId
    const syncUserId = userId

    ;(async () => {
      await runSyncRef.current(syncUserId)
      if (syncInProgressUserRef.current === syncUserId) {
        syncInProgressRef.current = false
        syncInProgressUserRef.current = null
      }
      if (!isStaleSyncUser(syncUserId)) {
        initialSyncDoneRef.current = true
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync, userId, hasData])

  // Debounced push after a local mutation republishes the snapshot. A burst of
  // edits collapses into one fetch-merge-push. Skips cross-tab / just-merged
  // republishes (`isSyncedFromOtherTab`) — the editing tab owns the push.
  useEffect(() => {
    if (!canSync || !userId || !data) return
    if (syncInProgressRef.current) return
    if (!initialSyncDoneRef.current) return
    if (isSyncedFromOtherTab) return

    pendingPushUserRef.current = userId
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    pushTimerRef.current = setTimeout(() => {
      pushTimerRef.current = null
      const syncUserId = pendingPushUserRef.current
      pendingPushUserRef.current = null
      if (!syncUserId || isStaleSyncUser(syncUserId)) return
      void runSyncRef.current(syncUserId)
    }, PUSH_DEBOUNCE_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, canSync, userId])

  // Cancel the pending debounce timer (if any) and sync immediately. Safe to
  // call when nothing is pending — resolves to a no-op.
  const flushPush = useCallback(async (): Promise<void> => {
    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current)
      pushTimerRef.current = null
    }
    const syncUserId = pendingPushUserRef.current
    pendingPushUserRef.current = null
    if (!syncUserId || isStaleSyncUser(syncUserId)) return
    await runSyncRef.current(syncUserId)
  }, [])

  // Cleanup pending timer on unmount.
  useEffect(() => {
    return () => {
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current)
        pushTimerRef.current = null
      }
    }
  }, [])

  // Flush local persistence and the pending cloud push when the tab is closing.
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

  // Reconnect sync.
  useEffect(() => {
    if (!justReconnected || !canSync || !userId || !data) return
    if (syncInProgressRef.current) return
    const syncUserId = userId
    void runSyncRef.current(syncUserId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justReconnected])

  // Update sync status on auth/network changes; reset locks when disabled.
  useEffect(() => {
    if (!isSignedIn || !isSupabaseConfigured()) {
      setSyncStatus('disabled')
      syncInProgressRef.current = false
      initialSyncDoneRef.current = false
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current)
        pushTimerRef.current = null
      }
      pendingPushUserRef.current = null
    } else if (!isOnline) {
      setSyncStatus('offline')
      syncInProgressRef.current = false
    }
  }, [isSignedIn, isOnline])

  return {
    syncStatus,
    syncError,
    flushPush,
  }
}
