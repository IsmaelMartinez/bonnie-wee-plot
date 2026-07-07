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
  canonical lineage (clears its local seed, applies the cloud binary) — a
  one-time step so every device shares one document lineage (a prerequisite for
  duplicate-free CRDT merge, since Step 3/5 hydrated each device's local doc
  independently). Thereafter it merges.
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

## Rollback

Because `data` JSONB is kept current on every push, rollback is a redeploy of
the pre-Step-4 build — the JSONB LWW path resumes against up-to-date data. The
`yjs_state` column can be left in place (ignored by the old build). The
`allotment_history` table remains the defensive recovery net throughout.

## Notes / limits

- `yjs_state` is stored as `BYTEA` and travels over PostgREST as a `\x…` hex
  string; the codec lives in `sync-binary.ts`. If a future PostgREST/Supabase
  change makes bytea round-tripping awkward, the fallback is a `text` column
  holding base64 — a one-line column-type change plus swapping the codec.
- Real-time propagation is out of scope (a device sees another's edits on its
  next pull, as with the previous 30s-debounced model). Cloudflare Durable
  Objects hosting y-websocket remains the documented path if real-time is ever
  required (ADR 027 transport survey).
