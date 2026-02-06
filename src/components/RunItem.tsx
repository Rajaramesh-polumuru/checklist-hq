import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckmarkCircle01Icon,
  PlayIcon,
  Comment01Icon,
  Note01Icon,
  Target01Icon,
  ArrowRight01Icon,
  Tick01Icon
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { FormattedText } from '@/lib/rich-text'
import { formatRelativeTime } from '@/lib/date-utils'
import type { ChecklistItem } from '@/types/database'

// --- Completion Note Dialog ---
interface CompletionNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (note?: string) => void
  itemText: string
}

export function CompletionNoteDialog({
  isOpen,
  onClose,
  onComplete,
  itemText,
}: CompletionNoteDialogProps) {
  const [note, setNote] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setNote('')
        textareaRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleComplete = () => {
    onComplete(note.trim() || undefined)
    setNote('')
  }


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleComplete()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon={CheckmarkCircle01Icon} className="h-5 w-5 text-success" />
            Mark as Complete
          </DialogTitle>
          <DialogDescription className="text-left">
            <span className="font-medium text-foreground">{itemText}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="completion-note" className="text-sm font-medium mb-2 flex items-center gap-2">
            <Icon icon={Note01Icon} className="h-4 w-4 text-muted-foreground" />
            Add a note (optional)
          </label>
          <Textarea
            id="completion-note"
            ref={textareaRef}
            value={note}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Any observations, blockers, or details to remember..."
            className="mt-2 min-h-[80px] resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Cmd/Ctrl+Enter</kbd> to complete
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleComplete} className="gap-2">
            <Icon icon={Tick01Icon} className="h-4 w-4" />
            Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Section Header ---
export function SectionHeader({
  item,
  childCount,
  completedChildCount,
}: {
  item: ChecklistItem
  childCount: number
  completedChildCount: number
}) {
  const isAllComplete = childCount > 0 && completedChildCount === childCount

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
      isAllComplete ? 'bg-success/10' : 'bg-muted/30'
    )}>
      <div className={cn(
        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
        isAllComplete ? 'bg-success/20' : 'bg-primary/10'
      )}>
        {isAllComplete ? (
          <Icon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-success" />
        ) : (
          <Icon icon={Target01Icon} className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          'font-semibold text-base',
          isAllComplete ? 'text-success' : 'text-foreground'
        )}>
          {item.text ? <FormattedText text={item.text} /> : 'Section'}
        </h3>
        {childCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {completedChildCount} of {childCount} completed
          </p>
        )}
      </div>
      {isAllComplete && (
        <Badge variant="success" className="text-xs">
          Complete
        </Badge>
      )}
    </div>
  )
}


// --- Main Run Item ---
interface RunItemProps {
  item: ChecklistItem
  progress: { completed: boolean; timestamp?: string; note?: string } | undefined
  depth: number
  onToggle: (itemId: string, completed: boolean, note?: string) => void
  stepNumber: number
  isNext: boolean
  isFocused: boolean
  totalSteps: number
  showStepNumber?: boolean
  readOnly?: boolean
}

export function RunItem({
  item,
  progress,
  depth,
  onToggle,
  stepNumber,
  isNext,
  isFocused,
  totalSteps,
  showStepNumber = true,
  readOnly = false
}: RunItemProps) {
  const isCompleted = progress?.completed ?? false
  const [showNoteDialog, setShowNoteDialog] = useState(false)

  const handleClick = () => {
    if (readOnly) return

    if (isCompleted) {
      onToggle(item.id, false)
    } else {
      setShowNoteDialog(true)
    }
  }

  const handleComplete = (note?: string) => {
    onToggle(item.id, true, note)
    setShowNoteDialog(false)
  }

  const isSubItem = depth > 0

  return (
    <>
      <motion.button
        layout
        onClick={handleClick}
        disabled={readOnly}
        className={cn(
          'w-full text-left group flex items-start gap-4 transition-all duration-200 outline-none',
          isSubItem ? 'p-3 rounded-xl' : 'p-4 rounded-2xl',
          isCompleted && 'bg-success/5 hover:bg-success/10',
          !isCompleted && isNext && 'bg-primary/5 ring-1 ring-primary/20 hover:bg-primary/10',
          !isCompleted && !isNext && 'hover:bg-muted/50',
          isFocused && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
        whileTap={{ scale: 0.99 }}
      >
        {/* Animated Checkbox */}
        <div className="relative pt-0.5 shrink-0">
          <div className={cn(
            "relative flex items-center justify-center transition-colors duration-300",
            isSubItem ? "h-5 w-5" : "h-6 w-6"
          )}>
            {/* Base Circle */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full border-2",
                isCompleted ? "border-success bg-success" : isNext ? "border-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
              )}
              animate={{
                scale: isCompleted ? 1 : 1,
                borderColor: isCompleted ? 'var(--color-success)' : isNext ? 'var(--color-primary)' : 'rgba(var(--muted-foreground), 0.3)'
              }}
            />

            {/* Icons with AnimatePresence */}
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <Icon icon={CheckmarkCircle01Icon} className={cn("text-white", isSubItem ? "h-3 w-3" : "h-4 w-4")} />
                </motion.div>
              ) : isNext ? (
                <motion.div
                  key="next"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Icon icon={PlayIcon} className={cn("text-primary", isSubItem ? "h-2 w-2" : "h-3 w-3")} />
                </motion.div>
              ) : (
                <motion.div key="empty" exit={{ scale: 0 }} />
              )}
            </AnimatePresence>
          </div>

          {/* Ping Effect for Next Item */}
          {isNext && !isCompleted && (
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header / Meta */}
          {(showStepNumber && !isSubItem) || (isSubItem && isNext && !isCompleted) ? (
            <div className="flex items-center gap-2">
              {showStepNumber && !isSubItem && (
                <span className={cn(
                  "text-xs font-medium uppercase tracking-wider",
                  isCompleted ? "text-success" : isNext ? "text-primary" : "text-muted-foreground"
                )}>
                  Step {stepNumber} of {totalSteps}
                </span>
              )}
              {isNext && !isCompleted && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">
                  NEXT
                </Badge>
              )}
            </div>
          ) : null}

          {/* Title with Strikethrough Animation */}
          <div className="relative">
            <motion.p
              className={cn(
                "font-medium leading-normal transition-colors duration-300",
                isSubItem ? "text-base" : "text-lg",
                isCompleted ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {item.text ? <FormattedText text={item.text} /> : <span className="italic text-muted-foreground">Untitled item</span>}
            </motion.p>
            {isCompleted && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                className="absolute top-1/2 left-0 h-0.5 bg-success/50 w-full"
              />
            )}
          </div>

          {/* Details */}
          {item.details && (
            <p className={cn("text-muted-foreground", isSubItem ? "text-xs" : "text-sm")}>
              {item.details}
            </p>
          )}

          {/* Completion Note */}
          {isCompleted && progress?.timestamp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-1"
            >
              <p className="text-xs text-success flex items-center gap-1.5 opacity-80">
                <Icon icon={CheckmarkCircle01Icon} size="sm" />
                Completed {formatRelativeTime(progress.timestamp)}
              </p>
              {progress.note && (
                <div className="mt-1.5 flex items-start gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/50">
                  <Icon icon={Comment01Icon} size="sm" className="mt-0.5" />
                  <span className="italic">{progress.note}</span>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Chevron */}
        {isNext && !isCompleted && !isSubItem && (
          <Icon icon={ArrowRight01Icon} className="h-5 w-5 text-primary shrink-0 self-center group-hover:translate-x-1 transition-transform" />
        )}

      </motion.button>

      <CompletionNoteDialog
        isOpen={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        onComplete={handleComplete}
        itemText={item.text || 'Untitled item'}
      />
    </>
  )
}
