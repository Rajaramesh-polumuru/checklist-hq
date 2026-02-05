import { supabase } from '@/lib/supabase'

export interface AuditLog {
  id: string
  organization_id: string | null
  repository_id: string | null
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  changes: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  status: 'success' | 'failure' | 'partial'
  error_message: string | null
  created_at: string
}

/**
 * Log an audit event
 * Used for tracking user actions for compliance and security
 */
export async function logAuditEvent(params: {
  organizationId?: string
  repositoryId?: string
  action: string // e.g., 'repository.created', 'run.completed'
  resourceType: string // e.g., 'repository', 'run', 'organization_member'
  resourceId: string
  oldValues?: Record<string, any> | null
  newValues?: Record<string, any> | null
  changes?: Record<string, any> | null
  status?: 'success' | 'failure' | 'partial'
  errorMessage?: string | null
}): Promise<string> {
  const {
    organizationId,
    repositoryId,
    action,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    changes,
    status = 'success',
    errorMessage,
  } = params

  try {
    // Call the database function
    const { data, error } = await supabase.rpc('log_audit_event', {
      p_organization_id: organizationId || null,
      p_repository_id: repositoryId || null,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_new_values: newValues || null,
      p_old_values: oldValues || null,
      p_changes: changes || null,
      p_status: status,
      p_error_message: errorMessage || null,
    })

    if (error) throw error
    return data as string
  } catch (err) {
    console.error('Failed to log audit event:', err)
    // Don't throw - logging should never block operations
    return ''
  }
}

/**
 * Get audit logs for an organization
 */
export async function getOrgAuditLogs(params: {
  organizationId: string
  limit?: number
  offset?: number
  action?: string
  userId?: string
  startDate?: Date
  endDate?: Date
}): Promise<{ logs: AuditLog[]; total: number }> {
  const {
    organizationId,
    limit = 50,
    offset = 0,
    action,
    userId,
    startDate,
    endDate,
  } = params

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action) query = query.eq('action', action)
  if (userId) query = query.eq('user_id', userId)
  if (startDate) query = query.gte('created_at', startDate.toISOString())
  if (endDate) query = query.lte('created_at', endDate.toISOString())

  const { data, error, count } = await query

  if (error) throw error
  return {
    logs: (data || []) as AuditLog[],
    total: count || 0,
  }
}

/**
 * Get audit logs for a repository
 */
export async function getRepoAuditLogs(params: {
  repositoryId: string
  limit?: number
  offset?: number
  action?: string
}): Promise<{ logs: AuditLog[]; total: number }> {
  const { repositoryId, limit = 50, offset = 0, action } = params

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('repository_id', repositoryId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action) query = query.eq('action', action)

  const { data, error, count } = await query

  if (error) throw error
  return {
    logs: (data || []) as AuditLog[],
    total: count || 0,
  }
}

/**
 * Export audit logs as CSV
 */
export async function exportAuditLogsCSV(params: {
  organizationId: string
  startDate?: Date
  endDate?: Date
}): Promise<string> {
  const { organizationId, startDate, endDate } = params

  const { logs } = await getOrgAuditLogs({
    organizationId,
    limit: 10000,
    startDate,
    endDate,
  })

  // Build CSV
  const headers = [
    'Timestamp',
    'User ID',
    'Action',
    'Resource Type',
    'Resource ID',
    'Status',
    'Changes',
  ]

  const rows = logs.map(log => [
    log.created_at,
    log.user_id || '',
    log.action,
    log.resource_type,
    log.resource_id,
    log.status,
    log.changes ? JSON.stringify(log.changes) : '',
  ])

  const csv =
    [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n') + '\n'

  return csv
}

/**
 * Get activity summary for organization
 */
export async function getOrgActivitySummary(organizationId: string): Promise<{
  totalActions: number
  activeUsers: number
  failedActions: number
  lastActivity: string | null
}> {
  const { data, error } = await supabase
    .from('audit_org_activity')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error || !data) {
    return {
      totalActions: 0,
      activeUsers: 0,
      failedActions: 0,
      lastActivity: null,
    }
  }

  return {
    totalActions: data.total_actions || 0,
    activeUsers: data.active_users || 0,
    failedActions: data.failed_actions || 0,
    lastActivity: data.last_activity || null,
  }
}

/**
 * Get activity summary for a specific user
 */
export async function getUserActivitySummary(userId: string): Promise<{
  totalActions: number
  failedActions: number
  lastActivity: string | null
  actionCounts: Record<string, number>
}> {
  const { data, error } = await supabase
    .from('audit_user_activity')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return {
      totalActions: 0,
      failedActions: 0,
      lastActivity: null,
      actionCounts: {},
    }
  }

  return {
    totalActions: data.total_actions || 0,
    failedActions: data.failed_actions || 0,
    lastActivity: data.last_activity || null,
    actionCounts: (data.action_counts as Record<string, number>) || {},
  }
}
