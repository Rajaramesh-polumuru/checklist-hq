import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { getUserRepositories } from '@/services/repository'
import { getMyActiveRuns, getMyCompletedRuns } from '@/services/run'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, User, GitFork, Globe, Lock } from 'lucide-react'
import type { Repository } from '@/types/database'

export function Profile() {
    const { user } = useAuthStore()
    const [repos, setRepos] = useState<Repository[]>([])
    const [stats, setStats] = useState({ activeRuns: 0, completedRuns: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadProfile() {
            if (!user) return
            try {
                setLoading(true)
                const [userRepos, activeRuns, completedRuns] = await Promise.all([
                    getUserRepositories(user.id),
                    getMyActiveRuns(user.id),
                    getMyCompletedRuns(user.id)
                ])
                setRepos(userRepos)
                setStats({
                    activeRuns: activeRuns.length,
                    completedRuns: completedRuns.length
                })
            } catch (err) {
                console.error('Error loading profile:', err)
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [user])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">{user?.email?.split('@')[0]}</h1>
                    <p className="text-muted-foreground">{user?.email}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-12">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold">{repos.length}</div>
                        <div className="text-sm text-muted-foreground">Checklists</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold">{stats.activeRuns}</div>
                        <div className="text-sm text-muted-foreground">Active Runs</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold">{stats.completedRuns}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Public Repositories */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold">My Checklists</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {repos.map((repo) => (
                        <Link key={repo.id} to={`/app/repo/${repo.id}`}>
                            <Card className="h-full hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg flex justify-between items-start">
                                        <span className="truncate">{repo.title}</span>
                                        {repo.is_public ? <Globe className="h-4 w-4 text-muted-foreground" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {repo.description || 'No description'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <GitFork className="h-3 w-3" />
                                            {repo.fork_count}
                                        </span>
                                        <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
