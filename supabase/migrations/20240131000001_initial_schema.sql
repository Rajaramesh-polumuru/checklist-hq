/*
  Checklist HQ - Initial Schema
  "The GitHub for Process"
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. REPOSITORIES
-- The "Project" Container
CREATE TABLE public.repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Index for fast lookup of "Who forked me?"
CREATE INDEX idx_repos_upstream ON public.repositories(upstream_repo_id);
CREATE INDEX idx_repos_owner ON public.repositories(owner_id);

-- Enable RLS
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;

-- Policies for Repositories
CREATE POLICY "Public repos are viewable by everyone" 
ON public.repositories FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own repos" 
ON public.repositories FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create repos" 
ON public.repositories FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own repos" 
ON public.repositories FOR UPDATE 
USING (auth.uid() = owner_id);

-- 2. COMMITS
-- The Immutable History
CREATE TABLE public.commits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE NOT NULL,
    
    -- The Snapshot of the Checklist (JSONB)
    /* 
       Structure: 
       {
         "items": {
           "uuid-1": { "id": "uuid-1", "text": "Step 1", "parent": null, "order": 0, ... }
         }
       }
    */
    content JSONB NOT NULL,
    
    message TEXT,
    parent_commit_id UUID REFERENCES public.commits(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commits_repo ON public.commits(repo_id);

-- Enable RLS
ALTER TABLE public.commits ENABLE ROW LEVEL SECURITY;

-- Policies for Commits
CREATE POLICY "Commits are viewable if repo is viewable" 
ON public.commits FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.repositories r 
        WHERE r.id = commits.repo_id 
        AND (r.is_public = true OR r.owner_id = auth.uid())
    )
);

CREATE POLICY "Repo owners can insert commits" 
ON public.commits FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.repositories r 
        WHERE r.id = commits.repo_id 
        AND r.owner_id = auth.uid()
    )
);

-- 3. RUNS
-- The Active Instances
CREATE TABLE public.runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE NOT NULL,
    commit_id UUID REFERENCES public.commits(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- Who started the run (optional for public runs?)
    
    -- The State of the Run
    -- { "item_uuid": { "completed": true, "timestamp": "..." } }
    progress JSONB DEFAULT '{}', 
    
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'archived'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_runs_repo ON public.runs(repo_id);
CREATE INDEX idx_runs_user ON public.runs(user_id);

-- Enable RLS
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Policies for Runs
CREATE POLICY "Users can view their own runs" 
ON public.runs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create runs" 
ON public.runs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs" 
ON public.runs FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. FUNCTIONS

-- Function to handle Updated At
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_repo_updated
    BEFORE UPDATE ON public.repositories
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
