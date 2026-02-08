/*
  Run System Enhancements - Phase 1

  Adds support for:
  - Named runs (user-defined names)
  - Pause/Resume functionality
  - Time tracking (accurate duration)
  - Run notes
  - Device tracking (for cross-device resume)
*/

-- ============================================
-- 1. ADD NEW COLUMNS TO RUNS TABLE
-- ============================================

-- Run identification and metadata
ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Pause/Resume support
ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;

-- Time tracking
ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS total_active_time_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Notes during run
ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Device tracking for cross-device resume
ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS device_id TEXT,
ADD COLUMN IF NOT EXISTS device_name TEXT;

-- ============================================
-- 2. UPDATE STATUS CHECK CONSTRAINT
-- ============================================

-- Add 'paused' status option
ALTER TABLE public.runs
DROP CONSTRAINT IF EXISTS runs_status_check;

ALTER TABLE public.runs
ADD CONSTRAINT runs_status_check
CHECK (status IN ('active', 'paused', 'completed', 'archived'));

-- ============================================
-- 3. CREATE TIME SEGMENTS TABLE
-- ============================================

-- Time segments track each active period for accurate duration
CREATE TABLE IF NOT EXISTS public.run_time_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    device_id TEXT,
    device_name TEXT,

    -- Ensure ended_at is after started_at
    CONSTRAINT valid_segment CHECK (ended_at IS NULL OR ended_at > started_at)
);

-- Indexes for time segments
CREATE INDEX IF NOT EXISTS idx_time_segments_run ON public.run_time_segments(run_id);
CREATE INDEX IF NOT EXISTS idx_time_segments_active ON public.run_time_segments(run_id) WHERE ended_at IS NULL;

-- Enable RLS
ALTER TABLE public.run_time_segments ENABLE ROW LEVEL SECURITY;

-- Time segments follow run ownership
CREATE POLICY "Users can view their run segments"
ON public.run_time_segments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = run_time_segments.run_id
        AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their run segments"
ON public.run_time_segments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = run_time_segments.run_id
        AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their run segments"
ON public.run_time_segments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = run_time_segments.run_id
        AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their run segments"
ON public.run_time_segments FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = run_time_segments.run_id
        AND r.user_id = auth.uid()
    )
);

-- ============================================
-- 4. ADD INDEXES FOR NEW COLUMNS
-- ============================================

-- Index for finding paused runs
CREATE INDEX IF NOT EXISTS idx_runs_paused ON public.runs(paused_at) WHERE paused_at IS NOT NULL;

-- Index for last activity queries
CREATE INDEX IF NOT EXISTS idx_runs_last_activity ON public.runs(last_activity_at);

-- Index for named run searches
CREATE INDEX IF NOT EXISTS idx_runs_name ON public.runs(name) WHERE name IS NOT NULL;

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to calculate total duration from segments
CREATE OR REPLACE FUNCTION public.calculate_run_duration(p_run_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_seconds INTEGER;
BEGIN
    SELECT COALESCE(
        SUM(
            EXTRACT(EPOCH FROM (
                COALESCE(ended_at, NOW()) - started_at
            ))
        ),
        0
    )::INTEGER
    INTO v_total_seconds
    FROM public.run_time_segments
    WHERE run_id = p_run_id;

    RETURN v_total_seconds;
END;
$$;

-- Function to get run with computed duration
CREATE OR REPLACE FUNCTION public.get_run_with_duration(p_run_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    repo_id UUID,
    commit_id UUID,
    user_id UUID,
    progress JSONB,
    status TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    total_duration_seconds INTEGER,
    notes TEXT,
    device_id TEXT,
    device_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.repo_id,
        r.commit_id,
        r.user_id,
        r.progress,
        r.status,
        r.started_at,
        r.completed_at,
        r.paused_at,
        public.calculate_run_duration(r.id) as total_duration_seconds,
        r.notes,
        r.device_id,
        r.device_name
    FROM public.runs r
    WHERE r.id = p_run_id
    AND r.user_id = auth.uid();
END;
$$;
