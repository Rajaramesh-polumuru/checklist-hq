/**
 * Cached wrappers around the hot service queries.
 *
 * Callers import from here instead of the raw service when they want
 * stale-while-revalidate behaviour.  Mutations call the appropriate
 * `invalidate…` helper so the next read is fresh.
 */
import { orgCache, analyticsCache, auditCache, userCache, staleWhileRevalidate, } from '@/lib/cache';
// ── raw services ────────────────────────────
import { getOrgAnalytics } from '@/services/analytics';
import { getOrgAuditLogs } from '@/services/audit';
import { getOrganizationMembers, getOrganizationTeams, getMyOrganizations } from '@/services/organization';
import { getOrganizationRepositories, getUserRepositories } from '@/services/repository';
// ══════════════════════════════════════════════
// Cached getters
// ══════════════════════════════════════════════
export const cachedGetOrgAnalytics = (orgId) => staleWhileRevalidate(analyticsCache, `analytics:${orgId}`, () => getOrgAnalytics(orgId), 300_000);
export const cachedGetOrgMembers = (orgId) => staleWhileRevalidate(orgCache, `members:${orgId}`, () => getOrganizationMembers(orgId), 120_000);
export const cachedGetOrgTeams = (orgId) => staleWhileRevalidate(orgCache, `teams:${orgId}`, () => getOrganizationTeams(orgId), 120_000);
export const cachedGetOrgRepos = (orgId) => staleWhileRevalidate(orgCache, `repos:org:${orgId}`, () => getOrganizationRepositories(orgId), 120_000);
export const cachedGetMyOrganizations = () => staleWhileRevalidate(orgCache, 'orgs:mine', () => getMyOrganizations(), 60_000);
export const cachedGetUserRepos = (userId) => staleWhileRevalidate(userCache, `repos:user:${userId}`, () => getUserRepositories(userId), 60_000);
export const cachedGetOrgAuditLogs = (params) => staleWhileRevalidate(auditCache, `audit:${params.organizationId}:${params.action || ''}:${params.offset || 0}`, () => getOrgAuditLogs(params), 30_000);
// ══════════════════════════════════════════════
// Invalidation helpers – call after mutations
// ══════════════════════════════════════════════
/** After invite / remove / role-change in an org. */
export function invalidateOrgMembers(orgId) {
    orgCache.invalidate(`members:${orgId}`);
    orgCache.invalidate(`__stale__members:${orgId}`);
}
/** After team create / delete / update in an org. */
export function invalidateOrgTeams(orgId) {
    orgCache.invalidate(`teams:${orgId}`);
    orgCache.invalidate(`__stale__teams:${orgId}`);
}
/** After repo create / delete / transfer in an org. */
export function invalidateOrgRepos(orgId) {
    orgCache.invalidate(`repos:org:${orgId}`);
    orgCache.invalidate(`__stale__repos:org:${orgId}`);
}
/** After any org-level mutation (blanket). */
export function invalidateOrg(orgId) {
    orgCache.invalidatePattern(`members:${orgId}`);
    orgCache.invalidatePattern(`teams:${orgId}`);
    orgCache.invalidatePattern(`repos:org:${orgId}`);
    analyticsCache.invalidatePattern(`analytics:${orgId}`);
    auditCache.invalidatePattern(`audit:${orgId}`);
}
/** After user creates / deletes a personal repo. */
export function invalidateUserRepos(userId) {
    userCache.invalidate(`repos:user:${userId}`);
    userCache.invalidate(`__stale__repos:user:${userId}`);
}
//# sourceMappingURL=cachedQueries.js.map