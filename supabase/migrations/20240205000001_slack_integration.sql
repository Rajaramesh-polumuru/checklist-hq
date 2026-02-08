/*
  Phase 6: Slack Integration
  
  Implements Slack workspace connections and notification delivery.
*/

-- ============================================
-- 1. SLACK CONNECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.slack_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Slack workspace info
    slack_team_id TEXT NOT NULL,           -- e.g., "T1234567890"
    slack_team_name TEXT NOT NULL,         -- e.g., "Acme Corp"
    slack_channel_id TEXT NOT NULL,        -- e.g., "C1234567890"
    slack_channel_name TEXT NOT NULL,      -- e.g., "checklist-hq"
    
    -- OAuth tokens (encrypted at rest in Supabase)
    bot_token TEXT NOT NULL,               -- xoxb-...
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_tested_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One connection per team per org/user
    UNIQUE(organization_id, slack_team_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slack_connections_user ON public.slack_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_slack_connections_org ON public.slack_connections(organization_id);

-- RLS
ALTER TABLE public.slack_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own Slack connections
CREATE POLICY "Users can view own slack connections" ON public.slack_connections
    FOR SELECT USING (user_id = auth.uid());

-- Users can create connections
CREATE POLICY "Users can create slack connections" ON public.slack_connections
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Org admins can manage org connections
CREATE POLICY "Org admins manage slack connections" ON public.slack_connections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = slack_connections.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 2. SLACK NOTIFICATION SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.slack_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    slack_connection_id UUID REFERENCES public.slack_connections(id) ON DELETE CASCADE NOT NULL,
    
    -- Link to repo or org
    repository_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Events to notify on
    events TEXT[] NOT NULL,  -- e.g., ['run.completed', 'run.started']
    
    -- Message format/template
    include_details BOOLEAN DEFAULT true,
    mention_user BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT slack_notif_parent_check CHECK (
        (repository_id IS NOT NULL AND organization_id IS NULL) OR
        (repository_id IS NULL AND organization_id IS NOT NULL)
    )
);

-- RLS
ALTER TABLE public.slack_notifications ENABLE ROW LEVEL SECURITY;

-- Repo owners and org admins can manage
CREATE POLICY "Manage slack notifications" ON public.slack_notifications
    USING (
        EXISTS (
            SELECT 1 FROM public.repositories r
            WHERE r.id = slack_notifications.repository_id
            AND r.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = slack_notifications.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );
