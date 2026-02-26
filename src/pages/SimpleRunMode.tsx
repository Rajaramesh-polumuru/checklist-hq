import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { getRunWithDetails, updateRunProgress, completeRun, startRunFromLatestCommit } from '@/services/run'
import { getRepository } from '@/services/repository'
import type { Run, Commit, ChecklistItem, RunProgress, Repository } from '@/types/database'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import ChampionIcon from '@hugeicons/core-free-icons/ChampionIcon'
import ArrowTurnBackwardIcon from '@hugeicons/core-free-icons/ArrowTurnBackwardIcon'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'

// ─── Single todo row ──────────────────────────────────────────────────────────

function TodoRow({
    item,
    completed,
    onToggle,
    index,
}: {
    item: ChecklistItem
    completed: boolean
    onToggle: (id: string, done: boolean) => void
    index: number
}) {
    return (
        <motion.button
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            onClick={() => onToggle(item.id, !completed)}
            className={cn(
                'w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-xl',
                'transition-colors duration-150',
                completed ? 'bg-muted/40' : 'hover:bg-muted/50 active:bg-muted/70',
            )}
        >
            {/* Tick circle */}
            <div className={cn(
                'h-6 w-6 rounded-full border-2 shrink-0 flex items-center justify-center',
                'transition-all duration-200',
                completed
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/30 hover:border-primary/60',
            )}>
                <AnimatePresence>
                    {completed && (
                        <motion.div
                            key="tick"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                            <Icon icon={Tick01Icon} className="h-3.5 w-3.5 text-primary-foreground" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Label */}
            <span className={cn(
                'text-base transition-colors duration-200 flex-1',
                completed ? 'line-through text-muted-foreground' : 'text-foreground',
            )}>
                {item.text || <span className="italic text-muted-foreground">Untitled</span>}
            </span>
        </motion.button>
    )
}

// ─── SimpleRunMode ────────────────────────────────────────────────────────────

export function SimpleRunMode() {
    const { runId, repoId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [repository, setRepository] = useState<Repository | null>(null)
    const [run, setRun] = useState<Run | null>(null)
    const [commit, setCommit] = useState<Commit | null>(null)
    const [progress, setProgress] = useState<RunProgress>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [completing, setCompleting] = useState(false)
    const [done, setDone] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                setLoading(true)
                setError(null)

                if (runId) {
                    const data = await getRunWithDetails(runId)
                    if (!data) { setError('Run not found'); return }
                    setRun(data.run)
                    setCommit(data.commit)
                    setProgress(data.run.progress)
                    const repo = await getRepository(data.run.repo_id)
                    setRepository(repo)
                    if (data.run.status === 'completed') setDone(true)
                } else if (repoId) {
                    const repo = await getRepository(repoId)
                    if (!repo) { setError('List not found'); return }
                    setRepository(repo)
                    const newRun = await startRunFromLatestCommit(repoId, user?.id)
                    const data = await getRunWithDetails(newRun.id)
                    if (data) {
                        setRun(data.run)
                        setCommit(data.commit)
                        setProgress(data.run.progress)
                    }
                    navigate(`/app/todos/run/${newRun.id}`, { replace: true })
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [runId, repoId, navigate, user?.id])

    const items = useMemo((): ChecklistItem[] => {
        if (!commit?.content?.items) return []
        return Object.values(commit.content.items).sort((a, b) => a.order - b.order)
    }, [commit])

    const completedCount = items.filter(i => progress[i.id]?.completed).length
    const total = items.length
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0

    const handleToggle = useCallback(async (itemId: string, completed: boolean) => {
        if (!run || !user) return

        setProgress(prev => ({
            ...prev,
            [itemId]: { completed, timestamp: new Date().toISOString(), user_id: user.id },
        }))

        try {
            await updateRunProgress(run.id, itemId, completed, user.id)
        } catch {
            setProgress(prev => {
                const next = { ...prev }
                delete next[itemId]
                return next
            })
        }
    }, [run, user])

    // Auto-complete when all ticked
    useEffect(() => {
        if (percent === 100 && run?.status !== 'completed' && !completing && !done && total > 0) {
            setCompleting(true)
            completeRun(run!.id)
                .then(() => {
                    setRun(prev => prev ? { ...prev, status: 'completed' } : null)
                    setDone(true)
                })
                .catch(() => {})
                .finally(() => setCompleting(false))
        }
    }, [percent, run, completing, done, total])

    const handleRunAgain = async () => {
        if (!repository) return
        setLoading(true)
        try {
            const newRun = await startRunFromLatestCommit(repository.id, user?.id)
            setDone(false)
            navigate(`/app/todos/run/${newRun.id}`, { replace: true })
        } catch {
            setError('Failed to start new run')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Icon icon={Loading02Icon} className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
                <p className="text-destructive">{error}</p>
                <Button onClick={() => navigate('/app/todos')} variant="outline">Back to My Lists</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 px-4 h-14 max-w-xl mx-auto w-full">
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
                        <Link to="/app/todos">
                            <Icon icon={ArrowLeft01Icon} className="h-5 w-5" />
                        </Link>
                    </Button>
                    <p className="font-semibold text-base truncate flex-1">
                        {repository?.title || 'Checklist'}
                    </p>
                    <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                        {completedCount}/{total}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-muted/50">
                    <motion.div
                        className="h-full bg-primary"
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                </div>
            </header>

            {/* Items */}
            <main className="flex-1 max-w-xl mx-auto w-full px-2 py-4">
                {done ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center gap-4 py-20 text-center"
                    >
                        <Icon icon={ChampionIcon} className="h-16 w-16 text-primary" />
                        <div>
                            <p className="text-xl font-bold">All done!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {total} item{total !== 1 ? 's' : ''} completed
                            </p>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <Button variant="outline" onClick={handleRunAgain} className="gap-2">
                                <Icon icon={ArrowTurnBackwardIcon} className="h-4 w-4" />
                                Run again
                            </Button>
                            <Button asChild>
                                <Link to="/app/todos">My Lists</Link>
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-1">
                        {items.map((item, i) => (
                            <TodoRow
                                key={item.id}
                                item={item}
                                completed={!!progress[item.id]?.completed}
                                onToggle={handleToggle}
                                index={i}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
