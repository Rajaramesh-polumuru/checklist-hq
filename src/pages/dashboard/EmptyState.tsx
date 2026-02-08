import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TaskDaily01Icon, PlusSignIcon, FileSearchIcon, Search01Icon, Edit02Icon, PlayIcon, GitForkIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'

interface EmptyStateProps {
    searchQuery?: string
    onClearSearch?: () => void
}

export function EmptyState({ searchQuery, onClearSearch }: EmptyStateProps) {
    const navigate = useNavigate()

    // No results for search query
    if (searchQuery) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl border-2 border-dashed bg-muted/20 p-12"
            >
                <div className="text-center max-w-md mx-auto">
                    <div className="mx-auto w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center mb-5">
                        <Icon icon={Search01Icon} className="h-7 w-7 text-muted-foreground" />
                    </div>

                    <h3 className="text-xl font-semibold tracking-tight mb-2">
                        No checklists found
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                        We couldn't find any checklists matching "<span className="font-medium text-foreground">{searchQuery}</span>".
                        Try adjusting your search keywords.
                    </p>

                    <Button variant="outline" onClick={onClearSearch}>
                        Clear search
                    </Button>
                </div>
            </motion.div>
        )
    }

    // Welcome state - no checklists yet
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-br from-muted/30 via-background to-muted/10 p-12"
        >
            {/* Decorative animated orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-10 left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"
                />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-10 right-10 w-60 h-60 bg-orange-400/5 rounded-full blur-3xl"
                />
            </div>

            <div className="relative text-center max-w-lg mx-auto">
                {/* Animated icon container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-lg shadow-primary/10"
                >
                    <Icon icon={TaskDaily01Icon} className="h-10 w-10 text-primary" />
                </motion.div>

                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-2xl font-bold tracking-tight mb-3">
                        Welcome to <span className="text-gradient-primary">Checklist HQ</span>
                    </h3>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        Start building your operational excellence by creating your first checklist
                        or exploring proven templates from the community.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                    <Button
                        size="lg"
                        onClick={() => navigate('/app/new')}
                        className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                    >
                        <Icon icon={PlusSignIcon} className="mr-2 h-5 w-5" />
                        Create Your First Checklist
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/explore')}
                        className="group"
                    >
                        <Icon icon={FileSearchIcon} className="mr-2 h-5 w-5" />
                        Browse Templates
                    </Button>
                </motion.div>

                {/* Helpful tips */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-10 pt-8 border-t border-dashed"
                >
                    <p className="text-xs text-muted-foreground/60 mb-4 uppercase tracking-wider font-medium">
                        Quick tips to get started
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4 text-left">
                        <div className="p-3 rounded-lg bg-background/50">
                            <p className="text-sm font-medium mb-1 flex items-center gap-1.5"><Icon icon={Edit02Icon} className="h-3.5 w-3.5" /> Create</p>
                            <p className="text-xs text-muted-foreground">Build checklists with nested items and rich descriptions</p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50">
                            <p className="text-sm font-medium mb-1 flex items-center gap-1.5"><Icon icon={PlayIcon} className="h-3.5 w-3.5" /> Run</p>
                            <p className="text-xs text-muted-foreground">Execute checklists and track your progress</p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50">
                            <p className="text-sm font-medium mb-1 flex items-center gap-1.5"><Icon icon={GitForkIcon} className="h-3.5 w-3.5" /> Fork</p>
                            <p className="text-xs text-muted-foreground">Copy community templates and customize them</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}
