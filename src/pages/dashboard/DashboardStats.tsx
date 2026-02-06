import { motion } from 'framer-motion'
import { TaskDone01Icon, PlayIcon, Globe02Icon, GitForkIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

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
            <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Large skeleton - spans 2 columns */}
                <div className="col-span-4 sm:col-span-2 h-36 bg-gradient-to-br from-muted/30 to-muted/10 animate-pulse rounded-2xl border" />
                {/* Medium skeleton */}
                <div className="col-span-2 sm:col-span-1 h-28 bg-muted/20 animate-pulse rounded-xl border" />
                {/* Small skeletons stacked */}
                <div className="col-span-2 sm:col-span-1 space-y-3">
                    <div className="h-[3.25rem] bg-muted/20 animate-pulse rounded-xl border" />
                    <div className="h-[3.25rem] bg-muted/20 animate-pulse rounded-xl border" />
                </div>
            </div>
        )
    }

    // Mini sparkline data (decorative)
    const sparklineData = [40, 65, 45, 80, 55, 90, 75, 60, 85]

    return (
        <div className="grid grid-cols-4 gap-4 mb-8">
            {/* Large stat - Total Checklists - spans 2 columns */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="col-span-4 sm:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-5"
            >
                {/* Decorative orb */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                            <Icon icon={TaskDone01Icon} className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                            Total Checklists
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-3">
                        <span className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
                            {animatedTotal}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            repositories
                        </span>
                    </div>

                    {/* Mini sparkline visualization */}
                    <div className="mt-4 h-10 flex items-end gap-0.5">
                        {sparklineData.map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
                                className="flex-1 bg-primary/20 rounded-t hover:bg-primary/30 transition-colors"
                            />
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Medium stat - Active Runs with pulse indicator */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="col-span-2 sm:col-span-1 relative overflow-hidden rounded-xl bg-card border p-4 hover:shadow-md transition-shadow"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center">
                        <Icon icon={PlayIcon} className="h-3.5 w-3.5 text-success" />
                    </div>
                    {animatedActiveRuns > 0 && (
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                        </span>
                    )}
                </div>

                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Active Runs
                </span>

                <span className={cn(
                    "text-3xl font-bold tabular-nums mt-1 block",
                    animatedActiveRuns > 0 ? "text-success" : "text-muted-foreground"
                )}>
                    {animatedActiveRuns}
                </span>
            </motion.div>

            {/* Small stats stacked */}
            <div className="col-span-2 sm:col-span-1 space-y-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl bg-card border p-3 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-info/10 flex items-center justify-center">
                                <Icon icon={Globe02Icon} className="h-3 w-3 text-info" />
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Public
                            </span>
                        </div>
                        <span className="text-xl font-bold tabular-nums">{animatedPublic}</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-xl bg-card border p-3 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-violet-500/10 flex items-center justify-center">
                                <Icon icon={GitForkIcon} className="h-3 w-3 text-violet-500" />
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Forked
                            </span>
                        </div>
                        <span className="text-xl font-bold tabular-nums">{animatedForked}</span>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
