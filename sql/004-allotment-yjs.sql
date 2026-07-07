-- Bonnie Wee Plot: Yjs binary cloud transport (ADR 027 Step 4)
-- Run this in the Supabase SQL Editor after sql/001-allotments.sql and
-- sql/002-allotment-history.sql.
--
-- Step 4 moves the cloud copy from "full-JSON + last-write-wins" to the Yjs
-- document exchanged as *binary* CRDT state. JSONB cannot hold raw binary, so
-- the encoded doc lives in a new BYTEA column alongside the existing JSONB.
--
-- Design (see docs/runbooks/adr-027-step-4-yjs-binary-migration.md):
--   * `yjs_state`       — the authoritative merge transport: the full Yjs doc
--                         encoded via Y.encodeStateAsUpdate. Clients pull it,
--                         Y.applyUpdate-merge it into their local doc, and push
--                         the merged state back. Concurrent edits merge instead
--                         of one side winning.
--   * `yjs_updated_at`  — optimistic-concurrency (compare-and-swap) token. A
--                         push only lands if this column still matches what the
--                         client last read; otherwise the client re-pulls,
--                         re-merges, and retries. This serialises the one-shot
--                         migration to a single canonical document lineage.
--   * `data` (JSONB)    — KEPT as a derived read-only mirror. On every push the
--                         client also writes data = serializeToJson(mergedDoc).
--                         This keeps the allotment_history trigger, the GDPR
--                         export endpoint, and Supabase Studio inspection working
--                         unchanged, and makes the per-user cut-over reversible.
--
-- The BEFORE-UPDATE history trigger from sql/002 is unaffected: it archives
-- OLD.data (JSONB), which every push still writes.

ALTER TABLE allotments
  ADD COLUMN IF NOT EXISTS yjs_state BYTEA,
  ADD COLUMN IF NOT EXISTS yjs_updated_at TIMESTAMPTZ;

-- No new RLS policies are required: the existing per-row policies on
-- `allotments` (sql/001) already gate SELECT/INSERT/UPDATE/DELETE by
-- user_id = auth.jwt() ->> 'sub', which covers the new columns.

-- Pre-migration history seeding (runbook step): fire the BEFORE-UPDATE trigger
-- once per active user so every user has a recovery point that predates the
-- Yjs cut-over. This is a no-op at the data level (data = data) but the trigger
-- from sql/002 archives the pre-migration row into allotment_history.
--
--   UPDATE allotments SET data = data;
--
-- Run the line above AFTER adding the columns and BEFORE deploying the Step 4
-- client code. Verify with:
--
--   SELECT count(*) FROM allotment_history;   -- should grow by ~1 per user
--
-- The actual JSONB -> binary conversion is performed lazily, per user, by the
-- client on its next authenticated sync (see useCloudSync): if yjs_state IS
-- NULL it hydrates a Yjs doc from data, encodes it, and CAS-writes yjs_state.
-- No server-side backfill script is needed.
