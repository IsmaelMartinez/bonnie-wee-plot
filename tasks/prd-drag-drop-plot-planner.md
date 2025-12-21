# Task List: Drag-and-Drop Plot Planner with Smart Validation

## Project Overview

Build a mobile-friendly drag-and-drop plot planner that enables visual garden layout planning with intelligent plant placement validation. The feature will include companion planting checks, crop rotation tracking (3-year cycle), and auto-fill suggestions for gaps.

This builds upon the existing garden planner infrastructure already in place.

## Key Requirements

1. **Mobile-friendly drag-and-drop** - Touch-optimized interactions for plot planning
2. **Grid-based plot sections** - Plots divided into cells (e.g., Plot A, B, C, D)
3. **Companion planting validation** - Real-time warnings when placing incompatible plants adjacent
4. **Crop rotation tracking** - 3-year simple rotation with suggestions
5. **Auto-fill option** - Algorithm to populate empty cells respecting rules
6. **Gap filler suggestions** - Recommend quick-growing crops for empty spaces

## Technical Context

### Existing Infrastructure to Leverage

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/types/garden-planner.ts` | Type definitions | `GardenPlot`, `PlannedVegetable`, `VegetableCategory` |
| `src/lib/vegetable-database.ts` | 30+ vegetables with companion data | `vegetables[]`, `getVegetableById()` |
| `src/lib/garden-storage.ts` | localStorage persistence | `loadGardenData()`, `saveGardenData()`, version migrations |
| `src/components/garden-planner/PlotView.tsx` | Basic drag-drop (HTML5) | Current plot visualization |
| `src/app/garden-planner/page.tsx` | Main planner page | State management, view switching |

### Existing Companion Data Structure

Every vegetable in `vegetable-database.ts` already has:
```typescript
{
  id: 'tomatoes',
  category: 'solanaceae',
  companionPlants: ['Basil', 'Carrots', 'Marigolds', 'Peppers'],
  avoidPlants: ['Fennel', 'Brassicas', 'Corn']
}
```

There are 37 vegetables total with companion/avoid arrays populated.

### Current Stack

- Next.js 15.5.9 (App Router)
- React 19.1.0
- TypeScript 5.8.3
- Tailwind CSS 3.4.17
- localStorage for persistence (no database)

---

## Implementation Tasks

### Phase 1: Add dnd-kit Library and Grid Types

- [ ] **T1: Install dnd-kit packages**
  - [ ] T1.1: Run `npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2`
  - [ ] T1.2: Verify build passes with new dependencies
  - [ ] T1.3: Create basic spike component to test touch/mouse drag works

- [ ] **T2: Extend type system for grid-based plots**
  - [ ] T2.1: Add new types to `src/types/garden-planner.ts`:
    ```typescript
    interface PlotCell {
      id: string              // "plotA-row0-col0"
      plotId: string          // Reference to parent plot
      row: number
      col: number
      vegetableId?: string    // Planted vegetable ID
      plantedYear?: number    // For rotation tracking
    }

    interface GridPlot extends GardenPlot {
      gridRows: number        // Default 3
      gridCols: number        // Default 4
      cells: PlotCell[]
    }

    type RotationGroup = 'brassicas' | 'legumes' | 'roots' | 'solanaceae' | 'alliums' | 'cucurbits' | 'permanent'

    interface RotationHistory {
      plotId: string
      year: number
      rotationGroup: RotationGroup
      vegetables: string[]
    }

    interface PlacementWarning {
      type: 'avoid' | 'rotation' | 'spacing'
      severity: 'error' | 'warning' | 'info'
      message: string
      conflictingPlant?: string
    }
    ```
  - [ ] T2.2: Update `GardenPlannerData` to include `rotationHistory: RotationHistory[]`
  - [ ] T2.3: Increment storage version in `garden-storage.ts` and add migration

### Phase 2: Core Drag-and-Drop Grid Component

- [ ] **T3: Create GridPlotView component**
  - [ ] T3.1: Create `src/components/garden-planner/GridPlotView.tsx` using dnd-kit
  - [ ] T3.2: Implement `DndContext` with `TouchSensor` and `MouseSensor`
  - [ ] T3.3: Create `DroppableCell` component for each grid cell
  - [ ] T3.4: Create `DraggablePlant` component for vegetables
  - [ ] T3.5: Add visual grid rendering with responsive sizing
  - [ ] T3.6: Implement drag preview with plant icon/name

- [ ] **T4: Connect to existing state management**
  - [ ] T4.1: Add grid plot creation to `PlotManager.tsx`
  - [ ] T4.2: Update `garden-storage.ts` with cell assignment functions
  - [ ] T4.3: Wire up drag-end handler to persist cell assignments
  - [ ] T4.4: Add grid view option to `ViewSwitcher.tsx`

### Phase 3: Companion Planting Validation

- [ ] **T5: Build validation logic**
  - [ ] T5.1: Create `src/lib/companion-validation.ts` with:
    ```typescript
    function getAdjacentCells(cell: PlotCell, cells: PlotCell[]): PlotCell[]
    function validatePlacement(vegetableId: string, targetCell: PlotCell, allCells: PlotCell[]): PlacementValidation
    function checkCompanionCompatibility(vegA: Vegetable, vegB: Vegetable): 'good' | 'neutral' | 'bad'
    ```
  - [ ] T5.2: Implement bidirectional avoid checking (both plant's avoid lists)
  - [ ] T5.3: Add companion scoring (bonus for placing companions together)

- [ ] **T6: Add visual feedback during drag**
  - [ ] T6.1: Highlight cells with color coding during drag:
    - Green: Good placement (companion nearby)
    - Amber: Neutral (no companions, no conflicts)
    - Red: Conflict (adjacent to plant in avoidPlants)
  - [ ] T6.2: Show tooltip on hover/tap explaining conflict
  - [ ] T6.3: Allow drop even on red cells (warning, not blocking) with confirmation
  - [ ] T6.4: Display legend explaining color meanings

### Phase 4: Crop Rotation System

- [ ] **T7: Implement rotation group mapping**
  - [ ] T7.1: Create `src/lib/crop-rotation.ts` with category-to-rotation mapping:
    ```typescript
    const ROTATION_GROUPS: Record<VegetableCategory, RotationGroup> = {
      'brassicas': 'brassicas',
      'legumes': 'legumes',
      'root-vegetables': 'roots',
      'solanaceae': 'solanaceae',
      'alliums': 'alliums',
      'cucurbits': 'cucurbits',
      'leafy-greens': 'roots',  // Often grouped with roots
      'herbs': 'permanent'
    }
    ```
  - [ ] T7.2: Add function to determine suggested rotation for plot/year
  - [ ] T7.3: Add function to check if placement violates 3-year rotation

- [ ] **T8: Build rotation tracking UI**
  - [ ] T8.1: Display rotation history badge on each plot header (e.g., "2023: Legumes, 2024: Brassicas")
  - [ ] T8.2: Show "Suggested for 2025: Roots" indicator
  - [ ] T8.3: Add rotation warning when placing same group within 2 years
  - [ ] T8.4: Create "View Rotation History" modal for each plot

### Phase 5: Auto-Fill and Gap Filler Features

- [ ] **T9: Implement auto-fill algorithm**
  - [ ] T9.1: Create `src/lib/auto-fill.ts` with:
    ```typescript
    interface AutoFillOptions {
      strategy: 'rotation-first' | 'companion-first' | 'balanced'
      difficultyFilter: 'beginner' | 'all'
      respectExisting: boolean
    }
    function autoFillPlot(plot: GridPlot, options: AutoFillOptions, history: RotationHistory[]): PlotCell[]
    ```
  - [ ] T9.2: Algorithm steps:
    1. Determine rotation group suggestion for this plot/year
    2. Filter vegetables by that group and difficulty
    3. For each empty cell, find best companion match to already-filled adjacent cells
    4. Return proposed cell assignments
  - [ ] T9.3: Add "Auto-Fill Plot" button to plot header with options dropdown

- [ ] **T10: Build gap filler suggestions**
  - [ ] T10.1: Create function to suggest quick-growing fillers for empty cells:
    ```typescript
    function suggestGapFillers(emptyCell: PlotCell, existingCells: PlotCell[], currentMonth: number): GapSuggestion[]
    ```
  - [ ] T10.2: Prioritize fast crops: radishes (25-35 days), lettuce (45-75 days), rocket (21-40 days), spring onions (60-80 days)
  - [ ] T10.3: Factor in current month vs. sow-outdoors months
  - [ ] T10.4: Show suggestions panel when empty cell is selected
  - [ ] T10.5: Add "Quick Plant" button for one-tap addition from suggestions

### Phase 6: Mobile Optimization

- [ ] **T11: Optimize touch interactions**
  - [ ] T11.1: Configure dnd-kit sensors:
    ```typescript
    const sensors = useSensors(
      useSensor(TouchSensor, {
        activationConstraint: { delay: 250, tolerance: 5 }
      }),
      useSensor(MouseSensor, {
        activationConstraint: { distance: 5 }
      })
    )
    ```
  - [ ] T11.2: Add long-press visual feedback (scale animation on hold)
  - [ ] T11.3: Implement auto-scroll when dragging near viewport edges
  - [ ] T11.4: Test and adjust touch target sizes (minimum 44x44px)

- [ ] **T12: Responsive layout adjustments**
  - [ ] T12.1: Mobile: Single plot view with swipe to navigate between plots
  - [ ] T12.2: Mobile: Collapsible plant tray at bottom
  - [ ] T12.3: Tablet: 2-column plot grid
  - [ ] T12.4: Desktop: Multi-column grid with sidebar
  - [ ] T12.5: Add pinch-to-zoom on grid (optional enhancement)

### Phase 7: Testing and Polish

- [ ] **T13: Write Playwright tests**
  - [ ] T13.1: Create `tests/grid-plotter.spec.ts`
  - [ ] T13.2: Test: Can create grid plot with dimensions
  - [ ] T13.3: Test: Can drag plant onto empty cell
  - [ ] T13.4: Test: Warning shown when placing incompatible plants
  - [ ] T13.5: Test: Rotation warning appears for same-group in 2 years
  - [ ] T13.6: Test: Auto-fill populates empty cells
  - [ ] T13.7: Test: Mobile touch drag works (use Playwright touch events)

- [ ] **T14: Accessibility and final polish**
  - [ ] T14.1: Add keyboard navigation (Tab through cells, Enter to place)
  - [ ] T14.2: Add ARIA labels for drag-drop states
  - [ ] T14.3: Ensure color coding has icon/text alternatives
  - [ ] T14.4: Test with VoiceOver/TalkBack
  - [ ] T14.5: Final UI polish based on testing feedback

---

## Data Structures Reference

### Extended Types (to add to `src/types/garden-planner.ts`)

```typescript
// Cell within a grid plot
export interface PlotCell {
  id: string              // Format: "{plotId}-{row}-{col}"
  plotId: string
  row: number
  col: number
  vegetableId?: string    // Reference to Vegetable.id
  plantedYear?: number    // Year this was planted (for rotation)
}

// Grid-enabled plot (extends existing GardenPlot)
export interface GridPlot extends GardenPlot {
  gridRows: number        // Number of rows in grid
  gridCols: number        // Number of columns in grid
  cells: PlotCell[]       // All cells in this plot
}

// Rotation tracking
export type RotationGroup = 
  | 'brassicas'    // Cabbage family
  | 'legumes'      // Beans, peas
  | 'roots'        // Carrots, parsnips, beetroot
  | 'solanaceae'   // Tomatoes, peppers, potatoes
  | 'alliums'      // Onions, garlic, leeks
  | 'cucurbits'    // Squash, courgettes, cucumber
  | 'permanent'    // Perennial herbs

export interface RotationHistory {
  plotId: string
  year: number
  rotationGroup: RotationGroup
  vegetables: string[]    // IDs of vegetables planted
}

// Validation results
export interface PlacementValidation {
  isValid: boolean
  warnings: PlacementWarning[]
  suggestions: string[]   // Helpful tips
}

export interface PlacementWarning {
  type: 'avoid' | 'rotation' | 'spacing'
  severity: 'error' | 'warning' | 'info'
  message: string
  conflictingPlant?: string
  affectedCells?: string[]
}

// Auto-fill options
export interface AutoFillOptions {
  strategy: 'rotation-first' | 'companion-first' | 'balanced'
  difficultyFilter: 'beginner' | 'all'
  respectExisting: boolean
}

// Gap filler suggestion
export interface GapSuggestion {
  vegetableId: string
  reason: string
  score: number           // 0-100 suitability
  quickGrow: boolean      // < 45 days to harvest
  canPlantNow: boolean    // Based on current month
}
```

### Storage Version Migration

Update `src/lib/garden-storage.ts`:

```typescript
const CURRENT_VERSION = 2  // Bump from 1

// Update GardenPlannerData interface
export interface GardenPlannerData {
  version: number
  currentPlanId: string | null
  plans: GardenPlan[]
  rotationHistory: RotationHistory[]  // NEW
}

// Migration function
function migrateData(data: GardenPlannerData): GardenPlannerData {
  if (data.version === 1) {
    // Migrate v1 to v2: add rotationHistory
    return {
      ...data,
      version: 2,
      rotationHistory: []
    }
  }
  return data
}
```

---

## Rotation Group Mapping

```typescript
// src/lib/crop-rotation.ts

import { VegetableCategory, RotationGroup } from '@/types/garden-planner'

export const ROTATION_GROUPS: Record<VegetableCategory, RotationGroup> = {
  'brassicas': 'brassicas',
  'legumes': 'legumes',
  'root-vegetables': 'roots',
  'solanaceae': 'solanaceae',
  'alliums': 'alliums',
  'cucurbits': 'cucurbits',
  'leafy-greens': 'roots',     // Group with roots
  'herbs': 'permanent'
}

// Simple 3-year rotation order
export const ROTATION_ORDER: RotationGroup[] = [
  'legumes',      // Year 1: Fix nitrogen
  'brassicas',    // Year 2: Heavy feeders use nitrogen
  'roots'         // Year 3: Light feeders, break pest cycles
]

export function getSuggestedRotation(
  plotId: string, 
  year: number, 
  history: RotationHistory[]
): RotationGroup {
  const lastEntry = history
    .filter(h => h.plotId === plotId)
    .sort((a, b) => b.year - a.year)[0]
  
  if (!lastEntry) return 'legumes' // Default start
  
  const lastIndex = ROTATION_ORDER.indexOf(lastEntry.rotationGroup)
  if (lastIndex === -1) return 'legumes'
  
  const nextIndex = (lastIndex + 1) % ROTATION_ORDER.length
  return ROTATION_ORDER[nextIndex]
}
```

---

## UI Wireframes

### Desktop Layout
```
┌────────────────────────────────────────────────────────────────┐
│  Garden Planner > Grid View                    [List] [Grid]   │
├────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Plot A          │  │ Plot B          │  │ Available      │  │
│  │ 2024: Brassicas │  │ 2024: Legumes   │  │ Plants         │  │
│  │ ┌──┬──┬──┬──┐   │  │ ┌──┬──┬──┬──┐   │  │                │  │
│  │ │🥬│🥦│  │  │   │  │ │🫘│🫛│  │  │   │  │ 🍅 Tomatoes    │  │
│  │ ├──┼──┼──┼──┤   │  │ ├──┼──┼──┼──┤   │  │ 🥕 Carrots     │  │
│  │ │  │  │  │  │   │  │ │  │  │  │  │   │  │ 🧅 Onions      │  │
│  │ ├──┼──┼──┼──┤   │  │ ├──┼──┼──┼──┤   │  │ 🥬 Lettuce     │  │
│  │ │  │  │  │  │   │  │ │  │  │  │  │   │  │ ...            │  │
│  │ └──┴──┴──┴──┘   │  │ └──┴──┴──┴──┘   │  │                │  │
│  │ [Auto-Fill]     │  │ [Auto-Fill]     │  │ [Filter ▼]     │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│  Legend: 🟢 Good companion | 🟡 Neutral | 🔴 Avoid            │
└────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Single Plot View)
```
┌─────────────────────────┐
│ ← Plot A (1/4)       → │  ← Swipe to change plot
├─────────────────────────┤
│ 2024: Brassicas         │
│ Suggested: Roots        │
│                         │
│   ┌──┬──┬──┐            │
│   │🥬│🥦│  │            │  ← Scrollable grid
│   ├──┼──┼──┤            │
│   │  │  │  │            │
│   ├──┼──┼──┤            │
│   │  │  │  │            │
│   └──┴──┴──┘            │
│                         │
├─────────────────────────┤
│ ▲ Available Plants      │  ← Collapsible tray
│ 🍅 Tomatoes  🥕 Carrots │
│ 🧅 Onions    🥬 Lettuce │
│ [Auto-Fill] [Suggest]   │
└─────────────────────────┘
```

### Drag Feedback States
```
Dragging 🍅 Tomatoes over cell...

┌──────┐  ┌──────┐  ┌──────┐
│ 🥕   │  │ ❓   │  │ 🥬   │
│ Good │  │ Drop │  │ BAD  │
│ 🟢   │  │ here │  │ 🔴   │
└──────┘  └──────┘  └──────┘
  ↑          ↑         ↑
Carrot is   Empty    Brassicas
companion   cell     on avoid
                     list
```

---

## Bundle Size Impact

| Package | Version | Size (gzip) |
|---------|---------|-------------|
| @dnd-kit/core | 6.3.1 | ~10KB |
| @dnd-kit/sortable | 10.0.0 | ~5KB |
| @dnd-kit/utilities | 3.2.2 | ~2KB |
| Custom logic (estimated) | - | ~5KB |
| **Total Addition** | | **~22KB** |

Current `/garden-planner` first load: 127KB
Projected first load: ~149KB (acceptable)

---

## Dependencies to Install

```bash
npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2
```

Peer dependencies: React >=16.8.0 (project has React 19.1.0 ✓)

---

## Files to Create

| Path | Purpose |
|------|---------|
| `src/components/garden-planner/GridPlotView.tsx` | Main grid drag-drop component |
| `src/components/garden-planner/DroppableCell.tsx` | Individual cell drop zone |
| `src/components/garden-planner/DraggablePlant.tsx` | Draggable plant item |
| `src/components/garden-planner/PlantTray.tsx` | Available plants panel |
| `src/components/garden-planner/GapSuggestions.tsx` | Gap filler suggestions UI |
| `src/lib/companion-validation.ts` | Companion planting checks |
| `src/lib/crop-rotation.ts` | Rotation tracking logic |
| `src/lib/auto-fill.ts` | Auto-fill algorithm |
| `tests/grid-plotter.spec.ts` | Playwright tests |

## Files to Modify

| Path | Changes |
|------|---------|
| `src/types/garden-planner.ts` | Add new types (PlotCell, GridPlot, RotationHistory, etc.) |
| `src/lib/garden-storage.ts` | Bump version, add migration, add cell functions |
| `src/components/garden-planner/PlotManager.tsx` | Add grid creation options |
| `src/components/garden-planner/ViewSwitcher.tsx` | Add grid view option |
| `src/app/garden-planner/page.tsx` | Integrate grid view, add state for rotation |

---

## Implementation Guidelines

1. **One sub-task at a time**: Complete each T#.# before moving to the next
2. **Test frequently**: Run `npm run build` and `npm run test` after significant changes
3. **Mobile-first**: Test touch interactions on real device or Chrome DevTools
4. **Commit after each phase**: Use conventional commits (e.g., `feat(grid): add dnd-kit setup`)
5. **Update this file**: Mark tasks `[x]` when complete

---

## Success Criteria

- [ ] User can create a grid-based plot with configurable rows/columns
- [ ] User can drag vegetables from tray onto grid cells
- [ ] Visual feedback shows companion compatibility during drag
- [ ] Rotation warnings appear when placing same family within 2 years
- [ ] Auto-fill successfully populates empty cells following rules
- [ ] Gap suggestions appear when selecting empty cell
- [ ] All interactions work smoothly on mobile (touch)
- [ ] Playwright tests pass for core flows
- [ ] Bundle size increase < 25KB

---

**Document Version**: 1.0
**Created**: December 15, 2025
**Target Implementation**: Q1 2026
**First Task**: T1.1 - Install dnd-kit packages







