import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icon } from '@/components/ui/icon'
import DatabaseIcon from '@hugeicons/core-free-icons/DatabaseIcon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import Download01Icon from '@hugeicons/core-free-icons/Download01Icon'
interface RetentionPolicy {
  dataType: string
  label: string
  description: string
  retentionDays: number
  autoDelete: boolean
}

interface DataRetentionSettingsProps {
  organizationId: string
}

export function DataRetentionSettings({ }: DataRetentionSettingsProps) {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([
    {
      dataType: 'audit_logs',
      label: 'Audit Logs',
      description: 'Security and compliance logs',
      retentionDays: 365,
      autoDelete: false,
    },
    {
      dataType: 'run_history',
      label: 'Run History',
      description: 'Completed checklist runs',
      retentionDays: 90,
      autoDelete: false,
    },
    {
      dataType: 'analytics',
      label: 'Analytics Data',
      description: 'Usage metrics and statistics',
      retentionDays: 180,
      autoDelete: true,
    },
  ])

  const updatePolicy = (dataType: string, updates: Partial<RetentionPolicy>) => {
    setPolicies(policies.map(p =>
      p.dataType === dataType ? { ...p, ...updates } : p
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Icon icon={DatabaseIcon} className="h-6 w-6" />
          Data Retention
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure how long different types of data are kept
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon icon={AlertCircleIcon} className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Data Management</h3>
              <p className="text-xs text-muted-foreground">
                Retention policies help manage storage costs and comply with data protection
                regulations. Data can be exported before automatic deletion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      {policies.map((policy) => (
        <Card key={policy.dataType}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{policy.label}</CardTitle>
                <CardDescription>{policy.description}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="active:scale-95 transition-transform"
              >
                <Icon icon={Download01Icon} className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`retention-${policy.dataType}`}>Retention Period</Label>
                <Select
                  value={policy.retentionDays.toString()}
                  onValueChange={(v) => updatePolicy(policy.dataType, { retentionDays: parseInt(v) })}
                >
                  <SelectTrigger id={`retention-${policy.dataType}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="730">2 years</SelectItem>
                    <SelectItem value="-1">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`auto-delete-${policy.dataType}`}>Automatic Deletion</Label>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    id={`auto-delete-${policy.dataType}`}
                    checked={policy.autoDelete}
                    onCheckedChange={(checked: boolean) =>
                      updatePolicy(policy.dataType, { autoDelete: checked })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {policy.autoDelete ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {policy.autoDelete && policy.retentionDays > 0 && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                <strong>Note:</strong> Data older than {policy.retentionDays} days will be
                automatically deleted. You'll receive an email notification 7 days before deletion
                with an option to export.
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button className="active:scale-95 transition-transform">
          Save Retention Policies
        </Button>
      </div>
    </div>
  )
}
