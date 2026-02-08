/*
  Phase 2: Cross-Device Sync & Presence

  Enables:
  - Real-time sync of run progress across devices
  - Presence tracking to show active devices
  - Sync versioning for conflict detection
*/

-- ============================================
-- 1. ADD SYNC TRACKING TO RUNS
-- ============================================

ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 2. CREATE PRESENCE TABLE
-- ============================================

-- Track which devices are actively viewing/editing a run
CREATE TABLE IF NOT EXISTS public.run_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    -- One entry per device per run
    UNIQUE(run_id, device_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_run_presence_run ON public.run_presence(run_id);
CREATE INDEX IF NOT EXISTS idx_run_presence_user ON public.run_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_run_presence_active ON public.run_presence(run_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.run_presence ENABLE ROW LEVEL SECURITY;

-- Users can see presence for runs they participate in
DROP POLICY IF EXISTS "Users can view presence for their runs" ON public.run_presence;
CREATE POLICY "Users can view presence for their runs"
ON public.run_presence FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = run_presence.run_id
        AND r.user_id = auth.uid()
    )
);

-- Users can update their own presence
DROP POLICY IF EXISTS "Users can manage their presence" ON public.run_presence;
CREATE POLICY "Users can manage their presence"
ON public.run_presence FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their presence" ON public.run_presence;
CREATE POLICY "Users can update their presence"
ON public.run_presence FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their presence" ON public.run_presence;
CREATE POLICY "Users can delete their presence"
ON public.run_presence FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 3. ENABLE REALTIME
-- ============================================

-- Enable realtime for runs table (progress updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;

-- Enable realtime for presence table
ALTER PUBLICATION supabase_realtime ADD TABLE public.run_presence;

-- ============================================
-- 4. PRESENCE HELPER FUNCTIONS
-- ============================================

-- Upsert presence (update last_seen or insert new)
CREATE OR REPLACE FUNCTION public.upsert_run_presence(
    p_run_id UUID,
    p_device_id TEXT,
    p_device_name TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.run_presence (run_id, user_id, device_id, device_name, last_seen_at, is_active)
    VALUES (p_run_id, auth.uid(), p_device_id, p_device_name, NOW(), true)
    ON CONFLICT (run_id, device_id)
    DO UPDATE SET
        last_seen_at = NOW(),
        is_active = true,
        device_name = COALESCE(EXCLUDED.device_name, run_presence.device_name);
END;
$$;

-- Mark presence as inactive (when leaving)
CREATE OR REPLACE FUNCTION public.deactivate_run_presence(
    p_run_id UUID,
    p_device_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.run_presence
    SET is_active = false, last_seen_at = NOW()
    WHERE run_id = p_run_id
    AND device_id = p_device_id
    AND user_id = auth.uid();
END;
$$;

-- Get active devices for a run
CREATE OR REPLACE FUNCTION public.get_run_active_devices(p_run_id UUID)
RETURNS TABLE (
    device_id TEXT,
    device_name TEXT,
    user_id UUID,
    last_seen_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        rp.device_id,
        rp.device_name,
        rp.user_id,
        rp.last_seen_at
    FROM public.run_presence rp
    WHERE rp.run_id = p_run_id
    AND rp.is_active = true
    AND rp.last_seen_at > NOW() - INTERVAL '2 minutes'
    ORDER BY rp.last_seen_at DESC;
END;
$$;

-- Clean up stale presence records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_stale_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark presence as inactive if not seen for 5 minutes
    UPDATE public.run_presence
    SET is_active = false
    WHERE is_active = true
    AND last_seen_at < NOW() - INTERVAL '5 minutes';

    -- Delete very old presence records (older than 24 hours)
    DELETE FROM public.run_presence
    WHERE last_seen_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ============================================
-- 5. SYNC VERSION TRIGGER
-- ============================================

-- Increment sync_version on every update
CREATE OR REPLACE FUNCTION public.increment_sync_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.sync_version := COALESCE(OLD.sync_version, 0) + 1;
    NEW.last_synced_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for runs table
DROP TRIGGER IF EXISTS on_run_sync_version ON public.runs;
CREATE TRIGGER on_run_sync_version
    BEFORE UPDATE ON public.runs
    FOR EACH ROW
    WHEN (OLD.progress IS DISTINCT FROM NEW.progress OR OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.increment_sync_version();
