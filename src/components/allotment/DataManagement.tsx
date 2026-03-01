'use client'

import { useState, useCallback } from 'react'
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, RefreshCw, BarChart2 } from 'lucide-react'
import { AllotmentData } from '@/types/unified-allotment'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'
import { clearAnalytics } from '@/lib/analytics'
import AnalyticsViewer from './AnalyticsViewer'
import { useDataTransfer } from '@/hooks/useDataTransfer'

interface DataManagementProps {
  data: AllotmentData | null
  onDataImported: () => void
  flushSave?: () => Promise<boolean>
}

/**
 * Component for managing allotment data - export, import, and clear.
 * Used as a compact dialog trigger on the allotment page.
 */
export default function DataManagement({ data, onDataImported, flushSave }: DataManagementProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showClearAnalyticsConfirm, setShowClearAnalyticsConfirm] = useState(false)
  const [analyticsKey, setAnalyticsKey] = useState(0)

  const {
    handleExport, exportSuccess,
    handleImport, importError, fileInputRef, lastBackupKey, handleRestoreBackup,
    handleClear, showClearConfirm, setShowClearConfirm,
    stats, quota,
  } = useDataTransfer({ data, onDataImported, flushSave })

  const handleClearWithClose = useCallback(() => {
    handleClear()
    setIsOpen(false)
  }, [handleClear])

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
            <div className={`rounded-lg p-4 ${quota.percentageUsed > 80 ? 'bg-zen-bamboo-50 border border-zen-bamboo-200' : 'bg-gray-50'}`}>
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
                      quota.percentageUsed > 90 ? 'bg-zen-kitsune-500' :
                      quota.percentageUsed > 80 ? 'bg-zen-bamboo-500' :
                      'bg-zen-moss-500'
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
                className="flex items-center gap-2 px-4 py-2 bg-zen-moss-600 text-white rounded-lg hover:bg-zen-moss-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <Download className="w-4 h-4" />
                Export Backup
              </button>
              {exportSuccess && (
                <div className="flex items-center gap-2 text-zen-moss-600 text-sm">
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
              Restore from a backup file. <strong className="text-zen-bamboo-600">This will overwrite all current data.</strong>
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
                <div className="p-3 bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-zen-kitsune-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zen-kitsune-700">{importError.message}</p>
                      <p className="text-xs text-zen-kitsune-600 mt-1">Error Code: {importError.code}</p>
                    </div>
                  </div>

                  {importError.suggestions.length > 0 && (
                    <div className="mt-3 pl-6">
                      <p className="text-xs font-medium text-zen-kitsune-700 mb-1">Recovery Steps:</p>
                      <ul className="text-xs text-zen-kitsune-600 space-y-1">
                        {importError.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-zen-kitsune-400 mt-0.5">•</span>
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
                    className="flex items-center gap-2 px-4 py-2 bg-zen-bamboo-600 text-white rounded-lg hover:bg-zen-bamboo-700 transition w-full justify-center"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Restore from Backup
                  </button>
                )}
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
          <div className="bg-zen-kitsune-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-zen-kitsune-800 mb-2">Danger Zone</h3>
            <p className="text-sm text-zen-kitsune-600 mb-3">
              Clear all data and start fresh. This cannot be undone.
            </p>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zen-kitsune-600 text-white rounded-lg hover:bg-zen-kitsune-700 transition"
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
        onConfirm={handleClearWithClose}
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
