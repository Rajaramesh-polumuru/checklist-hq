import { useEffect, useState, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/SearchInput'
import { FilterBar } from '@/components/FilterBar'
import { ToastContainer } from '@/components/Toast'
import { useMobile } from '@/hooks/useMobile'
import { useCountUp } from '@/hooks/useCountUp'
import { useToast } from '@/hooks/useToast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ShareSettingsModal } from '@/components/ShareSettingsModal'
import { Plus, GitFork, Play, Clock, Loader2, Globe, Lock, Trash2, Pencil, ArrowRight, ListChecks, MoreVertical, Share2, Copy, Sparkles, TrendingUp, Info, ChevronDown, ChevronUp, Zap, Star, Eye, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/date-utils'
import { getUserRepositories, deleteRepository, updateRepository, forkRepository } from '@/services/repository'
import { KEYBOARD_SHORTCUTS } from '@/lib/constants'
import {
  isNew,
  isPopular,
  isStale,
  isRecentlyUsed,
  calculateStats,
  applyFilters,
  sortRepositories,
  getDefaultFilters,
  type FilterState,
  type SortOption,
} from '@/lib/dashboard-utils'
import type { Repository } from '@/types/database'

// Color strategy types for meaningful visual communication
type ColorStatus = 'recently-used' | 'new' | 'popular' | 'forked' | 'public' | 'dormant' | 'default'

interface ColorConfig {
  bg: string
  text: string
  gradient: string
  label: string
  description: string
  icon: typeof Zap
  priority: number
}

const COLOR_LEGEND: Record<ColorStatus, ColorConfig> = {
  'dormant': {
    bg: 'bg-slate-300',
    text: 'text-slate-500',
    gradient: 'from-slate-300 to-gray-300',
    label: 'Needs Attention',
    description: '⚠️ Inactive for 30+ days',
    icon: AlertCircle,
    priority: 1, // Highest priority - warnings bubble up
  },
  'new': {
    bg: 'bg-pink-300',
    text: 'text-pink-400',
    gradient: 'from-pink-300 to-rose-200',
    label: 'New',
    description: '✨ Created this week',
    icon: Sparkles,
    priority: 2, // Fresh content needs setup
  },
  'popular': {
    bg: 'bg-amber-300',
    text: 'text-amber-500',
    gradient: 'from-amber-300 to-yellow-200',
    label: 'Popular',
    description: '🔥 Community validated (3+ forks)',
    icon: Star,
    priority: 3, // High-value content
  },
  'forked': {
    bg: 'bg-violet-300',
    text: 'text-violet-400',
    gradient: 'from-violet-300 to-purple-200',
    label: 'Template',
    description: '📂 Forked from community',
    icon: GitFork,
    priority: 4, // Shows learning/origin
  },
  'recently-used': {
    bg: 'bg-red-300',
    text: 'text-red-500',
    gradient: 'from-red-300 to-orange-200',
    label: 'Active',
    description: '⚡ Used in the last 7 days',
    icon: Zap,
    priority: 5, // Engaged but not urgent
  },
  'public': {
    bg: 'bg-sky-300',
    text: 'text-sky-500',
    gradient: 'from-sky-300 to-cyan-200',
    label: 'Shared',
    description: '🌐 Public & visible to all',
    icon: Eye,
    priority: 6, // Informational status
  },
  'default': {
    bg: 'bg-indigo-200',
    text: 'text-indigo-500',
    gradient: 'from-indigo-200 to-indigo-100',
    label: 'Private',
    description: '🔒 Standard private checklist',
    icon: ListChecks,
    priority: 7, // Base state
  },
}

// Determine the most relevant color status for a repository
// Strategic hierarchy: Warnings > Visibility > Origin > Valuable > Fresh > Engagement
function getRepoColorStatus(repo: Repository): ColorStatus {
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

// Color Legend Component - ordered by priority (most actionable first)
function ColorLegend({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) {
  const visibleStatuses: ColorStatus[] = ['dormant', 'public', 'forked', 'popular', 'new', 'recently-used']

  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        aria-expanded={isExpanded}
        aria-controls="color-legend"
      >
        <Info className="h-4 w-4" />
        <span>Color Guide</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 opacity-60 group-hover:opacity-100" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-60 group-hover:opacity-100" />
        )}
      </button>

      {isExpanded && (
        <div
          id="color-legend"
          className="mt-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border shadow-sm animate-fade-in"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {visibleStatuses.map((status) => {
              const config = COLOR_LEGEND[status]
              const Icon = config.icon
              return (
                <div
                  key={status}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${config.bg} shrink-0 mt-0.5 ring-2 ring-offset-2 ring-offset-background ${config.bg}/30`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3 w-3 ${config.text}`} />
                      <span className="text-xs font-medium">{config.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {config.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            💡 <span className="font-medium">Tip:</span> Colors help you quickly identify checklist status. Active items appear first for easy access.
          </p>
        </div>
      )}
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { isMobile } = useMobile()
  const { toasts, dismissToast, success, error: showError } = useToast()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter and sort state (with localStorage persistence)
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem('dashboard-filters')
    return saved ? JSON.parse(saved) : getDefaultFilters()
  })
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem('dashboard-sort')
    return (saved as SortOption) || 'updated'
  })

  // Rename state
  const [renamingRepo, setRenamingRepo] = useState<Repository | null>(null)
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)

  // Share modal state
  const [shareRepo, setShareRepo] = useState<Repository | null>(null)

  // Color legend state (persisted)
  const [legendExpanded, setLegendExpanded] = useState(() => {
    const saved = localStorage.getItem('dashboard-legend-expanded')
    return saved ? JSON.parse(saved) : true // Show by default for first-time users
  })

  // Persist legend state
  useEffect(() => {
    localStorage.setItem('dashboard-legend-expanded', JSON.stringify(legendExpanded))
  }, [legendExpanded])

  // Persist filter and sort state to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-filters', JSON.stringify(filters))
  }, [filters])

  useEffect(() => {
    localStorage.setItem('dashboard-sort', sortBy)
  }, [sortBy])

  // Filter and sort repositories (client-side)
  const filteredRepositories = useMemo(() => {
    // First apply search filter
    let filtered = repositories
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = repositories.filter((repo) => {
        const titleMatch = repo.title.toLowerCase().includes(query)
        const descriptionMatch = repo.description?.toLowerCase().includes(query)
        return titleMatch || descriptionMatch
      })
    }

    // Then apply filters
    filtered = applyFilters(filtered, filters)

    // Finally apply sorting
    filtered = sortRepositories(filtered, sortBy)

    return filtered
  }, [repositories, searchQuery, filters, sortBy])

  // Calculate dashboard stats
  const stats = useMemo(() => calculateStats(repositories), [repositories])

  // Count-up animations for stats (only when not loading)
  const animatedTotal = useCountUp(stats.total, 800, !loading)
  const animatedPublic = useCountUp(stats.public, 800, !loading)
  const animatedForked = useCountUp(stats.forked, 800, !loading)
  const animatedUpdatedToday = useCountUp(stats.updatedToday, 800, !loading)
  const animatedTotalForks = useCountUp(stats.totalForks, 800, !loading)
  const animatedNewThisWeek = useCountUp(repositories.filter(r => isNew(r)).length, 800, !loading)

  useEffect(() => {
    async function loadRepositories() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        const repos = await getUserRepositories(user.id)
        setRepositories(repos)
      } catch (err) {
        console.error('Error loading repositories:', err)
        setError('Failed to load your checklists')
      } finally {
        setLoading(false)
      }
    }

    loadRepositories()
  }, [user])

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === KEYBOARD_SHORTCUTS.search.key) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleDelete = async (repoId: string, title: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)
    if (!confirmDelete) return

    // Optimistic UI: Remove immediately
    const previousRepos = [...repositories]
    setRepositories(repos => repos.filter(r => r.id !== repoId))

    try {
      setDeletingId(repoId)
      await deleteRepository(repoId)
      success(`"${title}" deleted successfully`)
    } catch (err) {
      console.error('Error deleting repository:', err)
      // Rollback on error
      setRepositories(previousRepos)
      showError('Failed to delete checklist')
    } finally {
      setDeletingId(null)
    }
  }

  const submitRename = async () => {
    if (!renamingRepo || !newName.trim()) return

    try {
      setIsRenaming(true)
      const updated = await updateRepository(renamingRepo.id, { title: newName })

      setRepositories(repos =>
        repos.map(r => r.id === renamingRepo.id ? { ...r, title: updated.title } : r)
      )
      setRenamingRepo(null)
    } catch (err) {
      console.error('Error renaming repository:', err)
      setError('Failed to rename checklist')
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDuplicate = async (repo: Repository) => {
    if (!user) return

    try {
      setDuplicatingId(repo.id)
      await forkRepository({
        sourceRepoId: repo.id,
        newOwnerId: user.id,
        newTitle: `${repo.title} (Copy)`,
      })
      // Reload repos to show the new one
      const repos = await getUserRepositories(user.id)
      setRepositories(repos)
      success(`"${repo.title}" duplicated successfully`)
    } catch (err) {
      console.error('Error duplicating repository:', err)
      showError('Failed to duplicate checklist')
    } finally {
      setDuplicatingId(null)
    }
  }

  return (
    <main role="main" aria-label="Dashboard" className="min-h-screen">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Greeting */}
            <div className="flex items-center gap-4">
              <div className={`${isMobile ? 'h-12 w-12' : 'h-14 w-14'} rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg shadow-primary/25`}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                  Welcome back, {user?.email?.split('@')[0]}
                </h1>
                <p className={`text-muted-foreground mt-1 ${isMobile ? 'text-sm' : ''}`}>
                  Manage your checklists and track your progress
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className={`flex ${isMobile ? 'flex-col w-full' : 'items-center'} gap-3`}>
              <Button variant="outline" asChild className={isMobile ? 'w-full' : ''}>
                <Link to="/explore">
                  <GitFork className="mr-2 h-4 w-4" />
                  Browse Templates
                </Link>
              </Button>
              <Button asChild className={`shadow-lg shadow-primary/25 ${isMobile ? 'w-full' : ''}`}>
                <Link to="/app/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Checklist
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-primary/10 flex items-center justify-center`}>
                  <ListChecks className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
                </div>
                <div>
                  <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{loading ? '—' : animatedTotal}</p>
                  <p className="text-xs text-muted-foreground">Total Checklists</p>
                </div>
              </div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-red-400/20 flex items-center justify-center`}>
                  <Play className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-red-500`} />
                </div>
                <div>
                  <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>—</p>
                  <p className="text-xs text-muted-foreground">Active Runs</p>
                </div>
              </div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-sky-300/20 flex items-center justify-center`}>
                  <Globe className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-sky-400`} />
                </div>
                <div>
                  <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{loading ? '—' : animatedPublic}</p>
                  <p className="text-xs text-muted-foreground">Public</p>
                </div>
              </div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-amber-300/20 flex items-center justify-center`}>
                  <GitFork className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-amber-400`} />
                </div>
                <div>
                  <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{loading ? '—' : animatedForked}</p>
                  <p className="text-xs text-muted-foreground">Forked</p>
                </div>
              </div>
            </div>
          </div>

          {/* Insights Row */}
          {!loading && repositories.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {/* Updated Today */}
              <div className="bg-gradient-to-br from-sky-300/15 to-cyan-200/10 backdrop-blur-sm rounded-xl p-4 border border-sky-300/30">
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-sky-300/30 flex items-center justify-center`}>
                    <Sparkles className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-sky-500`} />
                  </div>
                  <div>
                    <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-sky-500`}>
                      {animatedUpdatedToday}
                    </p>
                    <p className="text-xs text-sky-400/80">Updated Today</p>
                  </div>
                </div>
              </div>

              {/* Total Impact (Forks) */}
              <div className="bg-gradient-to-br from-violet-300/15 to-purple-200/10 backdrop-blur-sm rounded-xl p-4 border border-violet-300/30">
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-violet-300/30 flex items-center justify-center`}>
                    <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-violet-400`} />
                  </div>
                  <div>
                    <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-violet-500`}>
                      {animatedTotalForks}
                    </p>
                    <p className="text-xs text-violet-400/80">Total Forks</p>
                  </div>
                </div>
              </div>

              {/* New This Week */}
              <div className="bg-gradient-to-br from-red-400/15 to-orange-300/10 backdrop-blur-sm rounded-xl p-4 border border-red-400/30">
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-red-400/30 flex items-center justify-center`}>
                    <Plus className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-red-500`} />
                  </div>
                  <div>
                    <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-red-500`}>
                      {animatedNewThisWeek}
                    </p>
                    <p className="text-xs text-red-400/80">New This Week</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">

        {/* Section Header with Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold">Your Checklists</h2>
            <p className="text-sm text-muted-foreground">
              {loading
                ? 'Loading...'
                : searchQuery.trim() || filters.visibility !== 'all' || filters.type !== 'all' || filters.status !== 'all'
                  ? `${filteredRepositories.length} of ${repositories.length} checklist${repositories.length !== 1 ? 's' : ''}`
                  : `${repositories.length} checklist${repositories.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <div className={`w-full ${!isMobile ? 'max-w-xs' : ''}`}>
            <SearchInput
              ref={searchInputRef}
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search checklists..."
              resultCount={searchQuery.trim() ? filteredRepositories.length : undefined}
              size={isMobile ? 'large' : 'default'}
              ariaLabel="Search your checklists"
            />
          </div>
        </div>

        {/* Filter and Sort Bar */}
        {!loading && repositories.length > 0 && (
          <FilterBar
            filters={filters}
            sortBy={sortBy}
            onFiltersChange={setFilters}
            onSortChange={setSortBy}
            onClearFilters={() => setFilters(getDefaultFilters())}
          />
        )}

        {/* Color Legend */}
        {!loading && repositories.length > 0 && (
          <ColorLegend
            isExpanded={legendExpanded}
            onToggle={() => setLegendExpanded(!legendExpanded)}
          />
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-6 text-sm text-destructive flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-destructive hover:underline text-sm font-medium">
              Dismiss
            </button>
          </div>
        )}

        {/* Loading state with skeletons */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredRepositories.length === 0 ? (
          /* Empty state */
          <Card className="border-dashed">
            <CardContent className={`${isMobile ? 'py-12' : 'py-16'} text-center`}>
              <div className={`mx-auto ${isMobile ? 'w-14 h-14' : 'w-16 h-16'} bg-primary/10 rounded-full flex items-center justify-center mb-4`}>
                <ListChecks className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'} text-primary`} />
              </div>
              {searchQuery.trim() ? (
                <>
                  <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-2`}>No checklists found</h2>
                  <p className={`text-muted-foreground mb-6 max-w-sm mx-auto ${isMobile ? 'text-sm px-4' : ''}`}>
                    No checklists match <strong>"{searchQuery}"</strong>. Try different keywords or clear your search.
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery('')} className={isMobile ? 'w-full max-w-xs' : ''}>
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-2`}>No checklists yet</h2>
                  <p className={`text-muted-foreground mb-6 max-w-sm mx-auto ${isMobile ? 'text-sm px-4' : ''}`}>
                    Create your first checklist or fork one from the community to get started.
                  </p>
                  <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3 justify-center ${isMobile ? 'px-4' : ''}`}>
                    <Button asChild className={isMobile ? 'w-full' : ''}>
                      <Link to="/app/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className={isMobile ? 'w-full' : ''}>
                      <Link to="/explore">
                        <GitFork className="mr-2 h-4 w-4" />
                        Explore Templates
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Repository grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepositories.map((repo, index) => {
              // Meaningful color based on repository status
              const colorStatus = getRepoColorStatus(repo)
              const colorConfig = COLOR_LEGEND[colorStatus]

              // Visual weight based on status
              const recentlyUsed = isRecentlyUsed(repo)
              const stale = isStale(repo)
              const StatusIcon = colorConfig.icon

              return (
                <Card
                  key={repo.id}
                  hoverable
                  className={`group relative animate-fade-in overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 ${recentlyUsed
                    ? 'shadow-sm' // Recently used: subtle elevation
                    : stale
                      ? 'opacity-60' // Stale: reduced opacity
                      : ''
                    }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Colored accent bar with gradient for visual polish */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorConfig.gradient}`} />

                  <Link to={`/app/repo/${repo.id}`}>
                    <CardHeader className="pb-3 pt-5">
                      <div className="flex items-start justify-between gap-3">
                        {/* Icon with status-based color */}
                        <div className={`h-10 w-10 rounded-lg ${colorConfig.bg}/10 flex items-center justify-center shrink-0 relative`}>
                          <StatusIcon className={`h-5 w-5 ${colorConfig.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} truncate`}>{repo.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {/* Primary status badge based on color */}
                            {colorStatus !== 'default' && colorStatus !== 'public' && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${colorConfig.bg}/10 ${colorConfig.text} border-current/20`}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {colorConfig.label}
                              </Badge>
                            )}
                            <Badge variant={repo.is_public ? "default" : "secondary"} className="text-xs">
                              {repo.is_public ? (
                                <>
                                  <Globe className="h-3 w-3 mr-1" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" />
                                  Private
                                </>
                              )}
                            </Badge>
                            {repo.upstream_repo_id && colorStatus !== 'forked' && (
                              <Badge variant="outline" className="text-xs text-violet-400 border-violet-300/30">
                                <GitFork className="h-3 w-3 mr-1" />
                                Forked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {repo.description && (
                        <CardDescription className={`mt-3 line-clamp-2 ${isMobile ? 'text-sm' : ''}`}>
                          {repo.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatRelativeTime(repo.updated_at)}
                        </span>
                        {repo.fork_count > 0 && (
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            {repo.fork_count}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Link>

                  {/* Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`absolute top-3 right-3 ${isMobile
                          ? 'p-3 opacity-100' // Mobile: Always visible, 44px touch target
                          : 'p-2 opacity-0 group-hover:opacity-100 focus:opacity-100' // Desktop: Hover reveal
                          } rounded-md bg-card/90 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shadow-sm`}
                        onClick={(e) => e.preventDefault()}
                        aria-label="Actions"
                      >
                        <MoreVertical className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => navigate(`/app/repo/${repo.id}`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShareRepo(repo)}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(repo)}
                        disabled={duplicatingId === repo.id}
                      >
                        {duplicatingId === repo.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        destructive
                        onClick={() => handleDelete(repo.id, repo.title)}
                        disabled={deletingId === repo.id}
                      >
                        {deletingId === repo.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              )
            })}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>Quick Actions</span>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {/* Active Runs */}
            <Link to="/app/runs">
              <Card hoverable className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-orange-300" />
                <CardHeader className="pb-4 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-red-400/30 to-orange-300/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 text-red-500" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-base mt-4">Active Runs</CardTitle>
                  <CardDescription className="text-sm">
                    View and continue your in-progress checklists
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Recent Activity */}
            <Link to="/app/activity">
              <Card hoverable className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-300 to-cyan-200" />
                <CardHeader className="pb-4 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-sky-300/30 to-sky-200/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="h-5 w-5 text-sky-400" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-base mt-4">Recent Activity</CardTitle>
                  <CardDescription className="text-sm">
                    See your latest updates and changes
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Browse Templates */}
            <Link to="/explore">
              <Card hoverable className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-300 to-purple-200" />
                <CardHeader className="pb-4 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-300/30 to-violet-200/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GitFork className="h-5 w-5 text-violet-400" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-base mt-4">Browse Templates</CardTitle>
                  <CardDescription className="text-sm">
                    Discover proven checklists from the community
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Rename Modal */}
        <Dialog open={!!renamingRepo} onOpenChange={() => setRenamingRepo(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Checklist</DialogTitle>
              <DialogDescription>
                Enter a new name for "{renamingRepo?.title}".
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); submitRename(); }}>
              <div className="py-4">
                <label htmlFor="rename-input" className="text-sm font-medium mb-2 block">
                  Checklist Name
                </label>
                <Input
                  id="rename-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new name"
                  disabled={isRenaming}
                  autoFocus
                  aria-required="true"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRenamingRepo(null)}
                  disabled={isRenaming}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isRenaming || !newName.trim() || newName === renamingRepo?.title}
                  loading={isRenaming}
                >
                  Rename
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Share Settings Modal */}
        {shareRepo && (
          <ShareSettingsModal
            repository={shareRepo}
            isOpen={!!shareRepo}
            onClose={() => setShareRepo(null)}
            onVisibilityChange={async (newIsPublic) => {
              await updateRepository(shareRepo.id, { is_public: newIsPublic })
              setRepositories(repos =>
                repos.map(r => r.id === shareRepo.id ? { ...r, is_public: newIsPublic } : r)
              )
              setShareRepo({ ...shareRepo, is_public: newIsPublic })
            }}
            onDelete={async () => {
              await deleteRepository(shareRepo.id)
              setRepositories(repos => repos.filter(r => r.id !== shareRepo.id))
              setShareRepo(null)
            }}
          />
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  )
}
