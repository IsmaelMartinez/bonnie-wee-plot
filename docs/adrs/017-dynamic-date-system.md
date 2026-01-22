# ADR 017: Dynamic Date System

## Status
Accepted

## Date
2026-01-22

## Context

The application previously used static month-based calendar lookups for planting and harvest information (e.g., "harvest in August"). This approach had several limitations: users couldn't get personalized harvest predictions based on when they actually sowed, there was no way to track the difference between expected and actual harvest dates, and perennial plants had no lifecycle tracking (establishment period, productive years).

Additionally, the `Planting` type had an ambiguous `harvestDate` field that didn't distinguish between expected and actual harvest dates.

## Decision

We implemented a "Dynamic Date System" that calculates personalized dates based on actual planting information rather than static calendar months.

### Schema Changes (v11 to v12)

The schema version was bumped from 11 to 12 with the following changes:

#### Planting Type Extensions

```typescript
export type SowMethod = 'indoor' | 'outdoor' | 'transplant-purchased'

export interface Planting {
  // Existing fields
  id: string
  plantId: string
  varietyName?: string
  sowDate?: string
  transplantDate?: string
  success?: PlantingSuccess
  notes?: string
  quantity?: number

  // New fields (v12)
  sowMethod?: SowMethod              // How the planting was started
  expectedHarvestStart?: string      // Calculated from sow/transplant + daysToHarvest.min
  expectedHarvestEnd?: string        // Calculated from sow/transplant + daysToHarvest.max
  actualHarvestStart?: string        // Renamed from harvestDate
  actualHarvestEnd?: string          // When harvest finished
  harvestNotes?: string              // Notes about the harvest
}
```

#### Perennial Lifecycle Tracking

```typescript
export interface PerennialInfo {
  yearsToFirstHarvest: { min: number; max: number }
  productiveYears?: { min: number; max: number }
  isEvergreen?: boolean
}

export type PerennialStatus = 'establishing' | 'productive' | 'declining' | 'removed'

export interface PrimaryPlant {
  plantId: string
  variety?: string
  plantedYear?: number
  expectedFirstHarvestYear?: number  // Calculated from plantedYear + yearsToFirstHarvest
  expectedDeclineYear?: number       // Calculated from plantedYear + productiveYears
  status?: PerennialStatus
  firstHarvestYearOverride?: number  // Manual override
}
```

### Date Calculator Module

A new module (`src/lib/date-calculator.ts`) provides date calculation functions:

- `calculatePlantingDates()` - Forward calculation from sow date to expected harvest
- `calculateSowDateForHarvest()` - Backward calculation from target harvest to sow date
- `validateSowDate()` - Validates sow dates against plant's growing window with warnings
- `getFallFactorDays()` - Scotland-specific adjustment for autumn plantings (slower growth)
- `getGerminationDays()` - Germination time by plant category

The calculator accounts for:
- Different sow methods (indoor starts add germination + hardening time)
- Scotland's climate (fall factor for slower autumn growth)
- Cross-year crops (winter varieties that span calendar years)

### Migration

The v11 to v12 migration:
1. Renames `harvestDate` to `actualHarvestStart` on all existing plantings
2. Defaults `sowMethod` to `'outdoor'` when `sowDate` exists
3. Leaves `expectedHarvest*` fields undefined (calculated on demand)

## Consequences

### Positive
- Personalized harvest predictions based on actual sow dates
- Clear distinction between expected and actual harvest dates
- Perennial plants can track their lifecycle stage
- Foundation for task generation based on calculated dates
- Cross-year crop support (e.g., overwintering garlic)

### Negative
- Additional complexity in the Planting type
- Expected dates need recalculation when plant data changes
- UI must handle both legacy (no expected dates) and new plantings

### Implementation Files

- `src/types/unified-allotment.ts` - Type definitions (SowMethod, Planting extensions)
- `src/types/garden-planner.ts` - PerennialInfo on Vegetable
- `src/lib/date-calculator.ts` - Date calculation logic
- `src/lib/vegetable-database.ts` - PerennialInfo data for perennial plants
- `src/services/allotment-storage.ts` - v11 to v12 migration
- `src/__tests__/lib/date-calculator.test.ts` - Unit tests (32 tests)
- `src/__tests__/services/allotment-storage.test.ts` - Migration tests

## References

- GitHub Issues: Epic #24, Implementation #25-#32
- Pull Requests: #34 (Phase 1-2), #35 (Phase 3-4)
