-- Bonnie Wee Plot: Allotment cloud storage
-- Run this in Supabase SQL Editor after creating project

CREATE TABLE allotments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user lookups
CREATE INDEX idx_allotments_user_id ON allotments (user_id);

-- Row Level Security: users can only access their own row
ALTER TABLE allotments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own allotment"
  ON allotments FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own allotment"
  ON allotments FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own allotment"
  ON allotments FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own allotment"
  ON allotments FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');
