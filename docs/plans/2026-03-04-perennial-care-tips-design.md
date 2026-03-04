# Perennial Care Tips — Spike Design

## Problem

The date calculator and task generator treat all plants as annuals: sow date + days to harvest = harvest window. For perennials like raspberries, strawberries, rhubarb, and fruit trees this produces meaningless results. A raspberry planted in 2022 gets a "harvest by 2024" task, then nothing — no ongoing care guidance.

The task generator does handle prune/feed/mulch schedules via the `maintenance` block on each `Vegetable` definition. But this covers only three generic task types. Missing entirely: seasonal care tips like "net strawberries against birds in June", "force rhubarb under a bucket in January", "thin apple fruitlets to one per cluster", or "don't harvest rhubarb in year one."

## Approach

Extend the existing `Vegetable` type with a `careTips` array. Each tip is tagged with months, an optional lifecycle stage, and a category. The task generator reads these tips alongside the existing maintenance data and emits them as `GeneratedTask` items on the Today dashboard.

This approach was chosen over a separate care-knowledge file (splits data across files) or a standalone entity system with tags (over-engineered for a spike). The data structure maps cleanly to database rows for future migration.

## Data Model

New types in `src/types/garden-planner.ts`:

```typescript
export interface CareTip {
  months: Month[]
  tip: string
  stage?: PerennialStatus   // 'establishing' | 'productive' | 'declining' (omit = all)
  category: 'care' | 'harvest' | 'propagate' | 'protect' | 'plant'
}
```

Added to `Vegetable`:

```typescript
careTips?: CareTip[]
```

New `GeneratedTaskType` value: `'care-tip'`.

## Task Generator Integration

The existing `generateMaintenanceTasks` function iterates over areas with `primaryPlant`, looks up the plant in the vegetable database, and emits tasks for pruneMonths/feedMonths/mulchMonths. The change adds one more pass: read `careTips`, filter by current month and the plant's lifecycle stage (computed via `calculatePerennialStatus` from `perennial-calculator.ts`), and emit matching tips as `GeneratedTask` items with `type: 'other'` and `generatedType: 'care-tip'`.

Stage filtering means a raspberry in its first year (establishing) gets "keep well-watered during establishment" but not "summer prune fruiting canes." An apple tree in year 15 (productive) gets "thin fruitlets in June" but not "stake young tree."

## Spike Scope — 4 Plants

### Raspberry
- Jan/Feb: Check support wires and tighten before new growth (care)
- Mar: Cut back autumn-fruiting canes to ground level (care)
- May/Jun: Tie in new canes as they grow (care)
- Jun-Aug: Net fruit to protect from birds (protect, productive)
- Aug/Sep: Cut spent summer-fruiting canes to ground after harvest (care, productive)
- Nov-Mar: Plant new bare-root canes (plant, establishing)

### Strawberry
- Mar/Apr: Remove straw/mulch from crowns as growth starts (care)
- May: Tuck straw under developing fruit to keep clean (care, productive)
- Jun/Jul: Pick regularly — every other day in peak season (harvest, productive)
- Jul/Aug: Peg down runners to propagate new plants (propagate)
- Sep: Cut back old foliage after fruiting finishes (care)
- First year: Remove flowers to build strong roots (care, establishing)

### Rhubarb
- Jan/Feb: Cover crowns with a forcing pot for early pink stems (care, productive)
- Mar/Apr: Begin harvesting — pull stems, don't cut (harvest, productive)
- Jun: Stop harvesting by late June to let the plant recover (harvest, productive)
- Sep: Remove any flowering stems immediately (care)
- Oct/Nov: Divide crowns every 5 years to maintain vigour (propagate, productive)
- First year: Don't harvest at all in the first year (care, establishing)

### Apple
- Jan/Feb: Winter prune while dormant — remove crossing branches (care)
- Apr: Check for woolly aphid on bark crevices (protect)
- Jun: Thin fruitlets to one per cluster for better size (care, productive)
- Aug/Sep: Pick fruit when it twists off easily (harvest, productive)
- Nov: Clear fallen leaves to reduce scab spores (protect)
- Year 1-2: Stake securely and check ties quarterly (care, establishing)

## UI

Care tips appear on the Today dashboard as `GeneratedTask` items alongside existing prune/feed/mulch tasks. They use the same dismissible mechanism. The `TaskList` component already renders generated tasks with description, area name, and plant name. A subtle visual indicator (icon or label) distinguishes care tips from action tasks.

## Future: Database Migration Path

Each `CareTip` maps to a database record: `plantId`, `months[]`, `stage`, `category`, `text`. For a vector DB, the `text` field gets embedded, and queries filter by `plantId IN (user's plants)` and `months CONTAINS (current month)` before semantic similarity ranking. Plant groups (e.g., "stone fruit", "soft fruit") could become additional metadata tags for cross-plant recommendation (e.g., "all berries: check for botrytis in wet weather").

The in-app structure is deliberately flat and denormalized — no nested objects or complex relationships — making the migration to any database type straightforward.
