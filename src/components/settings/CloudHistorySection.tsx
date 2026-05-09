'use client'

import { useCallback, useEffect, useState } from 'react'
import { Clock, History, RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'
import { fetchHistoryList, fetchHistorySnapshot, type HistoryEntry } from '@/lib/supabase/sync'
import { saveAllotmentData } from '@/services/allotment-storage'
import { ConfirmDialog } from '@/components/ui/Dialog'

interface CloudHistorySectionProps {
  /** Called after a successful restore so the parent can re-read localStorage. */
  onDataImported: () => void
}

const HISTORY_LIMIT = 20
const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })
const ABSOLUTE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return iso
  const diffMs = then - now
  const diffMin = Math.round(diffMs / 60_000)
  if (Math.abs(diffMin) < 60) return RELATIVE_FORMATTER.format(diffMin, 'minute')
  const diffHr = Math.round(diffMin / 60)
  if (Math.abs(diffHr) < 24) return RELATIVE_FORMATTER.format(diffHr, 'hour')
  const diffDay = Math.round(diffHr / 24)
  return RELATIVE_FORMATTER.format(diffDay, 'day')
}

/**
 * Lists previous cloud snapshots of the user's allotment and lets them
 * restore one. Snapshots are written automatically by the
 * `archive_allotment_before_update` Postgres trigger every time we push to
 * the cloud (see sql/002-allotment-history.sql).
 */
export default function CloudHistorySection({ onDataImported }: CloudHistorySectionProps) {
  const { getToken, userId, isSignedIn } = useOptionalAuth()

  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [confirmRestoreId, setConfirmRestoreId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    if (!isSignedIn || !userId) return
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken({ template: 'supabase' })
      if (!token) {
        setError('Could not get an auth token. Try signing out and back in.')
        return
      }
      const list = await fetchHistoryList(token, userId, HISTORY_LIMIT)
      setEntries(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }, [getToken, userId, isSignedIn])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleRestore = useCallback(async (id: number) => {
    if (!isSignedIn || !userId) return
    setRestoringId(id)
    setError(null)
    try {
      const token = await getToken({ template: 'supabase' })
      if (!token) {
        setError('Could not get an auth token. Try signing out and back in.')
        return
      }
      const snapshot = await fetchHistorySnapshot(token, userId, id)
      if (!snapshot) {
        setError('That snapshot is no longer available.')
        return
      }
      const result = saveAllotmentData(snapshot)
      if (!result.success) {
        setError(result.error || 'Could not write the restored snapshot to local storage.')
        return
      }
      // Trigger the parent to re-read from localStorage. The next sync cycle
      // will push this snapshot up as the new current version, which the
      // trigger will archive — so a restore is itself reversible.
      onDataImported()
      setConfirmRestoreId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore snapshot')
    } finally {
      setRestoringId(null)
    }
  }, [getToken, userId, isSignedIn, onDataImported])

  if (!isSignedIn) return null

  return (
    <section className="pt-6 border-t border-zen-stone-200">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-5 h-5 text-zen-stone-600" />
        <h2 className="text-lg font-medium text-zen-ink-700">Previous Cloud Versions</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Every time your allotment syncs to the cloud we keep the previous version. If something looks wrong or data went missing, restore an earlier snapshot here.
      </p>

      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
        <span className="text-xs text-gray-500">Showing the most recent {HISTORY_LIMIT}</span>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-zen-kitsune-500 shrink-0 mt-0.5" />
          <p className="text-sm text-zen-kitsune-700">{error}</p>
        </div>
      )}

      {!isLoading && entries.length === 0 && !error && (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          No previous versions yet. As you make changes that sync to the cloud, snapshots will appear here.
        </div>
      )}

      {entries.length > 0 && (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="border border-gray-200 rounded-lg p-3 flex items-center gap-3"
            >
              <Clock className="w-4 h-4 text-zen-stone-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zen-ink-800">
                  {relativeTime(entry.archivedAt)}
                </p>
                <p className="text-xs text-gray-500">
                  {ABSOLUTE_FORMATTER.format(new Date(entry.archivedAt))}
                  {entry.summary && (
                    <>
                      {' · '}
                      {entry.summary.areas} area{entry.summary.areas === 1 ? '' : 's'}
                      {' · '}
                      {entry.summary.varieties} variet{entry.summary.varieties === 1 ? 'y' : 'ies'}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setConfirmRestoreId(entry.id)}
                disabled={restoringId !== null}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-sm bg-zen-water-600 text-white rounded-lg hover:bg-zen-water-700 transition disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {restoringId === entry.id ? 'Restoring...' : 'Restore'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={confirmRestoreId !== null}
        onClose={() => setConfirmRestoreId(null)}
        onConfirm={() => {
          if (confirmRestoreId !== null) handleRestore(confirmRestoreId)
        }}
        title="Restore previous version?"
        message="This will replace your current allotment with the snapshot you picked. Your current version is also kept in the history, so you can roll back again if needed."
        confirmText="Restore"
        cancelText="Cancel"
        variant="warning"
      />
    </section>
  )
}
