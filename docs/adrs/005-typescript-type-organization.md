# ADR 005: TypeScript Type Organization

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Context

As a TypeScript application, we needed a strategy for organizing type definitions that:
- Avoids circular dependencies
- Makes types easy to find and reuse
- Supports domain-specific typing
- Maintains consistency across the codebase

## Decision

Use a **hybrid approach** with centralized shared types and domain-specific type files.

### Structure

```
src/
├── types/
│   ├── index.ts              # Shared/core types (ChatMessage, UserLocation, etc.)
│   └── garden-planner.ts     # Domain-specific types for garden planner
└── lib/
    ├── garden-storage.ts     # Uses types from @/types/garden-planner
    └── vegetable-database.ts # Uses types from @/types/garden-planner
```

### Centralized Types (`src/types/index.ts`)

```typescript
// Shared across multiple features
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface UserLocation {
  latitude: number
  longitude: number
  city?: string
}
```

### Domain-Specific Types (`src/types/garden-planner.ts`)

```typescript
// Garden planner feature types
export type VegetableCategory = 
  | 'leafy-greens'
  | 'root-vegetables'
  | 'brassicas'
  // ...

export interface Vegetable {
  id: string
  name: string
  category: VegetableCategory
  planting: PlantingInfo
  care: CareRequirements
}

export interface GardenPlan {
  id: string
  name: string
  vegetables: PlannedVegetable[]
  plots: GardenPlot[]
}

// Constants that relate to types
export const CATEGORY_INFO: CategoryInfo[] = [
  { id: 'leafy-greens', name: 'Leafy Greens', icon: 'Leaf', color: 'green' },
  // ...
]
```

### Type Import Patterns

```typescript
// Importing from centralized types
import type { ChatMessage, UserLocation } from '@/types'

// Importing from domain-specific types
import { 
  Vegetable, 
  GardenPlan, 
  CATEGORY_INFO 
} from '@/types/garden-planner'
```

## Consequences

### Positive
- **Clear organization** - Know where to find types
- **Domain separation** - Garden planner types isolated
- **Path aliases** - `@/types` is clean and short
- **IDE support** - TypeScript IntelliSense works well
- **Colocation of constants** - Type-related constants live with types

### Negative
- **Two places to look** - Need to check both files
- **Migration overhead** - Moving types between files when scope changes
- **Potential duplication** - Similar types might exist in different files

### Type Design Principles Used

1. **Union types for constrained strings**
   ```typescript
   export type SunRequirement = 'full-sun' | 'partial-shade' | 'shade'
   ```

2. **Interface for object shapes**
   ```typescript
   export interface GardenPlot {
     id: string
     name: string
     width: number
   }
   ```

3. **Type aliases for readability**
   ```typescript
   export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
   ```

4. **Optional properties with `?`**
   ```typescript
   export interface PlannedVegetable {
     plotId?: string           // Optional
     plannedSowDate?: string   // Optional
   }
   ```

5. **Record types for lookups**
   ```typescript
   export const MONTH_NAMES: Record<Month, string> = {
     1: 'January',
     // ...
   }
   ```



