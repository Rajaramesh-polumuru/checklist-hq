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
  Loader2,
  Building2,
  Users,
  GitFork,
  Settings,
  Plus,
  Shield,
  Search,
  LayoutGrid
} from 'lucide-react'
import { RepositoryCard } from '@/pages/dashboard/RepositoryCard'
import { Input } from '@/components/ui/input'
import { CreateTeamModal } from '@/components/CreateTeamModal'
import { InviteMemberModal } from '@/components/InviteMemberModal'
import { OrganizationSettings } from '@/components/OrganizationSettings'

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                  <Building2 className="h-8 w-8 text-primary" />
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
              <Button variant="outline" onClick={() => setActiveTab('settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="repositories" className="gap-2">
                  <GitFork className="h-4 w-4" />
                  Repositories
                  <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-xs">{repos.length}</span>
                </TabsTrigger>
                <TabsTrigger value="teams" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Teams
                  <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-xs">{teams.length}</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2">
                  <Users className="h-4 w-4" />
                  People
                  <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-xs">{members.length}</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Find a repository..."
                  className="pl-9"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredRepos.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
                <GitFork className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No repositories found</h3>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                  {repoSearch ? 'Try a different search term.' : 'Get started by creating a new repository for this organization.'}
                </p>
                {!repoSearch && (
                  <Button className="mt-4" variant="outline">
                    Create Repository
                  </Button>
                )}
              </div>
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
              <Button size="sm" onClick={() => setCreateTeamOpen(true)}>New Team</Button>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
                <LayoutGrid className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No teams yet</h3>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                  Create teams to organize your members and control access to repositories.
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setCreateTeamOpen(true)}>Create Team</Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                  <Card key={team.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          {team.name}
                          {team.visibility === 'secret' && (
                            <Shield className="h-3 w-3 text-muted-foreground" />
                          )}
                        </CardTitle>
                      </div>
                      <CardDescription className="line-clamp-1">
                        {team.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>@{team.slug}</span>
                        <Button variant="ghost" size="sm" className="h-8">View</Button>
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
              <Button size="sm" onClick={() => setInviteMemberOpen(true)}>Invite Member</Button>
            </div>

            <Card>
              <div className="divide-y">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {/* Placeholder avatar logic */}
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          User ID: {member.user_id.slice(0, 8)}...
                          {member.role === 'owner' && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 uppercase font-semibold">Owner</span>
                          )}
                          {member.role === 'admin' && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase font-semibold">Admin</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Manage</Button>
                  </div>
                ))}
              </div>
            </Card>
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
