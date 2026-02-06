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
 */
export async function getTeamMembers(teamId: string): Promise<TeamMemberWithUser[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      user:auth.users!inner(id, email, user_metadata)
    `)
    .eq('team_id', teamId)
    .order('added_at', { ascending: false })

  if (error) throw error

  // Type-safe mapping
  return (data || []).map(item => ({
    id: item.id,
    team_id: item.team_id,
    user_id: item.user_id,
    role: item.role as 'maintainer' | 'member',
    added_at: item.added_at,
    added_by: item.added_by,
    user: {
      id: item.user.id,
      email: item.user.email,
      user_metadata: item.user.user_metadata || {},
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
      metadata: { userId, role },
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
      metadata: { userId },
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
      metadata: { userId, newRole: role },
    }).catch(err => console.error('Audit log failed:', err))
  }
}

/**
 * Invite a user to a team by email
 * If the user is not in the organization, this will fail.
 * You should add them to the organization first.
 */
export async function inviteToTeam(
  teamId: string,
  email: string,
  role: 'maintainer' | 'member' = 'member'
): Promise<void> {
  // First, find the user by email
  const { data: users, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single()

  if (userError || !users) {
    throw new Error('User not found. Please invite them to the organization first.')
  }

  await addTeamMember(teamId, users.id, role)
}
