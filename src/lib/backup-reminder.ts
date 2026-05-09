import type { AllotmentMeta } from '@/types/unified-allotment'
import type { SyncStatus } from '@/types/storage'

/** Days between automatic backup reminders. */
export const BACKUP_REMINDER_INTERVAL_DAYS = 30

const MS_PER_DAY = 24 * 60 * 60 * 1000

function olderThanDays(iso: string | undefined, days: number, now: number): boolean {
  if (!iso) return true
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return true
  return now - t > days * MS_PER_DAY
}

/**
 * Pure predicate: should the Settings backup reminder callout be shown?
 *
 * Rules:
 * - Cloud-synced users (signed in with `syncStatus === 'synced'`) never see
 *   the reminder — they have a recovery floor already.
 * - Otherwise, show when there has been no export in the last 30 days
 *   AND the reminder has not been dismissed in the last 30 days.
 */
export function shouldShowBackupReminder(
  meta: Pick<AllotmentMeta, 'lastBackupExportAt' | 'backupReminderDismissedAt'> | null | undefined,
  syncStatus: SyncStatus,
  now: Date,
): boolean {
  if (syncStatus === 'synced') return false
  if (!meta) return true
  const nowMs = now.getTime()
  const exportedRecently = !olderThanDays(meta.lastBackupExportAt, BACKUP_REMINDER_INTERVAL_DAYS, nowMs)
  if (exportedRecently) return false
  const dismissedRecently = !olderThanDays(meta.backupReminderDismissedAt, BACKUP_REMINDER_INTERVAL_DAYS, nowMs)
  if (dismissedRecently) return false
  return true
}
