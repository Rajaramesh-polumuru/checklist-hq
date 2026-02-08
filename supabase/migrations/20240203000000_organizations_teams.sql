/*
  Phase 5: Organizations and Teams

  Implements the core collaboration infrastructure:
  - Organizations: Workspaces that group users and repositories
  - Teams: Groups within organizations with shared access
  - Role-based access control (Owner, Admin, Member, Viewer)
  - Team-based repository permissions

  This migration supports Phase 5 of the roadmap:
  - Organizations (5.1)
  - Team Repositories (5.1)
  - Role-Based Access (5.1)
*/

-- ============================================
-- 1. ORGANIZATIONS TABLE
-- ============================================
-- Organizations are workspaces that group users and repositories.
-- They serve as the top-level container for team collaboration.

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Unique slug for URL-friendly identification (e.g., /org/acme-corp)
    slug TEXT NOT NULL UNIQUE,

    -- Display name
    name TEXT NOT NULL,

    -- Optional description
    description TEXT,

    -- Branding
    avatar_url TEXT,

    -- Billing/plan info (for future monetization)
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),

    -- Settings stored as JSONB for flexibility
    settings JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.organizations IS 'Workspaces that group users and repositories for team collaboration';
COMMENT ON COLUMN public.organizations.slug IS 'URL-friendly unique identifier (e.g., acme-corp)';
COMMENT ON COLUMN public.organizations.plan IS 'Subscription tier: free, pro, team, or enterprise';
COMMENT ON COLUMN public.organizations.settings IS 'Flexible JSON settings (e.g., default visibility, branding)';

-- Indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created ON public.organizations(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_organization_updated ON public.organizations;
CREATE TRIGGER on_organization_updated
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. ORGANIZATION MEMBERS TABLE
-- ============================================
-- Junction table linking users to organizations with roles.
-- Supports Owner, Admin, Member, and Viewer roles.

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Role within organization
    -- owner: Full control, can delete org, manage billing
    -- admin: Can manage members, teams, and settings
    -- member: Can create repos, join teams
    -- viewer: Read-only access to org resources
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),

    -- Invitation tracking
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),

    -- One membership per user per organization
    UNIQUE(organization_id, user_id)
);

COMMENT ON TABLE public.organization_members IS 'Links users to organizations with role-based access';
COMMENT ON COLUMN public.organization_members.role IS 'Permission level: owner, admin, member, or viewer';

-- Indexes for organization_members
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(organization_id, role);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. TEAMS TABLE
-- ============================================
-- Teams are groups within an organization that share repository access.
-- They allow fine-grained permission management.

CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent organization
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,

    -- Unique slug within organization (e.g., /org/acme-corp/team/engineering)
    slug TEXT NOT NULL,

    -- Display name
    name TEXT NOT NULL,

    -- Optional description
    description TEXT,

    -- Team visibility within org
    -- visible: All org members can see the team
    -- secret: Only team members can see the team
    visibility TEXT DEFAULT 'visible' CHECK (visibility IN ('visible', 'secret')),

    -- Default permission level for team members on assigned repos
    default_permission TEXT DEFAULT 'read' CHECK (default_permission IN ('read', 'write', 'admin')),

    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique slug per organization
    UNIQUE(organization_id, slug)
);

COMMENT ON TABLE public.teams IS 'Groups within organizations that share repository access';
COMMENT ON COLUMN public.teams.slug IS 'URL-friendly identifier unique within the organization';
COMMENT ON COLUMN public.teams.visibility IS 'visible: all org members can see; secret: only team members';
COMMENT ON COLUMN public.teams.default_permission IS 'Default access level for repos: read, write, or admin';

-- Indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_org ON public.teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON public.teams(organization_id, slug);
CREATE INDEX IF NOT EXISTS idx_teams_visibility ON public.teams(organization_id) WHERE visibility = 'visible';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_team_updated ON public.teams;
CREATE TRIGGER on_team_updated
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. TEAM MEMBERS TABLE
-- ============================================
-- Junction table linking users to teams with roles.

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Role within team
    -- maintainer: Can manage team members and settings
    -- member: Regular team member
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('maintainer', 'member')),

    -- Timestamps
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),

    -- One membership per user per team
    UNIQUE(team_id, user_id)
);

COMMENT ON TABLE public.team_members IS 'Links users to teams within organizations';
COMMENT ON COLUMN public.team_members.role IS 'maintainer: can manage team; member: regular access';

-- Indexes for team_members
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(team_id, role);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. REPOSITORY TEAM ACCESS TABLE
-- ============================================
-- Links teams to repositories with specific permission levels.
-- This enables team-based repository access control.

CREATE TABLE IF NOT EXISTS public.repository_team_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    repository_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,

    -- Permission level
    -- read: View repository and commits
    -- write: Create commits, create runs
    -- admin: Full control, can delete repo, manage access
    permission TEXT NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'write', 'admin')),

    -- Timestamps
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id),

    -- One access entry per team per repository
    UNIQUE(repository_id, team_id)
);

COMMENT ON TABLE public.repository_team_access IS 'Grants teams access to repositories with specific permissions';
COMMENT ON COLUMN public.repository_team_access.permission IS 'read: view only; write: create commits/runs; admin: full control';

-- Indexes for repository_team_access
CREATE INDEX IF NOT EXISTS idx_repo_team_access_repo ON public.repository_team_access(repository_id);
CREATE INDEX IF NOT EXISTS idx_repo_team_access_team ON public.repository_team_access(team_id);
CREATE INDEX IF NOT EXISTS idx_repo_team_access_permission ON public.repository_team_access(repository_id, permission);

-- Enable RLS
ALTER TABLE public.repository_team_access ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. ADD ORGANIZATION REFERENCE TO REPOSITORIES
-- ============================================
-- Repositories can optionally belong to an organization.
-- If organization_id is NULL, the repo is personal (owned by user).

ALTER TABLE public.repositories
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Index for organization repositories
CREATE INDEX IF NOT EXISTS idx_repos_org ON public.repositories(organization_id) WHERE organization_id IS NOT NULL;

COMMENT ON COLUMN public.repositories.organization_id IS 'Optional org ownership; NULL means personal repository';

-- ============================================
-- 6.5. HELPER FUNCTIONS FOR RLS
-- ============================================

-- Check if user is a member of an organization (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
    );
$$;

-- Check if user is a member of a team (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_team_member(team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = team_id
        AND user_id = auth.uid()
    );
$$;

-- Check if user is the owner of a repository (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_repo_owner(repo_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.repositories
        WHERE id = repo_id
        AND owner_id = auth.uid()
    );
$$;

-- ============================================
-- 7. RLS POLICIES FOR ORGANIZATIONS
-- ============================================

-- Anyone can view organizations (public directory)
DROP POLICY IF EXISTS "Organizations are publicly viewable" ON public.organizations;
CREATE POLICY "Organizations are publicly viewable"
ON public.organizations FOR SELECT
USING (true);

-- Only authenticated users can create organizations
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners and admins can update organizations
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON public.organizations;
CREATE POLICY "Owners and admins can update organizations"
ON public.organizations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- Only owners can delete organizations
DROP POLICY IF EXISTS "Only owners can delete organizations" ON public.organizations;
CREATE POLICY "Only owners can delete organizations"
ON public.organizations FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
);

-- ============================================
-- 8. RLS POLICIES FOR ORGANIZATION MEMBERS
-- ============================================

-- Members can view other members in their organizations
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
CREATE POLICY "Members can view org members"
ON public.organization_members FOR SELECT
USING (
    public.is_org_member(organization_id)
);

-- Users can view their own memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON public.organization_members;
CREATE POLICY "Users can view own memberships"
ON public.organization_members FOR SELECT
USING (user_id = auth.uid());

-- Owners and admins can add members
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.organization_members;
CREATE POLICY "Owners and admins can add members"
ON public.organization_members FOR INSERT
WITH CHECK (
    -- Allow self-insertion when creating an org (as owner)
    (user_id = auth.uid() AND role = 'owner')
    OR
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- Owners and admins can update member roles
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.organization_members;
CREATE POLICY "Owners and admins can update members"
ON public.organization_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- Owners and admins can remove members; users can remove themselves
DROP POLICY IF EXISTS "Owners and admins can remove members" ON public.organization_members;
CREATE POLICY "Owners and admins can remove members"
ON public.organization_members FOR DELETE
USING (
    user_id = auth.uid()  -- Users can leave
    OR
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- ============================================
-- 9. RLS POLICIES FOR TEAMS
-- ============================================

-- Org members can view visible teams; team members can view secret teams
DROP POLICY IF EXISTS "Org members can view visible teams" ON public.teams;
CREATE POLICY "Org members can view visible teams"
ON public.teams FOR SELECT
USING (
    visibility = 'visible' AND
    public.is_org_member(organization_id)
);

DROP POLICY IF EXISTS "Team members can view secret teams" ON public.teams;
CREATE POLICY "Team members can view secret teams"
ON public.teams FOR SELECT
USING (
    public.is_team_member(id)
);

-- Org admins and owners can create teams
DROP POLICY IF EXISTS "Org admins can create teams" ON public.teams;
CREATE POLICY "Org admins can create teams"
ON public.teams FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = teams.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- Org admins/owners and team maintainers can update teams
DROP POLICY IF EXISTS "Team maintainers can update teams" ON public.teams;
CREATE POLICY "Team maintainers can update teams"
ON public.teams FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = teams.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.role = 'maintainer'
    )
);

-- Org admins and owners can delete teams
DROP POLICY IF EXISTS "Org admins can delete teams" ON public.teams;
CREATE POLICY "Org admins can delete teams"
ON public.teams FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = teams.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- ============================================
-- 10. RLS POLICIES FOR TEAM MEMBERS
-- ============================================

-- Team members can view other team members
DROP POLICY IF EXISTS "Team members can view team members" ON public.team_members;
CREATE POLICY "Team members can view team members"
ON public.team_members FOR SELECT
USING (
    public.is_team_member(team_id)
);

-- Org admins can view all team members
DROP POLICY IF EXISTS "Org admins can view all team members" ON public.team_members;
CREATE POLICY "Org admins can view all team members"
ON public.team_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.teams t
        JOIN public.organization_members om ON om.organization_id = t.organization_id
        WHERE t.id = team_members.team_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- Org admins and team maintainers can add team members
DROP POLICY IF EXISTS "Team maintainers can add members" ON public.team_members;
CREATE POLICY "Team maintainers can add members"
ON public.team_members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teams t
        JOIN public.organization_members om ON om.organization_id = t.organization_id
        WHERE t.id = team_members.team_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'maintainer'
    )
);

-- Org admins and team maintainers can update team members
DROP POLICY IF EXISTS "Team maintainers can update members" ON public.team_members;
CREATE POLICY "Team maintainers can update members"
ON public.team_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.teams t
        JOIN public.organization_members om ON om.organization_id = t.organization_id
        WHERE t.id = team_members.team_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'maintainer'
    )
);

-- Org admins and team maintainers can remove members; users can remove themselves
DROP POLICY IF EXISTS "Team maintainers can remove members" ON public.team_members;
CREATE POLICY "Team maintainers can remove members"
ON public.team_members FOR DELETE
USING (
    user_id = auth.uid()  -- Users can leave teams
    OR
    EXISTS (
        SELECT 1 FROM public.teams t
        JOIN public.organization_members om ON om.organization_id = t.organization_id
        WHERE t.id = team_members.team_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'maintainer'
    )
);

-- ============================================
-- 11. RLS POLICIES FOR REPOSITORY TEAM ACCESS
-- ============================================

-- Repo owners and team members can view access entries
DROP POLICY IF EXISTS "Repo owners can view team access" ON public.repository_team_access;
CREATE POLICY "Repo owners can view team access"
ON public.repository_team_access FOR SELECT
USING (
    public.is_repo_owner(repository_id)
);

DROP POLICY IF EXISTS "Team members can view their team's access" ON public.repository_team_access;
CREATE POLICY "Team members can view their team's access"
ON public.repository_team_access FOR SELECT
USING (
    public.is_team_member(team_id)
);

-- Org admins can view all repo access in their org
DROP POLICY IF EXISTS "Org admins can view repo access" ON public.repository_team_access;
CREATE POLICY "Org admins can view repo access"
ON public.repository_team_access FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.teams t
        JOIN public.organization_members om ON om.organization_id = t.organization_id
        WHERE t.id = repository_team_access.team_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- Repo owners can grant team access
DROP POLICY IF EXISTS "Repo owners can grant team access" ON public.repository_team_access;
CREATE POLICY "Repo owners can grant team access"
ON public.repository_team_access FOR INSERT
WITH CHECK (
    public.is_repo_owner(repository_id)
    OR
    -- Org admins can grant access to org repos
    EXISTS (
        SELECT 1 FROM public.repositories r
        JOIN public.organization_members om ON om.organization_id = r.organization_id
        WHERE r.id = repository_team_access.repository_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- Repo owners and org admins can update team access
DROP POLICY IF EXISTS "Repo owners can update team access" ON public.repository_team_access;
CREATE POLICY "Repo owners can update team access"
ON public.repository_team_access FOR UPDATE
USING (
    public.is_repo_owner(repository_id)
    OR
    EXISTS (
        SELECT 1 FROM public.repositories r
        JOIN public.organization_members om ON om.organization_id = r.organization_id
        WHERE r.id = repository_team_access.repository_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- Repo owners and org admins can revoke team access
DROP POLICY IF EXISTS "Repo owners can revoke team access" ON public.repository_team_access;
CREATE POLICY "Repo owners can revoke team access"
ON public.repository_team_access FOR DELETE
USING (
    public.is_repo_owner(repository_id)
    OR
    EXISTS (
        SELECT 1 FROM public.repositories r
        JOIN public.organization_members om ON om.organization_id = r.organization_id
        WHERE r.id = repository_team_access.repository_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- ============================================
-- 12. UPDATE REPOSITORY POLICIES FOR TEAM ACCESS
-- ============================================

-- Teams with read/write/admin access can view repos
DROP POLICY IF EXISTS "Teams can view accessible repos" ON public.repositories;
CREATE POLICY "Teams can view accessible repos"
ON public.repositories FOR SELECT
USING (
    public.user_has_repo_permission(auth.uid(), id, 'read')
);

-- Teams with write/admin access can update repos
DROP POLICY IF EXISTS "Teams with write access can update repos" ON public.repositories;
CREATE POLICY "Teams with write access can update repos"
ON public.repositories FOR UPDATE
USING (
    public.user_has_repo_permission(auth.uid(), id, 'write')
);

-- Teams with admin access can delete repos
DROP POLICY IF EXISTS "Teams with admin access can delete repos" ON public.repositories;
CREATE POLICY "Teams with admin access can delete repos"
ON public.repositories FOR DELETE
USING (
    public.user_has_repo_permission(auth.uid(), id, 'admin')
);

-- ============================================
-- 13. UPDATE COMMITS POLICIES FOR TEAM ACCESS
-- ============================================

-- Teams can view commits on accessible repos
DROP POLICY IF EXISTS "Teams can view commits on accessible repos" ON public.commits;
CREATE POLICY "Teams can view commits on accessible repos"
ON public.commits FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.repository_team_access rta
        JOIN public.team_members tm ON tm.team_id = rta.team_id
        WHERE rta.repository_id = commits.repo_id
        AND tm.user_id = auth.uid()
    )
);

-- Teams with write access can create commits
DROP POLICY IF EXISTS "Teams with write access can create commits" ON public.commits;
CREATE POLICY "Teams with write access can create commits"
ON public.commits FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.repository_team_access rta
        JOIN public.team_members tm ON tm.team_id = rta.team_id
        WHERE rta.repository_id = commits.repo_id
        AND tm.user_id = auth.uid()
        AND rta.permission IN ('write', 'admin')
    )
);

-- ============================================
-- 14. UPDATE RUNS POLICIES FOR TEAM ACCESS
-- ============================================

-- Teams can view runs on accessible repos
DROP POLICY IF EXISTS "Teams can view runs on accessible repos" ON public.runs;
CREATE POLICY "Teams can view runs on accessible repos"
ON public.runs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.repository_team_access rta
        JOIN public.team_members tm ON tm.team_id = rta.team_id
        WHERE rta.repository_id = runs.repo_id
        AND tm.user_id = auth.uid()
    )
);

-- Teams with write access can create runs
DROP POLICY IF EXISTS "Teams with write access can create runs" ON public.runs;
CREATE POLICY "Teams with write access can create runs"
ON public.runs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.repository_team_access rta
        JOIN public.team_members tm ON tm.team_id = rta.team_id
        WHERE rta.repository_id = runs.repo_id
        AND tm.user_id = auth.uid()
        AND rta.permission IN ('write', 'admin')
    )
);

-- Teams with write access can update runs they create
DROP POLICY IF EXISTS "Teams with write access can update runs" ON public.runs;
CREATE POLICY "Teams with write access can update runs"
ON public.runs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.repository_team_access rta
        JOIN public.team_members tm ON tm.team_id = rta.team_id
        WHERE rta.repository_id = runs.repo_id
        AND tm.user_id = auth.uid()
        AND rta.permission IN ('write', 'admin')
    )
);

-- ============================================
-- 15. HELPER FUNCTIONS
-- ============================================

-- Function to create an organization with the creator as owner
CREATE OR REPLACE FUNCTION public.create_organization(
    p_name TEXT,
    p_slug TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Validate slug format (lowercase, alphanumeric, hyphens)
    IF p_slug !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' AND LENGTH(p_slug) > 2 THEN
        RAISE EXCEPTION 'Invalid slug format. Use lowercase letters, numbers, and hyphens.';
    END IF;

    -- Create organization
    INSERT INTO public.organizations (name, slug, description)
    VALUES (p_name, p_slug, p_description)
    RETURNING id INTO v_org_id;

    -- Add creator as owner
    INSERT INTO public.organization_members (organization_id, user_id, role, joined_at)
    VALUES (v_org_id, auth.uid(), 'owner', NOW());

    RETURN v_org_id;
END;
$$;

COMMENT ON FUNCTION public.create_organization IS 'Creates an organization and adds the caller as owner';

-- Function to create a team within an organization
CREATE OR REPLACE FUNCTION public.create_team(
    p_organization_id UUID,
    p_name TEXT,
    p_slug TEXT,
    p_description TEXT DEFAULT NULL,
    p_visibility TEXT DEFAULT 'visible'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team_id UUID;
BEGIN
    -- Verify caller is org admin or owner
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = p_organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Not authorized to create teams in this organization';
    END IF;

    -- Create team
    INSERT INTO public.teams (organization_id, name, slug, description, visibility)
    VALUES (p_organization_id, p_name, p_slug, p_description, p_visibility)
    RETURNING id INTO v_team_id;

    -- Add creator as maintainer
    INSERT INTO public.team_members (team_id, user_id, role, added_by)
    VALUES (v_team_id, auth.uid(), 'maintainer', auth.uid());

    RETURN v_team_id;
END;
$$;



COMMENT ON FUNCTION public.create_team IS 'Creates a team within an organization and adds the caller as maintainer';

-- Function to check if a user has a specific permission on a repository
-- Moved here to be available for RLS policies
CREATE OR REPLACE FUNCTION public.user_has_repo_permission(
    p_user_id UUID,
    p_repo_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    -- Check if user is the repo owner
    IF EXISTS (
        SELECT 1 FROM public.repositories r
        WHERE r.id = p_repo_id AND r.owner_id = p_user_id
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check team-based permissions
    SELECT EXISTS (
        SELECT 1 FROM public.repository_team_access rta
        JOIN public.team_members tm ON tm.team_id = rta.team_id
        WHERE rta.repository_id = p_repo_id
        AND tm.user_id = p_user_id
        AND (
            rta.permission = p_permission
            OR (p_permission = 'read' AND rta.permission IN ('write', 'admin'))
            OR (p_permission = 'write' AND rta.permission = 'admin')
        )
    ) INTO v_has_permission;

    RETURN v_has_permission;
END;
$$;

COMMENT ON FUNCTION public.user_has_repo_permission IS 'Checks if a user has a specific permission level on a repository';



-- Function to get user's role in an organization
CREATE OR REPLACE FUNCTION public.get_user_org_role(
    p_user_id UUID,
    p_organization_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.organization_members
    WHERE organization_id = p_organization_id
    AND user_id = p_user_id;

    RETURN v_role;  -- Returns NULL if not a member
END;
$$;

COMMENT ON FUNCTION public.get_user_org_role IS 'Returns the user''s role in an organization, or NULL if not a member';

-- Function to transfer repository to organization
CREATE OR REPLACE FUNCTION public.transfer_repo_to_org(
    p_repo_id UUID,
    p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify caller owns the repo
    IF NOT EXISTS (
        SELECT 1 FROM public.repositories r
        WHERE r.id = p_repo_id AND r.owner_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not authorized to transfer this repository';
    END IF;

    -- Verify caller is org admin or owner
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = p_organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Not authorized to add repositories to this organization';
    END IF;

    -- Transfer repository
    UPDATE public.repositories
    SET organization_id = p_organization_id
    WHERE id = p_repo_id;

    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.transfer_repo_to_org IS 'Transfers a personal repository to an organization';

-- ============================================
-- 16. ENABLE REALTIME FOR NEW TABLES
-- ============================================

DO $$
BEGIN
    -- Add organizations if not present
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'organizations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
    END IF;

    -- Add organization_members if not present
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'organization_members') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_members;
    END IF;

    -- Add teams if not present
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'teams') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
    END IF;

    -- Add team_members if not present
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'team_members') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
    END IF;

    -- Add repository_team_access if not present
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'repository_team_access') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.repository_team_access;
    END IF;
END $$;
