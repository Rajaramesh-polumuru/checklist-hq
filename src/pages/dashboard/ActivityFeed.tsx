import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ActivityItem } from '@/services/activity'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Activity01Icon,
    PlayIcon,
    GitForkIcon,
    GitCommitIcon,
    CheckmarkCircle02Icon,
    ArrowRight01Icon
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { formatRelativeTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface ActivityFeedProps {
    activities: ActivityItem[]
    loading?: boolean
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex gap-4 pl-2">
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
        <Card className="h-full max-h-[500px] flex flex-col overflow-hidden">
            <CardHeader className="pb-2 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon icon={Activity01Icon} className="h-4 w-4 text-primary" />
                        </div>
                        Recent Activity
                    </CardTitle>
                    {activities.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5">
                            {activities.length}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-0">
                {activities.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                            <Icon icon={Activity01Icon} className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Activity will appear here as you work
                        </p>
                    </div>
                ) : (
                    <div className="relative p-4">
                        {/* Timeline connector line */}
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-border via-border/50 to-transparent" />

                        <div className="space-y-1">
                            {activities.map((item, index) => {
                                let IconComponent = Activity01Icon
                                let iconColor = 'text-muted-foreground'
                                let bgColor = 'bg-muted'

                                switch (item.type) {
                                    case 'run_started':
                                        IconComponent = PlayIcon
                                        iconColor = 'text-info'
                                        bgColor = 'bg-info/10'
                                        break
                                    case 'run_completed':
                                        IconComponent = CheckmarkCircle02Icon
                                        iconColor = 'text-success'
                                        bgColor = 'bg-success/10'
                                        break
                                    case 'repo_forked':
                                        IconComponent = GitForkIcon
                                        iconColor = 'text-violet-500'
                                        bgColor = 'bg-violet-500/10'
                                        break
                                    case 'repo_created':
                                        IconComponent = GitCommitIcon
                                        iconColor = 'text-amber-500'
                                        bgColor = 'bg-amber-500/10'
                                        break
                                }

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative"
                                    >
                                        {item.link ? (
                                            <Link
                                                to={item.link}
                                                className="flex gap-4 py-3 pl-2 -ml-2 rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <ActivityItemContent
                                                    IconComponent={IconComponent}
                                                    iconColor={iconColor}
                                                    bgColor={bgColor}
                                                    item={item}
                                                    hasLink
                                                />
                                            </Link>
                                        ) : (
                                            <div className="flex gap-4 py-3 pl-2 -ml-2">
                                                <ActivityItemContent
                                                    IconComponent={IconComponent}
                                                    iconColor={iconColor}
                                                    bgColor={bgColor}
                                                    item={item}
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

interface ActivityItemContentProps {
    IconComponent: any
    iconColor: string
    bgColor: string
    item: ActivityItem
    hasLink?: boolean
}

function ActivityItemContent({
    IconComponent,
    iconColor,
    bgColor,
    item,
    hasLink
}: ActivityItemContentProps) {
    return (
        <>
            {/* Activity icon with status ring */}
            <div className={cn(
                "relative z-10 h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-background shrink-0",
                bgColor
            )}>
                <Icon icon={IconComponent} className={cn("h-3.5 w-3.5", iconColor)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm font-medium leading-tight",
                    hasLink && "group-hover:text-primary transition-colors"
                )}>
                    {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(item.timestamp)}
                </p>
            </div>

            {/* Hover arrow indicator for linked items */}
            {hasLink && (
                <Icon
                    icon={ArrowRight01Icon}
                    className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0"
                />
            )}
        </>
    )
}
