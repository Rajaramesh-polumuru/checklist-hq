import { useState, useEffect } from 'react'
import { getOrgAuditLogs, type AuditLog } from '@/services/audit'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import UserAdd01Icon from '@hugeicons/core-free-icons/UserAdd01Icon'
import UserRemove01Icon from '@hugeicons/core-free-icons/UserRemove01Icon'
import Settings02Icon from '@hugeicons/core-free-icons/Settings02Icon'
import GitForkIcon from '@hugeicons/core-free-icons/GitForkIcon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import RefreshIcon from '@hugeicons/core-free-icons/RefreshIcon'
import UserIcon from '@hugeicons/core-free-icons/UserIcon'
import Building02Icon from '@hugeicons/core-free-icons/Building02Icon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon'
import SecurityCheckIcon from '@hugeicons/core-free-icons/SecurityCheckIcon'
interface OrgActivityFeedProps {
  organizationId: string
  limit?: number
}

export function OrgActivityFeed({ organizationId, limit = 30 }: OrgActivityFeedProps) {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)

  const loadActivity = async () => {
    setLoading(true)
    try {
      const { logs: data, total: count } = await getOrgAuditLogs({
        organizationId,
        limit,
      })
      setLogs(data)
      setTotal(count)
    } catch (error) {
      console.error('Failed to load organization activity:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivity()
  }, [organizationId, limit])

  const getActivityIcon = (action: string) => {
    switch (action) {
      // Organization actions
      case 'organization.created':
        return { icon: Building02Icon, color: 'text-blue-500 bg-blue-500/10' }
      case 'organization.updated':
        return { icon: Settings02Icon, color: 'text-amber-500 bg-amber-500/10' }
      case 'organization.deleted':
        return { icon: Delete02Icon, color: 'text-red-500 bg-red-500/10' }

      // Member actions
      case 'member.invited':
      case 'organization.member_added':
        return { icon: UserAdd01Icon, color: 'text-green-500 bg-green-500/10' }
      case 'member.removed':
      case 'organization.member_removed':
        return { icon: UserRemove01Icon, color: 'text-red-500 bg-red-500/10' }
      case 'member.role_updated':
        return { icon: UserIcon, color: 'text-blue-500 bg-blue-500/10' }

      // Team actions
      case 'team.created':
        return { icon: UserGroupIcon, color: 'text-purple-500 bg-purple-500/10' }
      case 'team.updated':
        return { icon: Settings02Icon, color: 'text-amber-500 bg-amber-500/10' }
      case 'team.deleted':
        return { icon: Delete02Icon, color: 'text-red-500 bg-red-500/10' }
      case 'team.member_added':
        return { icon: UserAdd01Icon, color: 'text-green-500 bg-green-500/10' }
      case 'team.member_removed':
        return { icon: UserRemove01Icon, color: 'text-orange-500 bg-orange-500/10' }
      case 'team.repository_added':
        return { icon: GitForkIcon, color: 'text-purple-500 bg-purple-500/10' }
      case 'team.repository_removed':
        return { icon: GitForkIcon, color: 'text-orange-500 bg-orange-500/10' }

      // Repository actions
      case 'repository.created':
        return { icon: PlusSignIcon, color: 'text-emerald-500 bg-emerald-500/10' }
      case 'repository.updated':
        return { icon: Settings02Icon, color: 'text-sky-500 bg-sky-500/10' }
      case 'repository.deleted':
        return { icon: Delete02Icon, color: 'text-red-500 bg-red-500/10' }
      case 'repository.forked':
        return { icon: GitForkIcon, color: 'text-violet-500 bg-violet-500/10' }

      // Run actions
      case 'run.started':
        return { icon: PlayIcon, color: 'text-violet-500 bg-violet-500/10' }
      case 'run.completed':
        return { icon: CheckmarkCircle02Icon, color: 'text-green-500 bg-green-500/10' }

      // Security actions
      case 'security.sso_configured':
      case 'security.ip_allowlist_updated':
        return { icon: SecurityCheckIcon, color: 'text-rose-500 bg-rose-500/10' }

      default:
        return { icon: Settings02Icon, color: 'text-muted-foreground bg-muted' }
    }
  }

  const getActivityDescription = (log: AuditLog) => {
    const values = log.new_values || log.changes || {}

    switch (log.action) {
      // Organization
      case 'organization.created':
        return 'Organization was created'
      case 'organization.updated':
        return 'Organization settings were updated'
      case 'organization.deleted':
        return 'Organization was deleted'

      // Members
      case 'member.invited':
      case 'organization.member_added':
        return `Member was added${values.role ? ` with ${values.role} role` : ''}`
      case 'member.removed':
      case 'organization.member_removed':
        return 'Member was removed from the organization'
      case 'member.role_updated':
        return `Member role was changed to ${values.newRole || 'member'}`

      // Teams
      case 'team.created':
        return `Team "${values.name || 'New Team'}" was created`
      case 'team.updated':
        return 'Team settings were updated'
      case 'team.deleted':
        return 'Team was deleted'
      case 'team.member_added':
        return `Member was added to team with ${values.role || 'member'} role`
      case 'team.member_removed':
        return 'Member was removed from team'
      case 'team.member_role_updated':
        return `Team member role was changed to ${values.newRole || 'member'}`
      case 'team.repository_added':
        return `Repository was shared with ${values.permission || 'read'} access`
      case 'team.repository_removed':
        return 'Repository access was revoked'
      case 'team.repository_permission_updated':
        return `Repository permission was changed to ${values.newPermission || 'read'}`

      // Repositories
      case 'repository.created':
        return `Repository "${values.title || 'New Repository'}" was created`
      case 'repository.updated':
        return 'Repository was updated'
      case 'repository.deleted':
        return 'Repository was deleted'
      case 'repository.forked':
        return `Repository was forked`

      // Runs
      case 'run.started':
        return `Run was started${values.name ? ` - "${values.name}"` : ''}`
      case 'run.completed':
        return `Run was completed${values.name ? ` - "${values.name}"` : ''}`

      // Security
      case 'security.sso_configured':
        return 'SSO was configured'
      case 'security.ip_allowlist_updated':
        return 'IP allowlist was updated'

      default:
        return log.action.replace(/\./g, ' ').replace(/_/g, ' ')
    }
  }

  const getStatusBadge = (status: AuditLog['status']) => {
    switch (status) {
      case 'success':
        return null // Don't show for success (most common)
      case 'failure':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>
      case 'partial':
        return <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">Partial</Badge>
      default:
        return null
    }
  }

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(date).toLocaleDateString()
  }

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const date = new Date(log.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(log)
    return groups
  }, {} as Record<string, AuditLog[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon icon={Loading02Icon} className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Icon icon={RefreshIcon} className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium">No activity yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Activity will appear here as organization actions are performed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">
            Showing {logs.length} of {total} activities
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadActivity}>
          <Icon icon={RefreshIcon} size="sm" className="mr-1" />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedLogs).map(([date, dateLogs]) => (
          <div key={date}>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1">
              {date}
            </h3>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {dateLogs.map(log => {
                    const { icon, color } = getActivityIcon(log.action)

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                          <Icon icon={icon} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {getActivityDescription(log)}
                            </p>
                            {getStatusBadge(log.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatTimeAgo(log.created_at)}
                            {log.user_id && (
                              <span className="ml-2">
                                by user {log.user_id.slice(0, 8)}...
                              </span>
                            )}
                          </p>
                          {log.error_message && (
                            <p className="text-xs text-destructive mt-1">
                              Error: {log.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
