# Authentication & Database Integration Design

## Goal

Add opt-in user authentication (Clerk) and cloud persistence (Supabase) to Bonnie Wee Plot while preserving the existing offline-first, zero-friction anonymous experience. Authenticated users get continuous sync between localStorage and Supabase with last-write-wins conflict resolution.

## Decisions

These decisions were made during the brainstorming session:

- Dual-mode: anonymous users keep localStorage, signed-in users get cloud sync
- Continuous sync (not one-time import): localStorage stays as offline cache, Supabase syncs in background
- JSONB document per user (not normalized tables): mirrors current localStorage blob for simplest migration
- Last-write-wins conflict resolution on `updated_at` timestamp
- GDPR compliance included (data export + account deletion)
- Phases 6+7 implemented together (auth + database as one body of work)
- Vector database (pgvector) deferred to Phase 8

## Reference Projects

- `betis-escocia`: Clerk 6.36.2 + Supabase 2.87.1 integration patterns (ClerkProvider, JWT template, RLS, createApiHandler)
- `github-issue-triage-bot`: pgvector + Gemini embeddings pattern (deferred to Phase 8)

---

## Section 1: Authentication (Clerk)

ClerkProvider wraps the app at the root layout level. The middleware extends the existing CSP security headers with Clerk's `clerkMiddleware`. All current routes remain public — no page requires authentication. Auth is opt-in: users see a "Sign in" link in the navigation and a subtle prompt on the Today dashboard ("Sign in to sync across devices").

Pages that stay fully public: Today, This Month, Seeds, Compost, Allotment, Plants, About. The Settings page gains a new "Account" tab for signed-in users (manage account, delete account, export data). Sign-in and sign-up pages at `/sign-in` and `/sign-up` use Clerk's pre-built components styled to match the Zen design system.

API routes: the existing ai-advisor, share, and health endpoints remain public (they use BYOK tokens or are anonymous). New Supabase sync endpoints (`/api/sync`) require authentication.

CSP expands to allow Clerk domains and Supabase domains.

### Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Section 2: Database Schema (Supabase)

A single `allotments` table stores the entire AllotmentData blob as JSONB per user:

```sql
CREATE TABLE allotments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE allotments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own allotment"
  ON allotments FOR ALL
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');
```

The `updated_at` column is the LWW timestamp for conflict resolution. A Clerk JWT template named "supabase" maps the Clerk user ID to the `sub` claim, which Supabase RLS validates automatically (same pattern as betis-escocia).

The Supabase client setup follows the betis-escocia pattern: an anonymous client for unauthenticated operations and an authenticated client created with the user's Clerk JWT for RLS-protected operations.

---

## Section 3: Storage Provider & Continuous Sync

This is the core architectural piece. A `useSyncedStorage` hook wraps the existing `usePersistedStorage` and adds cloud sync when authenticated.

### Layer Architecture

```
useAllotment (unchanged API surface)
  └── useAllotmentData
        └── useSyncedStorage (NEW - orchestrator)
              ├── usePersistedStorage (existing, localStorage - always active)
              └── useSupabaseSync (NEW - cloud operations, active when auth'd)
```

### Sync Behaviour

The `useSyncedStorage` hook always delegates to `usePersistedStorage` for local reads/writes (keeping the offline-first behaviour). When the user is authenticated, it additionally:

On initial load: fetches the Supabase document, compares `updated_at` timestamps with the localStorage copy. If cloud is newer, it overwrites local. If local is newer (user edited offline), it pushes local to cloud. If no cloud document exists (first sign-in), it uploads the current localStorage data.

On every save: after the localStorage debounced write completes, an async push sends the data to Supabase. This doesn't block the UI — if the push fails (offline), it's retried on next save or on reconnect.

On reconnect: when `justReconnected` (from `useNetworkStatus`) becomes true, trigger a sync cycle (fetch cloud, compare timestamps, resolve with LWW).

### useSupabaseSync Hook

Handles all Supabase operations: `fetchRemote()`, `pushToRemote(data)`, and `deleteRemote()`. Uses the authenticated Supabase client from the Clerk JWT. Exposes sync status (`syncing`, `synced`, `error`, `offline`) for UI feedback.

### UI Feedback

The existing SaveIndicator pattern extends to show cloud sync status. When signed in, a small cloud icon near the save indicator shows sync state (synced, syncing, error).

### Key Property

`useAllotment`'s external API doesn't change at all. Every component that calls `useAllotment` continues to work exactly as before. The sync is invisible to consumers.

---

## Section 4: GDPR Compliance

Two authenticated API endpoints:

- `GET /api/account/export` — returns the user's full AllotmentData as a JSON download
- `DELETE /api/account` — deletes the Supabase row and triggers Clerk account deletion via the Clerk Backend API

Both require valid Clerk JWT. The delete endpoint cascades: Supabase row deletion first, then Clerk account deletion. localStorage is cleared client-side after deletion confirmation.

---

## Section 5: File Structure

### New Files

```
src/lib/supabase/
  client.ts              -- createAnonClient(), createAuthClient(token)
  sync.ts                -- fetchRemote(), pushToRemote(), deleteRemote()

src/hooks/
  useSyncedStorage.ts    -- orchestrates localStorage + Supabase sync
  useSupabaseSync.ts     -- Supabase-specific operations

src/app/
  sign-in/[[...rest]]/page.tsx   -- Clerk sign-in page
  sign-up/[[...rest]]/page.tsx   -- Clerk sign-up page
  api/sync/route.ts              -- sync endpoint (authenticated)
  api/account/route.ts           -- GDPR export (GET) + deletion (DELETE)

src/components/auth/
  SignInPrompt.tsx        -- "Sign in to sync" prompt for dashboard
  SyncStatusIcon.tsx      -- Cloud sync indicator
  AccountSection.tsx      -- Settings account tab content

sql/
  001-allotments.sql      -- Supabase schema + RLS policies
```

### Modified Files

```
src/middleware.ts                        -- Add clerkMiddleware + CSP expansion
src/app/layout.tsx                       -- Wrap with ClerkProvider
src/components/Navigation.tsx            -- Add UserButton / Sign In link
src/hooks/allotment/useAllotmentData.ts  -- Switch to useSyncedStorage
src/app/settings/page.tsx                -- Add Account tab
.env.local.example                       -- Add Clerk + Supabase env vars
```

---

## Section 6: Testing Strategy

Unit tests for `useSyncedStorage` and `useSupabaseSync` using mocked Supabase client and mocked auth state. Test cases:

- Anonymous mode: localStorage only, no Supabase calls
- Authenticated first load: cloud fetch + timestamp comparison + merge
- Offline save: localStorage write only, Supabase call skipped
- Reconnect sync cycle: fetch cloud, compare, resolve LWW
- LWW conflict resolution: cloud wins (cloud newer), local wins (local newer)
- First-time import: no cloud document, upload localStorage data
- GDPR deletion: Supabase row deleted, Clerk account deleted

E2E tests: existing tests continue passing since auth is opt-in and the anonymous path is unchanged. No new E2E tests for auth flows (Clerk/Supabase mocking in Playwright is impractical).

---

## Future: Phase 8 (Vector Database)

The `allotments` table sits alongside future pgvector tables. When Phase 8 adds multi-provider AI and semantic search, a `documents` table with `embedding vector(768)` will store plant care tips, companion data, and plant descriptions. The Supabase client infrastructure from this phase will be reused.
