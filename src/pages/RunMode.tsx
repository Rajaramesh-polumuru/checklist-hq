import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RunItem } from '@/components/RunItem'
import { formatRelativeTime } from '@/lib/date-utils'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Trophy,
  Clock,
  ListChecks,
  PartyPopper,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { getRepository } from '@/services/repository'
import {
  getRunWithDetails,
  updateRunProgress,
  completeRun,
  startRunFromLatestCommit,
  calculateRunProgress,
} from '@/services/run'
import type { Repository, Run, Commit, ChecklistItem, RunProgress } from '@/types/database'

export function RunMode() {
  const { runId, repoId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Data state
  const [repository, setRepository] = useState<Repository | null>(null)
  const [run, setRun] = useState<Run | null>(null)
  const [commit, setCommit] = useState<Commit | null>(null)
  const [progress, setProgress] = useState<RunProgress>({})

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  // Load run data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        if (runId) {
          // Load existing run
          const runData = await getRunWithDetails(runId)
          if (!runData) {
            setError('Run not found')
            return
          }

          setRun(runData.run)
          setCommit(runData.commit)
          setProgress(runData.run.progress)

          // Load repository
          const repo = await getRepository(runData.run.repo_id)
          setRepository(repo)
        } else if (repoId) {
          // Start a new run
          const repo = await getRepository(repoId)
          if (!repo) {
            setError('Repository not found')
            return
          }
          setRepository(repo)

          // Create new run from latest commit
          const newRun = await startRunFromLatestCommit(repoId, user?.id)

          // Load the run with commit details
          const runData = await getRunWithDetails(newRun.id)
          if (runData) {
            setRun(runData.run)
            setCommit(runData.commit)
            setProgress(runData.run.progress)
          }

          // Update URL to include run ID
          navigate(`/app/run/${newRun.id}`, { replace: true })
        }
      } catch (err) {
        console.error('Error loading run:', err)
        setError(err instanceof Error ? err.message : 'Failed to load run')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [runId, repoId, navigate])

  // Toggle item completion
  const handleToggle = useCallback(async (itemId: string, completed: boolean) => {
    if (!run || !user) return

    // Optimistic update
    setProgress((prev) => ({
      ...prev,
      [itemId]: {
        completed,
        timestamp: new Date().toISOString(),
        user_id: user.id,
      },
    }))

    try {
      await updateRunProgress(run.id, itemId, completed, user.id)
    } catch (err) {
      console.error('Error updating progress:', err)
      // Revert on error
      setProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[itemId]
        return newProgress
      })
    }
  }, [run, user])

  // Complete the run
  const handleComplete = async () => {
    if (!run) return

    setCompleting(true)
    try {
      await completeRun(run.id)
      setRun((prev) => prev ? { ...prev, status: 'completed' } : null)
      setJustCompleted(true)
    } catch (err) {
      console.error('Error completing run:', err)
      setError('Failed to complete run')
    } finally {
      setCompleting(false)
    }
  }

  // Restart the run
  const handleRestart = async () => {
    if (!repository) return

    try {
      setLoading(true)
      const newRun = await startRunFromLatestCommit(repository.id, user?.id)
      setJustCompleted(false)
      navigate(`/app/run/${newRun.id}`, { replace: true })
    } catch (err) {
      console.error('Error restarting run:', err)
      setError('Failed to start new run')
    } finally {
      setLoading(false)
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
      <RunItem
        key={item.id}
        item={item}
        progress={progress[item.id]}
        depth={depth}
        onToggle={handleToggle}
      />,
      ...renderItems(item.id, depth + 1),
    ])
  }

  const items = getSortedItems()
  const totalItems = items.length
  const completedItems = Object.values(progress).filter((p) => p.completed).length
  const progressPercent = calculateRunProgress(progress, totalItems)
  const isComplete = run?.status === 'completed' || progressPercent === 100

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading checklist...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => navigate('/app')}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to={repository ? `/app/repo/${repository.id}` : '/app'}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold">{repository?.title || 'Checklist Run'}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={isComplete ? 'success' : 'default'} className="text-xs">
                  {isComplete ? 'Complete' : 'In Progress'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium tabular-nums">{completedItems}/{totalItems}</span>
              <Progress value={progressPercent} className="w-24" size="sm" />
            </div>

            {isComplete ? (
              <Button onClick={handleRestart} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Start New Run
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={completing || completedItems < totalItems}
                size="sm"
                loading={completing}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Completion celebration */}
        {isComplete && (
          <Card className={`mb-8 border-success/30 ${justCompleted ? 'animate-fade-in' : ''}`}>
            <CardContent className="py-8 text-center">
              <div className="relative inline-block mb-4">
                <Trophy className="h-12 w-12 text-success" />
                {justCompleted && (
                  <PartyPopper className="h-6 w-6 text-warning absolute -top-1 -right-2 animate-fade-in" />
                )}
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Checklist Complete!
              </h2>
              <p className="text-muted-foreground mb-6">
                You've completed all {totalItems} items in this checklist.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleRestart} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Run Again
                </Button>
                <Button asChild>
                  <Link to="/app">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Run info */}
        {run && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Started {formatRelativeTime(run.started_at)}
            </span>
            {run.completed_at && (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Completed {formatRelativeTime(run.completed_at)}
              </span>
            )}
          </div>
        )}

        {/* Checklist items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Checklist Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {totalItems === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                This checklist has no items.
              </p>
            ) : (
              renderItems(null)
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
