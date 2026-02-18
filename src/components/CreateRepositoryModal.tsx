import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import { Icon } from '@/components/ui/icon'
import { createRepository, createCommit } from '@/services/repository'
import type { ChecklistContent } from '@/types/database'

interface CreateRepositoryModalProps {
    organizationId: string
    userId: string
    isOpen: boolean
    onClose: () => void
    onRepoCreated: () => void
}

export function CreateRepositoryModal({ organizationId, userId, isOpen, onClose, onRepoCreated }: CreateRepositoryModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setTitle('')
            setDescription('')
            setIsPublic(false)
            setError(null)
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title) return

        setLoading(true)
        setError(null)

        try {
            const firstItemId = crypto.randomUUID()
            const initialContent: ChecklistContent = {
                version: '1.0',
                items: {
                    [firstItemId]: {
                        id: firstItemId,
                        text: 'First Step',
                        details: 'This is your first step.',
                        parent: null,
                        order: 0
                    }
                }
            }

            // 1. Create Repository
            const repo = await createRepository({
                owner_id: userId,
                organization_id: organizationId,
                title,
                description,
                is_public: isPublic,
            })

            // 2. Create Initial Commit
            await createCommit({
                repo_id: repo.id,
                content: initialContent,
                message: 'Initial commit'
            })

            onRepoCreated()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create repository')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Checklist</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium">Checklist Title</label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Standup"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">Description</label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this checklist for?"
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="isPublic" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Make Public
                        </label>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !title}>
                            {loading ? <Icon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Checklist
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
