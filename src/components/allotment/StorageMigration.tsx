'use client'

import { useState, useCallback } from 'react'
import { GitMerge, Info, CheckCircle, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import type { AllotmentData } from '@/types/unified-allotment'
import {
  migrateDryRun,
  migrateVarietyStorage,
  rollbackMigration,
  listMigrationBackups,
  deleteMigrationBackup,
  getBackupMetadata,
  type MigrationPlan,
  type MigrationResult,
} from '@/lib/migration-utils'

interface StorageMigrationProps {
  data: AllotmentData | null
  onDataImported: () => void
}

export default function StorageMigration({ data, onDataImported }: StorageMigrationProps) {
  const [migrationPlan, setMigrationPlan] = useState<MigrationPlan | null>(null)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [migrationBackups, setMigrationBackups] = useState<string[]>([])
  const [migrationError, setMigrationError] = useState<string | null>(null)

  const handleCheckMigration = useCallback(() => {
    if (!data) return

    setMigrationError(null)
    const plan = migrateDryRun(data)
    setMigrationPlan(plan)

    const backups = listMigrationBackups()
    setMigrationBackups(backups)
  }, [data])

  const handleMigrateStorage = useCallback(() => {
    if (!data) return

    setMigrationError(null)
    setMigrationResult(null)

    const result = migrateVarietyStorage(data)
    setMigrationResult(result)

    if (result.success) {
      setTimeout(() => {
        onDataImported()
        handleCheckMigration()
      }, 1500)
    } else {
      setMigrationError(result.error || 'Migration failed')
    }
  }, [data, onDataImported, handleCheckMigration])

  const handleRollbackMigration = useCallback((backupKey: string) => {
    const result = rollbackMigration(backupKey)

    if (result.success) {
      setMigrationResult(null)
      setMigrationPlan(null)
      setMigrationError(null)
      onDataImported()
      handleCheckMigration()
    } else {
      setMigrationError(result.error || 'Rollback failed')
    }
  }, [onDataImported, handleCheckMigration])

  const handleDeleteBackup = useCallback((backupKey: string) => {
    const result = deleteMigrationBackup(backupKey)
    if (result.success) {
      setMigrationBackups(prev => prev.filter(key => key !== backupKey))
    }
  }, [])

  return (
    <div className="border-b border-gray-200 pb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
        <GitMerge className="w-4 h-4" />
        Storage Migration
      </h3>
      <p className="text-sm text-gray-500 mb-3">
        Migrate variety data from separate storage into allotment data. This consolidates your seed variety tracking.
      </p>

      {/* Check Migration Status Button */}
      <button
        onClick={handleCheckMigration}
        disabled={!data}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
      >
        <Info className="w-4 h-4" />
        Check Migration Status
      </button>

      {/* Migration Plan Display */}
      {migrationPlan && (
        <div className="mt-3 space-y-3">
          {!migrationPlan.needsMigration ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-sm text-green-700">No migration needed. All varieties are already in allotment storage.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Migration Plan</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>Varieties to merge: {migrationPlan.varietiesToMerge.length}</p>
                  <p>Duplicates found: {migrationPlan.duplicatesFound.length}</p>
                  <p>Total after migration: {migrationPlan.totalVarietiesAfterMigration}</p>
                </div>

                {migrationPlan.duplicatesFound.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p className="text-xs font-medium text-blue-800 mb-1">Duplicate Resolution:</p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      {migrationPlan.conflictResolution.slice(0, 3).map((resolution, idx) => (
                        <li key={idx}>
                          {resolution.plantId} - {resolution.normalizedName}: {resolution.reason}
                        </li>
                      ))}
                      {migrationPlan.conflictResolution.length > 3 && (
                        <li>... and {migrationPlan.conflictResolution.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Migrate Button */}
              <button
                onClick={handleMigrateStorage}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition w-full justify-center"
              >
                <GitMerge className="w-4 h-4" />
                Migrate Storage
              </button>
            </>
          )}
        </div>
      )}

      {/* Migration Result Display */}
      {migrationResult && migrationResult.success && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm font-medium text-green-700">Migration completed successfully!</p>
          </div>
          <div className="text-sm text-green-600 space-y-1">
            <p>Varieties merged: {migrationResult.varietiesMerged}</p>
            <p>Duplicates skipped: {migrationResult.duplicatesSkipped}</p>
            {migrationResult.backupKey && (
              <p className="text-xs mt-2">Backup created: {migrationResult.backupKey}</p>
            )}
          </div>
        </div>
      )}

      {/* Migration Error Display */}
      {migrationError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{migrationError}</p>
          </div>
        </div>
      )}

      {/* Migration Backups List */}
      {migrationBackups.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Migration Backups</h4>
          <div className="space-y-2">
            {migrationBackups.slice(0, 3).map(backupKey => {
              const metadata = getBackupMetadata(backupKey)
              return (
                <div key={backupKey} className="flex items-center justify-between text-xs">
                  <div className="flex-1">
                    <p className="text-gray-700 font-medium">{metadata?.date ? new Date(metadata.date).toLocaleString() : 'Unknown date'}</p>
                    <p className="text-gray-500">{backupKey}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRollbackMigration(backupKey)}
                      className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded transition"
                      title="Rollback to this backup"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backupKey)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete this backup"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
            {migrationBackups.length > 3 && (
              <p className="text-xs text-gray-500 text-center pt-2">
                ... and {migrationBackups.length - 3} more backups
              </p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Warning: These backups are kept indefinitely. Delete old backups to free up storage space.
          </p>
        </div>
      )}
    </div>
  )
}
