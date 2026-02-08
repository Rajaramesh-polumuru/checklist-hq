import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loading02Icon,
  Download01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  Tick01Icon,
  AlertCircleIcon,
  ViewIcon,
  Folder01Icon,
  PencilEdit01Icon,
  Delete01Icon,
  PlayIcon,
  User02Icon,
  Cancel01Icon,
  UserGroupIcon,
  LockKeyIcon,
  CheckListIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { getOrgAuditLogs, exportAuditLogsCSV, type AuditLog } from '@/services/audit'
import { cn } from '@/lib/utils'

interface AuditLogViewerProps {
  organizationId: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ACTION_ICONS: Record<string, any> = {
  'repository.created': Folder01Icon,
  'repository.updated': PencilEdit01Icon,
  'repository.deleted': Delete01Icon,
  'run.started': PlayIcon,
  'run.completed': Tick01Icon,
  'member.invited': User02Icon,
  'member.removed': Cancel01Icon,
  'team.created': UserGroupIcon,
  'permission.changed': LockKeyIcon,
}

export function AuditLogViewer({ organizationId }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(25)

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('')
  const [dateRangeFilter, setDateRangeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('7d')

  const loadLogs = async () => {
    setLoading(true)
    try {
      const startDate = new Date()
      const endDate = new Date()

      switch (dateRangeFilter) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24)
          break
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case 'all':
          startDate.setFullYear(startDate.getFullYear() - 5)
          break
      }

      const { logs: data, total: count } = await getOrgAuditLogs({
        organizationId,
        limit: pageSize,
        offset: page * pageSize,
        action: actionFilter || undefined,
        startDate: dateRangeFilter === 'all' ? undefined : startDate,
        endDate: dateRangeFilter === 'all' ? undefined : endDate,
      })

      setLogs(data)
      setTotal(count)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(0)
  }, [actionFilter, dateRangeFilter])

  useEffect(() => {
    loadLogs()
  }, [page, actionFilter, dateRangeFilter])

  const handleExport = async () => {
    setExporting(true)
    try {
      const csv = await exportAuditLogsCSV({
        organizationId,
        startDate: dateRangeFilter === 'all' ? undefined : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      })

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export logs:', err)
      alert('Failed to export logs')
    } finally {
      setExporting(false)
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('created') || action.includes('started')) return 'bg-blue-50 border-blue-200'
    if (action.includes('deleted') || action.includes('removed')) return 'bg-red-50 border-red-200'
    if (action.includes('updated') || action.includes('changed')) return 'bg-amber-50 border-amber-200'
    return 'bg-gray-50 border-gray-200'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Icon icon={Tick01Icon} className="h-4 w-4 text-green-600" />
      case 'failure':
        return <Icon icon={AlertCircleIcon} className="h-4 w-4 text-red-600" />
      default:
        return <Icon icon={ViewIcon} className="h-4 w-4 text-gray-600" />
    }
  }

  const pageCount = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Icon icon={Clock01Icon} className="h-4 w-4" />
          Audit Log
        </h3>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting}>
          <Icon icon={Download01Icon} className="h-3 w-3 mr-1" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={dateRangeFilter} onValueChange={(v: any) => setDateRangeFilter(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7d</SelectItem>
            <SelectItem value="30d">Last 30d</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Icon icon={Loading02Icon} className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No audit logs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div
              key={log.id}
              className={cn(
                'p-3 border rounded-lg transition-colors',
                getActionColor(log.action)
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon={ACTION_ICONS[log.action] ?? CheckListIcon} className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-sm">{log.action}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {log.resource_type}
                    </Badge>
                    {getStatusIcon(log.status)}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Resource: {log.resource_id}</div>
                    <div>
                      {new Date(log.created_at).toLocaleString()}
                    </div>

                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="mt-2 p-2 bg-accent/50 rounded text-[11px] font-mono">
                        {Object.entries(log.changes).map(([field, change]: [string, any]) => (
                          <div key={field}>
                            <span className="text-amber-700">{field}:</span>{' '}
                            <span className="text-red-700">{change.old}</span>
                            {' → '}
                            <span className="text-green-700">{change.new}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {log.error_message && (
                      <div className="text-red-700">Error: {log.error_message}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-muted-foreground">
            Page {page + 1} of {pageCount} ({total} total)
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <Icon icon={ArrowLeft01Icon} className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
            >
              <Icon icon={ArrowRight01Icon} className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
