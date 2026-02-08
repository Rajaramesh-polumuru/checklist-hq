/*
  Phase 4: Templates and Analytics

  Enables:
  - Run templates for quick-start configurations
  - Scheduled/recurring runs
  - Run analytics and statistics
*/

-- ============================================
-- 1. RUN TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.run_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Template info
    name TEXT NOT NULL,
    description TEXT,

    -- Naming pattern for generated runs (supports {date}, {user}, {repo}, {count})
    name_pattern TEXT DEFAULT '{repo} - {date}',

    -- Default settings
    default_participants UUID[] DEFAULT '{}',
    item_assignments JSONB DEFAULT '{}',  -- { item_id: user_id }

    -- Metadata
    use_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_run_templates_repo ON public.run_templates(repo_id);
CREATE INDEX IF NOT EXISTS idx_run_templates_user ON public.run_templates(user_id);

-- Enable RLS
ALTER TABLE public.run_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates and public templates
DROP POLICY IF EXISTS "Users can view their templates" ON public.run_templates;
CREATE POLICY "Users can view their templates"
ON public.run_templates FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create templates" ON public.run_templates;
CREATE POLICY "Users can create templates"
ON public.run_templates FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their templates" ON public.run_templates;
CREATE POLICY "Users can update their templates"
ON public.run_templates FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their templates" ON public.run_templates;
CREATE POLICY "Users can delete their templates"
ON public.run_templates FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 2. SCHEDULED RUNS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.scheduled_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.run_templates(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Schedule configuration
    cron_expression TEXT NOT NULL,  -- e.g., "0 9 * * MON" (every Monday 9am)
    timezone TEXT DEFAULT 'UTC',

    -- Scheduling state
    next_run_at TIMESTAMPTZ NOT NULL,
    last_run_at TIMESTAMPTZ,
    last_run_id UUID REFERENCES public.runs(id),

    -- Control
    is_active BOOLEAN DEFAULT true,
    run_count INTEGER DEFAULT 0,
    max_runs INTEGER,  -- NULL for unlimited

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_runs_template ON public.scheduled_runs(template_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_runs_user ON public.scheduled_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_runs_next ON public.scheduled_runs(next_run_at) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.scheduled_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their scheduled runs" ON public.scheduled_runs;
CREATE POLICY "Users can view their scheduled runs"
ON public.scheduled_runs FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create scheduled runs" ON public.scheduled_runs;
CREATE POLICY "Users can create scheduled runs"
ON public.scheduled_runs FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their scheduled runs" ON public.scheduled_runs;
CREATE POLICY "Users can update their scheduled runs"
ON public.scheduled_runs FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their scheduled runs" ON public.scheduled_runs;
CREATE POLICY "Users can delete their scheduled runs"
ON public.scheduled_runs FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 3. RUN STATISTICS VIEW
-- ============================================

-- Create a view for run statistics (per repository, per user)
CREATE OR REPLACE VIEW public.run_statistics AS
SELECT
    r.repo_id,
    r.user_id,
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE r.status = 'completed') as completed_runs,
    COUNT(*) FILTER (WHERE r.status = 'active') as active_runs,
    COUNT(*) FILTER (WHERE r.status = 'paused') as paused_runs,

    -- Completion rate
    ROUND(
        (COUNT(*) FILTER (WHERE r.status = 'completed')::numeric /
         NULLIF(COUNT(*)::numeric, 0)) * 100,
        2
    ) as completion_rate,

    -- Time statistics (from total_active_time_seconds)
    AVG(r.total_active_time_seconds) FILTER (WHERE r.status = 'completed')
        as avg_duration_seconds,
    MIN(r.total_active_time_seconds) FILTER (WHERE r.status = 'completed')
        as min_duration_seconds,
    MAX(r.total_active_time_seconds) FILTER (WHERE r.status = 'completed')
        as max_duration_seconds,

    -- Recent activity
    MAX(r.started_at) as last_run_started,
    MAX(r.completed_at) as last_run_completed,

    -- Date range
    MIN(r.started_at) as first_run_at
FROM public.runs r
GROUP BY r.repo_id, r.user_id;

-- ============================================
-- 4. ITEM COMPLETION ANALYTICS
-- ============================================

-- Function to analyze item completion patterns
CREATE OR REPLACE FUNCTION public.get_item_analytics(p_repo_id UUID)
RETURNS TABLE (
    item_id TEXT,
    item_text TEXT,
    total_completions INTEGER,
    avg_completion_order NUMERIC,
    avg_time_to_complete_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH item_stats AS (
        SELECT
            key as item_id,
            (value->>'completed')::boolean as completed,
            (value->>'timestamp')::timestamptz as completed_at,
            r.started_at,
            c.content->'items'->key->>'text' as item_text,
            ROW_NUMBER() OVER (PARTITION BY r.id ORDER BY (value->>'timestamp')::timestamptz) as completion_order
        FROM public.runs r
        CROSS JOIN LATERAL jsonb_each(r.progress) as p(key, value)
        JOIN public.commits c ON c.id = r.commit_id
        WHERE r.repo_id = p_repo_id
        AND r.status = 'completed'
        AND (value->>'completed')::boolean = true
    )
    SELECT
        item_stats.item_id,
        MAX(item_stats.item_text) as item_text,
        COUNT(*)::INTEGER as total_completions,
        ROUND(AVG(item_stats.completion_order), 2) as avg_completion_order,
        ROUND(AVG(EXTRACT(EPOCH FROM (item_stats.completed_at - item_stats.started_at))), 2) as avg_time_to_complete_seconds
    FROM item_stats
    GROUP BY item_stats.item_id
    ORDER BY avg_completion_order;
END;
$$;

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Get user's run statistics
CREATE OR REPLACE FUNCTION public.get_user_run_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_runs BIGINT,
    completed_runs BIGINT,
    active_runs BIGINT,
    paused_runs BIGINT,
    completion_rate NUMERIC,
    avg_duration_seconds NUMERIC,
    total_time_spent_seconds BIGINT,
    runs_this_week BIGINT,
    runs_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());

    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_runs,
        COUNT(*) FILTER (WHERE r.status = 'completed')::BIGINT as completed_runs,
        COUNT(*) FILTER (WHERE r.status = 'active')::BIGINT as active_runs,
        COUNT(*) FILTER (WHERE r.status = 'paused')::BIGINT as paused_runs,
        ROUND(
            (COUNT(*) FILTER (WHERE r.status = 'completed')::numeric /
             NULLIF(COUNT(*)::numeric, 0)) * 100,
            2
        ) as completion_rate,
        ROUND(AVG(r.total_active_time_seconds) FILTER (WHERE r.status = 'completed'), 2) as avg_duration_seconds,
        COALESCE(SUM(r.total_active_time_seconds), 0)::BIGINT as total_time_spent_seconds,
        COUNT(*) FILTER (WHERE r.started_at >= NOW() - INTERVAL '7 days')::BIGINT as runs_this_week,
        COUNT(*) FILTER (WHERE r.started_at >= NOW() - INTERVAL '30 days')::BIGINT as runs_this_month
    FROM public.runs r
    WHERE r.user_id = v_user_id;
END;
$$;

-- Get repository run statistics
CREATE OR REPLACE FUNCTION public.get_repo_run_stats(p_repo_id UUID)
RETURNS TABLE (
    total_runs BIGINT,
    completed_runs BIGINT,
    unique_users BIGINT,
    avg_completion_rate NUMERIC,
    avg_duration_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_runs,
        COUNT(*) FILTER (WHERE r.status = 'completed')::BIGINT as completed_runs,
        COUNT(DISTINCT r.user_id)::BIGINT as unique_users,
        ROUND(
            (COUNT(*) FILTER (WHERE r.status = 'completed')::numeric /
             NULLIF(COUNT(*)::numeric, 0)) * 100,
            2
        ) as avg_completion_rate,
        ROUND(AVG(r.total_active_time_seconds) FILTER (WHERE r.status = 'completed'), 2) as avg_duration_seconds
    FROM public.runs r
    WHERE r.repo_id = p_repo_id;
END;
$$;

-- Create a run from template
CREATE OR REPLACE FUNCTION public.create_run_from_template(
    p_template_id UUID,
    p_run_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_template RECORD;
    v_latest_commit RECORD;
    v_run_id UUID;
    v_final_name TEXT;
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM public.run_templates
    WHERE id = p_template_id
    AND user_id = auth.uid();

    IF v_template IS NULL THEN
        RAISE EXCEPTION 'Template not found or not authorized';
    END IF;

    -- Get latest commit for the repo
    SELECT * INTO v_latest_commit
    FROM public.commits
    WHERE repo_id = v_template.repo_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_latest_commit IS NULL THEN
        RAISE EXCEPTION 'No commits found for repository';
    END IF;

    -- Generate run name from pattern
    v_final_name := COALESCE(p_run_name,
        REPLACE(
            REPLACE(
                REPLACE(v_template.name_pattern, '{date}', TO_CHAR(NOW(), 'Mon DD, YYYY')),
                '{repo}', v_template.name
            ),
            '{count}', (v_template.use_count + 1)::TEXT
        )
    );

    -- Create the run
    INSERT INTO public.runs (
        repo_id,
        commit_id,
        user_id,
        name,
        status,
        is_collaborative,
        progress
    ) VALUES (
        v_template.repo_id,
        v_latest_commit.id,
        auth.uid(),
        v_final_name,
        'active',
        array_length(v_template.default_participants, 1) > 0,
        '{}'
    )
    RETURNING id INTO v_run_id;

    -- Add default participants
    IF v_template.default_participants IS NOT NULL AND array_length(v_template.default_participants, 1) > 0 THEN
        INSERT INTO public.run_participants (run_id, user_id, role, invited_by)
        SELECT v_run_id, unnest(v_template.default_participants), 'editor', auth.uid();
    END IF;

    -- Apply item assignments
    IF v_template.item_assignments IS NOT NULL AND v_template.item_assignments != '{}' THEN
        INSERT INTO public.run_item_assignments (run_id, item_id, assigned_to, assigned_by)
        SELECT v_run_id, key, (value)::UUID, auth.uid()
        FROM jsonb_each_text(v_template.item_assignments);
    END IF;

    -- Update template usage
    UPDATE public.run_templates
    SET use_count = use_count + 1,
        last_used_at = NOW()
    WHERE id = p_template_id;

    -- Start time segment
    INSERT INTO public.run_time_segments (run_id, started_at)
    VALUES (v_run_id, NOW());

    RETURN v_run_id;
END;
$$;

-- Trigger to update template updated_at
DROP TRIGGER IF EXISTS on_template_updated ON public.run_templates;
CREATE TRIGGER on_template_updated
    BEFORE UPDATE ON public.run_templates
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to update scheduled_runs updated_at
DROP TRIGGER IF EXISTS on_scheduled_run_updated ON public.scheduled_runs;
CREATE TRIGGER on_scheduled_run_updated
    BEFORE UPDATE ON public.scheduled_runs
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
