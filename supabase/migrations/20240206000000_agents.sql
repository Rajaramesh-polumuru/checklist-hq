-- =============================================
-- AI Agents Schema
-- =============================================

-- Agent types enum
CREATE TYPE agent_type AS ENUM ('claude', 'custom', 'webhook');

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  agent_type agent_type NOT NULL DEFAULT 'claude',
  capabilities TEXT[] DEFAULT NULL,
  api_key_hash TEXT DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT NULL
);

-- Agent team memberships (which teams an agent can access)
CREATE TABLE agent_team_memberships (
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_id, team_id)
);

-- Indexes
CREATE INDEX idx_agents_organization ON agents(organization_id);
CREATE INDEX idx_agents_created_by ON agents(created_by);
CREATE INDEX idx_agent_team_memberships_agent ON agent_team_memberships(agent_id);
CREATE INDEX idx_agent_team_memberships_team ON agent_team_memberships(team_id);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_team_memberships ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for agents
-- =============================================

-- Organization members can view agents in their organization
CREATE POLICY "Organization members can view agents"
  ON agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = agents.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Organization admins/owners can create agents
CREATE POLICY "Organization admins can create agents"
  ON agents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = agents.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Organization admins/owners can update agents
CREATE POLICY "Organization admins can update agents"
  ON agents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = agents.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Organization admins/owners can delete agents
CREATE POLICY "Organization admins can delete agents"
  ON agents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = agents.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- =============================================
-- RLS Policies for agent_team_memberships
-- =============================================

-- Organization members can view agent team memberships
CREATE POLICY "Organization members can view agent team memberships"
  ON agent_team_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE a.id = agent_team_memberships.agent_id
      AND om.user_id = auth.uid()
    )
  );

-- Organization admins can manage agent team memberships
CREATE POLICY "Organization admins can insert agent team memberships"
  ON agent_team_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE a.id = agent_team_memberships.agent_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can delete agent team memberships"
  ON agent_team_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE a.id = agent_team_memberships.agent_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );
