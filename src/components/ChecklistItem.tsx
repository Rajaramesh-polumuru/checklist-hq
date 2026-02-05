import { memo, useRef, useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DragDropVerticalIcon,
  Delete02Icon,
  ArrowRight01Icon,
  Copy01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  MoreVerticalIcon
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import type { ChecklistItem as ChecklistItemType } from '@/types/database'
import { useChecklistStore } from '@/stores/checklist-store'
import { useIsMobile } from '@/hooks/useMobile'
import { DESIGN_TOKENS } from '@/lib/constants'

// Helper for item numbering
const getNumbering = (order: number, depth: number) => {
  return `${order + 1}.`
}

interface ChecklistItemProps {
  item: ChecklistItemType
  depth: number
  isLast: boolean
  parentHasMoreSiblings: boolean[]
  isDragging?: boolean
  isDropTarget?: boolean
  isFirst?: boolean
}

export const ChecklistItem = memo(function ChecklistItem({
  item,
  depth,
  isLast,
  parentHasMoreSiblings,
  isDragging: isDraggingProp,
  isDropTarget
}: ChecklistItemProps) {
  const {
    updateItem,
    deleteItem,
    indentItem,
    outdentItem,
    addItem,
    setFocusedItem,
    focusedItemId,
    duplicateItem,
    moveItemUp,
    moveItemDown,
    getItemsAtLevel,
    getPreviousSibling,
    getParent
  } = useChecklistStore()

  const isMobile = useIsMobile()
  const inputRef = useRef<HTMLInputElement>(null)

  const [isHovered, setIsHovered] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [isAnimatingIn, setIsAnimatingIn] = useState(true)

  // Disable animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimatingIn(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, data: { depth } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Helper to find all visible items for navigation logic
  const getAllVisibleItems = (): ChecklistItemType[] => {
    // This replicates the logic from the store/component to get a flat list
    // Ideally we'd get this from the store but computing it locally is fine for UI nav
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.defaultPrevented) return

    const cursorAtStart = e.currentTarget.selectionStart === 0
    const cursorAtEnd = e.currentTarget.selectionStart === e.currentTarget.value.length

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        addItem('', item.id) // Add as sibling? Or next item? 
        // addItem(text, parentId) adds to parent.
        // We want to add a sibling after this item.
        // The store's addItem pushes to end of parent list.
        // We probably want to insert after. 
        // For now, let's use addItem with parentId, which appends.
        // To insert "next", we might need a more specific action or just append.
        // User expectation: Enter creates new item below.
        addItem('', item.parent)
        break

      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          outdentItem(item.id)
        } else {
          indentItem(item.id)
        }
        break

      case 'Backspace':
        if (item.text === '' && !hasChildren) {
          e.preventDefault()
          // Calculate prev sibling to focus before deleting
          const prevSibling = getPreviousSibling(item.id)
          const parent = getParent(item.id)

          deleteItem(item.id)

          if (prevSibling) {
            setFocusedItem(prevSibling.id)
          } else if (parent) {
            setFocusedItem(parent.id)
          }
        } else if (cursorAtStart && !hasChildren && item.text === '') {
          // Empty item, but maybe covered above
        }
        break

      case 'ArrowUp':
        if (cursorAtStart || e.altKey) {
          e.preventDefault()
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateItem(item.id, { text: e.target.value })
  }

  const handleFocus = () => {
    setFocusedItem(item.id)
  }

  const handleBlur = () => {
    // We don't necessarily want to clear focus on blur because line interactions might need it
    // But keeping it in sync with store is good.
    // implementation details...
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

  const isActive = isHovered || focusedItemId === item.id
  // IsFocused state for local styling?
  const isFocused = focusedItemId === item.id

  const children = getItemsAtLevel(item.id)
  const hasChildren = children.length > 0

  // Focus effect
  useEffect(() => {
    if (focusedItemId === item.id && inputRef.current) {
      inputRef.current.focus()
    }
  }, [focusedItemId, item.id])

  // Close context menu when clicking outside
  useEffect(() => {
    if (showContextMenu) {
      const handleClickOutside = () => setShowContextMenu(false)
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [showContextMenu])

  // Use (renamed) prop isDragging if passed, otherwise use sortable isDragging
  const isCurrentlyDragging = isDraggingProp || isDragging

  // Touch handlers (simplified placeholders if needed, or rely on dnd-kit listeners)
  const handleTouchStart = () => { /* ... */ }
  const handleTouchEnd = () => { /* ... */ }
  const handleTouchMove = () => { /* ... */ }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center transition-all duration-200',
        isCurrentlyDragging && 'opacity-40 scale-[0.98] bg-accent/20',
        !isCurrentlyDragging && 'hover:bg-accent/40',
        isFocused && !isCurrentlyDragging && 'bg-primary/5 ring-1 ring-primary/20',
        isAnimatingIn && 'animate-fade-in',
        isDropTarget && 'ring-2 ring-primary ring-offset-2'
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    // Touch handlers could be attached to drag handle
    >
      {/* Drop zone indicator line */}
      {isDropTarget && (
        <div className="absolute -top-0.5 left-0 right-0 h-1 bg-primary rounded-full animate-pulse z-50" />
      )}
      {/* Tree connector lines */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex" aria-hidden="true">
          {Array.from({ length: depth }).map((_, idx) => (
            <div
              key={idx}
              className="relative"
              style={{ width: `${DESIGN_TOKENS.spacing.itemIndentPx}px` }}
            >
              {idx < depth - 1 && parentHasMoreSiblings[idx] && (
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border/60" />
              )}
              {idx === depth - 1 && (
                <>
                  <div
                    className={cn(
                      "absolute left-4 w-px bg-border/60",
                      isLast ? "top-0 h-1/2" : "top-0 bottom-0"
                    )}
                  />
                  <div className="absolute left-4 top-1/2 w-3 h-px bg-border/60" />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content wrapper - larger padding on mobile */}
      <div
        className={cn(
          "flex items-center gap-2 flex-1 min-w-0 transition-all",
          isMobile ? "px-3 py-4" : "px-3 py-2.5" // Larger touch target on mobile
        )}
        style={{ paddingLeft: `${(depth * DESIGN_TOKENS.spacing.itemIndentPx) + 12}px` }}
      >
        {/* Drag Handle - always visible on mobile */}
        <button
          className={cn(
            'cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground transition-all duration-150',
            'flex items-center justify-center rounded shrink-0',
            isMobile ? 'w-10 h-10 opacity-100' : 'w-6 h-6', // 44px touch target on mobile
            !isMobile && !isActive && 'opacity-0',
            !isMobile && isActive && 'opacity-100'
          )}
          aria-label="Drag to reorder item"
          {...attributes}
          {...listeners}
        >
          <Icon icon={DragDropVerticalIcon} className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
        </button>

        {/* Item number */}
        <span className={cn(
          'font-medium shrink-0 w-6 text-right tabular-nums',
          isMobile ? 'text-sm' : 'text-xs',
          item.text ? 'text-muted-foreground' : 'text-muted-foreground/40'
        )}>
          {getNumbering(item.order, depth)}
        </span>

        {/* Expand indicator */}
        <div className={cn("shrink-0 flex items-center justify-center", isMobile ? "w-5 h-5" : "w-4 h-4")}>
          {hasChildren && (
            <Icon icon={ArrowRight01Icon} className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5", "text-muted-foreground/60")} />
          )}
        </div>

        {/* Input - larger font on mobile */}
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
            isMobile ? 'text-base leading-relaxed' : 'text-sm leading-relaxed'
          )}
        />

        {/* Action buttons - larger on mobile, visible on hover/focus desktop */}
        <div className={cn(
          'flex items-center gap-1 transition-opacity duration-150',
          isMobile ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-0'
        )}>
          {/* Mobile: single menu button */}
          {isMobile ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                setContextMenuPosition({ x: rect.left, y: rect.bottom + 4 })
                setShowContextMenu(true)
              }}
              className={cn(
                'text-muted-foreground/60 hover:text-muted-foreground transition-colors',
                'w-11 h-11 flex items-center justify-center rounded-lg hover:bg-accent' // 44px touch target
              )}
              aria-label="Item options"
            >
              <Icon icon={MoreVerticalIcon} className="h-5 w-5" />
            </button>
          ) : (
            /* Desktop: inline action buttons */
            <>
              <button
                onClick={() => setShowContextMenu(!showContextMenu)}
                className={cn(
                  'text-muted-foreground/50 hover:text-muted-foreground transition-colors',
                  'w-7 h-7 flex items-center justify-center rounded hover:bg-accent'
                )}
                aria-label="More options"
              >
                <Icon icon={MoreVerticalIcon} className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className={cn(
                  'text-muted-foreground/50 hover:text-destructive transition-colors',
                  'w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10'
                )}
                aria-label="Delete item"
              >
                <Icon icon={Delete02Icon} className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Context menu - positioned differently on mobile */}
      {showContextMenu && (
        <div
          className={cn(
            "fixed z-50 bg-popover border rounded-xl shadow-lg py-2 animate-fade-in",
            isMobile ? "min-w-[200px]" : "min-w-[160px]"
          )}
          style={{
            left: isMobile ? '50%' : contextMenuPosition.x,
            top: contextMenuPosition.y,
            transform: isMobile ? 'translateX(-50%)' : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { duplicateItem(item.id); setShowContextMenu(false) }}
            className={cn(
              "w-full px-4 text-left hover:bg-accent flex items-center gap-3",
              isMobile ? "py-3 text-base" : "py-2 text-sm"
            )}
          >
            <Icon icon={Copy01Icon} className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            Duplicate
            {!isMobile && <kbd className="ml-auto text-[10px] text-muted-foreground">⌘D</kbd>}
          </button>
          <button
            onClick={() => { moveItemUp(item.id); setShowContextMenu(false) }}
            className={cn(
              "w-full px-4 text-left hover:bg-accent flex items-center gap-3",
              isMobile ? "py-3 text-base" : "py-2 text-sm"
            )}
          >
            <Icon icon={ArrowUp01Icon} className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            Move up
            {!isMobile && <kbd className="ml-auto text-[10px] text-muted-foreground">⌘↑</kbd>}
          </button>
          <button
            onClick={() => { moveItemDown(item.id); setShowContextMenu(false) }}
            className={cn(
              "w-full px-4 text-left hover:bg-accent flex items-center gap-3",
              isMobile ? "py-3 text-base" : "py-2 text-sm"
            )}
          >
            <Icon icon={ArrowDown01Icon} className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            Move down
            {!isMobile && <kbd className="ml-auto text-[10px] text-muted-foreground">⌘↓</kbd>}
          </button>
          <div className="border-t my-1" />
          <button
            onClick={() => { handleDelete(); setShowContextMenu(false) }}
            className={cn(
              "w-full px-4 text-left hover:bg-destructive/10 text-destructive flex items-center gap-3",
              isMobile ? "py-3 text-base" : "py-2 text-sm"
            )}
          >
            <Icon icon={Delete02Icon} className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            Delete
            {!isMobile && <kbd className="ml-auto text-[10px] text-destructive/60">⌫</kbd>}
          </button>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.text === nextProps.item.text &&
    prevProps.item.order === nextProps.item.order &&
    prevProps.item.parent === nextProps.item.parent &&
    prevProps.depth === nextProps.depth &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isDropTarget === nextProps.isDropTarget &&
    JSON.stringify(prevProps.parentHasMoreSiblings) === JSON.stringify(nextProps.parentHasMoreSiblings)
  )
})

// Drag overlay item - floating preview during drag
export function DragOverlayItem({ item }: { item: ChecklistItemType }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card border-2 border-primary/30 rounded-xl shadow-2xl shadow-primary/20">
      <Icon icon={DragDropVerticalIcon} className="h-4 w-4 text-primary" />
      <span className="text-base font-medium text-foreground">
        {item.text || <span className="text-muted-foreground italic">Empty item</span>}
      </span>
    </div>
  )
}
