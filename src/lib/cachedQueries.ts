/**
 * Cached wrappers around the hot service queries.
 *
 * Callers import from here instead of the raw service when they want
 * stale-while-revalidate behaviour.  Mutations call the appropriate
 * `invalidate…` helper so the next read is fresh.
 */

import {
  orgCache,
  analyticsCache,
  auditCache,
  userCache,
  staleWhileRevalidate,
} from '@/lib/cache'

// ── raw services ────────────────────────────
import { getOrgAnalytics }            from '@/services/analytics'
import { getOrgAuditLogs }            from '@/services/audit'
import { getOrganizationMembers, getOrganizationTeams, getMyOrganizations } from '@/services/organization'
import { getOrganizationRepositories, getUserRepositories } from '@/services/repository'

// ══════════════════════════════════════════════
// Cached getters
// ══════════════════════════════════════════════

export const cachedGetOrgAnalytics = (orgId: string) =>
  staleWhileRevalidate(
    analyticsCache,
    `analytics:${orgId}`,
    () => getOrgAnalytics(orgId),
    300_000,   // 5 min
  )

export const cachedGetOrgMembers = (orgId: string) =>
  staleWhileRevalidate(
    orgCache,
    `members:${orgId}`,
    () => getOrganizationMembers(orgId),
    120_000,   // 2 min
  )

export const cachedGetOrgTeams = (orgId: string) =>
  staleWhileRevalidate(
    orgCache,
    `teams:${orgId}`,
    () => getOrganizationTeams(orgId),
    120_000,
  )

export const cachedGetOrgRepos = (orgId: string) =>
  staleWhileRevalidate(
    orgCache,
    `repos:org:${orgId}`,
    () => getOrganizationRepositories(orgId),
    120_000,
  )

export const cachedGetMyOrganizations = () =>
  staleWhileRevalidate(
    orgCache,
    'orgs:mine',
    () => getMyOrganizations(),
    60_000,
  )

export const cachedGetUserRepos = (userId: string) =>
  staleWhileRevalidate(
    userCache,
    `repos:user:${userId}`,
    () => getUserRepositories(userId),
    60_000,
  )

export const cachedGetOrgAuditLogs = (params: Parameters<typeof getOrgAuditLogs>[0]) =>
  staleWhileRevalidate(
    auditCache,
    `audit:${params.organizationId}:${params.action || ''}:${params.offset || 0}`,
    () => getOrgAuditLogs(params),
    30_000,    // 30 s – audit logs surface quickly
  )

// ══════════════════════════════════════════════
// Invalidation helpers – call after mutations
// ══════════════════════════════════════════════

/** After invite / remove / role-change in an org. */
export function invalidateOrgMembers(orgId: string) {
  orgCache.invalidate(`members:${orgId}`)
  orgCache.invalidate(`__stale__members:${orgId}`)
}

/** After team create / delete / update in an org. */
export function invalidateOrgTeams(orgId: string) {
  orgCache.invalidate(`teams:${orgId}`)
  orgCache.invalidate(`__stale__teams:${orgId}`)
}

/** After repo create / delete / transfer in an org. */
export function invalidateOrgRepos(orgId: string) {
  orgCache.invalidate(`repos:org:${orgId}`)
  orgCache.invalidate(`__stale__repos:org:${orgId}`)
}

/** After any org-level mutation (blanket). */
export function invalidateOrg(orgId: string) {
  orgCache.invalidatePattern(`members:${orgId}`)
  orgCache.invalidatePattern(`teams:${orgId}`)
  orgCache.invalidatePattern(`repos:org:${orgId}`)
  analyticsCache.invalidatePattern(`analytics:${orgId}`)
  auditCache.invalidatePattern(`audit:${orgId}`)
}

/** After user creates / deletes a personal repo. */
export function invalidateUserRepos(userId: string) {
  userCache.invalidate(`repos:user:${userId}`)
  userCache.invalidate(`__stale__repos:user:${userId}`)
}
