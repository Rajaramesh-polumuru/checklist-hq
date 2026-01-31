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
import { Plus } from 'lucide-react'
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
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">Start building your checklist</p>
              <Button onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add first item
              </Button>
            </div>
          ) : (
            renderItems(rootItems)
          )}
        </SortableContext>
      </DndContext>

      {rootItems.length > 0 && (
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={handleAddItem}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      )}
    </div>
  )
}
