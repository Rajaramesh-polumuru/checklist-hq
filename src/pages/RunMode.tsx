import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/ui/icon'
import { Textarea } from '@/components/ui/textarea'
import { formatRelativeTime } from '@/lib/date-utils'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import ArrowTurnBackwardIcon from '@hugeicons/core-free-icons/ArrowTurnBackwardIcon'
import ChampionIcon from '@hugeicons/core-free-icons/ChampionIcon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import SparklesIcon from '@hugeicons/core-free-icons/SparklesIcon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import Target01Icon from '@hugeicons/core-free-icons/Target01Icon'
import PauseIcon from '@hugeicons/core-free-icons/PauseIcon'
import PencilEdit02Icon from '@hugeicons/core-free-icons/PencilEdit02Icon'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import AiCloud02Icon from '@hugeicons/core-free-icons/AiCloud02Icon'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useAgentSettingsStore } from '@/stores/agent-settings-store'
import { getRepository } from '@/services/repository'
import { RunItem, SectionHeader } from '@/components/RunItem'
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
import { spawnSubRun, getSubRunForItem } from '@/services/composed-run'
import { RunTimer } from '@/components/RunTimer'
import { SyncIndicator } from '@/components/SyncIndicator'
import { useRunSync } from '@/hooks/useRunSync'
import { AgentExportButton } from '@/components/run/AgentExportButton'
import { AgentStatusIndicator } from '@/components/run/AgentStatusIndicator'
import { RunTimeline } from '@/components/run/RunTimeline'
import { AgentSettingsModal } from '@/components/AgentSettingsModal'
import { useRunOrchestrator } from '@/hooks/useRunOrchestrator'
import { RunModeHeader } from '@/components/run-mode/RunModeHeader'
import { RunCompletionBanner } from '@/components/run-mode/RunCompletionBanner'
import { SimpleRunList } from '@/components/run-mode/SimpleRunList'
import type { Repository, Run, Commit, ChecklistItem, RunProgress } from '@/types/database'

// ============================================
// View Mode Persistence
// ============================================

type ViewMode = 'simple' | 'detailed'

function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem('checklist-run-view-mode')
    if (stored === 'simple' || stored === 'detailed') return stored
  } catch {
    // ignore
  }
  return 'simple'
}

function setStoredViewMode(mode: ViewMode) {
  try {
    localStorage.setItem('checklist-run-view-mode', mode)
  } catch {
    // ignore
  }
}

// ============================================
// Confetti (shared by both modes)
// ============================================

const generateConfettiPieces = (count = 25) => {
  const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444']
  return [...Array(count)].map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 2,
    animationDuration: 2 + Math.random() * 2,
    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
  }))
}

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

// ============================================
// Progress Ring (Detailed mode only)
// ============================================

function ProgressRing({
  progress,
  completed,
  total,
  size = 120,
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
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{completed}</span>
        <span className="text-sm text-muted-foreground">of {total}</span>
      </div>
    </div>
  )
}

// ============================================
// Recursive Run Items (Detailed mode only)
// ============================================

function RecursiveRunItems({
  items,
  allItems,
  progress,
  onToggle,
  depth = 0,
  checkableItems,
  nextItemId,
  focusedItemId,
  context,
}: {
  items: ChecklistItem[]
  allItems: Record<string, ChecklistItem>
  progress: RunProgress
  onToggle: (itemId: string, completed: boolean, note?: string) => void
  depth?: number
  checkableItems: ChecklistItem[]
  nextItemId: string | null
  focusedItemId: string | null
  context?: Record<string, unknown>
}) {
  const getChildren = (parentId: string): ChecklistItem[] => {
    return Object.values(allItems)
      .filter((item) => item.parent === parentId)
      .sort((a, b) => a.order - b.order)
  }

  const getCompletedChildCount = (parentId: string): number => {
    const children = getChildren(parentId)
    return children.filter((child) => {
      if (child.type === 'header') {
        return getCompletedChildCount(child.id) === getChildren(child.id).length
      }
      return progress[child.id]?.completed
    }).length
  }

  const getStepNumber = (itemId: string): number => {
    return checkableItems.findIndex((item) => item.id === itemId) + 1
  }

  return (
    <>
      {items.map((item) => {
        const children = getChildren(item.id)
        const isHeader = item.type === 'header'
        const isNext = item.id === nextItemId

        if (isHeader && children.length > 0) {
          return (
            <div key={item.id} className={cn('space-y-2', depth > 0 && 'ml-6')}>
              <SectionHeader
                item={item}
                childCount={children.filter((c) => c.type !== 'header').length}
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
                  context={context}
                />
              </div>
            </div>
          )
        }

        return (
          <div key={item.id} className={cn(depth > 0 && 'ml-2')}>
            <RunItem
              item={item}
              progress={progress[item.id]}
              depth={depth}
              onToggle={onToggle}
              stepNumber={getStepNumber(item.id)}
              totalSteps={checkableItems.length}
              isNext={isNext}
              isFocused={item.id === focusedItemId}
              showStepNumber={depth === 0}
              context={context}
            />
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
                  context={context}
                />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

// ============================================
// Note Popover (Simple mode)
// ============================================

function NotePopover({
  itemId,
  anchorEl,
  onSubmit,
  onClose,
}: {
  itemId: string | null
  anchorEl: HTMLElement | null
  onSubmit: (itemId: string, note: string) => void
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (itemId) {
      // Reset note and focus on next tick to avoid synchronous setState warning
      const timer = setTimeout(() => {
        setNote('')
        textareaRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [itemId])

  const handleSubmit = () => {
    if (itemId && note.trim()) {
      onSubmit(itemId, note.trim())
    }
    onClose()
  }

  if (!itemId || !anchorEl) return null

  const rect = anchorEl.getBoundingClientRect()

  return (
    <div
      className="fixed z-50"
      style={{ top: rect.bottom + 4, left: rect.left, width: Math.min(rect.width, 400) }}
    >
      <div className="bg-popover border rounded-md shadow-md p-3 animate-in fade-in zoom-in-95 duration-200">
        <Textarea
          ref={textareaRef}
          value={note}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
          placeholder="Add a note..."
          className="min-h-[60px] resize-none text-sm"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit()
            }
            if (e.key === 'Escape') {
              onClose()
            }
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted-foreground">
            <kbd className="px-1 py-0.5 bg-muted rounded font-mono">Cmd+Enter</kbd> to save
          </p>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} className="h-7 text-xs">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main RunMode Component
// ============================================

export function RunMode() {
  const { runId, repoId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const agentSettings = useAgentSettingsStore()

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode)

  const switchViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === 'simple' ? 'detailed' : 'simple'
      setStoredViewMode(next)
      return next
    })
  }, [])

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

  // Renaming state (detailed mode)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')

  // Agent settings modal
  const [showAgentSettings, setShowAgentSettings] = useState(false)

  // Note popover state (simple mode)
  const [notePopoverItemId, setNotePopoverItemId] = useState<string | null>(null)
  const [notePopoverAnchor, setNotePopoverAnchor] = useState<HTMLElement | null>(null)

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
      setProgress(newProgress)
    },
    onStatusChange: (newStatus) => {
      setRun((prev) => (prev ? { ...prev, status: newStatus } : null))
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
            setDurationMs(0)
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
  const handleToggle = useCallback(
    async (itemId: string, completed: boolean, note?: string) => {
      if (!run || !user) return

      // Handle Ref Items (Sub-Runs)
      const item = commit?.content?.items[itemId]
      if (item?.type === 'ref' && item.ref_config) {
        if (item.ref_config.execution_mode === 'spawn') {
          try {
            const link = await getSubRunForItem(run.id, itemId)
            if (link) {
              navigate(`/app/run/${link.child_run_id}`)
              return
            }

            const subRun = await spawnSubRun(
              run.id,
              itemId,
              item.ref_config.repo_id,
              user.id,
              item.ref_config.commit_id,
            )
            navigate(`/app/run/${subRun.id}`)
            return
          } catch (err) {
            console.error('Error handling sub-run:', err)
            setError('Failed to open sub-checklist')
            return
          }
        }
      }

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
    },
    [run, user, commit, navigate],
  )

  // Simple mode: handle adding a note to an item
  const handleRequestNote = useCallback((itemId: string) => {
    const el = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement | null
    setNotePopoverItemId(itemId)
    setNotePopoverAnchor(el)
  }, [])

  const handleSubmitNote = useCallback(
    async (itemId: string, note: string) => {
      if (!run || !user) return
      // Update progress with the note
      const currentProgress = progress[itemId]
      setProgress((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          completed: currentProgress?.completed ?? false,
          timestamp: currentProgress?.timestamp || new Date().toISOString(),
          user_id: user.id,
          note,
        },
      }))

      try {
        await updateRunProgress(
          run.id,
          itemId,
          currentProgress?.completed ?? false,
          user.id,
          note,
        )
      } catch (err) {
        console.error('Error updating note:', err)
      }
    },
    [run, user, progress],
  )

  // Complete the run
  const handleComplete = useCallback(async () => {
    if (!run) return

    setCompleting(true)
    try {
      await completeRun(run.id)
      setRun((prev) => (prev ? { ...prev, status: 'completed' } : null))
      setJustCompleted(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
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

  // Get sorted items
  const getSortedItems = (): ChecklistItem[] => {
    if (!commit?.content?.items) return []
    return Object.values(commit.content.items).sort((a, b) => a.order - b.order)
  }

  const getRootItems = (): ChecklistItem[] => {
    return getSortedItems().filter((item) => !item.parent)
  }

  // Get all checkable items
  const checkableItems = useMemo(() => {
    if (!commit?.content?.items) return []
    const allItems = commit.content.items
    const checkable: ChecklistItem[] = []

    const getChildrenLocal = (parentId: string): ChecklistItem[] => {
      return Object.values(allItems)
        .filter((item) => item.parent === parentId)
        .sort((a, b) => a.order - b.order)
    }

    const collectCheckable = (items: ChecklistItem[]) => {
      for (const item of items) {
        const children = getChildrenLocal(item.id)
        const isHeader = item.type === 'header'

        if (isHeader && children.length > 0) {
          collectCheckable(children)
        } else {
          checkable.push(item)
          if (children.length > 0) {
            collectCheckable(children)
          }
        }
      }
    }

    const rootItems = Object.values(allItems)
      .filter((item) => !item.parent)
      .sort((a, b) => a.order - b.order)

    collectCheckable(rootItems)
    return checkable
  }, [commit])

  // Find the next incomplete item
  const nextItemId = useMemo(() => {
    const nextItem = checkableItems.find((item) => !progress[item.id]?.completed)
    return nextItem?.id || null
  }, [checkableItems, progress])

  // Get the current item for agent execution
  const currentItem = useMemo(() => {
    if (!nextItemId || !commit?.content?.items) return null
    return commit.content.items[nextItemId] || null
  }, [nextItemId, commit])

  const rootItems = getRootItems()
  const totalItems = checkableItems.length
  const completedItems = checkableItems.filter((item) => progress[item.id]?.completed).length
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  const isComplete = run?.status === 'completed' || progressPercent === 100
  const runContext = (run?.metadata?.context as Record<string, unknown>) || {}

  // Agent orchestrator
  const orchestrator = useRunOrchestrator({
    enabled: !isComplete && run?.status === 'active',
    currentItem,
    progress,
    onComplete: (itemId) => {
      handleToggle(itemId, true, `Completed by AI`)
    },
    onError: (itemId, error) => {
      console.error(`Agent failed for item ${itemId}:`, error)
    },
  })

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
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault()
        setFocusedItemIndex((prev) => {
          if (prev === null) return 0
          return (prev + 1) % totalItems
        })
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        setFocusedItemIndex((prev) => {
          if (prev === null) return totalItems - 1
          return prev === 0 ? totalItems - 1 : prev - 1
        })
      } else if ((e.key === 'Enter' || e.key === ' ') && focusedItemIndex !== null) {
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
      requestAnimationFrame(() => {
        const element = document.querySelector(`[data-item-id="${itemId}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    }
  }, [focusedItemIndex, checkableItems])

  const focusedItemId = focusedItemIndex !== null ? checkableItems[focusedItemIndex]?.id : null

  // ============================================
  // Loading state
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted animate-pulse mx-auto" />
            <Icon
              icon={Loading02Icon}
              className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>
          <p className="text-muted-foreground mt-4">Loading checklist...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // Error state
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Icon icon={Target01Icon} className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button onClick={() => navigate('/app')}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  // ============================================
  // Simple Mode Render
  // ============================================
  if (viewMode === 'simple') {
    return (
      <div className="min-h-screen bg-background">
        <Confetti active={showConfetti} />

        <RunModeHeader
          repository={repository}
          run={run}
          completedItems={completedItems}
          totalItems={totalItems}
          progressPercent={progressPercent}
          isComplete={isComplete}
          completing={completing}
          isPauseLoading={isPauseLoading}
          onPause={handlePause}
          onResume={handleResume}
          onComplete={handleComplete}
          onRestart={handleRestart}
          onSwitchView={switchViewMode}
          syncConnected={syncConnected}
          otherDevices={otherDevices}
          lastSyncedAt={lastSyncedAt}
          syncError={syncError}
        />

        <main className="mx-auto max-w-2xl px-4 py-6 md:py-8">
          {/* Keyboard hint */}
          {!isComplete && completedItems === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center mb-6">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">J</kbd> /{' '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">K</kbd> to
              navigate,{' '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to
              toggle
            </p>
          )}

          {/* Completion */}
          {isComplete && justCompleted && (
            <RunCompletionBanner totalItems={totalItems} onRestart={handleRestart} />
          )}

          {/* Items */}
          {totalItems === 0 ? (
            <div className="py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Icon icon={Target01Icon} className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">This checklist has no items.</p>
            </div>
          ) : (
            <SimpleRunList
              items={rootItems}
              allItems={commit?.content?.items || {}}
              progress={progress}
              onToggle={handleToggle}
              onRequestNote={handleRequestNote}
              depth={0}
              checkableItems={checkableItems}
              nextItemId={nextItemId}
              focusedItemId={focusedItemId}
              context={runContext}
            />
          )}

          {/* Collapsible timeline */}
          {run && (
            <details className="mt-10 border-t pt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                Activity Timeline
              </summary>
              <div className="mt-4">
                <RunTimeline run={run} items={commit?.content?.items || {}} />
              </div>
            </details>
          )}
        </main>

        {/* Agent status floating */}
        {currentItem?.agent_config?.enabled && !isComplete && (
          <div className="fixed bottom-4 right-4 z-20">
            <AgentStatusIndicator
              status={orchestrator.status}
              onExecute={orchestrator.executeManual}
              onRetry={orchestrator.executeManual}
              onApprove={orchestrator.approveResult}
            />
          </div>
        )}

        {/* Note popover */}
        <NotePopover
          itemId={notePopoverItemId}
          anchorEl={notePopoverAnchor}
          onSubmit={handleSubmitNote}
          onClose={() => {
            setNotePopoverItemId(null)
            setNotePopoverAnchor(null)
          }}
        />

        {/* Agent Settings Modal */}
        <AgentSettingsModal
          open={showAgentSettings}
          onClose={() => setShowAgentSettings(false)}
        />
      </div>
    )
  }

  // ============================================
  // Detailed Mode Render (original)
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Confetti active={showConfetti} />

      {/* Minimal header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-10 w-10">
              <Link to={repository ? `/app/repo/${repository.id}` : '/app'}>
                <Icon icon={ArrowLeft01Icon} className="h-5 w-5" />
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                    onClick={handleSaveName}
                  >
                    <Icon icon={Tick01Icon} className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleCancelRenaming}
                  >
                    <Icon icon={Cancel01Icon} className="h-4 w-4" />
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
                    <Icon icon={PencilEdit02Icon} className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge
                  variant={isComplete ? 'success' : run?.status === 'paused' ? 'warning' : 'default'}
                  className={cn('text-xs gap-1.5', isComplete && 'animate-pulse')}
                >
                  {isComplete ? (
                    <>
                      <Icon icon={CheckmarkCircle01Icon} className="h-3.5 w-3.5" />
                      Complete
                    </>
                  ) : run?.status === 'paused' ? (
                    <>
                      <Icon icon={PauseIcon} className="h-3.5 w-3.5" />
                      Paused
                    </>
                  ) : (
                    <>
                      <Icon icon={PlayIcon} className="h-3.5 w-3.5" />
                      In Progress
                    </>
                  )}
                </Badge>
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

            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="font-bold text-primary tabular-nums">{completedItems}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground tabular-nums">{totalItems}</span>
            </div>

            {run && !isComplete && (
              <div className="flex items-center gap-2 mr-2 border-r pr-4 h-6">
                <Switch
                  id="auto-pilot"
                  checked={agentSettings.autoPilotEnabled}
                  onCheckedChange={agentSettings.setAutoPilotEnabled}
                  className="scale-75 data-[state=checked]:bg-purple-600"
                />
                <Label
                  htmlFor="auto-pilot"
                  className={cn(
                    'text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors',
                    agentSettings.autoPilotEnabled ? 'text-purple-600' : 'text-muted-foreground',
                  )}
                >
                  <Icon icon={AiCloud02Icon} className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Auto-Pilot</span>
                </Label>
              </div>
            )}

            {run && !isComplete &&
              (run.status === 'paused' ? (
                <Button
                  onClick={handleResume}
                  disabled={isPauseLoading}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  {isPauseLoading ? (
                    <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon icon={PlayIcon} className="h-4 w-4" />
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
                    <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon icon={PauseIcon} className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Pause</span>
                </Button>
              ))}

            {repository && commit && (
              <AgentExportButton
                repository={repository}
                commit={commit}
                run={run || undefined}
              />
            )}

            {/* Switch to simple view */}
            <Button onClick={switchViewMode} variant="ghost" size="sm" className="text-xs">
              Simple View
            </Button>

            {isComplete ? (
              <Button onClick={handleRestart} variant="outline" size="sm" className="gap-2">
                <Icon icon={ArrowTurnBackwardIcon} className="h-4 w-4" />
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
                  <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon icon={CheckmarkCircle01Icon} className="h-4 w-4" />
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
          <ProgressRing progress={progressPercent} completed={completedItems} total={totalItems} size={140} />

          <div className="mt-4 text-center">
            {isComplete ? (
              <div className="flex items-center gap-2 text-success">
                <Icon icon={ChampionIcon} className="h-5 w-5" />
                <span className="font-semibold">All steps completed!</span>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">
                  {completedItems === 0
                    ? "Let's get started!"
                    : `${totalItems - completedItems} step${totalItems - completedItems > 1 ? 's' : ''} remaining`}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">J</kbd> /{' '}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">K</kbd> to
                  navigate,{' '}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>{' '}
                  to toggle
                </p>
              </>
            )}
          </div>

          {currentItem?.agent_config?.enabled && !isComplete && (
            <div className="mt-4">
              <AgentStatusIndicator
                status={orchestrator.status}
                onExecute={orchestrator.executeManual}
                onRetry={orchestrator.executeManual}
                onApprove={orchestrator.approveResult}
              />
            </div>
          )}
        </div>

        {/* Completion celebration */}
        {isComplete && justCompleted && (
          <Card className="mb-8 border-success/30 bg-gradient-to-br from-success/5 to-success/10 animate-fade-in overflow-hidden">
            <CardContent className="py-10 text-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-success/10 via-transparent to-transparent" />
              <div className="relative">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
                  <Icon icon={ChampionIcon} className="h-16 w-16 text-success relative" />
                  <Icon
                    icon={SparklesIcon}
                    className="h-8 w-8 text-warning absolute -top-2 -right-2 animate-bounce"
                  />
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
                  Congratulations!
                </h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  You've successfully completed all {totalItems} steps. Great work!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleRestart} variant="outline" className="gap-2">
                    <Icon icon={ArrowTurnBackwardIcon} className="h-4 w-4" />
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
              <Icon icon={Clock01Icon} className="h-4 w-4" />
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
                  <Icon icon={Target01Icon} className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">This checklist has no items.</p>
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
              context={runContext}
            />
          )}
        </div>

        {/* Timeline */}
        {run && (
          <div className="mt-12 border-t pt-8">
            <RunTimeline run={run} items={commit?.content?.items || {}} />
          </div>
        )}
      </main>

      {/* Agent Settings Modal */}
      <AgentSettingsModal open={showAgentSettings} onClose={() => setShowAgentSettings(false)} />
    </div>
  )
}
