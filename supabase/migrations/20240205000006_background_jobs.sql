/*
  Phase 7: Background Jobs Queue

  A simple, durable job queue backed by a Postgres table.
  Edge Function `job-processor` polls for pending jobs and dispatches them.

  Job types we currently enqueue:
    webhook.deliver   – POST payload to a webhook endpoint
    slack.notify      – Send a Slack Block Kit message
    gdpr.export       – Assemble & upload a user data bundle
    audit.log         – Write an audit-log entry (fire-and-forget)
*/

CREATE TABLE IF NOT EXISTS public.background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What kind of job is this?
    type TEXT NOT NULL,   -- e.g. 'webhook.deliver', 'slack.notify'

    -- Arbitrary JSON payload consumed by the processor
    payload JSONB NOT NULL,

    -- Lifecycle
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),

    -- Retry bookkeeping
    attempt        INTEGER NOT NULL DEFAULT 0,
    max_attempts   INTEGER NOT NULL DEFAULT 3,
    next_retry_at  TIMESTAMPTZ,                  -- when to try again (exponential back-off)

    -- Result
    result         JSONB,                        -- optional output from the processor
    error_message  TEXT,

    -- Timestamps
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    started_at     TIMESTAMPTZ,
    completed_at   TIMESTAMPTZ,

    -- Owner (nullable – some jobs are system-level)
    user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes the processor needs for its polling query
CREATE INDEX IF NOT EXISTS idx_bg_jobs_pending
    ON public.background_jobs(status, next_retry_at)
    WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_bg_jobs_user
    ON public.background_jobs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bg_jobs_type
    ON public.background_jobs(type, created_at DESC);

-- ──────────────────────────────────────────────
-- RLS  (users see only their own; service-role sees all)
-- ──────────────────────────────────────────────

ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own jobs"
    ON public.background_jobs
    FOR SELECT
    USING (user_id = auth.uid() OR user_id IS NULL);

-- ──────────────────────────────────────────────
-- Helper RPC – enqueue a job
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enqueue_job(
    p_type        TEXT,
    p_payload     JSONB,
    p_max_attempts INTEGER DEFAULT 3
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.background_jobs (type, payload, max_attempts, user_id)
    VALUES (p_type, p_payload, p_max_attempts, auth.uid())
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────
-- Helper RPC – cancel a pending job
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cancel_job(p_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.background_jobs
       SET status = 'cancelled'
     WHERE id = p_id
       AND status = 'pending'
       AND (user_id = auth.uid() OR user_id IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
