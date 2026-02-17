/**
 * Cached wrappers around the hot service queries.
 *
 * Callers import from here instead of the raw service when they want
 * stale-while-revalidate behaviour.  Mutations call the appropriate
 * `invalidate…` helper so the next read is fresh.
 */
import { getOrgAuditLogs } from '@/services/audit';
export declare const cachedGetOrgAnalytics: (orgId: string) => Promise<unknown>;
export declare const cachedGetOrgMembers: (orgId: string) => Promise<unknown>;
export declare const cachedGetOrgTeams: (orgId: string) => Promise<unknown>;
export declare const cachedGetOrgRepos: (orgId: string) => Promise<unknown>;
export declare const cachedGetMyOrganizations: () => Promise<unknown>;
export declare const cachedGetUserRepos: (userId: string) => Promise<unknown>;
export declare const cachedGetOrgAuditLogs: (params: Parameters<typeof getOrgAuditLogs>[0]) => Promise<unknown>;
/** After invite / remove / role-change in an org. */
export declare function invalidateOrgMembers(orgId: string): void;
/** After team create / delete / update in an org. */
export declare function invalidateOrgTeams(orgId: string): void;
/** After repo create / delete / transfer in an org. */
export declare function invalidateOrgRepos(orgId: string): void;
/** After any org-level mutation (blanket). */
export declare function invalidateOrg(orgId: string): void;
/** After user creates / deletes a personal repo. */
export declare function invalidateUserRepos(userId: string): void;
//# sourceMappingURL=cachedQueries.d.ts.map