/*
  Phase 7: Audit Logs
  
  Comprehensive activity logging for compliance, security, and debugging.
*/

-- ============================================
-- 1. AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization context (nullable for system-level actions)
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    repository_id UUID REFERENCES public.repositories(id) ON DELETE SET NULL,
    
    -- User who performed the action
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Action details
    action TEXT NOT NULL,  -- e.g., 'repository.created', 'run.completed', 'member.invited'
    resource_type TEXT NOT NULL,  -- e.g., 'repository', 'run', 'organization_member'
    resource_id TEXT NOT NULL,  -- ID of the affected resource
    
    -- Changes/Details
    old_values JSONB,  -- Previous state (for updates)
    new_values JSONB,  -- New state (for updates/creates)
    changes JSONB,  -- Summary of what changed {field: {old, new}}
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'success',  -- 'success', 'failure', 'partial'
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- TTL for log retention (e.g., keep for 90 days)
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_repo ON public.audit_logs(repository_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Org admins can view audit logs for their org
DROP POLICY IF EXISTS "Org admins view audit logs" ON public.audit_logs;
CREATE POLICY "Org admins view audit logs" ON public.audit_logs
    FOR SELECT USING (
        organization_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = audit_logs.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- Service role can insert audit logs (from Edge Functions)
-- Note: This is handled at the application level via service role

-- ============================================
-- 2. FUNCTION: Log Activity
-- ============================================

CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_organization_id UUID,
    p_repository_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_new_values JSONB DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_changes JSONB DEFAULT NULL,
    p_status TEXT DEFAULT 'success',
    p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        organization_id,
        repository_id,
        user_id,
        action,
        resource_type,
        resource_id,
        new_values,
        old_values,
        changes,
        status,
        error_message,
        ip_address,
        user_agent
    ) VALUES (
        p_organization_id,
        p_repository_id,
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_new_values,
        p_old_values,
        p_changes,
        p_status,
        p_error_message,
        NULL,  -- IP would be captured by trigger/Edge Function
        NULL   -- User agent would be captured by Edge Function
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. VIEWS: Audit Log Summaries
-- ============================================

-- User activity summary
CREATE OR REPLACE VIEW public.audit_user_activity AS
SELECT 
    sub.user_id,
    SUM(sub.count)::bigint as total_actions,
    SUM(sub.failed_count)::bigint as failed_actions,
    MAX(sub.last_activity) as last_activity,
    jsonb_object_agg(sub.action, sub.count::text) as action_counts
FROM (
    SELECT 
        user_id,
        action,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_count,
        MAX(created_at) as last_activity
    FROM public.audit_logs
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY user_id, action
) sub
GROUP BY sub.user_id;

-- Organization activity summary
CREATE OR REPLACE VIEW public.audit_org_activity AS
SELECT 
    ao.organization_id,
    COUNT(*) as total_actions,
    COUNT(DISTINCT ao.user_id) as active_users,
    COUNT(CASE WHEN ao.status = 'failure' THEN 1 END) as failed_actions,
    MAX(ao.created_at) as last_activity
FROM public.audit_logs ao
WHERE ao.created_at > NOW() - INTERVAL '30 days'
GROUP BY ao.organization_id;

-- Repository activity summary
CREATE OR REPLACE VIEW public.audit_repo_activity AS
SELECT 
    ar.repository_id,
    COUNT(*) as total_actions,
    COUNT(DISTINCT ar.user_id) as users_involved,
    COUNT(CASE WHEN ar.action LIKE 'run.%' THEN 1 END) as run_count,
    COUNT(CASE WHEN ar.action LIKE '%.created' THEN 1 END) as creates,
    COUNT(CASE WHEN ar.action LIKE '%.updated' THEN 1 END) as updates,
    COUNT(CASE WHEN ar.action LIKE '%.deleted' THEN 1 END) as deletes,
    MAX(ar.created_at) as last_activity
FROM public.audit_logs ar
WHERE ar.created_at > NOW() - INTERVAL '30 days'
GROUP BY ar.repository_id;

-- ============================================
-- 4. CLEANUP POLICY: Automatic expiration
-- ============================================

-- This is handled by Postgres TTL/partitioning
-- Consider implementing with Cron or Supabase Postgres Extensions
-- For now, expires_at column documents the retention policy

COMMENT ON TABLE public.audit_logs IS 'Comprehensive activity log for security, compliance, and debugging. Records all important user actions with context and changes.';
COMMENT ON COLUMN public.audit_logs.action IS 'Action name (e.g., repository.created, run.completed, member.invited)';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSON summary of field changes {fieldName: {old: value, new: value}}';
COMMENT ON COLUMN public.audit_logs.expires_at IS 'Automatic expiration after 90 days. Adjust retention policy as needed.';
