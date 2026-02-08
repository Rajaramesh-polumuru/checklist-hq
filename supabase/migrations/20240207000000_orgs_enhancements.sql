/*
  ORGS.md Enhancements Migration

  Adds missing features from the multi-tenant architecture:
  1. Polymorphic repository ownership (owner_type, team_id)
  2. Team/org context on runs
  3. Activity table for feeds
  4. Notifications table for in-app notifications
*/

-- ============================================
-- 1. REPOSITORY POLYMORPHIC OWNERSHIP
-- ============================================
-- Add owner_type to distinguish between user, team, and org owned repos

ALTER TABLE public.repositories
ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'user'
  CHECK (owner_type IN ('user', 'team', 'org'));

ALTER TABLE public.repositories
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Index for team repositories
CREATE INDEX IF NOT EXISTS idx_repos_team ON public.repositories(team_id)
  WHERE team_id IS NOT NULL;

-- Index for owner type queries
CREATE INDEX IF NOT EXISTS idx_repos_owner_type ON public.repositories(owner_type, owner_id);

COMMENT ON COLUMN public.repositories.owner_type IS 'Polymorphic ownership: user, team, or org';
COMMENT ON COLUMN public.repositories.team_id IS 'Team that owns/manages this repo (if team-owned)';

-- ============================================
-- 2. RUNS TEAM/ORG CONTEXT
-- ============================================
-- Add team and org context to runs for proper scoping

ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Indexes for team/org run queries
CREATE INDEX IF NOT EXISTS idx_runs_team ON public.runs(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_runs_org ON public.runs(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_runs_team_status ON public.runs(team_id, status) WHERE team_id IS NOT NULL;

COMMENT ON COLUMN public.runs.team_id IS 'Team context for this run (inherited from repo or explicit)';
COMMENT ON COLUMN public.runs.organization_id IS 'Organization context for this run';

-- ============================================
-- 3. ACTIVITY TABLE (for UI feeds)
-- ============================================
-- Separate from audit_logs - optimized for activity feed display

CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Context
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,

    -- Actor
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    actor_type TEXT DEFAULT 'human' CHECK (actor_type IN ('human', 'agent', 'system')),

    -- Action
    action TEXT NOT NULL,

    -- Target resource
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    resource_name TEXT,

    -- Additional context
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_team ON public.activities(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_actor ON public.activities(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_action ON public.activities(action);
CREATE INDEX IF NOT EXISTS idx_activities_created ON public.activities(created_at DESC);

-- RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Org members can view org activities
DROP POLICY IF EXISTS "Org members view activities" ON public.activities;
CREATE POLICY "Org members view activities" ON public.activities
    FOR SELECT USING (
        organization_id IS NULL
        OR public.is_org_member(organization_id)
    );

-- Team members can view team activities
DROP POLICY IF EXISTS "Team members view team activities" ON public.activities;
CREATE POLICY "Team members view team activities" ON public.activities
    FOR SELECT USING (
        team_id IS NULL
        OR public.is_team_member(team_id)
    );

COMMENT ON TABLE public.activities IS 'Activity feed for organizations and teams - optimized for UI display';

-- ============================================
-- 4. NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Recipient
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Notification type
    type TEXT NOT NULL CHECK (type IN (
        'run_completed', 'run_failed', 'run_assigned',
        'mention', 'comment',
        'team_invite', 'org_invite',
        'repo_shared', 'repo_forked',
        'system'
    )),

    -- Content
    title TEXT NOT NULL,
    message TEXT,

    -- Action link
    action_url TEXT,

    -- Related resource
    resource_type TEXT,
    resource_id UUID,

    -- State
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read_at)
    WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(user_id, type);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark read, archive)
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own notifications
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications
    FOR DELETE USING (user_id = auth.uid());

COMMENT ON TABLE public.notifications IS 'In-app notifications for users';

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id, type, title, message, action_url, resource_type, resource_id
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_action_url, p_resource_type, p_resource_id
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$;

-- Function to log an activity
CREATE OR REPLACE FUNCTION public.log_activity(
    p_organization_id UUID,
    p_team_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID,
    p_resource_name TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO public.activities (
        organization_id, team_id, actor_id, action,
        resource_type, resource_id, resource_name, metadata
    ) VALUES (
        p_organization_id, p_team_id, auth.uid(), p_action,
        p_resource_type, p_resource_id, p_resource_name, p_metadata
    ) RETURNING id INTO v_activity_id;

    RETURN v_activity_id;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COUNT(*)::integer
    FROM public.notifications
    WHERE user_id = auth.uid()
    AND read_at IS NULL
    AND archived_at IS NULL;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET read_at = NOW()
    WHERE user_id = auth.uid()
    AND read_at IS NULL
    RETURNING 1 INTO v_count;

    RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================
-- 6. UPDATE EXISTING RLS POLICIES
-- ============================================

-- Team members can view team-owned repositories
DROP POLICY IF EXISTS "Team members can view team repos" ON public.repositories;
CREATE POLICY "Team members can view team repos"
ON public.repositories FOR SELECT
USING (
    team_id IS NOT NULL
    AND public.is_team_member(team_id)
);

-- Org members can view org-owned repositories
DROP POLICY IF EXISTS "Org members can view org repos" ON public.repositories;
CREATE POLICY "Org members can view org repos"
ON public.repositories FOR SELECT
USING (
    organization_id IS NOT NULL
    AND public.is_org_member(organization_id)
);

-- ============================================
-- 7. ENABLE REALTIME
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'activities'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

COMMENT ON FUNCTION public.create_notification IS 'Creates an in-app notification for a user';
COMMENT ON FUNCTION public.log_activity IS 'Logs an activity to the feed for org/team';
