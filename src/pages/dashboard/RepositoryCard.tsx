import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@/components/ui/icon'
import {
    MoreVerticalCircle01Icon,
    PencilEdit02Icon,
    Share08Icon,
    Copy01Icon,
    Delete02Icon,
    Clock01Icon,
    PlayIcon,
    GitBranchIcon,
} from '@hugeicons/core-free-icons'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getRepoColorStatus, COLOR_LEGEND } from '@/lib/dashboard-utils'
import { formatRelativeTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { Repository } from '@/types/database'

interface RepositoryCardProps {
    repo: Repository
    index?: number
    onRun: (repo: Repository) => void
    onShare: (repo: Repository) => void
    onDuplicate: (repo: Repository) => void
    onDelete: (repoId: string, title: string) => void
}

export function RepositoryCard({
    repo,
    index = 0,
    onRun,
    onShare,
    onDuplicate,
    onDelete
}: RepositoryCardProps) {
    const colorStatus = getRepoColorStatus(repo)
    const colorConfig = COLOR_LEGEND[colorStatus]
    const StatusIcon = colorConfig.icon

    const isPopular = colorStatus === 'popular'
    const isDormant = colorStatus === 'dormant'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
        >
            <Card
                className={cn(
                    "group relative overflow-hidden h-full flex flex-col",
                    "transition-all duration-300",
                    "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5",
                    isDormant && "opacity-70 hover:opacity-100"
                )}
            >
                {/* Gradient accent bar at top */}
                <div className={cn(
                    "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
                    colorStatus !== 'dormant' && `bg-gradient-to-r ${colorConfig.gradient}`,
                    "group-hover:h-1.5"
                )} />

                {/* Animated gradient border for popular items */}
                {isPopular && (
                    <div className="absolute inset-0 rounded-xl p-px bg-gradient-to-r from-amber-400/50 via-orange-400/50 to-amber-400/50 animate-gradient-x opacity-50 pointer-events-none" />
                )}

                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative flex-1 flex flex-col p-4 pt-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        {/* Status icon with scale animation */}
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                            "bg-muted/60",
                            "group-hover:scale-110 group-hover:shadow-md"
                        )}>
                            <StatusIcon className={cn("h-5 w-5", colorConfig.text)} />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                >
                                    <Icon icon={MoreVerticalCircle01Icon} className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => onRun(repo)}>
                                    <Icon icon={PlayIcon} className="mr-2 h-4 w-4" /> Run
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to={`/app/repo/${repo.id}`}>
                                        <Icon icon={PencilEdit02Icon} className="mr-2 h-4 w-4" /> Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onShare(repo)}>
                                    <Icon icon={Share08Icon} className="mr-2 h-4 w-4" /> Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDuplicate(repo)}>
                                    <Icon icon={Copy01Icon} className="mr-2 h-4 w-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem destructive onClick={() => onDelete(repo.id, repo.title)}>
                                    <Icon icon={Delete02Icon} className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Title with gradient on hover */}
                    <Link to={`/app/repo/${repo.id}`} className="block mb-1">
                        <h3
                            className={cn(
                                "font-semibold text-base truncate transition-all duration-300",
                                "group-hover:text-gradient-primary"
                            )}
                            title={repo.title}
                        >
                            {repo.title}
                        </h3>
                    </Link>

                    {/* Description */}
                    {repo.description ? (
                        <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-4 leading-relaxed min-h-[2.5rem]">
                            {repo.description}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground/50 italic mb-4 min-h-[2.5rem]">
                            No description
                        </p>
                    )}

                    {/* Metadata badges */}
                    <div className="flex items-center gap-2 mt-auto flex-wrap">
                        <Badge
                            variant="outline"
                            className="font-normal text-[10px] h-5 px-2 bg-background/50 backdrop-blur-sm"
                        >
                            {repo.is_public ? 'Public' : 'Private'}
                        </Badge>

                        {repo.fork_count > 0 && (
                            <Badge
                                variant="secondary"
                                className="font-normal text-[10px] h-5 px-2 gap-1"
                            >
                                <Icon icon={GitBranchIcon} className="h-2.5 w-2.5" />
                                {repo.fork_count}
                            </Badge>
                        )}

                        {colorStatus !== 'default' && colorStatus !== 'dormant' && (
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "font-normal text-[10px] h-5 px-2",
                                    colorConfig.text
                                )}
                            >
                                {colorConfig.label}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Premium footer with glassmorphism */}
                <div className="relative px-4 py-3 border-t bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 backdrop-blur-sm flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Icon icon={Clock01Icon} className="h-3 w-3" />
                        {formatRelativeTime(repo.updated_at)}
                    </span>

                    <Button
                        size="sm"
                        className="h-7 text-xs shadow-sm hover:shadow-md transition-shadow"
                        onClick={() => onRun(repo)}
                    >
                        <Icon icon={PlayIcon} className="mr-1 h-3 w-3" />
                        Run
                    </Button>
                </div>
            </Card>
        </motion.div>
    )
}
