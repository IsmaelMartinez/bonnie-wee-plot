---
name: "#19: Create migration script for user's export file"
about: Migrate the provided allotment-backup-2026-01-22.json to new format with verification
title: "#19: Create migration script for user's export file"
labels: phase-5, feature, variety-management
---

## Problem Statement

The user has provided a backup file (`allotment-backup-2026-01-22.json`) in the current data format. Before launching the refactored variety system with new fields (archive, rename history, etc.), we need to:
- Load the backup file
- Migrate data to new schema
- Verify data integrity after migration
- Generate a new export file in the new format
- Document any data changes

This ensures a smooth transition and provides the user with a working export file.

## Acceptance Criteria

- [ ] Create migration script `/src/scripts/migrate-variety-data.ts`:
  - Takes input file path as argument
  - Loads JSON from file
  - Parses both allotment and variety data sections
  - Migrates to current schema versions
  - Validates all data
  - Generates output file with timestamp

- [ ] Migration logic:
  - Parse allotment version and apply migrations
  - Parse variety data (may need to extract or create from allotment)
  - Add new fields with default values:
    - `archived: false` for all varieties
    - `renamedFrom: []` for rename history
    - Any other new schema fields
  - Compute `yearsUsed` from plantings
  - Verify referential integrity

- [ ] Validation:
  - Run `validateConsistency()` from variety-repair
  - Log any warnings or errors
  - Provide detailed report
  - Return exit code indicating success/failure

- [ ] Output:
  - Create `allotment-backup-2026-01-22.migrated.json`
  - Separate allotment and variety sections
  - Include migration metadata:
    - Migration timestamp
    - Source format/version
    - Target format/version
    - Issues found and fixed
    - Number of varieties, plantings, etc.

- [ ] Error handling:
  - Handle invalid/corrupted JSON gracefully
  - Handle missing fields with sensible defaults
  - Report problems clearly
  - Don't fail on non-critical issues

- [ ] Documentation:
  - Create `/MIGRATION_GUIDE.md`:
    - How to run the script
    - What changes were made
    - How to verify the migration
    - Rollback procedures

- [ ] Testing:
  - Run script on the provided backup file
  - Verify output is valid
  - Check that all plantings/varieties are preserved
  - Verify computed fields are accurate

## Implementation Details

### Migration Script
Create `/src/scripts/migrate-variety-data.ts`:
```typescript
async function migrateVarietyData(
  inputPath: string,
  outputPath: string
): Promise<void> {
  // Load file
  // Parse JSON
  // Apply migrations
  // Validate
  // Save output
  // Log report
}

// Run from command line:
// npx tsx src/scripts/migrate-variety-data.ts input.json output.json
```

### Migration Steps
1. Load and parse JSON
2. Check version numbers
3. Apply schema migrations step-by-step
4. For varieties: add new fields
5. For plantings: ensure they reference valid varieties
6. Compute yearsUsed from plantings
7. Run integrity checks
8. Generate report
9. Save output file

### Utilities to Use
- `loadVarietyData()` and `saveVarietyData()`
- `detectIntegrityIssues()` and `repairIntegrityIssues()`
- Logger for output

### Migration Metadata
```typescript
interface MigrationMetadata {
  timestamp: string
  sourceVersion: number
  targetVersion: number
  issuesFound: number
  issuesFixed: number
  stats: {
    totalVarieties: number
    totalPlantings: number
    orphanedReferences: number
  }
}
```

### Example Output
```json
{
  "migration": {
    "timestamp": "2026-01-22T...",
    "sourceVersion": 12,
    "targetVersion": 13,
    "status": "success"
  },
  "allotment": { ... },
  "varieties": { ... }
}
```

## Testing Requirements

- [ ] Test on the provided `allotment-backup-2026-01-22.json`
- [ ] Verify output file has correct structure
- [ ] Verify no data loss
- [ ] Verify computed fields are accurate
- [ ] Run validation on output
- [ ] Manual verification of migration results

## Files to Create

- `/src/scripts/migrate-variety-data.ts`
- `/MIGRATION_GUIDE.md`

## Files to Modify

- `package.json` (add script entry if needed)

## Estimated Effort

Medium (5-7 hours) - Script writing and validation, plus documentation and testing on real data.

## Related

Epic: Variety Management Refactor
Phase: 5
Priority: High
Depends on: #13, #14, #15, #16, #17
