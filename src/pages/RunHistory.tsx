import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { getMyCompletedRuns } from '@/services/run'
import { RunCard } from '@/components/RunCard'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import { Icon } from '@/components/ui/icon'
import type { Run } from '@/types/database'

// Define the type to match getMyCompletedRuns return
type RunWithRepo = Run & { repository: { title: string; owner_id: string } }

export function RunHistory() {
    const { user } = useAuthStore()
    const [runs, setRuns] = useState<RunWithRepo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadRuns() {
            if (!user) return

            try {
                setLoading(true)
                const data = await getMyCompletedRuns(user.id)
                setRuns(data)
            } catch (err) {
                console.error('Error loading run history:', err)
                setError('Failed to load history')
            } finally {
                setLoading(false)
            }
        }

        loadRuns()
    }, [user])

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
                <Icon icon={Clock01Icon} className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Run History</h1>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {runs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No completed runs found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,300px))] gap-6 justify-center">
                    {runs.map((run) => (
                        <RunCard key={run.id} run={run} />
                    ))}
                </div>
            )}
        </div>
    )
}
