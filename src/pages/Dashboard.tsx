import { useEffect, useState, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/SearchInput'
import { FilterBar } from '@/components/FilterBar'
import { ToastContainer } from '@/components/Toast'
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
import { StartRunModal } from '@/components/StartRunModal'
import { Plus, GitFork, Play, Clock, Trash2, Pencil, ListChecks, MoreVertical, Share2, Copy, Info, ChevronDown, ChevronUp, Zap, Star, Eye, AlertCircle, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime } from '@/lib/date-utils'
import { getUserRepositories, deleteRepository, updateRepository, forkRepository } from '@/services/repository'
import { getMyActiveRuns } from '@/services/run'
import { RunCard } from '@/components/RunCard'
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
import type { Repository, Run } from '@/types/database'

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
// Color Legend Component - Compact Dropdown
function ColorLegend() {
  const visibleStatuses: ColorStatus[] = ['dormant', 'public', 'forked', 'popular', 'new', 'recently-used']

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
          <Info className="h-4 w-4" />
          <span className="sr-only">Color Guide</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-4">
        <h4 className="font-semibold mb-3 text-sm">Color Guide</h4>
        <div className="grid grid-cols-2 gap-3">
          {visibleStatuses.map((status) => {
            const config = COLOR_LEGEND[status]
            const Icon = config.icon
            return (
              <div
                key={status}
                className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${config.bg} shrink-0 mt-0.5 ring-2 ring-offset-2 ring-offset-popover ${config.bg}/30`} />
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
        <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t">
          Colors indicate checklist status and history.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { toasts, dismissToast, success, error: showError } = useToast()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [activeRuns, setActiveRuns] = useState<(Run & { repository: { title: string; owner_id: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setDeletingId] = useState<string | null>(null)
  const [, setDuplicatingId] = useState<string | null>(null)

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

  // Run modal state
  const [repoToRun, setRepoToRun] = useState<Repository | null>(null)
  const [runModalOpen, setRunModalOpen] = useState(false)

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
  const animatedActiveRuns = useCountUp(activeRuns.length, 800, !loading)

  useEffect(() => {
    async function loadRepositories() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        const [repos, activeRunsData] = await Promise.all([
          getUserRepositories(user.id),
          getMyActiveRuns(user.id)
        ])
        setRepositories(repos)
        setActiveRuns(activeRunsData)
      } catch (err) {
        console.error('Error loading data:', err)
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
      <div className="container mx-auto px-4 py-6">
        {/* Header: Greeting & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.email?.split('@')[0]}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              You have {activeRuns.length} active run{activeRuns.length !== 1 ? 's' : ''} in progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild size="sm">
              <Link to="/explore">
                <GitFork className="mr-2 h-4 w-4" />
                Templates
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/app/new">
                <Plus className="mr-2 h-4 w-4" />
                New Checklist
              </Link>
            </Button>
          </div>
        </div>

        {/* Minimal Stats Row */}
        {!loading && repositories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-sm">
              <span className="text-sm text-muted-foreground font-medium">My Checklists</span>
              <span className="text-lg font-bold">{animatedTotal}</span>
            </div>
            <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-sm">
              <span className="text-sm text-muted-foreground font-medium">Active Runs</span>
              <span className="text-lg font-bold text-primary">{animatedActiveRuns}</span>
            </div>
            <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-sm">
              <span className="text-sm text-muted-foreground font-medium">Public</span>
              <span className="text-lg font-bold">{animatedPublic}</span>
            </div>
            <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-sm">
              <span className="text-sm text-muted-foreground font-medium">Forked</span>
              <span className="text-lg font-bold">{animatedForked}</span>
            </div>
          </div>
        )}

        {/* Priority Section: Active Runs */}
        {activeRuns.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Play className="h-5 w-5 text-primary fill-primary/20" />
                Active Runs
              </h2>
              <Link to="/app/runs" className="text-sm text-primary hover:underline">
                View all runs
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRuns.slice(0, 3).map(run => (
                <div key={run.id} className="transform transition-all duration-200 hover:-translate-y-1">
                  <RunCard run={run} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">

        {/* Section Header with Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold">Your Checklists</h2>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <SearchInput
                ref={searchInputRef}
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search..."
                resultCount={searchQuery.trim() ? filteredRepositories.length : undefined}
                size="default"
                ariaLabel="Search checklists"
              />
            </div>
            {/* Filter Toggle could go here if needed, keeping it simple for now */}
          </div>
        </div>

        {/* Filters & Legend (Collapsible/Minimal) */}
        {!loading && repositories.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <FilterBar
              filters={filters}
              sortBy={sortBy}
              onFiltersChange={setFilters}
              onSortChange={setSortBy}
              onClearFilters={() => setFilters(getDefaultFilters())}
            />
            <div className="ml-4">
              {/* Minimal Legend Trigger */}
              <ColorLegend
                isExpanded={legendExpanded}
                onToggle={() => setLegendExpanded(!legendExpanded)}
              />
            </div>
          </div>
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
          <Card className="border-dashed bg-muted/50">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
                <ListChecks className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No checklists found</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {searchQuery ? `No matches for "${searchQuery}"` : "Get started by creating your first checklist."}
              </p>
              {searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery('')}>Clear search</Button>
              ) : (
                <Button onClick={() => navigate('/app/new')}>Create Checklist</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* New Clean Repository Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRepositories.map((repo) => {
              const colorStatus = getRepoColorStatus(repo)
              const colorConfig = COLOR_LEGEND[colorStatus]
              const StatusIcon = colorConfig.icon

              return (
                <Card
                  key={repo.id}
                  className="group hover:shadow-md transition-all duration-200 border-l-4"
                  style={{ borderLeftColor: colorStatus === 'dormant' ? undefined : `var(--${colorConfig.text.split('-')[1]}-400)` }}
                >
                  <div className={`h-full flex flex-col ${colorStatus === 'dormant' ? 'opacity-70 hover:opacity-100' : ''}`}>
                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className={`h-8 w-8 rounded bg-muted/50 flex items-center justify-center shrink-0`}>
                          <StatusIcon className={`h-4 w-4 ${colorConfig.text}`} />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/app/repo/${repo.id}`)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShareRepo(repo)}>
                              <Share2 className="mr-2 h-4 w-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(repo)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => handleDelete(repo.id, repo.title)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <Link to={`/app/repo/${repo.id}`} className="block group-hover:text-primary transition-colors">
                        <h3 className="font-semibold text-base mb-1 truncate" title={repo.title}>
                          {repo.title}
                        </h3>
                      </Link>

                      {repo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 h-10">
                          {repo.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-auto text-xs text-muted-foreground">
                        <Badge variant="secondary" className="font-normal text-[10px] h-5 px-1.5">
                          {repo.is_public ? 'Public' : 'Private'}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(repo.updated_at)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full text-xs h-8"
                        onClick={() => {
                          setRepoToRun(repo)
                          setRunModalOpen(true)
                        }}
                      >
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                        Run Checklist
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}



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

        {/* Start Run Modal */}
        <StartRunModal
          repository={repoToRun}
          isOpen={runModalOpen}
          onClose={() => {
            setRunModalOpen(false)
            setRepoToRun(null)
          }}
          onSuccess={() => {
            // Refresh active runs if needed, or just close
            getMyActiveRuns(user!.id).then(setActiveRuns)
            setRunModalOpen(false)
            setRepoToRun(null)
          }}
        />
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  )
}
