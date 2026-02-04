import { useCountUp } from '@/hooks/useCountUp'

interface DashboardStatsProps {
    loading?: boolean
    stats: {
        total: number
        activeRuns: number
        public: number
        forked: number
    }
}

export function DashboardStats({ loading = false, stats }: DashboardStatsProps) {
    const animatedTotal = useCountUp(stats.total, 800, !loading)
    const animatedActiveRuns = useCountUp(stats.activeRuns, 800, !loading)
    const animatedPublic = useCountUp(stats.public, 800, !loading)
    const animatedForked = useCountUp(stats.forked, 800, !loading)

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-lg border" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-sm">
                <span className="text-sm text-muted-foreground font-medium">My Checklists</span>
                <span className="text-lg font-bold">{animatedTotal}</span>
            </div>
            <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-sm">
                <span className="text-sm text-muted-foreground font-medium">Active Runs</span>
                <span className="text-lg font-bold text-primary">{animatedActiveRuns}</span>
            </div>
            <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-sm">
                <span className="text-sm text-muted-foreground font-medium">Public</span>
                <span className="text-lg font-bold">{animatedPublic}</span>
            </div>
            <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-sm">
                <span className="text-sm text-muted-foreground font-medium">Forked</span>
                <span className="text-lg font-bold">{animatedForked}</span>
            </div>
        </div>
    )
}
