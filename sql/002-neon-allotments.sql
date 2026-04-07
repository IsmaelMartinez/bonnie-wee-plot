-- Bonnie Wee Plot: Allotment cloud storage (Neon)
-- Run this in the Neon SQL Editor after creating the database.
-- Auth is enforced at the API route level via Clerk — no RLS needed.

CREATE TABLE allotments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_allotments_user_id ON allotments (user_id);
