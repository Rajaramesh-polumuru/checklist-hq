import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/date-utils'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Trophy,
  Clock,
  Circle,
  Sparkles,
  ChevronRight,
  Play,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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

// Confetti effect component
function Confetti({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)],
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// Circular progress ring component
function ProgressRing({
  progress,
  completed,
  total,
  size = 120
}: {
  progress: number
  completed: number
  total: number
  size?: number
}) {
  const strokeWidth = size / 10
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-primary transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{completed}</span>
        <span className="text-sm text-muted-foreground">of {total}</span>
      </div>
    </div>
  )
}

// Run item with premium styling
function PremiumRunItem({
  item,
  progress,
  depth,
  onToggle,
  stepNumber,
  isNext,
  totalSteps,
}: {
  item: ChecklistItem
  progress: { completed: boolean; timestamp?: string } | undefined
  depth: number
  onToggle: (itemId: string, completed: boolean) => void
  stepNumber: number
  isNext: boolean
  totalSteps: number
}) {
  const isCompleted = progress?.completed ?? false
  const [isAnimating, setIsAnimating] = useState(false)
  const checkboxRef = useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    if (!isCompleted) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 500)
    }
    onToggle(item.id, !isCompleted)
  }

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'w-full text-left group flex items-start gap-4 p-4 rounded-2xl transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        isCompleted && 'bg-success/10 hover:bg-success/15',
        !isCompleted && isNext && 'bg-primary/5 ring-2 ring-primary/20 hover:bg-primary/10',
        !isCompleted && !isNext && 'hover:bg-muted/50',
        depth > 0 && 'ml-8 border-l-2 border-muted'
      )}
      style={{ marginLeft: depth > 0 ? `${depth * 32}px` : undefined }}
    >
      {/* Animated checkbox */}
      <div className="relative pt-0.5">
        <div
          ref={checkboxRef as any}
          className={cn(
            'relative h-7 w-7 rounded-full border-2 transition-all duration-300 flex items-center justify-center',
            isCompleted && 'bg-success border-success scale-110',
            !isCompleted && isNext && 'border-primary bg-primary/10',
            !isCompleted && !isNext && 'border-muted-foreground/30 group-hover:border-primary/50',
            isAnimating && 'animate-bounce'
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-white animate-fade-in" />
          ) : isNext ? (
            <Play className="h-3 w-3 text-primary" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/30" />
          )}
        </div>

        {/* Pulse effect for next item */}
        {isNext && !isCompleted && (
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-xs font-medium uppercase tracking-wider",
            isCompleted ? "text-success" : isNext ? "text-primary" : "text-muted-foreground"
          )}>
            Step {stepNumber} of {totalSteps}
          </span>
          {isNext && !isCompleted && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary/90">
              NEXT
            </Badge>
          )}
        </div>

        {/* Item text */}
        <p className={cn(
          'text-lg font-medium transition-all',
          isCompleted && 'text-success line-through opacity-70',
          isNext && !isCompleted && 'text-foreground',
          !isNext && !isCompleted && 'text-muted-foreground'
        )}>
          {item.text || 'Untitled item'}
        </p>

        {/* Details */}
        {item.details && (
          <p className="text-sm text-muted-foreground mt-1">
            {item.details}
          </p>
        )}

        {/* Completion timestamp */}
        {isCompleted && progress?.timestamp && (
          <p className="text-xs text-success mt-2 flex items-center gap-1.5 opacity-80">
            <CheckCircle2 className="h-3 w-3" />
            Completed {formatRelativeTime(progress.timestamp)}
          </p>
        )}
      </div>

      {/* Chevron for next item */}
      {isNext && !isCompleted && (
        <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
      )}
    </button>
  )
}

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
  const [showConfetti, setShowConfetti] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  // Load run data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        if (runId) {
          const runData = await getRunWithDetails(runId)
          if (!runData) {
            setError('Run not found')
            return
          }

          setRun(runData.run)
          setCommit(runData.commit)
          setProgress(runData.run.progress)

          const repo = await getRepository(runData.run.repo_id)
          setRepository(repo)
        } else if (repoId) {
          const repo = await getRepository(repoId)
          if (!repo) {
            setError('Repository not found')
            return
          }
          setRepository(repo)

          const newRun = await startRunFromLatestCommit(repoId, user?.id)
          const runData = await getRunWithDetails(newRun.id)
          if (runData) {
            setRun(runData.run)
            setCommit(runData.commit)
            setProgress(runData.run.progress)
          }

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
  }, [runId, repoId, navigate, user?.id])

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
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
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
      setShowConfetti(false)
      navigate(`/app/run/${newRun.id}`, { replace: true })
    } catch (err) {
      console.error('Error restarting run:', err)
      setError('Failed to start new run')
    } finally {
      setLoading(false)
    }
  }

  // Get sorted items (flat list for simple runs)
  const getSortedItems = (): ChecklistItem[] => {
    if (!commit?.content?.items) return []
    return Object.values(commit.content.items).sort((a, b) => a.order - b.order)
  }

  // Get root level items only for main display
  const getRootItems = (): ChecklistItem[] => {
    return getSortedItems().filter((item) => !item.parent)
  }

  // Find the next incomplete item
  const getNextIncompleteIndex = (): number => {
    const rootItems = getRootItems()
    return rootItems.findIndex((item) => !progress[item.id]?.completed)
  }

  const items = getRootItems()
  const totalItems = items.length
  const completedItems = Object.values(progress).filter((p) => p.completed).length
  const progressPercent = calculateRunProgress(progress, totalItems)
  const isComplete = run?.status === 'completed' || progressPercent === 100
  const nextIncompleteIndex = getNextIncompleteIndex()

  // Auto-complete when all items done
  useEffect(() => {
    if (progressPercent === 100 && run?.status !== 'completed' && !completing && !justCompleted) {
      handleComplete()
    }
  }, [progressPercent, run?.status, completing, justCompleted])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted animate-pulse mx-auto" />
            <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground mt-4">Loading checklist...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button onClick={() => navigate('/app')}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Confetti active={showConfetti} />

      {/* Minimal header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-10 w-10">
              <Link to={repository ? `/app/repo/${repository.id}` : '/app'}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-base">{repository?.title || 'Checklist Run'}</h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant={isComplete ? 'success' : 'default'}
                  className={cn("text-xs", isComplete && "animate-pulse")}
                >
                  {isComplete ? '✓ Complete' : 'In Progress'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Compact progress */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="font-bold text-primary tabular-nums">{completedItems}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground tabular-nums">{totalItems}</span>
            </div>

            {isComplete ? (
              <Button onClick={handleRestart} variant="outline" size="sm" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Run Again</span>
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={completing || completedItems < totalItems}
                size="sm"
                className="gap-2"
              >
                {completing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Complete</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Animated progress bar */}
      <div className="h-1.5 bg-muted/50">
        <div
          className="h-full bg-gradient-to-r from-primary via-primary to-success transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress ring section */}
        <div className="flex flex-col items-center justify-center mb-10">
          <ProgressRing
            progress={progressPercent}
            completed={completedItems}
            total={totalItems}
            size={140}
          />

          {/* Progress text */}
          <div className="mt-4 text-center">
            {isComplete ? (
              <div className="flex items-center gap-2 text-success">
                <Trophy className="h-5 w-5" />
                <span className="font-semibold">All steps completed!</span>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {completedItems === 0
                  ? "Let's get started!"
                  : `${totalItems - completedItems} step${totalItems - completedItems > 1 ? 's' : ''} remaining`
                }
              </p>
            )}
          </div>
        </div>

        {/* Completion celebration */}
        {isComplete && justCompleted && (
          <Card className="mb-8 border-success/30 bg-gradient-to-br from-success/5 to-success/10 animate-fade-in overflow-hidden">
            <CardContent className="py-10 text-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-success/10 via-transparent to-transparent" />
              <div className="relative">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
                  <Trophy className="h-16 w-16 text-success relative" />
                  <Sparkles className="h-8 w-8 text-warning absolute -top-2 -right-2 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
                  Congratulations! 🎉
                </h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  You've successfully completed all {totalItems} steps. Great work!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleRestart} variant="outline" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Run Again
                  </Button>
                  <Button asChild>
                    <Link to="/app">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Run info */}
        {run && !isComplete && (
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Started {formatRelativeTime(run.started_at)}
            </span>
          </div>
        )}

        {/* Checklist items */}
        <div className="space-y-3">
          {totalItems === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  This checklist has no items.
                </p>
              </CardContent>
            </Card>
          ) : (
            items.map((item, index) => (
              <PremiumRunItem
                key={item.id}
                item={item}
                progress={progress[item.id]}
                depth={0}
                onToggle={handleToggle}
                stepNumber={index + 1}
                totalSteps={totalItems}
                isNext={index === nextIncompleteIndex}
              />
            ))
          )}
        </div>
      </main>
    </div>
  )
}
