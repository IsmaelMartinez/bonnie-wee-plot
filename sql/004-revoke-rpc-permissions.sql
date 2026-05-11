-- Bonnie Wee Plot: revoke PostgREST RPC surface on archive trigger function
-- Run this in the Supabase SQL Editor against any project that has already
-- deployed sql/002-allotment-history.sql.
--
-- Background: `public.archive_allotment_before_update()` is SECURITY DEFINER
-- (it has to be, to insert into `allotment_history` past RLS). The function
-- is only meant to fire via the BEFORE UPDATE trigger on `allotments`, but
-- by default Supabase exposes any function in the `public` schema as a
-- PostgREST RPC at `/rest/v1/rpc/<name>`. The Supabase security advisor
-- flags this (lints 0028 + 0029).
--
-- Triggers run with the table owner's privileges regardless of the function
-- ACL, so revoking EXECUTE from PUBLIC / anon / authenticated does NOT break
-- the trigger — it only closes the RPC surface.

REVOKE EXECUTE ON FUNCTION public.archive_allotment_before_update()
  FROM PUBLIC, anon, authenticated;
