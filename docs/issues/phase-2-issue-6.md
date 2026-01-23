# Issue #6: Add compost data to CompleteExport interface

## Title
Add compost data to CompleteExport interface for complete backup preservation

## Labels
- refactor
- data-integrity
- import-export
- compost-tracker

## Priority
High

## Size
Medium (4-6 hours)

## Description

The `CompleteExport` interface used for backup files currently only includes allotment data and varieties, but excludes compost tracking data. This causes data loss when users export backups because any compost piles, inputs, and events are not included in the export file. While users can still access compost data from localStorage directly, it's not preserved in intentional backups and creates inconsistency in what constitutes a "complete" export.

### Current Behavior

1. User has allotment data, varieties, AND compost data in localStorage
2. User exports backup via "Download Backup"
3. Export file includes only:
   - `allotment`: AllotmentData (v11 schema)
   - `varieties`: VarietyData (v2 schema)
   - `exportedAt`: timestamp
   - `exportVersion`: schema version
4. Compost data is NOT included in export file
5. If user restores backup, compost data is lost (reverts to whatever was previously in localStorage)

### Storage Architecture

The app stores three separate data structures in localStorage:

1. **`allotment-unified-data`** - AllotmentData (v11)
2. **`community-allotment-varieties`** - VarietyData (v2)
3. **`compost-data`** - CompostData (v1) ← Currently not exported

Each has its own storage key and schema version. Compost data is fully independent and should be treated as first-class data in backups.

### Impact

- Compost data is not preserved in backups
- Users lose composting history when restoring from backup
- Inconsistency: "Complete Export" doesn't export complete data
- Users must manually backup compost data separately
- Replication/sync workflows are incomplete without compost data

## Acceptance Criteria

1. `CompleteExport` interface includes `compost: CompostData` field
2. Export function collects compost data and includes it in backup file
3. Import function accepts and restores compost data from backup
4. Backward compatibility: old exports without compost data still import successfully
5. Compost data schema version is included in export metadata
6. Pre-import backup includes compost data (for disaster recovery)
7. All existing export files work correctly
8. Unit and e2e tests verify compost data round-trips correctly

## Implementation Details

### 1. Update CompleteExport Interface

In `src/types/unified-allotment.ts`:

```typescript
/**
 * Complete export format for backup files.
 * Combines allotment data with separate storage for compatibility
 * with old (AllotmentData only) and new export formats.
 */
export interface CompleteExport {
  allotment: AllotmentData
  varieties: import('./variety-data').VarietyData
  compost?: import('./compost').CompostData  // NEW: optional for backward compatibility
  exportedAt: string
  exportVersion: number
  // Optional: metadata about what's included
  exportedData: {
    hasCompost: boolean
    compostSchemaVersion?: number
  }
}
```

### 2. Update Export Logic

In `src/components/allotment/DataManagement.tsx`:

```typescript
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

    // NEW: Load compost data
    const compostResult = loadCompostData()
    const compost = compostResult.success && compostResult.data ? compostResult.data : undefined

    const exportData: CompleteExport = {
      allotment: data,
      varieties,
      compost,  // NEW
      exportedAt: new Date().toISOString(),
      exportVersion: CURRENT_SCHEMA_VERSION,
      // NEW: metadata about what's included
      exportedData: {
        hasCompost: !!compost,
        compostSchemaVersion: compost?.version,
      }
    }

    // ... rest of export logic
  } catch (error) {
    console.error('Export failed:', error)
    setExportError('Failed to export backup. Please try again.')
  }
}, [data])
```

### 3. Update Import Logic

In `src/components/allotment/DataManagement.tsx`:

```typescript
const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
  // ... existing flush and validation logic

  try {
    const content = e.target?.result as string
    const parsed = JSON.parse(content)

    let allotmentData: AllotmentData
    let varietyData: VarietyData | null = null
    let compostData: CompostData | null = null  // NEW

    // Check if this is the new format (has allotment + varieties + optional compost)
    if (parsed.allotment && parsed.varieties) {
      const complete = parsed as CompleteExport
      allotmentData = complete.allotment
      varietyData = complete.varieties
      compostData = complete.compost ?? null  // NEW: extract compost if present

      // ... existing validation logic
    } else {
      // Old format - just AllotmentData
      allotmentData = parsed as AllotmentData
    }

    // Update timestamps
    const finalAllotmentData: AllotmentData = {
      ...allotmentData,
      meta: {
        ...allotmentData.meta,
        updatedAt: new Date().toISOString(),
      }
    }

    // Save allotment data
    saveAllotmentData(finalAllotmentData)

    // NEW: Save compost data if present
    if (compostData) {
      saveCompostData(compostData)
    }

    // ... rest of import logic
  } catch (error) {
    console.error('Import failed:', error)
    setImportError('Failed to import backup. Please check the file and try again.')
  }
}, [])
```

### 4. Update Pre-Import Backup

In `src/components/allotment/DataManagement.tsx`:

```typescript
/**
 * Create a backup of current data before import
 * This is a safety measure to prevent accidental data loss
 */
function createPreImportBackup(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const result = loadAllotmentData()
    if (!result.success || !result.data) return false

    // NEW: Also backup compost data
    const compostResult = loadCompostData()
    const compostData = compostResult.success ? compostResult.data : null

    const varietyResult = loadVarietyData()
    const varietyData = varietyResult.success ? varietyResult.data : null

    const backupKey = `${STORAGE_KEY}-pre-import-${Date.now()}`
    const backupData: CompleteExport = {
      allotment: result.data,
      varieties: varietyData || { version: 2, varieties: [], meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      compost: compostData || undefined,
      exportedAt: new Date().toISOString(),
      exportVersion: result.data.version,
    }

    localStorage.setItem(backupKey, JSON.stringify(backupData))
    console.log(`Created pre-import backup: ${backupKey}`)
    return true
  } catch (error) {
    console.error('Failed to create pre-import backup:', error)
    return false
  }
}
```

### 5. Import Compost Service Functions

Import or verify these functions exist in `src/services/compost-storage.ts`:
- `loadCompostData()` - Load from localStorage
- `saveCompostData(data: CompostData)` - Save to localStorage
- `CompostData` type from `src/types/compost.ts`

If these don't exist, they must be created following the pattern of allotment-storage.ts.

### Backward Compatibility Strategy

Old export files (without compost field) must still import correctly:

1. When importing, check if `compost` field exists
2. If missing, treat as null and skip compost import
3. Existing compost data in localStorage is preserved
4. Log warning when importing old format: "This backup doesn't include compost data"
5. Offer user option to keep existing compost data or clear it

## Files to Modify

1. `src/types/unified-allotment.ts` - Update CompleteExport interface
2. `src/components/allotment/DataManagement.tsx` - Update export, import, pre-import backup
3. `src/services/compost-storage.ts` - Ensure load/save functions exist and are exported
4. `src/types/compost.ts` - Verify CompostData is properly exported

## Testing Requirements

### Unit Tests

1. Test CompleteExport type includes compost field
2. Test export with compost data present
3. Test export with no compost data (should have undefined or null)
4. Test import with compost data (round-trip)
5. Test import without compost data (backward compatibility)
6. Test pre-import backup includes compost data

### E2E Tests

1. Create compost data (add pile, inputs, events)
2. Export backup
3. Verify backup file contains compost data in JSON
4. Clear all storage
5. Import backup
6. Verify compost data is restored correctly
7. Verify compost counts, piles, inputs match original

### Backward Compatibility Tests

1. Create old-format export (without compost field) manually
2. Try importing
3. Verify import succeeds
4. Verify warning message shown
5. Verify existing compost data preserved (if any)

## Files to Verify Exist

- `src/services/compost-storage.ts` - Compost storage functions
- `src/types/compost.ts` - CompostData type definition
- `src/hooks/useCompost.ts` - Compost state management hook

## Dependencies

- `useAllotment` hook (for consistency pattern)
- `useCompost` hook (for compost state)
- Existing import/export infrastructure
- Issue #5: Flush mechanism (should complete first)

## Related Issues

- Issue #5: Implement flush mechanism (related: both improve import reliability)
- Issue #7: Fix import race conditions
- Issue #8: Improve error handling

## Notes

- Compost data should be treated as equally important as allotment data
- Schema versioning is important for future migrations
- Pre-import backups are the safety net for data loss prevention
- Users expect "complete export" to mean all their data

## Additional Context

CompostData structure (from `src/types/compost.ts`):
- `version`: number (currently 1)
- `piles`: CompostPile[] (contains id, name, systemType, status, startDate, inputs, events)
- `createdAt`: ISO string
- `updatedAt`: ISO string

Storage key: `compost-data` (from COMPOST_STORAGE_KEY constant)

The compost tracker is a planned feature that users store separately. By including it in exports, we provide a better user experience for data portability and disaster recovery.
