import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import Calendar03Icon from '@hugeicons/core-free-icons/Calendar03Icon'
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon'
import SlackIcon from '@hugeicons/core-free-icons/SlackIcon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import Edit02Icon from '@hugeicons/core-free-icons/Edit02Icon'
import ChartBarLineIcon from '@hugeicons/core-free-icons/ChartBarLineIcon'
interface ReportSubscription {
  id: string
  frequency: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  delivery: 'email' | 'slack'
  filters?: {
    teams?: string[]
    repositories?: string[]
  }
}

interface ScheduledReportsManagerProps {
  organizationId: string
}

export function ScheduledReportsManager({ }: ScheduledReportsManagerProps) {
  const [subscriptions, setSubscriptions] = useState<ReportSubscription[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [delivery, setDelivery] = useState<'email' | 'slack'>('email')
  const [recipients, setRecipients] = useState('')

  const handleCreate = () => {
    const newSubscription: ReportSubscription = {
      id: Math.random().toString(36),
      frequency,
      recipients: recipients.split(',').map(r => r.trim()).filter(Boolean),
      delivery,
    }
    setSubscriptions([...subscriptions, newSubscription])
    setCreateOpen(false)
    setRecipients('')
  }

  const handleDelete = (id: string) => {
    setSubscriptions(subscriptions.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scheduled Reports</h2>
          <p className="text-muted-foreground">
            Automatically deliver analytics reports to your team
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="active:scale-95 transition-transform">
          <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon icon={ChartBarLineIcon} className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Automated Analytics</h3>
              <p className="text-xs text-muted-foreground">
                Schedule automatic delivery of analytics reports via email or Slack. Track team
                performance, completion rates, and identify improvement opportunities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon icon={Calendar03Icon} className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No scheduled reports yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create your first scheduled report to receive regular analytics updates
            </p>
            <Button onClick={() => setCreateOpen(true)} className="active:scale-95 transition-transform">
              <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((sub) => (
            <Card key={sub.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon
                        icon={sub.delivery === 'email' ? Mail01Icon : SlackIcon}
                        className="h-5 w-5"
                      />
                      {sub.frequency.charAt(0).toUpperCase() + sub.frequency.slice(1)} Report
                    </CardTitle>
                    <CardDescription>
                      Delivered via {sub.delivery} to {sub.recipients.length} recipient
                      {sub.recipients.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="active:scale-95 transition-transform"
                    >
                      <Icon icon={Edit02Icon} className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(sub.id)}
                      className="text-destructive hover:text-destructive active:scale-95 transition-transform"
                    >
                      <Icon icon={Delete02Icon} className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Recipients:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sub.recipients.map((recipient, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {recipient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Frequency:</span>{' '}
                    <Badge className="ml-1">{sub.frequency}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Scheduled Report</DialogTitle>
            <DialogDescription>
              Configure automatic delivery of analytics reports
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery">Delivery Method</Label>
              <Select value={delivery} onValueChange={(v: any) => setDelivery(v)}>
                <SelectTrigger id="delivery">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Icon icon={Mail01Icon} className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="slack">
                    <div className="flex items-center gap-2">
                      <Icon icon={SlackIcon} className="h-4 w-4" />
                      Slack
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">
                {delivery === 'email' ? 'Email Addresses' : 'Slack Channels'}
              </Label>
              <Input
                id="recipients"
                placeholder={
                  delivery === 'email'
                    ? 'user@example.com, admin@example.com'
                    : '#analytics, #team-updates'
                }
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Separate multiple with commas</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!recipients.trim()}
              className="active:scale-95 transition-transform"
            >
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
