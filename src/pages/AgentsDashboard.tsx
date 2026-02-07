import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrganizationAgentsWithTeams, type AgentWithTeams } from '@/services/agent'
import { useOrgPermission } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import {
  Loading02Icon,
  AiCloud02Icon,
  PlusSignIcon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons'
import { CreateAgentModal } from '@/components/agent/CreateAgentModal'
import { AgentCard } from '@/components/agent/AgentCard'

export function AgentsDashboard() {
  const { orgId } = useParams()
  const { canManage } = useOrgPermission(orgId)
  const [agents, setAgents] = useState<AgentWithTeams[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    async function loadAgents() {
      if (!orgId) return
      try {
        setLoading(true)
        const data = await getOrganizationAgentsWithTeams(orgId)
        setAgents(data)
      } catch (error) {
        console.error('Failed to load agents:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAgents()
  }, [orgId])

  const refreshAgents = async () => {
    if (!orgId) return
    const data = await getOrganizationAgentsWithTeams(orgId)
    setAgents(data)
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Icon icon={Loading02Icon} className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="active:scale-95 transition-transform"
            aria-label="Back to organization"
          >
            <Link to={`/app/orgs/${orgId}`}>
              <Icon icon={ArrowLeft01Icon} className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border">
                <Icon icon={AiCloud02Icon} className="h-5 w-5 text-purple-500" />
              </div>
              AI Agents
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage AI agents that can execute checklist tasks and collaborate with your team
            </p>
          </div>
          {canManage && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="active:scale-95 transition-transform"
            >
              <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
              New Agent
            </Button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🤖</div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Hybrid Intelligence</h3>
              <p className="text-xs text-muted-foreground">
                AI agents can execute checklist tasks autonomously, collaborate with humans, and learn from completed runs.
                Assign agents to teams to enable automated workflow execution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents List */}
      {agents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Icon icon={AiCloud02Icon} className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No AI agents yet</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Create your first AI agent to automate checklist execution and enable hybrid intelligence workflows.
            </p>
            {canManage && (
              <Button
                onClick={() => setCreateModalOpen(true)}
                size="lg"
                className="active:scale-95 transition-transform"
              >
                <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onRefresh={refreshAgents}
              canManage={canManage}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {canManage && (
        <CreateAgentModal
          organizationId={orgId!}
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onAgentCreated={refreshAgents}
        />
      )}
    </div>
  )
}
