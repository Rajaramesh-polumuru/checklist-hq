import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrganizations } from '@/services/organization'
import type { Organization } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RoleBadge } from '@/components/ui/role-badge'
import { Icon } from '@/components/ui/icon'
import {
    Loading02Icon,
    Building02Icon,
    PlusSignIcon,
    UserGroupIcon,
    ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import type { OrgRole } from '@/stores/permission-store'

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
                <Button asChild className="active:scale-95 transition-transform">
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
                        <Button asChild size="lg" className="active:scale-95 transition-transform">
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
                        <Link
                            key={org.id}
                            to={`/app/orgs/${org.id}`}
                            className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                            aria-label={`Open ${org.name} organization dashboard`}
                        >
                            <Card className="h-full transition-all duration-200 ease-in-out hover:shadow-md hover:border-primary/50 active:scale-[0.98]">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {org.avatar_url ? (
                                                <img
                                                    src={org.avatar_url}
                                                    alt={`${org.name} logo`}
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Icon icon={Building02Icon} className="h-5 w-5 text-primary" aria-hidden="true" />
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
                                        <RoleBadge role={org.role as OrgRole} />
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
                                                <Icon icon={UserGroupIcon} className="h-4 w-4" aria-hidden="true" />
                                                <span className="sr-only">Teams in organization</span>
                                                Team
                                            </span>
                                        </div>
                                        <Icon
                                            icon={ArrowRight01Icon}
                                            className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {/* Create New Card */}
                    <Link
                        to="/app/orgs/new"
                        className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                        aria-label="Create new organization"
                    >
                        <Card className="h-full border-dashed hover:border-primary/50 transition-all duration-200 ease-in-out active:scale-[0.98]">
                            <CardContent className="flex flex-col items-center justify-center h-full min-h-[180px] text-center">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                    <Icon icon={PlusSignIcon} className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
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
