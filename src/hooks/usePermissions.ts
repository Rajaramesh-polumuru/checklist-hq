import { usePermissionStore, type OrgRole, type TeamRole } from '@/stores/permission-store'

/**
 * Organization permission hook
 * 
 * Returns the user's role and capabilities for a specific organization.
 * 
 * @example
 * ```tsx
 * function OrgDashboard() {
 *   const { isOwner, canManage, canInvite } = useOrgPermission(orgId)
 *   
 *   return (
 *     <>
 *       {canManage && <SettingsButton />}
 *       {canInvite && <InviteButton />}
 *     </>
 *   )
 * }
 * ```
 */
export function useOrgPermission(orgId: string | undefined) {
  const orgPermissions = usePermissionStore((state) => state.orgPermissions)
  const canManageOrg = usePermissionStore((state) => state.canManageOrg)
  const canInviteMembers = usePermissionStore((state) => state.canInviteMembers)
  const canAccessSettings = usePermissionStore((state) => state.canAccessSettings)
  const canCreateTeams = usePermissionStore((state) => state.canCreateTeams)
  const canDeleteOrg = usePermissionStore((state) => state.canDeleteOrg)

  const role = orgId ? orgPermissions.get(orgId) : undefined

  return {
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    isMember: role === 'member',
    isViewer: role === 'viewer',
    
    // Capabilities
    canManage: orgId ? canManageOrg(orgId) : false,
    canInvite: orgId ? canInviteMembers(orgId) : false,
    canAccessSettings: orgId ? canAccessSettings(orgId) : false,
    canCreateTeams: orgId ? canCreateTeams(orgId) : false,
    canDelete: orgId ? canDeleteOrg(orgId) : false,
    
    // General access
    hasAccess: role !== undefined,
  }
}

/**
 * Team permission hook
 * 
 * Returns the user's role and capabilities for a specific team.
 * 
 * @example
 * ```tsx
 * function TeamSettings() {
 *   const { isMaintainer, canManage } = useTeamPermission(teamId)
 *   
 *   if (!canManage) {
 *     return <AccessDenied />
 *   }
 *   
 *   return <SettingsForm />
 * }
 * ```
 */
export function useTeamPermission(teamId: string | undefined) {
  const teamPermissions = usePermissionStore((state) => state.teamPermissions)
  const canManageTeam = usePermissionStore((state) => state.canManageTeam)
  const canAddMembers = usePermissionStore((state) => state.canAddMembers)
  const canRemoveMembers = usePermissionStore((state) => state.canRemoveMembers)
  const canEditTeamSettings = usePermissionStore((state) => state.canEditTeamSettings)
  const canDeleteTeam = usePermissionStore((state) => state.canDeleteTeam)

  const role = teamId ? teamPermissions.get(teamId) : undefined

  return {
    role,
    isMaintainer: role === 'maintainer',
    isMember: role === 'member',
    
    // Capabilities
    canManage: teamId ? canManageTeam(teamId) : false,
    canAddMembers: teamId ? canAddMembers(teamId) : false,
    canRemoveMembers: teamId ? canRemoveMembers(teamId) : false,
    canEditSettings: teamId ? canEditTeamSettings(teamId) : false,
    canDelete: teamId ? canDeleteTeam(teamId) : false,
    
    // General access
    hasAccess: role !== undefined,
  }
}

/**
 * Multi-organization permission hook
 * 
 * Returns a map of all organization permissions for the current user.
 * Useful for displaying a list of organizations with role badges.
 */
export function useOrgPermissions() {
  const orgPermissions = usePermissionStore((state) => state.orgPermissions)
  
  return {
    permissions: orgPermissions,
    getRole: (orgId: string): OrgRole | undefined => orgPermissions.get(orgId),
    hasAnyOrg: orgPermissions.size > 0,
  }
}

/**
 * Multi-team permission hook
 * 
 * Returns a map of all team permissions for the current user.
 */
export function useTeamPermissions() {
  const teamPermissions = usePermissionStore((state) => state.teamPermissions)
  
  return {
    permissions: teamPermissions,
    getRole: (teamId: string): TeamRole | undefined => teamPermissions.get(teamId),
    hasAnyTeam: teamPermissions.size > 0,
  }
}
