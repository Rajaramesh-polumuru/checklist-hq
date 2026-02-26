import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import TaskDone01Icon from '@hugeicons/core-free-icons/TaskDone01Icon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import Globe02Icon from '@hugeicons/core-free-icons/Globe02Icon'
import GitForkIcon from '@hugeicons/core-free-icons/GitForkIcon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'
import { Icon } from '@/components/ui/icon'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'
import type { FilterState } from '@/lib/dashboard-utils'

interface DashboardStatsProps {
    loading?: boolean
    stats: {
        total: number
        activeRuns: number
        public: number
        forked: number
    }
    filters?: FilterState
    onFiltersChange?: (filters: FilterState) => void
}

export function DashboardStats({ loading = false, stats, filters, onFiltersChange }: DashboardStatsProps) {
    const navigate = useNavigate()

    const isPublicActive = filters?.visibility === 'public'
    const isForkedActive = filters?.type === 'forked'

    const handlePublicToggle = () => {
        if (!onFiltersChange || !filters) return
        onFiltersChange({ ...filters, visibility: isPublicActive ? 'all' : 'public' })
    }

    const handleForkedToggle = () => {
        if (!onFiltersChange || !filters) return
        onFiltersChange({ ...filters, type: isForkedActive ? 'all' : 'forked' })
    }
    const animatedTotal = useCountUp(stats.total, 800, !loading)
    const animatedActiveRuns = useCountUp(stats.activeRuns, 800, !loading)
    const animatedPublic = useCountUp(stats.public, 800, !loading)
    const animatedForked = useCountUp(stats.forked, 800, !loading)

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* Large skeleton - spans 2 columns */}
                <div className="col-span-1 sm:col-span-2 h-36 bg-gradient-to-br from-muted/30 to-muted/10 animate-pulse rounded-2xl border" />
                {/* Medium skeleton */}
                <div className="col-span-1 sm:col-span-1 h-28 bg-muted/20 animate-pulse rounded-xl border" />
                {/* Small skeletons stacked */}
                <div className="col-span-1 sm:col-span-1 space-y-3">
                    <div className="h-[3.25rem] bg-muted/20 animate-pulse rounded-xl border" />
                    <div className="h-[3.25rem] bg-muted/20 animate-pulse rounded-xl border" />
                </div>
            </div>
        )
    }

    // Mini sparkline data (decorative)
    const sparklineData = [40, 65, 45, 80, 55, 90, 75, 60, 85]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Large stat - Total Checklists - spans 2 columns */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="col-span-1 sm:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-4 sm:p-5"
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

            {/* Medium stat - Active Runs with pulse indicator — CLICKABLE */}
            <motion.button
                onClick={() => navigate('/app/runs')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                transition={{ delay: 0.05 }}
                className={cn(
                    "col-span-1 sm:col-span-1 relative overflow-hidden rounded-xl bg-card border p-4 text-left",
                    "cursor-pointer group",
                    "transition-all duration-200 ease-in-out",
                    "hover:shadow-lg hover:shadow-success/10 hover:border-success/30",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label={`View ${stats.activeRuns} active runs`}
            >
                {/* Hover glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />

                <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                        <div className={cn(
                            "h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center",
                            "transition-all duration-200",
                            "group-hover:scale-110 group-hover:bg-success/15"
                        )}>
                            <Icon icon={PlayIcon} className="h-3.5 w-3.5 text-success" />
                        </div>
                        <div className="flex items-center gap-2">
                            {animatedActiveRuns > 0 && (
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                                </span>
                            )}
                            {/* Directional arrow — appears on hover */}
                            <motion.div
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                initial={false}
                            >
                                <Icon icon={ArrowRight01Icon} className="h-4 w-4 text-success" />
                            </motion.div>
                        </div>
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

                    {/* Hover hint */}
                    <span className="text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground/70 transition-colors duration-200 mt-1.5 block">
                        View all runs →
                    </span>
                </div>
            </motion.button>

            {/* Small stats stacked — CLICKABLE FILTER TOGGLES */}
            <div className="col-span-1 sm:col-span-1 space-y-3">

                {/* Public filter toggle */}
                <motion.button
                    onClick={handlePublicToggle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={onFiltersChange ? { y: -2 } : {}}
                    whileTap={onFiltersChange ? { scale: 0.97 } : {}}
                    transition={{ delay: 0.1 }}
                    disabled={!onFiltersChange}
                    className={cn(
                        "w-full rounded-xl bg-card border p-3 text-left",
                        "transition-all duration-200 ease-in-out",
                        onFiltersChange && "cursor-pointer group",
                        !onFiltersChange && "cursor-default",
                        isPublicActive
                            ? "border-sky-500/50 bg-sky-500/5 shadow-md shadow-sky-500/10"
                            : onFiltersChange && "hover:shadow-md hover:border-sky-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                    aria-label={isPublicActive ? 'Clear public filter' : 'Filter by public repositories'}
                    aria-pressed={isPublicActive}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "h-6 w-6 rounded-md flex items-center justify-center transition-all duration-200",
                                isPublicActive
                                    ? "bg-sky-500/20 scale-110"
                                    : "bg-info/10 group-hover:bg-sky-500/15 group-hover:scale-110"
                            )}>
                                <Icon
                                    icon={Globe02Icon}
                                    className={cn(
                                        "h-3 w-3 transition-colors duration-200",
                                        isPublicActive ? "text-sky-500" : "text-info"
                                    )}
                                />
                            </div>
                            <span className={cn(
                                "text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200",
                                isPublicActive ? "text-sky-500" : "text-muted-foreground"
                            )}>
                                Public
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {isPublicActive && (
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/20"
                                >
                                    <Icon icon={Tick01Icon} className="h-2.5 w-2.5 text-sky-500" />
                                </motion.span>
                            )}
                            <span className={cn(
                                "text-xl font-bold tabular-nums transition-colors duration-200",
                                isPublicActive ? "text-sky-500" : ""
                            )}>
                                {animatedPublic}
                            </span>
                        </div>
                    </div>
                    {onFiltersChange && (
                        <span className={cn(
                            "text-[10px] transition-colors duration-200 mt-1 block",
                            isPublicActive
                                ? "text-sky-500/70"
                                : "text-muted-foreground/0 group-hover:text-muted-foreground/60"
                        )}>
                            {isPublicActive ? 'Filtering active — click to clear' : 'Click to filter →'}
                        </span>
                    )}
                </motion.button>

                {/* Forked filter toggle */}
                <motion.button
                    onClick={handleForkedToggle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={onFiltersChange ? { y: -2 } : {}}
                    whileTap={onFiltersChange ? { scale: 0.97 } : {}}
                    transition={{ delay: 0.15 }}
                    disabled={!onFiltersChange}
                    className={cn(
                        "w-full rounded-xl bg-card border p-3 text-left",
                        "transition-all duration-200 ease-in-out",
                        onFiltersChange && "cursor-pointer group",
                        !onFiltersChange && "cursor-default",
                        isForkedActive
                            ? "border-violet-500/50 bg-violet-500/5 shadow-md shadow-violet-500/10"
                            : onFiltersChange && "hover:shadow-md hover:border-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                    aria-label={isForkedActive ? 'Clear forked filter' : 'Filter by forked repositories'}
                    aria-pressed={isForkedActive}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "h-6 w-6 rounded-md flex items-center justify-center transition-all duration-200",
                                isForkedActive
                                    ? "bg-violet-500/20 scale-110"
                                    : "bg-violet-500/10 group-hover:bg-violet-500/20 group-hover:scale-110"
                            )}>
                                <Icon
                                    icon={GitForkIcon}
                                    className={cn(
                                        "h-3 w-3 transition-colors duration-200",
                                        isForkedActive ? "text-violet-400" : "text-violet-500"
                                    )}
                                />
                            </div>
                            <span className={cn(
                                "text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200",
                                isForkedActive ? "text-violet-400" : "text-muted-foreground"
                            )}>
                                Forked
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {isForkedActive && (
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500/20"
                                >
                                    <Icon icon={Tick01Icon} className="h-2.5 w-2.5 text-violet-400" />
                                </motion.span>
                            )}
                            <span className={cn(
                                "text-xl font-bold tabular-nums transition-colors duration-200",
                                isForkedActive ? "text-violet-400" : ""
                            )}>
                                {animatedForked}
                            </span>
                        </div>
                    </div>
                    {onFiltersChange && (
                        <span className={cn(
                            "text-[10px] transition-colors duration-200 mt-1 block",
                            isForkedActive
                                ? "text-violet-400/70"
                                : "text-muted-foreground/0 group-hover:text-muted-foreground/60"
                        )}>
                            {isForkedActive ? 'Filtering active — click to clear' : 'Click to filter →'}
                        </span>
                    )}
                </motion.button>
            </div>
        </div>
    )
}
