import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import PauseIcon from '@hugeicons/core-free-icons/PauseIcon'
import { Icon } from '@/components/ui/icon'
import { formatRelativeTime } from '@/lib/date-utils'
import type { Run } from '@/types/database'

interface RunCardProps {
    run: Run & { repository: { title: string; owner_id: string }; duration_ms?: number }
}

// Format duration in a compact way
function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`
    }
    if (minutes > 0) {
        return `${minutes}m`
    }
    return `${seconds}s`
}

export function RunCard({ run }: RunCardProps) {
    const isPaused = run.status === 'paused'
    const isCompleted = run.status === 'completed'

    return (
        <Link to={`/app/run/${run.id}`}>
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isPaused ? 'border-warning/50' : ''}`}>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base flex items-center gap-2 min-w-0">
                            {isPaused ? (
                                <Icon icon={PauseIcon} className="h-4 w-4 text-warning shrink-0" />
                            ) : (
                                <Icon icon={PlayIcon} className="h-4 w-4 text-primary shrink-0" />
                            )}
                            <span className="truncate">
                                {run.name || run.repository.title}
                            </span>
                        </CardTitle>
                        {isPaused && (
                            <Badge variant="warning" className="text-xs shrink-0">
                                Paused
                            </Badge>
                        )}
                        {isCompleted && (
                            <Badge variant="success" className="text-xs shrink-0">
                                Done
                            </Badge>
                        )}
                    </div>
                    <CardDescription className="truncate">
                        {run.name ? run.repository.title : `Started ${formatRelativeTime(run.started_at)}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Icon icon={Clock01Icon} className="h-3 w-3" />
                            <span>
                                {run.duration_ms ? formatDuration(run.duration_ms) : formatRelativeTime(run.started_at)}
                            </span>
                        </div>
                        {isCompleted && (
                            <div className="flex items-center gap-1 text-success">
                                <Icon icon={CheckmarkCircle02Icon} className="h-3 w-3" />
                                <span>Completed</span>
                            </div>
                        )}
                        {isPaused && run.paused_at && (
                            <span className="text-xs text-warning">
                                Paused {formatRelativeTime(run.paused_at)}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
