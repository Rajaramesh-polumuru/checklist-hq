import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Loading02Icon, Activity01Icon, PlayIcon, CheckmarkCircle02Icon, GitForkIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { useAuthStore } from '@/stores/auth-store'
import { getUserActivity, type ActivityItem } from '@/services/activity'

export function Activity() {
    const { user } = useAuthStore()
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadActivity() {
            if (!user) return

            try {
                setLoading(true)
                const data = await getUserActivity(user.id)
                setActivities(data)
            } catch (err) {
                console.error('Error loading activity:', err)
                setError('Failed to load recent activity')
            } finally {
                setLoading(false)
            }
        }

        loadActivity()
    }, [user])

    const getIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'run_started': return <Icon icon={PlayIcon} className="h-4 w-4 text-sky-400" />
            case 'run_completed': return <Icon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-emerald-400" />
            case 'repo_forked': return <Icon icon={GitForkIcon} className="h-4 w-4 text-violet-400" />
            case 'repo_created': return <Icon icon={PlusSignIcon} className="h-4 w-4 text-amber-400" />
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <Icon icon={Loading02Icon} className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-8">
                <Icon icon={Activity01Icon} className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Recent Activity</h1>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            <div className="space-y-4 max-w-2xl">
                {activities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No recent activity.</p>
                ) : (
                    activities.map((item) => (
                        <Link key={item.id} to={item.link}>
                            <Card className="hover:shadow-sm transition-shadow">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-2 bg-muted rounded-full">
                                        {getIcon(item.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
