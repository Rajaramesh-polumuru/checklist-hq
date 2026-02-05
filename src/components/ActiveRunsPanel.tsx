import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Play, Pause, Clock } from 'lucide-react'
import { formatRelativeTime } from '@/lib/date-utils'
import type { Run } from '@/types/database'

interface ActiveRunsPanelProps {
    runs: (Run & { repository: { title: string; owner_id: string } })[]
    loading?: boolean
    compact?: boolean
}

export function ActiveRunsPanel({ runs, loading, compact = false }: ActiveRunsPanelProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Play className="h-5 w-5" /> Active Runs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (runs.length === 0) {
        if (compact) return null // Hide if empty in compact mode

        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Play className="h-5 w-5 text-primary" /> Active Runs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No active runs.
                        <br />
                        Start one to see it here!
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full max-h-[500px] flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Active Runs
                    <span className="text-sm font-normal text-muted-foreground ml-auto">
                        {runs.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0 overflow-y-auto">
                <div className="h-full p-4 pt-0">
                    <div className="space-y-4">
                        {runs.map((run) => {
                            const isPaused = run.status === 'paused'
                            const Icon = isPaused ? Pause : Play
                            const iconColor = isPaused ? 'text-warning' : 'text-primary'
                            const bgColor = isPaused ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10'

                            return (
                                <div key={run.id} className="flex gap-3 relative group items-start">
                                    <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                                        <Icon className={`h-4 w-4 ${iconColor}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium leading-none mb-1.5 pt-1">
                                            <Link to={`/app/run/${run.id}`} className="hover:underline hover:text-primary transition-colors">
                                                {run.name || (run.status === 'active' ? "In Progress" : "Paused Run")}
                                            </Link>
                                        </p>
                                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatRelativeTime(run.last_activity_at || run.started_at)}
                                            </span>
                                            {isPaused && (
                                                <span className="text-warning">Paused</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
