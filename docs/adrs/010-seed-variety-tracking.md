# ADR 010: Seed Variety Tracking

## Status
Superseded by ADR-018 (Variety Management Refactor)

See ADR-018 for current architecture using unified storage in `AllotmentData.varieties`.

## Date
2026-01-01

## Context

The application tracks planting data but lacked visibility into seed inventory. Users need to:
- Know what seed varieties they've used historically
- Track which suppliers they purchase from
- Know what seeds they have vs need to order
- See spending patterns across years
- Plan which varieties to use each year

Variety data initially existed in `src/data/my-varieties.ts` with 30+ varieties including supplier, price, and years used, but was not exposed in the UI.

## Decision

### Phase 1 (Initial Implementation)
Created a simple read-only Seeds page (`/seeds`) that displays varieties grouped by vegetable type with "have seeds" toggle.

### Phase 2 (Year-Aware Tracking - 2026-01-01)
Enhanced to full year-aware variety management:

1. **Year Tabs** - Filter varieties by "All" | 2025 | 2026 | 2027
2. **Planned Years** - Each variety has a `plannedYears[]` array for future planning
3. **CRUD Operations** - Add, edit, delete varieties directly in the UI
4. **Migration** - Auto-import from static `my-varieties.ts` with existing `haveSeeds` data preserved
5. **Context-Aware Stats** - Shows "Need for 2026" when viewing 2026 tab

### Data Model

```typescript
interface StoredVariety {
  id: string
  plantId: string
  name: string
  supplier?: string
  price?: number
  notes?: string
  yearsUsed: number[]      // Historical record
  plannedYears: number[]   // Future planning
}

interface VarietyData {
  version: number
  varieties: StoredVariety[]
  haveSeeds: string[]  // Global - not year-specific
  meta: { createdAt: string; updatedAt: string }
}
```

### Architecture

Files created:
- `src/types/variety-data.ts` - Type definitions
- `src/services/variety-storage.ts` - CRUD operations, migration, localStorage persistence
- `src/hooks/useVarieties.ts` - React hook with debounced saves and multi-tab sync
- `src/components/seeds/VarietyEditDialog.tsx` - Add/edit dialog

Patterns followed from allotment storage:
- Pure functions returning new data (immutable)
- Debounced saves (500ms)
- Multi-tab synchronization via storage events
- Schema validation on load
- Flush pending saves on unmount

## Consequences

### Positive
- Full CRUD for varieties without code changes
- Year-based filtering helps with seasonal ordering
- Context-aware "need" count for each year
- Migration preserves existing haveSeeds data
- Follows established patterns from allotment storage

### Negative
- No sync between devices (localStorage only)
- Legacy `my-varieties.ts` kept as fallback, slightly redundant

### Future Considerations
- Could integrate with allotment planting (auto-suggest varieties)
- Could add seed expiry tracking
- Could add cloud sync for cross-device support

## 2026-01-22 Update: Refactored to Unified Storage

The dual storage architecture described in this ADR (separate `VarietyData` localStorage) was refactored in schema v13 to consolidate all variety data into `AllotmentData.varieties`. This eliminated data drift and race conditions.

Key changes:
- Varieties now stored exclusively in `AllotmentData.varieties`
- `yearsUsed` computed dynamically from plantings (not stored)
- Soft delete via `isArchived` preserves referential integrity
- Import/export more reliable with Promise-based flush mechanism

See ADR-018 for complete details of the refactor rationale and implementation.
