# ADR 002: Hybrid Data Persistence Strategy

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Context

The application has different data persistence needs:
1. **Garden Plans**: Personal user data that should persist but is user-specific
2. **AI Chat**: Temporary session data with conversation history

We needed a strategy that works without a traditional database while serving these different needs.

## Decision

Implement a **hybrid data persistence strategy** with two approaches:

### 1. Client-Side localStorage (Garden Planner)

```typescript
// src/lib/garden-storage.ts
const STORAGE_KEY = 'garden-planner-data'

export function loadGardenData(): GardenPlannerData {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : getDefaultData()
}

export function saveGardenData(data: GardenPlannerData): boolean {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return true
}
```

**Use case**: Personal garden plans, user preferences
**Features**: Auto-save, export/import to JSON files

### 3. Session Storage (API Tokens)

```typescript
// AI Advisor page
const savedToken = sessionStorage.getItem('aitor_api_token')
sessionStorage.setItem('aitor_api_token', apiToken.trim())
```

**Use case**: Sensitive temporary data (API keys)
**Features**: Cleared on browser close, not persisted

## Consequences

### Positive
- **No database required** - Simplified deployment and maintenance
- **Offline capability** - localStorage works without network
- **Privacy** - Personal data stays in user's browser
- **Export/Import** - Users can backup and share garden plans
- **Fast operations** - No network latency for local data

### Negative
- **No cross-device sync** - localStorage is device-specific
- **Storage limits** - localStorage limited to ~5-10MB
- **Data loss risk** - Clearing browser data loses garden plans
- **No real-time collaboration** - JSON file doesn't support concurrent edits
- **Scaling limitations** - JSON file doesn't scale for high traffic

### Mitigations
- Export/Import feature allows manual backup
- Clear documentation about data storage limitations

## Future Considerations

- Add optional cloud sync for garden plans
- Consider IndexedDB for larger data sets
- Evaluate real database if user accounts are added



