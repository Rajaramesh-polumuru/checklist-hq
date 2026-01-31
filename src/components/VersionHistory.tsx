import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  X,
  History,
  GitCommit,
  RotateCcw,
  Eye,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { getCommitHistory } from '@/services/repository'
import type { Commit } from '@/types/database'
import { cn } from '@/lib/utils'

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
            <History className="h-5 w-5" />
            <h2 className="font-semibold">Version History</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
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
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              {error}
            </div>
          ) : commits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GitCommit className="h-8 w-8 mx-auto mb-3 opacity-50" />
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
                            <GitCommit className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                            <Eye className="h-4 w-4" />
                          </Button>

                          {onCompareVersions && (
                            <Button
                              variant={isSelected ? 'default' : 'ghost'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCompareClick(commit)}
                              title={isSelected ? 'Selected for compare' : 'Compare versions'}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}

                          {!isCurrent && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onRestoreVersion(commit)}
                              title="Restore to this version"
                            >
                              <RotateCcw className="h-4 w-4" />
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
