/*
  Phase 7: SSO / SAML 2.0

  sso_configurations  – one row per organisation that has SSO enabled.
  Supabase Auth handles the actual SAML provider (added via the
  Supabase dashboard or Management API).  This table stores the
  *mapping* between an organisation and its Supabase SAML provider,
  plus the metadata admins configure through our UI.
*/

CREATE TABLE IF NOT EXISTS public.sso_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Which org this SSO config belongs to
    organization_id UUID REFERENCES public.organizations(id)
        ON DELETE CASCADE NOT NULL UNIQUE,

    -- Supabase SAML provider ID (from auth.saml_providers)
    -- NULL until the provider has been created via the Management API
    supabase_provider_id UUID,

    -- SAML IdP metadata (entered by the org admin)
    idp_entity_id    TEXT NOT NULL,                 -- e.g. https://idp.example.com
    idp_sso_url      TEXT NOT NULL,                 -- single-sign-on endpoint
    idp_certificate  TEXT NOT NULL,                 -- PEM-encoded X.509 cert (no headers)

    -- Email domain(s) that this SSO covers (comma-separated or array)
    -- Used to auto-detect "sign in with SSO" on the login page
    domains TEXT[] NOT NULL,                        -- e.g. ['example.com']

    -- Status flags
    is_active BOOLEAN DEFAULT false,               -- false until provider is synced
    is_verified BOOLEAN DEFAULT false,             -- true after first successful login

    -- Audit
    configured_by  UUID REFERENCES auth.users(id),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sso_org
    ON public.sso_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_sso_domains
    ON public.sso_configurations USING GIN (domains);

-- ──────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;

-- Only org owners / admins can read or write
CREATE POLICY "Org admins manage SSO"
    ON public.sso_configurations
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = sso_configurations.organization_id
              AND om.user_id         = auth.uid()
              AND om.role            IN ('owner', 'admin')
        )
    );

-- ──────────────────────────────────────────────
-- Helper: look up SSO by email domain (login page)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_sso_by_domain(p_domain TEXT)
RETURNS TABLE (
    organization_id       UUID,
    organization_name     TEXT,
    supabase_provider_id  UUID,
    is_active             BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.organization_id,
        o.name,
        sc.supabase_provider_id,
        sc.is_active
    FROM public.sso_configurations sc
    JOIN public.organizations       o  ON o.id = sc.organization_id
    WHERE p_domain = ANY(sc.domains)
      AND sc.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.sso_configurations IS
    'Maps organisations to Supabase SAML identity providers. '
    'domains[] drives auto-detection on the login page.';
