# Migration Scripts

## migrate-user-export.ts

Migrates user backup files from schema v12 to v13.

### Usage

```bash
npx tsx scripts/migrate-user-export.ts
```

### What it does

The script processes `allotment-backup-2026-01-22.json` and creates:

1. `allotment-migrated-2026-01-22.json` - Migrated data in v13 format
2. `migration-report.md` - Detailed migration report

### Transformations Applied

#### Variety Management
- Merges varieties from `allotment.varieties` and `varieties.varieties` into a single array
- Removes the deprecated `yearsUsed` field (now computed from plantings)
- Adds `isArchived: false` to all active varieties
- Clears separate variety storage (now empty)

#### Data Cleaning
- Archives varieties with empty names (marks as `isArchived: true`)
- Detects and removes duplicate varieties
- Capitalizes variety names that start with lowercase
- Preserves historical planting references even for archived varieties

#### Schema Updates
- Updates `allotment.version` from 12 to 13
- Updates `exportVersion` to 13

### Expected Results

For the 2026-01-22 backup:
- Input: 32 varieties in allotment + 31 in separate storage (63 total)
- Output: 30 active varieties + 3 archived (33 total)
- 2 varieties archived (empty names)
- 1 duplicate removed (Electric)
- 1 name capitalized (kingsland wight → Kingsland Wight)
- 14 orphaned planting references preserved

### Verification

After migration:
1. Import `allotment-migrated-2026-01-22.json` into the app
2. Verify variety count: 30 active varieties
3. Check all seasons preserved (2024, 2025, 2026)
4. Verify variety names are clean (no URLs)
5. Confirm archived varieties don't appear in dropdowns

### Migration Report

The generated `migration-report.md` includes:
- Summary statistics
- List of archived varieties
- List of name fixes
- List of duplicates removed
- Count of orphaned references
- Schema change documentation
- Verification steps
