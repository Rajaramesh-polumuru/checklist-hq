import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loading02Icon, WebhookIcon, Delete02Icon, PlusSignIcon, Globe02Icon, Activity01Icon, AlertCircleIcon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { getWebhooks, createWebhook, deleteWebhook, type Webhook } from '@/services/integrations'


interface WebhookManagerProps {
  repoId?: string
  orgId?: string
}

const AVAILABLE_EVENTS = [
  { id: 'run.started', label: 'Run Started' },
  { id: 'run.completed', label: 'Run Completed' },
  { id: 'item.checked', label: 'Item Checked' },
]

export function WebhookManager({ repoId, orgId }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Form State
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['run.completed'])
  const [creating, setCreating] = useState(false)

  const loadWebhooks = async () => {
    setLoading(true)
    try {
      const data = await getWebhooks({ repoId, orgId })
      setWebhooks(data)
    } catch (err) {
      console.error('Failed to load webhooks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWebhooks()
  }, [repoId, orgId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setCreating(true)
    try {
      await createWebhook({
        repoId,
        orgId,
        url,
        secret: secret || undefined,
        events: selectedEvents,
      })
      await loadWebhooks()
      setIsCreating(false)
      setUrl('')
      setSecret('')
      setSelectedEvents(['run.completed'])
    } catch (err) {
      console.error('Failed to create webhook:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook?')) return
    try {
      await deleteWebhook(id)
      setWebhooks(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      console.error('Failed to delete webhook:', err)
    }
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    )
  }

  if (loading) {
    return <div className="text-center py-4"><Icon icon={Loading02Icon} className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Icon icon={WebhookIcon} className="h-4 w-4" />
          Webhooks
        </h3>
        {!isCreating && (
          <Button size="sm" variant="outline" onClick={() => setIsCreating(true)}>
            <Icon icon={PlusSignIcon} className="h-3 w-3 mr-1" />
            Add Endpoint
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Payload URL</label>
              <Input
                placeholder="https://api.yourapp.com/webhooks"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Secret (Optional)</label>
              <Input
                type="password"
                placeholder="Signing secret"
                value={secret}
                onChange={e => setSecret(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Events</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map(event => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <label
                      htmlFor={event.id}
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !url}>
                {creating ? <Icon icon={Loading02Icon} className="h-3 w-3 animate-spin" /> : 'Add Webhook'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {webhooks.length === 0 && !isCreating ? (
        <div className="text-center py-6 border rounded-lg bg-muted/10 border-dashed">
          <p className="text-sm text-muted-foreground">No webhooks configured</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon icon={Globe02Icon} className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{webhook.url}</span>
                  <Badge variant={webhook.is_active ? 'default' : 'secondary'} className="text-[10px] h-5">
                    {webhook.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {webhook.events.map(e => (
                    <span key={e} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {webhook.last_success_at ? (
                  <div title={`Last success: ${new Date(webhook.last_success_at).toLocaleString()}`}>
                    <Icon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-green-500" />
                  </div>
                ) : webhook.last_failure_at ? (
                  <div title={`Last failure: ${new Date(webhook.last_failure_at).toLocaleString()}`}>
                    <Icon icon={AlertCircleIcon} className="h-4 w-4 text-red-500" />
                  </div>
                ) : (
                  <div title="Never triggered">
                    <Icon icon={Activity01Icon} className="h-4 w-4 text-muted-foreground opacity-30" />
                  </div>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(webhook.id)}>
                  <Icon icon={Delete02Icon} className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
