import { describe, it, expect } from 'vitest'
import { shouldShowBackupReminder } from '@/lib/backup-reminder'

const NOW = new Date('2026-05-09T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

function isoDaysAgo(days: number): string {
  return new Date(NOW.getTime() - days * DAY).toISOString()
}

describe('shouldShowBackupReminder', () => {
  it('shows when never exported and no cloud sync', () => {
    expect(shouldShowBackupReminder({}, 'disabled', NOW)).toBe(true)
  })

  it('does not show when exported within the last 30 days', () => {
    const meta = { lastBackupExportAt: isoDaysAgo(5) }
    expect(shouldShowBackupReminder(meta, 'disabled', NOW)).toBe(false)
  })

  it('shows when last export was more than 30 days ago', () => {
    const meta = { lastBackupExportAt: isoDaysAgo(45) }
    expect(shouldShowBackupReminder(meta, 'disabled', NOW)).toBe(true)
  })

  it('does not show when dismissed within the last 30 days', () => {
    const meta = {
      lastBackupExportAt: isoDaysAgo(45),
      backupReminderDismissedAt: isoDaysAgo(3),
    }
    expect(shouldShowBackupReminder(meta, 'disabled', NOW)).toBe(false)
  })

  it('shows again once the dismissal is older than 30 days', () => {
    const meta = {
      lastBackupExportAt: isoDaysAgo(60),
      backupReminderDismissedAt: isoDaysAgo(40),
    }
    expect(shouldShowBackupReminder(meta, 'disabled', NOW)).toBe(true)
  })

  it('does not show for cloud-synced signed-in users regardless of export history', () => {
    const meta = {
      lastBackupExportAt: isoDaysAgo(365),
      backupReminderDismissedAt: undefined,
    }
    expect(shouldShowBackupReminder(meta, 'synced', NOW)).toBe(false)
  })

  it('still shows when sync is configured but not yet synced (e.g. syncing/error/offline)', () => {
    const meta = { lastBackupExportAt: isoDaysAgo(60) }
    expect(shouldShowBackupReminder(meta, 'syncing', NOW)).toBe(true)
    expect(shouldShowBackupReminder(meta, 'error', NOW)).toBe(true)
    expect(shouldShowBackupReminder(meta, 'offline', NOW)).toBe(true)
  })

  it('treats null meta as never-exported / never-dismissed', () => {
    expect(shouldShowBackupReminder(null, 'disabled', NOW)).toBe(true)
    expect(shouldShowBackupReminder(undefined, 'disabled', NOW)).toBe(true)
  })

  it('treats malformed ISO timestamps as missing', () => {
    const meta = { lastBackupExportAt: 'not-a-date', backupReminderDismissedAt: 'also-bad' }
    expect(shouldShowBackupReminder(meta, 'disabled', NOW)).toBe(true)
  })
})
