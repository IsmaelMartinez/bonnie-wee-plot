-- Bonnie Wee Plot: make the AI free-tier counter server-controlled and atomic
-- Run this in the Supabase SQL Editor against any project that has already
-- deployed sql/003-ai-usage.sql.
--
-- Background: 003 granted end users INSERT and UPDATE on their own ai_usage
-- row, so any signed-in user could PATCH request_count=0 through PostgREST
-- with the Clerk JWT already in the browser and reset their quota. The route
-- also incremented with a non-atomic SELECT-then-UPSERT.
--
-- After this script, end users can only SELECT their row (for the quota UI)
-- and call increment_ai_usage(), which adds exactly one to the caller's own
-- row for the current UTC month in a single INSERT ... ON CONFLICT statement.
-- Calling it directly only spends the caller's own quota, so exposing it as
-- an RPC is safe; nothing can lower the counter.

DROP POLICY IF EXISTS "Users can insert own ai_usage" ON ai_usage;
DROP POLICY IF EXISTS "Users can update own ai_usage" ON ai_usage;

CREATE OR REPLACE FUNCTION public.increment_ai_usage()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id text := auth.jwt() ->> 'sub';
  v_count integer;
BEGIN
  IF v_user_id IS NULL OR v_user_id = '' THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.ai_usage AS u (user_id, year_month, request_count, updated_at)
  VALUES (v_user_id, to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM'), 1, now())
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET request_count = u.request_count + 1, updated_at = now()
  RETURNING u.request_count INTO v_count;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_ai_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage() TO authenticated;
