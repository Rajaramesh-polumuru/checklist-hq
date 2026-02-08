/*
  Phase 3: Collaboration Features

  Enables:
  - Multiple participants on a single run
  - Item assignments to specific users
  - Comments on runs and items
  - Shareable run links
*/

-- ============================================
-- 1. RUN PARTICIPANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.run_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Role-based access
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('owner', 'editor', 'viewer')),

    -- Invitation tracking
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,  -- NULL until they accept/view

    -- One participation per user per run
    UNIQUE(run_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_run_participants_run ON public.run_participants(run_id);
CREATE INDEX IF NOT EXISTS idx_run_participants_user ON public.run_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_run_participants_role ON public.run_participants(run_id, role);

-- Enable RLS
ALTER TABLE public.run_participants ENABLE ROW LEVEL SECURITY;

-- Participants can view their own participations
CREATE POLICY "Users can view their participations"
ON public.run_participants FOR SELECT
USING (user_id = auth.uid());

-- Owners can view all participants
CREATE POLICY "Owners can view all participants"
ON public.run_participants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.run_participants rp
        WHERE rp.run_id = run_participants.run_id
        AND rp.user_id = auth.uid()
        AND rp.role = 'owner'
    )
);

-- Owners can manage participants
CREATE POLICY "Owners can add participants"
ON public.run_participants FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = run_participants.run_id
        AND r.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.run_participants rp
        WHERE rp.run_id = run_participants.run_id
        AND rp.user_id = auth.uid()
        AND rp.role = 'owner'
    )
);

CREATE POLICY "Owners can update participants"
ON public.run_participants FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.run_participants rp
        WHERE rp.run_id = run_participants.run_id
        AND rp.user_id = auth.uid()
        AND rp.role = 'owner'
    )
);

CREATE POLICY "Owners can remove participants"
ON public.run_participants FOR DELETE
USING (
    user_id = auth.uid()  -- Users can remove themselves
    OR
    EXISTS (
        SELECT 1 FROM public.run_participants rp
        WHERE rp.run_id = run_participants.run_id
        AND rp.user_id = auth.uid()
        AND rp.role = 'owner'
    )
);

-- ============================================
-- 2. ITEM ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.run_item_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
    item_id TEXT NOT NULL,  -- References item in the checklist JSON

    -- Assignment details
    assigned_to UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES auth.users(id) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),

    -- Notes for the assignee
    notes TEXT,

    -- One assignment per item per run
    UNIQUE(run_id, item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_item_assignments_run ON public.run_item_assignments(run_id);
CREATE INDEX IF NOT EXISTS idx_item_assignments_user ON public.run_item_assignments(assigned_to);

-- Enable RLS
ALTER TABLE public.run_item_assignments ENABLE ROW LEVEL SECURITY;

-- Participants can view assignments
CREATE POLICY "Participants can view assignments"
ON public.run_item_assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.run_participants rp
        WHERE rp.run_id = run_item_assignments.run_id
        AND rp.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = run_item_assignments.run_id
        AND r.user_id = auth.uid()
    )
);

-- Editors and owners can manage assignments
CREATE POLICY "Editors can manage assignments"
ON public.run_item_assignments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.run_participants rp
        WHERE rp.run_id = run_item_assignments.run_id
        AND rp.user_id = auth.uid()
        AND rp.role IN ('owner', 'editor')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = run_item_assignments.run_id
        AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Editors can update assignments"
ON public.run_item_assignments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.run_participants rp
        WHERE rp.run_id = run_item_assignments.run_id
        AND rp.user_id = auth.uid()
        AND rp.role IN ('owner', 'editor')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = run_item_assignments.run_id
        AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Editors can delete assignments"
ON public.run_item_assignments FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.run_participants rp
        WHERE rp.run_id = run_item_assignments.run_id
        AND rp.user_id = auth.uid()
        AND rp.role IN ('owner', 'editor')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = run_item_assignments.run_id
        AND r.user_id = auth.uid()
    )
);

-- ============================================
-- 3. COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.run_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
    item_id TEXT,  -- NULL for general run comments, item_id for item-specific

    -- Comment content
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_run_comments_run ON public.run_comments(run_id);
CREATE INDEX IF NOT EXISTS idx_run_comments_item ON public.run_comments(run_id, item_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_run_comments_user ON public.run_comments(user_id);

-- Enable RLS
ALTER TABLE public.run_comments ENABLE ROW LEVEL SECURITY;

-- Participants can view comments
CREATE POLICY "Participants can view comments"
ON public.run_comments FOR SELECT
USING (
    deleted_at IS NULL
    AND (
        EXISTS (
            SELECT 1 FROM public.run_participants rp
            WHERE rp.run_id = run_comments.run_id
            AND rp.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.runs r
            WHERE r.id = run_comments.run_id
            AND r.user_id = auth.uid()
        )
    )
);

-- Participants can add comments
CREATE POLICY "Participants can add comments"
ON public.run_comments FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND (
        EXISTS (
            SELECT 1 FROM public.run_participants rp
            WHERE rp.run_id = run_comments.run_id
            AND rp.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.runs r
            WHERE r.id = run_comments.run_id
            AND r.user_id = auth.uid()
        )
    )
);

-- Users can edit their own comments
CREATE POLICY "Users can edit own comments"
ON public.run_comments FOR UPDATE
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Users can delete their own comments (soft delete)
CREATE POLICY "Users can delete own comments"
ON public.run_comments FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 4. ADD SHARING FIELDS TO RUNS
-- ============================================

ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ;

-- Index for share token lookups
CREATE INDEX IF NOT EXISTS idx_runs_share_token ON public.runs(share_token) WHERE share_token IS NOT NULL;

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Generate a share token
CREATE OR REPLACE FUNCTION public.generate_run_share_token(p_run_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
BEGIN
    -- Verify ownership
    IF NOT EXISTS (
        SELECT 1 FROM public.runs
        WHERE id = p_run_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not authorized to share this run';
    END IF;

    -- Generate random token
    v_token := encode(gen_random_bytes(16), 'hex');

    -- Update run with token
    UPDATE public.runs
    SET share_token = v_token,
        is_collaborative = true
    WHERE id = p_run_id;

    RETURN v_token;
END;
$$;

-- Revoke share token
CREATE OR REPLACE FUNCTION public.revoke_run_share_token(p_run_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify ownership
    IF NOT EXISTS (
        SELECT 1 FROM public.runs
        WHERE id = p_run_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not authorized to modify this run';
    END IF;

    UPDATE public.runs
    SET share_token = NULL,
        share_expires_at = NULL
    WHERE id = p_run_id;
END;
$$;

-- Add participant via invite
CREATE OR REPLACE FUNCTION public.add_run_participant(
    p_run_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'editor'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_participant_id UUID;
BEGIN
    -- Verify caller is owner
    IF NOT EXISTS (
        SELECT 1 FROM public.runs r
        WHERE r.id = p_run_id AND r.user_id = auth.uid()
    ) AND NOT EXISTS (
        SELECT 1 FROM public.run_participants rp
        WHERE rp.run_id = p_run_id
        AND rp.user_id = auth.uid()
        AND rp.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Not authorized to add participants';
    END IF;

    INSERT INTO public.run_participants (run_id, user_id, role, invited_by)
    VALUES (p_run_id, p_user_id, p_role, auth.uid())
    ON CONFLICT (run_id, user_id)
    DO UPDATE SET role = EXCLUDED.role
    RETURNING id INTO v_participant_id;

    -- Mark run as collaborative
    UPDATE public.runs SET is_collaborative = true WHERE id = p_run_id;

    RETURN v_participant_id;
END;
$$;

-- Get run by share token (for joining)
CREATE OR REPLACE FUNCTION public.get_run_by_share_token(p_token TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    repo_id UUID,
    status TEXT,
    is_collaborative BOOLEAN
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
        r.status,
        r.is_collaborative
    FROM public.runs r
    WHERE r.share_token = p_token
    AND (r.share_expires_at IS NULL OR r.share_expires_at > NOW());
END;
$$;

-- Join run via share token
CREATE OR REPLACE FUNCTION public.join_run_via_token(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_run_id UUID;
    v_participant_id UUID;
BEGIN
    -- Get run ID from token
    SELECT id INTO v_run_id
    FROM public.runs
    WHERE share_token = p_token
    AND (share_expires_at IS NULL OR share_expires_at > NOW());

    IF v_run_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired share link';
    END IF;

    -- Add as participant (viewer by default for share links)
    INSERT INTO public.run_participants (run_id, user_id, role, joined_at)
    VALUES (v_run_id, auth.uid(), 'viewer', NOW())
    ON CONFLICT (run_id, user_id)
    DO UPDATE SET joined_at = NOW()
    RETURNING id INTO v_participant_id;

    RETURN v_run_id;
END;
$$;

-- ============================================
-- 6. ENABLE REALTIME FOR COLLABORATION TABLES
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.run_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.run_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.run_item_assignments;
