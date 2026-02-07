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
    const isPublic = repo.is_public

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="h-full"
        >
            <Card className="group relative h-full flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-border/60 bg-card/50 backdrop-blur-sm">

                <CardHeader className="pb-3 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                            )}>
                                <Icon icon={CheckListIcon} className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <Link to={`/app/repo/${repo.id}`} className="block focus:outline-none">
                                    <CardTitle className="text-base font-semibold leading-none group-hover:text-primary transition-colors">
                                        {repo.title}
                                    </CardTitle>
                                </Link>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="h-5 px-1.5 text-[10px] font-normal border-border/50 bg-background/50 text-muted-foreground"
                                    >
                                        {isPublic ? 'Public' : 'Private'}
                                    </Badge>
                                    {repo.fork_count > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="h-5 px-1.5 text-[10px] font-normal bg-muted/50 text-muted-foreground gap-1"
                                        >
                                            <Icon icon={GitBranchIcon} className="h-3 w-3" />
                                            {repo.fork_count}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 data-[state=open]:opacity-100"
                                >
                                    <Icon icon={MoreVerticalCircle01Icon} className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => onRun(repo)}>
                                    <Icon icon={PlayIcon} className="mr-2 h-4 w-4" /> Run Checklist
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
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => onDelete(repo.id, repo.title)}
                                >
                                    <Icon icon={Delete02Icon} className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                    <CardDescription className="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed">
                        {repo.description || "No description provided for this checklist."}
                    </CardDescription>
                </CardContent>

                <CardFooter className="pt-0 pb-4 flex items-center justify-between border-t border-border/40 bg-muted/5 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-3">
                        <Icon icon={Clock01Icon} className="h-3.5 w-3.5" />
                        <span>Updated {formatRelativeTime(repo.updated_at)}</span>
                    </div>

                    <Button
                        size="sm"
                        className="h-8 text-xs font-medium opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 mt-3"
                        onClick={() => onRun(repo)}
                    >
                        <Icon icon={PlayIcon} className="mr-1.5 h-3.5 w-3.5" />
                        Run
                    </Button>
                </CardFooter>

            </Card>
        </motion.div>
    )
}
