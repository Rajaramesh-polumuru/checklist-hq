import type { Repository } from '@/types/database'
import { RepositoryCard } from './RepositoryCard'
import { SkeletonCard } from '@/components/ui/skeleton'

interface RepositoryListProps {
    repositories: Repository[]
    loading: boolean
    onRun: (repo: Repository) => void
    onShare: (repo: Repository) => void
    onDuplicate: (repo: Repository) => void
    onDelete: (repoId: string, title: string) => void
}

export function RepositoryList({
    repositories,
    loading,
    onRun,
    onShare,
    onDuplicate,
    onDelete
}: RepositoryListProps) {
    if (loading) {
        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {repositories.map((repo) => (
                <RepositoryCard
                    key={repo.id}
                    repo={repo}
                    onRun={onRun}
                    onShare={onShare}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}
