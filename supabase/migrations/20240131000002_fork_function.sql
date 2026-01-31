-- Function to fork a repository
CREATE OR REPLACE FUNCTION public.fork_repository(
  source_repo_id UUID,
  new_owner_id UUID,
  new_title TEXT DEFAULT NULL
) 
RETURNS UUID -- Returns the new repo ID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (needed to read public repos from other users)
AS $$
DECLARE
  v_new_repo_id UUID;
  v_source_repo RECORD;
  v_latest_commit RECORD;
  v_title TEXT;
BEGIN
  -- 1. Get source repository details
  SELECT * INTO v_source_repo 
  FROM public.repositories 
  WHERE id = source_repo_id;
  
  IF v_source_repo IS NULL THEN
    RAISE EXCEPTION 'Source repository not found';
  END IF;

  -- 2. Determine title
  v_title := Coalesce(new_title, v_source_repo.title);

  -- 3. Create new repository
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
    Coalesce(v_source_repo.origin_repo_id, v_source_repo.id), -- If source has origin, use it. Else source IS origin.
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
    -- 5. Create initial commit in new repo with COPIED content (Deep Copy)
    INSERT INTO public.commits (
      repo_id,
      content,
      message,
      parent_commit_id
    ) VALUES (
      v_new_repo_id,
      v_latest_commit.content, -- The JSONB copy happens here
      'Forked from ' || v_source_repo.title,
      NULL -- New history starts here. We track lineage via repo, not commit graph generally.
    );
  END IF;

  -- 6. Increment fork count on source
  UPDATE public.repositories
  SET fork_count = fork_count + 1
  WHERE id = source_repo_id;

  RETURN v_new_repo_id;
END;
$$;
