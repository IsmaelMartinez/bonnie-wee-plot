'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Dialog from '@/components/ui/Dialog'
import { fetchHistorySnapshot } from '@/lib/supabase/sync'
import { loadAllotmentData } from '@/services/allotment-storage'
import { diffAllotment, isEmptyDiff, type AllotmentDiff } from '@/lib/allotment-diff'
import type { AllotmentData } from '@/types/unified-allotment'

interface CloudHistoryDiffDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Snapshot row the user clicked. */
  baseId: number
  /**
   * id of the next-newer snapshot to diff against. When undefined, the base
   * row is the most recent snapshot in the list and we diff against the
   * current local data instead.
   */
  newerId: number | undefined
  archivedAt: string
  getToken: (opts: { template: string }) => Promise<string | null>
  userId: string
  /**
   * Fired with the computed diff once it has loaded. Lets the parent cache
   * the diff for inline-hint rendering without re-fetching.
   */
  onDiffComputed?: (diff: AllotmentDiff) => void
}

const ABSOLUTE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatArchivedAt(archivedAt: string): string {
  const d = new Date(archivedAt)
  return Number.isNaN(d.getTime()) ? archivedAt : ABSOLUTE_FORMATTER.format(d)
}

export default function CloudHistoryDiffDialog({
  isOpen,
  onClose,
  baseId,
  newerId,
  archivedAt,
  getToken,
  userId,
  onDiffComputed,
}: CloudHistoryDiffDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diff, setDiff] = useState<AllotmentDiff | null>(null)

  // Hold the latest onDiffComputed in a ref so the load effect can call the
  // freshest callback without needing it as a dep. Parents typically pass an
  // inline arrow that's recreated every render — including it in deps would
  // refire the effect after each setDiff → parent setState → rerender →
  // fresh callback ref → loop, which is what made "View changes" appear
  // stuck on a permanent loading spinner.
  const onDiffComputedRef = useRef(onDiffComputed)
  useEffect(() => {
    onDiffComputedRef.current = onDiffComputed
  }, [onDiffComputed])

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes so the next open re-fetches.
      setDiff(null)
      setError(null)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      setDiff(null)

      try {
        const token = await getToken({ template: 'supabase' })
        if (!token) {
          if (!cancelled) setError('Could not get an auth token. Try signing out and back in.')
          return
        }

        // Fetch the base snapshot. If we have a newer snapshot in the list,
        // fetch both in parallel; otherwise diff against current local data.
        const [base, newer] = await Promise.all([
          fetchHistorySnapshot(token, userId, baseId),
          newerId !== undefined
            ? fetchHistorySnapshot(token, userId, newerId)
            : Promise.resolve<AllotmentData | null>(null),
        ])

        if (cancelled) return

        if (!base) {
          setError('That snapshot is no longer available.')
          return
        }

        let comparedAgainst: AllotmentData | null = newer
        if (newerId === undefined) {
          // Most recent row — diff against current local data.
          const localResult = loadAllotmentData()
          comparedAgainst = localResult.success && localResult.data ? localResult.data : null
        }

        if (!comparedAgainst) {
          setError(
            newerId === undefined
              ? 'No local data to compare against.'
              : 'The newer snapshot is no longer available.',
          )
          return
        }

        const computed = diffAllotment(base, comparedAgainst)
        setDiff(computed)
        onDiffComputedRef.current?.(computed)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load snapshot')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isOpen, baseId, newerId, getToken, userId])

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="What changed"
      description={`Snapshot from ${formatArchivedAt(archivedAt)} compared with ${
        newerId === undefined ? 'your current allotment' : 'the next-newer snapshot'
      }.`}
      maxWidth="lg"
    >
      {isLoading && (
        <div className="flex items-center gap-2 py-8 justify-center text-zen-stone-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading changes…</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-3 bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-zen-kitsune-500 shrink-0 mt-0.5" />
          <p className="text-sm text-zen-kitsune-700">{error}</p>
        </div>
      )}

      {diff && !isLoading && !error && <DiffSummary diff={diff} />}
    </Dialog>
  )
}

function DiffSummary({ diff }: { diff: AllotmentDiff }) {
  if (isEmptyDiff(diff)) {
    return (
      <p className="text-sm text-zen-stone-600 py-4 text-center">
        No meaningful changes between these two versions.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <DiffSection
        title="Areas"
        added={diff.areas.added}
        removed={diff.areas.removed}
        renamed={diff.areas.renamed}
      />
      <PlantingsSection counts={diff.plantings} />
      <DiffSection
        title="Varieties"
        added={diff.varieties.added}
        removed={diff.varieties.removed}
        renamed={diff.varieties.renamed}
      />
      {diff.meta.schemaVersionChanged && (
        <section>
          <h3 className="text-sm font-medium text-zen-ink-700 mb-1">Schema</h3>
          <p className="text-sm text-zen-stone-600">
            Schema version v{diff.meta.schemaVersionChanged.from} → v{diff.meta.schemaVersionChanged.to}
          </p>
        </section>
      )}
    </div>
  )
}

interface DiffSectionProps {
  title: string
  added: string[]
  removed: string[]
  renamed: Array<{ id: string; from: string; to: string }>
}

function DiffSection({ title, added, removed, renamed }: DiffSectionProps) {
  if (added.length === 0 && removed.length === 0 && renamed.length === 0) {
    return (
      <section>
        <h3 className="text-sm font-medium text-zen-ink-700 mb-1">{title}</h3>
        <p className="text-sm text-zen-stone-500">No changes</p>
      </section>
    )
  }

  return (
    <section>
      <h3 className="text-sm font-medium text-zen-ink-700 mb-2">{title}</h3>
      <div className="space-y-2 text-sm">
        {added.length > 0 && (
          <ChangeList label="Added" tone="moss" items={added} />
        )}
        {removed.length > 0 && (
          <ChangeList label="Removed" tone="kitsune" items={removed} />
        )}
        {renamed.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-zen-stone-500 mb-1">Renamed</p>
            <ul className="space-y-1">
              {renamed.map((r) => (
                <li key={r.id} className="text-zen-ink-700">
                  <span className="text-zen-stone-500">{r.from}</span>
                  <span className="mx-1 text-zen-stone-400">→</span>
                  <span>{r.to}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function ChangeList({
  label,
  tone,
  items,
}: {
  label: string
  tone: 'moss' | 'kitsune'
  items: string[]
}) {
  const labelClass =
    tone === 'moss'
      ? 'text-zen-moss-700 bg-zen-moss-50 border-zen-moss-200'
      : 'text-zen-kitsune-700 bg-zen-kitsune-50 border-zen-kitsune-200'

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zen-stone-500 mb-1">{label}</p>
      <ul className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <li
            key={`${item}-${i}`}
            className={`text-xs px-2 py-1 rounded-zen border ${labelClass}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlantingsSection({ counts }: { counts: AllotmentDiff['plantings'] }) {
  const { added, removed, edited } = counts
  if (added === 0 && removed === 0 && edited === 0) {
    return (
      <section>
        <h3 className="text-sm font-medium text-zen-ink-700 mb-1">Plantings</h3>
        <p className="text-sm text-zen-stone-500">No changes</p>
      </section>
    )
  }
  return (
    <section>
      <h3 className="text-sm font-medium text-zen-ink-700 mb-2">Plantings</h3>
      <ul className="text-sm text-zen-ink-700 space-y-1">
        {added > 0 && (
          <li>
            <span className="text-zen-moss-700 font-medium">+{added}</span> added
          </li>
        )}
        {removed > 0 && (
          <li>
            <span className="text-zen-kitsune-700 font-medium">−{removed}</span> removed
          </li>
        )}
        {edited > 0 && (
          <li>
            <span className="text-zen-ink-700 font-medium">{edited}</span> edited
          </li>
        )}
      </ul>
    </section>
  )
}
