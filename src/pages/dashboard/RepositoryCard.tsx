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
    CheckListIcon
} from '@hugeicons/core-free-icons'
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
import { formatRelativeTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { Repository, RepositoryWithTags } from '@/types/database'

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
