import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@/components/ui/icon';
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'

export function RetentionSettings({ organizationId: _orgId }: { organizationId: string }) {
  const [runsRetention, setRunsRetention] = useState('365');
  const [logsRetention, setLogsRetention] = useState('90');

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Run History Retention</Label>
          <p className="text-xs text-muted-foreground mb-2">
            How long to keep completed run data and artifacts.
          </p>
          <Select value={runsRetention} onValueChange={setRunsRetention}>
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="365">1 Year</SelectItem>
              <SelectItem value="forever">Forever</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Audit Log Retention</Label>
          <p className="text-xs text-muted-foreground mb-2">
            How long to keep security and activity logs.
          </p>
          <Select value={logsRetention} onValueChange={setLogsRetention}>
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="180">6 Months</SelectItem>
              <SelectItem value="365">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon icon={Clock01Icon} className="h-4 w-4" />
            <span>Next cleanup scheduled for: <strong>Tomorrow, 00:00 UTC</strong></span>
          </div>
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/5 hover:text-destructive">
            <Icon icon={Delete02Icon} className="mr-2 h-4 w-4" />
            Purge Expired Data Now
          </Button>
        </div>
      </div>
    </div>
  );
}
