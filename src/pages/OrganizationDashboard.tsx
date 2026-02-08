import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getOrganization, getOrganizationMembers, getOrganizationTeams, type OrganizationMemberWithUser } from '@/services/organization'
import { getOrganizationRepositories } from '@/services/repository'
import type { Organization, Team, Repository, RepositoryWithTags } from '@/types/database'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissionStore } from '@/stores/permission-store'
import { useOrgPermission } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building02Icon,
  UserGroupIcon,
  GitForkIcon,
  Settings02Icon,
  PlusSignIcon,
  Search01Icon,
  LayoutGridIcon,
  Analytics01Icon,
  MoreHorizontalIcon,
  AiCloud02Icon,
  Activity01Icon
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { RepositoryCard } from '@/pages/dashboard/RepositoryCard'
import { Input } from '@/components/ui/input'
import { CreateTeamModal } from '@/components/CreateTeamModal'
import { InviteMemberModal } from '@/components/InviteMemberModal'
import { CreateRepositoryModal } from '@/components/CreateRepositoryModal'
import { OrganizationSettings } from '@/components/OrganizationSettings'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { RoleBadge } from '@/components/ui/role-badge'
import { VisibilityBadge } from '@/components/ui/visibility-badge'
import { EmptyState } from '@/components/organization/EmptyStates'
import { TabsSkeleton } from '@/components/organization/OrganizationSkeletons'
import { OrgActivityFeed } from '@/components/organization/OrgActivityFeed'
import { cn } from '@/lib/utils'

export function OrganizationDashboard() {
  const { orgId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const setOrgPermission = usePermissionStore((state) => state.setOrgPermission)
  const { canInvite, canCreateTeams, canAccessSettings } = useOrgPermission(orgId)

  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMemberWithUser[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [repos, setRepos] = useState<RepositoryWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('repositories')

  // Modals
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false)
  const [createRepoOpen, setCreateRepoOpen] = useState(false)

  // Search filter for repos
  const [repoSearch, setRepoSearch] = useState('')

  useEffect(() => {
    async function loadData() {
      if (!orgId || !user) return
      try {
        setLoading(true)
        const [orgData, membersData, teamsData, reposData] = await Promise.all([
          getOrganization(orgId),
          getOrganizationMembers(orgId),
          getOrganizationTeams(orgId),
          getOrganizationRepositories(orgId)
        ])

        setOrg(orgData)
        setMembers(membersData)
        setTeams(teamsData)
        setRepos(reposData)

        // Set user's organization permission
        const userMember = membersData.find(m => m.user_id === user.id)
        if (userMember) {
          setOrgPermission(orgId, userMember.role as 'owner' | 'admin' | 'member' | 'viewer')
        }
      } catch (error) {
        console.error('Failed to load organization data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [orgId, user, setOrgPermission])

  const refreshRepos = async () => {
    if (!orgId) return
    const reposData = await getOrganizationRepositories(orgId)
    setRepos(reposData)
  }

  const refreshTeams = async () => {
    if (!orgId) return
    const teamsData = await getOrganizationTeams(orgId)
    setTeams(teamsData)
  }

  const refreshMembers = async () => {
    if (!orgId) return
    const membersData = await getOrganizationMembers(orgId)
    setMembers(membersData)
  }

  const handleRun = (repo: Repository) => {
    navigate(`/app/run/start/${repo.id}`)
  }

  const handleShare = (repo: Repository) => {
    console.log('Share', repo)
  }

  const handleDuplicate = (repo: Repository) => {
    console.log('Duplicate', repo)
  }

  const handleDelete = async (repoId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete ${title}?`)) {
      console.log('Delete', repoId)
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

  if (!org) {
    return (
      <div className="container mx-auto px-4 py-8 text-center pt-24">
        <h1 className="text-2xl font-bold tracking-tight">Organization not found</h1>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/app">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const filteredRepos = repos.filter(repo =>
    repo.title.toLowerCase().includes(repoSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-orange-500/5 border p-6 mb-6"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
          <Icon icon={Building02Icon} size={128} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/6 pointer-events-none select-none" />

          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Org Profile */}
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="size-16 rounded-xl bg-gradient-to-br from-primary/5 to-muted border border-border/50 flex items-center justify-center overflow-hidden shadow-sm transition-all group-hover:shadow-md ring-1 ring-transparent group-hover:ring-primary/10">
                  {org.avatar_url ? (
                    <img src={org.avatar_url} alt={org.name} className="h-full w-full object-cover" />
                  ) : (
                    <Icon icon={Building02Icon} size="xl" className="text-primary/70" />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{org.name}</h1>
                  <span className="inline-flex items-center justify-center rounded-md bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-gray-500/10">
                    Free Plan
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-mono text-xs">@{org.slug}</span>
                  <span className="text-border mx-1">•</span>
                  <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                    <Icon icon={UserGroupIcon} size="xs" />
                    {members.length} members
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                    <Icon icon={LayoutGridIcon} size="xs" />
                    {teams.length} teams
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:block relative w-64">
                <Icon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size="sm" />
                <Input
                  placeholder="Find repository..."
                  className="h-9 w-full bg-muted/30 pl-9 border-transparent focus-visible:ring-1 focus-visible:bg-background transition-all hover:bg-muted/50 font-sans"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                />
              </div>

              {canAccessSettings && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')} className="hidden sm:flex h-9">
                  <Icon icon={Settings02Icon} size="sm" className="mr-2" />
                  Settings
                </Button>
              )}

              <Button size="sm" onClick={() => setCreateRepoOpen(true)} className="h-9 px-4 shadow-sm active:scale-95 transition-all">
                <Icon icon={PlusSignIcon} size="sm" className="mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs + Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0 border-b border-border/40 mb-8">
            <TabTrigger value="repositories" icon={GitForkIcon} label="Repositories" count={repos.length} />
            <TabTrigger value="teams" icon={LayoutGridIcon} label="Teams" count={teams.length} />
            <TabTrigger value="members" icon={UserGroupIcon} label="People" />
            <TabTrigger value="activity" icon={Activity01Icon} label="Activity" />
            <TabTrigger value="analytics" icon={Analytics01Icon} label="Analytics" />
            <TabTrigger value="agents" icon={AiCloud02Icon} label="Agents" />
            {canAccessSettings && <TabTrigger value="settings" icon={Settings02Icon} label="Settings" />}
          </TabsList>

          {/* Repositories Tab */}
          <TabsContent value="repositories" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            {filteredRepos.length === 0 ? (
              repoSearch ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl bg-muted/5 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                    <Icon icon={Search01Icon} className="h-6 w-6 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium tracking-tight">No repositories found</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    We couldn't find any repositories matching "{repoSearch}".
                  </p>
                  <Button variant="ghost" onClick={() => setRepoSearch('')} className="mt-4">
                    Clear Search
                  </Button>
                </div>
              ) : (
                <EmptyState variant="repositories" onAction={() => setCreateRepoOpen(true)} />
              )
            ) : (
              <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
                {filteredRepos.map((repo, index) => (
                  <RepositoryCard
                    key={repo.id}
                    repo={repo}
                    index={index}
                    onRun={handleRun}
                    onShare={handleShare}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Teams</h2>
                <p className="text-sm text-muted-foreground">Manage team access and visibility.</p>
              </div>
              {canCreateTeams && (
                <Button size="sm" onClick={() => setCreateTeamOpen(true)}>
                  <Icon icon={PlusSignIcon} size="sm" className="mr-2" />
                  Create Team
                </Button>
              )}
            </div>

            {teams.length === 0 ? (
              <EmptyState variant="teams" onAction={() => setCreateTeamOpen(true)} />
            ) : (
              <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
                {teams.map(team => (
                  <Card key={team.id} className="group hover:shadow-md transition-all duration-300 border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
                          {team.name}
                        </CardTitle>
                        <VisibilityBadge visibility={team.visibility as "public" | "private" | "secret"} />
                      </div>
                      <CardDescription className="line-clamp-1 text-xs">
                        {team.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">@{team.slug}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                          <Link to={`/app/orgs/${orgId}/teams/${team.id}`}>
                            Manage <Icon icon={MoreHorizontalIcon} size="xs" className="ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">People</h2>
                <p className="text-sm text-muted-foreground">Manage members and roles.</p>
              </div>
              {canInvite && (
                <Button size="sm" onClick={() => setInviteMemberOpen(true)}>
                  <Icon icon={PlusSignIcon} size="sm" className="mr-2" />
                  Invite Member
                </Button>
              )}
            </div>

            {members.length === 0 ? (
              <EmptyState variant="members" onAction={() => setInviteMemberOpen(true)} />
            ) : (
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <div className="divide-y divide-border/40">
                  {members.map(member => {
                    // Use user metadata if available, otherwise use user_id
                    const displayName = member.user?.user_metadata?.full_name
                      || member.user?.user_metadata?.name
                      || (member.user?.email ? member.user.email.split('@')[0] : null)
                      || `Member ${member.user_id.slice(0, 8)}`
                    const initials = member.user_id.slice(0, 2).toUpperCase()
                    const avatarUrl = member.user?.user_metadata?.avatar_url
                    const email = member.user?.email || null

                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors group">
                        <div className="flex items-center gap-4">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="h-9 w-9 rounded-full object-cover ring-1 ring-border/20"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm ring-1 ring-border/20">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{displayName}</span>
                              <RoleBadge role={member.role} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {email ? `${email} · ` : ''}Joined {new Date(member.joined_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Manage
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            {orgId && <OrgActivityFeed organizationId={orgId} />}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            {orgId && <AnalyticsDashboard organizationId={orgId} />}
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-xl bg-muted/5 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon icon={AiCloud02Icon} className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">AI Agents</h3>
              <p className="text-muted-foreground mt-2 text-sm max-w-md">
                Create and manage AI agents that can execute checklist items automatically.
              </p>
              <Button className="mt-6" asChild>
                <Link to={`/app/orgs/${orgId}/agents`}>
                  <Icon icon={AiCloud02Icon} size="sm" className="mr-2" />
                  Manage Agents
                </Link>
              </Button>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            {org && <OrganizationSettings org={org} onUpdate={setOrg} />}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {org && user && (
        <CreateRepositoryModal
          organizationId={org.id}
          userId={user.id}
          isOpen={createRepoOpen}
          onClose={() => setCreateRepoOpen(false)}
          onRepoCreated={refreshRepos}
        />
      )}

      {org && (
        <CreateTeamModal
          organizationId={org.id}
          isOpen={createTeamOpen}
          onClose={() => setCreateTeamOpen(false)}
          onTeamCreated={refreshTeams}
        />
      )}

      {org && (
        <InviteMemberModal
          organizationId={org.id}
          isOpen={inviteMemberOpen}
          onClose={() => setInviteMemberOpen(false)}
          onMemberAdded={refreshMembers}
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
        <span className="ml-1 flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium text-muted-foreground group-hover:bg-background/80 group-data-[state=active]:bg-muted group-data-[state=active]:text-foreground">
          {count}
        </span>
      )}
    </TabsTrigger>
  )
}
