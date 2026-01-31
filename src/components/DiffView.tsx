import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  X,
  GitCompare,
  Plus,
  Minus,
  Equal,
  ArrowRight,
} from 'lucide-react'
import type { Commit, ChecklistItem, ChecklistContent } from '@/types/database'
import { cn } from '@/lib/utils'

interface DiffViewProps {
  commit1: Commit
  commit2: Commit
  isOpen: boolean
  onClose: () => void
}

type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

interface DiffItem {
  type: DiffType
  item: ChecklistItem
  oldItem?: ChecklistItem
}

export function DiffView({ commit1, commit2, isOpen, onClose }: DiffViewProps) {
  // Ensure commit1 is older than commit2
  const [olderCommit, newerCommit] = useMemo(() => {
    const date1 = new Date(commit1.created_at).getTime()
    const date2 = new Date(commit2.created_at).getTime()
    return date1 < date2 ? [commit1, commit2] : [commit2, commit1]
  }, [commit1, commit2])

  // Calculate diff
  const diffItems = useMemo(() => {
    return calculateDiff(olderCommit.content, newerCommit.content)
  }, [olderCommit, newerCommit])

  // Summary stats
  const stats = useMemo(() => {
    const added = diffItems.filter((d) => d.type === 'added').length
    const removed = diffItems.filter((d) => d.type === 'removed').length
    const modified = diffItems.filter((d) => d.type === 'modified').length
    const unchanged = diffItems.filter((d) => d.type === 'unchanged').length
    return { added, removed, modified, unchanged }
  }, [diffItems])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            <h2 className="font-semibold">Compare Versions</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Version info */}
        <div className="px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex-1">
              <span className="text-muted-foreground">Older: </span>
              <span className="font-medium">{olderCommit.message || 'No message'}</span>
              <span className="text-muted-foreground ml-2">
                ({formatDate(olderCommit.created_at)})
              </span>
            </div>
            <ArrowRight className="h-4 w-4 mx-4 text-muted-foreground" />
            <div className="flex-1 text-right">
              <span className="text-muted-foreground">Newer: </span>
              <span className="font-medium">{newerCommit.message || 'No message'}</span>
              <span className="text-muted-foreground ml-2">
                ({formatDate(newerCommit.created_at)})
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-2 border-b flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <Plus className="h-4 w-4" />
            {stats.added} added
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <Minus className="h-4 w-4" />
            {stats.removed} removed
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <Equal className="h-4 w-4" />
            {stats.modified} modified
          </span>
          <span className="text-muted-foreground">
            {stats.unchanged} unchanged
          </span>
        </div>

        {/* Diff content */}
        <div className="flex-1 overflow-y-auto p-4">
          {diffItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No changes between these versions
            </div>
          ) : (
            <div className="space-y-2">
              {diffItems.map((diff, index) => (
                <DiffItemRow key={index} diff={diff} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

function DiffItemRow({ diff }: { diff: DiffItem }) {
  const getBgColor = () => {
    switch (diff.type) {
      case 'added':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
      case 'removed':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
      case 'modified':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
      default:
        return 'bg-muted/30'
    }
  }

  const getIcon = () => {
    switch (diff.type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'removed':
        return <Minus className="h-4 w-4 text-red-600" />
      case 'modified':
        return <Equal className="h-4 w-4 text-amber-600" />
      default:
        return null
    }
  }

  return (
    <div className={cn('rounded-md border p-3', getBgColor())}>
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          {diff.type === 'modified' && diff.oldItem ? (
            <>
              <p className="text-sm text-red-600 line-through">
                {diff.oldItem.text || 'Untitled item'}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {diff.item.text || 'Untitled item'}
              </p>
            </>
          ) : (
            <p className={cn(
              'text-sm',
              diff.type === 'removed' && 'line-through text-red-600',
              diff.type === 'added' && 'text-green-600'
            )}>
              {diff.item.text || 'Untitled item'}
            </p>
          )}

          {diff.item.details && (
            <p className="text-xs text-muted-foreground mt-1">
              {diff.item.details}
            </p>
          )}
        </div>

        <span className={cn(
          'text-xs px-2 py-0.5 rounded capitalize',
          diff.type === 'added' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
          diff.type === 'removed' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
          diff.type === 'modified' && 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
          diff.type === 'unchanged' && 'bg-muted text-muted-foreground'
        )}>
          {diff.type}
        </span>
      </div>
    </div>
  )
}

function calculateDiff(
  oldContent: ChecklistContent,
  newContent: ChecklistContent
): DiffItem[] {
  const oldItems = oldContent.items || {}
  const newItems = newContent.items || {}

  const allIds = new Set([...Object.keys(oldItems), ...Object.keys(newItems)])
  const diffs: DiffItem[] = []

  for (const id of allIds) {
    const oldItem = oldItems[id]
    const newItem = newItems[id]

    if (!oldItem && newItem) {
      // Added
      diffs.push({ type: 'added', item: newItem })
    } else if (oldItem && !newItem) {
      // Removed
      diffs.push({ type: 'removed', item: oldItem })
    } else if (oldItem && newItem) {
      // Check if modified
      if (
        oldItem.text !== newItem.text ||
        oldItem.details !== newItem.details ||
        oldItem.parent !== newItem.parent ||
        oldItem.order !== newItem.order
      ) {
        diffs.push({ type: 'modified', item: newItem, oldItem })
      } else {
        diffs.push({ type: 'unchanged', item: newItem })
      }
    }
  }

  // Sort: added first, then modified, then removed, then unchanged
  const order = { added: 0, modified: 1, removed: 2, unchanged: 3 }
  diffs.sort((a, b) => order[a.type] - order[b.type])

  return diffs
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
