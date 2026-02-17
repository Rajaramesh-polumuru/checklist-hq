import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Icon } from '@/components/ui/icon';
import { FlashIcon, AlertCircleIcon, SparklesIcon, StarIcon, GitForkIcon, ViewIcon, TaskDaily01Icon, Alert02Icon, FireIcon, Folder01Icon, Globe02Icon, LockKeyIcon } from '@hugeicons/core-free-icons';
export const COLOR_LEGEND = {
    'dormant': {
        bg: 'bg-slate-300',
        text: 'text-slate-500',
        gradient: 'from-slate-300 to-gray-300',
        label: 'Needs Attention',
        description: (_jsxs("span", { className: "flex items-center", children: [_jsx(Icon, { icon: Alert02Icon, className: "w-3 h-3 mr-1 inline" }), " Inactive for 30+ days"] })),
        icon: (props) => _jsx(Icon, { icon: AlertCircleIcon, ...props }),
        priority: 1, // Highest priority - warnings bubble up
        border: 'border-slate-400',
    },
    'new': {
        bg: 'bg-pink-300',
        text: 'text-pink-400',
        gradient: 'from-pink-300 to-rose-200',
        label: 'New',
        description: (_jsxs("span", { className: "flex items-center", children: [_jsx(Icon, { icon: SparklesIcon, className: "w-3 h-3 mr-1 inline" }), " Created this week"] })),
        icon: (props) => _jsx(Icon, { icon: SparklesIcon, ...props }),
        priority: 2, // Fresh content needs setup
        border: 'border-pink-400',
    },
    'popular': {
        bg: 'bg-amber-300',
        text: 'text-amber-500',
        gradient: 'from-amber-300 to-yellow-200',
        label: 'Popular',
        description: (_jsxs("span", { className: "flex items-center", children: [_jsx(Icon, { icon: FireIcon, className: "w-3 h-3 mr-1 inline" }), " Community validated (3+ forks)"] })),
        icon: (props) => _jsx(Icon, { icon: StarIcon, ...props }),
        priority: 3, // High-value content
        border: 'border-amber-500',
    },
    'forked': {
        bg: 'bg-violet-300',
        text: 'text-violet-400',
        gradient: 'from-violet-300 to-purple-200',
        label: 'Template',
        description: (_jsxs("span", { className: "flex items-center", children: [_jsx(Icon, { icon: Folder01Icon, className: "w-3 h-3 mr-1 inline" }), " Forked from community"] })),
        icon: (props) => _jsx(Icon, { icon: GitForkIcon, ...props }),
        priority: 4, // Shows learning/origin
        border: 'border-violet-400',
    },
    'recently-used': {
        bg: 'bg-red-300',
        text: 'text-red-500',
        gradient: 'from-red-300 to-orange-200',
        label: 'Active',
        description: (_jsxs("span", { className: "flex items-center", children: [_jsx(Icon, { icon: FlashIcon, className: "w-3 h-3 mr-1 inline" }), " Used in the last 7 days"] })),
        icon: (props) => _jsx(Icon, { icon: FlashIcon, ...props }),
        priority: 5, // Engaged but not urgent
        border: 'border-red-500',
    },
    'public': {
        bg: 'bg-sky-300',
        text: 'text-sky-500',
        gradient: 'from-sky-300 to-cyan-200',
        label: 'Shared',
        description: (_jsxs("span", { className: "flex items-center", children: [_jsx(Icon, { icon: Globe02Icon, className: "w-3 h-3 mr-1 inline" }), " Public & visible to all"] })),
        icon: (props) => _jsx(Icon, { icon: ViewIcon, ...props }),
        priority: 6, // Informational status
        border: 'border-sky-500',
    },
    'default': {
        bg: 'bg-indigo-200',
        text: 'text-indigo-500',
        gradient: 'from-indigo-200 to-indigo-100',
        label: 'Private',
        description: (_jsxs("span", { className: "flex items-center", children: [_jsx(Icon, { icon: LockKeyIcon, className: "w-3 h-3 mr-1 inline" }), " Standard private checklist"] })),
        icon: (props) => _jsx(Icon, { icon: TaskDaily01Icon, ...props }),
        priority: 7, // Base state
        border: 'border-indigo-400',
    },
};
// Determine the most relevant color status for a repository
// Strategic hierarchy: Warnings > Visibility > Origin > Valuable > Fresh > Engagement
export function getRepoColorStatus(repo) {
    // 1. Dormant items surface first (needs attention - warning state)
    if (isStale(repo))
        return 'dormant';
    // 2. Public items (visibility status - important to know what's shared)
    if (repo.is_public)
        return 'public';
    // 3. Forked items (template-based, shows origin)
    if (repo.upstream_repo_id)
        return 'forked';
    // 4. Popular items (high-value, community validated)
    if (isPopular(repo))
        return 'popular';
    // 5. New items (fresh content, may need completion)
    if (isNew(repo))
        return 'new';
    // 6. Recently used (actively engaged)
    if (isRecentlyUsed(repo))
        return 'recently-used';
    // 7. Default private checklist
    return 'default';
}
/**
 * Badge Logic Utilities
 */
const NEW_THRESHOLD_DAYS = 7;
const STALE_THRESHOLD_DAYS = 60;
const POPULAR_FORK_COUNT = 10;
/**
 * Check if a repository is new (created within last 7 days)
 */
export function isNew(repo) {
    const createdDate = new Date(repo.created_at);
    const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated < NEW_THRESHOLD_DAYS;
}
/**
 * Check if a repository is stale (not updated in 60+ days)
 */
export function isStale(repo) {
    const updatedDate = new Date(repo.updated_at);
    const daysSinceUpdated = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdated > STALE_THRESHOLD_DAYS;
}
/**
 * Check if a repository is popular (has 10+ forks)
 */
export function isPopular(repo) {
    return repo.fork_count >= POPULAR_FORK_COUNT;
}
/**
 * Check if a repository was recently used (updated within 24 hours)
 */
export function isRecentlyUsed(repo) {
    const updatedDate = new Date(repo.updated_at);
    const hoursSinceUpdated = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdated < 24;
}
/**
 * Calculate comprehensive dashboard stats from repositories
 */
export function calculateStats(repositories) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
        total: repositories.length,
        public: repositories.filter(r => r.is_public).length,
        private: repositories.filter(r => !r.is_public).length,
        forked: repositories.filter(r => r.upstream_repo_id).length,
        activeRuns: 0, // TODO: Connect to actual run data when available
        updatedToday: repositories.filter(r => new Date(r.updated_at) >= todayStart).length,
        totalForks: repositories.reduce((sum, r) => sum + r.fork_count, 0),
    };
}
/**
 * Apply filters to repository list
 */
export function applyFilters(repositories, filters) {
    return repositories
        .filter(repo => {
        // Visibility filter
        if (filters.visibility === 'public' && !repo.is_public)
            return false;
        if (filters.visibility === 'private' && repo.is_public)
            return false;
        // Type filter
        if (filters.type === 'original' && repo.upstream_repo_id)
            return false;
        if (filters.type === 'forked' && !repo.upstream_repo_id)
            return false;
        // Status filter
        if (filters.status === 'recent' && !isRecentlyUsed(repo))
            return false;
        if (filters.status === 'stale' && !isStale(repo))
            return false;
        return true;
    });
}
/**
 * Sort repositories based on selected option
 */
export function sortRepositories(repositories, sortBy) {
    const sorted = [...repositories];
    switch (sortBy) {
        case 'updated':
            return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        case 'created':
            return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        case 'alpha':
            return sorted.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
        case 'forks':
            return sorted.sort((a, b) => b.fork_count - a.fork_count);
        default:
            return sorted;
    }
}
/**
 * Get active filter count for UI display
 */
export function getActiveFilterCount(filters) {
    let count = 0;
    if (filters.visibility !== 'all')
        count++;
    if (filters.type !== 'all')
        count++;
    if (filters.status !== 'all')
        count++;
    return count;
}
/**
 * Reset filters to default state
 */
export function getDefaultFilters() {
    return {
        visibility: 'all',
        type: 'all',
        status: 'all',
    };
}
//# sourceMappingURL=dashboard-utils.js.map