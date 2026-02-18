import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ForkModal } from '@/components/ForkModal'
import { StartRunModal } from '@/components/StartRunModal'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { FormattedText } from '@/lib/rich-text'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import GitForkIcon from '@hugeicons/core-free-icons/GitForkIcon'
import Globe02Icon from '@hugeicons/core-free-icons/Globe02Icon'
import LockKeyIcon from '@hugeicons/core-free-icons/LockKeyIcon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import CheckListIcon from '@hugeicons/core-free-icons/CheckListIcon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import PencilEdit02Icon from '@hugeicons/core-free-icons/PencilEdit02Icon'
import { Icon } from '@/components/ui/icon'
import { useAuthStore } from '@/stores/auth-store'
import { getRepository, getLatestCommit } from '@/services/repository'
import { getMyActiveAndPausedRunsForRepo } from '@/services/run'
import { ActiveRunsPanel } from '@/components/ActiveRunsPanel'
import type { Repository, Commit, ChecklistItem, Run } from '@/types/database'
import { cn } from '@/lib/utils'

export function ViewRepository() {
  const { repoId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Data state
  const [repository, setRepository] = useState<Repository | null>(null)
  const [commit, setCommit] = useState<Commit | null>(null)
  const [activeRuns, setActiveRuns] = useState<Run[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [forkModalOpen, setForkModalOpen] = useState(false)
  const [runModalOpen, setRunModalOpen] = useState(false)
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

        // Load user's active/paused runs for this repo
        if (user?.id) {
          const runs = await getMyActiveAndPausedRunsForRepo(user.id, repoId)
          setActiveRuns(runs)
        }
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
        <Icon icon={Loading02Icon} className="h-8 w-8 animate-spin text-muted-foreground" />
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
                  <Icon icon={ArrowLeft01Icon} className="h-4 w-4" />
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
                        <Icon icon={Globe02Icon} className="h-4 w-4" />
                        Public
                      </>
                    ) : (
                      <>
                        <Icon icon={LockKeyIcon} className="h-4 w-4" />
                        Private
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon={GitForkIcon} className="h-4 w-4" />
                    {repository.fork_count} forks
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon={CheckListIcon} className="h-4 w-4" />
                    {items.length} items
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon={Clock01Icon} className="h-4 w-4" />
                    Updated {formatDate(repository.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner ? (
                <>
                  <Button asChild variant="outline">
                    <Link to={`/app/repo/${repository.id}`}>
                      <Icon icon={PencilEdit02Icon} className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button onClick={() => setRunModalOpen(true)}>
                    <Icon icon={PlayIcon} className="mr-2 h-4 w-4" />
                    Run Now
                  </Button>
                </>
              ) : (
                <Button onClick={handleForkClick} className="gap-2">
                  <Icon icon={GitForkIcon} className="h-4 w-4" />
                  {user ? 'Fork to My Checklists' : 'Sign in to Fork'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col-reverse lg:flex-row gap-8">
          {/* Main Column */}
          <div className="flex-1 min-w-0">
            {/* Fork info banner */}
            {repository.upstream_repo_id && (
              <Card className="mb-6 bg-muted/50">
                <CardContent className="py-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Icon icon={GitForkIcon} className="h-4 w-4" />
                    This is a forked checklist
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Checklist preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon={CheckListIcon} className="h-5 w-5" />
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

          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            {/* Active Runs Panel */}
            {repository && (
              <ActiveRunsPanel
                runs={activeRuns.map(r => ({
                  ...r,
                  repository: { title: repository.title, owner_id: repository.owner_id }
                }))}
                loading={loading}
              />
            )}

            {/* Fork CTA in Sidebar for non-owners */}
            {!isOwner && (
              <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
                <CardContent className="p-6 text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon icon={GitForkIcon} className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-1">Fork & customize</h3>
                  <p className="text-muted-foreground text-xs mb-4">
                    Copy this checklist to your account to edit and run it.
                  </p>
                  <Button onClick={handleForkClick} className="w-full gap-2 text-sm">
                    <Icon icon={GitForkIcon} className="h-4 w-4" />
                    {user ? 'Fork Checklist' : 'Sign in to Fork'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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

      {/* Start Run Modal */}
      {repository && (
        <StartRunModal
          repository={repository}
          isOpen={runModalOpen}
          onClose={() => setRunModalOpen(false)}
          onSuccess={() => {
            // Navigation is handled inside the modal handleGoToRun
            setRunModalOpen(false)
          }}
        />
      )}
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
      <Icon icon={ArrowRight01Icon} className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{item.text ? <FormattedText text={item.text} /> : 'Untitled item'}</p>
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
