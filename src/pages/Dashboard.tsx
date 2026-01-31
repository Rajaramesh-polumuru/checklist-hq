import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ShareSettingsModal } from '@/components/ShareSettingsModal'
import { Plus, GitFork, Play, Clock, Loader2, Globe, Lock, Trash2, Pencil, ArrowRight, ListChecks, MoreVertical, Share2, Copy, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/date-utils'
import { getUserRepositories, deleteRepository, updateRepository, forkRepository } from '@/services/repository'
import type { Repository } from '@/types/database'

export function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  // Rename state
  const [renamingRepo, setRenamingRepo] = useState<Repository | null>(null)
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)

  // Share modal state
  const [shareRepo, setShareRepo] = useState<Repository | null>(null)

  useEffect(() => {
    async function loadRepositories() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        const repos = await getUserRepositories(user.id)
        setRepositories(repos)
      } catch (err) {
        console.error('Error loading repositories:', err)
        setError('Failed to load your checklists')
      } finally {
        setLoading(false)
      }
    }

    loadRepositories()
  }, [user])

  const handleDelete = async (repoId: string, title: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)
    if (!confirmDelete) return

    try {
      setDeletingId(repoId)
      await deleteRepository(repoId)
      setRepositories(repos => repos.filter(r => r.id !== repoId))
    } catch (err) {
      console.error('Error deleting repository:', err)
      setError('Failed to delete checklist')
    } finally {
      setDeletingId(null)
    }
  }

  const submitRename = async () => {
    if (!renamingRepo || !newName.trim()) return

    try {
      setIsRenaming(true)
      const updated = await updateRepository(renamingRepo.id, { title: newName })

      setRepositories(repos =>
        repos.map(r => r.id === renamingRepo.id ? { ...r, title: updated.title } : r)
      )
      setRenamingRepo(null)
    } catch (err) {
      console.error('Error renaming repository:', err)
      setError('Failed to rename checklist')
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDuplicate = async (repo: Repository) => {
    if (!user) return

    try {
      setDuplicatingId(repo.id)
      await forkRepository({
        sourceRepoId: repo.id,
        newOwnerId: user.id,
        newTitle: `${repo.title} (Copy)`,
      })
      // Reload repos to show the new one
      const repos = await getUserRepositories(user.id)
      setRepositories(repos)
    } catch (err) {
      console.error('Error duplicating repository:', err)
      setError('Failed to duplicate checklist')
    } finally {
      setDuplicatingId(null)
    }
  }

  return (
    <main role="main" aria-label="Dashboard" className="min-h-screen">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Greeting */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg shadow-primary/25">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Welcome back, {user?.email?.split('@')[0]}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your checklists and track your progress
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link to="/explore">
                  <GitFork className="mr-2 h-4 w-4" />
                  Browse Templates
                </Link>
              </Button>
              <Button asChild className="shadow-lg shadow-primary/25">
                <Link to="/app/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Checklist
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ListChecks className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? '—' : repositories.length}</p>
                  <p className="text-xs text-muted-foreground">Total Checklists</p>
                </div>
              </div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-xs text-muted-foreground">Active Runs</p>
                </div>
              </div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? '—' : repositories.filter(r => r.is_public).length}</p>
                  <p className="text-xs text-muted-foreground">Public</p>
                </div>
              </div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <GitFork className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? '—' : repositories.filter(r => r.upstream_repo_id).length}</p>
                  <p className="text-xs text-muted-foreground">Forked</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">

        {/* Section Header with Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold">Your Checklists</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${repositories.length} checklist${repositories.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search checklists..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-6 text-sm text-destructive flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-destructive hover:underline text-sm font-medium">
              Dismiss
            </button>
          </div>
        )}

        {/* Loading state with skeletons */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : repositories.length === 0 ? (
          /* Empty state */
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <ListChecks className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No checklists yet</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first checklist or fork one from the community to get started.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link to="/app/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/explore">
                    <GitFork className="mr-2 h-4 w-4" />
                    Explore Templates
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Repository grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo, index) => {
              // Generate a consistent color based on repo title
              const colors = ['bg-primary', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500']
              const colorIndex = repo.title.length % colors.length
              const accentColor = colors[colorIndex]

              return (
                <Card
                  key={repo.id}
                  hoverable
                  className="group relative animate-fade-in overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Colored accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor} opacity-80`} />

                  <Link to={`/app/repo/${repo.id}`}>
                    <CardHeader className="pb-3 pt-5">
                      <div className="flex items-start justify-between gap-3">
                        {/* Icon */}
                        <div className={`h-10 w-10 rounded-lg ${accentColor}/10 flex items-center justify-center shrink-0`}>
                          <ListChecks className={`h-5 w-5 ${accentColor.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{repo.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={repo.is_public ? "default" : "secondary"} className="text-xs">
                              {repo.is_public ? (
                                <>
                                  <Globe className="h-3 w-3 mr-1" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" />
                                  Private
                                </>
                              )}
                            </Badge>
                            {repo.upstream_repo_id && (
                              <Badge variant="outline" className="text-xs">
                                <GitFork className="h-3 w-3 mr-1" />
                                Forked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {repo.description && (
                        <CardDescription className="mt-3 line-clamp-2">
                          {repo.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatRelativeTime(repo.updated_at)}
                        </span>
                        {repo.fork_count > 0 && (
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            {repo.fork_count}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Link>

                  {/* Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="absolute top-3 right-3 p-2 rounded-md bg-card/90 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm"
                        onClick={(e) => e.preventDefault()}
                        aria-label="Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => navigate(`/app/repo/${repo.id}`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShareRepo(repo)}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(repo)}
                        disabled={duplicatingId === repo.id}
                      >
                        {duplicatingId === repo.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        destructive
                        onClick={() => handleDelete(repo.id, repo.title)}
                        disabled={deletingId === repo.id}
                      >
                        {deletingId === repo.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              )
            })}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>Quick Actions</span>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {/* Active Runs */}
            <Link to="/app/runs">
              <Card hoverable className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
                <CardHeader className="pb-4 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 text-emerald-500" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-base mt-4">Active Runs</CardTitle>
                  <CardDescription className="text-sm">
                    View and continue your in-progress checklists
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Recent Activity */}
            <Link to="/app/activity">
              <Card hoverable className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <CardHeader className="pb-4 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-base mt-4">Recent Activity</CardTitle>
                  <CardDescription className="text-sm">
                    See your latest updates and changes
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Browse Templates */}
            <Link to="/explore">
              <Card hoverable className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                <CardHeader className="pb-4 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GitFork className="h-5 w-5 text-violet-500" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-base mt-4">Browse Templates</CardTitle>
                  <CardDescription className="text-sm">
                    Discover proven checklists from the community
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Rename Modal */}
        <Dialog open={!!renamingRepo} onOpenChange={() => setRenamingRepo(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Checklist</DialogTitle>
              <DialogDescription>
                Enter a new name for "{renamingRepo?.title}".
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); submitRename(); }}>
              <div className="py-4">
                <label htmlFor="rename-input" className="text-sm font-medium mb-2 block">
                  Checklist Name
                </label>
                <Input
                  id="rename-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new name"
                  disabled={isRenaming}
                  autoFocus
                  aria-required="true"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRenamingRepo(null)}
                  disabled={isRenaming}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isRenaming || !newName.trim() || newName === renamingRepo?.title}
                  loading={isRenaming}
                >
                  Rename
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Share Settings Modal */}
        {shareRepo && (
          <ShareSettingsModal
            repository={shareRepo}
            isOpen={!!shareRepo}
            onClose={() => setShareRepo(null)}
            onVisibilityChange={async (newIsPublic) => {
              await updateRepository(shareRepo.id, { is_public: newIsPublic })
              setRepositories(repos =>
                repos.map(r => r.id === shareRepo.id ? { ...r, is_public: newIsPublic } : r)
              )
              setShareRepo({ ...shareRepo, is_public: newIsPublic })
            }}
            onDelete={async () => {
              await deleteRepository(shareRepo.id)
              setRepositories(repos => repos.filter(r => r.id !== shareRepo.id))
              setShareRepo(null)
            }}
          />
        )}
      </div>
    </main>
  )
}
