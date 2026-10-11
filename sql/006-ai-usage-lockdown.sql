-- Bonnie Wee Plot: remove end-user writes on ai_usage (step 2 of 2)
-- Run this in the Supabase SQL Editor AFTER sql/005-ai-usage-increment-rpc.sql
-- is applied and the code calling increment_ai_usage() is deployed. Applying
-- it earlier breaks the old code's direct upsert.
--
-- sql/003-ai-usage.sql granted end users INSERT and UPDATE on their own row,
-- so any signed-in user could PATCH request_count=0 through PostgREST with the
-- Clerk JWT already in the browser and reset their free-tier quota. After this
-- script end users can only SELECT their row (for the quota UI); increments go
-- through the SECURITY DEFINER increment_ai_usage() RPC.

DROP POLICY IF EXISTS "Users can insert own ai_usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can update own ai_usage" ON public.ai_usage;

-- Defence in depth: remove the table-level write grants too, so a future
-- permissive policy cannot silently reopen the hole.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ai_usage FROM anon, authenticated;
