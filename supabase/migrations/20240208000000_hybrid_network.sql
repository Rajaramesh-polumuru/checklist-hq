-- Hybrid Network: Composable Checklists

-- Table for linking runs (Parent -> Child)
CREATE TABLE IF NOT EXISTS run_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ BEGIN
    ALTER TABLE run_links ADD COLUMN IF NOT EXISTS parent_run_id UUID REFERENCES runs(id) ON DELETE CASCADE;
    ALTER TABLE run_links ADD COLUMN IF NOT EXISTS child_run_id UUID REFERENCES runs(id) ON DELETE CASCADE;
    ALTER TABLE run_links ADD COLUMN IF NOT EXISTS parent_item_id TEXT;
    ALTER TABLE run_links ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add constraints separately
DO $$ BEGIN
    ALTER TABLE run_links ALTER COLUMN parent_item_id SET NOT NULL;
    ALTER TABLE run_links ADD CONSTRAINT run_links_parent_run_id_parent_item_id_key UNIQUE(parent_run_id, parent_item_id);
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if constraint already exists
END $$;

-- Enable RLS
ALTER TABLE run_links ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified: if you own the parent run, you control the link)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view run links for their runs" ON run_links;
  DROP POLICY IF EXISTS "Users can insert run links for their runs" ON run_links;
  DROP POLICY IF EXISTS "Users can delete run links for their runs" ON run_links;
END $$;

CREATE POLICY "Users can view run links for their runs"
  ON run_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM runs
      WHERE runs.id = run_links.parent_run_id
      AND runs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert run links for their runs"
  ON run_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM runs
      WHERE runs.id = parent_run_id
      AND runs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete run links for their runs"
  ON run_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM runs
      WHERE runs.id = parent_run_id
      AND runs.user_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_run_links_parent ON run_links(parent_run_id);
CREATE INDEX IF NOT EXISTS idx_run_links_child ON run_links(child_run_id);
