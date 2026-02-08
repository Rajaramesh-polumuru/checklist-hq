import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/useMobile'
import { useAuthStore } from '@/stores/auth-store'
import {
    DashboardSquare01Icon,
    Search01Icon,
    PlusSignIcon,
    Logout02Icon,
    ArrowLeftDoubleIcon,
    ArrowRightDoubleIcon,
    UserCircleIcon,
    Sun03Icon,
    Moon02Icon,
    ComputerIcon,
    Building02Icon,
    ArrowDown01Icon,
    ArrowUp01Icon,
    UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { Logo } from '@/components/ui/logo'
import { useThemeStore } from '@/stores/theme-store'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { getMyOrganizations, getOrganizationTeams } from '@/services/organization'
import type { Organization, Team } from '@/types/database'

interface SidebarProps {
    collapsed: boolean
    setCollapsed: (collapsed: boolean) => void
    openMobile: boolean
    setOpenMobile: (open: boolean) => void
}

interface SidebarLinkProps {
    to: string
    icon: any
    label: string
    collapsed: boolean
    active: boolean
}

function SidebarLink({ to, icon, label, collapsed, active }: SidebarLinkProps) {
    if (collapsed) {
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            to={to}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-lg transition-all",
                                active
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <Icon icon={icon} className="h-5 w-5" />
                            <span className="sr-only">{label}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="z-50 ml-2">
                        {label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group",
                active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
        >
            <Icon
                icon={icon}
                className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
            />
            <span className="truncate">{label}</span>
            {active && (
                <motion.div
                    layoutId="active-sidebar-indicator"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}
        </Link>
    )
}

export function Sidebar({ collapsed, setCollapsed, openMobile, setOpenMobile }: SidebarProps) {
    const location = useLocation()
    const { user, signOut } = useAuthStore()
    const { theme, setTheme } = useThemeStore()
    const isMobile = useIsMobile()
    const [orgs, setOrgs] = useState<(Organization & { role: string })[]>([])
    const [orgsExpanded, setOrgsExpanded] = useState(true)
    const [orgsLoading, setOrgsLoading] = useState(false)
    const [expandedOrgIds, setExpandedOrgIds] = useState<Set<string>>(new Set())
    const [orgTeams, setOrgTeams] = useState<Record<string, Team[]>>({})
    const [teamsLoading, setTeamsLoading] = useState<Set<string>>(new Set())

    // Fetch user's organizations
    useEffect(() => {
        if (user) {
            setOrgsLoading(true)
            getMyOrganizations()
                .then(setOrgs)
                .catch(console.error)
                .finally(() => setOrgsLoading(false))
        } else {
            setOrgs([])
        }
    }, [user])

    // Toggle organization expansion and fetch teams
    const toggleOrgExpansion = async (orgId: string) => {
        const newExpanded = new Set(expandedOrgIds)
        if (newExpanded.has(orgId)) {
            newExpanded.delete(orgId)
        } else {
            newExpanded.add(orgId)
            // Fetch teams if not already loaded
            if (!orgTeams[orgId]) {
                setTeamsLoading(prev => new Set(prev).add(orgId))
                try {
                    const teams = await getOrganizationTeams(orgId)
                    setOrgTeams(prev => ({ ...prev, [orgId]: teams }))
                } catch (error) {
                    console.error('Failed to load teams:', error)
                } finally {
                    setTeamsLoading(prev => {
                        const next = new Set(prev)
                        next.delete(orgId)
                        return next
                    })
                }
            }
        }
        setExpandedOrgIds(newExpanded)
    }

    // Auto-expand organization if on a team page
    useEffect(() => {
        const match = location.pathname.match(/\/app\/orgs\/([^/]+)\/teams/)
        if (match) {
            const orgId = match[1]
            if (!expandedOrgIds.has(orgId)) {
                toggleOrgExpansion(orgId)
            }
        }
    }, [location.pathname])

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark')
        else if (theme === 'dark') setTheme('system')
        else setTheme('light')
    }

    const getThemeIcon = () => {
        if (theme === 'light') return Sun03Icon
        if (theme === 'dark') return Moon02Icon
        return ComputerIcon
    }

    const getThemeLabel = () => {
        if (theme === 'light') return 'Theme: Light'
        if (theme === 'dark') return 'Theme: Dark'
        return 'Theme: System'
    }

    // Close mobile menu on navigation
    useEffect(() => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }, [location.pathname, isMobile, setOpenMobile])

    const links = [
        { to: '/app', icon: DashboardSquare01Icon, label: 'Dashboard' },
        { to: '/explore', icon: Search01Icon, label: 'Explore' },
        { to: '/app/new', icon: PlusSignIcon, label: 'Create New' },
    ]

    const bottomLinks = [
        { to: '/app/profile', icon: UserCircleIcon, label: 'Profile' }
    ]

    // Mobile Drawer
    if (isMobile) {
        return (
            <Dialog open={openMobile} onOpenChange={setOpenMobile}>
                {/* We reuse Dialog but style it as a sheet/drawer */}
                <DialogContent
                    className="fixed inset-y-0 left-0 z-50 h-full w-3/4 max-w-sm gap-4 border-r bg-background p-6 shadow-xl data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left rounded-none border-none !top-0 !left-0 !translate-x-0 !translate-y-0"
                    aria-describedby={undefined}
                >
                    <div className="flex flex-col h-full">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <Logo size="md" />
                            <span className="font-bold text-lg">Checklist HQ</span>
                        </div>

                        <nav className="flex-1 space-y-2 overflow-y-auto">
                            {links.map((link) => (
                                <SidebarLink
                                    key={link.to}
                                    {...link}
                                    collapsed={false}
                                    active={location.pathname === link.to}
                                />
                            ))}

                            {/* Organizations Section */}
                            {user && (
                                <div className="pt-4 mt-4 border-t">
                                    <button
                                        onClick={() => setOrgsExpanded(!orgsExpanded)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Icon icon={Building02Icon} className="h-4 w-4" />
                                            Organizations
                                        </span>
                                        <Icon icon={orgsExpanded ? ArrowUp01Icon : ArrowDown01Icon} className="h-4 w-4" />
                                    </button>

                                    <AnimatePresence>
                                        {orgsExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-1 pl-2">
                                                    {orgsLoading ? (
                                                        <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                                                    ) : orgs.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-muted-foreground">No organizations yet</div>
                                                    ) : (
                                                        orgs.map((org) => (
                                                            <div key={org.id} className="space-y-0.5">
                                                                <div className="flex items-center">
                                                                    <button
                                                                        onClick={() => toggleOrgExpansion(org.id)}
                                                                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                                                        aria-label={expandedOrgIds.has(org.id) ? 'Collapse teams' : 'Expand teams'}
                                                                    >
                                                                        <Icon
                                                                            icon={expandedOrgIds.has(org.id) ? ArrowDown01Icon : ArrowUp01Icon}
                                                                            className="h-3 w-3 rotate-180"
                                                                            style={{ transform: expandedOrgIds.has(org.id) ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                                                                        />
                                                                    </button>
                                                                    <Link
                                                                        to={`/app/orgs/${org.id}`}
                                                                        className={cn(
                                                                            "flex-1 flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                                                                            location.pathname === `/app/orgs/${org.id}`
                                                                                ? "bg-primary/10 text-primary"
                                                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                                        )}
                                                                    >
                                                                        <span className="truncate">{org.name}</span>
                                                                    </Link>
                                                                </div>
                                                                <AnimatePresence>
                                                                    {expandedOrgIds.has(org.id) && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            className="overflow-hidden"
                                                                        >
                                                                            <div className="pl-6 space-y-0.5">
                                                                                {teamsLoading.has(org.id) ? (
                                                                                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading teams...</div>
                                                                                ) : (orgTeams[org.id]?.length ?? 0) === 0 ? (
                                                                                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No teams</div>
                                                                                ) : (
                                                                                    orgTeams[org.id]?.map((team) => (
                                                                                        <Link
                                                                                            key={team.id}
                                                                                            to={`/app/orgs/${org.id}/teams/${team.id}`}
                                                                                            className={cn(
                                                                                                "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
                                                                                                location.pathname === `/app/orgs/${org.id}/teams/${team.id}`
                                                                                                    ? "bg-primary/10 text-primary"
                                                                                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                                                            )}
                                                                                        >
                                                                                            <Icon icon={UserGroupIcon} className="h-3 w-3 shrink-0" />
                                                                                            <span className="truncate">{team.name}</span>
                                                                                        </Link>
                                                                                    ))
                                                                                )}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        ))
                                                    )}
                                                    <Link
                                                        to="/app/orgs/new"
                                                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-primary hover:bg-primary/10 transition-colors"
                                                    >
                                                        <Icon icon={PlusSignIcon} className="h-3.5 w-3.5" />
                                                        <span>New Organization</span>
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </nav>

                        <div className="pt-6 border-t mt-auto space-y-2">
                            <button
                                onClick={cycleTheme}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <Icon icon={getThemeIcon()} className="h-5 w-5" />
                                <span>{getThemeLabel()}</span>
                            </button>

                            {user ? (
                                <>
                                    {bottomLinks.map((link) => (
                                        <SidebarLink
                                            key={link.to}
                                            {...link}
                                            collapsed={false}
                                            active={location.pathname.startsWith(link.to)}
                                        />
                                    ))}
                                    <button
                                        onClick={signOut}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    >
                                        <Icon icon={Logout02Icon} className="h-5 w-5" />
                                        <span>Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <div className="px-2">
                                    <Button asChild className="w-full">
                                        <Link to="/login">Sign In</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Desktop Sidebar
    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 80 : 250 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden md:flex flex-col h-screen sticky top-0 border-r bg-card/50 backdrop-blur-xl z-30"
        >
            <div className="flex flex-col h-full p-4">
                {/* Header */}
                <div className={cn("flex items-center gap-3 mb-8 px-2 h-10", collapsed && "justify-center px-0")}>
                    <Logo size="md" className="shrink-0" />
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.1 }}
                            className="font-bold text-lg truncate"
                        >
                            Checklist HQ
                        </motion.span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2 overflow-y-auto">
                    {links.map((link) => (
                        <SidebarLink
                            key={link.to}
                            {...link}
                            collapsed={collapsed}
                            active={location.pathname === link.to || (link.to !== '/app' && location.pathname.startsWith(link.to))}
                        />
                    ))}

                    {/* Organizations Section */}
                    {user && (
                        <div className="pt-4 mt-4 border-t">
                            {collapsed ? (
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                to="/app/orgs"
                                                className={cn(
                                                    "flex items-center justify-center w-10 h-10 rounded-lg transition-all mx-auto",
                                                    location.pathname.startsWith('/app/orgs')
                                                        ? "bg-primary text-primary-foreground shadow-md"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                )}
                                            >
                                                <Icon icon={Building02Icon} className="h-5 w-5" />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">Organizations</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setOrgsExpanded(!orgsExpanded)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Icon icon={Building02Icon} className="h-4 w-4" />
                                            Organizations
                                        </span>
                                        <Icon icon={orgsExpanded ? ArrowUp01Icon : ArrowDown01Icon} className="h-4 w-4" />
                                    </button>

                                    <AnimatePresence>
                                        {orgsExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-1 pl-2">
                                                    {orgsLoading ? (
                                                        <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                                                    ) : orgs.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-muted-foreground">No organizations yet</div>
                                                    ) : (
                                                        orgs.map((org) => (
                                                            <div key={org.id} className="space-y-0.5">
                                                                <div className="flex items-center">
                                                                    <button
                                                                        onClick={() => toggleOrgExpansion(org.id)}
                                                                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                                                        aria-label={expandedOrgIds.has(org.id) ? 'Collapse teams' : 'Expand teams'}
                                                                    >
                                                                        <Icon
                                                                            icon={ArrowDown01Icon}
                                                                            className="h-3 w-3 transition-transform"
                                                                            style={{ transform: expandedOrgIds.has(org.id) ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                                                                        />
                                                                    </button>
                                                                    <Link
                                                                        to={`/app/orgs/${org.id}`}
                                                                        className={cn(
                                                                            "flex-1 flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                                                                            location.pathname === `/app/orgs/${org.id}`
                                                                                ? "bg-primary/10 text-primary"
                                                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                                        )}
                                                                    >
                                                                        <span className="truncate">{org.name}</span>
                                                                    </Link>
                                                                </div>
                                                                <AnimatePresence>
                                                                    {expandedOrgIds.has(org.id) && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            className="overflow-hidden"
                                                                        >
                                                                            <div className="pl-6 space-y-0.5">
                                                                                {teamsLoading.has(org.id) ? (
                                                                                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading teams...</div>
                                                                                ) : (orgTeams[org.id]?.length ?? 0) === 0 ? (
                                                                                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No teams</div>
                                                                                ) : (
                                                                                    orgTeams[org.id]?.map((team) => (
                                                                                        <Link
                                                                                            key={team.id}
                                                                                            to={`/app/orgs/${org.id}/teams/${team.id}`}
                                                                                            className={cn(
                                                                                                "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
                                                                                                location.pathname === `/app/orgs/${org.id}/teams/${team.id}`
                                                                                                    ? "bg-primary/10 text-primary"
                                                                                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                                                            )}
                                                                                        >
                                                                                            <Icon icon={UserGroupIcon} className="h-3 w-3 shrink-0" />
                                                                                            <span className="truncate">{team.name}</span>
                                                                                        </Link>
                                                                                    ))
                                                                                )}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        ))
                                                    )}
                                                    <Link
                                                        to="/app/orgs/new"
                                                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-primary hover:bg-primary/10 transition-colors"
                                                    >
                                                        <Icon icon={PlusSignIcon} className="h-3.5 w-3.5" />
                                                        <span>New Organization</span>
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </div>
                    )}
                </nav>

                {/* Footer */}
                <div className="pt-4 border-t space-y-2">
                    {user ? (
                        <>
                            {bottomLinks.map((link) => (
                                <SidebarLink
                                    key={link.to}
                                    {...link}
                                    collapsed={collapsed}
                                    active={location.pathname.startsWith(link.to)}
                                />
                            ))}

                            {/* Theme Toggle */}
                            {collapsed ? (
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={cycleTheme}
                                                className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mx-auto"
                                            >
                                                <Icon icon={getThemeIcon()} className="h-5 w-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">{getThemeLabel()}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <button
                                    onClick={cycleTheme}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                >
                                    <Icon icon={getThemeIcon()} className="h-5 w-5" />
                                    <span>{getThemeLabel()}</span>
                                </button>
                            )}

                            {collapsed ? (
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button onClick={signOut} className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mx-auto">
                                                <Icon icon={Logout02Icon} className="h-5 w-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">Sign Out</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group">
                                    <Icon icon={Logout02Icon} className="h-5 w-5" />
                                    <span>Sign Out</span>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className={cn(collapsed && "flex flex-col items-center gap-2")}>
                            {/* Theme Toggle (Guest) */}
                            {collapsed ? (
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={cycleTheme}
                                                className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                            >
                                                <Icon icon={getThemeIcon()} className="h-5 w-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">{getThemeLabel()}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <button
                                    onClick={cycleTheme}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mb-2"
                                >
                                    <Icon icon={getThemeIcon()} className="h-5 w-5" />
                                    <span>{getThemeLabel()}</span>
                                </button>
                            )}

                            {collapsed ? (
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" asChild>
                                                <Link to="/login"><Icon icon={UserCircleIcon} className="h-5 w-5" /></Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">Sign In</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <Button asChild className="w-full">
                                    <Link to="/login">Sign In</Link>
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn(
                            "flex items-center justify-center w-full h-8 mt-4 text-muted-foreground/50 hover:text-foreground transition-colors",
                            collapsed && "mt-2"
                        )}
                    >
                        <Icon icon={collapsed ? ArrowRightDoubleIcon : ArrowLeftDoubleIcon} className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </motion.aside>
    )
}
