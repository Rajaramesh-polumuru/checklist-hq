import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { SimpleRunItem } from './SimpleRunItem'
import { SimpleRunSection } from './SimpleRunSection'
import type { ChecklistItem, RunProgress } from '@/types/database'

interface SimpleRunListProps {
  items: ChecklistItem[]
  allItems: Record<string, ChecklistItem>
  progress: RunProgress
  onToggle: (itemId: string, completed: boolean) => void
  onRequestNote: (itemId: string) => void
  depth?: number
  checkableItems: ChecklistItem[]
  nextItemId: string | null
  focusedItemId: string | null
  readOnly?: boolean
  context?: Record<string, unknown>
}

export function SimpleRunList({
  items,
  allItems,
  progress,
  onToggle,
  onRequestNote,
  depth = 0,
  checkableItems,
  nextItemId,
  focusedItemId,
  readOnly = false,
  context,
}: SimpleRunListProps) {
  const getChildren = useMemo(() => {
    return (parentId: string): ChecklistItem[] => {
      return Object.values(allItems)
        .filter((item) => item.parent === parentId)
        .sort((a, b) => a.order - b.order)
    }
  }, [allItems])

  const getCompletedChildCount = (parentId: string): number => {
    const children = getChildren(parentId)
    return children.filter((child) => {
      if (child.type === 'header') {
        const headerChildren = getChildren(child.id)
        return (
          headerChildren.length > 0 &&
          getCompletedChildCount(child.id) === headerChildren.length
        )
      }
      return progress[child.id]?.completed
    }).length
  }

  return (
    <div className={cn('space-y-0.5', depth > 0 && 'ml-7 pl-3 border-l border-muted-foreground/15')}>
      {items.map((item) => {
        const children = getChildren(item.id)
        const isHeader = item.type === 'header'

        if (isHeader && children.length > 0) {
          return (
            <div key={item.id}>
              <SimpleRunSection
                item={item}
                childCount={children.filter((c) => c.type !== 'header').length}
                completedChildCount={getCompletedChildCount(item.id)}
              />
              <SimpleRunList
                items={children}
                allItems={allItems}
                progress={progress}
                onToggle={onToggle}
                onRequestNote={onRequestNote}
                depth={depth + 1}
                checkableItems={checkableItems}
                nextItemId={nextItemId}
                focusedItemId={focusedItemId}
                readOnly={readOnly}
                context={context}
              />
            </div>
          )
        }

        return (
          <div key={item.id}>
            <SimpleRunItem
              item={item}
              progress={progress[item.id]}
              depth={depth}
              isNext={item.id === nextItemId}
              isFocused={item.id === focusedItemId}
              onToggle={onToggle}
              onRequestNote={onRequestNote}
              readOnly={readOnly}
              context={context}
            />
            {children.length > 0 && (
              <SimpleRunList
                items={children}
                allItems={allItems}
                progress={progress}
                onToggle={onToggle}
                onRequestNote={onRequestNote}
                depth={depth + 1}
                checkableItems={checkableItems}
                nextItemId={nextItemId}
                focusedItemId={focusedItemId}
                readOnly={readOnly}
                context={context}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
