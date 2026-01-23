# Issue #8: Improve error handling and user feedback

## Title
Improve error handling and user feedback for export and backup failures

## Labels
- refactor
- error-handling
- user-experience
- import-export

## Priority
High

## Size
Medium (5-7 hours)

## Description

Error handling in the import/export flow is inconsistent and often silent. Export failures don't produce user feedback, pre-import backup failures are silently ignored, and error messages are not consistently displayed or contextualized. This leaves users unable to understand what went wrong and how to recover. Additionally, there's no mechanism to alert users when critical operations (like backup creation) fail, leading to false confidence that data is backed up when it actually isn't.

### Current Issues

1. **Silent export failures**: If export fails (e.g., due to storage quota exceeded), user sees no error
2. **Ignored backup failures**: Pre-import backup fails silently, user has no safety net
3. **Inconsistent error display**: Some errors go to console only, others to UI
4. **No error context**: When import fails, error messages don't explain why or what to do
5. **No user feedback during operations**: No indication that export/import is in progress
6. **Missing storage checks**: No check for localStorage quota before exporting
7. **No recovery suggestions**: When backup fails, user isn't told how to proceed safely

### Example Scenarios

Scenario 1: Export Failure
```
User: Clicks "Download Backup"
System: localStorage.setItem() fails due to quota exceeded
Current: User sees nothing, thinks backup succeeded
Expected: User sees "Storage quota exceeded. Please free up space and try again."
```

Scenario 2: Pre-Import Backup Failure
```
User: Clicks "Import"
System: createPreImportBackup() fails silently (logged to console)
System: Import proceeds anyway without safety net
Current: If import fails partway, no backup to recover from
Expected: User is warned "Couldn't create backup. Import may be risky."
```

Scenario 3: Validation Error
```
User: Imports backup from different device (slight schema difference)
System: Validation fails
Current: Error says "Invalid backup file: missing required fields"
Expected: Error says "Backup has missing data: 'layout.areas' field. This may be from an older version."
```

## Acceptance Criteria

1. All export operations show explicit success or error feedback
2. Pre-import backup failures are visible to user with recovery options
3. All import/export errors are clearly described (not just "failed")
4. Export operation has progress indication (for large datasets)
5. Storage quota is checked before export; user warned if nearly full
6. Failed imports do NOT proceed without user confirmation
7. Error messages include actionable recovery steps
8. All errors are logged with full context for debugging
9. User cannot accidentally proceed after a critical failure
10. Unit and e2e tests verify error paths and user feedback

## Implementation Details

### 1. Define Error Types and Messages

Create error handling strategy in `src/lib/import-export-errors.ts`:

```typescript
export type ImportExportErrorType =
  | 'validation-error'
  | 'storage-quota-exceeded'
  | 'backup-creation-failed'
  | 'file-read-failed'
  | 'invalid-json'
  | 'version-mismatch'
  | 'schema-validation-failed'
  | 'unknown-error'

export interface ImportExportError {
  type: ImportExportErrorType
  message: string
  context?: Record<string, unknown>
  recoverySteps?: string[]
  details?: string
}

export class ExportError extends Error {
  constructor(
    public type: ImportExportErrorType,
    message: string,
    public context?: Record<string, unknown>,
    public recoverySteps?: string[]
  ) {
    super(message)
    this.name = 'ExportError'
  }
}

export class ImportError extends Error {
  constructor(
    public type: ImportExportErrorType,
    message: string,
    public context?: Record<string, unknown>,
    public recoverySteps?: string[]
  ) {
    super(message)
    this.name = 'ImportError'
  }
}

// Error messages with recovery suggestions
export const ERROR_MESSAGES: Record<ImportExportErrorType, { message: string; recovery: string[] }> = {
  'validation-error': {
    message: 'Backup file format is invalid or corrupted.',
    recovery: [
      'Download a backup from an earlier date',
      'Check that the backup file hasn\'t been modified',
      'Try exporting fresh data and importing that instead',
    ],
  },
  'storage-quota-exceeded': {
    message: 'Storage quota exceeded. Cannot save backup.',
    recovery: [
      'Clear browser cache and storage for this site',
      'Remove old pre-import backups (look for keys like "allotment-unified-data-pre-import-*")',
      'Try exporting to a file on your computer instead of storing in browser',
    ],
  },
  'backup-creation-failed': {
    message: 'Failed to create safety backup before import.',
    recovery: [
      'Ensure localStorage is available',
      'Try again with less data loaded',
      'If persistent, contact support',
    ],
  },
  'file-read-failed': {
    message: 'Unable to read backup file.',
    recovery: [
      'Check that the file is readable',
      'Try a different backup file',
      'If file is corrupted, use an older backup',
    ],
  },
  'invalid-json': {
    message: 'Backup file is not valid JSON.',
    recovery: [
      'Verify the file is a .json backup file',
      'Check that the file hasn\'t been modified',
      'Try downloading and importing a fresh backup',
    ],
  },
  'version-mismatch': {
    message: 'Backup is from a newer app version.',
    recovery: [
      'Update this app to the latest version',
      'Or find a backup from an older version',
    ],
  },
  'schema-validation-failed': {
    message: 'Backup file has missing or invalid data fields.',
    recovery: [
      'This backup may be from a different app',
      'Try a more recent backup file',
      'Check that the file hasn\'t been manually edited',
    ],
  },
  'unknown-error': {
    message: 'An unexpected error occurred.',
    recovery: [
      'Try again',
      'Check the browser console for error details',
      'If problem persists, contact support',
    ],
  },
}
```

### 2. Update Export Function with Error Handling

In `src/components/allotment/DataManagement.tsx`:

```typescript
interface ExportState {
  isExporting: boolean
  exportError: ImportExportError | null
  exportSuccess: boolean
  storageQuotaWarning?: boolean
}

const checkStorageQuota = (): { available: boolean; percentUsed: number; warning: boolean } => {
  if (typeof window === 'undefined' || !navigator.storage) {
    return { available: true, percentUsed: 0, warning: false }
  }

  try {
    // Estimate current usage
    const allKeys = Object.keys(localStorage)
    let totalSize = 0
    allKeys.forEach(key => {
      const item = localStorage.getItem(key)
      if (item) {
        totalSize += item.length * 2 // Rough estimate (UTF-16 encoding)
      }
    })

    // Typical quota: 5-10MB = 5242880-10485760 bytes
    const estimatedQuota = 5242880 // 5MB conservative estimate
    const percentUsed = (totalSize / estimatedQuota) * 100

    return {
      available: percentUsed < 90,
      percentUsed,
      warning: percentUsed > 70,
    }
  } catch (error) {
    console.warn('Could not check storage quota:', error)
    return { available: true, percentUsed: 0, warning: false }
  }
}

const handleExport = useCallback(() => {
  if (!data) return

  setExportState({ isExporting: true, exportError: null, exportSuccess: false })

  try {
    // Check quota before exporting
    const quotaCheck = checkStorageQuota()
    if (!quotaCheck.available) {
      throw new ExportError(
        'storage-quota-exceeded',
        ERROR_MESSAGES['storage-quota-exceeded'].message,
        { percentUsed: quotaCheck.percentUsed },
        ERROR_MESSAGES['storage-quota-exceeded'].recovery
      )
    }

    if (quotaCheck.warning) {
      setExportState(prev => ({ ...prev, storageQuotaWarning: true }))
      // Show warning but continue - user can still export to file
      console.warn(`Storage usage at ${quotaCheck.percentUsed.toFixed(1)}%`)
    }

    // Load varieties data
    let varieties: VarietyData
    try {
      const varietyResult = loadVarietyData()
      varieties = varietyResult.success && varietyResult.data ? varietyResult.data : {
        version: 2,
        varieties: [],
        meta: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      throw new ExportError(
        'validation-error',
        'Failed to export varieties data',
        { error: String(error) },
        ERROR_MESSAGES['validation-error'].recovery
      )
    }

    // Load compost data
    let compost: CompostData | undefined
    try {
      const compostResult = loadCompostData()
      compost = compostResult.success && compostResult.data ? compostResult.data : undefined
    } catch (error) {
      console.warn('Failed to load compost data for export:', error)
      // Don't fail export just because compost failed - it's optional
    }

    // Create export data
    const exportData: CompleteExport = {
      allotment: data,
      varieties,
      compost,
      exportedAt: new Date().toISOString(),
      exportVersion: CURRENT_SCHEMA_VERSION,
    }

    // Generate and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    if (blob.size > 10 * 1024 * 1024) {
      console.warn(`Large export: ${(blob.size / 1024 / 1024).toFixed(1)}MB`)
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `allotment-backup-${new Date().toISOString().split('T')[0]}.json`

    try {
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportState({
        isExporting: false,
        exportError: null,
        exportSuccess: true,
        storageQuotaWarning: quotaCheck.warning,
      })

      // Clear success message after 3 seconds
      setTimeout(() => {
        setExportState(prev => ({ ...prev, exportSuccess: false }))
      }, 3000)
    } catch (error) {
      throw new ExportError(
        'unknown-error',
        'Failed to download backup file',
        { error: String(error) },
        ['Check browser download settings', 'Try again']
      )
    }
  } catch (error) {
    const exportError = error instanceof ExportError
      ? error
      : new ExportError(
          'unknown-error',
          ERROR_MESSAGES['unknown-error'].message,
          { error: String(error) },
          ERROR_MESSAGES['unknown-error'].recovery
        )

    setExportState({
      isExporting: false,
      exportError,
      exportSuccess: false,
    })

    // Log full error for debugging
    console.error('Export failed:', {
      type: exportError.type,
      message: exportError.message,
      context: exportError.context,
      stack: exportError.stack,
    })
  }
}, [data])
```

### 3. Update Pre-Import Backup with Better Error Handling

```typescript
interface BackupResult {
  success: boolean
  backupKey?: string
  error?: ImportExportError
}

function createPreImportBackup(): BackupResult {
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: new ImportError(
        'backup-creation-failed',
        'Cannot create backup in non-browser environment',
        {},
        ['This operation requires a browser with localStorage']
      )
    }
  }

  try {
    const result = loadAllotmentData()
    if (!result.success || !result.data) {
      return {
        success: false,
        error: new ImportError(
          'backup-creation-failed',
          'No existing data to back up',
          {},
          ['Create some allotment data first']
        )
      }
    }

    const backupKey = `${STORAGE_KEY}-pre-import-${Date.now()}`

    try {
      const varietyResult = loadVarietyData()
      const variety = varietyResult.success ? varietyResult.data : null

      const compostResult = loadCompostData()
      const compost = compostResult.success ? compostResult.data : null

      const backupData: CompleteExport = {
        allotment: result.data,
        varieties: variety || { version: 2, varieties: [], meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
        compost,
        exportedAt: new Date().toISOString(),
        exportVersion: result.data.version,
      }

      localStorage.setItem(backupKey, JSON.stringify(backupData))

      console.log(`Created pre-import backup: ${backupKey}`)
      return { success: true, backupKey }
    } catch (storageError) {
      return {
        success: false,
        error: new ImportError(
          'storage-quota-exceeded',
          'Storage quota exceeded when creating backup',
          { error: String(storageError) },
          ERROR_MESSAGES['storage-quota-exceeded'].recovery
        )
      }
    }
  } catch (error) {
    return {
      success: false,
      error: new ImportError(
        'backup-creation-failed',
        'Failed to create pre-import backup',
        { error: String(error) },
        ERROR_MESSAGES['backup-creation-failed'].recovery
      )
    }
  }
}
```

### 4. Update Import Function

```typescript
const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file) return

  setImportState({
    isImporting: true,
    importError: null,
    importSuccess: false,
    shouldReload: false,
  })

  const reader = new FileReader()

  reader.onerror = () => {
    const error = new ImportError(
      'file-read-failed',
      'Failed to read backup file',
      { fileName: file.name },
      ERROR_MESSAGES['file-read-failed'].recovery
    )
    setImportError(error)
    setImportState(prev => ({ ...prev, isImporting: false }))
  }

  reader.onload = (e) => {
    try {
      // Create backup of existing data before import
      const backupResult = createPreImportBackup()
      if (!backupResult.success) {
        // Backup failed - warn user but let them continue
        console.warn('Pre-import backup failed:', backupResult.error)
        setImportWarning(`Warning: ${backupResult.error?.message}`)

        // User must confirm they want to continue without backup
        const confirmContinue = window.confirm(
          `${backupResult.error?.message}\n\nDo you want to continue importing without a backup?`
        )
        if (!confirmContinue) {
          setImportState(prev => ({ ...prev, isImporting: false }))
          return
        }
      }

      // Flush pending saves
      flushSave()

      const content = e.target?.result as string
      let parsed: unknown

      try {
        parsed = JSON.parse(content)
      } catch (parseError) {
        throw new ImportError(
          'invalid-json',
          'Backup file is not valid JSON',
          { error: String(parseError) },
          ERROR_MESSAGES['invalid-json'].recovery
        )
      }

      let allotmentData: AllotmentData
      let varietyData: VarietyData | null = null
      let compostData: CompostData | null = null

      // Parse and validate
      if (parsed && typeof parsed === 'object' && 'allotment' in parsed) {
        const complete = parsed as CompleteExport
        allotmentData = complete.allotment
        varietyData = complete.varieties ?? null
        compostData = complete.compost ?? null

        // Version check
        if (allotmentData.version > CURRENT_SCHEMA_VERSION) {
          throw new ImportError(
            'version-mismatch',
            `Backup is from version ${allotmentData.version}, app is version ${CURRENT_SCHEMA_VERSION}`,
            { backupVersion: allotmentData.version, appVersion: CURRENT_SCHEMA_VERSION },
            ERROR_MESSAGES['version-mismatch'].recovery
          )
        }
      } else {
        allotmentData = parsed as AllotmentData

        // Detailed schema validation
        const validation = validateAllotmentData(allotmentData)
        if (!validation.valid) {
          throw new ImportError(
            'schema-validation-failed',
            `Invalid backup structure: ${validation.errors[0] ?? 'unknown error'}`,
            { allErrors: validation.errors },
            ERROR_MESSAGES['schema-validation-failed'].recovery
          )
        }

        // Version check
        if (allotmentData.version > CURRENT_SCHEMA_VERSION) {
          throw new ImportError(
            'version-mismatch',
            `Backup is from version ${allotmentData.version}, app is version ${CURRENT_SCHEMA_VERSION}`,
            { backupVersion: allotmentData.version, appVersion: CURRENT_SCHEMA_VERSION },
            ERROR_MESSAGES['version-mismatch'].recovery
          )
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

      // Save data
      const saveResult = saveAllotmentData(finalAllotmentData)
      if (!saveResult.success) {
        throw new ImportError(
          'unknown-error',
          'Failed to save imported data',
          { error: saveResult.error },
          ['Try again', 'Check browser storage']
        )
      }

      // Save optional data
      if (varietyData) {
        const varietySaveResult = saveVarietyData(varietyData)
        if (!varietySaveResult.success) {
          console.warn('Failed to save varieties:', varietySaveResult.error)
        }
      }

      if (compostData) {
        const compostSaveResult = saveCompostData(compostData)
        if (!compostSaveResult.success) {
          console.warn('Failed to save compost data:', compostSaveResult.error)
        }
      }

      // Generate preview
      const preview = generateImportPreview(finalAllotmentData, varietyData, compostData)

      setImportSuccess(preview)
      setImportState(prev => ({ ...prev, isImporting: false }))

      // Notify parent
      onDataImported?.()

      // Log successful import
      console.log('Import completed successfully', {
        areasCount: preview.areasCount,
        plantingsCount: preview.plantingsCount,
        yearsSpanned: preview.yearsSpanned,
      })
    } catch (error) {
      const importError = error instanceof ImportError
        ? error
        : new ImportError(
            'unknown-error',
            ERROR_MESSAGES['unknown-error'].message,
            { error: String(error) },
            ERROR_MESSAGES['unknown-error'].recovery
          )

      setImportError(importError)
      setImportState(prev => ({ ...prev, isImporting: false }))

      // Log detailed error for debugging
      console.error('Import failed:', {
        type: importError.type,
        message: importError.message,
        context: importError.context,
        stack: importError.stack,
      })
    }
  }

  reader.readAsText(file)
}, [flushSave, onDataImported])
```

### 5. Render Error UI

Add comprehensive error display in the dialog:

```typescript
{importState.importError && (
  <div className="space-y-4">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Import Failed</h3>
          <p className="text-sm text-red-700 mt-1">{importState.importError.message}</p>

          {importState.importError.details && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-red-600 underline">Details</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-40">
                {importState.importError.details}
              </pre>
            </details>
          )}

          {importState.importError.recoverySteps && (
            <div className="mt-3">
              <p className="font-semibold text-red-800 text-sm">Try this:</p>
              <ul className="list-disc list-inside mt-1 text-sm text-red-700 space-y-1">
                {importState.importError.recoverySteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="flex gap-3 justify-end">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
      >
        Try Another File
      </button>
      <button
        onClick={() => setIsOpen(false)}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

## Files to Modify

1. `src/components/allotment/DataManagement.tsx` - Main error handling implementation
2. `src/lib/import-export-errors.ts` - New file for error types and messages
3. `src/types/unified-allotment.ts` - Optional: import/export error types
4. `src/services/compost-storage.ts` - Ensure error handling, add `saveCompostData` if missing
5. `src/services/variety-storage.ts` - Ensure error handling, add `saveVarietyData` if missing

## Testing Requirements

### Unit Tests

1. Test checkStorageQuota calculations
2. Test error type classification
3. Test error message formatting with recovery steps
4. Test backup creation failure scenarios
5. Test validation error messages with details
6. Test storage quota exceeded detection

### E2E Tests

1. Test export with success feedback
2. Test export with storage quota warning
3. Test import with backup creation failure (show confirmation dialog)
4. Test import with invalid JSON (show specific error message)
5. Test import with version mismatch (show upgrade suggestion)
6. Test import with missing fields (show recovery steps)
7. Test file read error (show retry button)
8. Test recovery suggestions are actionable

### Manual Testing

1. Export data - should show success message with file name
2. Open DevTools storage - manually delete backup to simulate quota
3. Try exporting again - should show quota warning
4. Try importing corrupted JSON - should show specific error with recovery steps
5. Try importing from future app version - should suggest update
6. Try importing with missing fields - should explain problem clearly

## Dependencies

- Issue #5: Flush mechanism (for preventing overwrites during import)
- Issue #6: Compost export (for complete error handling)
- Issue #7: Import verification (for preview and confirmation flow)

## Related Issues

- Issue #5: Implement flush mechanism
- Issue #6: Add compost data to exports
- Issue #7: Fix import race conditions

## Notes

- Error messages should be user-friendly, not technical
- Always provide recovery steps, not just "failed"
- Log full technical details for developers while showing simplified messages to users
- Never silently fail - always give feedback
- Quota warnings are informational, not blocking

## Additional Context

This issue makes import/export a first-class user experience concern. Users need to know:
1. When operations succeed (visual feedback)
2. When operations fail (clear error messages)
3. Why they failed (specific, helpful messages)
4. How to recover (actionable steps)

The error types defined here should be reusable across the application for any import/export operations in the future.
