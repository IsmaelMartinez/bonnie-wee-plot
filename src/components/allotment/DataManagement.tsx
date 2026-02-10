'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, RefreshCw, BarChart2 } from 'lucide-react'
import { AllotmentData, CURRENT_SCHEMA_VERSION, CompleteExport } from '@/types/unified-allotment'
import { VarietyData } from '@/types/variety-data'
import { saveAllotmentData, clearAllotmentData, getStorageStats, migrateSchemaForImport } from '@/services/allotment-storage'
import { loadCompostData, saveCompostData } from '@/services/compost-storage'
import { checkStorageQuota, createPreImportBackup, restoreFromBackup } from '@/lib/storage-utils'
import { ImportError, ExportError } from '@/types/errors'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'
import { clearAnalytics } from '@/lib/analytics'
import AnalyticsViewer from './AnalyticsViewer'

interface DataManagementProps {
  data: AllotmentData | null
  onDataImported: () => void
  flushSave?: () => Promise<boolean>
}

/**
 * Validate import data structure before preview
 */
function validateImportData(parsed: unknown): { valid: boolean; error?: string } {
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

/**
 * Component for managing allotment data - export, import, and clear
 */
export default function DataManagement({ data, onDataImported, flushSave }: DataManagementProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [importError, setImportError] = useState<ImportError | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [lastBackupKey, setLastBackupKey] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showClearAnalyticsConfirm, setShowClearAnalyticsConfirm] = useState(false)
  const [analyticsKey, setAnalyticsKey] = useState(0)

  // Get storage statistics
  const stats = getStorageStats()
  const quota = checkStorageQuota()

  // Clean up export success timer to prevent memory leaks
  useEffect(() => {
    if (exportSuccess) {
      const timerId = setTimeout(() => {
        setExportSuccess(false)
      }, 3000)

      return () => clearTimeout(timerId)
    }
  }, [exportSuccess])

  // Export data as JSON file (includes allotment, varieties, and compost)
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

      // Show success feedback
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

  // Import data from JSON file (supports both old and new formats)
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
        // Continue anyway - import has its own verification
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
      setIsOpen(false)
      onDataImported()
    }
  }, [onDataImported])

  const handleClearAnalytics = useCallback(() => {
    clearAnalytics()
    setAnalyticsKey(k => k + 1)
    setShowClearAnalyticsConfirm(false)
  }, [])

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        aria-label="Data management"
        title="Import/Export Data"
      >
        <Download className="w-5 h-5" />
      </button>

      {/* Data Management Dialog */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Data Management"
        description="Export your data for backup or import from a previous backup."
        maxWidth="md"
      >
        <div className="space-y-6">
          {/* Storage Stats with Quota Warning */}
          {stats && (
            <div className={`rounded-lg p-4 ${quota.percentageUsed > 80 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Storage Usage</h3>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <p className="text-xs text-gray-500">Allotment Data</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.dataSize}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total localStorage</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.used}</p>
                </div>
              </div>
              {/* Quota usage bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Quota Usage</span>
                  <span>{quota.percentageUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      quota.percentageUsed > 90 ? 'bg-red-500' :
                      quota.percentageUsed > 80 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(quota.percentageUsed, 100)}%` }}
                  />
                </div>
              </div>
              {quota.percentageUsed > 80 && (
                <div className="mt-3 flex items-start gap-2 text-xs text-amber-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Storage is {quota.percentageUsed.toFixed(0)}% full. Consider exporting your data and clearing old backups.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Export Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Export Data</h3>
            <p className="text-sm text-gray-500 mb-3">
              Download your complete allotment data as a JSON file. Includes all seasons, plantings, seed varieties, and settings.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={!data}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export Backup
              </button>
              {exportSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Exported successfully!</span>
                </div>
              )}
            </div>
          </div>

          {/* Import Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Import Data</h3>
            <p className="text-sm text-gray-500 mb-3">
              Restore from a backup file. <strong className="text-amber-600">This will overwrite all current data.</strong>
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
              aria-label="Select backup file to import"
            />

            <label
              htmlFor="import-file"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer inline-flex"
            >
              <Upload className="w-4 h-4" />
              Select Backup File
            </label>

            {/* Import Status Messages */}
            {importError && (
              <div className="mt-3 space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-700">{importError.message}</p>
                      <p className="text-xs text-red-600 mt-1">Error Code: {importError.code}</p>
                    </div>
                  </div>

                  {importError.suggestions.length > 0 && (
                    <div className="mt-3 pl-6">
                      <p className="text-xs font-medium text-red-700 mb-1">Recovery Steps:</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {importError.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {lastBackupKey && importError.recoverable && (
                  <button
                    onClick={handleRestoreBackup}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition w-full justify-center"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Restore from Backup
                  </button>
                )}
              </div>
            )}

            {importSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-sm text-green-700">Data imported successfully! Reloading...</p>
              </div>
            )}
          </div>

          {/* Analytics Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Usage Analytics
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              View local usage patterns. No data is sent externally.
            </p>

            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <BarChart2 className="w-4 h-4" />
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </button>

            {showAnalytics && (
              <AnalyticsViewer
                key={analyticsKey}
                onClearClick={() => setShowClearAnalyticsConfirm(true)}
              />
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600 mb-3">
              Clear all data and start fresh. This cannot be undone.
            </p>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>

      {/* Clear Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear All Data?"
        message="This will permanently delete all your allotment data including all seasons, plantings, and settings. This action cannot be undone. Consider exporting a backup first."
        confirmText="Delete Everything"
        cancelText="Keep Data"
        variant="danger"
      />

      {/* Clear Analytics Confirmation */}
      <ConfirmDialog
        isOpen={showClearAnalyticsConfirm}
        onClose={() => setShowClearAnalyticsConfirm(false)}
        onConfirm={handleClearAnalytics}
        title="Clear Analytics Data?"
        message="This will delete all analytics data. This cannot be undone."
        confirmText="Clear Analytics"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}
