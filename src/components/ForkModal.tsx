import { useState, useEffect, useCallback, startTransition } from 'react'
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
import { Progress } from '@/components/ui/progress'
import {
  GitFork,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ListChecks,
  Copy,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { forkRepository, getLatestCommit } from '@/services/repository'
import type { Repository, Commit, ChecklistItem } from '@/types/database'

interface ForkModalProps {
  repository: Repository | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newRepoId: string, itemCount: number) => void
}

type ForkState = 'idle' | 'loading-preview' | 'ready' | 'forking' | 'success' | 'error'

export function ForkModal({ repository, isOpen, onClose, onSuccess }: ForkModalProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // State
  const [forkState, setForkState] = useState<ForkState>('idle')
  const [title, setTitle] = useState('')
  const [commit, setCommit] = useState<Commit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newRepoId, setNewRepoId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // Calculate item count
  const itemCount = commit?.content?.items ? Object.keys(commit.content.items).length : 0
  const headerCount = commit?.content?.items
    ? Object.values(commit.content.items).filter((item: ChecklistItem) => item.type === 'header').length
    : 0

  // Load commit for preview
  const loadCommit = useCallback(async () => {
    if (!repository) return

    try {
      const latestCommit = await getLatestCommit(repository.id)
      console.log('[ForkModal] Loaded commit for preview:', {
        repoId: repository.id,
        commitId: latestCommit?.id,
        itemCount: latestCommit?.content?.items ? Object.keys(latestCommit.content.items).length : 0,
        content: latestCommit?.content,
      })

      if (!latestCommit || !latestCommit.content?.items || Object.keys(latestCommit.content.items).length === 0) {
        console.warn('[ForkModal] Source repository has no items to fork')
        setError('This template has no items to fork. Please try another template.')
        setForkState('error')
        return
      }

      setCommit(latestCommit)
      setForkState('ready')
    } catch (err) {
      console.error('Error loading commit:', err)
      setError('Failed to load checklist preview')
      setForkState('error')
    }
  }, [repository])

  // Reset state when modal opens/closes or repository changes
  useEffect(() => {
    if (isOpen && repository) {
      startTransition(() => {
        setForkState('loading-preview')
        setTitle(repository.title)
        setError(null)
        setNewRepoId(null)
        setProgress(0)
      })

      // Load the latest commit to get the item preview
      loadCommit()
    } else {
      startTransition(() => {
        setForkState('idle')
        setCommit(null)
      })
    }
  }, [isOpen, repository?.id, loadCommit])

  // Handle fork
  const handleFork = async () => {
    if (!user) {
      onClose()
      navigate('/', { state: { returnTo: window.location.pathname } })
      return
    }

    if (!repository) return

    setForkState('forking')
    setError(null)
    setProgress(10)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90))
      }, 200)

      console.log('[ForkModal] Forking repository:', {
        sourceRepoId: repository.id,
        newOwnerId: user.id,
        newTitle: title !== repository.title ? title : undefined,
        originalItemCount: itemCount,
      })

      const repoId = await forkRepository({
        sourceRepoId: repository.id,
        newOwnerId: user.id,
        newTitle: title !== repository.title ? title : undefined,
      })

      console.log('[ForkModal] Fork successful, new repoId:', repoId)

      clearInterval(progressInterval)
      setProgress(100)
      setNewRepoId(repoId)
      setForkState('success')

      // Call success callback
      onSuccess?.(repoId, itemCount)
    } catch (err) {
      console.error('Error forking repository:', err)
      setError(err instanceof Error ? err.message : 'Failed to fork checklist')
      setForkState('error')
    }
  }

  // Navigate to the forked repo
  const handleGoToFork = () => {
    if (newRepoId) {
      onClose()
      navigate(`/app/repo/${newRepoId}`)
    }
  }

  // Get top-level items for preview
  const getPreviewItems = (): ChecklistItem[] => {
    if (!commit?.content?.items) return []
    return Object.values(commit.content.items)
      .filter((item: ChecklistItem) => item.parent === null)
      .sort((a: ChecklistItem, b: ChecklistItem) => a.order - b.order)
      .slice(0, 5)
  }

  if (!repository) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GitFork className="h-4 w-4 text-primary" />
            </div>
            {forkState === 'success' ? 'Fork Complete!' : 'Fork Checklist'}
          </DialogTitle>
          <DialogDescription>
            {forkState === 'success'
              ? 'Your fork has been created successfully.'
              : 'Create your own copy to customize and run.'}
          </DialogDescription>
        </DialogHeader>

        {/* Loading Preview State */}
        {forkState === 'loading-preview' && (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Loading checklist preview...</p>
          </div>
        )}

        {/* Ready State - Show Preview */}
        {forkState === 'ready' && (
          <div className="space-y-4">
            {/* Source Info */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ListChecks className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{repository.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {itemCount} items
                    </Badge>
                    {headerCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {headerCount} sections
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Items */}
              {getPreviewItems().length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <ul className="space-y-1">
                    {getPreviewItems().map((item) => (
                      <li key={item.id} className="text-xs flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary/50" />
                        <span className={item.type === 'header' ? 'font-medium' : ''}>
                          {item.text || 'Untitled item'}
                        </span>
                      </li>
                    ))}
                    {itemCount > 5 && (
                      <li className="text-xs text-muted-foreground pl-3">
                        + {itemCount - 5} more items...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Arrow Divider */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Copy className="h-4 w-4" />
              <ArrowRight className="h-4 w-4" />
            </div>

            {/* New Fork Info */}
            <div className="space-y-3">
              <div>
                <label htmlFor="fork-title" className="text-sm font-medium mb-1.5 block">
                  Your Fork Title
                </label>
                <Input
                  id="fork-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your fork"
                  className="h-10"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>
                  All {itemCount} items will be copied to your checklist
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Forking State */}
        {forkState === 'forking' && (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <GitFork className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="font-medium mb-1">Creating your fork...</p>
              <p className="text-sm text-muted-foreground">
                Copying {itemCount} items to your checklist
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Success State */}
        {forkState === 'success' && (
          <div className="py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="font-medium text-lg mb-1">Fork Created!</p>
            <p className="text-sm text-muted-foreground mb-4">
              Successfully copied {itemCount} items to "{title}"
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
              <ListChecks className="h-4 w-4 text-primary" />
              <span>{itemCount} items ready to customize</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {forkState === 'error' && (
          <div className="py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="font-medium text-lg mb-1">Fork Failed</p>
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
          {forkState === 'ready' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleFork} disabled={!title.trim()}>
                <GitFork className="mr-2 h-4 w-4" />
                Create Fork
              </Button>
            </>
          )}
          {forkState === 'success' && (
            <Button onClick={handleGoToFork} className="w-full sm:w-auto">
              <ArrowRight className="mr-2 h-4 w-4" />
              Open My Fork
            </Button>
          )}
          {forkState === 'error' && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
