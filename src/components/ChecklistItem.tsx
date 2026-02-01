import { useRef, useEffect, useState, memo, type KeyboardEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, ChevronRight, Type, Hash, FileText, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DESIGN_TOKENS } from '@/lib/constants'
import { useChecklistStore } from '@/stores/checklist-store'
import type { ChecklistItem as ChecklistItemType } from '@/types/database'

interface ChecklistItemProps {
  item: ChecklistItemType
  depth: number
  isLast?: boolean
  parentHasMoreSiblings?: boolean[]
}

// Numbering helpers
const getNumbering = (order: number, depth: number): string => {
  if (depth === 0) return `${order + 1}.`
  if (depth === 1) {
    const letters = 'abcdefghijklmnopqrstuvwxyz'
    return `${letters[order % 26]}.`
  }
  // Roman numerals for depth 2+
  const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
  return `${romanNumerals[order % 10]}.`
}

export const ChecklistItem = memo(function ChecklistItem({
  item,
  depth,
  isLast = false,
  parentHasMoreSiblings = []
}: ChecklistItemProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isAnimatingIn, setIsAnimatingIn] = useState(true)
  const [showContextMenu, setShowContextMenu] = useState(false)

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
    duplicateItem,
    moveItemUp,
    moveItemDown,
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

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimatingIn(false), 200)
    return () => clearTimeout(timer)
  }, [])

  // Focus input when this item becomes focused
  useEffect(() => {
    if (focusedItemId === item.id && inputRef.current) {
      inputRef.current.focus()
      // Place cursor at end
      inputRef.current.selectionStart = inputRef.current.selectionEnd = item.text.length
    }
  }, [focusedItemId, item.id, item.text.length])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const cursorAtStart = inputRef.current?.selectionStart === 0
    const cursorAtEnd = inputRef.current?.selectionStart === item.text.length

    // Cmd/Ctrl shortcuts
    const isMod = e.metaKey || e.ctrlKey

    if (isMod && e.key === 'd') {
      e.preventDefault()
      duplicateItem?.(item.id)
      return
    }

    if (isMod && e.key === 'ArrowUp') {
      e.preventDefault()
      moveItemUp?.(item.id)
      return
    }

    if (isMod && e.key === 'ArrowDown') {
      e.preventDefault()
      moveItemDown?.(item.id)
      return
    }

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
        if (cursorAtStart || e.altKey) {
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
        if (cursorAtEnd || e.altKey) {
          e.preventDefault()
          // Navigate to next item
          const allItems = getAllVisibleItems()
          const currentIndex = allItems.findIndex(i => i.id === item.id)
          if (currentIndex < allItems.length - 1) {
            setFocusedItem(allItems[currentIndex + 1].id)
          }
        }
        break

      case 'Escape':
        e.preventDefault()
        inputRef.current?.blur()
        setFocusedItem(null)
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

  // Get children count for this item
  const children = getItemsAtLevel(item.id)
  const hasChildren = children.length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center transition-all duration-200',
        isDragging && 'opacity-60 bg-accent shadow-lg rounded-lg z-50',
        !isDragging && 'hover:bg-accent/40',
        focusedItemId === item.id && !isDragging && 'bg-primary/5 ring-1 ring-primary/20',
        isAnimatingIn && 'animate-fade-in'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tree connector lines */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex" aria-hidden="true">
          {Array.from({ length: depth }).map((_, idx) => (
            <div
              key={idx}
              className="relative"
              style={{ width: `${DESIGN_TOKENS.spacing.itemIndentPx}px` }}
            >
              {/* Vertical line from parent levels */}
              {idx < depth - 1 && parentHasMoreSiblings[idx] && (
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border/60" />
              )}
              {/* Connection line for current depth */}
              {idx === depth - 1 && (
                <>
                  {/* Vertical line */}
                  <div
                    className={cn(
                      "absolute left-4 w-px bg-border/60",
                      isLast ? "top-0 h-1/2" : "top-0 bottom-0"
                    )}
                  />
                  {/* Horizontal connector */}
                  <div className="absolute left-4 top-1/2 w-3 h-px bg-border/60" />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content wrapper with padding for tree lines */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0"
        style={{ paddingLeft: `${(depth * DESIGN_TOKENS.spacing.itemIndentPx) + 12}px` }}
      >
        {/* Drag Handle */}
        <button
          className={cn(
            'cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground transition-all duration-150',
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

        {/* Item number/bullet */}
        <span className={cn(
          'text-xs font-medium shrink-0 w-5 text-right tabular-nums',
          item.text ? 'text-muted-foreground' : 'text-muted-foreground/40'
        )}>
          {getNumbering(item.order, depth)}
        </span>

        {/* Expand indicator for items with children */}
        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
          {hasChildren && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
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
          placeholder={depth === 0 ? "Add a step..." : "Add a sub-step..."}
          aria-label={item.text || 'Checklist item'}
          className={cn(
            'flex-1 bg-transparent border-none outline-none text-foreground min-w-0',
            'placeholder:text-muted-foreground/40 placeholder:italic',
            'text-sm leading-relaxed'
          )}
        />

        {/* Quick actions on hover */}
        <div className={cn(
          'flex items-center gap-0.5 transition-opacity duration-150',
          !isActive && 'opacity-0',
          isActive && 'opacity-100'
        )}>
          {/* Context menu button */}
          <button
            onClick={() => setShowContextMenu(!showContextMenu)}
            className={cn(
              'text-muted-foreground/50 hover:text-muted-foreground transition-colors',
              'w-7 h-7 flex items-center justify-center rounded hover:bg-accent'
            )}
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className={cn(
              'text-muted-foreground/50 hover:text-destructive transition-colors',
              'w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10'
            )}
            aria-label="Delete item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Context menu dropdown */}
      {showContextMenu && (
        <div
          className="absolute right-12 top-full mt-1 z-50 bg-popover border rounded-lg shadow-lg py-1 min-w-[160px] animate-fade-in"
          onMouseLeave={() => setShowContextMenu(false)}
        >
          <button
            onClick={() => { duplicateItem?.(item.id); setShowContextMenu(false) }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
          >
            <Hash className="h-3.5 w-3.5" />
            Duplicate
            <kbd className="ml-auto text-[10px] text-muted-foreground">⌘D</kbd>
          </button>
          <button
            onClick={() => { moveItemUp?.(item.id); setShowContextMenu(false) }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
          >
            <Type className="h-3.5 w-3.5" />
            Move up
            <kbd className="ml-auto text-[10px] text-muted-foreground">⌘↑</kbd>
          </button>
          <button
            onClick={() => { moveItemDown?.(item.id); setShowContextMenu(false) }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
          >
            <FileText className="h-3.5 w-3.5" />
            Move down
            <kbd className="ml-auto text-[10px] text-muted-foreground">⌘↓</kbd>
          </button>
          <div className="border-t my-1" />
          <button
            onClick={() => { handleDelete(); setShowContextMenu(false) }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
            <kbd className="ml-auto text-[10px] text-destructive/60">⌫</kbd>
          </button>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if item data or depth changed
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.text === nextProps.item.text &&
    prevProps.item.order === nextProps.item.order &&
    prevProps.item.parent === nextProps.item.parent &&
    prevProps.depth === nextProps.depth &&
    prevProps.isLast === nextProps.isLast &&
    JSON.stringify(prevProps.parentHasMoreSiblings) === JSON.stringify(nextProps.parentHasMoreSiblings)
  )
})
