import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'
import Comment01Icon from '@hugeicons/core-free-icons/Comment01Icon'
import BrainIcon from '@hugeicons/core-free-icons/BrainIcon'
import Link01Icon from '@hugeicons/core-free-icons/Link01Icon'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { FormattedText } from '@/lib/rich-text'
import { useLongPress } from '@/hooks/useLongPress'
import { useIsMobile } from '@/hooks/useMobile'
import type { ChecklistItem, ItemProgress } from '@/types/database'

interface SimpleRunItemProps {
  item: ChecklistItem
  progress: ItemProgress | undefined
  depth: number
  isNext: boolean
  isFocused: boolean
  onToggle: (itemId: string, completed: boolean) => void
  onRequestNote: (itemId: string) => void
  readOnly?: boolean
  context?: Record<string, unknown>
}

export const SimpleRunItem = memo(function SimpleRunItem({
  item,
  progress,
  isNext,
  isFocused,
  onToggle,
  onRequestNote,
  readOnly = false,
  context = {},
}: SimpleRunItemProps) {
  const isCompleted = progress?.completed ?? false
  const isMobile = useIsMobile()
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = useCallback(() => {
    if (readOnly) return
    onToggle(item.id, !isCompleted)
  }, [readOnly, onToggle, item.id, isCompleted])

  const handleNoteRequest = useCallback(() => {
    onRequestNote(item.id)
  }, [onRequestNote, item.id])

  const longPressHandlers = useLongPress({
    threshold: 400,
    onLongPress: handleNoteRequest,
  })

  return (
    <motion.div
      layout
      data-item-id={item.id}
      className={cn(
        'group flex items-start gap-3 py-2.5 md:py-2 px-2 rounded-md transition-colors duration-200 outline-none cursor-pointer select-none',
        !isCompleted && isNext && 'bg-primary/5',
        !isCompleted && !isNext && 'hover:bg-muted/40',
        isCompleted && 'hover:bg-muted/20',
        isFocused && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={longPressHandlers.onContextMenu}
      onTouchStart={longPressHandlers.onTouchStart}
      onTouchEnd={longPressHandlers.onTouchEnd}
      onTouchMove={longPressHandlers.onTouchMove}
      role="checkbox"
      aria-checked={isCompleted}
      tabIndex={-1}
    >
      {/* Logo-style rounded square checkbox */}
      <div className="relative pt-0.5 shrink-0">
        <motion.div
          className={cn(
            'flex items-center justify-center h-5 w-5 rounded-[5px] border-[1.5px] transition-colors duration-200',
            isCompleted
              ? 'bg-primary border-primary'
              : isNext
                ? 'border-primary/60 group-hover:border-primary'
                : 'border-muted-foreground/30 group-hover:border-muted-foreground/50',
          )}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {isCompleted && (
              <motion.div
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Icon icon={Tick01Icon} size="xs" className="text-primary-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-px">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              'text-sm leading-relaxed transition-all duration-200',
              isCompleted
                ? 'text-muted-foreground line-through decoration-muted-foreground/40'
                : 'text-foreground',
            )}
          >
            {item.text ? (
              <FormattedText text={item.text} values={context} />
            ) : (
              <span className="italic text-muted-foreground">Untitled item</span>
            )}
          </span>

          {/* Inline indicators */}
          {item.type === 'ref' && item.ref_config && (
            <Icon icon={Link01Icon} size="xs" className="text-info shrink-0 mt-1" />
          )}
          {item.agent_config && (
            <Icon icon={BrainIcon} size="xs" className="text-purple-500 dark:text-purple-400 shrink-0 mt-1" />
          )}
        </div>

        {/* Details */}
        {item.details && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {item.details}
          </p>
        )}

        {/* Completion note preview */}
        {isCompleted && progress?.note && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1"
          >
            <Icon icon={Comment01Icon} size="xs" className="shrink-0" />
            <span className="italic truncate">{progress.note}</span>
          </motion.p>
        )}
      </div>

      {/* Note action (hover) */}
      {!readOnly && (
        <button
          className={cn(
            'shrink-0 p-1 rounded-md transition-opacity duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/60',
            isMobile || isHovered || progress?.note ? 'opacity-100' : 'opacity-0',
          )}
          onClick={(e) => {
            e.stopPropagation()
            handleNoteRequest()
          }}
          aria-label="Add note"
        >
          <Icon icon={Comment01Icon} size="sm" />
        </button>
      )}
    </motion.div>
  )
})
