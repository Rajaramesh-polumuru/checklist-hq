import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { FormattedText } from '@/lib/rich-text'
import type { ChecklistItem } from '@/types/database'

interface SimpleRunSectionProps {
  item: ChecklistItem
  childCount: number
  completedChildCount: number
}

export function SimpleRunSection({
  item,
  childCount,
  completedChildCount,
}: SimpleRunSectionProps) {
  const isAllComplete = childCount > 0 && completedChildCount === childCount

  return (
    <div className="mt-6 mb-2">
      <div className="flex items-center gap-3">
        <h3
          className={cn(
            'text-xs font-semibold uppercase tracking-wider flex-1 min-w-0 truncate',
            isAllComplete ? 'text-success' : 'text-muted-foreground',
          )}
          role="heading"
          aria-level={2}
        >
          {item.text ? <FormattedText text={item.text} /> : 'Section'}
        </h3>
        <span
          className={cn(
            'text-xs tabular-nums shrink-0 flex items-center gap-1',
            isAllComplete ? 'text-success' : 'text-muted-foreground',
          )}
        >
          {isAllComplete && (
            <Icon icon={CheckmarkCircle01Icon} size="xs" />
          )}
          {completedChildCount}/{childCount}
        </span>
      </div>
      <div className="border-b border-border mt-1.5" />
    </div>
  )
}
