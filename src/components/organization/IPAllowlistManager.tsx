import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Icon } from '@/components/ui/icon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import { cn } from '@/lib/utils'

interface IPRule {
  id: string
  ipRange: string
  description: string
  enabled: boolean
}

interface IPAllowlistManagerProps {
  organizationId: string
}

export function IPAllowlistManager({ }: IPAllowlistManagerProps) {
  const [enabled, setEnabled] = useState(false)
  const [rules, setRules] = useState<IPRule[]>([])
  const [newIP, setNewIP] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const handleAddRule = () => {
    if (!newIP.trim()) return

    const rule: IPRule = {
      id: Math.random().toString(36),
      ipRange: newIP.trim(),
      description: newDescription.trim(),
      enabled: true,
    }
    setRules([...rules, rule])
    setNewIP('')
    setNewDescription('')
  }

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id))
  }

  const handleToggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Icon icon={Shield01Icon} className="h-6 w-6" />
          IP Allowlist
        </h2>
        <p className="text-muted-foreground mt-1">
          Restrict organization access to specific IP addresses or ranges
        </p>
      </div>

      {/* Warning Card */}
      <Card className="bg-warning/5 border-warning/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon icon={AlertCircleIcon} className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Security Warning</h3>
              <p className="text-xs text-muted-foreground">
                Enabling IP allowlisting will restrict access to only the specified IP addresses.
                Ensure you add your current IP before enabling to avoid being locked out.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Master Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enable IP Allowlist</CardTitle>
              <CardDescription>
                Only allow access from whitelisted IP addresses
              </CardDescription>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardHeader>
      </Card>

      {/* Add Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add IP Rule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ip-range">IP Address or Range</Label>
              <Input
                id="ip-range"
                placeholder="192.168.1.0/24 or 203.0.113.42"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Office network, VPN, etc."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleAddRule}
            disabled={!newIP.trim()}
            className="active:scale-95 transition-transform"
          >
            <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Rules</CardTitle>
          <CardDescription>
            {rules.length === 0
              ? 'No rules configured'
              : `${rules.filter(r => r.enabled).length} active of ${rules.length} total`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon icon={Shield01Icon} className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No IP rules configured yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    !rule.enabled && 'opacity-50'
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                    <div className="flex-1">
                      <div className="font-mono text-sm font-medium">{rule.ipRange}</div>
                      {rule.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {rule.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-destructive hover:text-destructive active:scale-95 transition-transform"
                  >
                    <Icon icon={Delete02Icon} className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
