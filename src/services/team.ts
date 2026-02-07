import { supabase } from '@/lib/supabase'
import { logAuditEvent } from '@/services/audit'
import type { Team, TeamMember, TeamInsert, TeamUpdate } from '@/types/database'
import { useAuthStore } from '@/stores/auth-store'

/**
 * TeamMember with user details joined
 */
export interface TeamMemberWithUser extends TeamMember {
  user: {
    id: string
    email: string
    user_metadata?: Record<string, unknown>
  }
}

/**
 * Create a new team
 */
export async function createTeam(params: TeamInsert): Promise<string> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('teams')
    .insert(params)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('A team with this slug already exists in this organization.')
    }
    throw error
  }

  const teamId = data.id

  // Log audit event
  logAuditEvent({
    organizationId: params.organization_id,
    action: 'team.created',
    resourceType: 'team',
    resourceId: teamId,
    newValues: params,
  }).catch(err => console.error('Audit log failed:', err))

  return teamId
}

/**
 * Get a team by ID
 */
export async function getTeam(id: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as Team
}

/**
 * Get teams for an organization
 */
export async function getOrganizationTeams(organizationId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select()
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Team[]
}

/**
 * Update team details
 */
export async function updateTeam(
  id: string,
  updates: TeamUpdate
): Promise<Team> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  const team = data as Team

  // Log audit event
  logAuditEvent({
    organizationId: team.organization_id,
    action: 'team.updated',
    resourceType: 'team',
    resourceId: id,
    newValues: updates,
  }).catch(err => console.error('Audit log failed:', err))

  return team
}

/**
 * Delete a team
 */
export async function deleteTeam(id: string): Promise<void> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  // Get team first for audit log
  const team = await getTeam(id)
  if (!team) {
    throw new Error('Team not found')
  }

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id)

  if (error) throw error

  // Log audit event
  logAuditEvent({
    organizationId: team.organization_id,
    action: 'team.deleted',
    resourceType: 'team',
    resourceId: id,
    oldValues: team,
  }).catch(err => console.error('Audit log failed:', err))
}

// ==================== Team Member Management ====================

/**
 * Get team members with user details
 * Note: auth.users is not directly accessible via PostgREST.
 * To get user profiles, create a profiles table with a trigger on auth.users.
 */
export async function getTeamMembers(teamId: string): Promise<TeamMemberWithUser[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .order('added_at', { ascending: false })

  if (error) throw error

  // Return members with placeholder user data
  // TODO: Join with a profiles table when available
  return (data || []).map((item) => ({
    id: item.id,
    team_id: item.team_id,
    user_id: item.user_id,
    role: item.role as 'maintainer' | 'member',
    added_at: item.added_at,
    added_by: item.added_by,
    user: {
      id: item.user_id,
      email: '', // Not available without profiles table
      user_metadata: {},
    },
  }))
}

/**
 * Add a member to a team
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: 'maintainer' | 'member' = 'member'
): Promise<void> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
      role,
      added_by: session.user.id,
    })

  if (error) {
    if (error.code === '23505') {
      throw new Error('User is already a member of this team')
    }
    throw error
  }

  // Get team for audit log
  const team = await getTeam(teamId)

  // Log audit event
  if (team) {
    logAuditEvent({
      organizationId: team.organization_id,
      action: 'team.member_added',
      resourceType: 'team_member',
      resourceId: teamId,
      newValues: { userId, role },
    }).catch(err => console.error('Audit log failed:', err))
  }
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<void> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  // Check if this is the last maintainer
  const members = await getTeamMembers(teamId)
  const maintainers = members.filter(m => m.role === 'maintainer')
  const memberToRemove = members.find(m => m.user_id === userId)

  if (maintainers.length === 1 && memberToRemove?.role === 'maintainer') {
    throw new Error('Cannot remove the last maintainer. Please promote another member first.')
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) throw error

  // Get team for audit log
  const team = await getTeam(teamId)

  // Log audit event
  if (team) {
    logAuditEvent({
      organizationId: team.organization_id,
      action: 'team.member_removed',
      resourceType: 'team_member',
      resourceId: teamId,
      oldValues: { userId },
    }).catch(err => console.error('Audit log failed:', err))
  }
}

/**
 * Update a team member's role
 */
export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  role: 'maintainer' | 'member'
): Promise<void> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  // Check if demoting the last maintainer
  const members = await getTeamMembers(teamId)
  const maintainers = members.filter(m => m.role === 'maintainer')
  const memberToUpdate = members.find(m => m.user_id === userId)

  if (
    maintainers.length === 1 &&
    memberToUpdate?.role === 'maintainer' &&
    role === 'member'
  ) {
    throw new Error('Cannot demote the last maintainer. Please promote another member first.')
  }

  const { error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) throw error

  // Get team for audit log
  const team = await getTeam(teamId)

  // Log audit event
  if (team) {
    logAuditEvent({
      organizationId: team.organization_id,
      action: 'team.member_role_updated',
      resourceType: 'team_member',
      resourceId: teamId,
      changes: { userId, newRole: role },
    }).catch(err => console.error('Audit log failed:', err))
  }
}

/**
 * Invite a user to a team by email
 * Note: This requires an RPC function to look up users by email
 * since auth.users is not directly accessible via PostgREST.
 */
export async function inviteToTeam(
  teamId: string,
  email: string,
  role: 'maintainer' | 'member' = 'member'
): Promise<void> {
  // Try to use an RPC function to find user by email
  const { data, error } = await supabase.rpc('get_user_id_by_email', {
    p_email: email,
  })

  if (error || !data) {
    throw new Error('User not found. Please ensure they have an account and try again.')
  }

  await addTeamMember(teamId, data as string, role)
}

// ==================== Team Repository Access ====================

import type { Repository, RepositoryTeamAccess } from '@/types/database'

/**
 * Repository with team access permission
 */
export interface TeamRepositoryWithAccess extends Repository {
  permission: 'read' | 'write' | 'admin'
  granted_at: string
}

/**
 * Get repositories accessible by a team
 */
export async function getTeamRepositories(teamId: string): Promise<TeamRepositoryWithAccess[]> {
  const { data, error } = await supabase
    .from('repository_team_access')
    .select(`
      permission,
      granted_at,
      repository:repositories(*)
    `)
    .eq('team_id', teamId)
    .order('granted_at', { ascending: false })

  if (error) throw error

  // Transform the data to include permission with repository
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    ...item.repository,
    permission: item.permission,
    granted_at: item.granted_at,
  }))
}

/**
 * Add repository access to a team
 */
export async function addRepositoryToTeam(
  teamId: string,
  repositoryId: string,
  permission: 'read' | 'write' | 'admin' = 'read'
): Promise<void> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('repository_team_access')
    .insert({
      team_id: teamId,
      repository_id: repositoryId,
      permission,
      granted_by: session.user.id,
    })

  if (error) {
    if (error.code === '23505') {
      throw new Error('This repository is already shared with this team')
    }
    throw error
  }

  // Get team for audit log
  const team = await getTeam(teamId)

  // Log audit event
  if (team) {
    logAuditEvent({
      organizationId: team.organization_id,
      action: 'team.repository_added',
      resourceType: 'repository_team_access',
      resourceId: `${teamId}:${repositoryId}`,
      newValues: { repositoryId, permission },
    }).catch(err => console.error('Audit log failed:', err))
  }
}

/**
 * Remove repository access from a team
 */
export async function removeRepositoryFromTeam(
  teamId: string,
  repositoryId: string
): Promise<void> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('repository_team_access')
    .delete()
    .eq('team_id', teamId)
    .eq('repository_id', repositoryId)

  if (error) throw error

  // Get team for audit log
  const team = await getTeam(teamId)

  // Log audit event
  if (team) {
    logAuditEvent({
      organizationId: team.organization_id,
      action: 'team.repository_removed',
      resourceType: 'repository_team_access',
      resourceId: `${teamId}:${repositoryId}`,
      oldValues: { repositoryId },
    }).catch(err => console.error('Audit log failed:', err))
  }
}

/**
 * Update repository permission for a team
 */
export async function updateTeamRepositoryPermission(
  teamId: string,
  repositoryId: string,
  permission: 'read' | 'write' | 'admin'
): Promise<void> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('repository_team_access')
    .update({ permission })
    .eq('team_id', teamId)
    .eq('repository_id', repositoryId)

  if (error) throw error

  // Get team for audit log
  const team = await getTeam(teamId)

  // Log audit event
  if (team) {
    logAuditEvent({
      organizationId: team.organization_id,
      action: 'team.repository_permission_updated',
      resourceType: 'repository_team_access',
      resourceId: `${teamId}:${repositoryId}`,
      changes: { newPermission: permission },
    }).catch(err => console.error('Audit log failed:', err))
  }
}

/**
 * Get all team access entries for a repository
 */
export async function getRepositoryTeamAccess(repositoryId: string): Promise<(RepositoryTeamAccess & { team: Team })[]> {
  const { data, error } = await supabase
    .from('repository_team_access')
    .select(`
      *,
      team:teams(*)
    `)
    .eq('repository_id', repositoryId)
    .order('granted_at', { ascending: false })

  if (error) throw error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    id: item.id,
    repository_id: item.repository_id,
    team_id: item.team_id,
    permission: item.permission,
    granted_at: item.granted_at,
    granted_by: item.granted_by,
    team: item.team,
  }))
}
