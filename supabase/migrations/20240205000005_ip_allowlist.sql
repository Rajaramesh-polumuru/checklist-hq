/*
  Phase 7: IP Allowlisting

  When an organisation enables IP allowlisting every API / Edge-Function
  request originating from a member is checked against the list.
  An empty list with enforcement ON locks everyone out, so we guard
  against that in the RPC.
*/

-- ──────────────────────────────────────────────
-- 1. IP ALLOWLIST ENTRIES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ip_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID REFERENCES public.organizations(id)
        ON DELETE CASCADE NOT NULL,

    -- CIDR string  – e.g. "10.0.0.0/24"  or single host "1.2.3.4/32"
    cidr            INET NOT NULL,

    -- Human-friendly label
    label           TEXT,                          -- e.g. "Corporate HQ", "VPN"

    is_active       BOOLEAN DEFAULT true,
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_allowlist_org
    ON public.ip_allowlist(organization_id);

-- ──────────────────────────────────────────────
-- 2. ENFORCEMENT FLAG (per-org toggle)
-- ──────────────────────────────────────────────
-- Rather than a separate table we piggyback on organizations.
-- Add a single boolean column (defaults OFF).

ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS ip_allowlist_enabled BOOLEAN NOT NULL DEFAULT false;

-- ──────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────

ALTER TABLE public.ip_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins manage ip allowlist"
    ON public.ip_allowlist
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = ip_allowlist.organization_id
              AND om.user_id         = auth.uid()
              AND om.role            IN ('owner', 'admin')
        )
    );

-- ──────────────────────────────────────────────
-- 3. HELPER RPC – check a single IP against an org's list
--    Returns TRUE if allowed (or if allowlisting is disabled).
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_ip_allowed(
    p_organization_id UUID,
    p_ip              INET
) RETURNS BOOLEAN AS $$
DECLARE
    v_enabled BOOLEAN;
BEGIN
    -- If allowlisting is not enabled, everything is allowed.
    SELECT ip_allowlist_enabled INTO v_enabled
      FROM public.organizations WHERE id = p_organization_id;

    IF v_enabled IS NULL OR v_enabled = false THEN
        RETURN true;
    END IF;

    -- Check whether p_ip falls inside any active CIDR entry.
    RETURN EXISTS (
        SELECT 1 FROM public.ip_allowlist
         WHERE organization_id = p_organization_id
           AND is_active       = true
           AND p_ip <<= cidr   -- PostgreSQL "is contained by" operator
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────
-- 4. HELPER RPC – toggle the enforcement flag
--    Refuses to enable if there are zero active entries (prevents lockout).
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_ip_allowlist_enabled(
    p_organization_id UUID,
    p_enabled         BOOLEAN
) RETURNS VOID AS $$
BEGIN
    -- Safety: cannot enable an empty list
    IF p_enabled THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.ip_allowlist
             WHERE organization_id = p_organization_id
               AND is_active       = true
        ) THEN
            RAISE EXCEPTION 'Cannot enable IP allowlisting with no active entries – you would lock everyone out.';
        END IF;
    END IF;

    UPDATE public.organizations
       SET ip_allowlist_enabled = p_enabled
     WHERE id = p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
