import { Link } from 'react-router-dom'
import type { ActivityItem } from '@/services/activity'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
    Activity01Icon,
    PlayIcon,
    GitForkIcon,
    GitCommitIcon,
    CheckmarkCircle02Icon
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { formatRelativeTime } from '@/lib/date-utils'

interface ActivityFeedProps {
    activities: ActivityItem[]
    loading?: boolean
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Icon icon={Activity01Icon} className="h-5 w-5" /> Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
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

    return (
        <Card className="h-full max-h-[500px] flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Icon icon={Activity01Icon} className="h-5 w-5 text-primary" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0 overflow-y-auto">
                <div className="h-full p-4 pt-0">
                    {activities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No recent activity.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activities.map((item) => {
                                let IconComponent = Activity01Icon
                                let iconColor = 'text-muted-foreground'
                                let bgColor = 'bg-muted'

                                switch (item.type) {
                                    case 'run_started':
                                        IconComponent = PlayIcon
                                        iconColor = 'text-blue-500'
                                        bgColor = 'bg-blue-100 dark:bg-blue-900/30'
                                        break
                                    case 'run_completed':
                                        IconComponent = CheckmarkCircle02Icon
                                        iconColor = 'text-green-500'
                                        bgColor = 'bg-green-100 dark:bg-green-900/30'
                                        break
                                    case 'repo_forked':
                                        IconComponent = GitForkIcon
                                        iconColor = 'text-purple-500'
                                        bgColor = 'bg-purple-100 dark:bg-purple-900/30'
                                        break
                                    case 'repo_created':
                                        IconComponent = GitCommitIcon
                                        iconColor = 'text-amber-500'
                                        bgColor = 'bg-amber-100 dark:bg-amber-900/30'
                                        break
                                }

                                return (
                                    <div key={item.id} className="flex gap-3 relative group">
                                        <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center shrink-0 z-10`}>
                                            <Icon icon={IconComponent} className={`h-4 w-4 ${iconColor}`} />
                                        </div>
                                        <div className="min-w-0 flex-1 pb-1">
                                            <p className="text-sm font-medium leading-none mb-1">
                                                {item.link ? (
                                                    <Link to={item.link} className="hover:underline hover:text-primary transition-colors">
                                                        {item.title}
                                                    </Link>
                                                ) : (
                                                    item.title
                                                )}
                                            </p>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <span>{formatRelativeTime(item.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
