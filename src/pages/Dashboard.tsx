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
import { Plus, GitFork, Play, Clock, Loader2, Globe, Lock, Trash2, Pencil, ArrowRight, ListChecks, MoreVertical, Share2, Copy } from 'lucide-react'
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
    <main role="main" aria-label="Dashboard" className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Checklists</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back, {user?.email?.split('@')[0]}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/new">
            <Plus className="mr-2 h-4 w-4" />
            New Checklist
          </Link>
        </Button>
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
          {repositories.map((repo, index) => (
            <Card
              key={repo.id}
              hoverable
              className="group relative animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link to={`/app/repo/${repo.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{repo.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
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
                    <span>Updated {formatRelativeTime(repo.updated_at)}</span>
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
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/app/runs">
            <Card hoverable className="group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-base mt-3">Active Runs</CardTitle>
                <CardDescription className="text-sm">
                  View and continue your in-progress checklists
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/activity">
            <Card hoverable className="group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-base mt-3">Recent Activity</CardTitle>
                <CardDescription className="text-sm">
                  See your latest updates and changes
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/explore">
            <Card hoverable className="group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <GitFork className="h-4 w-4 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-base mt-3">Browse Templates</CardTitle>
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
    </main>
  )
}
