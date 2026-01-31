import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, GitFork, Play, Clock, Loader2, Globe, Lock, Trash2, Pencil } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/date-utils'
import { getUserRepositories, deleteRepository, updateRepository } from '@/services/repository'
import type { Repository } from '@/types/database'

export function Dashboard() {
  const { user } = useAuthStore()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Rename state
  const [renamingRepo, setRenamingRepo] = useState<Repository | null>(null)
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)

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

  const handleRenameClick = (repo: Repository) => {
    setRenamingRepo(repo)
    setNewName(repo.title)
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


  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Checklists</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <main role="main" aria-label="Dashboard" className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Checklists</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}
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
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-6 text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {repositories.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <GitFork className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No checklists yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first checklist or fork one from the community to get started.
            </p>
            <div className="flex gap-4 justify-center">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repositories.map((repo) => (
            <Card key={repo.id} className="group relative hover:shadow-lg transition-shadow">
              <Link to={`/app/repo/${repo.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{repo.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {repo.is_public ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            Private
                          </span>
                        )}
                        {repo.upstream_repo_id && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <GitFork className="h-3 w-3" />
                            Forked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {repo.description && (
                    <CardDescription className="mt-2 line-clamp-2">
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

              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRenameClick(repo)
                  }}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:ring-2 focus:ring-ring"
                  aria-label={`Rename ${repo.title}`}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Rename</span>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDelete(repo.id, repo.title)
                  }}
                  disabled={deletingId === repo.id}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors focus:ring-2 focus:ring-destructive disabled:opacity-50"
                  aria-label={`Delete ${repo.title}`}
                >
                  {deletingId === repo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">Delete</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/app/runs">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Play className="h-4 w-4" />
                  Active Runs
                </CardTitle>
                <CardDescription>
                  View and continue your in-progress checklists
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/activity">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  See your latest updates and changes
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/explore">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitFork className="h-4 w-4" />
                  Browse Templates
                </CardTitle>
                <CardDescription>
                  Discover proven checklists from the community
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Rename Modal */}
      {renamingRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>Rename Checklist</CardTitle>
              <CardDescription>
                Enter a new name for this checklist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); submitRename(); }}>
                <label htmlFor="rename-input" className="text-sm font-medium mb-2 block">
                  Checklist Name
                </label>
                <Input
                  id="rename-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new name"
                  className="mb-6"
                  disabled={isRenaming}
                  autoFocus
                  aria-required="true"
                  aria-label="New checklist name"
                />
                <div className="flex justify-end gap-2">
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
                    disabled={isRenaming || !newName.trim() || newName === renamingRepo.title}
                  >
                    {isRenaming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Renaming...
                      </>
                    ) : (
                      'Rename'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
