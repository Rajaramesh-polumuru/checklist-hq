import { useRef, useEffect, useState, memo, type KeyboardEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DESIGN_TOKENS } from '@/lib/constants'
import { useChecklistStore } from '@/stores/checklist-store'
import type { ChecklistItem as ChecklistItemType } from '@/types/database'

interface ChecklistItemProps {
  item: ChecklistItemType
  depth: number
}

export const ChecklistItem = memo(function ChecklistItem({ item, depth }: ChecklistItemProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const {
    updateItem,
    deleteItem,
    addItem,
    indentItem,
    outdentItem,
    focusedItemId,
    setFocusedItem,
    getPreviousSibling,
    getParent,
    getItemsAtLevel,
  } = useChecklistStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Focus input when this item becomes focused
  useEffect(() => {
    if (focusedItemId === item.id && inputRef.current) {
      inputRef.current.focus()
    }
  }, [focusedItemId, item.id])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const cursorAtStart = inputRef.current?.selectionStart === 0
    const cursorAtEnd = inputRef.current?.selectionStart === item.text.length

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        // Add new sibling item after current one
        addItem('', item.parent)
        break

      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          // Outdent (Shift+Tab)
          outdentItem(item.id)
        } else {
          // Indent (Tab)
          indentItem(item.id)
        }
        break

      case 'Backspace':
        if (item.text === '' && cursorAtStart) {
          e.preventDefault()
          // Delete empty item and focus previous
          const prevSibling = getPreviousSibling(item.id)
          const parent = getParent(item.id)
          deleteItem(item.id)
          if (prevSibling) {
            setFocusedItem(prevSibling.id)
          } else if (parent) {
            setFocusedItem(parent.id)
          }
        }
        break

      case 'ArrowUp':
        if (cursorAtStart) {
          e.preventDefault()
          // Navigate to previous item
          const allItems = getAllVisibleItems()
          const currentIndex = allItems.findIndex(i => i.id === item.id)
          if (currentIndex > 0) {
            setFocusedItem(allItems[currentIndex - 1].id)
          }
        }
        break

      case 'ArrowDown':
        if (cursorAtEnd) {
          e.preventDefault()
          // Navigate to next item
          const allItems = getAllVisibleItems()
          const currentIndex = allItems.findIndex(i => i.id === item.id)
          if (currentIndex < allItems.length - 1) {
            setFocusedItem(allItems[currentIndex + 1].id)
          }
        }
        break
    }
  }

  // Helper to get all items in visual order (DFS)
  const getAllVisibleItems = (): ChecklistItemType[] => {
    const result: ChecklistItemType[] = []
    const traverse = (parentId: string | null) => {
      const children = getItemsAtLevel(parentId)
      for (const child of children) {
        result.push(child)
        traverse(child.id)
      }
    }
    traverse(null)
    return result
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateItem(item.id, { text: e.target.value })
  }

  const handleFocus = () => {
    setFocusedItem(item.id)
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const handleDelete = () => {
    const prevSibling = getPreviousSibling(item.id)
    const parent = getParent(item.id)
    deleteItem(item.id)
    if (prevSibling) {
      setFocusedItem(prevSibling.id)
    } else if (parent) {
      setFocusedItem(parent.id)
    }
  }

  const isActive = isHovered || isFocused || focusedItemId === item.id

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 transition-all duration-150',
        isDragging && 'opacity-50 bg-accent shadow-lg rounded-lg',
        !isDragging && 'hover:bg-accent/30',
        focusedItemId === item.id && !isDragging && 'bg-primary/5'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle */}
      <button
        className={cn(
          'cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground transition-all duration-150',
          'w-6 h-6 flex items-center justify-center rounded shrink-0',
          !isActive && 'opacity-0',
          isActive && 'opacity-100'
        )}
        aria-label="Drag to reorder item"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Indentation spacer */}
      {depth > 0 && (
        <div
          className="shrink-0"
          style={{ width: `${depth * DESIGN_TOKENS.spacing.itemIndentPx}px` }}
          aria-hidden="true"
        />
      )}

      {/* Checkbox-style indicator */}
      <div className={cn(
        'shrink-0 transition-colors duration-150',
        item.text ? 'text-primary/60' : 'text-muted-foreground/40'
      )}>
        {item.text ? (
          <Circle className="h-4 w-4" strokeWidth={2} />
        ) : (
          <Circle className="h-4 w-4" strokeWidth={1.5} strokeDasharray="3 3" />
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={item.text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Type here..."
        aria-label={item.text || 'Checklist item'}
        className={cn(
          'flex-1 bg-transparent border-none outline-none text-foreground min-w-0',
          'placeholder:text-muted-foreground/40',
          'focus:ring-0'
        )}
      />

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className={cn(
          'text-muted-foreground/50 hover:text-destructive transition-all duration-150',
          'w-7 h-7 flex items-center justify-center rounded shrink-0',
          'hover:bg-destructive/10',
          !isActive && 'opacity-0',
          isActive && 'opacity-100'
        )}
        aria-label="Delete item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if item data or depth changed
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.text === nextProps.item.text &&
    prevProps.item.order === nextProps.item.order &&
    prevProps.item.parent === nextProps.item.parent &&
    prevProps.depth === nextProps.depth
  )
})
