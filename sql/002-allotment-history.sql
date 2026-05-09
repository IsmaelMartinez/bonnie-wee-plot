-- Bonnie Wee Plot: Allotment cloud history
-- Run this in Supabase SQL Editor after sql/001-allotments.sql.
--
-- Adds a server-side audit/history table that captures every UPDATE to
-- `allotments` BEFORE it lands. This gives us a recovery path when sync
-- silently overwrites cloud data (see the 2026-05-08 incident) and is
-- worth keeping regardless of which sync architecture we end up with.

CREATE TABLE allotment_history (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Most queries are "give me this user's recent snapshots in reverse order".
CREATE INDEX idx_allotment_history_user_archived
  ON allotment_history (user_id, archived_at DESC);

-- Row Level Security: users can only see their own history.
ALTER TABLE allotment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own history"
  ON allotment_history FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own history"
  ON allotment_history FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- Trigger function: archive the existing row before any UPDATE on `allotments`.
-- SECURITY DEFINER so the insert runs with the table owner's rights, bypassing
-- the user's RLS — the only policy that lets users INSERT into history is via
-- this trigger, never directly.
CREATE OR REPLACE FUNCTION archive_allotment_before_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- COALESCE guards the archive timestamp against a NULL OLD.updated_at.
  -- The current schema has updated_at NOT NULL DEFAULT now() so this is
  -- impossible today, but defence in depth keeps the trigger working if
  -- that constraint is ever relaxed.
  INSERT INTO allotment_history (user_id, data, archived_at)
  VALUES (OLD.user_id, OLD.data, COALESCE(OLD.updated_at, now()));
  RETURN NEW;
END;
$$;

-- If you've already deployed an earlier version of this trigger, re-run the
-- CREATE OR REPLACE FUNCTION block above on its own. Postgres swaps the
-- function in place and the existing trigger picks up the new body
-- automatically — no need to drop and recreate the trigger.

CREATE TRIGGER trg_archive_allotment_before_update
  BEFORE UPDATE ON allotments
  FOR EACH ROW
  EXECUTE FUNCTION archive_allotment_before_update();

-- Retention: keep at most the most recent 50 snapshots per user, and at
-- most 90 days of history. Run this periodically (Supabase scheduled
-- function, pg_cron, or simply re-run manually).
--
-- For now, prefer letting history grow — recovery value is highest in the
-- first weeks after the incident. Tighten retention later once we're sure
-- no one needs an older restore.
--
-- Example trim (leave commented for now):
-- DELETE FROM allotment_history h
-- WHERE archived_at < now() - INTERVAL '90 days'
--    OR id IN (
--      SELECT id FROM (
--        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY archived_at DESC) AS rn
--        FROM allotment_history
--      ) ranked
--      WHERE rn > 50
--    );
