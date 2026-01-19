# ADR 008: React Built-in State Management

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Context

The application needed state management for:
- Form inputs and UI state
- Loaded data (garden plans)
- Async operation status (loading, errors)
- User preferences (view modes, expanded sections)

Options considered:
1. React built-in (useState, useEffect, useCallback)
2. Redux/Redux Toolkit
3. Zustand
4. Jotai/Recoil
5. React Query/TanStack Query

## Decision

Use **React's built-in state management** (`useState`, `useEffect`, `useCallback`) without external state libraries.

### Pattern: Page-Level State Management

Each page manages its own state and passes handlers to child components:

```typescript
// src/app/garden-planner/page.tsx
export default function GardenPlannerPage() {
  // State
  const [data, setData] = useState<GardenPlannerData | null>(null)
  const [currentView, setCurrentView] = useState<PlannerViewMode>('list')
  const [showVegetableSelector, setShowVegetableSelector] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const loaded = loadGardenData()
    setData(loaded)
  }, [])

  // Memoized save function
  const saveData = useCallback((newData: GardenPlannerData) => {
    setData(newData)
    saveGardenData(newData)
  }, [])

  // Handlers passed to children
  const handleCreatePlan = (plan: GardenPlan) => {
    if (!data) return
    saveData(addPlan(data, plan))
  }

  return (
    <PlanManager
      data={data}
      onCreatePlan={handleCreatePlan}
      // ...other handlers
    />
  )
}
```

### Pattern: Component-Local State

Components manage their own UI state:

```typescript
// src/components/garden-planner/VegetableSelector.tsx
export default function VegetableSelector({ onAddVegetable }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedVegetable, setExpandedVegetable] = useState<string | null>(null)

  // Derived state via useMemo
  const filteredVegetables = useMemo(() => {
    return vegetables.filter(veg => /* filter logic */)
  }, [searchTerm, selectedCategory])

  // ...
}
```

### Pattern: Async Data Loading

Simple pattern for API data (used in AI Advisor):

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const sendMessage = async (message: string) => {
  try {
    setLoading(true)
    const response = await fetch('/api/ai-advisor', {
      method: 'POST',
      body: JSON.stringify({ message })
    })
    const data = await response.json()
    setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
  } catch (err) {
    setError('Failed to get response')
  } finally {
    setLoading(false)
  }
}
```

## Consequences

### Positive
- **No extra dependencies** - Smaller bundle, no library to learn
- **Simple mental model** - Props down, callbacks up
- **TypeScript native** - No type issues with external libraries
- **Explicit data flow** - Easy to trace state changes
- **Component independence** - Each page self-contained

### Negative
- **Prop drilling** - Passing handlers through multiple levels
- **No global state** - Can't share state between pages easily
- **Manual caching** - No built-in data caching
- **Boilerplate** - Similar loading/error patterns repeated
- **No persistence helpers** - Manual localStorage sync

### When This Works

This approach works for this application because:
1. **Pages are independent** - Garden planner doesn't share state with other pages
2. **Data is localized** - localStorage for user data, API only for AI advisor
3. **Simple async needs** - No complex caching or revalidation
4. **Limited interactivity** - Most pages are information display

### When to Reconsider

Consider adding state library if:
- Multiple pages need same data (user profile, settings)
- Complex caching requirements emerge
- Real-time data synchronization needed
- State logic becomes hard to follow

### Patterns Used

| Pattern | Use Case |
|---------|----------|
| `useState` | Local component state |
| `useEffect` | Data loading, side effects |
| `useCallback` | Memoized handlers passed as props |
| `useMemo` | Derived/filtered data |
| `useRef` | DOM references, mutable values |



