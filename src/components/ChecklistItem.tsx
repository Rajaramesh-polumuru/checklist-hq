import { memo, useRef, useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import DragDropVerticalIcon from '@hugeicons/core-free-icons/DragDropVerticalIcon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon'
import ArrowUp01Icon from '@hugeicons/core-free-icons/ArrowUp01Icon'
import ArrowDown01Icon from '@hugeicons/core-free-icons/ArrowDown01Icon'
import MoreVerticalIcon from '@hugeicons/core-free-icons/MoreVerticalIcon'
import Link01Icon from '@hugeicons/core-free-icons/Link01Icon'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import type { ChecklistItem as ChecklistItemType } from '@/types/database'
import { useChecklistStore } from '@/stores/checklist-store'
import { useIsMobile } from '@/hooks/useMobile'
import { DESIGN_TOKENS } from '@/lib/constants'
import { useListItemInteraction } from '@/hooks/use-interaction'
import { InsertRefModal } from '@/components/editor/InsertRefModal'

// Helper for item numbering
const getNumbering = (order: number) => {
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
  const [showRefModal, setShowRefModal] = useState(false)
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
    // Keep sync logic
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
  const isFocused = focusedItemId === item.id

  const children = getItemsAtLevel(item.id)
  const hasChildren = children.length > 0

  useEffect(() => {
    if (focusedItemId === item.id && inputRef.current) {
      inputRef.current.focus()
    }
  }, [focusedItemId, item.id])

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

  const isCurrentlyDragging = isDraggingProp || isDragging

  // Motion hooks
  const interactionProps = useListItemInteraction(isFocused && !isCurrentlyDragging)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center transition-all duration-200 outline-none select-none',
        isCurrentlyDragging && 'opacity-40 z-50',
        isAnimatingIn && 'animate-fade-in'
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      {...attributes}
    >
      {/* Interaction/Visual Wrapper */}
      <motion.div
        className={cn(
          "flex-1 flex items-center gap-2 rounded-lg transition-colors relative",
          isMobile ? "px-3 py-4" : "px-3 py-2.5",
          // Focused state — subtle brand tint
          isFocused && !isCurrentlyDragging && "bg-primary/10",
          // Hover state — accent background (only if not focused)
          isHovered && !isFocused && !isCurrentlyDragging && "bg-accent",
          // Ref item styling
          item.type === 'ref' && "border-l-2 border-blue-500/50 bg-blue-500/5 rounded-l-none",
          // Dragging/drop states
          isDropTarget && 'ring-2 ring-primary ring-offset-2 bg-accent/30',
          isCurrentlyDragging && 'bg-accent/20 border border-primary/20'
        )}
        initial={false}
        {...interactionProps}
        style={{
          marginLeft: `${depth * DESIGN_TOKENS.spacing.itemIndentPx}px`,
        }}
      >
        {/* Drag Handle */}
        <button
          className={cn(
            'cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground transition-all duration-150',
            'flex items-center justify-center rounded shrink-0',
            isMobile ? 'w-10 h-10 opacity-100' : 'w-6 h-6',
            !isMobile && !isActive && 'opacity-0',
            !isMobile && isActive && 'opacity-100'
          )}
          aria-label="Drag to reorder item"
          {...listeners}
        >
          <Icon icon={DragDropVerticalIcon} className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
        </button>

        {/* Numbering or Ref Icon */}
        <span className={cn(
          'font-medium shrink-0 w-6 text-right tabular-nums flex items-center justify-end',
          isMobile ? 'text-sm' : 'text-xs',
          item.text ? 'text-muted-foreground' : 'text-muted-foreground/40',
          item.type === 'ref' && "text-blue-500"
        )}>
          {item.type === 'ref' ? <Icon icon={Link01Icon} className="h-3.5 w-3.5" /> : getNumbering(item.order)}
        </span>

        {/* Expand Toggle */}
        <div className={cn("shrink-0 flex items-center justify-center", isMobile ? "w-5 h-5" : "w-4 h-4")}>
          {hasChildren && (
            <Icon icon={ArrowRight01Icon} className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5", "text-muted-foreground/60")} />
          )}
        </div>

        {/* Text Input */}
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

        {/* Actions */}
        <div className={cn(
          'flex items-center gap-1 transition-opacity duration-150',
          isMobile ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-0'
        )}>
          {isMobile ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                setContextMenuPosition({ x: rect.left, y: rect.bottom + 4 })
                setShowContextMenu(true)
              }}
              className="text-muted-foreground/60 w-11 h-11 flex items-center justify-center rounded-lg hover:bg-accent"
            >
              <Icon icon={MoreVerticalIcon} className="h-5 w-5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowContextMenu(!showContextMenu)}
                className="text-muted-foreground/50 w-7 h-7 flex items-center justify-center rounded hover:bg-accent hover:text-foreground"
              >
                <Icon icon={MoreVerticalIcon} className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="text-muted-foreground/50 w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive"
              >
                <Icon icon={Delete02Icon} className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Tree Connection Lines */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex z-[-1] pointer-events-none" aria-hidden="true">
          {Array.from({ length: depth }).map((_, idx) => (
            <div
              key={idx}
              className="relative"
              style={{ width: `${DESIGN_TOKENS.spacing.itemIndentPx}px` }}
            >
              {idx < depth - 1 && parentHasMoreSiblings[idx] && (
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border/40" />
              )}
              {idx === depth - 1 && (
                <>
                  <div
                    className={cn(
                      "absolute left-4 w-px bg-border/40",
                      isLast ? "top-0 h-1/2" : "top-0 bottom-0"
                    )}
                  />
                  <div className="absolute left-4 top-1/2 w-3 h-px bg-border/40" />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop Target Indicator */}
      {isDropTarget && (
        <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] z-50 rounded-full" />
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className={cn(
            "fixed z-[100] bg-popover border rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-200 elevation-2 min-w-[180px]",
          )}
          style={{
            left: isMobile ? '50%' : contextMenuPosition.x,
            top: contextMenuPosition.y,
            transform: isMobile ? 'translateX(-50%)' : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Actions
          </div>
          <button onClick={() => { duplicateItem(item.id); setShowContextMenu(false) }} className="w-full px-3 py-2 text-left hover:bg-accent text-sm flex items-center gap-2">
            <Icon icon={Copy01Icon} size="sm" /> Duplicate
          </button>
          <button onClick={() => { moveItemUp(item.id); setShowContextMenu(false) }} className="w-full px-3 py-2 text-left hover:bg-accent text-sm flex items-center gap-2">
            <Icon icon={ArrowUp01Icon} size="sm" /> Move Up
          </button>
          <button onClick={() => { moveItemDown(item.id); setShowContextMenu(false) }} className="w-full px-3 py-2 text-left hover:bg-accent text-sm flex items-center gap-2">
            <Icon icon={ArrowDown01Icon} size="sm" /> Move Down
          </button>
          <button onClick={() => { setShowContextMenu(false); setShowRefModal(true) }} className="w-full px-3 py-2 text-left hover:bg-accent text-sm flex items-center gap-2">
            <Icon icon={Link01Icon} size="sm" /> Link Sub-Checklist
          </button>
          <div className="h-px bg-border my-1" />
          <button onClick={() => { handleDelete(); setShowContextMenu(false) }} className="w-full px-3 py-2 text-left hover:bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <Icon icon={Delete02Icon} size="sm" /> Delete
          </button>
        </div>
      )}

      {showRefModal && (
        <InsertRefModal
          open={showRefModal}
          onOpenChange={setShowRefModal}
          onInsert={(config) => {
            updateItem(item.id, {
              text: config.title,
              type: 'ref',
              ref_config: {
                repo_id: config.repoId,
                title: config.title,
                execution_mode: config.executionMode
              }
            })
          }}
        />
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

export function DragOverlayItem({ item }: { item: ChecklistItemType }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card border-2 border-primary/30 rounded-xl shadow-2xl shadow-primary/20 elevation-3 opacity-90 backdrop-blur-sm">
      <Icon icon={DragDropVerticalIcon} className="h-4 w-4 text-primary" />
      <span className="text-base font-medium text-foreground">
        {item.text || <span className="text-muted-foreground italic">Empty item</span>}
      </span>
    </div>
  )
}
