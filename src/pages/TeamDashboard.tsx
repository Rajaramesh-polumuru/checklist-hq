import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getTeam, getTeamMembers, type TeamMemberWithUser } from '@/services/team'
import type { Team } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loading02Icon,
  UserGroupIcon,
  GitForkIcon,
  Settings02Icon,
  PlusSignIcon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { TeamMemberList } from '@/components/team/TeamMemberList'
import { AddTeamMemberModal } from '@/components/team/AddTeamMemberModal'
import { TeamSettings } from '@/components/team/TeamSettings'
import { VisibilityBadge } from '@/components/ui/visibility-badge'
import { EmptyState } from '@/components/organization/EmptyStates'
import { MemberListSkeleton } from '@/components/organization/OrganizationSkeletons'

export function TeamDashboard() {
  const { orgId, teamId } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMemberWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('members')
  const [addMemberOpen, setAddMemberOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!teamId) return
      try {
        setLoading(true)
        const [teamData, membersData] = await Promise.all([
          getTeam(teamId),
          getTeamMembers(teamId),
        ])

        if (!teamData) {
          navigate(`/app/orgs/${orgId}`)
          return
        }

        setTeam(teamData)
        setMembers(membersData)
      } catch (error) {
        console.error('Failed to load team data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [teamId, orgId, navigate])

  const refreshMembers = async () => {
    if (!teamId) return
    const membersData = await getTeamMembers(teamId)
    setMembers(membersData)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-xl bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <MemberListSkeleton />
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Team not found</h1>
        <Button variant="outline" className="mt-4" asChild>
          <Link to={`/app/orgs/${orgId}`}>Back to Organization</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
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

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border">
                <Icon icon={UserGroupIcon} className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{team.name}</h1>
                  <VisibilityBadge visibility={team.visibility as "public" | "private" | "secret"} />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                  <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">@{team.slug}</span>
                  <span>•</span>
                  <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                </div>
                {team.description && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                    {team.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveTab('settings')}
                className="active:scale-95 transition-transform"
                aria-label="Team settings"
              >
                <Icon icon={Settings02Icon} className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={() => setAddMemberOpen(true)}
                className="active:scale-95 transition-transform"
                aria-label="Add team member"
              >
                <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="members" className="gap-2">
                  <Icon icon={UserGroupIcon} className="h-4 w-4" />
                  Members
                  <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-xs">{members.length}</span>
                </TabsTrigger>
                <TabsTrigger value="repositories" className="gap-2">
                  <Icon icon={GitForkIcon} className="h-4 w-4" />
                  Repositories
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Icon icon={Settings02Icon} className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            {members.length === 0 ? (
              <EmptyState variant="members" onAction={() => setAddMemberOpen(true)} />
            ) : (
              <TeamMemberList members={members} onRefresh={refreshMembers} teamId={team.id} />
            )}
          </TabsContent>

          {/* Repositories Tab */}
          <TabsContent value="repositories" className="space-y-6">
            <EmptyState
              variant="repositories"
              onAction={() => console.log('Create or share repository')}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <TeamSettings team={team} onUpdate={setTeam} />
          </TabsContent>
        </Tabs>
      </div>

      {team && (
        <AddTeamMemberModal
          teamId={team.id}
          organizationId={team.organization_id}
          isOpen={addMemberOpen}
          onClose={() => setAddMemberOpen(false)}
          onMemberAdded={refreshMembers}
        />
      )}
    </div>
  )
}
