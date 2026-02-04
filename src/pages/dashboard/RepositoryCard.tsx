import { Link } from 'react-router-dom'
import {
    MoreVertical,
    Pencil,
    Share2,
    Copy,
    Trash2,
    Clock,
    Play,
    GitBranch,

} from 'lucide-react'
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
import type { Repository } from '@/types/database'

interface RepositoryCardProps {
    repo: Repository
    onRun: (repo: Repository) => void
    onShare: (repo: Repository) => void
    onDuplicate: (repo: Repository) => void
    onDelete: (repoId: string, title: string) => void
}

export function RepositoryCard({
    repo,
    onRun,
    onShare,
    onDuplicate,
    onDelete
}: RepositoryCardProps) {
    const colorStatus = getRepoColorStatus(repo)
    const colorConfig = COLOR_LEGEND[colorStatus]
    const StatusIcon = colorConfig.icon

    return (
        <Card
            className="group hover:shadow-md transition-all duration-200 border-l-4 h-full flex flex-col"
            style={{
                borderLeftColor: colorStatus === 'dormant' ? undefined : `var(--${colorConfig.text.split('-')[1]}-400)`
            }}
        >
            <div className={`flex-1 flex flex-col ${colorStatus === 'dormant' ? 'opacity-70 hover:opacity-100' : ''}`}>
                <div className="p-4 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center shrink-0">
                            <StatusIcon className={`h-4 w-4 ${colorConfig.text}`} />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onRun(repo)}>
                                    <Play className="mr-2 h-4 w-4" /> Run
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to={`/app/repo/${repo.id}`}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onShare(repo)}>
                                    <Share2 className="mr-2 h-4 w-4" /> Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDuplicate(repo)}>
                                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem destructive onClick={() => onDelete(repo.id, repo.title)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Title & Desc */}
                    <Link to={`/app/repo/${repo.id}`} className="block group-hover:text-primary transition-colors">
                        <h3 className="font-semibold text-base mb-1 truncate" title={repo.title}>
                            {repo.title}
                        </h3>
                    </Link>

                    {repo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 h-10">
                            {repo.description}
                        </p>
                    )}

                    {/* Inline Stats / Badges */}
                    <div className="flex items-center gap-3 mt-auto text-xs text-muted-foreground flex-wrap">
                        <Badge variant="secondary" className="font-normal text-[10px] h-5 px-1.5">
                            {repo.is_public ? 'Public' : 'Private'}
                        </Badge>

                        {/* Fork Count */}
                        {repo.fork_count > 0 && (
                            <span className="flex items-center gap-1" title={`${repo.fork_count} forks`}>
                                <GitBranch className="h-3 w-3" />
                                {repo.fork_count}
                            </span>
                        )}

                        {/* Update time */}
                        <span className="flex items-center gap-1" title={`Updated ${new Date(repo.updated_at).toLocaleString()}`}>
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(repo.updated_at)}
                        </span>
                    </div>
                </div>

                {/* Quick Action Footer */}
                <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
                    <Button
                        size="sm"
                        variant="default"
                        className="w-full text-xs h-8"
                        onClick={() => onRun(repo)}
                    >
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                        Run Checklist
                    </Button>
                </div>
            </div>
        </Card>
    )
}
