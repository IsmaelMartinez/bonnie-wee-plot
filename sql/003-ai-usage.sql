-- Bonnie Wee Plot: per-user AI request counter
-- Run this in Supabase SQL Editor after sql/001-allotments.sql.
--
-- Tracks how many requests each signed-in user has made to the Aitor route
-- per calendar month. Used to enforce a free-tier quota when the request
-- falls back to the server-side Gemini key (no BYO OpenAI token). BYO-key
-- requests bypass this table entirely — the user is paying their own bill.
--
-- The composite primary key on (user_id, year_month) means an UPSERT is the
-- natural insert pattern: ON CONFLICT increments the counter atomically.

CREATE TABLE ai_usage (
  user_id TEXT NOT NULL,
  -- ISO-style year-month, e.g. "2026-05". Stored as text rather than a
  -- date so the month boundary is unambiguous regardless of timezone.
  year_month TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, year_month)
);

CREATE INDEX idx_ai_usage_user ON ai_usage (user_id);

-- Row Level Security: users can read their own row to render the quota UI.
-- Writes happen only via the API route (server-side, with the service role
-- if needed) — no INSERT/UPDATE policy for end users.
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ai_usage"
  ON ai_usage FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Allow the route to upsert via the user's authenticated client. The route
-- runs server-side with the user's Clerk JWT, so the auth.jwt() check
-- prevents one user from incrementing another user's counter.
CREATE POLICY "Users can insert own ai_usage"
  ON ai_usage FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own ai_usage"
  ON ai_usage FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Optional retention: rows older than 12 months are useless for the quota
-- calculation. Drop manually or via a scheduled job if the table ever grows
-- large enough to matter. Left commented for now.
-- DELETE FROM ai_usage
-- WHERE year_month < to_char(now() - INTERVAL '12 months', 'YYYY-MM');
