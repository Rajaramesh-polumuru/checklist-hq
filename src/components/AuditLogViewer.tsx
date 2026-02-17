import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { FilterHorizontalIcon, Download01Icon } from '@hugeicons/core-free-icons';
import { AuditLogTable } from '@/components/organization/AuditLogTable';

export function AuditLogViewer({ organizationId }: { organizationId: string }) {
  const [filter, setFilter] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Icon icon={FilterHorizontalIcon} className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by event or actor..."
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          <Icon icon={Download01Icon} className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <AuditLogTable orgId={organizationId} />
    </div>
  );
}
