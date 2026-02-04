import { Link } from 'react-router-dom'
import { Plus, GitFork } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
    userEmail?: string
    activeRunsCount: number
}

export function DashboardHeader({ userEmail, activeRunsCount }: DashboardHeaderProps) {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    const username = userEmail?.split('@')[0] || 'User'

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {greeting}, {username}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    You have {activeRunsCount} active run{activeRunsCount !== 1 ? 's' : ''} in progress.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="outline" asChild size="sm">
                    <Link to="/explore">
                        <GitFork className="mr-2 h-4 w-4" />
                        Templates
                    </Link>
                </Button>
                <Button asChild size="sm" id="onboarding-new-checklist">
                    <Link to="/app/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Checklist
                    </Link>
                </Button>
            </div>
        </div>
    )
}
