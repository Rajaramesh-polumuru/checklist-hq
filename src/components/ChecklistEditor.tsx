import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { Card } from '@/components/ui/card'
import { Plus, ListChecks, Undo2, Redo2, Hand, Trash2, MoreVertical } from 'lucide-react'
import type { ChecklistItem as ChecklistItemType } from '@/types/database'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMobile'

// Rotating placeholder suggestions
const PLACEHOLDERS = [
  "Add a step...",
  "What's next?",
  "Add a task...",
  "Type to add...",
]

export function ChecklistEditor() {
  const {
    content,
    addItem,
    moveItem,
    getItemsAtLevel,
    getItemCount,
    getFilledItemCount,
    undo,
    redo,
    canUndo,
    canRedo,
    setFocusedItem,
  } = useChecklistStore()

  const isMobile = useIsMobile()
  const rootItems = getItemsAtLevel(null)
  const itemCount = getItemCount()
  const filledCount = getFilledItemCount()
  const progressPercent = itemCount > 0 ? Math.round((filledCount / itemCount) * 100) : 0

  const [quickAddValue, setQuickAddValue] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const quickAddRef = useRef<HTMLInputElement>(null)

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Configure sensors - add TouchSensor for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
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

    moveItem(
      active.id as string,
      overItem.parent,
      overItem.order + (activeItem.order > overItem.order ? 0 : 1)
    )
  }

  const handleQuickAdd = (text: string = quickAddValue) => {
    if (text.trim()) {
      addItem(text.trim())
      setQuickAddValue('')
      setTimeout(() => quickAddRef.current?.focus(), 50)
    }
  }

  const handleQuickAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickAddValue.trim()) {
      e.preventDefault()
      handleQuickAdd()
    } else if (e.key === 'Tab' && quickAddValue.trim()) {
      e.preventDefault()
      if (rootItems.length > 0) {
        const lastItem = rootItems[rootItems.length - 1]
        addItem(quickAddValue.trim(), lastItem.id)
        setQuickAddValue('')
      } else {
        handleQuickAdd()
      }
    } else if (e.key === 'ArrowUp' && rootItems.length > 0) {
      e.preventDefault()
      const allItems = getAllVisibleItems()
      if (allItems.length > 0) {
        setFocusedItem(allItems[allItems.length - 1].id)
      }
    }
  }

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text')
    const lines = pastedText.split('\n').map(l => l.trim()).filter(l => l)

    if (lines.length > 1) {
      e.preventDefault()
      lines.forEach((line) => {
        const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '')
        if (cleanLine) {
          addItem(cleanLine)
        }
      })
      setQuickAddValue('')
    }
  }, [addItem])

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

  const renderItems = (items: ChecklistItemType[], depth = 0, parentHasMoreSiblings: boolean[] = []): React.ReactNode[] => {
    return items.flatMap((item, index) => {
      const children = getItemsAtLevel(item.id)
      const isLast = index === items.length - 1
      const currentParentHasMoreSiblings = [...parentHasMoreSiblings, !isLast]

      return [
        <ChecklistItem
          key={item.id}
          item={item}
          depth={depth}
          isLast={isLast}
          parentHasMoreSiblings={parentHasMoreSiblings}
        />,
        ...renderItems(children, depth + 1, currentParentHasMoreSiblings),
      ]
    })
  }

  const allItemIds = Object.keys(content.items)

  // Global keyboard shortcuts (desktop only)
  useEffect(() => {
    if (isMobile) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      } else if (isMod && e.shiftKey && e.key === 'Z') {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, isMobile])

  return (
    <div className="space-y-4">
      {/* Progress bar - hide on mobile to save space */}
      {itemCount > 0 && !isMobile && (
        <div className="flex items-center gap-3 px-1 animate-fade-in">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {filledCount}/{itemCount} items
          </span>
        </div>
      )}

      {/* Undo/Redo toolbar - hide on mobile */}
      {itemCount > 0 && !isMobile && (
        <div className="flex items-center gap-1 px-1">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={cn(
              "p-1.5 rounded-md transition-colors text-muted-foreground",
              canUndo() ? "hover:bg-accent hover:text-foreground" : "opacity-40 cursor-not-allowed"
            )}
            title="Undo (⌘Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className={cn(
              "p-1.5 rounded-md transition-colors text-muted-foreground",
              canRedo() ? "hover:bg-accent hover:text-foreground" : "opacity-40 cursor-not-allowed"
            )}
            title="Redo (⌘⇧Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
          {rootItems.length === 0 ? (
            /* Empty state - optimized for mobile */
            <Card className="border-dashed border-2 bg-gradient-to-b from-muted/30 to-muted/10">
              <div className={cn(
                "text-center px-4",
                isMobile ? "py-10" : "py-16 px-6"
              )}>
                <div className={cn(
                  "mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center shadow-sm",
                  isMobile ? "w-14 h-14 mb-4" : "w-16 h-16 mb-6"
                )}>
                  <ListChecks className={cn(isMobile ? "h-7 w-7" : "h-8 w-8", "text-primary")} />
                </div>
                <h3 className={cn(
                  "font-semibold mb-2",
                  isMobile ? "text-lg" : "text-xl"
                )}>
                  Start building your checklist
                </h3>
                <p className={cn(
                  "text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed",
                  isMobile ? "text-sm" : "text-sm mb-8"
                )}>
                  {isMobile
                    ? "Tap below to add your first step."
                    : "Create a reusable process that your team can follow. Just start typing below."
                  }
                </p>

                {/* Quick add box for empty state */}
                <div className="max-w-md mx-auto">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className={cn(
                      "relative flex items-center gap-3 bg-card border-2 border-dashed border-primary/30 rounded-xl transition-all focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/10",
                      isMobile ? "px-4 py-4" : "px-4 py-3"
                    )}>
                      <Plus className={cn(isMobile ? "h-6 w-6" : "h-5 w-5", "text-primary/60")} />
                      <input
                        ref={quickAddRef}
                        type="text"
                        value={quickAddValue}
                        onChange={(e) => setQuickAddValue(e.target.value)}
                        onKeyDown={handleQuickAddKeyDown}
                        onPaste={handlePaste}
                        placeholder={PLACEHOLDERS[placeholderIndex]}
                        className={cn(
                          "flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50",
                          isMobile ? "text-base" : "text-base"
                        )}
                        autoFocus={!isMobile}
                      />
                    </div>
                  </div>
                </div>

                {/* Tips section - different for mobile vs desktop */}
                <div className={cn(
                  "pt-6 border-t border-dashed",
                  isMobile ? "mt-8" : "mt-10"
                )}>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-3">
                    <span className="font-medium">Quick tips</span>
                  </div>

                  {isMobile ? (
                    /* Mobile-specific touch tips */
                    <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center justify-center gap-2">
                        <Hand className="h-3.5 w-3.5" />
                        Long-press for options
                      </span>
                      <span className="flex items-center justify-center gap-2">
                        <MoreVertical className="h-3.5 w-3.5" />
                        Tap ⋮ to move or delete
                      </span>
                      <span className="flex items-center justify-center gap-2">
                        <Trash2 className="h-3.5 w-3.5" />
                        Swipe left in context menu to delete
                      </span>
                    </div>
                  ) : (
                    /* Desktop keyboard tips */
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono">Tab</kbd>
                        <span>indent</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono">Shift+Tab</kbd>
                        <span>outdent</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono">↑↓</kbd>
                        <span>navigate</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono">⌘Z</kbd>
                        <span>undo</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            /* Checklist items */
            <Card className="overflow-hidden divide-y divide-border/40">
              {renderItems(rootItems)}
            </Card>
          )}
        </SortableContext>
      </DndContext>

      {/* Quick add box when items exist - mobile optimized */}
      {rootItems.length > 0 && (
        <div className="relative group animate-fade-in">
          <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div
            className={cn(
              "relative flex items-center gap-3 bg-card/50 border border-dashed rounded-xl transition-all",
              "border-muted-foreground/20 hover:border-primary/30",
              "focus-within:border-primary focus-within:bg-card focus-within:shadow-md focus-within:shadow-primary/5",
              isMobile ? "px-4 py-4" : "px-4 py-3"
            )}
          >
            <Plus className={cn(
              "text-muted-foreground/60 group-focus-within:text-primary transition-colors",
              isMobile ? "h-5 w-5" : "h-4 w-4"
            )} />
            <input
              ref={quickAddRef}
              type="text"
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              onKeyDown={handleQuickAddKeyDown}
              onPaste={handlePaste}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              className={cn(
                "flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40",
                isMobile ? "text-base" : "text-sm"
              )}
            />
            {!isMobile && (
              <span className="text-[10px] text-muted-foreground/40 hidden sm:flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted/50 rounded text-[9px] font-mono">Enter</kbd>
                to add
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
