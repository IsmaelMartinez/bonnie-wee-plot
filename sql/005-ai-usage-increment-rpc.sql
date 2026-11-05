-- Bonnie Wee Plot: atomic, server-controlled AI usage increment (step 1 of 2)
-- Run this in the Supabase SQL Editor BEFORE deploying the code that calls
-- increment_ai_usage(). It is purely additive, so the currently deployed code
-- keeps working. Apply sql/006-ai-usage-lockdown.sql after the deploy.
--
-- increment_ai_usage() adds exactly one to the caller's own row for the
-- current UTC month in a single INSERT ... ON CONFLICT statement, replacing
-- the route's non-atomic SELECT-then-UPSERT. It takes the user id from the
-- JWT `sub`, so calling it directly only spends the caller's own quota and
-- exposing it as an RPC is safe; nothing can lower the counter.

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
