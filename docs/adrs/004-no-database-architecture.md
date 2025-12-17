# ADR 004: File-Based Storage Without Database

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Context

When starting the project, we needed to decide on data storage. Options considered:
1. Traditional database (PostgreSQL, MySQL)
2. NoSQL database (MongoDB, Firebase)
3. File-based storage (JSON files)
4. Cloud storage services (Supabase, PlanetScale)

Constraints:
- Minimize operational complexity
- Enable quick deployment without database provisioning
- Keep hosting costs low or free
- Support offline development
- No user authentication required initially

## Decision

Use **localStorage** for client-side data persistence, avoiding any database dependency.

### Client-Side Data (Garden Planner)

```typescript
// localStorage for persistence
const STORAGE_KEY = 'garden-planner-data'
localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
const stored = localStorage.getItem(STORAGE_KEY)
```

### Data Characteristics

| Data Type | Storage | Shared | Persistent | Editable By |
|-----------|---------|--------|------------|-------------|
| Garden Plans | localStorage | No | Yes | User |
| AI Chat | Memory | No | Session | User |
| API Tokens | sessionStorage | No | Session | User |

## Consequences

### Positive
- **Zero infrastructure** - No database to provision, maintain, or pay for
- **Simple deployment** - Works on any Node.js host (Vercel, Netlify, etc.)
- **Version control** - JSON files can be committed to git
- **Offline development** - No database connection required
- **Fast reads** - File system is very fast for small datasets
- **Easy debugging** - Data is human-readable JSON

### Negative
- **Not scalable** - File I/O doesn't scale for high traffic
- **No concurrent writes** - Risk of data corruption with simultaneous edits
- **No querying** - Can't do complex queries like SQL
- **No relationships** - Manual handling of data relationships
- **Size limits** - Large datasets would slow down reads
- **No ACID guarantees** - Potential data loss on crashes

### Mitigations

1. **Garden plans are user-local** - No server-side conflicts
2. **Small dataset expected** - Community allotment, not enterprise scale
3. **Export/Import** - Users can backup their data

### When to Reconsider

This decision should be revisited if:
- User accounts are added (need user database)
- Data grows beyond localStorage limits (need proper database)
- Real-time features needed (need WebSockets + database)
- Analytics/reporting required (need queryable database)



