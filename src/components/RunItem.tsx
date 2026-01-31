import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Check } from 'lucide-react'
import type { ChecklistItem, ItemProgress } from '@/types/database'

interface RunItemProps {
  item: ChecklistItem
  progress: ItemProgress | undefined
  depth: number
  onToggle: (itemId: string, completed: boolean) => void
}

export function RunItem({ item, progress, depth, onToggle }: RunItemProps) {
  const isCompleted = progress?.completed ?? false

  const handleToggle = () => {
    onToggle(item.id, !isCompleted)
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 py-3 px-4 rounded-lg transition-colors',
        isCompleted ? 'bg-green-50 dark:bg-green-950/20' : 'hover:bg-muted/50',
        depth > 0 && 'border-l-2 border-muted ml-6'
      )}
      style={{ marginLeft: depth > 0 ? `${depth * 24}px` : undefined }}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          className={cn(
            'h-5 w-5 rounded-full transition-all',
            isCompleted && 'bg-green-600 border-green-600'
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-base transition-all',
            isCompleted && 'text-muted-foreground line-through'
          )}
        >
          {item.text || 'Untitled item'}
        </p>

        {item.details && (
          <p className="text-sm text-muted-foreground mt-1">
            {item.details}
          </p>
        )}

        {isCompleted && progress?.timestamp && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Completed {formatTimestamp(progress.timestamp)}
          </p>
        )}
      </div>
    </div>
  )
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  return date.toLocaleDateString()
}
