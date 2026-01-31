import { cn } from '@/lib/utils'
import { DESIGN_TOKENS } from '@/lib/constants'
import { formatCompactTime } from '@/lib/date-utils'
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
        isCompleted ? 'bg-success/10 dark:bg-success/20' : 'hover:bg-muted/50',
        depth > 0 && 'border-l-2 border-muted ml-6'
      )}
      style={{ marginLeft: depth > 0 ? `${depth * DESIGN_TOKENS.spacing.itemIndentPx}px` : undefined }}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          className={cn(
            'h-5 w-5 rounded-full transition-all',
            isCompleted && 'bg-success border-success'
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
          <p className="text-xs text-success mt-1 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Completed {formatCompactTime(progress.timestamp)}
          </p>
        )}
      </div>
    </div>
  )
}

