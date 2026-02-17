import { supabase } from '@/lib/supabase';
/**
 * Log an audit event
 * Used for tracking user actions for compliance and security
 */
export async function logAuditEvent(params) {
    const { organizationId, repositoryId, action, resourceType, resourceId, oldValues, newValues, changes, status = 'success', errorMessage, } = params;
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
        });
        if (error)
            throw error;
        return data;
    }
    catch (err) {
        console.error('Failed to log audit event:', err);
        // Don't throw - logging should never block operations
        return '';
    }
}
/**
 * Get audit logs for an organization
 */
export async function getOrgAuditLogs(params) {
    const { organizationId, limit = 50, offset = 0, action, userId, startDate, endDate, } = params;
    let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    if (action)
        query = query.eq('action', action);
    if (userId)
        query = query.eq('user_id', userId);
    if (startDate)
        query = query.gte('created_at', startDate.toISOString());
    if (endDate)
        query = query.lte('created_at', endDate.toISOString());
    const { data, error, count } = await query;
    if (error)
        throw error;
    return {
        logs: (data || []),
        total: count || 0,
    };
}
/**
 * Get audit logs for a repository
 */
export async function getRepoAuditLogs(params) {
    const { repositoryId, limit = 50, offset = 0, action } = params;
    let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('repository_id', repositoryId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    if (action)
        query = query.eq('action', action);
    const { data, error, count } = await query;
    if (error)
        throw error;
    return {
        logs: (data || []),
        total: count || 0,
    };
}
/**
 * Export audit logs as CSV
 */
export async function exportAuditLogsCSV(params) {
    const { organizationId, startDate, endDate } = params;
    const { logs } = await getOrgAuditLogs({
        organizationId,
        limit: 10000,
        startDate,
        endDate,
    });
    // Build CSV
    const headers = [
        'Timestamp',
        'User ID',
        'Action',
        'Resource Type',
        'Resource ID',
        'Status',
        'Changes',
    ];
    const rows = logs.map(log => [
        log.created_at,
        log.user_id || '',
        log.action,
        log.resource_type,
        log.resource_id,
        log.status,
        log.changes ? JSON.stringify(log.changes) : '',
    ]);
    const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n') + '\n';
    return csv;
}
/**
 * Get activity summary for organization
 */
export async function getOrgActivitySummary(organizationId) {
    const { data, error } = await supabase
        .from('audit_org_activity')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
    if (error || !data) {
        return {
            totalActions: 0,
            activeUsers: 0,
            failedActions: 0,
            lastActivity: null,
        };
    }
    return {
        totalActions: data.total_actions || 0,
        activeUsers: data.active_users || 0,
        failedActions: data.failed_actions || 0,
        lastActivity: data.last_activity || null,
    };
}
/**
 * Get activity summary for a specific user
 */
export async function getUserActivitySummary(userId) {
    const { data, error } = await supabase
        .from('audit_user_activity')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (error || !data) {
        return {
            totalActions: 0,
            failedActions: 0,
            lastActivity: null,
            actionCounts: {},
        };
    }
    return {
        totalActions: data.total_actions || 0,
        failedActions: data.failed_actions || 0,
        lastActivity: data.last_activity || null,
        actionCounts: data.action_counts || {},
    };
}
/**
 * Get team-related activity logs
 * This includes team member changes, repository sharing, and team settings updates
 */
export async function getTeamActivityLogs(params) {
    const { teamId, limit = 20, offset = 0 } = params;
    // Get logs where the resource_id contains the team ID
    // Team actions use resource_id format like "teamId" or "teamId:repoId"
    const { data, error, count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .or(`resource_id.eq.${teamId},resource_id.like.${teamId}:%`)
        .in('action', [
        'team.created',
        'team.updated',
        'team.deleted',
        'team.member_added',
        'team.member_removed',
        'team.member_role_updated',
        'team.repository_added',
        'team.repository_removed',
        'team.repository_permission_updated',
    ])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error)
        throw error;
    return {
        logs: (data || []),
        total: count || 0,
    };
}
//# sourceMappingURL=audit.js.map