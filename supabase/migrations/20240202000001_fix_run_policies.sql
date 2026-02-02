/*
  Fix Run RLS Policies

  Problems fixed:
  1. Users couldn't create runs for public repositories they don't own
  2. Missing user_id in some queries caused silent failures
*/

-- ============================================
-- 1. DROP OLD RESTRICTIVE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can create runs in their repos" ON public.runs;

-- ============================================
-- 2. CREATE NEW FLEXIBLE POLICIES
-- ============================================

-- Allow users to create runs for:
-- 1. Their own repositories (any visibility)
-- 2. Public repositories (owned by anyone)
CREATE POLICY "Users can create runs for accessible repos"
ON public.runs FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.repositories r
        WHERE r.id = runs.repo_id
        AND (
            r.owner_id = auth.uid() -- Own repos
            OR r.is_public = true   -- Public repos
        )
    )
);

-- ============================================
-- 3. ADD INDEX FOR BETTER QUERY PERFORMANCE
-- ============================================

-- Index for faster run lookups by status and user
CREATE INDEX IF NOT EXISTS idx_runs_user_status ON public.runs(user_id, status);
