'use client'

import { useState, useRef, useCallback } from 'react'
import { Download, Upload, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { AllotmentData, CURRENT_SCHEMA_VERSION } from '@/types/unified-allotment'
import { VarietyData } from '@/types/variety-data'
import { saveAllotmentData, clearAllotmentData, getStorageStats, loadAllotmentData } from '@/services/allotment-storage'
import { STORAGE_KEY } from '@/types/unified-allotment'
import { loadVarietyData } from '@/services/variety-storage'
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog'

interface DataManagementProps {
  data: AllotmentData | null
  onDataImported: () => void
}

interface CompleteExport {
  allotment: AllotmentData
  varieties: VarietyData
  exportedAt: string
  exportVersion: number
}

/**
 * Create a backup of current data before import
 * This is a safety measure to prevent accidental data loss
 */
function createPreImportBackup(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const result = loadAllotmentData()
    if (!result.success || !result.data) return false

    const backupKey = `${STORAGE_KEY}-pre-import-${Date.now()}`
    localStorage.setItem(backupKey, JSON.stringify(result.data))
    console.log(`Created pre-import backup: ${backupKey}`)
    return true
  } catch (error) {
    console.error('Failed to create pre-import backup:', error)
    return false
  }
}

/**
 * Component for managing allotment data - export, import, and clear
 */
export default function DataManagement({ data, onDataImported }: DataManagementProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Get storage statistics
  const stats = getStorageStats()

  // Export data as JSON file (includes both allotment and varieties)
  const handleExport = useCallback(() => {
    if (!data) return

    try {
      // Load varieties data
      const varietyResult = loadVarietyData()
      const varieties = varietyResult.success && varietyResult.data ? varietyResult.data : {
        version: 2,
        varieties: [],
        meta: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }

      const exportData: CompleteExport = {
        allotment: data,
        varieties,
        exportedAt: new Date().toISOString(),
        exportVersion: CURRENT_SCHEMA_VERSION,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)

      // Create download link and trigger
      const a = document.createElement('a')
      a.href = url
      a.download = `allotment-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [data])

  // Import data from JSON file (supports both old and new formats)
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(false)

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        // Create backup of existing data before import
        createPreImportBackup()

        const content = e.target?.result as string
        const parsed = JSON.parse(content)

        let allotmentData: AllotmentData
        let varietyData: VarietyData | null = null

        // Check if this is the new format (has allotment + varieties)
        if (parsed.allotment && parsed.varieties) {
          const complete = parsed as CompleteExport
          allotmentData = complete.allotment
          varietyData = complete.varieties

          // Check version compatibility
          if (allotmentData.version > CURRENT_SCHEMA_VERSION) {
            setImportError(`Backup is from a newer version (v${allotmentData.version}). Please update the app first.`)
            return
          }

          // Merge varieties into allotment data
          // The app expects varieties to be in AllotmentData.varieties, not in separate storage
          if (varietyData && varietyData.varieties) {
            allotmentData.varieties = varietyData.varieties
          }
        } else {
          // Old format - just AllotmentData
          allotmentData = parsed as AllotmentData

          // Basic validation
          if (!allotmentData.version || !allotmentData.meta || !allotmentData.seasons) {
            setImportError('Invalid backup file: missing required fields')
            return
          }

          // Check version compatibility
          if (allotmentData.version > CURRENT_SCHEMA_VERSION) {
            setImportError(`Backup is from a newer version (v${allotmentData.version}). Please update the app first.`)
            return
          }
        }

        // Update timestamps
        const finalAllotmentData: AllotmentData = {
          ...allotmentData,
          meta: {
            ...allotmentData.meta,
            updatedAt: new Date().toISOString(),
          }
        }

        // Save allotment data (now includes varieties merged from varietyData)
        const allotmentResult = saveAllotmentData(finalAllotmentData)

        if (!allotmentResult.success) {
          setImportError(allotmentResult.error || 'Failed to save allotment data')
          return
        }

        setImportSuccess(true)
        setTimeout(() => {
          setImportSuccess(false)
          setIsOpen(false)
          onDataImported()
        }, 1500)
      } catch (error) {
        console.error('Import failed:', error)
        setImportError('Invalid JSON file. Please select a valid backup file.')
      }
    }

    reader.onerror = () => {
      setImportError('Failed to read file. Please try again.')
    }

    reader.readAsText(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onDataImported])

  // Clear all data
  const handleClear = useCallback(() => {
    const result = clearAllotmentData()
    if (result.success) {
      setShowClearConfirm(false)
      setIsOpen(false)
      onDataImported()
    }
  }, [onDataImported])

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
          {/* Storage Stats */}
          {stats && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Storage Usage</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Allotment Data</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.dataSize}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total localStorage</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.used}</p>
                </div>
              </div>
            </div>
          )}

          {/* Export Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Export Data</h3>
            <p className="text-sm text-gray-500 mb-3">
              Download your complete allotment data as a JSON file. Includes all seasons, plantings, seed varieties, and settings.
            </p>
            <button
              onClick={handleExport}
              disabled={!data}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export Backup
            </button>
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
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{importError}</p>
              </div>
            )}
            
            {importSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-sm text-green-700">Data imported successfully! Reloading...</p>
              </div>
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
    </>
  )
}

