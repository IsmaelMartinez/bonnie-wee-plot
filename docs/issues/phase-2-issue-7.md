# Issue #7: Fix import race conditions and verification

## Title
Fix import race conditions and add verification step before dialog closes

## Labels
- refactor
- data-integrity
- import-export
- race-condition

## Priority
High

## Size
Medium (6-8 hours)

## Description

The import flow has a critical race condition where the dialog closes and reload happens before the user can see import errors or verify the operation completed successfully. If an import fails partway through, the error message is displayed but immediately disappears when the dialog closes or page reloads, making debugging impossible. Additionally, there's no way for the user to verify that the imported data is actually what they expected before the reload completes.

### Current Behavior

1. User selects backup file to import
2. File is parsed and validated (or fails validation)
3. Error message is shown in the dialog
4. Dialog closes (either automatically after success, or triggered manually after error)
5. If reload happens, errors become invisible
6. User doesn't know if import succeeded or what went wrong
7. If import partially succeeded, user has corrupted data

### Race Condition Timeline

```
t=0ms   - User clicks import
t=10ms  - File parsed, data validated
t=20ms  - Error detected (e.g., version mismatch, invalid schema)
t=30ms  - Error message displayed
t=50ms  - Dialog closes or user clicks OK
t=60ms  - Page reload triggered (loses browser console logs)
t=100ms - User sees fresh page, doesn't know import failed or what's wrong
```

### Root Cause

1. **No verification step** - Dialog closes immediately after successful import
2. **No error persistence** - Errors are shown in UI but not persisted
3. **Automatic reload** - Dialog triggers reload which clears browser console and errors
4. **No user confirmation** - User can't review what will be imported before committing

### Impact

- Silent import failures (user doesn't realize data wasn't imported)
- Mysterious data inconsistencies after partial failures
- No way to debug import problems (console cleared by reload)
- Users lose trust in import/export feature
- No recovery path if import partially succeeds
- Violations of data integrity expectations

## Acceptance Criteria

1. Import errors are persisted and visible to the user
2. Dialog does NOT auto-close on success - user must review or confirm
3. Dialog does NOT close on error - user can read full error message
4. Page reload happens ONLY after user confirms import succeeded
5. Failed imports do NOT reload page (preserving console and error context)
6. Optional: Add preview step showing what will be imported
7. Optional: Add checksum/integrity verification after import completes
8. Unit and e2e tests verify error handling and dialog behavior

## Implementation Details

### 1. Update Import Error Handling

In `src/components/allotment/DataManagement.tsx`:

Define error states with persistence:

```typescript
interface ImportState {
  isImporting: boolean
  importError: string | null
  importSuccess: boolean
  importedDataPreview?: {
    areasCount: number
    plantingsCount: number
    varietiesCount: number
    compostPilesCount?: number
    yearsSpanned: string
  }
  shouldReload: boolean
}

export default function DataManagement({ data, onDataImported }: DataManagementProps) {
  const [importState, setImportState] = useState<ImportState>({
    isImporting: false,
    importError: null,
    importSuccess: false,
    shouldReload: false,
  })

  // Track import errors with context
  const setImportError = useCallback((error: string | null) => {
    setImportState(prev => ({
      ...prev,
      importError: error,
      importSuccess: false,
    }))
  }, [])

  const setImportSuccess = useCallback((preview: ImportState['importedDataPreview']) => {
    setImportState(prev => ({
      ...prev,
      importSuccess: true,
      importError: null,
      importedDataPreview: preview,
      shouldReload: false,  // Don't auto-reload yet
    }))
  }, [])
}
```

### 2. Add Verification Step After Import

Add dialog content to show imported data preview:

```typescript
{importState.importSuccess && !importState.shouldReload && (
  <div className="space-y-4">
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-green-900">Import Successful</h3>
          <p className="text-sm text-green-700 mt-1">
            Preview of imported data:
          </p>
        </div>
      </div>
    </div>

    {/* Import Preview */}
    {importState.importedDataPreview && (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-semibold text-sm mb-3">Imported Data</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>Areas: {importState.importedDataPreview.areasCount}</li>
          <li>Plantings: {importState.importedDataPreview.plantingsCount}</li>
          <li>Varieties: {importState.importedDataPreview.varietiesCount}</li>
          {importState.importedDataPreview.compostPilesCount !== undefined && (
            <li>Compost Piles: {importState.importedDataPreview.compostPilesCount}</li>
          )}
          <li>Seasons: {importState.importedDataPreview.yearsSpanned}</li>
        </ul>
      </div>
    )}

    <p className="text-sm text-gray-600">
      Please review the imported data. The page will reload to apply changes.
    </p>

    <div className="flex gap-3 justify-end">
      <button
        onClick={() => {
          setImportState(prev => ({ ...prev, shouldReload: true }))
        }}
        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
      >
        Reload Page
      </button>
      <button
        onClick={() => {
          setImportState({
            isImporting: false,
            importError: null,
            importSuccess: false,
            shouldReload: false,
          })
          setIsOpen(false)
        }}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

### 3. Prevent Auto-Reload

Currently the code does:
```typescript
window.location.reload()  // Immediate reload
```

Change to:
```typescript
// Only reload if user confirms
if (importState.shouldReload) {
  window.location.reload()
}
```

Or use a separate confirmation step:
```typescript
const handleConfirmReload = useCallback(() => {
  try {
    // Optional: Verify imported data before reload
    const verification = verifyImportedData()
    if (!verification.valid) {
      setImportError(`Data verification failed: ${verification.errors.join(', ')}`)
      return
    }
    window.location.reload()
  } catch (error) {
    setImportError('Failed to verify imported data')
    console.error(error)
  }
}, [])
```

### 4. Add Import Preview Generation

Extract data preview from imported file:

```typescript
function generateImportPreview(allotmentData: AllotmentData, varietyData?: VarietyData, compostData?: CompostData): ImportState['importedDataPreview'] {
  // Count areas (beds, permanent, infrastructure)
  const areasCount = allotmentData.layout.areas?.length ?? 0

  // Count all plantings across all years
  let plantingsCount = 0
  allotmentData.seasons.forEach(season => {
    season.areaSeason.forEach(areaSeason => {
      plantingsCount += areaSeason.plantings.length
    })
  })

  // Count varieties
  const varietiesCount = varietyData?.varieties.length ?? allotmentData.varieties.length ?? 0

  // Count compost piles
  const compostPilesCount = compostData?.piles.length ?? 0

  // Years spanned
  const years = allotmentData.seasons.map(s => s.year)
  const yearsSpanned = years.length > 0
    ? `${Math.min(...years)}-${Math.max(...years)}`
    : 'None'

  return {
    areasCount,
    plantingsCount,
    varietiesCount,
    compostPilesCount,
    yearsSpanned,
  }
}
```

### 5. Improve Error Messaging

Show specific error types:

```typescript
const getErrorDetails = (error: unknown): string => {
  if (error instanceof SyntaxError) {
    return 'Invalid JSON format in backup file. The file may be corrupted.'
  }
  if (error instanceof TypeError) {
    return 'Backup file has wrong data structure. The file may be from a different application.'
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred during import. Please check the console.'
}
```

### 6. Add Data Integrity Verification (Optional)

After import, optionally verify data integrity:

```typescript
function verifyImportedData(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const result = loadAllotmentData()
  if (!result.success || !result.data) {
    return { valid: false, errors: ['Failed to load imported data'] }
  }

  const data = result.data

  // Check basic structure
  if (!data.seasons || !Array.isArray(data.seasons)) {
    errors.push('Missing or invalid seasons array')
  }

  if (!data.layout || !data.layout.areas) {
    errors.push('Missing or invalid layout')
  }

  // Check for orphaned plantings (plantings referencing non-existent areas)
  const areaIds = new Set(data.layout.areas?.map(a => a.id) ?? [])
  data.seasons.forEach((season, yearIdx) => {
    season.areaSeason.forEach((areaSeason, areaIdx) => {
      if (!areaIds.has(areaSeason.areaId)) {
        errors.push(`Year ${season.year}: plantings referencing non-existent area ${areaSeason.areaId}`)
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

## Files to Modify

1. `src/components/allotment/DataManagement.tsx` - Main changes:
   - Add ImportState interface
   - Remove auto-reload
   - Add preview generation
   - Improve error messages
   - Add confirmation step for reload

2. `src/types/unified-allotment.ts` - Optional:
   - Add ImportPreview interface for type safety

## Testing Requirements

### Unit Tests

1. Test preview generation with various data sizes
2. Test error message formatting
3. Test data verification logic
4. Test backward compatibility (old format imports)

### E2E Tests

1. Test successful import with preview display:
   - Import backup file
   - Verify preview shows correct counts
   - Click reload and verify data loaded

2. Test error handling:
   - Try importing malformed JSON
   - Try importing wrong format
   - Verify error message visible
   - Verify dialog doesn't auto-close

3. Test canceled import:
   - Start import, see preview
   - Click cancel/close dialog
   - Verify no reload happens
   - Verify original data unchanged

4. Test race condition prevention:
   - Add changes that trigger debounce
   - Start import immediately
   - Verify neither overwrites the other

### Manual Testing

1. Export a backup file
2. Delete part of the JSON (corrupt it)
3. Try importing - should show specific error
4. Error should remain visible until you close dialog
5. Page should not reload on import failure
6. On successful import, preview should show before reload

## Dependencies

- Issue #5: Flush mechanism (prevents debounce race condition)
- Issue #6: Compost export (for complete preview)

## Related Issues

- Issue #5: Implement flush mechanism
- Issue #6: Add compost data to exports
- Issue #8: Improve error handling

## Notes

- Do NOT auto-reload on success - user must confirm
- Do NOT close dialog on error - user must read message
- Preserve all error context for debugging
- Be specific about what failed and why
- Consider UX when user imports huge files (show loading state)

## Additional Context

The import dialog is in `src/components/allotment/DataManagement.tsx`. The current flow closes immediately, losing context. This issue focuses on preventing that race condition and ensuring users can review/confirm before the page reloads.

Data preview should be informative but not overwhelming. Show only the most important counts. This gives users confidence that the right data is being imported without showing raw JSON.

The verification step is optional but recommended for complex data like allotments with many interrelated pieces.
