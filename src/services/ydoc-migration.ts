import * as Y from 'yjs'
import { STORAGE_KEY } from '@/types/unified-allotment'
import type { AllotmentData } from '@/types/unified-allotment'
import { allotmentToYDoc } from './ydoc-converter'
import { validateAllotmentData } from './allotment-storage'
import { logger } from '@/lib/logger'

const BACKUP_KEY = `${STORAGE_KEY}-backup`
const BACKUP_EXPIRY_DAYS = 30

export async function migrateToYDoc(ydoc: Y.Doc): Promise<boolean> {
  const root = ydoc.getMap('allotment')
  if (root.size > 0) {
    logger.info('Y.Doc already has data, skipping migration')
    return false
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    logger.info('No localStorage data to migrate')
    return false
  }

  try {
    const data = JSON.parse(stored) as AllotmentData

    const validation = validateAllotmentData(data)
    if (!validation.valid) {
      logger.error('Invalid localStorage data, cannot migrate', { errors: validation.errors })
      return false
    }

    const backupData = {
      data: stored,
      migratedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + BACKUP_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData))

    allotmentToYDoc(data, ydoc)

    logger.info('Successfully migrated localStorage to Y.Doc', {
      areasCount: data.layout.areas.length,
      seasonsCount: data.seasons.length
    })

    return true
  } catch (error) {
    logger.error('Failed to migrate localStorage to Y.Doc', { error })
    return false
  }
}

export function cleanupExpiredBackups(): void {
  const backupStr = localStorage.getItem(BACKUP_KEY)
  if (!backupStr) return

  try {
    const backup = JSON.parse(backupStr)
    if (new Date(backup.expiresAt) < new Date()) {
      localStorage.removeItem(BACKUP_KEY)
      logger.info('Cleaned up expired localStorage backup')
    }
  } catch {
    localStorage.removeItem(BACKUP_KEY)
  }
}

export async function restoreFromBackup(ydoc: Y.Doc): Promise<boolean> {
  const backupStr = localStorage.getItem(BACKUP_KEY)
  if (!backupStr) {
    logger.warn('No backup available for restore')
    return false
  }

  try {
    const backup = JSON.parse(backupStr)
    const data = JSON.parse(backup.data) as AllotmentData

    const root = ydoc.getMap('allotment')
    root.clear()

    allotmentToYDoc(data, ydoc)

    logger.info('Successfully restored from backup')
    return true
  } catch (error) {
    logger.error('Failed to restore from backup', { error })
    return false
  }
}
