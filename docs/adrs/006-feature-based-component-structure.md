# ADR 006: Feature-Based Component Structure

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Context

As the application grew with multiple features (AI advisor, garden planner, growing guides), we needed a component organization strategy that:
- Keeps related components together
- Scales as features are added
- Makes dependencies clear
- Supports code splitting

## Decision

Use a **feature-based component structure** where components are grouped by the feature they belong to.

### Structure

```
src/
├── components/
│   ├── Navigation.tsx              # Shared global component
│   ├── GuideCTA.tsx                # Shared CTA component for guides
│   └── garden-planner/             # Feature-specific folder
│       ├── BedOverview.tsx         # Overview grid showing all beds at a glance
│       ├── GapSuggestions.tsx      # AI-powered gap fill suggestions
│       ├── GardenGrid.tsx          # Main grid component with plant selection
│       └── UnifiedCalendar.tsx     # Planting calendar across all beds
├── app/
│   ├── garden-planner/
│   │   └── page.tsx               # Main garden planner with beds, grid, calendar
│   ├── companion-planting/
│   │   └── page.tsx               # Self-contained page
│   └── composting/
│       └── page.tsx               # Self-contained page
```

### Two Patterns Observed

#### 1. Complex Features → Separate Components Folder

**Garden Planner** has many interactive components, so they're organized in `components/garden-planner/`:

```typescript
// src/app/garden-planner/page.tsx
import GardenGrid from '@/components/garden-planner/GardenGrid'
import BedOverview from '@/components/garden-planner/BedOverview'
import UnifiedCalendar from '@/components/garden-planner/UnifiedCalendar'
// GapSuggestions imported when AI suggestions are needed
```

#### 2. Simple Features → Self-Contained Pages

**Companion Planting** and **Composting** are information-heavy with minimal interaction, so everything is in the page file:

```typescript
// src/app/companion-planting/page.tsx
const companionPlantingPairs = [ /* data */ ]
const companionPlantingPrinciples = [ /* data */ ]
const seasonalTips = [ /* data */ ]

export default function CompanionPlantingPage() {
  return ( /* UI using inline data */ )
}
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `page.tsx` | State management, data orchestration, layout |
| Feature components | Specific UI + behavior, receive props from page |
| `Navigation.tsx` | App-wide navigation, used in layout.tsx |

### Data Flow Pattern

```
page.tsx (state holder)
    │
    ├── loads data (localStorage)
    ├── manages state (useState) - beds, activeBed, etc.
    ├── defines handlers (onAssign, onClear, onResize, etc.)
    │
    └── passes to components as props
        └── GardenGrid (grid, onAssign, onClear, onResize, onClearAll)
```

## Consequences

### Positive
- **Clear ownership** - Know where to find garden planner code
- **Encapsulation** - Feature changes don't affect others
- **Scalable** - Easy to add new features
- **Code splitting** - Next.js can lazy-load feature components
- **Testable** - Components can be tested in isolation

### Negative
- **Inconsistency** - Some features have components, others don't
- **No shared UI library** - Buttons, cards, etc. are not abstracted
- **Prop drilling** - Page passes many props to components

### When to Extract Components

Current guidelines:
1. **Extract** when component is used in multiple places
2. **Extract** when page file exceeds ~300 lines
3. **Extract** when component has its own state/logic
4. **Keep inline** for static display content

### Future Considerations

- Create shared `components/ui/` for common elements (Button, Card, Modal)
- Consider component library (shadcn/ui) for consistency
- Add barrel exports (`components/garden-planner/index.ts`)



