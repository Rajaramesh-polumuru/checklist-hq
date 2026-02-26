import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/ui/icon'
import { useAuthStore } from '@/stores/auth-store'
import { createRepositoryWithCommit } from '@/services/repository'
import type { ChecklistContent, ChecklistItem } from '@/types/database'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import DragDropVerticalIcon from '@hugeicons/core-free-icons/DragDropVerticalIcon'

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState = 'idle' | 'creating' | 'error'

interface ListItem {
    id: string
    text: string
}

export interface QuickListModalProps {
    isOpen: boolean
    onClose: () => void
    onCreated?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createDefaultItems(): ListItem[] {
    return [
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
    ]
}

// ─── QuickListModal ───────────────────────────────────────────────────────────

export function QuickListModal({ isOpen, onClose, onCreated }: QuickListModalProps) {
    const { user } = useAuthStore()

    const [modalState, setModalState] = useState<ModalState>('idle')
    const [title, setTitle] = useState('')
    const [items, setItems] = useState<ListItem[]>(createDefaultItems)

    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
    const titleRef = useRef<HTMLInputElement | null>(null)

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setModalState('idle')
            setTitle('')
            setItems(createDefaultItems())
            setTimeout(() => titleRef.current?.focus(), 50)
        }
    }, [isOpen])

    // ── Item management ──────────────────────────────────────────────────────

    const addItem = useCallback(() => {
        const newItem: ListItem = { id: crypto.randomUUID(), text: '' }
        setItems(prev => [...prev, newItem])
        setTimeout(() => inputRefs.current[newItem.id]?.focus(), 50)
    }, [])

    const updateItem = useCallback((id: string, text: string) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, text } : i))
    }, [])

    const removeItem = useCallback((id: string) => {
        setItems(prev => {
            if (prev.length <= 1) return prev
            const idx = prev.findIndex(i => i.id === id)
            const next = prev.filter(i => i.id !== id)
            setTimeout(() => {
                const focusId = next[Math.max(0, idx - 1)]?.id
                if (focusId) inputRefs.current[focusId]?.focus()
            }, 50)
            return next
        })
    }, [])

    const handleItemKeyDown = useCallback((
        e: React.KeyboardEvent<HTMLInputElement>,
        index: number,
        id: string,
    ) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (index === items.length - 1) {
                addItem()
            } else {
                const nextId = items[index + 1]?.id
                if (nextId) inputRefs.current[nextId]?.focus()
            }
        } else if (e.key === 'Backspace' && items[index].text === '' && items.length > 1) {
            e.preventDefault()
            removeItem(id)
        }
    }, [items, addItem, removeItem])

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!title.trim() || !user) return
        setModalState('creating')

        const filledItems = items.filter(i => i.text.trim())
        const finalItems = filledItems.length > 0 ? filledItems : [items[0]]

        const content: ChecklistContent = {
            version: '1.0',
            items: Object.fromEntries(
                finalItems.map((item, idx) => [
                    item.id,
                    {
                        id: item.id,
                        text: item.text.trim() || 'New item',
                        parent: null,
                        order: idx * 100,
                    } satisfies ChecklistItem,
                ])
            ),
        }

        try {
            await createRepositoryWithCommit({
                ownerId: user.id,
                title: title.trim(),
                isPublic: false,
                content,
                message: 'Initial commit',
            })
            toast.success(`"${title.trim()}" created`)
            onCreated?.()
            onClose()
        } catch {
            setModalState('error')
        }
    }

    const canCreate = title.trim().length > 0 && modalState !== 'creating'

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Checklist</DialogTitle>
                    <DialogDescription>
                        Add a title and items. You can always edit or add more later.
                    </DialogDescription>
                </DialogHeader>

                {/* Creating state */}
                {modalState === 'creating' && (
                    <div className="py-8 text-center">
                        <Icon icon={Loading02Icon} className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Creating your list...</p>
                    </div>
                )}

                {/* Idle / error state */}
                {modalState !== 'creating' && (
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label htmlFor="list-title" className="text-sm font-medium">
                                List name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="list-title"
                                ref={titleRef}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        inputRefs.current[items[0]?.id]?.focus()
                                    }
                                }}
                                placeholder="e.g. Morning Routine, Deploy Checklist..."
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Items</label>
                            <div className="space-y-2">
                                <AnimatePresence initial={false}>
                                    {items.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon
                                                    icon={DragDropVerticalIcon}
                                                    className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-default"
                                                />
                                                <Input
                                                    ref={(el) => { inputRefs.current[item.id] = el }}
                                                    value={item.text}
                                                    onChange={(e) => updateItem(item.id, e.target.value)}
                                                    onKeyDown={(e) => handleItemKeyDown(e, index, item.id)}
                                                    placeholder={`Item ${index + 1}`}
                                                    className="h-8 text-sm flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        'h-8 w-8 shrink-0 text-muted-foreground',
                                                        'hover:text-destructive hover:bg-destructive/10',
                                                        items.length <= 1 && 'opacity-30 pointer-events-none',
                                                    )}
                                                    onClick={() => removeItem(item.id)}
                                                    tabIndex={-1}
                                                    aria-label="Remove item"
                                                >
                                                    <Icon icon={Cancel01Icon} className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 text-muted-foreground hover:text-foreground w-full justify-start pl-6"
                                onClick={addItem}
                                type="button"
                            >
                                <Icon icon={PlusSignIcon} className="h-3.5 w-3.5 mr-1.5" />
                                Add item
                            </Button>
                        </div>

                        {modalState === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-md bg-destructive/10 text-sm text-destructive"
                            >
                                Failed to create your list. Please try again.
                            </motion.div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={modalState === 'creating'}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!canCreate} loading={modalState === 'creating'}>
                        Create List
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
