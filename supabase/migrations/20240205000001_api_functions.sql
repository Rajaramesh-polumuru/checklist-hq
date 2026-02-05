/*
  Phase 6: API Functions (REST-like endpoints via RPC)
  
  Since we are using Supabase, we can expose "API endpoints" as PostgreSQL functions 
  that are callable via the REST API or client SDK.
  
  Security: All functions must be rigorous about checking API Key validity if called externally,
  or rely on standard RLS if called from the client.
*/

-- ============================================
-- 1. VALIDATE API KEY HELPER
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_api_key(
    p_key_hash TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id
    FROM public.api_keys
    WHERE key_hash = p_key_hash
    AND revoked_at IS NULL;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or revoked API key';
    END IF;
    
    -- Update last used timestamp
    UPDATE public.api_keys
    SET last_used_at = NOW()
    WHERE key_hash = p_key_hash;
    
    RETURN v_user_id;
END;
$$;

-- ============================================
-- 2. CREATE RUN (API)
-- ============================================

CREATE OR REPLACE FUNCTION public.api_create_run(
    p_repo_id UUID,
    p_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS if needed, but we check access manually
AS $$
DECLARE
    v_user_id UUID; -- The user the API key belongs to
    v_commit_id UUID;
    v_run_id UUID;
    v_repo_data RECORD;
BEGIN
    -- 1. Validate API Key (Assumes it's passed via custom header or handled by middleware)
    -- In Supabase, usually you authenticate via JWT. If we want pure API key access without JWT,
    -- we'd need to wrap this in an Edge Function.
    -- FOR NOW: We assume the caller is authenticated via standard Supabase Auth (or Service Role).
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Check Repository Access
    SELECT * INTO v_repo_data FROM public.repositories WHERE id = p_repo_id;
    IF v_repo_data.id IS NULL THEN
        RAISE EXCEPTION 'Repository not found';
    END IF;
    
    -- (Add detailed permission check here: is owner OR has team write access)
    -- reusing existing logic...
    IF v_repo_data.owner_id != v_user_id AND NOT public.user_has_repo_permission(v_user_id, p_repo_id, 'write') THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    -- 3. Get Latest Commit
    SELECT id INTO v_commit_id FROM public.commits 
    WHERE repo_id = p_repo_id 
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_commit_id IS NULL THEN
        RAISE EXCEPTION 'Repository has no content';
    END IF;

    -- 4. Create Run
    INSERT INTO public.runs (
        repo_id, 
        commit_id, 
        user_id, 
        status, 
        name, 
        started_at,
        progress
    )
    VALUES (
        p_repo_id,
        v_commit_id,
        v_user_id,
        'active',
        p_name,
        NOW(),
        '{}'::jsonb
    )
    RETURNING id INTO v_run_id;

    RETURN jsonb_build_object(
        'id', v_run_id,
        'status', 'active',
        'url', '/app/run/' || v_run_id
    );
END;
$$;

-- ============================================
-- 3. LIST REPOSITORIES (API)
-- ============================================

CREATE OR REPLACE FUNCTION public.api_list_repos()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_repos JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT jsonb_agg(row_to_json(r))
    INTO v_repos
    FROM (
        SELECT id, title, description, is_public, created_at, updated_at
        FROM public.repositories
        WHERE owner_id = v_user_id
        OR public.user_has_repo_permission(v_user_id, id, 'read')
        ORDER BY updated_at DESC
        LIMIT 50
    ) r;

    RETURN COALESCE(v_repos, '[]'::jsonb);
END;
$$;
