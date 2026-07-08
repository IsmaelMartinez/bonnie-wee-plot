# Runbook — ADR 027 Step 4: Yjs binary cloud transport

Moves the cloud copy from Supabase JSONB + last-write-wins to the Yjs document
exchanged as **binary CRDT state**. Concurrent edits merge (`Y.applyUpdate`)
instead of one side overwriting the other, and the LWW machinery is retired.

Transport decision: the existing Vercel/Supabase request/response shape is kept
(no Cloudflare Durable Objects). Sync is *pull → merge → push* with
optimistic-concurrency retry. Not real-time, but conflict-free and LWW-free.

## What ships in the code

- `sql/004-allotment-yjs.sql` — adds `yjs_state BYTEA` and `yjs_updated_at
  TIMESTAMPTZ` to `allotments`.
- `src/lib/supabase/sync-binary.ts` — `fetchRemoteBinary`, `pushBinary`
  (CAS + retry), and the bytea hex codec.
- `useCloudSync` — reworked to adopt/merge binary state; the conflict dialog,
  `contentSnapshot`, and `isLocalStructurallySmaller` are gone.
- `allotments.data` JSONB is **kept** as a derived mirror: every push writes
  `data = serializeToJson(mergedDoc)`, so the history trigger, GDPR export, and
  Studio inspection keep working unchanged.

## Pre-deploy steps (Supabase SQL Editor)

Run in order **before** deploying the Step 4 client build.

1. Add the columns:

   ```sql
   ALTER TABLE allotments
     ADD COLUMN IF NOT EXISTS yjs_state BYTEA,
     ADD COLUMN IF NOT EXISTS yjs_updated_at TIMESTAMPTZ;
   ```

   (This is the body of `sql/004-allotment-yjs.sql`.)

2. Confirm the history trigger from `sql/002-allotment-history.sql` is still
   attached (it must fire the pre-migration snapshot):

   ```sql
   SELECT tgname FROM pg_trigger
   WHERE tgrelid = 'allotments'::regclass AND NOT tgisinternal;
   -- expect: trg_archive_allotment_before_update
   ```

3. Seed one pre-migration history row per user (fires the BEFORE-UPDATE
   trigger; a no-op at the data level):

   ```sql
   SELECT count(*) FROM allotment_history;          -- note the before count
   UPDATE allotments SET data = data;               -- fires the trigger per row
   SELECT count(*) FROM allotment_history;          -- should grow by ~1 per allotment
   ```

   Every active user now has a recovery point that predates the cut-over.

## Deploy

Deploy the Step 4 client build. No feature flag — the new sync path is
unconditional for signed-in users.

## What each user's first sync does (automatic, lazy migration)

On a signed-in user's next sync, per device:

- **Cloud row has `yjs_state` (already migrated):** the device *adopts* the
  canonical lineage (loads the cloud binary into a fresh doc that replaces the
  seeded local one, resetting IndexedDB) — a one-time step so every device
  shares one document lineage (a prerequisite for duplicate-free CRDT merge,
  since Step 3/5 hydrated each device's local doc independently). Thereafter it
  merges.
- **Cloud row has JSONB only (`yjs_state IS NULL`):** the device migrates —
  hydrates a doc from `data`, encodes it, and CAS-writes `yjs_state`. If two
  devices race, the CAS serialises them to one lineage; the loser re-fetches and
  adopts the winner's binary.
- **No cloud row:** the device pushes its local doc as the canonical document.

No server-side backfill script is required.

## Verify (post-deploy)

- Sign in on device A, make an edit, confirm `allotments.yjs_state` is populated
  and `data` (JSONB) still reflects the latest content.
- Sign in on device B (same account): it should show device A's data with no
  duplicated areas/plantings/varieties.
- Edit different things on A and B while both are online; after both sync, both
  converge to the union (no "choose a version" dialog).
- GDPR export: `GET /api/account` still returns JSON (from the `data` mirror).
- Settings → Data → cloud history still lists snapshots and restores.

## Verifying the BYTEA round-trip against real PostgREST

The unit suite mocks the Supabase client, so it proves the hex codec is
internally consistent but **not** that a `bytea` column survives PostgREST's
wire encoding byte-identically. That gap is closed by a guarded integration
test, `src/__tests__/integration/bytea-roundtrip.integration.test.ts`, which
drives the real `pushBinary` / `fetchRemoteBinary` (→ `@supabase/supabase-js` →
PostgREST) against a live Postgres+PostgREST stack. It is skipped unless
`BYTEA_REST_URL` is set, so it never runs in normal `npm run test:unit` / CI.

**Result of running it (2026-07): the BYTEA hex round-trip works byte-identical.
No PostgREST bytea surprise; the base64-text fallback below is NOT needed.** The
test also confirms: the JSONB mirror is preserved, the `yjs_updated_at` CAS
token advances on update and rejects a stale token, the lazy JSONB→binary
migration seeds `yjs_state` via the `IS NULL` predicate, and two racing
migrations serialise to one lineage (one wins, one gets `casConflict`).

To run it against a disposable local stack (Docker required):

```bash
# 1. Postgres with the production schema (sql/001 + sql/004) and Supabase-shaped
#    roles + auth.jwt(); PostgREST in front with a known JWT secret.
docker run -d --name pg -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:16-alpine
#    (apply sql/001 + sql/004, create anon/authenticated/authenticator roles and
#     an auth.jwt() = current_setting('request.jwt.claims') helper)
docker run -d --name pgrst -p 33000:3000 \
  -e PGRST_DB_URI="postgres://authenticator:authpass@pg:5432/postgres" \
  -e PGRST_DB_ANON_ROLE=anon -e PGRST_JWT_SECRET="<secret>" postgrest/postgrest:v12.2.3

# 2. `@supabase/supabase-js` ALWAYS appends `/rest/v1` to the base URL (the real
#    Supabase REST path), but PostgREST serves tables at root — so point the
#    client at a tiny proxy that strips `/rest/v1` (or a gateway that maps it).
#    BYTEA_REST_URL is that proxied base (e.g. http://localhost:33001).

# 3. Mint an HS256 JWT whose `sub` == BYTEA_REST_USER_ID and `role` ==
#    "authenticated", signed with PGRST_JWT_SECRET. Then:
BYTEA_REST_URL=http://localhost:33001 BYTEA_REST_ANON_KEY=anon \
BYTEA_REST_JWT="<jwt>" BYTEA_REST_USER_ID=<sub> \
  npx vitest run src/__tests__/integration/bytea-roundtrip.integration.test.ts
```

Notes learned while wiring this up:
- The integration test must run in the **node** vitest environment
  (`// @vitest-environment node` at the top of the file) — jsdom's fetch fails
  against a local PostgREST.
- Against a real Supabase project you can set `BYTEA_REST_URL` directly to the
  project REST URL (`https://<ref>.supabase.co`) and mint the JWT with the
  Supabase JWT secret; no proxy needed there because Supabase already serves
  `/rest/v1`. Use a throwaway `user_id` and delete the row afterwards (the test
  cleans up its own `BYTEA_REST_USER_ID` row).

## Verifying cross-device merge end-to-end (Playwright)

`tests/cloud-sync-merge.spec.ts` runs the real cross-device merge in two browser
contexts against an in-memory Supabase REST stub (`tests/utils/supabase-stub.ts`,
shared `yjs_state` + `yjs_updated_at`): device A and device B sign in as the same
user, each makes a different edit **offline**, both reconnect and sync, and both
converge to the union with no duplicated areas and no lost `meta`.

It needs a **test-mode production build** with Supabase env present (values are
arbitrary — every REST call is intercepted by the stub):

```bash
NEXT_PUBLIC_PLAYWRIGHT_TEST_MODE=true \
NEXT_PUBLIC_SUPABASE_URL=https://stub.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=stub-anon-key \
  npm run build
CI=1 npx playwright test cloud-sync-merge.spec.ts
```

The spec **skips itself** (via `window.__bwpTest.cloudConfigured`) if the build
lacks Supabase env, so the rest of the suite is unaffected when it is absent.
Auth in test mode is a strictly-gated stub in `useOptionalAuth` (Clerk is never
involved); `NEXT_PUBLIC_PLAYWRIGHT_TEST_MODE` must be `false`/unset in real
builds. If the environment's Chromium revision differs from the one
`@playwright/test` pins, run `scripts/pw-browser-symlink.sh` first (symlinks the
pinned revision onto the installed build — no download).

## Rollback

Because `data` JSONB is kept current on every push, rollback is a redeploy of
the pre-Step-4 build — the JSONB LWW path resumes against up-to-date data. The
`yjs_state` column can be left in place (ignored by the old build). The
`allotment_history` table remains the defensive recovery net throughout.

## Notes / limits

- `yjs_state` is stored as `BYTEA` and travels over PostgREST as a `\x…` hex
  string; the codec lives in `sync-binary.ts`. This has been **verified
  byte-identical against real PostgREST** (see "Verifying the BYTEA round-trip"
  above), so the round-trip is sound as shipped. If a future PostgREST/Supabase
  change ever makes bytea round-tripping awkward, the fallback is a `text` column
  holding base64 — a one-line column-type change plus swapping the codec.
- Real-time propagation is out of scope (a device sees another's edits on its
  next pull, as with the previous 30s-debounced model). Cloudflare Durable
  Objects hosting y-websocket remains the documented path if real-time is ever
  required (ADR 027 transport survey).
