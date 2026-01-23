# Phase 2 Specification Summary: Import/Export Reliability

## Overview

Four detailed GitHub issue specifications have been created for Phase 2 of the Variety Management Refactor. These specifications focus on resolving critical data integrity and user experience problems in the import/export flow.

## Documents Created

### 1. PHASE-2-OVERVIEW.md
Comprehensive overview document that ties all four issues together. Includes:
- Executive summary of Phase 2 goals
- Individual issue summaries with context
- Dependency graph showing issue relationships
- Suggested implementation order
- Architecture decisions and testing strategy
- Success criteria and definition of done

**Location:** `/docs/issues/PHASE-2-OVERVIEW.md`

### 2. Issue #5: Implement flush mechanism for debounced saves
**Filename:** `phase-2-issue-5.md` (189 lines)

**Core Problem:** Import operations can be silently overwritten by pending debounced saves due to timing race condition.

**Root Cause:** When users have unsaved changes queued in the debounce buffer (typically < 1 second), initiating an import before the timer fires causes the old data to be persisted after the new data is imported, resulting in data loss.

**Solution:** Call `flushSave()` at the beginning of import to persist all pending changes before importing. This creates a clean state for the import.

**Key Implementation Points:**
- Add flush mechanism to import flow in DataManagement.tsx
- Ensure flush completes before import proceeds
- Block import if flush fails
- Add timeout protection for flush operation

**Files to Modify:** `src/components/allotment/DataManagement.tsx`, `src/hooks/useAllotment.ts`

**Effort:** 4-8 hours | **Priority:** High

**Why This First:** Foundational fix that prevents data loss. Unblocks Issues #7 and #8.

---

### 3. Issue #6: Add compost data to CompleteExport interface
**Filename:** `phase-2-issue-6.md` (321 lines)

**Core Problem:** Backup exports don't include compost tracking data, causing data loss when users restore from backup.

**Root Cause:** The `CompleteExport` interface only includes allotment data and varieties. While compost data is stored separately in localStorage, it's not included in the export file format.

**Solution:** Extend `CompleteExport` to include optional `compost` field. Update export/import functions to handle compost data. Maintain backward compatibility with old exports that don't have compost field.

**Key Implementation Points:**
- Update CompleteExport interface to include optional compost field
- Modify export function to load and include compost data
- Modify import function to restore compost data
- Update pre-import backup to include compost
- Add backward compatibility for old exports

**Files to Modify:** `src/types/unified-allotment.ts`, `src/components/allotment/DataManagement.tsx`, `src/services/compost-storage.ts`

**Effort:** 4-6 hours | **Priority:** High

**Dependencies:** Can be done in parallel with Issue #5 or after

---

### 4. Issue #7: Fix import race conditions and verification
**Filename:** `phase-2-issue-7.md` (401 lines)

**Core Problem:** The import dialog closes immediately after import, preventing users from seeing errors or verifying imported data. Error messages are invisible when dialog auto-closes.

**Root Cause:** Dialog automatically closes on success or when user clicks away. If errors occur, they disappear immediately. No verification step before reload.

**Solution:** Add ImportState interface to track import progress. Display preview of imported data with counts. Require explicit user confirmation before reload. Keep dialog open so errors remain visible.

**Key Implementation Points:**
- Add ImportState interface with progress tracking
- Generate import preview showing counts (areas, plantings, varieties, compost)
- Add preview display step before reload
- Require explicit user confirmation to reload
- Keep dialog open on errors
- Add optional data verification step
- Improve error messages with specific details

**Files to Modify:** `src/components/allotment/DataManagement.tsx`, `src/types/unified-allotment.ts`

**Effort:** 6-8 hours | **Priority:** High

**Dependencies:** Depends on Issue #5 for flush mechanism. Benefits from Issue #6 for compost counts in preview.

---

### 5. Issue #8: Improve error handling and user feedback
**Filename:** `phase-2-issue-8.md` (750 lines)

**Core Problem:** Error handling in import/export is inconsistent and often silent. Export failures produce no feedback. Pre-import backup failures are silently ignored. Error messages lack context and recovery suggestions.

**Root Cause:** No structured error handling. Silent failures. No user feedback. No recovery guidance.

**Solution:** Create structured error types (`ExportError`, `ImportError`) with specific error categories. Implement comprehensive error handling with user-friendly messages, recovery suggestions, and storage quota checks.

**Key Implementation Points:**
- Create `ImportExportError` type hierarchy with specific error categories
- Define error messages for each category with recovery suggestions
- Check localStorage quota before exporting
- Show storage quota warnings
- Make pre-import backup failures visible with confirmation dialog
- Add detailed error messages with recovery steps
- Log full error context for debugging
- Show progress indication for long operations

**Files to Modify:** `src/components/allotment/DataManagement.tsx`, `src/lib/import-export-errors.ts` (new file), `src/types/unified-allotment.ts`, `src/services/compost-storage.ts`, `src/services/variety-storage.ts`

**Effort:** 5-7 hours | **Priority:** High

**Dependencies:** Best done after Issues #5 and #7 are complete

---

## Detailed Specifications Available

Each issue document includes:

- **Title, Labels, Priority, Size** - Standard GitHub issue metadata
- **Description** - Detailed context and current behavior
- **Root Cause Analysis** - What's broken and why
- **Acceptance Criteria** - Clear definition of what "done" looks like
- **Implementation Details** - Code examples and detailed steps
- **Files to Modify** - Exact files that need changes
- **Testing Requirements** - Unit, e2E, and manual testing needed
- **Dependencies** - Which other issues need to complete first
- **Related Issues** - Cross-references to other issues
- **Notes and Additional Context** - Implementation guidance

## Implementation Roadmap

### Recommended Sequence

1. **Start with Issue #5** (4-8 hours)
   - Foundational fix, no dependencies
   - Unblocks Issues #7 and #8
   - Pure race condition prevention

2. **Do Issue #6 in parallel or next** (4-6 hours)
   - Can be done independently
   - Adds data completeness
   - Prepares for Issue #7 preview

3. **Then Issue #7** (6-8 hours)
   - Depends on #5 for flush mechanism
   - Benefits from #6 for compost preview
   - Improves user experience significantly

4. **Finally Issue #8** (5-7 hours)
   - Integrates with code from #5 and #7
   - Comprehensive error handling
   - Polish and user confidence building

**Total Effort:** 19-29 hours (~1-2 weeks for one developer)

### Phase 2 Dependencies Graph

```
Issue #5 (flush mechanism)
    │
    ├─→ Issue #7 (depends on flush)
    │
    ├─→ Issue #8 (works with flush)
    │
Issue #6 (compost export) [parallel possible]
    │
    └─→ Issue #7 (benefits for preview)
        │
        └─→ Issue #8 (integrated error handling)
```

## Key Architecture Decisions

### Dual Storage with Unified Export
The app maintains three separate localStorage keys (allotment, varieties, compost) but exports them together in CompleteExport. This design is preserved and extended in Phase 2.

### Debounced Saves Pattern
The `usePersistedStorage` hook implements debounced saves (~1 second delay). Issue #5 flushes this buffer before import to prevent race conditions while preserving performance benefits.

### Error Classification
Issue #8 establishes error types that categorize failures into specific categories (validation-error, storage-quota-exceeded, backup-creation-failed, etc.) with specific recovery suggestions for each.

## Testing Strategy Summary

### Phase 2 Testing Coverage

**Unit Tests:**
- Flush mechanism calls and state
- Data serialization/deserialization
- Error classification and messaging
- Preview generation
- Backward compatibility

**E2E Tests:**
- Import with pending changes (Issue #5)
- Import/export with compost data (Issue #6)
- Import with error verification (Issue #7)
- Recovery from failed operations (Issue #8)
- Complete workflow: export → corrupt → import with error recovery

**Manual Testing:**
- Export and verify file contents
- Attempt import with pending changes
- Try importing corrupted JSON
- Verify error messages and recovery steps
- Check storage quota warning
- Verify page reload behavior
- Verify pre-import backup creation

## Success Criteria for Phase 2

Phase 2 is complete when:

1. **Data Integrity** - No data loss when importing with pending changes
2. **Data Completeness** - All user data (allotment, varieties, compost) included in exports
3. **User Verification** - Users see preview and confirm before reload
4. **Error Transparency** - All failures produce clear, actionable error messages
5. **User Confidence** - Users know when backup succeeded, when import succeeded/failed, how to recover

## File Locations

All specifications are located in `/docs/issues/`:

- `PHASE-2-OVERVIEW.md` - High-level overview and roadmap
- `phase-2-issue-5.md` - Flush mechanism specification
- `phase-2-issue-6.md` - Compost export specification
- `phase-2-issue-7.md` - Import verification specification
- `phase-2-issue-8.md` - Error handling specification

Plus Phase 3 specifications for future reference:
- `issue-9-remove-variety-storage.md`
- `issue-10-eliminate-sync-service.md`
- `issue-11-storage-migration.md`
- `issue-12-cleanup.md`

## Creating GitHub Issues

To create these as actual GitHub issues, use:

```bash
# Phase 2 Issue #5
gh issue create \
  --title "Implement flush mechanism for debounced saves" \
  --label "refactor,data-integrity,import-export,debouncing,phase-2" \
  --body "$(cat /docs/issues/phase-2-issue-5.md)"

# Phase 2 Issue #6
gh issue create \
  --title "Add compost data to CompleteExport interface" \
  --label "refactor,data-integrity,import-export,compost-tracker,phase-2" \
  --body "$(cat /docs/issues/phase-2-issue-6.md)"

# Phase 2 Issue #7
gh issue create \
  --title "Fix import race conditions and verification" \
  --label "refactor,data-integrity,import-export,race-condition,phase-2" \
  --body "$(cat /docs/issues/phase-2-issue-7.md)"

# Phase 2 Issue #8
gh issue create \
  --title "Improve error handling and user feedback" \
  --label "refactor,error-handling,user-experience,import-export,phase-2" \
  --body "$(cat /docs/issues/phase-2-issue-8.md)"
```

Or manually copy the content into GitHub's issue creation UI.

## Context and Research

These specifications build upon research document: `docs/research/import-export-alignment-review.md`

That document identified the issues that Phase 2 addresses:
- Race condition between debounced saves and imports
- Missing compost data in exports
- Silent failures and invisible errors
- No verification step before reload

## Next Steps

1. Review the specifications to ensure they align with project goals
2. Adjust issue sizes and priorities as needed
3. Create issues in GitHub using the provided CLI commands
4. Begin implementation starting with Issue #5
5. Follow the recommended sequence and dependencies

## Notes

- All specifications maintain backward compatibility with existing data
- Error messages are user-friendly, not technical
- Full technical details are logged for debugging
- Testing is comprehensive across unit, e2E, and manual scenarios
- Architecture decisions are documented for future reference

## Questions?

Refer to the individual issue documents for detailed implementation guidance. Each issue includes specific code examples, architecture decisions, and testing requirements.
