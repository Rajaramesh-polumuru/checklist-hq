import { supabase } from '@/lib/supabase';

export interface AuditLogEvent {
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  // For compatibility with existing calls
  newValues?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  changes?: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  organization_id: string;
  actor_id: string;
  event_type: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joins
  actor?: { email: string };
  actor_email?: string;
}

// Aliases for compatibility
export const getOrgAuditLogs = getOrganizationLogs;
export type AuditLog = AuditLogEntry;

/**
 * Log an enterprise event
 */
export async function logAuditEvent(event: AuditLogEvent) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; 

  const metadata = event.metadata || {};
  if (event.newValues) metadata.newValues = event.newValues;
  if (event.changes) metadata.changes = event.changes;

  const { error } = await supabase.from('audit_logs').insert({
    organization_id: event.organizationId,
    event_type: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    metadata,
    actor_id: user.id,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });

  if (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Fetch audit logs for an organization
 */
export async function getOrganizationLogs(
  orgId: string, 
  limit = 50, 
  offset = 0
): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      actor:actor_id ( email )
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  // Flatten actor email for easier consumption
  return (data || []).map((log: any) => ({
    ...log,
    actor_email: log.actor?.email
  }));
}

export interface TeamAuditLog {
  id: string
  action: string
  created_at: string
  user_id?: string
  new_values?: any
  changes?: any
  actor_email?: string
}

interface GetTeamActivityLogsParams {
  teamId: string
  limit?: number
}

export async function getTeamActivityLogs({ teamId, limit = 20 }: GetTeamActivityLogsParams) {
  // We match resource_id to teamId OR resource_id starting with teamId: (for repo sharing)
  const { data, error, count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .or(`resource_id.eq.${teamId},resource_id.like.${teamId}:%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  const logs: TeamAuditLog[] = (data || []).map((log: any) => ({
    id: log.id,
    action: log.event_type,
    created_at: log.created_at,
    user_id: log.actor_id,
    new_values: log.metadata?.newValues,
    changes: log.metadata?.changes,
    actor_email: log.actor?.email
  }))

  return { logs, total: count || 0 }
}
