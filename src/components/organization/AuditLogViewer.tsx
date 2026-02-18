import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icon } from '@/components/ui/icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import FileSearchIcon from '@hugeicons/core-free-icons/FileSearchIcon'
import Download01Icon from '@hugeicons/core-free-icons/Download01Icon'
import Calendar03Icon from '@hugeicons/core-free-icons/Calendar03Icon'
import { getOrgAuditLogs, type AuditLog } from '@/services/audit'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface AuditLogViewerProps {
  organizationId: string
}

const actionTypeColors: Record<string, string> = {
  created: 'bg-green-500/10 text-green-600 border-green-500/20',
  updated: 'bg-blue-500/10 text-blue-600 border-border-blue-500/20',
  deleted: 'bg-red-500/10 text-red-600 border-red-500/20',
  accessed: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

function getActionColor(action: string): string {
  if (action.includes('created')) return actionTypeColors.created
  if (action.includes('updated')) return actionTypeColors.updated
  if (action.includes('deleted')) return actionTypeColors.deleted
  return actionTypeColors.accessed
}

export function AuditLogViewer({ organizationId }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [searchUser, setSearchUser] = useState('')

  const pageSize = 20

  useEffect(() => {
    async function loadLogs() {
      setLoading(true)
      try {
        const { logs: data, total: count } = await getOrgAuditLogs({
          organizationId,
          limit: pageSize,
          offset: page * pageSize,
          action: filterAction === 'all' ? undefined : filterAction,
          userId: searchUser || undefined,
        })
        setLogs(data)
        setTotal(count)
      } catch (error) {
        console.error('Failed to load audit logs:', error)
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [organizationId, page, filterAction, searchUser])

  const handleExport = async () => {
    // Simple CSV export
    const csv = [
      ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'User ID', 'Status'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toISOString(),
        log.action,
        log.resource_type,
        log.resource_id,
        log.user_id || 'system',
        log.status,
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Icon icon={Loading02Icon} className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon icon={FileSearchIcon} className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={logs.length === 0}
            className="active:scale-95 transition-transform"
          >
            <Icon icon={Download01Icon} className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search-user" className="sr-only">
              Search by User ID
            </Label>
            <Input
              id="search-user"
              placeholder="Search by user ID..."
              value={searchUser}
              onChange={(e) => {
                setSearchUser(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <div className="w-48">
            <Label htmlFor="filter-action" className="sr-only">
              Filter by Action
            </Label>
            <Select
              value={filterAction}
              onValueChange={(v) => {
                setFilterAction(v)
                setPage(0)
              }}
            >
              <SelectTrigger id="filter-action">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="member_added">Member Added</SelectItem>
                <SelectItem value="member_removed">Member Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs List */}
        {logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon icon={FileSearchIcon} className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={cn("text-xs", getActionColor(log.action))}>
                      {log.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {log.resource_type}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      {log.resource_id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <Icon icon={Calendar03Icon} className="inline h-3 w-3 mr-1" />
                    {new Date(log.created_at).toLocaleString()}
                    {log.user_id && (
                      <span className="ml-3">
                        User: {log.user_id.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
                <Badge
                  variant={log.status === 'success' ? 'default' : 'destructive'}
                  className="shrink-0"
                >
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="active:scale-95 transition-transform"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * pageSize >= total || loading}
                className="active:scale-95 transition-transform"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
