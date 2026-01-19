# ADR 016: Temporal Metadata for Areas

## Status
Accepted

## Date
2026-01-13

## Context

The application stores allotment data with a global layout model where all beds/areas exist across all years. When a user adds a bed in 2025, it appears in historical views (2024, 2023, etc.) because the bed definition is global. This creates inaccuracy when users want to track how their physical plot evolved over time.

A more complex solution (v11) was proposed that would move bed definitions into per-year season records, giving each year independent bed configurations. After multi-perspective review, this approach was rejected due to migration complexity, storage bloat (2.1x increase), no safe downgrade path, and UX regressions from lost cross-year features.

## Decision

We implemented a lightweight "Temporal Metadata Enhancement" (v10.1) that adds optional temporal fields to the existing Area type without changing the storage structure.

### Data Model Changes

```typescript
interface Area {
  id: string
  name: string
  type: AreaType
  // ... existing fields

  createdYear?: number   // Year this area was built/added
  retiredYear?: number   // Year this area was removed
  activeYears?: number[] // Override: explicit list of active years
}
```

### Visibility Logic

The `wasAreaActiveInYear(area, year)` helper determines whether an area should appear in a given year:

1. If `activeYears` is specified, check if year is in the array
2. Otherwise: year >= createdYear (if set) AND year < retiredYear (if set)
3. If neither temporal field is set, area is visible in all years

### UI Integration

The AddAreaForm includes an optional "Created Year" field that defaults to undefined (area exists in all years). When set, the area only appears in that year and later. The helper text explains: "This area will only appear in 2025 and later years."

### Storage Service Integration

The `getAreasForYear(data, year)` function filters areas based on temporal metadata. The `backfillAreaSeasons` function respects `createdYear` when creating AreaSeason entries for historical years.

## Consequences

### Positive
- Solves the core problem without storage format changes
- No migration required (fields are optional)
- Backward compatible (existing data unchanged)
- Minimal code footprint (~50 lines of helpers)
- Preserves cross-year features (copy plantings, rotation tracking)

### Negative
- Still a global model (can't have different bed names per year)
- `retiredYear` and `activeYears` not yet exposed in UI (only `createdYear`)

### Implementation Files

- `src/types/unified-allotment.ts` - Type definitions
- `src/services/allotment-storage.ts` - `wasAreaActiveInYear`, `getAreasForYear`
- `src/components/allotment/AddAreaForm.tsx` - Created year input
- `src/__tests__/services/allotment-storage.test.ts` - Unit tests

## References

- Research: per-year-beds-analysis.md (concluded v11 NOT RECOMMENDED)
- Implementation prompt followed for this feature
