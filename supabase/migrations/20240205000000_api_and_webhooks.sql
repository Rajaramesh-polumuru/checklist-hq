/*
  Phase 6: API Keys and Webhooks
  
  Implements infrastructure for external integrations:
  - API Keys: Personal access tokens for programmatic access
  - Webhooks: Event subscriptions for repository actions
*/

-- ============================================
-- 1. API KEYS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Display name for the key (e.g. "CI/CD Pipeline")
    name TEXT NOT NULL,
    
    -- The key itself (hashed). We only show it once.
    -- Storing only the hash is best practice.
    -- Format: sk_live_...
    key_hash TEXT NOT NULL,
    
    -- Key prefix for identification (e.g. "sk_live_1234")
    key_prefix TEXT NOT NULL,
    
    -- Scopes (permissions)
    scopes TEXT[] DEFAULT '{read,write}'::text[],
    
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- User can revoke keys
    revoked_at TIMESTAMPTZ
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);

-- RLS Policies
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own keys (but not the hash/secret)
DROP POLICY IF EXISTS "Users can view own api keys" ON public.api_keys;
CREATE POLICY "Users can view own api keys" ON public.api_keys
    FOR SELECT USING (user_id = auth.uid());

-- Users can create keys
DROP POLICY IF EXISTS "Users can create api keys" ON public.api_keys;
CREATE POLICY "Users can create api keys" ON public.api_keys
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can revoke (update) their keys
DROP POLICY IF EXISTS "Users can update own api keys" ON public.api_keys;
CREATE POLICY "Users can update own api keys" ON public.api_keys
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete keys
DROP POLICY IF EXISTS "Users can delete own api keys" ON public.api_keys;
CREATE POLICY "Users can delete own api keys" ON public.api_keys
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 2. WEBHOOKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Webhooks belong to a repository OR an organization
    repository_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Target URL
    url TEXT NOT NULL,
    
    -- Secret for signing payloads
    secret TEXT,
    
    -- Events to subscribe to (e.g. ['run.completed', 'commit.created'])
    events TEXT[] NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Stats
    failure_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints: Must check exactly one parent
    CONSTRAINT webhook_parent_check CHECK (
        (repository_id IS NOT NULL AND organization_id IS NULL) OR
        (repository_id IS NULL AND organization_id IS NOT NULL)
    )
);

-- RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Repo owners can manage webhooks
DROP POLICY IF EXISTS "Repo owners manage webhooks" ON public.webhooks;
CREATE POLICY "Repo owners manage webhooks" ON public.webhooks
    USING (
        EXISTS (
            SELECT 1 FROM public.repositories r
            WHERE r.id = webhooks.repository_id
            AND r.owner_id = auth.uid()
        )
    );

-- Org admins can manage webhooks
DROP POLICY IF EXISTS "Org admins manage webhooks" ON public.webhooks;
CREATE POLICY "Org admins manage webhooks" ON public.webhooks
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = webhooks.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );
