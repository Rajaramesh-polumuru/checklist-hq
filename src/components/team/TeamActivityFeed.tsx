import { useState, useEffect } from 'react'
import { getTeamActivityLogs, type TeamAuditLog } from '@/services/audit'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import UserAdd01Icon from '@hugeicons/core-free-icons/UserAdd01Icon'
import UserRemove01Icon from '@hugeicons/core-free-icons/UserRemove01Icon'
import Settings02Icon from '@hugeicons/core-free-icons/Settings02Icon'
import GitForkIcon from '@hugeicons/core-free-icons/GitForkIcon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import RefreshIcon from '@hugeicons/core-free-icons/RefreshIcon'
import UserIcon from '@hugeicons/core-free-icons/UserIcon'
interface TeamActivityFeedProps {
  teamId: string
  limit?: number
}

export function TeamActivityFeed({ teamId, limit = 20 }: TeamActivityFeedProps) {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<TeamAuditLog[]>([])
  const [total, setTotal] = useState(0)

  const loadActivity = async () => {
    setLoading(true)
    try {
      const { logs: data, total: count } = await getTeamActivityLogs({ teamId, limit })
      setLogs(data)
      setTotal(count)
    } catch (error) {
      console.error('Failed to load team activity:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivity()
  }, [teamId, limit])

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'team.member_added':
        return { icon: UserAdd01Icon, color: 'text-green-500 bg-green-500/10' }
      case 'team.member_removed':
        return { icon: UserRemove01Icon, color: 'text-red-500 bg-red-500/10' }
      case 'team.member_role_updated':
        return { icon: UserIcon, color: 'text-blue-500 bg-blue-500/10' }
      case 'team.repository_added':
        return { icon: GitForkIcon, color: 'text-purple-500 bg-purple-500/10' }
      case 'team.repository_removed':
        return { icon: Delete02Icon, color: 'text-orange-500 bg-orange-500/10' }
      case 'team.repository_permission_updated':
        return { icon: GitForkIcon, color: 'text-indigo-500 bg-indigo-500/10' }
      case 'team.updated':
      case 'team.created':
        return { icon: Settings02Icon, color: 'text-gray-500 bg-gray-500/10' }
      default:
        return { icon: Settings02Icon, color: 'text-muted-foreground bg-muted' }
    }
  }

  const getActivityDescription = (log: TeamAuditLog) => {
    const values = log.new_values || log.changes || {}

    switch (log.action) {
      case 'team.created':
        return 'Team was created'
      case 'team.updated':
        return 'Team settings were updated'
      case 'team.deleted':
        return 'Team was deleted'
      case 'team.member_added':
        return `Member was added with ${values.role || 'member'} role`
      case 'team.member_removed':
        return 'Member was removed'
      case 'team.member_role_updated':
        return `Member role was changed to ${values.newRole || 'member'}`
      case 'team.repository_added':
        return `Repository was shared with ${values.permission || 'read'} access`
      case 'team.repository_removed':
        return 'Repository access was revoked'
      case 'team.repository_permission_updated':
        return `Repository permission was changed to ${values.newPermission || 'read'}`
      default:
        return log.action.replace('team.', '').replace(/_/g, ' ')
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
          Activity will appear here as team actions are performed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {logs.length} of {total} activities
        </p>
        <Button variant="ghost" size="sm" onClick={loadActivity}>
          <Icon icon={RefreshIcon} size="sm" className="mr-1" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {logs.map(log => {
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
                    <p className="text-sm font-medium">
                      {getActivityDescription(log)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeAgo(log.created_at)}
                      {log.user_id && (
                        <span className="ml-2">
                          by {log.user_id.slice(0, 8)}...
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
