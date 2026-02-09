import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { getMyActiveRuns, getMyPausedRuns } from '@/services/run'
import { RunCard } from '@/components/RunCard'
import { Loading02Icon, PlayIcon, PauseIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import type { Run } from '@/types/database'

// Define the type to match getMyActiveRuns return
type RunWithRepo = Run & { repository: { title: string; owner_id: string }; duration_ms?: number }

export function ActiveRuns() {
    const { user } = useAuthStore()
    const [activeRuns, setActiveRuns] = useState<RunWithRepo[]>([])
    const [pausedRuns, setPausedRuns] = useState<RunWithRepo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadRuns() {
            if (!user) return

            try {
                setLoading(true)
                // Load active and paused runs in parallel
                const [active, paused] = await Promise.all([
                    getMyActiveRuns(user.id),
                    getMyPausedRuns(user.id),
                ])
                setActiveRuns(active)
                setPausedRuns(paused)
            } catch (err) {
                console.error('Error loading runs:', err)
                setError('Failed to load runs')
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

    const totalRuns = activeRuns.length + pausedRuns.length

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-8">
                <Icon icon={PlayIcon} className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Active Runs</h1>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {totalRuns === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No active runs found.</p>
                    <p className="text-sm mt-2">Start a run from any checklist to see it here.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Paused Runs Section */}
                    {pausedRuns.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Icon icon={PauseIcon} className="h-5 w-5 text-warning" />
                                <h2 className="text-xl font-semibold">Paused ({pausedRuns.length})</h2>
                            </div>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,300px))] gap-6 justify-center">
                                {pausedRuns.map((run) => (
                                    <RunCard key={run.id} run={run} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Active Runs Section */}
                    {activeRuns.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Icon icon={PlayIcon} className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-semibold">In Progress ({activeRuns.length})</h2>
                            </div>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,300px))] gap-6 justify-center">
                                {activeRuns.map((run) => (
                                    <RunCard key={run.id} run={run} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}
