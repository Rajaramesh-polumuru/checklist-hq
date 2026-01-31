-- Checklist HQ Database Schema
-- Based on the "GitHub for Process" paradigm from the blueprint

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. REPOSITORIES: The "Project" Container
-- ============================================
-- Represents the abstract concept of a "Checklist"
-- Holds metadata and points to the lineage
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,

  -- The Forking Lineage (The "GitHub" Logic)
  -- origin_repo_id: The "Grandparent" (Where the fork chain started)
  origin_repo_id UUID REFERENCES repositories(id),
  -- upstream_repo_id: The immediate parent (Where it was directly forked from)
  upstream_repo_id UUID REFERENCES repositories(id),

  -- Metrics
  fork_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup of "Who forked me?"
CREATE INDEX idx_repos_upstream ON repositories(upstream_repo_id);
-- Index for fetching user's repositories
CREATE INDEX idx_repos_owner ON repositories(owner_id);
-- Index for public repositories (for the library)
CREATE INDEX idx_repos_public ON repositories(is_public) WHERE is_public = true;

-- ============================================
-- 2. COMMITS: The Immutable History
-- ============================================
-- Represents a specific state of the checklist at a point in time
-- Contains the actual data (the list of items) as a JSONB snapshot
CREATE TABLE commits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE NOT NULL,

  -- The Snapshot of the Checklist (JSONB for flexibility)
  -- Structure:
  -- {
  --   "version": "1.0",
  --   "items": {
  --     "uuid-1": { "id": "uuid-1", "text": "Step 1", "parent": null, "order": 0 },
  --     "uuid-2": { "id": "uuid-2", "text": "Step 1.1", "parent": "uuid-1", "order": 0 }
  --   }
  -- }
  content JSONB NOT NULL,

  message TEXT, -- e.g., "Added deployment step"
  parent_commit_id UUID REFERENCES commits(id), -- The linked list of history

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching commits by repository
CREATE INDEX idx_commits_repo ON commits(repo_id);
-- Index for commit history traversal
CREATE INDEX idx_commits_parent ON commits(parent_commit_id);

-- ============================================
-- 3. RUNS: The Active Instances
-- ============================================
-- Represents an execution of a specific Commit
-- This is where the checkboxes live
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE NOT NULL,
  commit_id UUID REFERENCES commits(id) NOT NULL, -- Links to the VERSION used

  -- The State of the Run
  -- We do NOT store the text here. We only store the status of the IDs.
  -- Structure:
  -- {
  --   "item_uuid_1": { "completed": true, "timestamp": "2026-01-01T12:00:00Z", "user_id": "..." },
  --   "item_uuid_2": { "completed": false }
  -- }
  progress JSONB DEFAULT '{}',

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for fetching runs by repository
CREATE INDEX idx_runs_repo ON runs(repo_id);
-- Index for active runs
CREATE INDEX idx_runs_active ON runs(status) WHERE status = 'active';

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Repositories Policies
-- Users can read public repositories or their own
CREATE POLICY "Public repos are viewable by everyone" ON repositories
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own repos" ON repositories
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own repos" ON repositories
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own repos" ON repositories
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own repos" ON repositories
  FOR DELETE USING (auth.uid() = owner_id);

-- Commits Policies
-- Commits are viewable if the repository is viewable
CREATE POLICY "Commits viewable if repo is public" ON commits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = commits.repo_id
      AND repositories.is_public = true
    )
  );

CREATE POLICY "Users can view commits of their repos" ON commits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = commits.repo_id
      AND repositories.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create commits in their repos" ON commits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = commits.repo_id
      AND repositories.owner_id = auth.uid()
    )
  );

-- Runs Policies
-- Users can only access runs for repos they own
CREATE POLICY "Users can view their own runs" ON runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = runs.repo_id
      AND repositories.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create runs in their repos" ON runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = runs.repo_id
      AND repositories.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own runs" ON runs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = runs.repo_id
      AND repositories.owner_id = auth.uid()
    )
  );

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for repositories
CREATE TRIGGER update_repositories_updated_at
  BEFORE UPDATE ON repositories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment fork count when a repo is forked
CREATE OR REPLACE FUNCTION increment_fork_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.upstream_repo_id IS NOT NULL THEN
    UPDATE repositories
    SET fork_count = fork_count + 1
    WHERE id = NEW.upstream_repo_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for fork count
CREATE TRIGGER increment_fork_count_trigger
  AFTER INSERT ON repositories
  FOR EACH ROW
  EXECUTE FUNCTION increment_fork_count();

-- ============================================
-- 6. FORK FUNCTION (Deep Copy)
-- ============================================
-- This function performs the "Fork" operation
-- It creates a new repository with the content copied from the source
CREATE OR REPLACE FUNCTION fork_repository(
  source_repo_id UUID,
  new_owner_id UUID,
  new_title TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  source_repo repositories%ROWTYPE;
  latest_commit commits%ROWTYPE;
  new_repo_id UUID;
  new_commit_id UUID;
  actual_origin_id UUID;
BEGIN
  -- Get the source repository
  SELECT * INTO source_repo FROM repositories WHERE id = source_repo_id;

  IF source_repo IS NULL THEN
    RAISE EXCEPTION 'Source repository not found';
  END IF;

  -- Get the latest commit from the source
  SELECT * INTO latest_commit
  FROM commits
  WHERE repo_id = source_repo_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Determine the origin (root of the fork chain)
  -- If source has an origin, use it; otherwise, source is the origin
  actual_origin_id := COALESCE(source_repo.origin_repo_id, source_repo_id);

  -- Create the new repository
  INSERT INTO repositories (
    owner_id,
    title,
    description,
    is_public,
    origin_repo_id,
    upstream_repo_id
  ) VALUES (
    new_owner_id,
    COALESCE(new_title, source_repo.title),
    source_repo.description,
    false, -- Forks start as private
    actual_origin_id,
    source_repo_id
  ) RETURNING id INTO new_repo_id;

  -- Copy the latest commit content to the new repository
  IF latest_commit IS NOT NULL THEN
    INSERT INTO commits (
      repo_id,
      content,
      message,
      parent_commit_id
    ) VALUES (
      new_repo_id,
      latest_commit.content,
      'Forked from ' || source_repo.title,
      NULL -- No parent in the new repo
    ) RETURNING id INTO new_commit_id;
  END IF;

  RETURN new_repo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
