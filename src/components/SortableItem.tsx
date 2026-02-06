import React, { createContext, useContext, useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface SortableItemContextProps {
    attributes: Record<string, any>
    listeners: Record<string, any> | undefined
    ref: (node: HTMLElement | null) => void
    isDragging: boolean
}

const SortableItemContext = createContext<SortableItemContextProps | undefined>(undefined)

export function useSortableItem() {
    const context = useContext(SortableItemContext)
    if (!context) {
        throw new Error('useSortableItem must be used within a SortableItem')
    }
    return context
}

interface SortableItemProps {
    id: string
    children: React.ReactNode
    className?: string
    data?: Record<string, any>
}

export function SortableItem({ id, children, className, data }: SortableItemProps) {
    const reducedMotion = useReducedMotion()
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, data })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    }

    const contextValue = useMemo(
        () => ({
            attributes,
            listeners,
            ref: setNodeRef,
            isDragging,
        }),
        [attributes, listeners, setNodeRef, isDragging]
    )

    // Disable scale/shadow animations when user prefers reduced motion
    const animateProps = reducedMotion
        ? { opacity: isDragging ? 0.8 : 1 }
        : isDragging
            ? { scale: 1.02, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }
            : { scale: 1, boxShadow: "none" }

    return (
        <SortableItemContext.Provider value={contextValue}>
            <motion.div
                ref={setNodeRef}
                style={style}
                className={cn(className, isDragging && "z-50")}
                layoutId={reducedMotion ? undefined : id}
                animate={animateProps}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
                {children}
            </motion.div>
        </SortableItemContext.Provider>
    )
}

export function SortableHandle({ className, children }: { className?: string, children: React.ReactNode }) {
    const { attributes, listeners } = useSortableItem()

    return (
        <div className={cn("cursor-grab touch-none", className)} {...attributes} {...listeners}>
            {children}
        </div>
    )
}
