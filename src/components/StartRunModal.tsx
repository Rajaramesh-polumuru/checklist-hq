import { useState, useEffect, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  PlayIcon,
  Loading02Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  CheckListIcon,
  Clock01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { useAuthStore } from '@/stores/auth-store'
import { startNamedRun } from '@/services/run'
import { getLatestCommit } from '@/services/repository'
import type { Repository, Commit, ChecklistItem } from '@/types/database'

interface StartRunModalProps {
  repository: Repository | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (runId: string) => void
}

type RunState = 'idle' | 'loading-preview' | 'ready' | 'starting' | 'success' | 'error'

// Generate a default run name based on date
function generateDefaultName(repoTitle: string): string {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${repoTitle} - ${dateStr}`
}

export function StartRunModal({ repository, isOpen, onClose, onSuccess }: StartRunModalProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // State
  const [runState, setRunState] = useState<RunState>('idle')
  const [name, setName] = useState('')
  const [commit, setCommit] = useState<Commit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newRunId, setNewRunId] = useState<string | null>(null)

  // Calculate item count
  const itemCount = commit?.content?.items ? Object.keys(commit.content.items).length : 0
  const checkableCount = commit?.content?.items
    ? Object.values(commit.content.items).filter(
      (item: ChecklistItem) => item.type !== 'header' || !hasChildren(item.id, commit.content.items)
    ).length
    : 0

  // Check if an item has children
  function hasChildren(itemId: string, items: Record<string, ChecklistItem>): boolean {
    return Object.values(items).some((item) => item.parent === itemId)
  }

  // Load commit for preview
  const loadCommit = useCallback(async () => {
    if (!repository) return

    try {
      const latestCommit = await getLatestCommit(repository.id)

      if (!latestCommit || !latestCommit.content?.items || Object.keys(latestCommit.content.items).length === 0) {
        setError('This checklist has no items to run. Please add some items first.')
        setRunState('error')
        return
      }

      setCommit(latestCommit)
      setRunState('ready')
    } catch (err) {
      console.error('Error loading commit:', err)
      setError('Failed to load checklist')
      setRunState('error')
    }
  }, [repository])

  // Reset state when modal opens/closes or repository changes
  useEffect(() => {
    if (isOpen && repository) {
      // Defer state updates
      const timer = setTimeout(() => {
        setRunState('loading-preview')
        setName(generateDefaultName(repository.title))
        setError(null)
        setNewRunId(null)
        loadCommit()
      }, 0)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setRunState('idle')
        setCommit(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, repository, loadCommit])

  // Handle start run
  const handleStartRun = async () => {
    if (!user) {
      onClose()
      navigate('/', { state: { returnTo: window.location.pathname } })
      return
    }

    if (!repository) return

    setRunState('starting')
    setError(null)

    try {
      const run = await startNamedRun(
        repository.id,
        name.trim() || generateDefaultName(repository.title),
        user.id
      )

      setNewRunId(run.id)
      setRunState('success')

      // Call success callback
      onSuccess?.(run.id)
    } catch (err) {
      console.error('Error starting run:', err)
      setError(err instanceof Error ? err.message : 'Failed to start run')
      setRunState('error')
    }
  }

  // Navigate to the run
  const handleGoToRun = () => {
    if (newRunId) {
      onClose()
      navigate(`/app/run/${newRunId}`)
    }
  }

  // Get top-level items for preview
  const getPreviewItems = (): ChecklistItem[] => {
    if (!commit?.content?.items) return []
    return Object.values(commit.content.items)
      .filter((item: ChecklistItem) => item.parent === null)
      .sort((a: ChecklistItem, b: ChecklistItem) => a.order - b.order)
      .slice(0, 4)
  }

  if (!repository) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon icon={PlayIcon} className="h-4 w-4 text-primary" />
            </div>
            {runState === 'success' ? 'Run Started!' : 'Start a New Run'}
          </DialogTitle>
          <DialogDescription>
            {runState === 'success'
              ? 'Your run has been created and is ready to go.'
              : 'Give your run a name to easily find it later.'}
          </DialogDescription>
        </DialogHeader>

        {/* Loading Preview State */}
        {runState === 'loading-preview' && (
          <div className="py-8 text-center">
            <Icon icon={Loading02Icon} className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Loading checklist...</p>
          </div>
        )}

        {/* Ready State - Show Form */}
        {runState === 'ready' && (
          <div className="space-y-4">
            {/* Checklist Info */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon icon={CheckListIcon} className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{repository.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {checkableCount} steps
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Preview Items */}
              {getPreviewItems().length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Steps to complete:</p>
                  <ul className="space-y-1">
                    {getPreviewItems().map((item, index) => (
                      <li key={item.id} className="text-xs flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className={item.type === 'header' ? 'font-medium' : ''}>
                          {item.text || 'Untitled item'}
                        </span>
                      </li>
                    ))}
                    {itemCount > 4 && (
                      <li className="text-xs text-muted-foreground pl-6">
                        + {itemCount - 4} more steps...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Run Name Input */}
            <div className="space-y-3">
              <div>
                <label htmlFor="run-name" className="text-sm font-medium mb-1.5 block">
                  Run Name
                </label>
                <Input
                  id="run-name"
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="e.g., Q1 Review - John Smith"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A descriptive name helps you identify this run later
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon icon={Clock01Icon} className="h-3.5 w-3.5 text-primary" />
                <span>
                  Time will be tracked automatically. You can pause and resume anytime.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Starting State */}
        {runState === 'starting' && (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Icon icon={PlayIcon} className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="font-medium mb-1">Starting your run...</p>
              <p className="text-sm text-muted-foreground">
                Preparing {checkableCount} steps
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {runState === 'success' && (
          <div className="py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Icon icon={CheckmarkCircle02Icon} className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="font-medium text-lg mb-1">Let's Go!</p>
            <p className="text-sm text-muted-foreground mb-4">
              "{name}" is ready with {checkableCount} steps to complete
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
              <Icon icon={SparklesIcon} className="h-4 w-4 text-primary" />
              <span>Timer starts when you begin</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {runState === 'error' && (
          <div className="py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Icon icon={AlertCircleIcon} className="h-6 w-6 text-red-600" />
            </div>
            <p className="font-medium text-lg mb-1">Unable to Start Run</p>
            <p className="text-sm text-red-600 mb-4">
              {error || 'An unexpected error occurred'}
            </p>
            <Button variant="outline" size="sm" onClick={loadCommit}>
              Try Again
            </Button>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="gap-2 sm:gap-0">
          {runState === 'ready' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleStartRun} disabled={!name.trim()}>
                <Icon icon={PlayIcon} className="mr-2 h-4 w-4" />
                Start Run
              </Button>
            </>
          )}
          {runState === 'success' && (
            <Button onClick={handleGoToRun} className="w-full sm:w-auto">
              <Icon icon={PlayIcon} className="mr-2 h-4 w-4" />
              Begin Checklist
            </Button>
          )}
          {runState === 'error' && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
