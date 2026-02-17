import { useEffect, useState } from 'react';
import { getOrganizationLogs, type AuditLogEntry } from '@/services/audit';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { formatRelativeTime } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Loading02Icon, File01Icon, AlertCircleIcon } from '@hugeicons/core-free-icons';

export function AuditLogTable({ orgId }: { orgId: string }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const data = await getOrganizationLogs(orgId);
        setLogs(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Icon icon={Loading02Icon} className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-destructive bg-destructive/10 rounded-md">
        <Icon icon={AlertCircleIcon} className="h-5 w-5" />
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-md">
        No audit events recorded yet.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {log.event_type}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon icon={File01Icon} className="h-3 w-3" />
                  <span>{log.resource_type}:{log.resource_id.slice(0, 8)}...</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {(log as any).actor_email || 'System'}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                {formatRelativeTime(log.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
