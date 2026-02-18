import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import SlackIcon from '@hugeicons/core-free-icons/SlackIcon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import { Icon } from '@/components/ui/icon'
import { getSlackConnections, deleteSlackConnection, testSlackConnection, type SlackConnection } from '@/services/slack'

interface SlackIntegrationProps {
  orgId?: string
  userId?: string
}

export function SlackIntegration({ orgId, userId }: SlackIntegrationProps) {
  const [connections, setConnections] = useState<SlackConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)

  const loadConnections = async () => {
    setLoading(true)
    try {
      const data = await getSlackConnections({ orgId, userId })
      setConnections(data)
    } catch (err) {
      console.error('Failed to load Slack connections:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConnections()
  }, [orgId, userId])

  const handleDelete = async (id: string) => {
    if (!confirm('Disconnect Slack workspace?')) return
    try {
      await deleteSlackConnection(id)
      setConnections(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete connection:', err)
    }
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    try {
      const result = await testSlackConnection(id)
      if (result.success) {
        alert('Test message sent successfully!')
      } else {
        alert('Test failed: ' + result.error)
      }
    } catch (err) {
      alert('Error testing connection')
    } finally {
      setTesting(null)
    }
  }

  const handleConnect = () => {
    // In a real app, this would redirect to Slack OAuth
    // For MVP, we'll show a placeholder
    const clientId = (import.meta as any).env.VITE_SLACK_CLIENT_ID

    if (!clientId || clientId === 'YOUR_CLIENT_ID') {
      toast.error('Slack integration is not configured correctly', {
        description: 'Please set VITE_SLACK_CLIENT_ID in your .env file'
      })
      return
    }

    const redirectUri = `${window.location.origin}/integrations/slack/callback`
    const scope = 'chat:write,channels:read,users:read,groups:read,im:read,mpim:read'
    
    // Encode state to pass orgId and generic return path
    const state = btoa(JSON.stringify({ 
      orgId, 
      userId,
      returnPath: window.location.pathname 
    }))

    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`
    window.open(slackAuthUrl, '_self') // Open in self to avoid popup blockers and handle callback easier
  }

  if (loading) {
    return <div className="text-center py-4"><Icon icon={Loading02Icon} className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Icon icon={SlackIcon} className="h-4 w-4" />
          Slack Workspace
        </h3>
        {connections.length === 0 && (
          <Button size="sm" onClick={handleConnect}>
            Connect to Slack
          </Button>
        )}
      </div>

      {connections.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-6 text-center">
            <Icon icon={SlackIcon} className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
            <p className="text-sm text-muted-foreground">No Slack workspace connected</p>
            <p className="text-xs text-muted-foreground mt-1">Connect to send run notifications to Slack</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={handleConnect}>
              <Icon icon={SlackIcon} className="h-3 w-3 mr-2" />
              Connect Workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {connections.map(conn => (
            <div key={conn.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon icon={SlackIcon} className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{conn.slack_team_name}</span>
                  <Badge variant={conn.is_active ? 'default' : 'secondary'} className="text-[10px] h-5">
                    {conn.is_active ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Channel: #{conn.slack_channel_name}
                </div>
                {conn.last_message_at && (
                  <div className="text-xs text-muted-foreground">
                    Last message: {new Date(conn.last_message_at).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {conn.is_active ? (
                  <Icon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-green-500" />
                ) : (
                  <Icon icon={AlertCircleIcon} className="h-4 w-4 text-yellow-500" />
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTest(conn.id)}
                  disabled={testing === conn.id}
                  title="Send test message"
                >
                  {testing === conn.id ? <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin" /> : 'Test'}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(conn.id)}
                  title="Disconnect"
                >
                  <Icon icon={Delete02Icon} className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button size="sm" variant="outline" className="w-full" onClick={handleConnect}>
            <Icon icon={SlackIcon} className="h-3 w-3 mr-2" />
            Add Another Workspace
          </Button>
        </div>
      )}
    </div>
  )
}
