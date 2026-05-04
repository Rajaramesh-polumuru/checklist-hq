import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useChecklistStore } from '@/stores/checklist-store'
import { ChecklistItem, DragOverlayItem } from './ChecklistItem'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import ArrowTurnBackwardIcon from '@hugeicons/core-free-icons/ArrowTurnBackwardIcon'
import ArrowTurnForwardIcon from '@hugeicons/core-free-icons/ArrowTurnForwardIcon'
import HandPointingDown02Icon from '@hugeicons/core-free-icons/HandPointingDown02Icon'
import MoreVerticalCircle01Icon from '@hugeicons/core-free-icons/MoreVerticalCircle01Icon'
import SparklesIcon from '@hugeicons/core-free-icons/SparklesIcon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import BulbIcon from '@hugeicons/core-free-icons/BulbIcon'
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

// Custom drop animation for smooth transitions
const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
}

import { SkeletonList } from '@/components/ui/skeleton'

export function ChecklistEditor({ loading = false }: { loading?: boolean }) {
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
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const quickAddRef = useRef<HTMLInputElement>(null)

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Configure sensors with better activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Increased to prevent accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Longer delay to distinguish from scroll
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setOverId(null)

    if (!over || active.id === over.id) return

    const activeItem = content.items[active.id as string]
    const overItem = content.items[over.id as string]

    if (!activeItem || !overItem) return

    // Calculate the target order based on drop position
    const targetOrder = overItem.order + (activeItem.order > overItem.order ? 0 : 1)

    moveItem(
      active.id as string,
      overItem.parent,
      targetOrder
    )
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setOverId(null)
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
  }, [addItem, setQuickAddValue])

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

  // Get the active item for the drag overlay
  const activeItem = activeId ? content.items[activeId] : null

  const renderItems = (items: ChecklistItemType[], depth = 0, parentHasMoreSiblings: boolean[] = []): React.ReactNode[] => {
    return items.flatMap((item, index) => {
      const children = getItemsAtLevel(item.id)
      const isLast = index === items.length - 1
      const currentParentHasMoreSiblings = [...parentHasMoreSiblings, !isLast]
      const isDragging = activeId === item.id
      const isOver = overId === item.id

      return [
        <ChecklistItem
          key={item.id}
          item={item}
          depth={depth}
          isLast={isLast}
          parentHasMoreSiblings={parentHasMoreSiblings}
          isDragging={isDragging}
          isDropTarget={isOver && !isDragging}
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

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonList count={5} />
      </div>
    )
  }

  return (
    <div id="onboarding-editor" className="space-y-4">
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
            <Icon icon={ArrowTurnBackwardIcon} className="h-4 w-4" />
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
            <Icon icon={ArrowTurnForwardIcon} className="h-4 w-4" />
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
          {rootItems.length === 0 ? (
            /* Empty state - welcoming and engaging */
            <Card className="border-dashed border-2 bg-gradient-to-b from-muted/30 to-muted/10 overflow-hidden">
              <div className={cn(
                "text-center px-4 relative",
                isMobile ? "py-10" : "py-12 px-8"
              )}>
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                </div>

                {/* Custom SVG illustration */}
                <div className={cn(
                  "mx-auto relative",
                  isMobile ? "w-20 h-20 mb-4" : "w-28 h-28 mb-6"
                )}>
                  <svg
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                  >
                    {/* Background circle */}
                    <circle cx="60" cy="60" r="56" className="fill-primary/10" />
                    <circle cx="60" cy="60" r="48" className="fill-primary/5" />

                    {/* Checklist paper */}
                    <rect x="32" y="24" width="56" height="72" rx="4" className="fill-card stroke-primary/30" strokeWidth="2" />

                    {/* Checklist lines with checkboxes */}
                    <rect x="40" y="36" width="10" height="10" rx="2" className="fill-primary/20 stroke-primary" strokeWidth="1.5" />
                    <path d="M42 41L44.5 43.5L48 39" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="54" y="38" width="26" height="4" rx="2" className="fill-muted-foreground/20" />

                    <rect x="40" y="52" width="10" height="10" rx="2" className="fill-primary/20 stroke-primary" strokeWidth="1.5" />
                    <path d="M42 57L44.5 59.5L48 55" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="54" y="54" width="22" height="4" rx="2" className="fill-muted-foreground/20" />

                    <rect x="40" y="68" width="10" height="10" rx="2" className="fill-muted/50 stroke-muted-foreground/30" strokeWidth="1.5" strokeDasharray="2 2" />
                    <rect x="54" y="70" width="18" height="4" rx="2" className="fill-muted-foreground/10" />

                    {/* Sparkle accent */}
                    <circle cx="92" cy="32" r="8" className="fill-primary/20" />
                    <path d="M92 26V38M86 32H98" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Title with icon */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon icon={SparklesIcon} className={cn("text-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
                  <h3 className={cn(
                    "font-semibold",
                    isMobile ? "text-lg" : "text-xl"
                  )}>
                    Create Your First Checklist
                  </h3>
                </div>

                <p className={cn(
                  "text-muted-foreground max-w-sm mx-auto leading-relaxed",
                  isMobile ? "text-sm mb-5" : "text-sm mb-6"
                )}>
                  {isMobile
                    ? "Build a reusable process in seconds."
                    : "Build a reusable process that you and your team can follow every time."
                  }
                </p>

                {/* Primary CTA button */}
                <Button
                  onClick={() => quickAddRef.current?.focus()}
                  size={isMobile ? "default" : "lg"}
                  className="mb-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                >
                  <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                  Create First Item
                  <Icon icon={ArrowRight01Icon} className="h-4 w-4 ml-2" />
                </Button>

                {/* Quick add input (alternative to button) */}
                <div className="max-w-md mx-auto">
                  <p className="text-xs text-muted-foreground mb-2">or start typing below</p>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className={cn(
                      "relative flex items-center gap-3 bg-card border-2 border-dashed border-muted-foreground/20 rounded-xl transition-all focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/10",
                      isMobile ? "px-4 py-4" : "px-4 py-3"
                    )}>
                      <Icon icon={PlusSignIcon} className={cn(isMobile ? "h-6 w-6" : "h-5 w-5", "text-muted-foreground/40 group-focus-within:text-primary transition-colors")} />
                      <input
                        ref={quickAddRef}
                        type="text"
                        value={quickAddValue}
                        onChange={(e) => setQuickAddValue(e.target.value)}
                        onKeyDown={handleQuickAddKeyDown}
                        onPaste={handlePaste}
                        placeholder={PLACEHOLDERS[placeholderIndex]}
                        className={cn(
                          "flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 rounded-sm transition-all duration-200",
                          "outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none",
                          isMobile ? "text-base" : "text-base"
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Tips section - mini tutorial */}
                <div className={cn(
                  "pt-6 border-t border-dashed border-muted-foreground/20",
                  isMobile ? "mt-8" : "mt-8"
                )}>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                    <Icon icon={BulbIcon} className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">Pro tips to get started</span>
                  </div>

                  {isMobile ? (
                    /* Mobile-specific touch tips */
                    <div className="grid gap-3 text-xs text-muted-foreground max-w-xs mx-auto">
                      <div className="flex items-start gap-3 text-left bg-muted/30 rounded-lg p-3">
                        <Icon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">Tap to add</span>
                          <p className="text-muted-foreground mt-0.5">Tap the button or input to add your first item</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-left bg-muted/30 rounded-lg p-3">
                        <Icon icon={HandPointingDown02Icon} className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">Long-press for options</span>
                          <p className="text-muted-foreground mt-0.5">Hold an item to indent, outdent, or delete</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-left bg-muted/30 rounded-lg p-3">
                        <Icon icon={MoreVerticalCircle01Icon} className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">Drag to reorder</span>
                          <p className="text-muted-foreground mt-0.5">Use the handle to rearrange items</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Desktop keyboard tips - more visual */
                    <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto text-xs">
                      <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 text-left">
                        <kbd className="px-2 py-1 bg-card rounded border text-[10px] font-mono shrink-0 shadow-sm">Enter</kbd>
                        <span className="text-muted-foreground">Add new item below</span>
                      </div>
                      <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 text-left">
                        <kbd className="px-2 py-1 bg-card rounded border text-[10px] font-mono shrink-0 shadow-sm">Tab</kbd>
                        <span className="text-muted-foreground">Indent (create sub-item)</span>
                      </div>
                      <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 text-left">
                        <div className="flex gap-0.5 shrink-0">
                          <kbd className="px-1.5 py-1 bg-card rounded border text-[10px] font-mono shadow-sm">↑</kbd>
                          <kbd className="px-1.5 py-1 bg-card rounded border text-[10px] font-mono shadow-sm">↓</kbd>
                        </div>
                        <span className="text-muted-foreground">Navigate items</span>
                      </div>
                      <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 text-left">
                        <kbd className="px-2 py-1 bg-card rounded border text-[10px] font-mono shrink-0 shadow-sm">⌘Z</kbd>
                        <span className="text-muted-foreground">Undo changes</span>
                      </div>
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

        {/* Drag Overlay - floating preview of dragged item */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeItem ? (
            <DragOverlayItem item={activeItem} />
          ) : null}
        </DragOverlay>
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
            <Icon icon={PlusSignIcon} className={cn(
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
                  "flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/40 rounded-sm transition-all duration-200",
                  "outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none",
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
