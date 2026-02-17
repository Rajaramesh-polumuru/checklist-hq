import { supabase } from '@/lib/supabase'
import { logAuditEvent } from '@/services/audit'
import type { Agent, AgentInsert, AgentUpdate } from '@/types/database'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Agent with team memberships joined
 */
export interface AgentWithTeams extends Agent {
  teams: {
    id: string
    name: string
    slug: string
  }[]
}

/**
 * Create a new AI agent
 */
export async function createAgent(params: AgentInsert): Promise<string> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('agents')
    .insert({
      ...params,
      created_by: session.user.id,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  const agentId = data.id

  // Log audit event
  logAuditEvent({
    organizationId: params.organization_id,
    action: 'agent.created',
    resourceType: 'agent',
    resourceId: agentId,
    newValues: params,
  }).catch((err: any) => console.error('Audit log failed:', err))

  return agentId
}

/**
 * Get an agent by ID
 */
export async function getAgent(id: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as Agent
}

/**
 * Get agents for an organization
 */
export async function getOrganizationAgents(organizationId: string): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select()
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Agent[]
}

/**
 * Get agents for an organization with their team memberships
 */
export async function getOrganizationAgentsWithTeams(organizationId: string): Promise<AgentWithTeams[]> {
  const { data, error } = await supabase
    .from('agents')
    .select(`
      *,
      agent_team_memberships!inner(
        team:teams(id, name, slug)
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Transform the data to group teams
  const agents = (data || []).reduce((acc: AgentWithTeams[], agent: any) => {
    const existing = acc.find(a => a.id === agent.id)
    const team = agent.agent_team_memberships?.team

    if (existing && team) {
      existing.teams.push(team)
    } else if (team) {
      acc.push({
        ...agent,
        teams: [team],
      })
    }
    return acc
  }, [])

  return agents
}

/**
 * Update agent details
 */
export async function updateAgent(
  id: string,
  updates: AgentUpdate
): Promise<Agent> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  const agent = data as Agent

  // Log audit event
  logAuditEvent({
    organizationId: agent.organization_id,
    action: 'agent.updated',
    resourceType: 'agent',
    resourceId: id,
    newValues: updates,
  }).catch((err: any) => console.error('Audit log failed:', err))

  return agent
}

/**
 * Delete an agent
 */
export async function deleteAgent(id: string): Promise<void> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  // Get agent first for audit log
  const agent = await getAgent(id)
  if (!agent) {
    throw new Error('Agent not found')
  }

  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id)

  if (error) throw error

  // Log audit event
  logAuditEvent({
    organizationId: agent.organization_id,
    action: 'agent.deleted',
    resourceType: 'agent',
    resourceId: id,
    oldValues: agent,
  }).catch((err: any) => console.error('Audit log failed:', err))
}

// ==================== Agent Team Membership ====================

/**
 * Add an agent to a team
 */
export async function addAgentToTeam(
  agentId: string,
  teamId: string,
  permissions?: Record<string, unknown>
): Promise<void> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('agent_team_memberships')
    .insert({
      agent_id: agentId,
      team_id: teamId,
      permissions: permissions || null,
    })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Agent is already a member of this team')
    }
    throw error
  }

  // Get agent for audit log
  const agent = await getAgent(agentId)

  // Log audit event
  if (agent) {
    logAuditEvent({
      organizationId: agent.organization_id,
      action: 'agent.team_added',
      resourceType: 'agent_team',
      resourceId: agentId,
      newValues: { teamId, permissions },
    }).catch((err: any) => console.error('Audit log failed:', err))
  }
}

/**
 * Remove an agent from a team
 */
export async function removeAgentFromTeam(
  agentId: string,
  teamId: string
): Promise<void> {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('agent_team_memberships')
    .delete()
    .eq('agent_id', agentId)
    .eq('team_id', teamId)

  if (error) throw error

  // Get agent for audit log
  const agent = await getAgent(agentId)

  // Log audit event
  if (agent) {
    logAuditEvent({
      organizationId: agent.organization_id,
      action: 'agent.team_removed',
      resourceType: 'agent_team',
      resourceId: agentId,
      oldValues: { teamId },
    }).catch(err => console.error('Audit log failed:', err))
  }
}

/**
 * Get teams for an agent
 */
export async function getAgentTeams(agentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('agent_team_memberships')
    .select('team_id')
    .eq('agent_id', agentId)

  if (error) throw error
  return (data || []).map(m => m.team_id)
}

/**
 * Update last active timestamp for an agent
 */
export async function updateAgentLastActive(agentId: string): Promise<void> {
  const { error } = await supabase
    .from('agents')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', agentId)

  if (error) throw error
}
