'use client'

import { useState } from 'react'
import { ShareDialog } from '@/components/share/ShareDialog'
import { useDataTransfer } from '@/hooks/useDataTransfer'
import { useAllotment } from '@/hooks/useAllotment'
import Link from 'next/link'
import {
  Download, Upload, ArrowRight, Database,
  Share2, QrCode, Trash2, AlertTriangle, CheckCircle, RefreshCw, Shield,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/Dialog'

interface DataTabProps {
  data: ReturnType<typeof useAllotment>['data']
  flushSave: ReturnType<typeof useAllotment>['flushSave']
  reload: ReturnType<typeof useAllotment>['reload']
  isSignedIn?: boolean
  onDeleteAccount?: () => Promise<void>
  userEmail?: string
}

/**
 * Data tab with unified Transfer, Danger Zone, and Account sections.
 */
export default function DataTab({ data, flushSave, reload, isSignedIn, onDeleteAccount, userEmail }: DataTabProps) {
  const {
    handleExport, exportSuccess,
    handleImport, importError, fileInputRef, lastBackupKey, handleRestoreBackup,
    handleClear, showClearConfirm, setShowClearConfirm,
  } = useDataTransfer({ data, onDataImported: reload, flushSave })

  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [accountFeedback, setAccountFeedback] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {/* Transfer Data Section */}
      <section data-tour="data-management">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-zen-stone-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Transfer Data</h2>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Share or move your allotment data between devices.
        </p>

        {/* Send */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Send</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Share via Link */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Share2 className="w-4 h-4 text-zen-moss-600" />
                Share via Link
              </div>
              <p className="text-xs text-gray-500 flex-1">
                Generate a QR code and share code for another device.
              </p>
              <div className="mt-1" data-tour="share-settings">
                <ShareDialog data={data} flushSave={flushSave} />
              </div>
            </div>

            {/* Export as File */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Download className="w-4 h-4 text-zen-moss-600" />
                Export as File
              </div>
              <p className="text-xs text-gray-500 flex-1">
                Download a JSON backup of all your data.
              </p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={handleExport}
                  disabled={!data}
                  className="flex items-center gap-2 px-4 py-2 bg-zen-moss-600 text-white rounded-lg hover:bg-zen-moss-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  <Download className="w-4 h-4" />
                  Export Backup
                </button>
                {exportSuccess && (
                  <span className="flex items-center gap-1 text-zen-moss-600 text-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Done!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Receive */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Receive</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Receive via Code */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <QrCode className="w-4 h-4 text-zen-water-600" />
                Receive via Code
              </div>
              <p className="text-xs text-gray-500 flex-1">
                Scan a QR code or enter a share code.
              </p>
              <div className="mt-1">
                <Link
                  href="/receive"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm min-h-[44px]"
                >
                  <QrCode className="w-4 h-4" />
                  Receive Data
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Import from File */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Upload className="w-4 h-4 text-zen-water-600" />
                Import from File
              </div>
              <p className="text-xs text-gray-500 flex-1">
                Restore from a JSON backup file.
              </p>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImport}
                  className="hidden"
                  id="settings-import-file"
                  aria-label="Select backup file to import"
                />
                <label
                  htmlFor="settings-import-file"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-sm min-h-[44px]"
                >
                  <Upload className="w-4 h-4" />
                  Select Backup File
                </label>
              </div>
            </div>
          </div>

          {/* Import error/success messages */}
          {importError && (
            <div className="mt-4 space-y-3">
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
      </section>

      {/* Danger Zone */}
      <section className="pt-6 border-t border-zen-stone-200">
        <div className="bg-zen-kitsune-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-zen-kitsune-800 mb-2">Danger Zone</h3>

          {/* Clear local data */}
          <div className="mb-4">
            <p className="text-sm text-zen-kitsune-600 mb-3">
              Clear all local data and start fresh. This cannot be undone.
              {isSignedIn && ' Your cloud data will not be affected.'}
            </p>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zen-kitsune-600 text-white rounded-lg hover:bg-zen-kitsune-700 transition min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              Clear Local Data
            </button>
          </div>

          {/* Delete account (cloud + local) */}
          {isSignedIn && onDeleteAccount && (
            <div className="pt-4 border-t border-zen-kitsune-200">
              <div className="flex items-start gap-2 mb-3">
                <Shield className="w-4 h-4 text-zen-kitsune-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-zen-kitsune-600">
                  Delete your cloud account and all data{userEmail ? ` for ${userEmail}` : ''}. This removes both cloud and local data permanently.
                </p>
              </div>
              {confirmDeleteAccount ? (
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setIsDeletingAccount(true)
                      try {
                        await onDeleteAccount()
                      } catch {
                        setAccountFeedback('Deletion failed. Please try again.')
                        setIsDeletingAccount(false)
                        setConfirmDeleteAccount(false)
                      }
                    }}
                    disabled={isDeletingAccount}
                    className="flex items-center gap-2 px-4 py-2 bg-zen-kitsune-600 text-white rounded-lg hover:bg-zen-kitsune-700 transition min-h-[44px] disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeletingAccount ? 'Deleting...' : 'Yes, Delete Everything'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteAccount(false)}
                    className="zen-btn-secondary min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteAccount(true)}
                  className="flex items-center gap-2 px-4 py-2 text-zen-kitsune-600 border border-zen-kitsune-300 rounded-lg hover:bg-zen-kitsune-100 transition min-h-[44px]"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete My Account
                </button>
              )}
              {accountFeedback && (
                <p className="mt-2 text-sm text-zen-kitsune-600">{accountFeedback}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Clear Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear Local Data?"
        message={isSignedIn
          ? "This will delete your local allotment data. Your cloud data will remain intact and will sync back on next load. Consider exporting a backup first."
          : "This will permanently delete all your allotment data including all seasons, plantings, and settings. This action cannot be undone. Consider exporting a backup first."
        }
        confirmText="Delete Local Data"
        cancelText="Keep Data"
        variant="danger"
      />
    </div>
  )
}
