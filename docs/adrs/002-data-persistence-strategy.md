# ADR 002: Client-Side Data Persistence

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Last Updated
2026-01-23 (Schema v14 - Per-Year Grid Positions)

## Context

The application needed a data persistence strategy that works without a traditional database. Key constraints were minimizing operational complexity, enabling quick deployment without database provisioning, keeping hosting costs low, supporting offline development, and not requiring user authentication initially.

Options considered included traditional databases (PostgreSQL, MySQL), NoSQL databases (MongoDB, Firebase), and cloud storage services (Supabase, PlanetScale). All were rejected in favor of browser-native storage.

## Decision

Use browser-native storage (localStorage and sessionStorage) for all data persistence, avoiding any database dependency.

### Storage Architecture

| Data Type | Storage | Persistent | Key |
|-----------|---------|------------|-----|
| Allotment data (includes varieties, grid positions) | localStorage | Yes | `allotment-unified-data` |
| API tokens | sessionStorage | Session only | `aitor_api_token` |
| AI chat history | Memory | No | n/a |

Note: As of schema v13, seed varieties are stored within `AllotmentData.varieties`. As of schema v14, grid positions are stored per-year in `AreaSeason.gridPosition` rather than in a separate `allotment-grid-layout` key.

### Allotment Storage Service

The primary storage service (`src/services/allotment-storage.ts`) provides schema validation and auto-repair, debounced saves to prevent excessive writes, multi-tab synchronization via storage events, version migration for schema changes, and immutable update functions (return new data, don't mutate).

```typescript
import { loadAllotmentData, saveAllotmentData } from '@/services/allotment-storage'

const { data, isLoading, addPlanting } = useAllotment()
```

### Session Storage for Sensitive Data

API tokens use sessionStorage (cleared on browser close, not persisted):

```typescript
sessionStorage.setItem('aitor_api_token', token)
const storedToken = sessionStorage.getItem('aitor_api_token')
```

## Consequences

### Positive
- Zero infrastructure (no database to provision, maintain, or pay for)
- Simple deployment (works on any Node.js host)
- Offline capability (localStorage works without network)
- Privacy (personal data stays in user's browser)
- Fast operations (no network latency)
- Export/Import enables backup and sharing

### Negative
- No cross-device sync (localStorage is device-specific)
- Storage limits (~5-10MB per origin)
- Data loss risk if browser data cleared
- No real-time collaboration
- No complex querying capabilities

### Mitigations

The DataManagement component provides export/import functionality that exports complete state (allotment data with embedded varieties) to a single JSON file. Automatic backup is created before each import. A temporary Excel import script (`scripts/excel-to-backup.py`) enables one-time migration from existing spreadsheets.

Schema v13 (2026-01-22) consolidated variety storage from separate `community-allotment-varieties` key into `AllotmentData.varieties`, eliminating dual storage issues and improving import/export reliability. Schema v14 (2026-01-23) moved grid positions from separate `allotment-grid-layout` key into `AreaSeason.gridPosition`, enabling per-year layouts and ensuring positions are included in export/import.

### When to Reconsider

This decision should be revisited if user accounts are added (need user database), data grows beyond localStorage limits, real-time features are needed (WebSockets + database), or analytics/reporting require queryable data.

## References

- Storage service: `src/services/allotment-storage.ts`
- Variety queries: `src/lib/variety-queries.ts`
- useAllotment hook: `src/hooks/useAllotment.ts`
- ADR-018: Variety Management Refactor (schema v13)
- ADR-019: Per-Year Grid Positions (schema v14)
