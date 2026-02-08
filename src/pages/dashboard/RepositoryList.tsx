import type { Repository, RepositoryWithTags } from '@/types/database'
import { RepositoryCard } from './RepositoryCard'
import { SkeletonCard } from '@/components/ui/skeleton'

interface RepositoryListProps {
    repositories: RepositoryWithTags[]
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
            {repositories.map((repo, index) => (
                <RepositoryCard
                    key={repo.id}
                    repo={repo}
                    index={index}
                    onRun={onRun}
                    onShare={onShare}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}
