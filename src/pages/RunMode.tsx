import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatRelativeTime } from '@/lib/date-utils'
import { FormattedText } from '@/lib/rich-text'
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
  Pause,
  Pencil,
  Check,
  X,
  MessageSquare,
  StickyNote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { getRepository } from '@/services/repository'
import {
  getRunWithDetails,
  updateRunProgress,
  completeRun,
  startRunFromLatestCommit,
  pauseRun,
  resumeRun,
  calculateRunDuration,
  updateRunName,
} from '@/services/run'
import { RunTimer } from '@/components/RunTimer'
import { SyncIndicator } from '@/components/SyncIndicator'
import { useRunSync } from '@/hooks/useRunSync'
import type { Repository, Run, Commit, ChecklistItem, RunProgress } from '@/types/database'

// Generate initial confetti pieces to avoid Math.random() during render
const generateConfettiPieces = () => {
  const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444']
  return [...Array(50)].map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 2,
    animationDuration: 2 + Math.random() * 2,
    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
  }))
}

// Confetti effect component
function Confetti({ active }: { active: boolean }) {
  const [confettiPieces] = useState(() => generateConfettiPieces())

  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            animationDelay: `${piece.animationDelay}s`,
            animationDuration: `${piece.animationDuration}s`,
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: piece.backgroundColor,
              transform: `rotate(${piece.rotation}deg)`,
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

// Header item component for section headers
function SectionHeader({
  item,
  childCount,
  completedChildCount,
}: {
  item: ChecklistItem
  childCount: number
  completedChildCount: number
}) {
  const isAllComplete = childCount > 0 && completedChildCount === childCount

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
      isAllComplete ? 'bg-success/10' : 'bg-muted/30'
    )}>
      <div className={cn(
        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
        isAllComplete ? 'bg-success/20' : 'bg-primary/10'
      )}>
        {isAllComplete ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <Target className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          'font-semibold text-base',
          isAllComplete ? 'text-success' : 'text-foreground'
        )}>
          {item.text ? <FormattedText text={item.text} /> : 'Section'}
        </h3>
        {childCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {completedChildCount} of {childCount} completed
          </p>
        )}
      </div>
      {isAllComplete && (
        <Badge variant="success" className="text-xs">
          Complete
        </Badge>
      )}
    </div>
  )
}

// Completion Note Dialog component
function CompletionNoteDialog({
  isOpen,
  onClose,
  onComplete,
  itemText,
}: {
  isOpen: boolean
  onClose: () => void
  onComplete: (note?: string) => void
  itemText: string
}) {
  const [note, setNote] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setNote('')
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleComplete = () => {
    onComplete(note.trim() || undefined)
    setNote('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleComplete()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Mark as Complete
          </DialogTitle>
          <DialogDescription className="text-left">
            <span className="font-medium text-foreground">{itemText}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="completion-note" className="text-sm font-medium mb-2 flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            Add a note (optional)
          </label>
          <Textarea
            id="completion-note"
            ref={textareaRef}
            value={note}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Any observations, blockers, or details to remember..."
            className="mt-2 min-h-[80px] resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Cmd/Ctrl+Enter</kbd> to complete
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleComplete} className="gap-2">
            <Check className="h-4 w-4" />
            Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Run item with premium styling - now supports sub-items
function PremiumRunItem({
  item,
  progress,
  depth,
  onToggle,
  stepNumber,
  isNext,
  isFocused,
  totalSteps,
  showStepNumber = true,
}: {
  item: ChecklistItem
  progress: { completed: boolean; timestamp?: string; note?: string } | undefined
  depth: number
  onToggle: (itemId: string, completed: boolean, note?: string) => void
  stepNumber: number
  isNext: boolean
  isFocused: boolean
  totalSteps: number
  showStepNumber?: boolean
}) {
  const isCompleted = progress?.completed ?? false
  const [isAnimating, setIsAnimating] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const checkboxRef = useRef<HTMLDivElement>(null)

  const handleClick = () => {
    if (isCompleted) {
      // Uncomplete directly - no note needed
      onToggle(item.id, false)
    } else {
      // Show dialog to add optional note before completing
      setShowNoteDialog(true)
    }
  }

  const handleComplete = (note?: string) => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 500)
    onToggle(item.id, true, note)
    setShowNoteDialog(false)
  }

  // Adjust sizing based on depth
  const isSubItem = depth > 0

  return (
    <>
      <button
        onClick={handleClick}
        data-item-id={item.id}
        className={cn(
          'w-full text-left group flex items-start gap-3 transition-all duration-300',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          isSubItem ? 'p-3 rounded-xl' : 'p-4 rounded-2xl',
          isCompleted && 'bg-success/10 hover:bg-success/15',
          !isCompleted && isNext && 'bg-primary/5 ring-2 ring-primary/20 hover:bg-primary/10',
          !isCompleted && !isNext && 'hover:bg-muted/50',
          isFocused && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        {/* Animated checkbox */}
        <div className="relative pt-0.5 shrink-0">
          <div
            ref={checkboxRef}
            className={cn(
              'relative rounded-full border-2 transition-all duration-300 flex items-center justify-center',
              isSubItem ? 'h-5 w-5' : 'h-7 w-7',
              isCompleted && 'bg-success border-success scale-110',
              !isCompleted && isNext && 'border-primary bg-primary/10',
              !isCompleted && !isNext && 'border-muted-foreground/30 group-hover:border-primary/50',
              isAnimating && 'animate-bounce'
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className={cn('text-white animate-fade-in', isSubItem ? 'h-3 w-3' : 'h-5 w-5')} />
            ) : isNext ? (
              <Play className={cn('text-primary', isSubItem ? 'h-2 w-2' : 'h-3 w-3')} />
            ) : (
              <Circle className={cn('text-muted-foreground/30', isSubItem ? 'h-3 w-3' : 'h-4 w-4')} />
            )}
          </div>

          {/* Pulse effect for next item */}
          {isNext && !isCompleted && (
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Step indicator - only for top-level items */}
          {showStepNumber && !isSubItem && (
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-xs font-medium uppercase tracking-wider",
                isCompleted ? "text-success" : isNext ? "text-primary" : "text-muted-foreground"
              )}>
                Step {stepNumber} of {totalSteps}
              </span>
              {isNext && !isCompleted && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  NEXT
                </Badge>
              )}
            </div>
          )}

          {/* Sub-item indicator */}
          {isSubItem && isNext && !isCompleted && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground hover:bg-primary/90 mb-1">
              NEXT
            </Badge>
          )}

          {/* Item text */}
          <p className={cn(
            'font-medium transition-all',
            isSubItem ? 'text-base' : 'text-lg',
            isCompleted && 'text-success line-through opacity-70',
            isNext && !isCompleted && 'text-foreground',
            !isNext && !isCompleted && 'text-muted-foreground'
          )}>
            {item.text ? <FormattedText text={item.text} /> : 'Untitled item'}
          </p>

          {/* Details */}
          {item.details && (
            <p className={cn('text-muted-foreground mt-1', isSubItem ? 'text-xs' : 'text-sm')}>
              {item.details}
            </p>
          )}

          {/* Completion timestamp and note */}
          {isCompleted && progress?.timestamp && (
            <div className="mt-1.5 space-y-1">
              <p className="text-xs text-success flex items-center gap-1.5 opacity-80">
                <CheckCircle2 className="h-3 w-3" />
                Completed {formatRelativeTime(progress.timestamp)}
              </p>
              {progress.note && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
                  <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                  <span className="italic">{progress.note}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chevron for next item */}
        {isNext && !isCompleted && !isSubItem && (
          <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
        )}
      </button>

      {/* Completion Note Dialog */}
      <CompletionNoteDialog
        isOpen={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        onComplete={handleComplete}
        itemText={item.text || 'Untitled item'}
      />
    </>
  )
}

// Recursive component to render items with their children
function RecursiveRunItems({
  items,
  allItems,
  progress,
  onToggle,
  depth = 0,
  checkableItems,
  nextItemId,
  focusedItemId,
}: {
  items: ChecklistItem[]
  allItems: Record<string, ChecklistItem>
  progress: RunProgress
  onToggle: (itemId: string, completed: boolean, note?: string) => void
  depth?: number
  checkableItems: ChecklistItem[]
  nextItemId: string | null
  focusedItemId: string | null
}) {
  // Get children for a given parent
  const getChildren = (parentId: string): ChecklistItem[] => {
    return Object.values(allItems)
      .filter(item => item.parent === parentId)
      .sort((a, b) => a.order - b.order)
  }

  // Count completed children for a header
  const getCompletedChildCount = (parentId: string): number => {
    const children = getChildren(parentId)
    return children.filter(child => {
      if (child.type === 'header') {
        // For nested headers, recursively count
        return getCompletedChildCount(child.id) === getChildren(child.id).length
      }
      return progress[child.id]?.completed
    }).length
  }

  // Get step number for an item
  const getStepNumber = (itemId: string): number => {
    return checkableItems.findIndex(item => item.id === itemId) + 1
  }

  return (
    <>
      {items.map(item => {
        const children = getChildren(item.id)
        const isHeader = item.type === 'header'
        const isNext = item.id === nextItemId

        if (isHeader && children.length > 0) {
          // Render as section header with children
          return (
            <div key={item.id} className={cn('space-y-2', depth > 0 && 'ml-6')}>
              <SectionHeader
                item={item}
                childCount={children.filter(c => c.type !== 'header').length}
                completedChildCount={getCompletedChildCount(item.id)}
              />
              <div className="ml-4 space-y-2 border-l-2 border-muted/50 pl-4">
                <RecursiveRunItems
                  items={children}
                  allItems={allItems}
                  progress={progress}
                  onToggle={onToggle}
                  depth={depth + 1}
                  checkableItems={checkableItems}
                  nextItemId={nextItemId}
                  focusedItemId={focusedItemId}
                />
              </div>
            </div>
          )
        }

        // Render as checkable item
        return (
          <div key={item.id} className={cn(depth > 0 && 'ml-2')}>
            <PremiumRunItem
              item={item}
              progress={progress[item.id]}
              depth={depth}
              onToggle={onToggle}
              stepNumber={getStepNumber(item.id)}
              totalSteps={checkableItems.length}
              isNext={isNext}
              isFocused={item.id === focusedItemId}
              showStepNumber={depth === 0}
            />
            {/* Render children if this item has any */}
            {children.length > 0 && (
              <div className="ml-6 mt-2 space-y-2 border-l-2 border-muted/30 pl-3">
                <RecursiveRunItems
                  items={children}
                  allItems={allItems}
                  progress={progress}
                  onToggle={onToggle}
                  depth={depth + 1}
                  checkableItems={checkableItems}
                  nextItemId={nextItemId}
                  focusedItemId={focusedItemId}
                />
              </div>
            )}
          </div>
        )
      })}
    </>
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
  const [durationMs, setDurationMs] = useState(0)
  const [isPauseLoading, setIsPauseLoading] = useState(false)
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null)

  // Renaming state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')

  // Real-time sync
  const {
    isConnected: syncConnected,
    otherDevices,
    syncError,
    lastSyncedAt,
  } = useRunSync({
    runId: run?.id || '',
    userId: user?.id || '',
    enabled: !!run && !!user && run.status !== 'completed',
    onProgressUpdate: (newProgress) => {
      // Update progress from other devices
      setProgress(newProgress)
    },
    onStatusChange: (newStatus) => {
      // Update status from other devices
      setRun((prev) => prev ? { ...prev, status: newStatus } : null)
    },
  })

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

          // Load duration from time segments
          const duration = await calculateRunDuration(runId)
          setDurationMs(duration)

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
            setDurationMs(0) // New run starts at 0
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

  // Handle pause
  const handlePause = useCallback(async () => {
    if (!run || isPauseLoading) return

    setIsPauseLoading(true)
    try {
      const updatedRun = await pauseRun(run.id)
      setRun(updatedRun)
      // Update duration when pausing
      const duration = await calculateRunDuration(run.id)
      setDurationMs(duration)
    } catch (err) {
      console.error('Error pausing run:', err)
      setError('Failed to pause run')
    } finally {
      setIsPauseLoading(false)
    }
  }, [run, isPauseLoading])

  // Handle resume
  const handleResume = useCallback(async () => {
    if (!run || isPauseLoading) return

    setIsPauseLoading(true)
    try {
      const updatedRun = await resumeRun(run.id)
      setRun(updatedRun)
    } catch (err) {
      console.error('Error resuming run:', err)
      setError('Failed to resume run')
    } finally {
      setIsPauseLoading(false)
    }
  }, [run, isPauseLoading])

  // Handle renaming
  const handleStartRenaming = useCallback(() => {
    setEditName(run?.name || repository?.title || '')
    setIsEditingName(true)
  }, [run, repository])

  const handleSaveName = useCallback(async () => {
    if (!run || !editName.trim()) return
    try {
      const updatedRun = await updateRunName(run.id, editName.trim())
      setRun(updatedRun)
      setIsEditingName(false)
    } catch (err) {
      console.error('Error updating name:', err)
      setError('Failed to update name')
    }
  }, [run, editName])

  const handleCancelRenaming = useCallback(() => {
    setIsEditingName(false)
  }, [])

  // Toggle item completion
  const handleToggle = useCallback(async (itemId: string, completed: boolean, note?: string) => {
    if (!run || !user) return

    // Optimistic update
    setProgress((prev) => ({
      ...prev,
      [itemId]: {
        completed,
        timestamp: new Date().toISOString(),
        user_id: user.id,
        ...(note && { note }),
      },
    }))

    try {
      await updateRunProgress(run.id, itemId, completed, user.id, note)
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
  const handleComplete = useCallback(async () => {
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
  }, [run])

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



  // Get all checkable items (tasks and notes, not headers with children)
  const checkableItems = useMemo(() => {
    if (!commit?.content?.items) return []
    const allItems = commit.content.items
    const checkable: ChecklistItem[] = []

    // Helper to get children locally to avoid closure staleness issues
    const getChildrenLocal = (parentId: string): ChecklistItem[] => {
      return Object.values(allItems)
        .filter(item => item.parent === parentId)
        .sort((a, b) => a.order - b.order)
    }

    // Recursive function to collect checkable items in order
    const collectCheckable = (items: ChecklistItem[]) => {
      for (const item of items) {
        const children = getChildrenLocal(item.id)
        const isHeader = item.type === 'header'

        // A header with children is not checkable itself, but its children might be
        if (isHeader && children.length > 0) {
          collectCheckable(children)
        } else {
          // This is a checkable item (task, note, or empty header)
          checkable.push(item)
          // Also collect any children of this checkable item
          if (children.length > 0) {
            collectCheckable(children)
          }
        }
      }
    }

    // Start from root items
    const rootItems = Object.values(allItems)
      .filter(item => !item.parent)
      .sort((a, b) => a.order - b.order)

    collectCheckable(rootItems)
    return checkable
  }, [commit])

  // Find the next incomplete item (can be at any depth)
  const nextItemId = useMemo(() => {
    const nextItem = checkableItems.find(item => !progress[item.id]?.completed)
    return nextItem?.id || null
  }, [checkableItems, progress])

  const rootItems = getRootItems()
  const totalItems = checkableItems.length
  const completedItems = checkableItems.filter(item => progress[item.id]?.completed).length
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  const isComplete = run?.status === 'completed' || progressPercent === 100

  // Auto-complete when all items done
  useEffect(() => {
    if (progressPercent === 100 && run?.status !== 'completed' && !completing && !justCompleted) {
      handleComplete()
    }
  }, [progressPercent, run?.status, completing, justCompleted, handleComplete])

  // J/K keyboard navigation
  useEffect(() => {
    if (loading || isComplete || totalItems === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault()
        setFocusedItemIndex((prev) => {
          if (prev === null) return 0
          // Move to next item, loop to beginning if at end
          return (prev + 1) % totalItems
        })
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        setFocusedItemIndex((prev) => {
          if (prev === null) return totalItems - 1
          // Move to previous item, loop to end if at beginning
          return prev === 0 ? totalItems - 1 : prev - 1
        })
      } else if ((e.key === 'Enter' || e.key === ' ') && focusedItemIndex !== null) {
        // Toggle the focused item on Enter or Space
        e.preventDefault()
        const item = checkableItems[focusedItemIndex]
        if (item) {
          const isCompleted = progress[item.id]?.completed ?? false
          handleToggle(item.id, !isCompleted)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loading, isComplete, totalItems, focusedItemIndex, checkableItems, progress, handleToggle])

  // Scroll focused item into view
  useEffect(() => {
    if (focusedItemIndex !== null && checkableItems[focusedItemIndex]) {
      const itemId = checkableItems[focusedItemIndex].id

      // Use requestAnimationFrame to ensure the scroll happens after render/paint
      requestAnimationFrame(() => {
        const element = document.querySelector(`[data-item-id="${itemId}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    }
  }, [focusedItemIndex, checkableItems])

  // Get the focused item ID for passing to components
  const focusedItemId = focusedItemIndex !== null ? checkableItems[focusedItemIndex]?.id : null

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
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 w-[200px] sm:w-[300px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') handleCancelRenaming()
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:text-success hover:bg-success/10" onClick={handleSaveName}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleCancelRenaming}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1
                    className="font-semibold text-base truncate max-w-[200px] sm:max-w-none cursor-pointer hover:text-primary transition-colors border-b border-transparent hover:border-primary/30"
                    onClick={handleStartRenaming}
                    title="Click to rename"
                  >
                    {run?.name || repository?.title || 'Checklist Run'}
                  </h1>
                  <button
                    onClick={handleStartRenaming}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                    aria-label="Rename run"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge
                  variant={isComplete ? 'success' : run?.status === 'paused' ? 'warning' : 'default'}
                  className={cn("text-xs", isComplete && "animate-pulse")}
                >
                  {isComplete ? '✓ Complete' : run?.status === 'paused' ? '⏸ Paused' : 'In Progress'}
                </Badge>
                {/* Sync indicator */}
                {!isComplete && (
                  <SyncIndicator
                    isConnected={syncConnected}
                    otherDevices={otherDevices}
                    lastSyncedAt={lastSyncedAt}
                    syncError={syncError}
                    compact
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            {run && !isComplete && (
              <RunTimer
                run={run}
                initialDurationMs={durationMs}
                onPause={handlePause}
                onResume={handleResume}
                compact
                showControls={false}
              />
            )}

            {/* Compact progress */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="font-bold text-primary tabular-nums">{completedItems}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground tabular-nums">{totalItems}</span>
            </div>

            {/* Pause/Resume button */}
            {run && !isComplete && (
              run.status === 'paused' ? (
                <Button
                  onClick={handleResume}
                  disabled={isPauseLoading}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  {isPauseLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Resume</span>
                </Button>
              ) : (
                <Button
                  onClick={handlePause}
                  disabled={isPauseLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {isPauseLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Pause</span>
                </Button>
              )
            )}

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
              <>
                <p className="text-muted-foreground">
                  {completedItems === 0
                    ? "Let's get started!"
                    : `${totalItems - completedItems} step${totalItems - completedItems > 1 ? 's' : ''} remaining`
                  }
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">J</kbd> / <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">K</kbd> to navigate, <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to toggle
                </p>
              </>
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
            <RecursiveRunItems
              items={rootItems}
              allItems={commit?.content?.items || {}}
              progress={progress}
              onToggle={handleToggle}
              depth={0}
              checkableItems={checkableItems}
              nextItemId={nextItemId}
              focusedItemId={focusedItemId}
            />
          )}
        </div>
      </main>
    </div>
  )
}
