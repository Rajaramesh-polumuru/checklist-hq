import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
import { RepositoryGridSkeleton, TabsSkeleton } from '@/components/organization/OrganizationSkeletons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="rounded-2xl border bg-muted/5 p-6 mb-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            </div>
          </div>
          <TabsSkeleton />
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8 text-center pt-24">
        <h1 className="text-2xl font-bold tracking-tight">Team not found</h1>
        <Button variant="outline" className="mt-4" asChild>
          <Link to={`/app/orgs/${orgId}`}>Back to Organization</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4 -ml-2 h-8 text-muted-foreground hover:text-foreground"
        >
          <Link to={`/app/orgs/${orgId}`}>
            <Icon icon={ArrowLeft01Icon} size="sm" className="mr-1.5" />
            Back
          </Link>
        </Button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-orange-500/5 border p-6 mb-6"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
          <Icon icon={UserGroupIcon} size={128} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/6 pointer-events-none select-none" />

          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Team Profile */}
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="size-16 rounded-xl bg-gradient-to-br from-primary/5 to-muted border border-border/50 flex items-center justify-center overflow-hidden shadow-sm transition-all group-hover:shadow-md ring-1 ring-transparent group-hover:ring-primary/10">
                  <Icon icon={UserGroupIcon} size="xl" className="text-primary/70" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{team.name}</h1>
                  <VisibilityBadge visibility={team.visibility} />
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-mono text-xs">@{team.slug}</span>
                  <span className="text-border mx-1">•</span>
                  <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                    <Icon icon={UserGroupIcon} size="xs" />
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                    <Icon icon={GitForkIcon} size="xs" />
                    {repositories.length} {repositories.length === 1 ? 'repository' : 'repositories'}
                  </span>
                </div>
                {team.description && (
                  <p className="text-sm text-muted-foreground max-w-2xl">{team.description}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')} className="hidden sm:flex h-9">
                <Icon icon={Settings02Icon} size="sm" className="mr-2" />
                Settings
              </Button>
              <Button size="sm" onClick={() => setAddMemberOpen(true)} className="h-9 px-4 shadow-sm active:scale-95 transition-all">
                <Icon icon={PlusSignIcon} size="sm" className="mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs + Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0 border-b border-border/40 mb-8">
            <TabTrigger value="members" icon={UserGroupIcon} label="Members" count={members.length} />
            <TabTrigger value="repositories" icon={GitForkIcon} label="Repositories" count={repositories.length} />
            <TabTrigger value="activity" icon={Activity01Icon} label="Activity" />
            <TabTrigger value="settings" icon={Settings02Icon} label="Settings" />
          </TabsList>
          {/* Members Tab */}
          <TabsContent value="members" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            {members.length === 0 ? (
              <EmptyState variant="members" onAction={() => setAddMemberOpen(true)} />
            ) : (
              <TeamMemberList members={members} onRefresh={refreshMembers} teamId={team.id} />
            )}
          </TabsContent>

          {/* Repositories Tab */}
          <TabsContent value="repositories" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
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
              <EmptyState variant="repositories" onAction={() => setShareRepoOpen(true)} />
            ) : (
              <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
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
          <TabsContent value="activity" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TeamActivityFeed teamId={team.id} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
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

// Helper Components
function TabTrigger({ value, icon, label, count }: { value: string, icon: any, label: string, count?: number }) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "group relative flex items-center gap-2 rounded-t-md rounded-b-none px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground data-[state=active]:text-foreground data-[state=active]:hover:bg-muted outline-none ring-0 focus-visible:ring-0",
        "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-foreground after:content-[''] after:opacity-0 after:transition-opacity after:duration-200 data-[state=active]:after:opacity-100"
      )}
    >
      <Icon icon={icon} size="sm" className="text-muted-foreground group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors" />
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-1 flex h-4 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium text-muted-foreground group-hover:bg-background/80 group-data-[state=active]:bg-muted group-data-[state=active]:text-foreground">
          {count}
        </span>
      )}
    </TabsTrigger>
  )
}
