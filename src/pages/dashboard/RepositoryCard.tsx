import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@/components/ui/icon'
import MoreVerticalCircle01Icon from '@hugeicons/core-free-icons/MoreVerticalCircle01Icon'
import PencilEdit02Icon from '@hugeicons/core-free-icons/PencilEdit02Icon'
import Share08Icon from '@hugeicons/core-free-icons/Share08Icon'
import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import GitBranchIcon from '@hugeicons/core-free-icons/GitBranchIcon'
import CheckListIcon from '@hugeicons/core-free-icons/CheckListIcon'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatRelativeTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { Repository, RepositoryWithTags } from '@/types/database'

// ─── Status Dot System ───────────────────────────────────────────────────────

type StatusDef = {
    key: string
    label: string
    /** Tailwind bg color for the filled circle */
    color: string
    /** Tailwind ring/border color */
    ring: string
}

const STATUS_DEFS: Record<string, StatusDef> = {
    needs_attention: {
        key: 'needs_attention',
        label: 'Needs Attention',
        color: 'bg-slate-400 dark:bg-slate-500',
        ring: 'ring-slate-300 dark:ring-slate-600',
    },
    template: {
        key: 'template',
        label: 'Template',
        color: 'bg-violet-500',
        ring: 'ring-violet-300 dark:ring-violet-700',
    },
    new: {
        key: 'new',
        label: 'New',
        color: 'bg-pink-400',
        ring: 'ring-pink-200 dark:ring-pink-700',
    },
    shared: {
        key: 'shared',
        label: 'Shared',
        color: 'bg-cyan-400',
        ring: 'ring-cyan-200 dark:ring-cyan-700',
    },
    popular: {
        key: 'popular',
        label: 'Popular',
        color: 'bg-amber-400',
        ring: 'ring-amber-200 dark:ring-amber-600',
    },
    active: {
        key: 'active',
        label: 'Active',
        color: 'bg-rose-400',
        ring: 'ring-rose-200 dark:ring-rose-700',
    },
}

/** Derive which statuses apply to a given repo */
function deriveStatuses(repo: RepositoryWithTags): StatusDef[] {
    const now = Date.now()
    const updatedAt = new Date(repo.updated_at).getTime()
    const createdAt = new Date(repo.created_at).getTime()
    const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24)
    const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24)

    const statuses: StatusDef[] = []

    // Needs Attention — dormant for > 30 days
    if (daysSinceUpdate > 30) statuses.push(STATUS_DEFS.needs_attention)

    // Template — it's the origin (no upstream parent) and others have forked it
    if (!repo.upstream_repo_id && repo.fork_count > 0)
        statuses.push(STATUS_DEFS.template)

    // New — created within 7 days
    if (daysSinceCreated <= 7) statuses.push(STATUS_DEFS.new)

    // Shared / Public
    if (repo.is_public) statuses.push(STATUS_DEFS.shared)

    // Popular — 3+ forks
    if (repo.fork_count >= 3) statuses.push(STATUS_DEFS.popular)

    // Active — updated in the last 7 days (but not brand-new)
    if (daysSinceUpdate <= 7 && daysSinceCreated > 7)
        statuses.push(STATUS_DEFS.active)

    // Always show at least one dot so the cluster is never empty
    // If none matched, fall back to "Needs Attention" (dormant)
    if (statuses.length === 0) statuses.push(STATUS_DEFS.needs_attention)

    // Cap at 4 visible dots for layout
    return statuses.slice(0, 4)
}

interface StatusDotClusterProps {
    repo: RepositoryWithTags
}

function StatusDotCluster({ repo }: StatusDotClusterProps) {
    const statuses = deriveStatuses(repo)
    const DOT = 12  // size-3 = 12px
    const OVERLAP = 5 // px each successive dot overlaps

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        aria-label={`Status: ${statuses.map(s => s.label).join(', ')}`}
                        className="relative flex items-center cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                        style={{
                            width: DOT + (statuses.length - 1) * (DOT - OVERLAP),
                            height: DOT,
                        }}
                    >
                        {statuses.map((status, i) => (
                            <span
                                key={status.key}
                                className={cn(
                                    'absolute size-3 rounded-full ring-2 ring-card',
                                    status.color,
                                )}
                                style={{
                                    left: i * (DOT - OVERLAP),
                                    zIndex: statuses.length - i,
                                }}
                            />
                        ))}
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="bottom"
                    align="start"
                    className="p-3 space-y-1.5"
                >
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                        Status Colors
                    </p>
                    {statuses.map(status => (
                        <div key={status.key} className="flex items-center gap-2">
                            <span
                                className={cn(
                                    'size-3 rounded-full ring-2 shrink-0',
                                    status.color,
                                    status.ring,
                                )}
                            />
                            <span className="text-xs text-foreground">{status.label}</span>
                        </div>
                    ))}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

interface RepositoryCardProps {
    repo: RepositoryWithTags
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
    const isPublic = repo.is_public
    const [tag] = repo.tags || [] // Get first tag if available

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="h-full"
        >
            <Card className="group relative h-full flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg border-border/60 bg-card/50 backdrop-blur-sm">

                <CardHeader className="pb-3 space-y-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                            <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5",
                                "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                            )}>
                                <Icon icon={CheckListIcon} className="size-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <Link to={`/app/repo/${repo.id}`} className="block focus:outline-none">
                                    <CardTitle className="text-base font-semibold leading-tight group-hover:text-primary transition-colors truncate">
                                        {repo.title}
                                    </CardTitle>
                                </Link>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <StatusDotCluster repo={repo} />
                                    <span className="flex items-center gap-1.5">
                                        <span className={cn(
                                            "size-2.5 rounded-full",
                                            isPublic ? "bg-green-500/80" : "bg-amber-500/80"
                                        )} />
                                        {isPublic ? 'Public' : 'Private'}
                                    </span>
                                    {repo.fork_count > 0 && (
                                        <>
                                            <span className="text-border">•</span>
                                            <span className="flex items-center gap-1">
                                                <Icon icon={GitBranchIcon} className="size-3" />
                                                {repo.fork_count}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 data-[state=open]:opacity-100"
                                    >
                                        <Icon icon={MoreVerticalCircle01Icon} className="size-4" />
                                        <span className="sr-only">Actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => onRun(repo)}>
                                        <Icon icon={PlayIcon} className="mr-2 size-4" /> Run Checklist
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to={`/app/repo/${repo.id}`}>
                                            <Icon icon={PencilEdit02Icon} className="mr-2 size-4" /> Edit
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onShare(repo)}>
                                        <Icon icon={Share08Icon} className="mr-2 size-4" /> Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(repo)}>
                                        <Icon icon={Copy01Icon} className="mr-2 size-4" /> Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        onClick={() => onDelete(repo.id, repo.title)}
                                    >
                                        <Icon icon={Delete02Icon} className="mr-2 size-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 pb-4 min-h-20">
                    <CardDescription className="line-clamp-3 text-sm leading-relaxed text-muted-foreground/80">
                        {repo.description || "No description provided."}
                    </CardDescription>
                </CardContent>

                <CardFooter className="pt-0 pb-4 flex items-center justify-between border-t border-border/40 bg-muted/5 mt-auto">
                    <div className="flex items-center gap-3 pt-3">
                        {tag && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-background/50 border-border/50 font-normal">
                                <span className="size-1.5 rounded-full mr-1.5" style={{ backgroundColor: tag.color || 'gray' }} />
                                {tag.name}
                            </Badge>
                        )}
                        <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", !tag && "ml-0")}>
                            <Icon icon={Clock01Icon} className="size-3.5" />
                            <span>{formatRelativeTime(repo.updated_at)}</span>
                        </div>
                    </div>

                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs font-medium opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 mt-3"
                        onClick={() => onRun(repo)}
                    >
                        <Icon icon={PlayIcon} className="mr-1.5 size-3.5" />
                        Run
                    </Button>
                </CardFooter>

            </Card>
        </motion.div>
    )
}
