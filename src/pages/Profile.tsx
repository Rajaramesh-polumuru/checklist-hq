import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { getUserRepositories, deleteRepository } from '@/services/repository'
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
import {
    Loader2,
    GitFork,
    Globe,
    Lock,
    Calendar,
    Play,
    CheckCircle2,
    Plus,
    ListChecks,
    TrendingUp,
    Award,
    Star,
    Zap,
    Clock,
    ArrowRight,
    Settings,
    Bell,
    Download,
    Shield,
    MoreVertical,
    Pencil,
    Trash2,
    Activity,
    ChevronRight,
    Sparkles,
    Target,
    BarChart3,
    Trophy,
    Crown,
    Flame,
    Mail,
    LogOut,
} from 'lucide-react'
import { ApiKeyManager } from '@/components/ApiKeyManager'

// ... existing code ...
interface Achievement {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    color: string
    bgColor: string
    earned: boolean
    progress?: number
    total?: number
}

// Stats card component
function StatCard({
    icon: Icon,
    label,
    value,
    subLabel,
    color,
    bgColor,
    trend,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: number | string
    subLabel?: string
    color: string
    bgColor: string
    trend?: { value: number; positive: boolean }
}) {
    return (
        <div className="bg-card border rounded-2xl p-5 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex items-start justify-between">
                <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                        <TrendingUp className={`h-3 w-3 ${!trend.positive && 'rotate-180'}`} />
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
        </div>
    )
}

// Achievement badge component
function AchievementBadge({ achievement }: { achievement: Achievement }) {
    return (
        <div
            className={`relative p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${achievement.earned
                ? `${achievement.bgColor} border-transparent shadow-md`
                : 'bg-muted/30 border-dashed opacity-60 hover:opacity-80'
                }`}
        >
            <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${achievement.earned ? 'bg-white/20' : 'bg-muted'
                    }`}>
                    {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className={`font-semibold text-sm ${achievement.earned ? 'text-white' : ''}`}>
                            {achievement.title}
                        </h4>
                        {achievement.earned && (
                            <CheckCircle2 className="h-4 w-4 text-white/80" />
                        )}
                    </div>
                    <p className={`text-xs mt-0.5 ${achievement.earned ? 'text-white/70' : 'text-muted-foreground'}`}>
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
        </div>
    )
}

// Activity item component
function ActivityTimelineItem({ item, isLast }: { item: ActivityItem; isFirst?: boolean; isLast: boolean }) {
    const getIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'run_started':
                return <Play className="h-4 w-4 text-sky-500" />
            case 'run_completed':
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            case 'repo_forked':
                return <GitFork className="h-4 w-4 text-violet-500" />
            case 'repo_created':
                return <Plus className="h-4 w-4 text-amber-500" />
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

    const handleSignOut = async () => {
        await signOut()
        navigate('/')
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5 text-primary" />
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
                                <Download className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-medium">Export My Data</p>
                                <p className="text-sm text-muted-foreground">Download all your checklists as JSON</p>
                            </div>
                        </div>
                        {isExporting ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        )}
                    </button>

                    {/* Privacy */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-sky-600" />
                            </div>
                            <div>
                                <p className="font-medium">Privacy & Security</p>
                                <p className="text-sm text-muted-foreground">Signed in with Google</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Secured
                        </Badge>
                    </div>

                    {/* Notifications */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                <Bell className="h-5 w-5 text-violet-600" />
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
                                <LogOut className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-medium text-red-600">Sign Out</p>
                                <p className="text-sm text-muted-foreground">Sign out of your account</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-red-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}

// Checklist card component
function ChecklistCard({ repo, onDelete }: { repo: Repository; onDelete: (id: string) => void }) {
    return (
        <Card className="group relative hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
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
                                <Globe className="h-5 w-5 text-sky-600" />
                            ) : (
                                <Lock className="h-5 w-5 text-violet-600" />
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
                                        <GitFork className="h-3 w-3 mr-1" />
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
                            <Clock className="h-3.5 w-3.5" />
                            {formatRelativeTime(repo.updated_at)}
                        </span>
                        {repo.fork_count > 0 && (
                            <span className="flex items-center gap-1">
                                <GitFork className="h-3 w-3" />
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
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                        <Link to={`/app/repo/${repo.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to={`/app/run/start/${repo.id}`}>
                            <Play className="mr-2 h-4 w-4" />
                            Start Run
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => onDelete(repo.id)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Card>
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
                icon: <Sparkles className="h-5 w-5 text-amber-500" />,
                color: 'text-amber-500',
                bgColor: 'bg-gradient-to-br from-amber-400 to-orange-500',
                earned: totalChecklists >= 1,
            },
            {
                id: 'first_run',
                title: 'Runner',
                description: 'Complete your first run',
                icon: <Target className="h-5 w-5 text-emerald-500" />,
                color: 'text-emerald-500',
                bgColor: 'bg-gradient-to-br from-emerald-400 to-green-500',
                earned: totalCompleted >= 1,
            },
            {
                id: 'five_checklists',
                title: 'Organizer',
                description: 'Create 5 checklists',
                icon: <ListChecks className="h-5 w-5 text-sky-500" />,
                color: 'text-sky-500',
                bgColor: 'bg-gradient-to-br from-sky-400 to-blue-500',
                earned: totalChecklists >= 5,
                progress: Math.min(totalChecklists, 5),
                total: 5,
            },
            {
                id: 'community_contributor',
                title: 'Community Contributor',
                description: 'Make a checklist public',
                icon: <Globe className="h-5 w-5 text-violet-500" />,
                color: 'text-violet-500',
                bgColor: 'bg-gradient-to-br from-violet-400 to-purple-500',
                earned: publicChecklists >= 1,
            },
            {
                id: 'template_user',
                title: 'Template User',
                description: 'Fork a community checklist',
                icon: <GitFork className="h-5 w-5 text-pink-500" />,
                color: 'text-pink-500',
                bgColor: 'bg-gradient-to-br from-pink-400 to-rose-500',
                earned: forkedChecklists >= 1,
            },
            {
                id: 'influencer',
                title: 'Influencer',
                description: 'Get 10 forks on your checklists',
                icon: <Crown className="h-5 w-5 text-yellow-500" />,
                color: 'text-yellow-500',
                bgColor: 'bg-gradient-to-br from-yellow-400 to-amber-500',
                earned: totalForks >= 10,
                progress: Math.min(totalForks, 10),
                total: 10,
            },
            {
                id: 'productivity_master',
                title: 'Productivity Master',
                description: 'Complete 25 runs',
                icon: <Trophy className="h-5 w-5 text-orange-500" />,
                color: 'text-orange-500',
                bgColor: 'bg-gradient-to-br from-orange-400 to-red-500',
                earned: totalCompleted >= 25,
                progress: Math.min(totalCompleted, 25),
                total: 25,
            },
            {
                id: 'streak_master',
                title: 'On Fire',
                description: 'Complete runs 7 days in a row',
                icon: <Flame className="h-5 w-5 text-red-500" />,
                color: 'text-red-500',
                bgColor: 'bg-gradient-to-br from-red-400 to-orange-500',
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
        <div className="min-h-screen">
            {/* Premium Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-violet-500/5 border-b">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-violet-400/10 to-transparent rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />

                <div className="container mx-auto px-4 py-12 relative">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        {/* Avatar with gradient ring */}
                        <div className="relative">
                            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary via-violet-500 to-purple-500 p-1 shadow-2xl shadow-primary/30">
                                <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                                    <span className="text-4xl font-bold bg-gradient-to-br from-primary to-violet-500 bg-clip-text text-transparent">
                                        {user?.email?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                            </div>
                            {/* Achievement badge on avatar */}
                            <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-4 border-background shadow-lg">
                                <Trophy className="h-5 w-5 text-white" />
                            </div>
                        </div>

                        {/* User info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                    {user?.email?.split('@')[0]}
                                </h1>
                                <Badge className="bg-gradient-to-r from-primary to-violet-500 text-white border-0 shadow-lg">
                                    <Star className="h-3 w-3 mr-1" />
                                    Pro User
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" />
                                    {user?.email}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Joined {joinDate}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                                    <Award className="h-3 w-3 mr-1" />
                                    {earnedCount} Achievement{earnedCount !== 1 ? 's' : ''}
                                </Badge>
                                <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
                                    <Zap className="h-3 w-3 mr-1" />
                                    {stats.completedRuns} Runs Completed
                                </Badge>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button asChild className="shadow-lg shadow-primary/25">
                                <Link to="/app/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Checklist
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link to="/app">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 mt-8 p-1 bg-muted/50 rounded-xl w-fit overflow-x-auto">
                        {(['overview', 'checklists', 'activity', 'integrations', 'settings'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
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
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Stats Grid */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                icon={ListChecks}
                                label="Total Checklists"
                                value={repos.length}
                                subLabel="Templates created"
                                color="text-primary"
                                bgColor="bg-primary/10"
                            />
                            <StatCard
                                icon={Play}
                                label="Active Runs"
                                value={stats.activeRuns}
                                subLabel="In progress"
                                color="text-sky-500"
                                bgColor="bg-sky-100"
                            />
                            <StatCard
                                icon={CheckCircle2}
                                label="Completed Runs"
                                value={stats.completedRuns}
                                subLabel="All time"
                                color="text-emerald-500"
                                bgColor="bg-emerald-100"
                                trend={{ value: 12, positive: true }}
                            />
                            <StatCard
                                icon={GitFork}
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
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        Achievements
                                    </h2>
                                    <Badge variant="outline">
                                        {earnedCount} of {achievements.length} unlocked
                                    </Badge>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {achievements.slice(0, 6).map((achievement) => (
                                        <AchievementBadge key={achievement.id} achievement={achievement} />
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-primary" />
                                        Recent Activity
                                    </h2>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link to="/app/activity">
                                            View All
                                            <ArrowRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                                {activities.length === 0 ? (
                                    <Card className="border-dashed">
                                        <CardContent className="py-8 text-center">
                                            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
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
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                            {repos.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="py-12 text-center">
                                        <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="font-semibold mb-2">No checklists yet</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Create your first checklist to get started
                                        </p>
                                        <Button asChild>
                                            <Link to="/app/new">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create Checklist
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {repos.slice(0, 3).map((repo) => (
                                        <ChecklistCard key={repo.id} repo={repo} onDelete={handleDelete} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Checklists Tab */}
                {activeTab === 'checklists' && (
                    <div className="space-y-6 animate-fade-in">
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
                                        <Plus className="mr-2 h-4 w-4" />
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
                                            <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                                            <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="font-semibold mb-2">No checklists yet</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Create your first checklist to get started
                                            </p>
                                            <div className="flex gap-3 justify-center">
                                                <Button asChild>
                                                    <Link to="/app/new">
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Create New
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" asChild>
                                                    <Link to="/explore">
                                                        <GitFork className="mr-2 h-4 w-4" />
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
                                    <div
                                        key={repo.id}
                                        className="animate-fade-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <ChecklistCard repo={repo} onDelete={handleDelete} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
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
                                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="font-semibold mb-2">No activity yet</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Start a run or create a checklist to see activity
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <Button asChild>
                                            <Link to="/app/new">
                                                <Plus className="mr-2 h-4 w-4" />
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
                    </div>
                )}

                {/* Integrations Tab */}
                {activeTab === 'integrations' && (
                    <div className="max-w-3xl space-y-6 animate-fade-in">
                         <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-primary" />
                                    Integrations & API
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Connect Checklist HQ with your external tools
                                </p>
                            </div>
                        </div>

                        <ApiKeyManager />
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="max-w-2xl space-y-6 animate-fade-in">
                        <SettingsPanel onExport={handleExport} isExporting={isExporting} />

                        {/* All Achievements */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                    All Achievements
                                </CardTitle>
                                <CardDescription>
                                    {earnedCount} of {achievements.length} achievements unlocked
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {achievements.map((achievement) => (
                                        <AchievementBadge key={achievement.id} achievement={achievement} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
