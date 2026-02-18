import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import AiCloud02Icon from '@hugeicons/core-free-icons/AiCloud02Icon'
import MoreVerticalCircle01Icon from '@hugeicons/core-free-icons/MoreVerticalCircle01Icon'
import Settings02Icon from '@hugeicons/core-free-icons/Settings02Icon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon'
import FlashIcon from '@hugeicons/core-free-icons/FlashIcon'
import WebhookIcon from '@hugeicons/core-free-icons/WebhookIcon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteAgent, type AgentWithTeams } from '@/services/agent'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { AgentType } from '@/types/database'

interface AgentCardProps {
  agent: AgentWithTeams
  onRefresh: () => void
  canManage: boolean
}

const agentTypeConfig: Record<AgentType, { label: string; icon: any; color: string }> = {
  claude: {
    label: 'Claude Agent',
    icon: AiCloud02Icon,
    color: 'text-purple-500',
  },
  custom: {
    label: 'Custom Agent',
    icon: FlashIcon,
    color: 'text-blue-500',
  },
  webhook: {
    label: 'Webhook Agent',
    icon: WebhookIcon,
    color: 'text-green-500',
  },
}

export function AgentCard({ agent, onRefresh, canManage }: AgentCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { success, error: showError } = useToast()

  const config = agentTypeConfig[agent.agent_type]
  const lastActive = agent.last_active_at
    ? new Date(agent.last_active_at).toLocaleDateString()
    : 'Never'

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAgent(agent.id)
      success('Agent deleted successfully')
      onRefresh()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete agent')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border"
                )}
              >
                <Icon icon={config.icon} className={cn("h-5 w-5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">
                  {config.label}
                </Badge>
              </div>
            </div>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Manage ${agent.name}`}
                  >
                    <Icon icon={MoreVerticalCircle01Icon} className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Icon icon={Settings02Icon} className="mr-2 h-4 w-4" />
                    Configure
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Icon icon={Delete02Icon} className="mr-2 h-4 w-4" />
                    Delete Agent
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {agent.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {agent.description}
            </p>
          )}

          <div className="space-y-3">
            {/* Teams */}
            <div className="flex items-center gap-2 text-sm">
              <Icon icon={UserGroupIcon} className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {agent.teams.length === 0 ? (
                  'No teams assigned'
                ) : (
                  <>
                    {agent.teams.length} {agent.teams.length === 1 ? 'team' : 'teams'}
                  </>
                )}
              </span>
            </div>

            {/* Capabilities */}
            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.slice(0, 3).map((cap, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {cap}
                  </Badge>
                ))}
                {agent.capabilities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{agent.capabilities.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Last Active */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Last active: {lastActive}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AI agent?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{agent.name}</strong>? This will remove
              the agent from all teams and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Agent'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
