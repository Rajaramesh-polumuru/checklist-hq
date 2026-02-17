-- Enterprise Audit Logging

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Safely add columns if they don't exist
DO $$ BEGIN
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id);
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS event_type TEXT;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_type TEXT;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id UUID;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Enforce constraints (idempotent)
-- We use a separate block or statement because modifying column type/constraints can fail if data violates it.
-- Assuming table is new or clean for these migrations.
DO $$ BEGIN
    ALTER TABLE audit_logs ALTER COLUMN event_type SET NOT NULL;
    ALTER TABLE audit_logs ALTER COLUMN resource_type SET NOT NULL;
    ALTER TABLE audit_logs ALTER COLUMN resource_id SET NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if fails (e.g. data exists that is null)
END $$;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Org admins can view audit logs" ON audit_logs;
  DROP POLICY IF EXISTS "Users can insert audit logs" ON audit_logs;
END $$;

-- Admins can view logs
CREATE POLICY "Org admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = audit_logs.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Users can insert logs (Client-side logging for MVP)
CREATE POLICY "Users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() = actor_id AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = audit_logs.organization_id
      AND user_id = auth.uid()
    )
  );

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
