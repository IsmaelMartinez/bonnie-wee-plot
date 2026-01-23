# Issue #5: Implement flush mechanism for debounced saves

## Title
Implement flush mechanism for debounced saves to prevent import overwrites

## Labels
- refactor
- data-integrity
- import-export
- debouncing

## Priority
High

## Size
Medium (4-8 hours)

## Description

The import flow currently has a critical race condition: user imports can be overwritten by pending debounced saves that haven't been flushed before the import occurs. When a user has unsaved changes pending in the debounce buffer, starting an import operation will save the old data on top of the newly imported data, causing data loss.

### Current Behavior

1. User makes changes to their allotment (e.g., adds a planting)
2. Changes are queued in the debounce buffer (not yet persisted to localStorage)
3. User initiates import before debounce timer fires (< 1 second delay)
4. Import dialog loads and parses the backup file
5. Debounce timer fires and calls `saveAllotmentData()` with the old data
6. Old data overwrites the just-imported data in localStorage
7. Import succeeds but the imported data is immediately overwritten

### Root Cause

The `usePersistedStorage` hook implements debounced saves (currently ~1 second delay) but the import flow in `DataManagement.tsx` does not flush pending saves before importing. The `flushSave()` function exists but is never called in the import path.

### Impact

- Data loss when users import backup files while having pending changes
- No visible error or warning to the user
- Imported data is silently overwritten
- Users cannot reliably recover from backups if they have unsaved work

## Acceptance Criteria

1. The import flow must call `flushSave()` before initiating import
2. All pending debounced saves must be persisted before import proceeds
3. Import should not proceed until flush completes successfully
4. No data loss occurs when importing with pending changes
5. Flush operation must have timeout protection (prevent indefinite waiting)
6. Error handling: if flush fails, import is blocked with user-friendly message
7. Unit and e2e tests verify flush occurs before import

## Implementation Details

### Changes Required

#### 1. DataManagement.tsx

Add flush mechanism to import flow:
- Call `flushSave()` before starting file parsing
- Wrap flush in error handling
- Block import if flush fails
- Add user feedback during flush (optional: show "Syncing..." message)

```typescript
const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file) return

  setImportError(null)
  setImportSuccess(false)

  // NEW: Flush pending saves before import
  const flushSuccess = await new Promise<boolean>((resolve) => {
    flushSave()
    // Give flush a brief moment to complete (typically < 100ms)
    setTimeout(() => resolve(true), 100)
  })

  if (!flushSuccess) {
    setImportError('Failed to sync pending changes. Please try again.')
    return
  }

  // ... continue with existing import logic
}, [flushSave])
```

#### 2. useAllotment.ts Hook

Expose flush mechanism to components:
- Ensure `flushSave` is exported from the hook's return type (already done)
- Pass to DataManagement component (already done)
- Document when flush should be called

#### 3. Types: Define import options

Add configuration for import behavior in `src/types/unified-allotment.ts`:
```typescript
interface ImportOptions {
  flushPendingSaves: boolean  // Default: true
  createPreImportBackup: boolean  // Default: true
  confirmBeforeImport: boolean  // Default: true
}
```

### Race Condition Prevention

The flush mechanism prevents the race condition by:
1. Immediately calling `flushSave()` when import starts
2. Waiting briefly for debounce timer to fire (if it hasn't already)
3. Blocking import dialog from proceeding until flush completes
4. Ensuring imported data is written to clean state with no pending overwrites

### Error Handling

If flush fails:
- Display user-friendly error message
- Allow user to retry import
- Do not proceed with import
- Log error for debugging

## Files to Modify

1. `src/components/allotment/DataManagement.tsx` - Add flush call before import
2. `src/hooks/useAllotment.ts` - Ensure `flushSave` remains exported
3. `src/types/unified-allotment.ts` - Add `ImportOptions` interface (optional, for future flexibility)

## Testing Requirements

### Unit Tests (`src/__tests__/hooks/`)

1. Test that `flushSave` is callable from useAllotment hook
2. Test that pending changes are persisted by `flushSave()`
3. Test that debounce buffer is cleared after flush

### E2E Tests (`tests/`)

1. Test import with pending changes:
   - Make unsaved changes
   - Immediately start import without waiting for debounce
   - Verify imported data is present (not overwritten)
   - Verify pending changes are not lost entirely (backed up)

2. Test import with no pending changes:
   - Import backup with clean state
   - Verify data imports correctly

3. Test flush failure scenarios:
   - Simulate flush failure
   - Verify import is blocked
   - Verify error message shown

### Manual Testing

1. Make a change (add planting, update area)
2. Immediately click "Import" before status shows "Saved"
3. Select backup file and confirm import
4. Verify imported data is correct and complete
5. Verify pending changes from step 1 didn't overwrite import

## Dependencies

- `usePersistedStorage` hook (already implements debounced saves and `flushSave`)
- `useAllotment` hook (needs to pass `flushSave` to DataManagement)
- Existing import/export infrastructure

## Related Issues

- Issue #7: Fix import race conditions and verification
- Issue #8: Improve error handling and user feedback

## Notes

- The `flushSave()` function already exists in `usePersistedStorage.ts`
- Debounce delay is approximately 1 second
- This is a critical data integrity issue that should block other import/export work
- Consider this foundational for Phase 2 import/export reliability

## Additional Context

The import flow is documented in the research document "import-export-alignment-review.md". The current flow creates the pre-import backup but doesn't ensure pending saves are flushed, creating a window for data loss.

Import flow timeline:
- User action → debounce queued (not yet saved)
- User clicks import (< 1 second later)
- Backup file is loaded and parsed
- Debounce timer fires → old data overwrites new import
- Dialog displays success (but data is already corrupted)
