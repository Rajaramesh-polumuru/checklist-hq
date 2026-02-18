import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icon } from '@/components/ui/icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import AiCloud02Icon from '@hugeicons/core-free-icons/AiCloud02Icon'
import FlashIcon from '@hugeicons/core-free-icons/FlashIcon'
import WebhookIcon from '@hugeicons/core-free-icons/WebhookIcon'
import { createAgent } from '@/services/agent'
import type { AgentType } from '@/types/database'
import { useToast } from '@/hooks/useToast'

interface CreateAgentModalProps {
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onAgentCreated: () => void
}

export function CreateAgentModal({
  organizationId,
  isOpen,
  onClose,
  onAgentCreated,
}: CreateAgentModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [agentType, setAgentType] = useState<AgentType>('claude')
  const [capabilities, setCapabilities] = useState('')
  const [loading, setLoading] = useState(false)
  const { success, error: showError } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const capabilitiesArray = capabilities
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)

      await createAgent({
        organization_id: organizationId,
        name: name.trim(),
        description: description.trim() || null,
        agent_type: agentType,
        capabilities: capabilitiesArray.length > 0 ? capabilitiesArray : null,
      })

      success('AI agent created successfully')
      onAgentCreated()
      handleClose()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setAgentType('claude')
    setCapabilities('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create AI Agent</DialogTitle>
          <DialogDescription>
            Set up a new AI agent to automate checklist execution and collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="e.g., Quality Inspector"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this agent does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Agent Type */}
          <div className="space-y-2">
            <Label htmlFor="agent-type">Agent Type</Label>
            <Select value={agentType} onValueChange={(v) => setAgentType(v as AgentType)}>
              <SelectTrigger id="agent-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude">
                  <div className="flex items-center gap-2">
                    <Icon icon={AiCloud02Icon} className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="font-medium">Claude Agent</div>
                      <div className="text-xs text-muted-foreground">AI-powered autonomous execution</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Icon icon={FlashIcon} className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Custom Agent</div>
                      <div className="text-xs text-muted-foreground">Custom automation script</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="webhook">
                  <div className="flex items-center gap-2">
                    <Icon icon={WebhookIcon} className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">Webhook Agent</div>
                      <div className="text-xs text-muted-foreground">Triggered by external events</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Capabilities */}
          <div className="space-y-2">
            <Label htmlFor="capabilities">Capabilities (Optional)</Label>
            <Input
              id="capabilities"
              placeholder="e.g., browse, api, approve (comma-separated)"
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Define what actions this agent can perform
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || loading}
              className="active:scale-95 transition-transform"
            >
              {loading ? (
                <>
                  <Icon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Agent'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
