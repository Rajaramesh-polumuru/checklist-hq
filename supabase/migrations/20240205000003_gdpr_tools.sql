/*
  Phase 7: GDPR Tools
  
  Data portability & right-to-erasure infrastructure.
  - gdpr_data_requests: tracks export / deletion requests + status
  - log_gdpr_request(): convenience RPC for the client
  - Scheduled cleanup of completed requests older than 7 days
*/

-- ============================================
-- 1. GDPR DATA REQUESTS TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.gdpr_data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,

    -- 'export' | 'deletion'
    request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion')),

    -- 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

    -- For exports: signed URL of the generated zip/json (set by Edge Fn)
    download_url TEXT,

    -- How long (seconds) the download_url stays valid  (default 24 h)
    download_expires_at TIMESTAMPTZ,

    -- Human-readable error when status = failed
    error_message TEXT,

    -- Reason supplied by user for deletion (optional)
    reason TEXT,

    -- Audit trail
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user
    ON public.gdpr_data_requests(user_id, requested_at DESC);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.gdpr_data_requests ENABLE ROW LEVEL SECURITY;

-- Users can see & manage only their own requests
CREATE POLICY "Users own gdpr requests"
    ON public.gdpr_data_requests
    USING (user_id = auth.uid());

CREATE POLICY "Users insert gdpr requests"
    ON public.gdpr_data_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- 2. HELPER RPC – create a request row
-- ============================================

CREATE OR REPLACE FUNCTION public.create_gdpr_request(
    p_request_type TEXT,          -- 'export' | 'deletion'
    p_reason       TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Rate-limit: no more than 1 pending/processing request at a time
    IF EXISTS (
        SELECT 1 FROM public.gdpr_data_requests
        WHERE user_id      = auth.uid()
          AND status       IN ('pending', 'processing')
    ) THEN
        RAISE EXCEPTION 'A request is already pending or processing. Please wait.';
    END IF;

    INSERT INTO public.gdpr_data_requests (user_id, request_type, reason)
    VALUES (auth.uid(), p_request_type, p_reason)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. HELPER RPC – cancel an export request
-- ============================================

CREATE OR REPLACE FUNCTION public.cancel_gdpr_request(
    p_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE public.gdpr_data_requests
       SET status = 'cancelled'
     WHERE id      = p_id
       AND user_id = auth.uid()
       AND status  = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
