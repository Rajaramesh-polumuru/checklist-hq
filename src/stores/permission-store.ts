import { create } from 'zustand'

/**
 * Organization roles and their capabilities
 */
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

/**
 * Team roles and their capabilities
 */
export type TeamRole = 'maintainer' | 'member'

/**
 * Permission state interface
 */
interface PermissionState {
  // Maps: organizationId -> role
  orgPermissions: Map<string, OrgRole>
  
  // Maps: teamId -> role
  teamPermissions: Map<string, TeamRole>

  // Actions
  setOrgPermission: (orgId: string, role: OrgRole) => void
  setTeamPermission: (teamId: string, role: TeamRole) => void
  clearOrgPermission: (orgId: string) => void
  clearTeamPermission: (teamId: string) => void
  clearAll: () => void

  // Organization capabilities
  canManageOrg: (orgId: string) => boolean
  canInviteMembers: (orgId: string) => boolean
  canAccessSettings: (orgId: string) => boolean
  canCreateTeams: (orgId: string) => boolean
  canDeleteOrg: (orgId: string) => boolean

  // Team capabilities
  canManageTeam: (teamId: string) => boolean
  canAddMembers: (teamId: string) => boolean
  canRemoveMembers: (teamId: string) => boolean
  canEditTeamSettings: (teamId: string) => boolean
  canDeleteTeam: (teamId: string) => boolean
}

/**
 * Permission store
 * 
 * This store manages client-side permission caching for UI rendering.
 * 
 * ⚠️ SECURITY NOTE: This is NOT a security boundary.
 * All permissions are enforced server-side via RLS policies.
 * This store is purely for UI/UX optimization.
 */
export const usePermissionStore = create<PermissionState>((set, get) => ({
  orgPermissions: new Map(),
  teamPermissions: new Map(),

  // ==================== Actions ====================

  setOrgPermission: (orgId: string, role: OrgRole) => {
    set((state) => {
      const newMap = new Map(state.orgPermissions)
      newMap.set(orgId, role)
      return { orgPermissions: newMap }
    })
  },

  setTeamPermission: (teamId: string, role: TeamRole) => {
    set((state) => {
      const newMap = new Map(state.teamPermissions)
      newMap.set(teamId, role)
      return { teamPermissions: newMap }
    })
  },

  clearOrgPermission: (orgId: string) => {
    set((state) => {
      const newMap = new Map(state.orgPermissions)
      newMap.delete(orgId)
      return { orgPermissions: newMap }
    })
  },

  clearTeamPermission: (teamId: string) => {
    set((state) => {
      const newMap = new Map(state.teamPermissions)
      newMap.delete(teamId)
      return { teamPermissions: newMap }
    })
  },

  clearAll: () => {
    set({ orgPermissions: new Map(), teamPermissions: new Map() })
  },

  // ==================== Organization Capabilities ====================

  canManageOrg: (orgId: string) => {
    const role = get().orgPermissions.get(orgId)
    return role === 'owner' || role === 'admin'
  },

  canInviteMembers: (orgId: string) => {
    const role = get().orgPermissions.get(orgId)
    // Everyone except viewers can invite
    return role !== 'viewer' && role !== undefined
  },

  canAccessSettings: (orgId: string) => {
    const role = get().orgPermissions.get(orgId)
    return role === 'owner' || role === 'admin'
  },

  canCreateTeams: (orgId: string) => {
    const role = get().orgPermissions.get(orgId)
    // Owners and admins can create teams
    return role === 'owner' || role === 'admin'
  },

  canDeleteOrg: (orgId: string) => {
    const role = get().orgPermissions.get(orgId)
    // Only owners can delete
    return role === 'owner'
  },

  // ==================== Team Capabilities ====================

  canManageTeam: (teamId: string) => {
    const role = get().teamPermissions.get(teamId)
    // Maintainers can manage teams
    return role === 'maintainer'
  },

  canAddMembers: (teamId: string) => {
    const role = get().teamPermissions.get(teamId)
    // Only maintainers can add members
    return role === 'maintainer'
  },

  canRemoveMembers: (teamId: string) => {
    const role = get().teamPermissions.get(teamId)
    // Only maintainers can remove members
    return role === 'maintainer'
  },

  canEditTeamSettings: (teamId: string) => {
    const role = get().teamPermissions.get(teamId)
    // Only maintainers can edit settings
    return role === 'maintainer'
  },

  canDeleteTeam: (teamId: string) => {
    const role = get().teamPermissions.get(teamId)
    // Only maintainers can delete teams
    return role === 'maintainer'
  },
}))

/**
 * Helper function to initialize permissions from organization members
 */
export function initOrgPermissions(memberships: Array<{ organization_id: string; role: OrgRole }>) {
  const store = usePermissionStore.getState()
  memberships.forEach(({ organization_id, role }) => {
    store.setOrgPermission(organization_id, role)
  })
}

/**
 * Helper function to initialize permissions from team members
 */
export function initTeamPermissions(memberships: Array<{ team_id: string; role: TeamRole }>) {
  const store = usePermissionStore.getState()
  memberships.forEach(({ team_id, role }) => {
    store.setTeamPermission(team_id, role)
  })
}
