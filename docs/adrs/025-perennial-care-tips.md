# ADR 025: Perennial Care Tips

## Status
Accepted

## Date
2026-03-04

## Context

The task generator and date calculator treat all plants as annuals: sow date + days to harvest = harvest window. For perennials like raspberries, strawberries, rhubarb, and fruit trees this produces limited results. ADR 017 introduced perennial lifecycle tracking (`PerennialStatus`, `PerennialInfo`, `calculatePerennialStatus`), and the existing `maintenance` block on `Vegetable` handles generic prune/feed/mulch schedules. However, there was no mechanism for seasonal care advice like "net strawberries against birds in June", "force rhubarb under a bucket in January", or "don't harvest rhubarb in year one."

Three approaches were considered:

1. **Extend Vegetable with careTips array** (chosen) — co-locates tips with plant data, uses existing task generator pipeline, maps cleanly to future database rows.
2. **Separate care-knowledge file** — splits data across files, harder to maintain consistency.
3. **Standalone entity system with tags** — over-engineered for a spike with 4 plants.

## Decision

We extended the `Vegetable` type with a `careTips` array. Each tip is tagged with months, an optional lifecycle stage, and a category. The task generator reads these tips alongside existing maintenance data and emits them as `GeneratedTask` items on the Today dashboard.

### Type Changes

```typescript
export type CareTipCategory = 'care' | 'harvest' | 'propagate' | 'protect' | 'plant'

export interface CareTip {
  months: Month[]
  tip: string
  stage?: PerennialStatus   // omit = all stages
  category: CareTipCategory
}
```

Added to `Vegetable`:
```typescript
careTips?: CareTip[]
```

New `GeneratedTaskType` value: `'care-tip'`.

### Stage Filtering

The task generator uses `calculatePerennialStatus` (from ADR 017) to determine a plant's lifecycle stage from its `plantedYear` and `perennialInfo`. Tips with a `stage` field only appear when the plant's lifecycle matches. Tips without a `stage` appear regardless. When `plantedYear` is unknown, stage-specific tips are skipped while stage-agnostic tips still show.

This means a raspberry in its first year gets "Keep well-watered during establishment" but not "Net fruit to protect from birds" — and vice versa once it's productive.

### Spike Scope

Four plants were chosen for the initial implementation: raspberry (6 tips), strawberry (6 tips), rhubarb (6 tips), and apple tree (6 tips). Each tip is tagged with appropriate months and optional lifecycle stages.

Subsequent passes (PRs #442, #443, #444) expanded careTips across the remaining edible and functional perennial crops — soft fruit, top fruit, perennial vegetables, and culinary/functional herbs.

### Coverage Policy: Edible and Functional Perennials Only (2026-07-02)

careTips coverage is **deliberately scoped to edible and functional perennials** — crops the allotment planner exists to help grow and harvest. The eight purely ornamental perennial-flowers (echinacea, geranium, nepeta, rudbeckia, salvia, sedum, tansy, yarrow) are **intentionally excluded** and are not a coverage gap.

Rationale:
- Consistent with this ADR's original framing (careTips serve "perennials like raspberries, strawberries, rhubarb, and fruit trees" — the growing/harvesting workflow).
- Consistent with the "Simplicity First" design principle in `CLAUDE.md`: care tips exist to drive actionable Today-dashboard tasks for crops, not decorative planting advice that adds surface without a clear user benefit.
- The ornamental flowers carry no `perennialInfo`, so any tips would be stage-agnostic and outside the lifecycle-aware model careTips were built for.

Data-integrity audits should treat these eight as out of scope rather than flag them as missing careTips. Revisit only if ornamental planning becomes a first-class product goal.

## Consequences

### Positive
- Perennial plants now get actionable, month-specific care advice on the Today dashboard
- Tips are lifecycle-aware — first-year plants get different advice from established ones
- No schema migration needed — `careTips` is vegetable database metadata, not user data
- Data structure is flat and denormalized, mapping cleanly to future database records
- Integrates seamlessly with existing dismiss/restore mechanism on the dashboard

### Negative
- Care tips are embedded in the vegetable database rather than being user-editable
- Adding tips for more plants requires code changes (until database migration)
- No priority/severity on individual tips — all are medium priority

### Future: Database Migration Path

Each `CareTip` maps to a database record: `plantId`, `months[]`, `stage`, `category`, `text`. For a vector DB, the `text` field gets embedded, and queries filter by `plantId IN (user's plants)` and `months CONTAINS (current month)` before semantic similarity ranking. Plant groups (e.g., "stone fruit", "soft fruit") could become metadata tags for cross-plant recommendations.

## Implementation Files

- `src/types/garden-planner.ts` — `CareTip` interface, `CareTipCategory` type, `careTips?` on `Vegetable`
- `src/lib/task-generator.ts` — `generateCareTipTasks()` function, `'care-tip'` GeneratedTaskType
- `src/components/dashboard/TaskList.tsx` — UI config for care-tip display
- `src/lib/vegetables/data/berries.ts` — Raspberry and strawberry care tips
- `src/lib/vegetables/data/other.ts` — Rhubarb care tips
- `src/lib/vegetables/data/fruit-trees.ts` — Apple tree care tips
- `src/__tests__/lib/task-generator.test.ts` — 6 care-tip-specific tests + integration test

## References

- ADR 017: Dynamic Date System (perennial lifecycle tracking foundation)
- Design doc: `docs/plans/2026-03-04-perennial-care-tips-design.md` (to be removed after merge)
- PR #215
