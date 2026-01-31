import React from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useChecklistStore } from '@/stores/checklist-store'
import { ChecklistItem } from './ChecklistItem'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, ListChecks, Lightbulb } from 'lucide-react'
import type { ChecklistItem as ChecklistItemType } from '@/types/database'

export function ChecklistEditor() {
  const {
    content,
    addItem,
    moveItem,
    getItemsAtLevel,
  } = useChecklistStore()

  const rootItems = getItemsAtLevel(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeItem = content.items[active.id as string]
    const overItem = content.items[over.id as string]

    if (!activeItem || !overItem) return

    // Move to the same level as the target, right after it
    moveItem(
      active.id as string,
      overItem.parent,
      overItem.order + (activeItem.order > overItem.order ? 0 : 1)
    )
  }

  const handleAddItem = () => {
    addItem('')
  }

  // Recursively render items with their children
  const renderItems = (items: ChecklistItemType[], depth = 0): React.ReactNode[] => {
    return items.flatMap((item) => {
      const children = getItemsAtLevel(item.id)
      return [
        <ChecklistItem key={item.id} item={item} depth={depth} />,
        ...renderItems(children, depth + 1),
      ]
    })
  }

  const allItemIds = Object.keys(content.items)

  return (
    <div className="space-y-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
          {rootItems.length === 0 ? (
            /* Enhanced empty state */
            <Card className="border-dashed border-2 bg-muted/30">
              <div className="text-center py-16 px-6">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                  <ListChecks className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Start building your checklist</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Add items to create your standard operating procedure. Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd> to add new items.
                </p>
                <Button onClick={handleAddItem} size="lg" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add first item
                </Button>

                {/* Quick tips */}
                <div className="mt-8 pt-6 border-t border-dashed">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-3">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>Quick tips</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                    <span><kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">Tab</kbd> to indent</span>
                    <span><kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">Shift+Tab</kbd> to outdent</span>
                    <span><kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">↑↓</kbd> to navigate</span>
                    <span><kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">?</kbd> for all shortcuts</span>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            /* Checklist items */
            <Card className="divide-y divide-border/50 overflow-hidden">
              {renderItems(rootItems)}
            </Card>
          )}
        </SortableContext>
      </DndContext>

      {/* Add item button */}
      {rootItems.length > 0 && (
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 h-11 rounded-lg"
          onClick={handleAddItem}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      )}
    </div>
  )
}
