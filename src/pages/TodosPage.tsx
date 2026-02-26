import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth-store'
import { getUserRepositories, deleteRepository } from '@/services/repository'
import { startRunFromLatestCommit } from '@/services/run'
import { formatRelativeTime } from '@/lib/date-utils'
import { QuickListModal } from '@/components/QuickListModal'
import type { RepositoryWithTags } from '@/types/database'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import TaskDaily01Icon from '@hugeicons/core-free-icons/TaskDaily01Icon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import PencilEdit02Icon from '@hugeicons/core-free-icons/PencilEdit02Icon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import MoreVerticalCircle01Icon from '@hugeicons/core-free-icons/MoreVerticalCircle01Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'

// ─── TodoCard ────────────────────────────────────────────────────────────────

interface TodoCardProps {
    repo: RepositoryWithTags
    index: number
    onStart: (repoId: string) => void
    onDelete: (repoId: string, title: string) => void
    isStarting: boolean
}

function TodoCard({ repo, index, onStart, onDelete, isStarting }: TodoCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="h-full"
        >
            <Card className={cn(
                'group relative h-full flex flex-col overflow-hidden',
                'transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg',
                'border-border/60 bg-card/50 backdrop-blur-sm rounded-xl',
            )}>
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Icon container */}
                            <div className={cn(
                                'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                                'bg-primary/10 text-primary',
                                'group-hover:bg-primary group-hover:text-primary-foreground transition-colors',
                            )}>
                                <Icon icon={TaskDaily01Icon} className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold leading-tight truncate">
                                    {repo.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <Icon icon={Clock01Icon} className="h-3 w-3 shrink-0" />
                                    <span className="truncate">Updated {formatRelativeTime(repo.updated_at)}</span>
                                </p>
                            </div>
                        </div>

                        {/* 3-dot menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Icon icon={MoreVerticalCircle01Icon} className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem asChild>
                                    <Link to={`/app/repo/${repo.id}`}>
                                        <Icon icon={PencilEdit02Icon} className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => onDelete(repo.id, repo.title)}
                                >
                                    <Icon icon={Delete02Icon} className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="pb-3 flex-1">
                    {/* Placeholder progress bar — visual affordance that this is runnable */}
                    <Progress value={0} size="sm" className="mt-1 opacity-30" />
                </CardContent>

                <CardFooter className="pt-0 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                    >
                        <Link to={`/app/repo/${repo.id}`}>
                            <Icon icon={PencilEdit02Icon} className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                        </Link>
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onStart(repo.id)}
                        loading={isStarting}
                    >
                        <Icon icon={PlayIcon} className="h-3.5 w-3.5 mr-1.5" />
                        Start Run
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    )
}

// ─── TodosPage ────────────────────────────────────────────────────────────────

export function TodosPage() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [showModal, setShowModal] = useState(false)
    const [startingId, setStartingId] = useState<string | null>(null)

    const { data: lists = [], isLoading, error } = useQuery({
        queryKey: ['user-repositories', user?.id],
        queryFn: () => getUserRepositories(user!.id),
        enabled: !!user,
    })

    const handleStart = async (repoId: string) => {
        setStartingId(repoId)
        try {
            const run = await startRunFromLatestCommit(repoId, user?.id)
            navigate(`/app/run/${run.id}`)
        } catch {
            toast.error('Failed to start run. Please try again.')
        } finally {
            setStartingId(null)
        }
    }

    const handleDelete = async (repoId: string, title: string) => {
        try {
            await deleteRepository(repoId)
            queryClient.invalidateQueries({ queryKey: ['user-repositories', user?.id] })
            toast.success(`"${title}" deleted`)
        } catch {
            toast.error('Failed to delete. Please try again.')
        }
    }

    return (
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-6xl">
            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Lists</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Repeatable checklists you can run anytime
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                    New List
                </Button>
            </motion.div>

            {/* Loading skeletons */}
            {isLoading && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
                <div className="flex items-center gap-2 p-4 rounded-md bg-destructive/10 text-destructive text-sm">
                    <span>Failed to load your lists. Please refresh the page.</span>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && lists.length === 0 && (
                <EmptyState
                    icon={<Icon icon={TaskDaily01Icon} className="h-8 w-8" />}
                    title="No lists yet"
                    description="Create your first repeatable checklist to get started. Run it as many times as you need."
                    action={
                        <Button onClick={() => setShowModal(true)}>
                            <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                            Create a List
                        </Button>
                    }
                />
            )}

            {/* Card grid */}
            {!isLoading && !error && lists.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
                    {lists.map((repo, i) => (
                        <TodoCard
                            key={repo.id}
                            repo={repo}
                            index={i}
                            onStart={handleStart}
                            onDelete={handleDelete}
                            isStarting={startingId === repo.id}
                        />
                    ))}
                </div>
            )}

            {/* Quick list creation modal */}
            <QuickListModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
            />
        </div>
    )
}
