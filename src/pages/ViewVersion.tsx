import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormattedText } from '@/lib/rich-text'
import {
  ArrowLeft01Icon,
  GitCommitIcon,
  ArrowLeft02Icon,
  Loading02Icon,
  Clock01Icon,
  CheckListIcon,
  ArrowRight01Icon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { useAuthStore } from '@/stores/auth-store'
import { getRepository, getCommit, restoreToCommit, getLatestCommit } from '@/services/repository'
import type { Repository, Commit, ChecklistItem } from '@/types/database'
import { cn } from '@/lib/utils'

export function ViewVersion() {
  const { repoId, commitId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Data state
  const [repository, setRepository] = useState<Repository | null>(null)
  const [commit, setCommit] = useState<Commit | null>(null)
  const [latestCommit, setLatestCommit] = useState<Commit | null>(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!repoId || !commitId) {
        setError('Missing repository or commit ID')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [repo, commitData, latest] = await Promise.all([
          getRepository(repoId),
          getCommit(commitId),
          getLatestCommit(repoId),
        ])

        if (!repo) {
          setError('Repository not found')
          return
        }

        if (!commitData) {
          setError('Version not found')
          return
        }

        setRepository(repo)
        setCommit(commitData)
        setLatestCommit(latest)
      } catch (err) {
        console.error('Error loading version:', err)
        setError('Failed to load version')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [repoId, commitId])

  // Handle restore
  const handleRestore = async () => {
    if (!repository || !commit) return

    const confirmRestore = window.confirm(
      `Are you sure you want to restore to this version? This will create a new version with the content from "${commit.message || 'this commit'}".`
    )
    if (!confirmRestore) return

    setRestoring(true)
    try {
      await restoreToCommit({
        repoId: repository.id,
        commitId: commit.id,
        latestCommitId: latestCommit?.id,
      })
      navigate(`/app/repo/${repository.id}`)
    } catch (err) {
      console.error('Error restoring version:', err)
      setError('Failed to restore version')
    } finally {
      setRestoring(false)
    }
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
  const isLatest = commit?.id === latestCommit?.id
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
  if (error || !repository || !commit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Version not found'}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
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
                <Link to={`/app/repo/${repository.id}`}>
                  <Icon icon={ArrowLeft01Icon} className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{repository.title}</h1>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    {isLatest ? 'Latest Version' : 'Past Version'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Icon icon={GitCommitIcon} className="h-4 w-4" />
                  <span>{commit.message || 'No message'}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon icon={Clock01Icon} className="h-4 w-4" />
                    {formatDate(commit.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon={CheckListIcon} className="h-4 w-4" />
                    {items.length} items
                  </span>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                {isLatest ? (
                  <Button asChild>
                    <Link to={`/app/repo/${repository.id}`}>
                      <Icon icon={PencilEdit02Icon} className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                ) : (
                  <Button onClick={handleRestore} disabled={restoring}>
                    {restoring ? (
                      <Icon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icon icon={ArrowLeft02Icon} className="mr-2 h-4 w-4" />
                    )}
                    Restore This Version
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Version notice */}
      {!isLatest && (
        <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
          <div className="container mx-auto flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
            <Icon icon={Clock01Icon} className="h-4 w-4" />
            <span>
              You are viewing an older version from {formatDate(commit.created_at)}.
              {isOwner && ' Click "Restore This Version" to revert to this state.'}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon={CheckListIcon} className="h-5 w-5" />
              Checklist Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                This version has no items.
              </p>
            ) : (
              <div className="space-y-1">
                {renderItems(null)}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
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
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
