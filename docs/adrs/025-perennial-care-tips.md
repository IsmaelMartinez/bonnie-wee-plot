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

## Amendment: Task Identity and Dedup Semantics (2026-07-05)

Two decisions made after the original design (PR #447 and its follow-up) are recorded here because they change how care-tip tasks behave on the Today dashboard.

### Content-hashed task IDs, no area component

Care-tip task IDs are `care-tip-{plantId}-{careTipHash(plantId, tipText)}-{month}`, where `careTipHash` is an FNV-1a hash of plant + tip text (`src/lib/task-generator.ts`). Two properties follow:

- **Stable across database edits.** The original implementation used the tip's array index, so inserting or reordering tips in the vegetable database silently changed IDs on deploy and invalidated users' month-scoped dismissals stored in localStorage. A content hash survives edits; an ID only changes if the tip text itself changes (acceptable — reworded advice is effectively new advice).
- **No area component.** The ID identifies the *advice*, not the location. The task still carries `areaId`/`areaName` for display context.

### Dedup semantics: distinct tips distinct, same tip deduped across areas

The original dedup key (`plant + area + month`) collapsed all of a plant's same-month tips into one task — asparagus in June has three matching tips and only the first survived. The dedup key for care tips is now the task ID itself, which gives:

- **Distinct tips are distinct tasks.** Every tip matching the current month emits, and each is independently dismissable.
- **The same tip dedupes across areas.** A plant grown in several areas (two strawberry beds) shows generic advice once, not once per bed — consistent with how month-based sow tasks are one-per-plant.

### Dashboard ordering: advice ranks below action

Emitting every matching tip means a multi-perennial plot can produce a run of same-priority care tips (a realistic six-perennial June allotment emits nine). Since the dashboard task list shows only the first 8 tasks before a "+N more" fold, tips sorting alphabetically among sow/transplant tasks (all `medium` priority) pushed actionable work below the fold. The sort in `generateTasksForMonth` now breaks priority ties by ranking care tips after actionable task types. Priority itself is unchanged — a medium tip still outranks low-priority routine reminders (water, mulch) — and no tips are capped or hidden; overflow stays reachable via the existing expander. Preserve nudges share the `care-tip` type, so the demotion deliberately applies to them too: within the low-priority band, a "Glut of X?" nudge ranks after routine reminders — it is advice as well. Grouping tips per plant into an expandable row and per-plant caps were considered and rejected as larger changes than the problem warrants (Simplicity First).

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
