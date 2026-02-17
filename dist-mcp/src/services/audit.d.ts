export interface AuditLog {
    id: string;
    organization_id: string | null;
    repository_id: string | null;
    user_id: string | null;
    action: string;
    resource_type: string;
    resource_id: string;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    changes: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    status: 'success' | 'failure' | 'partial';
    error_message: string | null;
    created_at: string;
}
/**
 * Log an audit event
 * Used for tracking user actions for compliance and security
 */
export declare function logAuditEvent(params: {
    organizationId?: string;
    repositoryId?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    oldValues?: Record<string, any> | null;
    newValues?: Record<string, any> | null;
    changes?: Record<string, any> | null;
    status?: 'success' | 'failure' | 'partial';
    errorMessage?: string | null;
}): Promise<string>;
/**
 * Get audit logs for an organization
 */
export declare function getOrgAuditLogs(params: {
    organizationId: string;
    limit?: number;
    offset?: number;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
}): Promise<{
    logs: AuditLog[];
    total: number;
}>;
/**
 * Get audit logs for a repository
 */
export declare function getRepoAuditLogs(params: {
    repositoryId: string;
    limit?: number;
    offset?: number;
    action?: string;
}): Promise<{
    logs: AuditLog[];
    total: number;
}>;
/**
 * Export audit logs as CSV
 */
export declare function exportAuditLogsCSV(params: {
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
}): Promise<string>;
/**
 * Get activity summary for organization
 */
export declare function getOrgActivitySummary(organizationId: string): Promise<{
    totalActions: number;
    activeUsers: number;
    failedActions: number;
    lastActivity: string | null;
}>;
/**
 * Get activity summary for a specific user
 */
export declare function getUserActivitySummary(userId: string): Promise<{
    totalActions: number;
    failedActions: number;
    lastActivity: string | null;
    actionCounts: Record<string, number>;
}>;
/**
 * Get team-related activity logs
 * This includes team member changes, repository sharing, and team settings updates
 */
export declare function getTeamActivityLogs(params: {
    teamId: string;
    limit?: number;
    offset?: number;
}): Promise<{
    logs: AuditLog[];
    total: number;
}>;
//# sourceMappingURL=audit.d.ts.map