-- Add metadata column to runs for Hybrid Network pipeline context
ALTER TABLE runs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
