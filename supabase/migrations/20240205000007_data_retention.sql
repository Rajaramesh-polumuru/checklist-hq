/*
  Phase 7: Data Retention Policies

  Per-organisation retention windows.  The `retention-cleanup` Edge Function
  reads these rows and hard-deletes rows older than the configured window
  from audit_logs, completed runs, and background_jobs history.

  Defaults mirror what audit_logs already ships with (90 d).
  A value of 0 means "keep forever" (no automatic deletion).
*/

-- ──────────────────────────────────────────────
-- 1. RETENTION POLICIES TABLE
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    organization_id UUID REFERENCES public.organizations(id)
        ON DELETE CASCADE NOT NULL UNIQUE,   -- one policy per org

    -- Retention windows in days.  0 = keep forever.
    audit_log_days      INTEGER NOT NULL DEFAULT 90,
    run_history_days    INTEGER NOT NULL DEFAULT 180,
    job_history_days    INTEGER NOT NULL DEFAULT 30,
    webhook_log_days    INTEGER NOT NULL DEFAULT 60,

    -- Who last touched this row
    updated_by  UUID REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    -- Sane bounds
    CONSTRAINT audit_log_days_range    CHECK (audit_log_days    BETWEEN 0 AND 3650),
    CONSTRAINT run_history_days_range  CHECK (run_history_days  BETWEEN 0 AND 3650),
    CONSTRAINT job_history_days_range  CHECK (job_history_days  BETWEEN 0 AND 3650),
    CONSTRAINT webhook_log_days_range  CHECK (webhook_log_days  BETWEEN 0 AND 3650)
);

-- ──────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────

ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins manage retention"
    ON public.retention_policies
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = retention_policies.organization_id
              AND om.user_id         = auth.uid()
              AND om.role            IN ('owner', 'admin')
        )
    );

-- ──────────────────────────────────────────────
-- 2. HELPER – upsert a policy (called from the UI)
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.upsert_retention_policy(
    p_organization_id   UUID,
    p_audit_log_days    INTEGER DEFAULT 90,
    p_run_history_days  INTEGER DEFAULT 180,
    p_job_history_days  INTEGER DEFAULT 30,
    p_webhook_log_days  INTEGER DEFAULT 60
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.retention_policies
        (organization_id, audit_log_days, run_history_days, job_history_days, webhook_log_days, updated_by)
    VALUES
        (p_organization_id, p_audit_log_days, p_run_history_days, p_job_history_days, p_webhook_log_days, auth.uid())
    ON CONFLICT (organization_id) DO UPDATE SET
        audit_log_days    = EXCLUDED.audit_log_days,
        run_history_days  = EXCLUDED.run_history_days,
        job_history_days  = EXCLUDED.job_history_days,
        webhook_log_days  = EXCLUDED.webhook_log_days,
        updated_by        = EXCLUDED.updated_by,
        updated_at        = NOW()
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────
-- 3. VIEW – summary of what each cleanup pass would delete
--    (handy for the "preview" button in the UI)
-- ──────────────────────────────────────────────

CREATE OR REPLACE VIEW public.retention_preview AS
SELECT
    rp.organization_id,
    rp.audit_log_days,
    (SELECT COUNT(*)
       FROM public.audit_logs al
      WHERE al.organization_id = rp.organization_id
        AND rp.audit_log_days  > 0
        AND al.created_at      < NOW() - (rp.audit_log_days || ' days')::INTERVAL
    ) AS audit_logs_to_delete,

    rp.run_history_days,
    (SELECT COUNT(*)
       FROM public.runs r
       JOIN public.repositories repo ON repo.id = r.repo_id
      WHERE repo.organization_id = rp.organization_id
        AND r.status             = 'completed'
        AND rp.run_history_days  > 0
        AND r.completed_at       < NOW() - (rp.run_history_days || ' days')::INTERVAL
    ) AS runs_to_delete,

    rp.job_history_days,
    (SELECT COUNT(*)
       FROM public.background_jobs bj
      WHERE bj.user_id IN (
            SELECT om.user_id FROM public.organization_members om
             WHERE om.organization_id = rp.organization_id
          )
        AND bj.status             IN ('completed', 'failed', 'cancelled')
        AND rp.job_history_days   > 0
        AND bj.completed_at       < NOW() - (rp.job_history_days || ' days')::INTERVAL
    ) AS jobs_to_delete
FROM public.retention_policies rp;
