# ADR 002: Hybrid Data Persistence Strategy

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Last Updated
2025-12-27 (codebase simplification)

## Context

The application has different data persistence needs:
1. **Allotment Data**: Personal user data that should persist but is user-specific
2. **AI Chat**: Temporary session data with conversation history

We needed a strategy that works without a traditional database while serving these different needs.

## Decision

Implement a **hybrid data persistence strategy** with two approaches:

### 1. Client-Side localStorage (Allotment Storage)

The allotment page uses a unified storage service (`src/services/allotment-storage.ts`):

```typescript
// Unified storage with schema validation
import { 
  loadAllotmentData, 
  saveAllotmentData,
  AllotmentData 
} from '@/services/allotment-storage'

// The useAllotment hook manages state and persistence
const { data, isLoading, addPlanting } = useAllotment()
```

**Use case**: Personal allotment layouts, seasonal plantings, rotation history
**Features**:
- Schema validation and auto-repair
- Debounced saves to prevent excessive writes
- Multi-tab synchronization
- Version migration for schema changes
- Generic storage utilities for other localStorage needs

### Additional localStorage Keys

Other features use simple localStorage for state persistence:

| Key | Purpose | Data Structure |
|-----|---------|----------------|
| `community-allotment-varieties` | Seed variety tracking with per-year status | `VarietyData` (varieties with seedsByYear) |
| `allotment-grid-layout` | Custom bed grid positions | Layout positions for react-grid-layout |

### 2. Session Storage (API Tokens)

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
- **Export/Import** - Users can backup and share garden plans via JSON
- **Fast operations** - No network latency for local data

### Negative
- **No cross-device sync** - localStorage is device-specific
- **Storage limits** - localStorage limited to ~5-10MB
- **Data loss risk** - Clearing browser data loses garden plans
- **No real-time collaboration** - No concurrent editing support

### Mitigations
- **Export/Import feature** (`DataManagement` component) allows backup/restore
  - Exports complete state: allotment data + seed varieties in single JSON file
  - Automatic backup created before each import
  - Backward compatible with old format (allotment-only)
  - File format: `{ allotment: AllotmentData, varieties: VarietyData, exportedAt, exportVersion }`
- **Temporary Excel import** (`scripts/excel-to-backup.py`) for one-time migration
  - Converts Excel planning workbooks to standard backup format
  - 50+ plant name mappings (peas, onions, cosmos, etc.)
  - Will be deprecated once users migrate to native export/import system
- Clear documentation about data storage limitations

## Future Considerations

- Add optional cloud sync for garden plans
- Consider IndexedDB for larger data sets
- Evaluate real database if user accounts are added



