'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { AllotmentData, CURRENT_SCHEMA_VERSION, CompleteExport } from '@/types/unified-allotment'
import { VarietyData } from '@/types/variety-data'
import { saveAllotmentData, clearAllotmentData, getStorageStats, migrateSchemaForImport } from '@/services/allotment-storage'
import { loadCompostData, saveCompostData } from '@/services/compost-storage'
import { checkStorageQuota, createPreImportBackup, restoreFromBackup } from '@/lib/storage-utils'
import { ImportError, ExportError } from '@/types/errors'

/**
 * Validate import data structure before import
 */
export function validateImportData(parsed: unknown): { valid: boolean; error?: string } {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Invalid backup file: not a valid JSON object' }
  }

  const obj = parsed as Record<string, unknown>

  // Check for CompleteExport format (new format with allotment + varieties)
  if (obj.allotment && obj.varieties) {
    const allotment = obj.allotment as Record<string, unknown>

    if (typeof allotment.version !== 'number') {
      return { valid: false, error: 'Invalid backup: missing or invalid version' }
    }

    if (!allotment.meta || typeof allotment.meta !== 'object') {
      return { valid: false, error: 'Invalid backup: missing metadata' }
    }

    if (!Array.isArray(allotment.seasons)) {
      return { valid: false, error: 'Invalid backup: missing seasons data' }
    }

    if (allotment.version > CURRENT_SCHEMA_VERSION) {
      return {
        valid: false,
        error: `Backup is from a newer version (v${allotment.version}). Please update the app first.`
      }
    }

    return { valid: true }
  }

  // Check for old format (just AllotmentData)
  if (typeof obj.version === 'number' && obj.meta && Array.isArray(obj.seasons)) {
    if (obj.version > CURRENT_SCHEMA_VERSION) {
      return {
        valid: false,
        error: `Backup is from a newer version (v${obj.version}). Please update the app first.`
      }
    }

    return { valid: true }
  }

  return { valid: false, error: 'Invalid backup file: unrecognized format' }
}

interface UseDataTransferOptions {
  data: AllotmentData | null
  onDataImported: () => void
  flushSave?: () => Promise<boolean>
}

/**
 * Hook encapsulating export/import/clear logic for allotment data.
 * Used by both DataManagement (dialog on allotment page) and settings page (inline).
 */
export function useDataTransfer({ data, onDataImported, flushSave }: UseDataTransferOptions) {
  const [importError, setImportError] = useState<ImportError | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [lastBackupKey, setLastBackupKey] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up export success timer
  useEffect(() => {
    if (exportSuccess) {
      const timerId = setTimeout(() => setExportSuccess(false), 3000)
      return () => clearTimeout(timerId)
    }
  }, [exportSuccess])

  const stats = getStorageStats()
  const quota = checkStorageQuota()

  // Export data as JSON file
  const handleExport = useCallback(() => {
    if (!data) return

    try {
      const currentQuota = checkStorageQuota()
      if (currentQuota.percentageUsed > 80) {
        console.warn(`Storage usage is at ${currentQuota.percentageUsed.toFixed(1)}% - consider clearing old data`)
      }

      const varieties: VarietyData = {
        version: 2,
        varieties: data.varieties || [],
        meta: {
          createdAt: data.meta.createdAt,
          updatedAt: data.meta.updatedAt
        }
      }

      const compostResult = loadCompostData()
      const compost = compostResult.success && compostResult.data ? compostResult.data : undefined

      const exportData: CompleteExport = {
        allotment: data,
        varieties,
        compost,
        exportedAt: new Date().toISOString(),
        exportVersion: CURRENT_SCHEMA_VERSION,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `allotment-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportSuccess(true)
    } catch (error) {
      console.error('Export failed:', error)
      throw new ExportError(
        'Failed to export data',
        'EXPORT_FAILED',
        true,
        ['Try again', 'Check browser console for details']
      )
    }
  }, [data])

  // Import data from JSON file
  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(false)
    setLastBackupKey(null)

    if (flushSave) {
      try {
        await flushSave()
      } catch {
        // Continue anyway
      }
    }

    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string

        let parsed: unknown
        try {
          parsed = JSON.parse(content)
        } catch {
          setImportError(new ImportError(
            'Invalid JSON file',
            'INVALID_JSON',
            true,
            ['Ensure the file is a valid JSON export from this application', 'Try exporting a new backup']
          ))
          return
        }

        const validation = validateImportData(parsed)
        if (!validation.valid) {
          const errorMsg = validation.error || 'Invalid backup file'
          const code = errorMsg.includes('newer version') ? 'VERSION_MISMATCH' : 'INVALID_FORMAT'
          const recoverable = !errorMsg.includes('newer version')
          const suggestions = errorMsg.includes('newer version')
            ? ['Update the application to the latest version', 'Use an older backup file']
            : ['Check that the file is a valid backup', 'Try exporting a new backup']

          setImportError(new ImportError(errorMsg, code, recoverable, suggestions))
          return
        }

        const backupResult = createPreImportBackup()
        if (!backupResult.success) {
          setImportError(new ImportError(
            backupResult.error || 'Failed to create safety backup',
            'BACKUP_FAILED',
            false,
            ['Free up storage space', 'Clear browser cache', 'Try a different browser']
          ))
          return
        }

        setLastBackupKey(backupResult.backupKey || null)

        let allotmentData: AllotmentData
        let varietyData: VarietyData | null = null
        let compostData = null

        if ((parsed as Record<string, unknown>).allotment && (parsed as Record<string, unknown>).varieties) {
          const complete = parsed as CompleteExport
          allotmentData = complete.allotment
          varietyData = complete.varieties
          compostData = complete.compost || null

          if (varietyData && varietyData.varieties) {
            allotmentData.varieties = varietyData.varieties
          }
        } else {
          allotmentData = parsed as AllotmentData
        }

        const timestampedData: AllotmentData = {
          ...allotmentData,
          meta: {
            ...allotmentData.meta,
            updatedAt: new Date().toISOString(),
          }
        }

        const migratedData = migrateSchemaForImport(timestampedData)
        const allotmentResult = saveAllotmentData(migratedData)

        if (!allotmentResult.success) {
          const errorMsg = allotmentResult.error || 'Failed to save allotment data'
          const isQuotaError = errorMsg.toLowerCase().includes('quota')

          setImportError(new ImportError(
            errorMsg,
            isQuotaError ? 'QUOTA_EXCEEDED' : 'SAVE_FAILED',
            true,
            isQuotaError
              ? ['Free up storage space by deleting old backups', 'Clear browser cache', 'Export and save your data externally']
              : ['Try again', 'Refresh the page', 'Check browser console for details']
          ))
          return
        }

        if (compostData) {
          const compostResult = saveCompostData(compostData)
          if (!compostResult.success) {
            console.warn('Failed to import compost data:', compostResult.error)
          }
        }

        window.__disablePersistenceUntilReload = true
        window.location.reload()
      } catch (error) {
        console.error('Import failed:', error)
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setImportError(new ImportError(
          `Unexpected error during import: ${errorMsg}`,
          'UNEXPECTED_ERROR',
          true,
          ['Use "Restore from backup" button below', 'Try again with a different backup file', 'Check browser console for details']
        ))
      }
    }

    reader.onerror = () => {
      setImportError(new ImportError(
        'Failed to read the backup file',
        'FILE_READ_ERROR',
        true,
        ['Try selecting the file again', 'Check that the file is not corrupted', 'Try a different backup file']
      ))
    }

    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [flushSave])

  const handleRestoreBackup = useCallback(() => {
    if (!lastBackupKey) return

    const result = restoreFromBackup(lastBackupKey)
    if (result.success) {
      setImportError(null)
      setLastBackupKey(null)
      setImportSuccess(false)
      onDataImported()
    } else {
      setImportError(new ImportError(
        result.error || 'Failed to restore backup',
        'RESTORE_FAILED',
        false,
        ['Refresh the page', 'Contact support if you lost important data']
      ))
    }
  }, [lastBackupKey, onDataImported])

  const handleClear = useCallback(() => {
    const result = clearAllotmentData()
    if (result.success) {
      setShowClearConfirm(false)
      onDataImported()
    }
  }, [onDataImported])

  return {
    // Export
    handleExport,
    exportSuccess,
    // Import
    handleImport,
    importError,
    importSuccess,
    fileInputRef,
    lastBackupKey,
    handleRestoreBackup,
    // Clear
    handleClear,
    showClearConfirm,
    setShowClearConfirm,
    // Storage info
    stats,
    quota,
  }
}
