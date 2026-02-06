import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { getUserRepositories, deleteRepository } from '@/services/repository'
import type { Repository } from '@/types/database'
import { getMyActiveRuns, getMyCompletedRuns } from '@/services/run'
import { getUserActivity, type ActivityItem } from '@/services/activity'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SearchInput } from '@/components/SearchInput'
import { SkeletonCard } from '@/components/ui/skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/lib/date-utils'
import { GDPRTools } from '@/components/GDPRTools'
import {
    Loading02Icon,
    GitForkIcon,
    Globe02Icon,
    LockKeyIcon,
    Calendar01Icon,
    PlayIcon,
    CheckmarkCircle02Icon,
    PlusSignIcon,
    CheckListIcon,
    ArrowUpRight01Icon,
    StarIcon,
    FlashIcon,
    Clock01Icon,
    ArrowRight01Icon,
    Settings02Icon,
    Notification01Icon,
    Download01Icon,
    Shield01Icon,
    MoreVerticalCircle01Icon,
    PencilEdit02Icon,
    Delete02Icon,
    Activity01Icon,
    SparklesIcon,
    Target01Icon,
    Analytics01Icon,
    Mail01Icon,
    Logout02Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { ApiKeyManager } from '@/components/ApiKeyManager'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { variants, staticVariants, transitions } from '@/lib/motion'

interface Achievement {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    color: string
    bgColor: string
    borderColor: string
    checkColor: string
    earned: boolean
    progress?: number
    total?: number
}

// Stats card component with motion
function StatCard({
    icon: IconSymbol,
    label,
    value,
    subLabel,
    color,
    bgColor,
    trend,
    index = 0,
}: {
    icon: any
    label: string
    value: number | string
    subLabel?: string
    color: string
    bgColor: string
    trend?: { value: number; positive: boolean }
    index?: number
}) {
    const reducedMotion = useReducedMotion()
    const cardVariants = reducedMotion ? staticVariants.cardHover : variants.cardHover

    return (
        <motion.div
            className="bg-card border rounded-2xl p-5 group cursor-default"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.default, delay: index * 0.1 }}
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
        >
            <div className="flex items-start justify-between">
                <motion.div
                    className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center`}
                    whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                    transition={transitions.fast}
                >
                    <Icon icon={IconSymbol} className={`h-6 w-6 ${color}`} />
                </motion.div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                        <Icon icon={ArrowUpRight01Icon} className={`h-3 w-3 ${!trend.positive && 'rotate-180'}`} />
                        {trend.value}%
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
                {subLabel && (
                    <p className="text-xs text-muted-foreground/70 mt-1">{subLabel}</p>
                )}
            </div>
        </motion.div>
    )
}

// Achievement badge component with motion - redesigned for accessibility
function AchievementBadge({ achievement, index = 0 }: { achievement: Achievement; index?: number }) {
    const reducedMotion = useReducedMotion()

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...transitions.default, delay: index * 0.05 }}
            whileHover={reducedMotion ? {} : { scale: 1.02, y: -2 }}
            className={`relative p-4 rounded-2xl border-2 cursor-default transition-colors ${achievement.earned
                ? `bg-card ${achievement.borderColor} shadow-sm`
                : 'bg-muted/20 border-dashed border-muted-foreground/20 opacity-70 hover:opacity-90'
                }`}
        >
            <div className="flex items-start gap-3">
                <motion.div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${achievement.earned ? achievement.bgColor : 'bg-muted'}`}
                    whileHover={reducedMotion ? {} : { rotate: achievement.earned ? 10 : 0 }}
                    transition={transitions.fast}
                >
                    {achievement.icon}
                </motion.div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-foreground">
                            {achievement.title}
                        </h4>
                        {achievement.earned && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.2 }}
                            >
                                <Icon icon={CheckmarkCircle02Icon} className={`h-4 w-4 ${achievement.checkColor}`} />
                            </motion.div>
                        )}
                    </div>
                    <p className="text-xs mt-0.5 text-muted-foreground">
                        {achievement.description}
                    </p>
                    {!achievement.earned && achievement.progress !== undefined && achievement.total !== undefined && (
                        <div className="mt-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{achievement.progress}/{achievement.total}</span>
                            </div>
                            <Progress value={(achievement.progress / achievement.total) * 100} className="h-1.5" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// Activity item component
function ActivityTimelineItem({ item, isLast }: { item: ActivityItem; isFirst?: boolean; isLast: boolean }) {
    const getIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'run_started':
                return <Icon icon={PlayIcon} className="h-4 w-4 text-sky-500" />
            case 'run_completed':
                return <Icon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-emerald-500" />
            case 'repo_forked':
                return <Icon icon={GitForkIcon} className="h-4 w-4 text-violet-500" />
            case 'repo_created':
                return <Icon icon={PlusSignIcon} className="h-4 w-4 text-amber-500" />
        }
    }

    const getColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'run_started':
                return 'bg-sky-100 border-sky-300'
            case 'run_completed':
                return 'bg-emerald-100 border-emerald-300'
            case 'repo_forked':
                return 'bg-violet-100 border-violet-300'
            case 'repo_created':
                return 'bg-amber-100 border-amber-300'
        }
    }

    return (
        <div className="flex gap-4 group">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full ${getColor(item.type)} border-2 flex items-center justify-center z-10 group-hover:scale-110 transition-transform`}>
                    {getIcon(item.type)}
                </div>
                {!isLast && (
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-border to-transparent" />
                )}
            </div>

            {/* Content */}
            <Link
                to={item.link}
                className="flex-1 pb-6 group/link"
            >
                <div className="bg-card border rounded-xl p-4 hover:shadow-md hover:border-primary/20 transition-all">
                    <p className="font-medium group-hover/link:text-primary transition-colors">
                        {item.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {formatRelativeTime(item.timestamp)}
                    </p>
                </div>
            </Link>
        </div>
    )
}

// Settings panel component
function SettingsPanel({ onExport, isExporting }: { onExport: () => void; isExporting: boolean }) {
    const { signOut } = useAuthStore()
    const navigate = useNavigate()
    const [privacyOpen, setPrivacyOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        navigate('/')
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon icon={Settings02Icon} className="h-5 w-5 text-primary" />
                    Settings & Preferences
                </CardTitle>
                <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {/* Export Data */}
                    <button
                        onClick={onExport}
                        disabled={isExporting}
                        className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Icon icon={Download01Icon} className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-medium">Export My Data</p>
                                <p className="text-sm text-muted-foreground">Download all your checklists as JSON</p>
                            </div>
                        </div>
                        {isExporting ? (
                            <Icon icon={Loading02Icon} className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <Icon icon={ArrowRight01Icon} className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        )}
                    </button>

                    {/* Privacy — collapsible with GDPR tools */}
                    <button
                        onClick={() => setPrivacyOpen(o => !o)}
                        className="w-full p-4 flex items-center justify-between hover:bg-sky-50 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
                                <Icon icon={Shield01Icon} className="h-5 w-5 text-sky-600" />
                            </div>
                            <div>
                                <p className="font-medium">Privacy & Security</p>
                                <p className="text-sm text-muted-foreground">
                                    {privacyOpen ? 'Data export · Account deletion' : 'Signed in with Google'}
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className={privacyOpen ? 'text-sky-600 border-sky-300 bg-sky-50' : 'text-emerald-600 border-emerald-300 bg-emerald-50'}>
                            <Icon icon={CheckmarkCircle02Icon} className="h-3 w-3 mr-1" />
                            {privacyOpen ? 'Close ▲' : 'Secured'}
                        </Badge>
                    </button>

                    {privacyOpen && (
                        <div className="px-4 pb-4 border-t border-sky-100 pt-4 bg-sky-50/30">
                            <GDPRTools />
                        </div>
                    )}

                    {/* Notifications */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                <Icon icon={Notification01Icon} className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="font-medium">Notifications</p>
                                <p className="text-sm text-muted-foreground">Run reminders and updates</p>
                            </div>
                        </div>
                        <Badge variant="outline">Coming Soon</Badge>
                    </div>

                    {/* Sign Out */}
                    <button
                        onClick={handleSignOut}
                        className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                <Icon icon={Logout02Icon} className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-medium text-red-600">Sign Out</p>
                                <p className="text-sm text-muted-foreground">Sign out of your account</p>
                            </div>
                        </div>
                        <Icon icon={ArrowRight01Icon} className="h-5 w-5 text-red-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}

// Checklist card component with motion
function ChecklistCard({ repo, onDelete, index = 0 }: { repo: Repository; onDelete: (id: string) => void; index?: number }) {
    const reducedMotion = useReducedMotion()
    const cardVariants = reducedMotion ? staticVariants.cardHover : variants.cardHover

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.default, delay: index * 0.05 }}
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
        >
            <Card className="group relative overflow-hidden h-full">
                {/* Accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${repo.is_public
                    ? 'bg-gradient-to-r from-sky-400 to-cyan-400'
                    : 'bg-gradient-to-r from-violet-400 to-purple-400'
                    }`} />

            <Link to={`/app/repo/${repo.id}`}>
                <CardHeader className="pb-3 pt-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className={`h-10 w-10 rounded-lg ${repo.is_public ? 'bg-sky-100' : 'bg-violet-100'
                            } flex items-center justify-center shrink-0`}>
                            {repo.is_public ? (
                                <Icon icon={Globe02Icon} className="h-5 w-5 text-sky-600" />
                            ) : (
                                <Icon icon={LockKeyIcon} className="h-5 w-5 text-violet-600" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{repo.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant={repo.is_public ? 'default' : 'secondary'} className="text-xs">
                                    {repo.is_public ? 'Public' : 'Private'}
                                </Badge>
                                {repo.upstream_repo_id && (
                                    <Badge variant="outline" className="text-xs text-violet-500 border-violet-300">
                                        <Icon icon={GitForkIcon} className="h-3 w-3 mr-1" />
                                        Forked
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    {repo.description && (
                        <CardDescription className="mt-3 line-clamp-2">
                            {repo.description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Icon icon={Clock01Icon} className="h-3.5 w-3.5" />
                            {formatRelativeTime(repo.updated_at)}
                        </span>
                        {repo.fork_count > 0 && (
                            <span className="flex items-center gap-1">
                                <Icon icon={GitForkIcon} className="h-3 w-3" />
                                {repo.fork_count}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Link>

            {/* Actions dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="absolute top-3 right-3 p-2 rounded-md bg-card/90 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm"
                        onClick={(e) => e.preventDefault()}
                    >
                        <Icon icon={MoreVerticalCircle01Icon} className="h-4 w-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                        <Link to={`/app/repo/${repo.id}`}>
                            <Icon icon={PencilEdit02Icon} className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to={`/app/run/start/${repo.id}`}>
                            <Icon icon={PlayIcon} className="mr-2 h-4 w-4" />
                            Start Run
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => onDelete(repo.id)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Icon icon={Delete02Icon} className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </Card>
        </motion.div>
    )
}

export function Profile() {
    const { user } = useAuthStore()
    const [repos, setRepos] = useState<Repository[]>([])
    const [stats, setStats] = useState({ activeRuns: 0, completedRuns: 0 })
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isExporting, setIsExporting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'overview' | 'checklists' | 'activity' | 'settings' | 'integrations'>('overview')

    // Filtered repos based on search
    const filteredRepos = useMemo(() => {
        if (!searchQuery.trim()) return repos
        const query = searchQuery.toLowerCase()
        return repos.filter(repo =>
            repo.title.toLowerCase().includes(query) ||
            repo.description?.toLowerCase().includes(query)
        )
    }, [repos, searchQuery])

    // Calculate achievements based on user data
    const achievements = useMemo((): Achievement[] => {
        const totalChecklists = repos.length
        const publicChecklists = repos.filter(r => r.is_public).length
        const forkedChecklists = repos.filter(r => r.upstream_repo_id).length
        const totalForks = repos.reduce((sum, r) => sum + r.fork_count, 0)
        const totalCompleted = stats.completedRuns

        return [
            {
                id: 'first_checklist',
                title: 'Getting Started',
                description: 'Create your first checklist',
                icon: <Icon icon={SparklesIcon} className="h-5 w-5 text-amber-600" />,
                color: 'text-amber-600',
                bgColor: 'bg-amber-100',
                borderColor: 'border-amber-300',
                checkColor: 'text-amber-600',
                earned: totalChecklists >= 1,
            },
            {
                id: 'first_run',
                title: 'Runner',
                description: 'Complete your first run',
                icon: <Icon icon={Target01Icon} className="h-5 w-5 text-emerald-600" />,
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-100',
                borderColor: 'border-emerald-300',
                checkColor: 'text-emerald-600',
                earned: totalCompleted >= 1,
            },
            {
                id: 'five_checklists',
                title: 'Organizer',
                description: 'Create 5 checklists',
                icon: <Icon icon={CheckListIcon} className="h-5 w-5 text-sky-600" />,
                color: 'text-sky-600',
                bgColor: 'bg-sky-100',
                borderColor: 'border-sky-300',
                checkColor: 'text-sky-600',
                earned: totalChecklists >= 5,
                progress: Math.min(totalChecklists, 5),
                total: 5,
            },
            {
                id: 'community_contributor',
                title: 'Community Contributor',
                description: 'Make a checklist public',
                icon: <Icon icon={Globe02Icon} className="h-5 w-5 text-violet-600" />,
                color: 'text-violet-600',
                bgColor: 'bg-violet-100',
                borderColor: 'border-violet-300',
                checkColor: 'text-violet-600',
                earned: publicChecklists >= 1,
            },
            {
                id: 'template_user',
                title: 'Template User',
                description: 'Fork a community checklist',
                icon: <Icon icon={GitForkIcon} className="h-5 w-5 text-rose-600" />,
                color: 'text-rose-600',
                bgColor: 'bg-rose-100',
                borderColor: 'border-rose-300',
                checkColor: 'text-rose-600',
                earned: forkedChecklists >= 1,
            },
            {
                id: 'influencer',
                title: 'Influencer',
                description: 'Get 10 forks on your checklists',
                icon: <Icon icon={StarIcon} className="h-5 w-5 text-primary" />,
                color: 'text-primary',
                bgColor: 'bg-primary/10',
                borderColor: 'border-primary/30',
                checkColor: 'text-primary',
                earned: totalForks >= 10,
                progress: Math.min(totalForks, 10),
                total: 10,
            },
            {
                id: 'productivity_master',
                title: 'Productivity Master',
                description: 'Complete 25 runs',
                icon: <Icon icon={StarIcon} className="h-5 w-5 text-orange-600" />,
                color: 'text-orange-600',
                bgColor: 'bg-orange-100',
                borderColor: 'border-orange-300',
                checkColor: 'text-orange-600',
                earned: totalCompleted >= 25,
                progress: Math.min(totalCompleted, 25),
                total: 25,
            },
            {
                id: 'streak_master',
                title: 'On Fire',
                description: 'Complete runs 7 days in a row',
                icon: <Icon icon={FlashIcon} className="h-5 w-5 text-red-600" />,
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                borderColor: 'border-red-300',
                checkColor: 'text-red-600',
                earned: false, // Would need streak tracking
            },
        ]
    }, [repos, stats])

    const earnedCount = achievements.filter(a => a.earned).length

    useEffect(() => {
        async function loadProfile() {
            if (!user) return
            try {
                setLoading(true)
                const [userRepos, activeRuns, completedRuns, userActivities] = await Promise.all([
                    getUserRepositories(user.id),
                    getMyActiveRuns(user.id),
                    getMyCompletedRuns(user.id),
                    getUserActivity(user.id),
                ])
                setRepos(userRepos)
                setStats({
                    activeRuns: activeRuns.length,
                    completedRuns: completedRuns.length,
                })
                setActivities(userActivities.slice(0, 10))
            } catch (err) {
                console.error('Error loading profile:', err)
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [user])

    const handleExport = async () => {
        if (!user) return
        setIsExporting(true)
        try {
            // Create export data
            const exportData = {
                exportDate: new Date().toISOString(),
                user: {
                    email: user.email,
                    id: user.id,
                },
                repositories: repos,
                statistics: stats,
            }

            // Create and download file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `checklist-hq-export-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Error exporting data:', err)
        } finally {
            setIsExporting(false)
        }
    }

    const handleDelete = async (repoId: string) => {
        const repo = repos.find(r => r.id === repoId)
        if (!repo) return

        const confirmed = window.confirm(`Are you sure you want to delete "${repo.title}"? This cannot be undone.`)
        if (!confirmed) return

        try {
            await deleteRepository(repoId)
            setRepos(repos.filter(r => r.id !== repoId))
        } catch (err) {
            console.error('Error deleting repository:', err)
        }
    }

    // Calculate join date from user metadata
    const joinDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        })
        : 'Unknown'

    if (loading) {
        return (
            <div className="min-h-screen">
                {/* Hero skeleton */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b">
                    <div className="container mx-auto px-4 py-12">
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
                            <div className="space-y-3">
                                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                                <div className="h-5 w-64 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-4 py-8">
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
                        ))}
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Clean Hero Section */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                        {/* Avatar - clean, simple design */}
                        <div className="relative shrink-0">
                            <div className="h-20 w-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-sm">
                                <span className="text-3xl font-bold text-primary">
                                    {user?.email?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            {/* Achievement indicator */}
                            {earnedCount > 0 && (
                                <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-lg bg-amber-100 border-2 border-card flex items-center justify-center shadow-sm">
                                    <Icon icon={StarIcon} className="h-3.5 w-3.5 text-amber-600" />
                                </div>
                            )}
                        </div>

                        {/* User info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                    {user?.email?.split('@')[0]}
                                </h1>
                                <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                                    <Icon icon={CheckmarkCircle02Icon} className="h-3 w-3 mr-1" />
                                    Pro
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Icon icon={Mail01Icon} className="h-4 w-4" />
                                    {user?.email}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Icon icon={Calendar01Icon} className="h-4 w-4" />
                                    Joined {joinDate}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <Badge variant="outline" className="text-foreground border-border bg-muted/50 font-normal">
                                    <Icon icon={StarIcon} className="h-3 w-3 mr-1 text-amber-500" />
                                    {earnedCount} Achievement{earnedCount !== 1 ? 's' : ''}
                                </Badge>
                                <Badge variant="outline" className="text-foreground border-border bg-muted/50 font-normal">
                                    <Icon icon={CheckmarkCircle02Icon} className="h-3 w-3 mr-1 text-emerald-500" />
                                    {stats.completedRuns} Completed
                                </Badge>
                                <Badge variant="outline" className="text-foreground border-border bg-muted/50 font-normal">
                                    <Icon icon={CheckListIcon} className="h-3 w-3 mr-1 text-primary" />
                                    {repos.length} Checklist{repos.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                            <Button asChild>
                                <Link to="/app/new">
                                    <Icon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                                    New Checklist
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link to="/app">
                                    <Icon icon={Analytics01Icon} className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Tab Navigation - cleaner design */}
                    <div className="flex gap-1 mt-6 -mb-px overflow-x-auto">
                        {(['overview', 'checklists', 'activity', 'integrations', 'settings'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                                    ? 'border-primary text-primary bg-background'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={transitions.default}
                        className="space-y-8"
                    >
                        {/* Stats Grid */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                index={0}
                                icon={CheckListIcon}
                                label="Total Checklists"
                                value={repos.length}
                                subLabel="Templates created"
                                color="text-primary"
                                bgColor="bg-primary/10"
                            />
                            <StatCard
                                index={1}
                                icon={PlayIcon}
                                label="Active Runs"
                                value={stats.activeRuns}
                                subLabel="In progress"
                                color="text-sky-500"
                                bgColor="bg-sky-100"
                            />
                            <StatCard
                                index={2}
                                icon={CheckmarkCircle02Icon}
                                label="Completed Runs"
                                value={stats.completedRuns}
                                subLabel="All time"
                                color="text-emerald-500"
                                bgColor="bg-emerald-100"
                                trend={{ value: 12, positive: true }}
                            />
                            <StatCard
                                index={3}
                                icon={GitForkIcon}
                                label="Total Forks"
                                value={repos.reduce((sum, r) => sum + r.fork_count, 0)}
                                subLabel="Community impact"
                                color="text-violet-500"
                                bgColor="bg-violet-100"
                            />
                        </div>

                        {/* Two column layout */}
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Achievements */}
                            <div className="lg:col-span-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Icon icon={StarIcon} className="h-5 w-5 text-amber-500" />
                                        Achievements
                                    </h2>
                                    <Badge variant="outline">
                                        {earnedCount} of {achievements.length} unlocked
                                    </Badge>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {achievements.slice(0, 6).map((achievement, index) => (
                                        <AchievementBadge key={achievement.id} achievement={achievement} index={index} />
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Icon icon={Activity01Icon} className="h-5 w-5 text-primary" />
                                        Recent Activity
                                    </h2>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link to="/app/activity">
                                            View All
                                            <Icon icon={ArrowRight01Icon} className="ml-1 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                                {activities.length === 0 ? (
                                    <Card className="border-dashed">
                                        <CardContent className="py-8 text-center">
                                            <Icon icon={Activity01Icon} className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">No recent activity</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div>
                                        {activities.slice(0, 5).map((activity, index) => (
                                            <ActivityTimelineItem
                                                key={activity.id}
                                                item={activity}
                                                isFirst={index === 0}
                                                isLast={index === Math.min(activities.length - 1, 4)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Access Checklists */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">Recent Checklists</h2>
                                <Button variant="ghost" size="sm" onClick={() => setActiveTab('checklists')}>
                                    View All
                                    <Icon icon={ArrowRight01Icon} className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                            {repos.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="py-12 text-center">
                                        <Icon icon={CheckListIcon} className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="font-semibold mb-2">No checklists yet</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Create your first checklist to get started
                                        </p>
                                        <Button asChild>
                                            <Link to="/app/new">
                                                <Icon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                                                Create Checklist
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {repos.slice(0, 3).map((repo, index) => (
                                        <ChecklistCard key={repo.id} repo={repo} onDelete={handleDelete} index={index} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Checklists Tab */}
                {activeTab === 'checklists' && (
                    <motion.div
                        key="checklists"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={transitions.default}
                        className="space-y-6"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold">My Checklists</h2>
                                <p className="text-sm text-muted-foreground">
                                    {filteredRepos.length} of {repos.length} checklist{repos.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search checklists..."
                                    resultCount={searchQuery.trim() ? filteredRepos.length : undefined}
                                />
                                <Button asChild>
                                    <Link to="/app/new">
                                        <Icon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                                        New
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {filteredRepos.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="py-12 text-center">
                                    {searchQuery.trim() ? (
                                        <>
                                            <Icon icon={CheckListIcon} className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="font-semibold mb-2">No matches found</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                No checklists match "{searchQuery}"
                                            </p>
                                            <Button variant="outline" onClick={() => setSearchQuery('')}>
                                                Clear search
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon={CheckListIcon} className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="font-semibold mb-2">No checklists yet</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Create your first checklist to get started
                                            </p>
                                            <div className="flex gap-3 justify-center">
                                                <Button asChild>
                                                    <Link to="/app/new">
                                                        <Icon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                                                        Create New
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" asChild>
                                                    <Link to="/explore">
                                                        <Icon icon={GitForkIcon} className="mr-2 h-4 w-4" />
                                                        Explore Templates
                                                    </Link>
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRepos.map((repo, index) => (
                                    <ChecklistCard key={repo.id} repo={repo} onDelete={handleDelete} index={index} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <motion.div
                        key="activity"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={transitions.default}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Icon icon={Activity01Icon} className="h-5 w-5 text-primary" />
                                    Activity Timeline
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Your recent actions and progress
                                </p>
                            </div>
                        </div>

                        {activities.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="py-12 text-center">
                                    <Icon icon={Activity01Icon} className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="font-semibold mb-2">No activity yet</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Start a run or create a checklist to see activity
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <Button asChild>
                                            <Link to="/app/new">
                                                <Icon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                                                Create Checklist
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="max-w-2xl">
                                {activities.map((activity, index) => (
                                    <ActivityTimelineItem
                                        key={activity.id}
                                        item={activity}
                                        isFirst={index === 0}
                                        isLast={index === activities.length - 1}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Integrations Tab */}
                {activeTab === 'integrations' && (
                    <motion.div
                        key="integrations"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={transitions.default}
                        className="max-w-3xl space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Icon icon={FlashIcon} className="h-5 w-5 text-primary" />
                                    Integrations & API
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Connect Checklist HQ with your external tools
                                </p>
                            </div>
                        </div>

                        <ApiKeyManager />
                    </motion.div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={transitions.default}
                        className="max-w-2xl space-y-6"
                    >
                        <SettingsPanel onExport={handleExport} isExporting={isExporting} />

                        {/* All Achievements */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Icon icon={StarIcon} className="h-5 w-5 text-amber-500" />
                                    All Achievements
                                </CardTitle>
                                <CardDescription>
                                    {earnedCount} of {achievements.length} achievements unlocked
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {achievements.map((achievement, index) => (
                                        <AchievementBadge key={achievement.id} achievement={achievement} index={index} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    )
}
