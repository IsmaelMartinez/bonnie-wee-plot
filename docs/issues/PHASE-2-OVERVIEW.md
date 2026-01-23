# Phase 2: Variety Management Refactor - Import/Export Reliability

## Executive Summary

Phase 2 consists of four interconnected issues focused on resolving critical data integrity and user experience problems in the import/export flow. These issues address race conditions, missing data, verification gaps, and error handling deficiencies that collectively undermine user confidence in the backup and restore functionality.

## Phase Overview

This phase builds upon Phase 1 (dynamic date system implementation) to establish robust, reliable data persistence and backup/restore capabilities. Phase 2 issues are interdependent and should be completed in the suggested order.

## Phase 2 Issues

### Issue #5: Implement flush mechanism for debounced saves
**Priority:** High | **Size:** Medium (4-8 hours)

**Problem:** Pending debounced saves can overwrite imported data due to race condition in timing. When a user has unsaved changes queued in the debounce buffer, importing a backup file before the debounce timer fires results in the old data being persisted after the new data is imported.

**Solution:** Call `flushSave()` at the beginning of the import flow to ensure all pending changes are persisted before importing. This creates a clean state for the import to work with.

**Key Changes:**
- Add `flushSave()` call to DataManagement import handler
- Add brief wait for flush to complete
- Block import if flush fails
- Error handling for flush timeout

**Dependencies:** None (foundational fix)

**Blocks:** Issue #7, #8

---

### Issue #6: Add compost data to CompleteExport interface
**Priority:** High | **Size:** Medium (4-6 hours)

**Problem:** The CompleteExport interface doesn't include compost tracking data, causing data loss when users export backups. While compost data is stored separately in localStorage, it's not preserved in backup files created via the export UI.

**Solution:** Extend CompleteExport to include CompostData, update export/import functions to handle compost data, and ensure pre-import backups include compost.

**Key Changes:**
- Update CompleteExport interface to include optional compost field
- Modify export function to load and include compost data
- Modify import function to restore compost data
- Update pre-import backup to include all three data types
- Add backward compatibility for old exports without compost

**Dependencies:** None (can be done in parallel with #5)

**Blocked By:** None

---

### Issue #7: Fix import race conditions and verification
**Priority:** High | **Size:** Medium (6-8 hours)

**Problem:** The import dialog closes immediately after import, preventing users from seeing errors or verifying the imported data. If import fails partway through, error messages are displayed but immediately disappear when dialog closes or page reloads. Users have no way to confirm that the correct data was imported.

**Solution:** Add a verification/preview step that shows what was imported before allowing reload. Keep the dialog open so users can see errors. Don't auto-reload on success.

**Key Changes:**
- Add ImportState interface to track import status
- Generate and display import preview (counts of areas, plantings, etc.)
- Require explicit user confirmation before page reload
- Keep dialog open when errors occur
- Add optional data integrity verification step
- Improve error messages with specific details

**Dependencies:** Issue #5 (for flush mechanism), #6 (for compost preview)

**Implementation Note:** This issue depends on #5 being complete first (for the flush call to be in place). It also benefits from #6 being done (so compost counts appear in preview).

---

### Issue #8: Improve error handling and user feedback
**Priority:** High | **Size:** Medium (5-7 hours)

**Problem:** Error handling in import/export is inconsistent and often silent. Export failures produce no feedback, pre-import backup failures are silently ignored, and error messages lack context and recovery suggestions. Users don't understand what went wrong or how to fix it.

**Solution:** Implement comprehensive error handling with user-friendly messages, recovery suggestions, and storage quota checks. Create structured error types for different failure modes.

**Key Changes:**
- Create ImportExportError type and error hierarchy
- Check localStorage quota before exporting
- Show storage quota warnings and recovery steps
- Make pre-import backup failures visible with user confirmation
- Add detailed error messages with recovery suggestions
- Show progress indication during long operations
- Log full error context for debugging while showing simplified UI messages

**Dependencies:** Issue #5 and #7 (error handling works with their implementations)

**Implementation Note:** Best done after #5 and #7 are in place, as error handling integrates with their code.

---

## Issue Dependencies and Recommended Order

```
┌─────────────────────────────────────────────┐
│ Issue #5: Implement flush mechanism         │
│ (Prevents debounce race condition)          │
│ Status: No dependencies                     │
└────────────────┬────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
┌─────▼──────────────┐  ┌──▼──────────────────────────┐
│ Issue #6: Add      │  │ Issue #7: Import            │
│ compost to export  │  │ verification step           │
│ Status: Can start  │  │ Status: Depends on #5       │
│ after or during #5 │  │ Benefits from #6            │
└────────┬───────────┘  └──┬───────────────────────────┘
         │                 │
         └────────┬────────┘
                  │
         ┌────────▼──────────────┐
         │ Issue #8: Error       │
         │ handling improvements │
         │ Status: Do last       │
         └───────────────────────┘
```

**Suggested Implementation Order:**

1. **#5 First (4-8 hours)** - Foundational: Prevents data loss from debounce race condition. Unblocks other issues.

2. **#6 & #5 Parallel (4-6 hours)** - Can be done in parallel with #5 or after. Adds data completeness to exports.

3. **#7 Next (6-8 hours)** - Depends on #5. Improves user experience and data verification. Benefits from #6.

4. **#8 Last (5-7 hours)** - Error handling improves user confidence. Integrates with code from #5 and #7.

**Total Phase 2 Effort:** 19-29 hours (~5-7 days for one developer, or 1-2 sprints)

## Key Concepts Across Phase 2

### Data Integrity
All four issues focus on preventing data loss and corruption:
- #5: Prevents overwrite from debounce race condition
- #6: Ensures complete data is backed up
- #7: Allows verification before committing import
- #8: Shows when failures occur so user can recover

### User Experience
All issues improve how users interact with import/export:
- #5: Silent fix (user doesn't notice, but data is safe)
- #6: Data completeness (users get complete backups)
- #7: Verification step (users can confirm before reload)
- #8: Clear feedback (users know what happened and how to fix problems)

### Error Handling Progression
- #5: Blocks import if flush fails
- #6: Gracefully handles missing compost (optional field)
- #7: Explains import errors to user
- #8: Comprehensive error strategy with recovery steps

## Files Modified Across Phase 2

### Primary Files
- `src/components/allotment/DataManagement.tsx` - All four issues touch this
- `src/types/unified-allotment.ts` - Issues #6, #8

### Service Files (May Need Updates)
- `src/services/compost-storage.ts` - Issue #6
- `src/services/variety-storage.ts` - Issue #8

### New Files
- `src/lib/import-export-errors.ts` - Issue #8

### Test Files
- `src/__tests__/components/allotment/DataManagement.test.tsx` - All issues
- `tests/import-export.spec.ts` - All issues

## Testing Strategy

### Unit Tests (Per Issue)
- #5: Flush mechanism calls and state management
- #6: Data serialization/deserialization, backward compatibility
- #7: Preview generation, state transitions
- #8: Error classification, message formatting

### E2E Tests (Integrated Scenarios)
- Import with pending changes (tests #5)
- Import/export with compost data (tests #6)
- Import with error verification (tests #7)
- Recovery from failed import (tests #8)
- Complete workflow: export → corrupt file → import with error recovery (all issues)

### Manual Testing Checklist
- [ ] Export data and verify file contains all three types
- [ ] Try importing while making changes
- [ ] Try importing corrupted JSON
- [ ] Try importing from future app version
- [ ] Verify preview shows correct counts
- [ ] Verify error messages are clear
- [ ] Check storage quota warning appears when needed
- [ ] Verify pre-import backup is created
- [ ] Verify page only reloads after user confirms

## Success Criteria for Phase 2

Phase 2 is complete when:

1. **Data Integrity** - No data loss when importing with pending changes
2. **Data Completeness** - Exports include all user data (allotment, varieties, compost)
3. **User Verification** - Users see preview and must confirm before reload
4. **Error Transparency** - All failures produce user-friendly error messages with recovery steps
5. **User Confidence** - Users know backup succeeded, know when import succeeds/fails, can recover from failures

## Architecture Decisions

### Dual Storage Pattern
The app maintains separate storage keys for different data types:
- `allotment-unified-data` (AllotmentData v11)
- `community-allotment-varieties` (VarietyData v2)
- `compost-data` (CompostData v1)

Phase 2 treats these as a unified export/import concern while maintaining separate storage. This design is preserved and extended to handle the three-part export.

### Debounced Saves
The `usePersistedStorage` hook implements debounced saves (roughly 1 second delay) to batch rapid changes. Issue #5 flushes this buffer before import to prevent race conditions while preserving the performance benefit.

### Error Handling Architecture
Issue #8 establishes error types and messages that future import/export enhancements can build upon. The error hierarchy supports different types of failures with specific recovery suggestions.

## Notes for Implementation

- All changes should be backward compatible with existing backup files
- Error messages should be user-friendly, not technical
- Recovery suggestions should be actionable
- Log full technical details for debugging while showing simplified messages
- Consider storage quota implications for users on quota-limited browsers
- Test with large datasets (many years, many plantings) for performance

## Related Documentation

- `docs/research/import-export-alignment-review.md` - Analysis that led to Phase 2
- `docs/adrs/ADR-017-dynamic-date-system.md` - Phase 1 context
- Project CLAUDE.md - Architecture and conventions

## Definition of Done

For Phase 2 to be complete:

- [ ] All four issues implemented and merged
- [ ] Unit tests for all four issues pass
- [ ] E2E tests for complete import/export workflow pass
- [ ] Manual testing checklist completed
- [ ] Code review approved by maintainers
- [ ] Documentation updated (error messages, recovery steps)
- [ ] No performance regression in normal operations
- [ ] Backward compatibility verified with old export formats
- [ ] Console logs include sufficient detail for debugging
- [ ] User-facing errors are clear and actionable
