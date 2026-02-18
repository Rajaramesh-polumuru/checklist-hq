import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import ArrowLeft02Icon from '@hugeicons/core-free-icons/ArrowLeft02Icon'
import EyeIcon from '@hugeicons/core-free-icons/EyeIcon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import Alert01Icon from '@hugeicons/core-free-icons/Alert01Icon'
import GitCommitIcon from '@hugeicons/core-free-icons/GitCommitIcon'
import { Icon } from '@/components/ui/icon'
import { getCommitHistory } from '@/services/repository'
import type { Commit } from '@/types/database'
import { cn } from '@/lib/utils'

// Restore confirmation dialog
function RestoreConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  commit,
  isRestoring,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  commit: Commit | null
  isRestoring: boolean
}) {
  if (!commit) return null

  const itemCount = Object.keys(commit.content.items).length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isRestoring && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon={Alert01Icon} className="h-5 w-5 text-warning" />
            Restore Version
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            Are you sure you want to restore to this version? This action will create a new commit with the content from this snapshot.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Icon icon={GitCommitIcon} className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {commit.message || 'No message'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(commit.created_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground mt-3">
            Your current version will remain in the history, so you can always restore it later if needed.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isRestoring}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isRestoring} className="gap-2">
            {isRestoring ? (
              <>
                <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Icon icon={ArrowLeft02Icon} className="h-4 w-4" />
                Restore
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface VersionHistoryProps {
  repoId: string
  currentCommitId?: string
  isOpen: boolean
  onClose: () => void
  onViewVersion: (commit: Commit) => void
  onRestoreVersion: (commit: Commit) => void
  onCompareVersions?: (commit1: Commit, commit2: Commit) => void
}

export function VersionHistory({
  repoId,
  currentCommitId,
  isOpen,
  onClose,
  onViewVersion,
  onRestoreVersion,
  onCompareVersions,
}: VersionHistoryProps) {
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedForCompare, setSelectedForCompare] = useState<Commit | null>(null)
  const [restoreCommit, setRestoreCommit] = useState<Commit | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    async function loadHistory() {
      try {
        setLoading(true)
        setError(null)
        const history = await getCommitHistory(repoId)
        setCommits(history)
      } catch (err) {
        console.error('Error loading commit history:', err)
        setError('Failed to load version history')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [repoId, isOpen])

  const handleCompareClick = (commit: Commit) => {
    if (!onCompareVersions) return

    if (!selectedForCompare) {
      setSelectedForCompare(commit)
    } else {
      onCompareVersions(selectedForCompare, commit)
      setSelectedForCompare(null)
    }
  }

  const handleRestoreConfirm = async () => {
    if (!restoreCommit) return

    setIsRestoring(true)
    try {
      await onRestoreVersion(restoreCommit)
      setRestoreCommit(null)
    } finally {
      setIsRestoring(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-background border-l shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Icon icon={Clock01Icon} className="h-5 w-5" />
            <h2 className="font-semibold">Version History</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon icon={Cancel01Icon} className="h-4 w-4" />
          </Button>
        </div>

        {/* Compare mode indicator */}
        {selectedForCompare && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950 border-b text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 dark:text-blue-300">
                Select another version to compare
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedForCompare(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon={Loading02Icon} className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              {error}
            </div>
          ) : commits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon icon={GitCommitIcon} className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No version history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commits.map((commit) => {
                const isCurrent = commit.id === currentCommitId
                const isSelected = selectedForCompare?.id === commit.id

                return (
                  <Card
                    key={commit.id}
                    className={cn(
                      'transition-colors',
                      isCurrent && 'border-primary bg-primary/5',
                      isSelected && 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon icon={GitCommitIcon} className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <p className="text-sm font-medium truncate">
                              {commit.message || 'No message'}
                            </p>
                            {isCurrent && (
                              <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            {formatDate(commit.created_at)}
                          </p>
                          <p className="text-xs text-muted-foreground ml-6">
                            {Object.keys(commit.content.items).length} items
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onViewVersion(commit)}
                            title="View this version"
                          >
                            <Icon icon={EyeIcon} className="h-4 w-4" />
                          </Button>

                          {onCompareVersions && (
                            <Button
                              variant={isSelected ? 'default' : 'ghost'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCompareClick(commit)}
                              title={isSelected ? 'Selected for compare' : 'Compare versions'}
                            >
                              <Icon icon={ArrowRight01Icon} className="h-4 w-4" />
                            </Button>
                          )}

                          {!isCurrent && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setRestoreCommit(commit)}
                              title="Restore to this version"
                            >
                              <Icon icon={ArrowLeft02Icon} className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t text-xs text-muted-foreground">
          {commits.length} version{commits.length !== 1 ? 's' : ''} total
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      <RestoreConfirmationDialog
        isOpen={!!restoreCommit}
        onClose={() => setRestoreCommit(null)}
        onConfirm={handleRestoreConfirm}
        commit={restoreCommit}
        isRestoring={isRestoring}
      />
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}
