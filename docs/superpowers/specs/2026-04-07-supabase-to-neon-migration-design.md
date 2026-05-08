# Supabase to Neon Migration Design

Date: 2026-04-07

## Problem

Bonnie Wee Plot uses Supabase as its cloud persistence layer for syncing allotment data across devices. The actual usage is minimal: one table storing a single JSONB document per user, with three operations (fetch, upsert, delete). However, Supabase's free tier pauses projects after 7 days of inactivity, which breaks cloud sync for logged-in users. The $25/month Pro plan is not justified for a hobby project with no users or revenue.

## Decision

Migrate from Supabase to Neon Serverless Postgres. Neon's free tier (0.5 GB storage, 100 CU-hours/month) does not pause projects — it scales compute to zero after 5 minutes of inactivity and wakes on the next query with a ~500ms cold start. The SQL schema stays nearly identical. The architecture improves by routing all database access through Next.js API routes instead of the current pattern of connecting directly from the browser via the Supabase JS client.

Neon is already used in the portfolio (github-issue-triage-bot) and has proven reliable.

## Architecture

### Current flow (Supabase)

```
Browser (useSyncedStorage hook)
  -> gets Clerk JWT with template: 'supabase'
  -> calls Supabase JS client directly
  -> Supabase RLS enforces auth via JWT sub claim
```

### New flow (Neon via API routes)

```
Browser (useSyncedStorage hook)
  -> fetch('/api/sync') with Clerk session cookie
  -> Next.js API route authenticates via Clerk middleware
  -> queries Neon Postgres server-side
```

The key change is that database access moves entirely server-side. The sync hook becomes a pure HTTP client calling the app's own API routes. Auth is enforced at the API route level via Clerk's `auth()` helper, removing the need for database-level RLS and the special Clerk JWT template for Supabase.

## Database Schema

Hosted on Neon Serverless Postgres. The schema is the same table structure without RLS policies:

```sql
CREATE TABLE allotments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_allotments_user_id ON allotments (user_id);
```

No RLS policies. No `auth.jwt()` references. Auth is enforced in API routes. The migration SQL file goes in `sql/` as `002-neon-allotments.sql`.

## Neon Client Module

New file: `src/lib/neon/client.ts`

Exports a connection pool using `@neondatabase/serverless`, configured from a server-only `DATABASE_URL` env var (no `NEXT_PUBLIC_` prefix). Uses Neon's built-in PgBouncer via the `-pooler` hostname variant for connection pooling, following the same pattern as triage-bot.

Also exports query helper functions used by the API routes:

- `fetchAllotment(userId)` — SELECT data and updated_at for a user
- `upsertAllotment(userId, data)` — INSERT ... ON CONFLICT (user_id) DO UPDATE
- `deleteAllotment(userId)` — DELETE by user_id

These are the direct replacements for the current `fetchRemote`, `pushToRemote`, and `deleteRemote` from `src/lib/supabase/sync.ts`, but they run server-side only.

## API Route

New file: `src/app/api/sync/route.ts`

Three handlers, all authenticated via Clerk's `auth()`:

### GET /api/sync

Fetches the authenticated user's allotment. Returns `{ data, updatedAt }` with 200, or 404 if no row exists. Replaces the browser-side `fetchRemote()` call.

### PUT /api/sync

Upserts the allotment document. Accepts `{ data }` in the request body. Uses Postgres `ON CONFLICT (user_id)` to insert or update. Returns 200 on success. Replaces the browser-side `pushToRemote()` call.

### DELETE /api/sync

Deletes the user's allotment row. Returns 200 on success. Replaces the browser-side `deleteRemote()` call.

All handlers return 401 for unauthenticated requests.

## Sync Client Module

New file: `src/lib/sync-client.ts`

Thin wrappers that call the API routes via `fetch`. Exports three functions with signatures compatible with what `useSyncedStorage` expects, minus the `token` parameter:

- `fetchRemote(userId)` — `GET /api/sync`, returns `{ data, updatedAt } | null`
- `pushToRemote(userId, data)` — `PUT /api/sync` with JSON body
- `deleteRemote(userId)` — `DELETE /api/sync`

The `userId` parameter is kept in the function signatures for interface compatibility with the sync hook, but the API routes extract the actual userId from Clerk's session (the client-side userId is not trusted for auth).

## Sync Hook Changes

`src/hooks/useSyncedStorage.ts` changes:

- Import `fetchRemote`, `pushToRemote` from `@/lib/sync-client` instead of `@/lib/supabase/sync`
- Remove the `isSupabaseConfigured()` import and call — no longer needed since the Neon connection is a server-side concern; the client only needs to know if the user is signed in
- Remove `getSupabaseToken()` helper and all `getToken({ template: 'supabase' })` calls — API routes authenticate via Clerk session cookies automatically
- Remove `token` parameter from `fetchRemote`/`pushToRemote`/`deleteRemote` calls
- The `canSync` condition simplifies from `isSignedIn && isSupabaseConfigured() && isOnline` to `isSignedIn && isOnline`

## Account API Route Changes

`src/app/api/account/route.ts` updates:

- Import `fetchAllotment`, `deleteAllotment` from `@/lib/neon/client` instead of `fetchRemote`, `deleteRemote` from `@/lib/supabase/sync`
- Remove the `getToken({ template: 'supabase' })` calls — Neon queries run server-side with the connection pool, no JWT needed
- The route logic simplifies since it no longer needs to obtain and check a Supabase token

## Removals

### Files deleted

- `src/lib/supabase/client.ts` — Supabase client factory
- `src/lib/supabase/sync.ts` — Supabase sync functions

### Dependency removed

- `@supabase/supabase-js` from package.json

### Environment variables removed (from Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### CSP directive

- Remove `https://*.supabase.co` from `connect-src` in `src/middleware.ts`

### Clerk configuration

- Delete the "supabase" JWT template from the Clerk dashboard (no longer needed)

## Additions

### Dependency added

- `@neondatabase/serverless`

### Environment variable added (Vercel, server-only)

- `DATABASE_URL` — Neon pooled connection string

### New files

- `src/lib/neon/client.ts` — Neon connection pool and query helpers
- `src/app/api/sync/route.ts` — sync API route
- `src/lib/sync-client.ts` — client-side fetch wrappers
- `sql/002-neon-allotments.sql` — Neon schema (same table, no RLS)

## Testing

### Unit tests updated

- `src/__tests__/hooks/useSyncedStorage.test.ts` — update mocked imports from `@/lib/supabase/sync` to `@/lib/sync-client`, remove token-related assertions
- `src/__tests__/api/account.test.ts` — update mocked imports from Supabase to Neon
- `src/__tests__/lib/supabase-sync.test.ts` — delete (replaced by new tests)
- `src/__tests__/lib/supabase-client.test.ts` — delete (replaced by new tests)

### Unit tests added

- `src/__tests__/api/sync.test.ts` — tests for the new sync API route (auth, fetch, upsert, delete, error handling)
- `src/__tests__/lib/neon-client.test.ts` — tests for Neon client configuration and query helpers
- `src/__tests__/lib/sync-client.test.ts` — tests for the client-side fetch wrappers

### E2E tests

Existing Playwright tests should not be affected. The sync layer is an async overlay; the UI works from localStorage regardless of cloud sync state.

## CLAUDE.md Updates

Update the following sections to reflect Neon instead of Supabase:

- Cloud Persistence (Supabase) section — rewrite for Neon, remove Supabase-specific details (RLS, JWT template, Supabase client module)
- Authentication (Clerk) section — remove references to Supabase domains in CSP and Clerk JWT template
- GDPR Compliance section — update to reference Neon query helpers instead of Supabase sync functions
- Data Sharing section — no changes needed (still uses Upstash Redis)

## Data Migration

For any existing users with data in the Supabase `allotments` table, the data needs to be exported and imported into Neon. Given the current user count (effectively zero), this can be done manually:

1. Unpause the Supabase project
2. Export the `allotments` table as JSON or CSV
3. Import into the Neon `allotments` table
4. Verify data integrity
5. Remove the Supabase project

If there were significant users, a migration script would be warranted. For now, manual transfer (or simply letting users re-sync from localStorage) is sufficient.
