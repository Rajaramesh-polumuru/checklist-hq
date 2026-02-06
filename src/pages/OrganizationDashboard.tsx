import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getOrganization, getOrganizationMembers, getOrganizationTeams } from '@/services/organization'
import { getOrganizationRepositories } from '@/services/repository'
import type { Organization, OrganizationMember, Team, Repository } from '@/types/database'
// import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loading02Icon,
  Building02Icon,
  UserGroupIcon,
  GitForkIcon,
  Settings02Icon,
  PlusSignIcon,
  Shield01Icon,
  Search01Icon,
  LayoutGridIcon,
  Analytics01Icon
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { RepositoryCard } from '@/pages/dashboard/RepositoryCard'
import { Input } from '@/components/ui/input'
import { CreateTeamModal } from '@/components/CreateTeamModal'
import { InviteMemberModal } from '@/components/InviteMemberModal'
import { OrganizationSettings } from '@/components/OrganizationSettings'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { RoleBadge } from '@/components/ui/role-badge'
import { VisibilityBadge } from '@/components/ui/visibility-badge'
import { EmptyState, QuickStartChecklist } from '@/components/organization/EmptyStates'
import { TeamListSkeleton, MemberListSkeleton, RepositoryGridSkeleton, TabsSkeleton } from '@/components/organization/OrganizationSkeletons'

export function OrganizationDashboard() {
  const { orgId } = useParams()
  const navigate = useNavigate()
  // const { user } = useAuthStore() // Potentially used for permission checks later
  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('repositories')

  // Modals
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false)

  // Search filter for repos
  const [repoSearch, setRepoSearch] = useState('')

  useEffect(() => {
    async function loadData() {
      if (!orgId) return
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
      } catch (error) {
        console.error('Failed to load organization data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [orgId])

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
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-xl bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <TabsSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Organization not found</h1>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/app">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  // Filter repos
  const filteredRepos = repos.filter(repo =>
    repo.title.toLowerCase().includes(repoSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center border">
                {org.avatar_url ? (
                  <img src={org.avatar_url} alt={org.name} className="h-full w-full object-cover rounded-xl" />
                ) : (
                  <Icon icon={Building02Icon} className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{org.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                  <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">@{org.slug}</span>
                  <span>•</span>
                  <span>{members.length} members</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('settings')}
                className="active:scale-95 transition-transform"
                aria-label="Organization settings"
              >
                <Icon icon={Settings02Icon} className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                className="active:scale-95 transition-transform"
                aria-label="Create new project"
              >
                <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="repositories" className="gap-2">
                  <Icon icon={GitForkIcon} className="h-4 w-4" />
                  Repositories
                  <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-xs">{repos.length}</span>
                </TabsTrigger>
                <TabsTrigger value="teams" className="gap-2">
                  <Icon icon={LayoutGridIcon} className="h-4 w-4" />
                  Teams
                  <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-xs">{teams.length}</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2">
                  <Icon icon={UserGroupIcon} className="h-4 w-4" />
                  People
                  <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-xs">{members.length}</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <Icon icon={Analytics01Icon} className="h-4 w-4" />
                  Analytics
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
          {/* Repositories Tab */}
          <TabsContent value="repositories" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Icon icon={Search01Icon} className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Find a repository..."
                  className="pl-9 focus-visible:ring-2 focus-visible:ring-ring"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  aria-label="Search repositories"
                />
              </div>
            </div>

            {loading ? (
              <RepositoryGridSkeleton />
            ) : filteredRepos.length === 0 ? (
              repoSearch ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
                  <Icon icon={Search01Icon} className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No repositories found</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                    Try a different search term.
                  </p>
                </div>
              ) : (
                <EmptyState variant="repositories" onAction={() => console.log('Create repository')} />
              )
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRepos.map(repo => (
                  <RepositoryCard
                    key={repo.id}
                    repo={repo}
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
          <TabsContent value="teams" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Teams</h2>
              <Button 
                size="sm" 
                onClick={() => setCreateTeamOpen(true)}
                className="active:scale-95 transition-transform"
                aria-label="Create new team"
              >
                <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                New Team
              </Button>
            </div>

            {loading ? (
              <TeamListSkeleton />
            ) : teams.length === 0 ? (
              <EmptyState variant="teams" onAction={() => setCreateTeamOpen(true)} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                  <Card key={team.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          {team.name}
                        </CardTitle>
                        <VisibilityBadge visibility={team.visibility as "public" | "private" | "secret"} />
                      </div>
                      <CardDescription className="line-clamp-1">
                        {team.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="font-mono text-xs">@{team.slug}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 active:scale-95 transition-transform"
                          aria-label={`View ${team.name} team`}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">People</h2>
              <Button 
                size="sm" 
                onClick={() => setInviteMemberOpen(true)}
                className="active:scale-95 transition-transform"
                aria-label="Invite new member"
              >
                <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>

            {loading ? (
              <MemberListSkeleton />
            ) : members.length === 0 ? (
              <EmptyState variant="members" onAction={() => setInviteMemberOpen(true)} />
            ) : (
              <Card>
                <div className="divide-y">
                  {members.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors focus-within:bg-muted/50"
                      role="listitem"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium"
                          aria-hidden="true"
                        >
                          <Icon icon={UserGroupIcon} className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <span>User ID: {member.user_id.slice(0, 8)}...</span>
                            <RoleBadge role={member.role as "owner" | "admin" | "member" | "viewer"} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Manage member ${member.user_id.slice(0, 8)}`}
                      >
                        Manage
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>
          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {orgId && <AnalyticsDashboard organizationId={orgId} />}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            {org && <OrganizationSettings org={org} onUpdate={setOrg} />}
          </TabsContent>
        </Tabs>
      </div>

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
