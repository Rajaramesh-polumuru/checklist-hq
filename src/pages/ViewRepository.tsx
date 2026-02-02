import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ForkModal } from '@/components/ForkModal'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import {
  ArrowLeft,
  GitFork,
  Globe,
  Lock,
  Loader2,
  Clock,
  ListChecks,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { getRepository, getLatestCommit } from '@/services/repository'
import type { Repository, Commit, ChecklistItem } from '@/types/database'
import { cn } from '@/lib/utils'

export function ViewRepository() {
  const { repoId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Data state
  const [repository, setRepository] = useState<Repository | null>(null)
  const [commit, setCommit] = useState<Commit | null>(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [forkModalOpen, setForkModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Toast notifications
  const { toasts, dismissToast, success } = useToast()

  // Load repository
  useEffect(() => {
    async function loadRepository() {
      if (!repoId) {
        setError('No repository ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const repo = await getRepository(repoId)
        if (!repo) {
          setError('Repository not found')
          return
        }

        // Check if user can view (public or owner)
        if (!repo.is_public && repo.owner_id !== user?.id) {
          setError('This repository is private')
          return
        }

        setRepository(repo)

        // Load latest commit
        const latestCommit = await getLatestCommit(repoId)
        setCommit(latestCommit)
      } catch (err) {
        console.error('Error loading repository:', err)
        setError('Failed to load repository')
      } finally {
        setLoading(false)
      }
    }

    loadRepository()
  }, [repoId, user?.id])

  // Handle fork button click
  const handleForkClick = () => {
    if (!user) {
      // Redirect to home to sign in
      navigate('/', { state: { returnTo: `/repo/${repoId}` } })
      return
    }
    setForkModalOpen(true)
  }

  // Handle successful fork
  const handleForkSuccess = (_newRepoId: string, itemCount: number) => {
    success(`Successfully forked ${itemCount} items to your checklist!`, 5000)
  }

  // Get sorted items
  const getSortedItems = (): ChecklistItem[] => {
    if (!commit?.content?.items) return []
    return Object.values(commit.content.items).sort((a, b) => a.order - b.order)
  }

  // Get items at a specific level
  const getItemsAtLevel = (parentId: string | null): ChecklistItem[] => {
    return getSortedItems().filter((item) => item.parent === parentId)
  }

  // Render items recursively
  const renderItems = (parentId: string | null, depth = 0): React.ReactNode[] => {
    const items = getItemsAtLevel(parentId)
    return items.flatMap((item) => [
      <ViewItem key={item.id} item={item} depth={depth} />,
      ...renderItems(item.id, depth + 1),
    ])
  }

  const items = getSortedItems()
  const isOwner = user?.id === repository?.owner_id

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (error || !repository) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Repository not found'}</p>
          <Button onClick={() => navigate('/explore')}>Browse Templates</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/explore">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{repository.title}</h1>
                {repository.description && (
                  <p className="text-muted-foreground mt-1">{repository.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {repository.is_public ? (
                      <>
                        <Globe className="h-4 w-4" />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Private
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="h-4 w-4" />
                    {repository.fork_count} forks
                  </span>
                  <span className="flex items-center gap-1">
                    <ListChecks className="h-4 w-4" />
                    {items.length} items
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Updated {formatDate(repository.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner ? (
                <Button asChild>
                  <Link to={`/app/repo/${repository.id}`}>
                    Edit Checklist
                  </Link>
                </Button>
              ) : (
                <Button onClick={handleForkClick} className="gap-2">
                  <GitFork className="h-4 w-4" />
                  {user ? 'Fork to My Checklists' : 'Sign in to Fork'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Fork info banner */}
        {repository.upstream_repo_id && (
          <Card className="mb-6 bg-muted/50">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <GitFork className="h-4 w-4" />
                This is a forked checklist
              </p>
            </CardContent>
          </Card>
        )}

        {/* Checklist preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Checklist Preview
            </CardTitle>
            <CardDescription>
              {items.length} items in this checklist
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                This checklist has no items yet.
              </p>
            ) : (
              <div className="space-y-1">
                {renderItems(null)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fork CTA */}
        {!isOwner && (
          <Card className="mt-6 relative overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
            <CardContent className="py-8 text-center relative">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <GitFork className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Use this checklist</h3>
              <p className="text-muted-foreground text-sm mb-2">
                Fork this checklist to your account to customize and run it.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>All {items.length} items will be copied</span>
              </div>
              <Button onClick={handleForkClick} size="lg" className="gap-2">
                <GitFork className="h-4 w-4" />
                {user ? 'Fork Checklist' : 'Sign in to Fork'}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Fork Modal */}
      <ForkModal
        repository={repository}
        isOpen={forkModalOpen}
        onClose={() => setForkModalOpen(false)}
        onSuccess={handleForkSuccess}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

// Read-only view of a checklist item
function ViewItem({ item, depth }: { item: ChecklistItem; depth: number }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 py-2 px-3 rounded-md',
        depth > 0 && 'border-l-2 border-muted'
      )}
      style={{ marginLeft: depth > 0 ? `${depth * 24}px` : undefined }}
    >
      <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{item.text || 'Untitled item'}</p>
        {item.details && (
          <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
        )}
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`

  return date.toLocaleDateString()
}
