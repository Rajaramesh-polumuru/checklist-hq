-- =====================================================
-- FIX: Fork Repository Function
-- This migration fixes the fork functionality to properly
-- copy commit content to the forked repository
-- =====================================================

-- Drop and recreate the fork_repository function with fixes
CREATE OR REPLACE FUNCTION public.fork_repository(
  source_repo_id UUID,
  new_owner_id UUID,
  new_title TEXT DEFAULT NULL
) 
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_repo_id UUID;
  v_source_repo RECORD;
  v_latest_commit RECORD;
  v_title TEXT;
  v_origin_id UUID;
  v_commit_content JSONB;
BEGIN
  -- 0. Security Checks
  IF new_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot fork for another user';
  END IF;

  -- 1. Get source repository details (including private repos owned by user)
  SELECT * INTO v_source_repo 
  FROM public.repositories 
  WHERE id = source_repo_id
  AND (is_public = true OR owner_id = auth.uid());
  
  IF v_source_repo IS NULL THEN
    RAISE EXCEPTION 'Source repository not found or not accessible';
  END IF;

  -- 2. Get content from latest commit of source FIRST
  -- This is done before creating the repo to ensure we have content to copy
  SELECT id, content, message INTO v_latest_commit
  FROM public.commits
  WHERE repo_id = source_repo_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Store the content (will be NULL if no commits exist)
  v_commit_content := v_latest_commit.content;
  
  -- If no content found, create empty content structure
  IF v_commit_content IS NULL THEN
    v_commit_content := '{"version": "1.0", "items": {}}'::jsonb;
  END IF;

  -- 3. Determine title
  v_title := COALESCE(new_title, v_source_repo.title);
  
  -- Determine origin (track the original source for fork chains)
  v_origin_id := COALESCE(v_source_repo.origin_repo_id, v_source_repo.id);

  -- 4. Create new repository
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
    v_source_repo.id,
    false -- Forks are private by default
  ) 
  RETURNING id INTO v_new_repo_id;

  -- 5. Create initial commit in new repo with COPIED content
  -- This INSERT is done with SECURITY DEFINER privileges
  INSERT INTO public.commits (
    repo_id,
    content,
    message,
    parent_commit_id
  ) VALUES (
    v_new_repo_id,
    v_commit_content,
    'Forked from ' || v_source_repo.title,
    NULL -- New history starts here
  );

  -- Log for debugging (can be removed in production)
  RAISE NOTICE 'Fork created: new_repo_id=%, source_repo_id=%, has_content=%', 
    v_new_repo_id, source_repo_id, (v_commit_content IS NOT NULL);

  RETURN v_new_repo_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fork_repository(UUID, UUID, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.fork_repository IS 'Forks a repository by creating a copy with the content from the latest commit. The forked repo is private by default and owned by the specified user.';
