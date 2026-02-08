/*
  Checklist HQ - Consolidated Schema
  "The GitHub for Process"
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 0. CLEANUP (Ensure fresh start for consolidated schema)
-- ============================================
DROP TABLE IF EXISTS public.runs CASCADE;
DROP TABLE IF EXISTS public.commits CASCADE;
DROP TABLE IF EXISTS public.repositories CASCADE;

-- ============================================
-- 1. REPOSITORIES: The "Project" Container
-- ============================================
CREATE TABLE public.repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Metadata
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    
    -- The Forking Lineage
    origin_repo_id UUID REFERENCES public.repositories(id), -- The "Grandparent"
    upstream_repo_id UUID REFERENCES public.repositories(id), -- The "Parent"
    
    -- Metrics
    fork_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_repos_upstream ON public.repositories(upstream_repo_id);
CREATE INDEX idx_repos_owner ON public.repositories(owner_id);
CREATE INDEX idx_repos_public ON public.repositories(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public repos are viewable by everyone" 
ON public.repositories FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own repos" 
ON public.repositories FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own repos" 
ON public.repositories FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own repos" 
ON public.repositories FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own repos" 
ON public.repositories FOR DELETE 
USING (auth.uid() = owner_id);

-- ============================================
-- 2. COMMITS: The Immutable History
-- ============================================
CREATE TABLE public.commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE NOT NULL,
    
    -- The Snapshot of the Checklist (JSONB)
    content JSONB NOT NULL,
    
    message TEXT,
    parent_commit_id UUID REFERENCES public.commits(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_commits_repo ON public.commits(repo_id);
CREATE INDEX idx_commits_parent ON public.commits(parent_commit_id);

-- Enable RLS
ALTER TABLE public.commits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Commits viewable if repo is public" 
ON public.commits FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.repositories r 
        WHERE r.id = commits.repo_id 
        AND r.is_public = true
    )
);

CREATE POLICY "Users can view commits of their repos" 
ON public.commits FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.repositories r 
        WHERE r.id = commits.repo_id 
        AND r.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can create commits in their repos" 
ON public.commits FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.repositories r 
        WHERE r.id = commits.repo_id 
        AND r.owner_id = auth.uid()
    )
);

-- ============================================
-- 3. RUNS: The Active Instances
-- ============================================
CREATE TABLE public.runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE NOT NULL,
    commit_id UUID REFERENCES public.commits(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    
    -- Status and Progress
    progress JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_runs_repo ON public.runs(repo_id);
CREATE INDEX idx_runs_user ON public.runs(user_id);
CREATE INDEX idx_runs_active ON public.runs(status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own runs" 
ON public.runs FOR SELECT 
USING (auth.uid() = user_id);


CREATE POLICY "Users can create runs in their repos" 
ON public.runs FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.repositories r 
        WHERE r.id = runs.repo_id 
        AND r.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own runs" 
ON public.runs FOR UPDATE 
USING (auth.uid() = user_id);

-- ============================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to handle Updated At
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for repositories
DROP TRIGGER IF EXISTS on_repo_updated ON public.repositories;
CREATE TRIGGER on_repo_updated
    BEFORE UPDATE ON public.repositories
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to increment fork count
CREATE OR REPLACE FUNCTION public.increment_fork_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.upstream_repo_id IS NOT NULL THEN
    UPDATE public.repositories
    SET fork_count = fork_count + 1
    WHERE id = NEW.upstream_repo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for fork count
DROP TRIGGER IF EXISTS increment_fork_count_trigger ON public.repositories;
CREATE TRIGGER increment_fork_count_trigger
  AFTER INSERT ON public.repositories
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_fork_count();

-- Function to fork a repository
CREATE OR REPLACE FUNCTION public.fork_repository(
  source_repo_id UUID,
  new_owner_id UUID,
  new_title TEXT DEFAULT NULL
) 
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_repo_id UUID;
  v_source_repo RECORD;
  v_latest_commit RECORD;
  v_title TEXT;
  v_origin_id UUID;
BEGIN
  -- 0. Security Checks
  IF new_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot fork for another user';
  END IF;

  -- 1. Get source repository details (and check visibility)
  SELECT * INTO v_source_repo 
  FROM public.repositories 
  WHERE id = source_repo_id
  AND (is_public = true OR owner_id = auth.uid());
  
  IF v_source_repo IS NULL THEN
    RAISE EXCEPTION 'Source repository not found or not accessible';
  END IF;

  -- 2. Determine title
  v_title := Coalesce(new_title, v_source_repo.title);
  
  -- Determine origin
  v_origin_id := Coalesce(v_source_repo.origin_repo_id, v_source_repo.id);

  -- 3. Create new repository
  -- Note: We do NOT manually increment fork_count here because the trigger 'increment_fork_count_trigger' will handle it.
  INSERT INTO public.repositories (
    owner_id,
    title,
    description,
    origin_repo_id,
    upstream_repo_id,
    is_public
  ) VALUES (
    new_owner_id,
    v_title,
    v_source_repo.description,
    v_origin_id,
    v_source_repo.id, -- Valid upstream link
    false -- Forks are private by default
  ) 
  RETURNING id INTO v_new_repo_id;

  -- 4. Get content from latest commit of source
  SELECT * INTO v_latest_commit
  FROM public.commits
  WHERE repo_id = source_repo_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_latest_commit IS NOT NULL THEN
    -- 5. Create initial commit in new repo with COPIED content
    INSERT INTO public.commits (
      repo_id,
      content,
      message,
      parent_commit_id
    ) VALUES (
      v_new_repo_id,
      v_latest_commit.content,
      'Forked from ' || v_source_repo.title,
      NULL -- New history starts here
    );
  END IF;

  RETURN v_new_repo_id;
END;
$$;
