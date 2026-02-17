import type { Organization, OrganizationMember, Team } from '@/types/database';
/**
 * OrganizationMember with user details joined
 */
export interface OrganizationMemberWithUser extends OrganizationMember {
    user: {
        id: string;
        email: string;
        user_metadata?: {
            full_name?: string;
            avatar_url?: string;
            name?: string;
        };
    };
}
/**
 * Create a new organization using the RPC function.
 * This automatically adds the current user as the owner.
 */
export declare function createOrganization(params: {
    name: string;
    slug: string;
    description?: string | null;
}): Promise<string>;
/**
 * Get an organization by ID
 */
export declare function getOrganization(id: string): Promise<Organization | null>;
/**
 * Get an organization by slug
 */
export declare function getOrganizationBySlug(slug: string): Promise<Organization | null>;
/**
 * Get organizations for the current user
 */
export declare function getMyOrganizations(): Promise<(Organization & {
    role: string;
})[]>;
/**
 * Get organization members
 * Note: auth.users is not directly accessible via PostgREST.
 * To get user profiles, create a profiles table with a trigger on auth.users.
 */
export declare function getOrganizationMembers(organizationId: string): Promise<OrganizationMemberWithUser[]>;
/**
 * Update organization details
 */
export declare function updateOrganization(id: string, updates: Partial<Pick<Organization, 'name' | 'description' | 'avatar_url'>>): Promise<Organization>;
/**
 * Delete an organization (only owners can do this)
 */
export declare function deleteOrganization(id: string): Promise<void>;
/**
 * Check if a slug is available
 */
export declare function isSlugAvailable(slug: string): Promise<boolean>;
/**
 * Get teams for an organization
 */
export declare function getOrganizationTeams(organizationId: string): Promise<Team[]>;
/**
 * Create a new team within an organization
 */
export declare function createTeam(params: {
    organizationId: string;
    name: string;
    slug: string;
    description?: string;
    visibility?: 'visible' | 'secret';
}): Promise<string>;
/**
 * Add a member to an organization by email
 */
export declare function addMemberByEmail(organizationId: string, email: string, role?: 'admin' | 'member' | 'viewer'): Promise<{
    success: boolean;
    message?: string;
}>;
/**
 * Transfer a repository to an organization
 */
export declare function transferRepoToOrg(repoId: string, orgId: string): Promise<void>;
//# sourceMappingURL=organization.d.ts.map