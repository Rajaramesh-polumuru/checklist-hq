import type { Repository } from '@/types/database'
import { Zap, AlertCircle, Sparkles, Star, GitFork, Eye, ListChecks } from 'lucide-react'

// Color strategy types for meaningful visual communication
export type ColorStatus = 'recently-used' | 'new' | 'popular' | 'forked' | 'public' | 'dormant' | 'default'

export interface ColorConfig {
  bg: string
  text: string
  gradient: string
  label: string
  description: string
  icon: typeof Zap
  priority: number
  border: string
}

export const COLOR_LEGEND: Record<ColorStatus, ColorConfig> = {
  'dormant': {
    bg: 'bg-slate-300',
    text: 'text-slate-500',
    gradient: 'from-slate-300 to-gray-300',
    label: 'Needs Attention',
    description: '⚠️ Inactive for 30+ days',
    icon: AlertCircle,
    priority: 1, // Highest priority - warnings bubble up
    border: 'border-slate-400',
  },
  'new': {
    bg: 'bg-pink-300',
    text: 'text-pink-400',
    gradient: 'from-pink-300 to-rose-200',
    label: 'New',
    description: '✨ Created this week',
    icon: Sparkles,
    priority: 2, // Fresh content needs setup
    border: 'border-pink-400',
  },
  'popular': {
    bg: 'bg-amber-300',
    text: 'text-amber-500',
    gradient: 'from-amber-300 to-yellow-200',
    label: 'Popular',
    description: '🔥 Community validated (3+ forks)',
    icon: Star,
    priority: 3, // High-value content
    border: 'border-amber-500',
  },
  'forked': {
    bg: 'bg-violet-300',
    text: 'text-violet-400',
    gradient: 'from-violet-300 to-purple-200',
    label: 'Template',
    description: '📂 Forked from community',
    icon: GitFork,
    priority: 4, // Shows learning/origin
    border: 'border-violet-400',
  },
  'recently-used': {
    bg: 'bg-red-300',
    text: 'text-red-500',
    gradient: 'from-red-300 to-orange-200',
    label: 'Active',
    description: '⚡ Used in the last 7 days',
    icon: Zap,
    priority: 5, // Engaged but not urgent
    border: 'border-red-500',
  },
  'public': {
    bg: 'bg-sky-300',
    text: 'text-sky-500',
    gradient: 'from-sky-300 to-cyan-200',
    label: 'Shared',
    description: '🌐 Public & visible to all',
    icon: Eye,
    priority: 6, // Informational status
    border: 'border-sky-500',
  },
  'default': {
    bg: 'bg-indigo-200',
    text: 'text-indigo-500',
    gradient: 'from-indigo-200 to-indigo-100',
    label: 'Private',
    description: '🔒 Standard private checklist',
    icon: ListChecks,
    priority: 7, // Base state
    border: 'border-indigo-400',
  },
}

// Determine the most relevant color status for a repository
// Strategic hierarchy: Warnings > Visibility > Origin > Valuable > Fresh > Engagement
export function getRepoColorStatus(repo: Repository): ColorStatus {
  // 1. Dormant items surface first (needs attention - warning state)
  if (isStale(repo)) return 'dormant'

  // 2. Public items (visibility status - important to know what's shared)
  if (repo.is_public) return 'public'

  // 3. Forked items (template-based, shows origin)
  if (repo.upstream_repo_id) return 'forked'

  // 4. Popular items (high-value, community validated)
  if (isPopular(repo)) return 'popular'

  // 5. New items (fresh content, may need completion)
  if (isNew(repo)) return 'new'

  // 6. Recently used (actively engaged)
  if (isRecentlyUsed(repo)) return 'recently-used'

  // 7. Default private checklist
  return 'default'
}

/**
 * Badge Logic Utilities
 */

const NEW_THRESHOLD_DAYS = 7
const STALE_THRESHOLD_DAYS = 60
const POPULAR_FORK_COUNT = 10

/**
 * Check if a repository is new (created within last 7 days)
 */
export function isNew(repo: Repository): boolean {
  const createdDate = new Date(repo.created_at)
  const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceCreated < NEW_THRESHOLD_DAYS
}

/**
 * Check if a repository is stale (not updated in 60+ days)
 */
export function isStale(repo: Repository): boolean {
  const updatedDate = new Date(repo.updated_at)
  const daysSinceUpdated = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceUpdated > STALE_THRESHOLD_DAYS
}

/**
 * Check if a repository is popular (has 10+ forks)
 */
export function isPopular(repo: Repository): boolean {
  return repo.fork_count >= POPULAR_FORK_COUNT
}

/**
 * Check if a repository was recently used (updated within 24 hours)
 */
export function isRecentlyUsed(repo: Repository): boolean {
  const updatedDate = new Date(repo.updated_at)
  const hoursSinceUpdated = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60)
  return hoursSinceUpdated < 24
}

/**
 * Stats Calculation Utilities
 */

export interface DashboardStats {
  total: number
  public: number
  private: number
  forked: number
  activeRuns: number
  updatedToday: number
  totalForks: number
}

/**
 * Calculate comprehensive dashboard stats from repositories
 */
export function calculateStats(repositories: Repository[]): DashboardStats {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return {
    total: repositories.length,
    public: repositories.filter(r => r.is_public).length,
    private: repositories.filter(r => !r.is_public).length,
    forked: repositories.filter(r => r.upstream_repo_id).length,
    activeRuns: 0, // TODO: Connect to actual run data when available
    updatedToday: repositories.filter(r => new Date(r.updated_at) >= todayStart).length,
    totalForks: repositories.reduce((sum, r) => sum + r.fork_count, 0),
  }
}

/**
 * Filtering Utilities
 */

export type VisibilityFilter = 'all' | 'public' | 'private'
export type TypeFilter = 'all' | 'original' | 'forked'
export type StatusFilter = 'all' | 'recent' | 'stale'

export interface FilterState {
  visibility: VisibilityFilter
  type: TypeFilter
  status: StatusFilter
}

/**
 * Apply filters to repository list
 */
export function applyFilters(
  repositories: Repository[],
  filters: FilterState
): Repository[] {
  return repositories
    .filter(repo => {
      // Visibility filter
      if (filters.visibility === 'public' && !repo.is_public) return false
      if (filters.visibility === 'private' && repo.is_public) return false

      // Type filter
      if (filters.type === 'original' && repo.upstream_repo_id) return false
      if (filters.type === 'forked' && !repo.upstream_repo_id) return false

      // Status filter
      if (filters.status === 'recent' && !isRecentlyUsed(repo)) return false
      if (filters.status === 'stale' && !isStale(repo)) return false

      return true
    })
}

/**
 * Sorting Utilities
 */

export type SortOption = 'updated' | 'created' | 'alpha' | 'forks'

/**
 * Sort repositories based on selected option
 */
export function sortRepositories(
  repositories: Repository[],
  sortBy: SortOption
): Repository[] {
  const sorted = [...repositories]

  switch (sortBy) {
    case 'updated':
      return sorted.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )

    case 'created':
      return sorted.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

    case 'alpha':
      return sorted.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      )

    case 'forks':
      return sorted.sort((a, b) => b.fork_count - a.fork_count)

    default:
      return sorted
  }
}

/**
 * Get active filter count for UI display
 */
export function getActiveFilterCount(filters: FilterState): number {
  let count = 0
  if (filters.visibility !== 'all') count++
  if (filters.type !== 'all') count++
  if (filters.status !== 'all') count++
  return count
}

/**
 * Reset filters to default state
 */
export function getDefaultFilters(): FilterState {
  return {
    visibility: 'all',
    type: 'all',
    status: 'all',
  }
}
