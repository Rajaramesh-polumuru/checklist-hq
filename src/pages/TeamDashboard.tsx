import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getTeam, getTeamMembers, getTeamRepositories, removeRepositoryFromTeam, type TeamMemberWithUser, type TeamRepositoryWithAccess } from '@/services/team'
import type { Team } from '@/types/database'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissionStore } from '@/stores/permission-store'
import { useTeamPermission } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  UserGroupIcon,
  GitForkIcon,
  Settings02Icon,
  PlusSignIcon,
  ArrowLeft01Icon,
  PlayIcon,
  Delete02Icon,
  MoreHorizontalIcon,
  Activity01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { TeamMemberList } from '@/components/team/TeamMemberList'
import { AddTeamMemberModal } from '@/components/team/AddTeamMemberModal'
import { TeamSettings } from '@/components/team/TeamSettings'
import { ShareRepositoryToTeamModal } from '@/components/team/ShareRepositoryToTeamModal'
import { TeamActivityFeed } from '@/components/team/TeamActivityFeed'
import { VisibilityBadge } from '@/components/ui/visibility-badge'
import { EmptyState } from '@/components/organization/EmptyStates'
import { MemberListSkeleton, RepositoryGridSkeleton } from '@/components/organization/OrganizationSkeletons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function TeamDashboard() {
  const { orgId, teamId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const setTeamPermission = usePermissionStore((state) => state.setTeamPermission)
  useTeamPermission(teamId)
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMemberWithUser[]>([])
  const [repositories, setRepositories] = useState<TeamRepositoryWithAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [reposLoading, setReposLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('members')
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [shareRepoOpen, setShareRepoOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!teamId || !user) return
      try {
        setLoading(true)
        setReposLoading(true)
        const [teamData, membersData, reposData] = await Promise.all([
          getTeam(teamId),
          getTeamMembers(teamId),
          getTeamRepositories(teamId),
        ])

        if (!teamData) {
          navigate(`/app/orgs/${orgId}`)
          return
        }

        setTeam(teamData)
        setMembers(membersData)
        setRepositories(reposData)

        // Set user's team permission
        const userMember = membersData.find(m => m.user_id === user.id)
        if (userMember) {
          setTeamPermission(teamId, userMember.role)
        }
      } catch (error) {
        console.error('Failed to load team data:', error)
      } finally {
        setLoading(false)
        setReposLoading(false)
      }
    }
    loadData()
  }, [teamId, orgId, user, navigate, setTeamPermission])

  const refreshMembers = async () => {
    if (!teamId) return
    const membersData = await getTeamMembers(teamId)
    setMembers(membersData)
  }

  const refreshRepositories = async () => {
    if (!teamId) return
    setReposLoading(true)
    try {
      const reposData = await getTeamRepositories(teamId)
      setRepositories(reposData)
    } finally {
      setReposLoading(false)
    }
  }

  const handleRemoveRepository = async (repoId: string, repoTitle: string) => {
    if (!teamId) return
    if (!window.confirm(`Remove "${repoTitle}" from this team?`)) return

    try {
      await removeRepositoryFromTeam(teamId, repoId)
      toast.success('Repository removed from team')
      refreshRepositories()
    } catch (error) {
      toast.error('Failed to remove repository')
      console.error(error)
    }
  }

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'admin': return 'bg-role-owner/10 text-role-owner border-role-owner/20'
      case 'write': return 'bg-role-admin/10 text-role-admin border-role-admin/20'
      case 'read': return 'bg-role-member/10 text-role-member border-role-member/20'
      default: return 'bg-muted text-muted-foreground'
    }
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
                  <VisibilityBadge visibility={team.visibility} />
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
                  {repositories.length > 0 && (
                    <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-xs">{repositories.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <Icon icon={Activity01Icon} className="h-4 w-4" />
                  Activity
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Team Repositories</h2>
                <p className="text-sm text-muted-foreground">Repositories shared with this team.</p>
              </div>
              <Button size="sm" onClick={() => setShareRepoOpen(true)}>
                <Icon icon={PlusSignIcon} size="sm" className="mr-2" />
                Share Repository
              </Button>
            </div>

            {reposLoading ? (
              <RepositoryGridSkeleton />
            ) : repositories.length === 0 ? (
              <EmptyState
                variant="repositories"
                onAction={() => setShareRepoOpen(true)}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {repositories.map(repo => (
                  <Card key={repo.id} className="group hover:shadow-md transition-all duration-300 border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2 group-hover:text-primary transition-colors truncate">
                          <Icon icon={GitForkIcon} className="h-4 w-4 shrink-0" />
                          <span className="truncate">{repo.title}</span>
                        </CardTitle>
                        <Badge variant="outline" className={getPermissionColor(repo.permission)}>
                          {repo.permission}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs mt-1">
                        {repo.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className="text-xs text-muted-foreground">
                          Shared {new Date(repo.granted_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => navigate(`/app/run/start/${repo.id}`)}
                          >
                            <Icon icon={PlayIcon} size="xs" className="mr-1" />
                            Run
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Icon icon={MoreHorizontalIcon} size="xs" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/app/repo/${repo.id}`}>
                                  Open Repository
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleRemoveRepository(repo.id, repo.title)}
                              >
                                <Icon icon={Delete02Icon} size="xs" className="mr-2" />
                                Remove from Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Team Activity</h2>
                <p className="text-sm text-muted-foreground">Recent actions and changes in this team.</p>
              </div>
            </div>
            <TeamActivityFeed teamId={team.id} />
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

      {team && (
        <ShareRepositoryToTeamModal
          teamId={team.id}
          organizationId={team.organization_id}
          isOpen={shareRepoOpen}
          onClose={() => setShareRepoOpen(false)}
          onRepositoryAdded={refreshRepositories}
        />
      )}
    </div>
  )
}
