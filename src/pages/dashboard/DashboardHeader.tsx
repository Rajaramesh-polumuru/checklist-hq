import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusSignIcon, GitForkIcon, PlayIcon, SparklesIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DashboardHeaderProps {
    userEmail?: string
    activeRunsCount: number
    onSmartImport?: () => void
}

export function DashboardHeader({ userEmail, activeRunsCount, onSmartImport }: DashboardHeaderProps) {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    const username = userEmail?.split('@')[0] || 'User'

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-orange-500/5 border p-6 mb-8"
        >
            {/* Decorative gradient orb */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    {/* Date */}
                    <p className="text-sm font-medium text-primary mb-1.5">
                        {today}
                    </p>

                    {/* Greeting with gradient username */}
                    <h1 className="text-2xl md:text-3xl font-bold tracking-premium">
                        {greeting},{' '}
                        <span className="text-gradient-primary">{username}</span>
                    </h1>

                    {/* Active runs indicator */}
                    <p className="text-muted-foreground mt-2 flex items-center gap-2">
                        {activeRunsCount > 0 ? (
                            <>
                                <Badge variant="default" className="gap-1.5 h-6 px-2.5 bg-primary/10 text-primary border-0 hover:bg-primary/15">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                    </span>
                                    {activeRunsCount} active
                                </Badge>
                                <span className="text-sm">
                                    run{activeRunsCount !== 1 ? 's' : ''} in progress
                                </span>
                            </>
                        ) : (
                            <span className="text-sm">
                                No active runs — start one to track progress
                            </span>
                        )}
                    </p>
                </div>

                {/* Action buttons with enhanced styling */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Button variant="outline" asChild className="group relative overflow-hidden">
                        <Link to="/explore">
                            {/* Shimmer effect on hover */}
                            <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                            <Icon icon={GitForkIcon} className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Explore Templates</span>
                            <span className="sm:hidden">Explore</span>
                        </Link>
                    </Button>
                    {onSmartImport && (
                      <Button 
                        variant="outline" 
                        onClick={onSmartImport}
                        className="group relative overflow-hidden border-primary/30"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                        <Icon icon={SparklesIcon} className="mr-2 h-4 w-4 text-primary" />
                        <span className="hidden sm:inline">Smart Import</span>
                        <span className="sm:hidden">Import</span>
                      </Button>
                    )}
                    <Button
                        asChild
                        id="onboarding-new-checklist"
                        className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                    >
                        <Link to="/app/new">
                            <Icon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">New Checklist</span>
                            <span className="sm:hidden">New</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick action hint for active runs */}
            {activeRunsCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative mt-4 pt-4 border-t border-primary/10"
                >
                    <Link
                        to="/app/runs"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group"
                    >
                        <Icon icon={PlayIcon} className="h-4 w-4" />
                        <span>Continue your active runs</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </Link>
                </motion.div>
            )}
        </motion.div>
    )
}
