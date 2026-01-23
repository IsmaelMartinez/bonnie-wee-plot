# Migration Report: allotment-backup-2026-01-22.json → v13

Generated: 2026-01-23T10:27:39.847Z

## Summary

- Schema version: 12 → 13
- Varieties before merge: allotment=32, separate=31
- Varieties after merge: 30 (3 archived)
- Seasons processed: 3
- Plantings processed: 63
- Orphaned planting references: 14

## Name Fixes (URL → Clean Name)

- `variety-bv1rc3iy`: "kingsland wight" → "Kingsland Wight"

## Archived Varieties

- `variety-1768982995210-mmk1id0`: [Empty name - lettuce] (Empty name)
- `variety-1769000040094-2e5kz3w`: [Empty name - carrot] (Empty name)

## Duplicates Removed

- `variety-1768408402852-w2bkzji`: "Electric" (Duplicate of variety-78aeckrj)

## Orphaned References

Found 14 planting(s) with varietyName that don't match any active variety.
These plantings retain their varietyName for historical reference but won't link to variety records.

## Schema Changes (v12 → v13)

- Removed `yearsUsed` from StoredVariety (now computed from plantings)
- Added `isArchived: false` to all active varieties
- Merged `allotment.varieties` and `varieties.varieties` into single array
- Cleared separate variety storage (now empty)

## Verification Steps

1. Import `allotment-migrated-2026-01-22.json` into the app
2. Verify variety count matches expected: 30
3. Verify all plantings are intact (check seasons 2024, 2025, 2026)
4. Verify variety names are clean (no URLs)
5. Check that archived varieties don't appear in dropdowns
