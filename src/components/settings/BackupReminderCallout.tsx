'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Download, X } from 'lucide-react'

interface BackupReminderCalloutProps {
  /** ISO timestamp of the last successful export, if any. */
  lastBackupExportAt?: string
  onDownload: () => void
  onDismiss: () => void
}

function formatRelative(iso: string | undefined, now: number): string {
  if (!iso) return 'never'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return 'never'
  const days = Math.floor((now - t) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  return `${months} months ago`
}

/**
 * Yellow callout shown in Settings → Data when the user hasn't exported
 * a backup in the last 30 days (and isn't already covered by cloud sync).
 *
 * Visibility is decided by the parent via `shouldShowBackupReminder`; this
 * component only renders the surface and routes the two actions.
 */
export default function BackupReminderCallout({
  lastBackupExportAt,
  onDownload,
  onDismiss,
}: BackupReminderCalloutProps) {
  // Compute relative time on the client only to avoid SSR/CSR hydration drift
  // around day boundaries (server renders "today", client hydrates "yesterday").
  const [relative, setRelative] = useState<string | null>(null)
  useEffect(() => {
    setRelative(formatRelative(lastBackupExportAt, Date.now()))
  }, [lastBackupExportAt])

  return (
    <div
      className="bg-zen-bamboo-50 border border-zen-bamboo-200 rounded-lg p-4 flex items-start gap-3"
      role="status"
      aria-label="Backup reminder"
    >
      <AlertCircle className="w-5 h-5 text-zen-bamboo-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zen-ink-900">
          Time to back up your allotment
        </p>
        <p className="text-xs text-zen-stone-600 mt-1">
          Last export: {relative ?? '…'}. Download a backup file so you don&apos;t lose your data if this device is lost or cleared.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-zen-bamboo-600 text-white rounded-lg hover:bg-zen-bamboo-700 transition text-sm min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            Download backup
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center gap-2 px-4 py-2 bg-white text-zen-bamboo-700 border border-zen-bamboo-300 rounded-lg hover:bg-zen-bamboo-100 transition text-sm min-h-[44px]"
          >
            Dismiss for 30 days
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 text-zen-stone-400 hover:text-zen-stone-600 transition-colors"
        aria-label="Dismiss backup reminder"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
