import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrganizations } from '@/services/organization'
import type { Organization } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import {
    Loading02Icon,
    Building02Icon,
    PlusSignIcon,
    UserGroupIcon,
    ArrowRight01Icon,
    Shield01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

export function Organizations() {
    const [orgs, setOrgs] = useState<(Organization & { role: string })[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadOrgs() {
            try {
                const data = await getMyOrganizations()
                setOrgs(data)
            } catch (err) {
                console.error('Failed to load organizations:', err)
            } finally {
                setLoading(false)
            }
        }
        loadOrgs()
    }, [])

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Icon icon={Loading02Icon} className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container max-w-5xl py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage your organizations and teams
                    </p>
                </div>
                <Button asChild>
                    <Link to="/app/orgs/new">
                        <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                        New Organization
                    </Link>
                </Button>
            </div>

            {orgs.length === 0 ? (
                /* Empty State */
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Icon icon={Building02Icon} className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No organizations yet</h2>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            Organizations help you collaborate with your team. Create your first organization to start working together on checklists and processes.
                        </p>
                        <Button asChild size="lg">
                            <Link to="/app/orgs/new">
                                <Icon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                                Create Your First Organization
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                /* Organization Grid */
                <div className="grid gap-4 md:grid-cols-2">
                    {orgs.map((org) => (
                        <Link key={org.id} to={`/app/orgs/${org.id}`} className="group">
                            <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {org.avatar_url ? (
                                                <img
                                                    src={org.avatar_url}
                                                    alt={org.name}
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Icon icon={Building02Icon} className="h-5 w-5 text-primary" />
                                                </div>
                                            )}
                                            <div>
                                                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                                    {org.name}
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    @{org.slug}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <RoleBadge role={org.role} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {org.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                            {org.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Icon icon={UserGroupIcon} className="h-4 w-4" />
                                                Team
                                            </span>
                                        </div>
                                        <Icon
                                            icon={ArrowRight01Icon}
                                            className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {/* Create New Card */}
                    <Link to="/app/orgs/new" className="group">
                        <Card className="h-full border-dashed hover:border-primary/50 transition-all">
                            <CardContent className="flex flex-col items-center justify-center h-full min-h-[180px] text-center">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                    <Icon icon={PlusSignIcon} className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <p className="font-medium group-hover:text-primary transition-colors">
                                    Create New Organization
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Start collaborating with your team
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            )}
        </div>
    )
}

function RoleBadge({ role }: { role: string }) {
    const config = {
        owner: { label: 'Owner', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
        admin: { label: 'Admin', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
        member: { label: 'Member', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
        viewer: { label: 'Viewer', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
    }[role] || { label: role, className: 'bg-gray-500/10 text-gray-600' }

    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            config.className
        )}>
            {role === 'owner' && <Icon icon={Shield01Icon} className="h-3 w-3" />}
            {config.label}
        </span>
    )
}
