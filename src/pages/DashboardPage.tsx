import { useEffect, useState, useMemo, useRef } from 'react'
import { SearchInput } from '@/components/SearchInput' // Kept global generic
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShareSettingsModal } from '@/components/ShareSettingsModal'
import { StartRunModal } from '@/components/StartRunModal'
import { useAuthStore } from '@/stores/auth-store'
import { getUserRepositories, deleteRepository, updateRepository, forkRepository } from '@/services/repository'
import { getMyActiveRuns } from '@/services/run'
import { getUserActivity, type ActivityItem } from '@/services/activity'
import { KEYBOARD_SHORTCUTS } from '@/lib/constants'
import {
  calculateStats,
  applyFilters,
  sortRepositories,
  getDefaultFilters,
  type FilterState,
  type SortOption,
} from '@/lib/dashboard-utils'
import type { Repository, Run, RepositoryWithTags } from '@/types/database'

// New modular components
import { DashboardHeader } from '@/pages/dashboard/DashboardHeader'
import { DashboardStats } from '@/pages/dashboard/DashboardStats'
import { DashboardFilters } from '@/pages/dashboard/DashboardFilters'
import { RepositoryList } from '@/pages/dashboard/RepositoryList'
import { ActivityFeed } from '@/pages/dashboard/ActivityFeed'
import { EmptyState } from '@/pages/dashboard/EmptyState'
import { SmartImportModal } from '@/components/SmartImportModal'

export function Dashboard() {
  const { user } = useAuthStore()
  // const navigate = useNavigate()
  const { toasts, dismissToast, success, error: showError } = useToast()

  // Data State
  const [repositories, setRepositories] = useState<RepositoryWithTags[]>([])
  const [activeRuns, setActiveRuns] = useState<(Run & { repository: { title: string; owner_id: string } })[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter/Sort State
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem('dashboard-filters')
    return saved ? JSON.parse(saved) : getDefaultFilters()
  })
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem('dashboard-sort')
    return (saved as SortOption) || 'updated'
  })

  // Modal States
  const [renamingRepo, setRenamingRepo] = useState<Repository | null>(null)
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [shareRepo, setShareRepo] = useState<Repository | null>(null)
  const [repoToRun, setRepoToRun] = useState<Repository | null>(null)
  const [runModalOpen, setRunModalOpen] = useState(false)
  const [, setDeletingId] = useState<string | null>(null)
  const [, setDuplicatingId] = useState<string | null>(null)
  const [smartImportOpen, setSmartImportOpen] = useState(false)

  // -- Effects --

  // Persistence
  useEffect(() => {
    localStorage.setItem('dashboard-filters', JSON.stringify(filters))
  }, [filters])

  useEffect(() => {
    localStorage.setItem('dashboard-sort', sortBy)
  }, [sortBy])

  // Keyboard Shortcuts
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

  // Data Loading
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        const [repos, runs, act] = await Promise.all([
          getUserRepositories(user.id),
          getMyActiveRuns(user.id),
          getUserActivity(user.id)
        ])
        setRepositories(repos)
        setActiveRuns(runs)
        setActivity(act)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  // -- Computed --

  const filteredRepositories = useMemo(() => {
    let filtered = repositories
    // 1. Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = repositories.filter((repo) => {
        const titleMatch = repo.title.toLowerCase().includes(query)
        const descriptionMatch = repo.description?.toLowerCase().includes(query)
        return titleMatch || descriptionMatch
      })
    }
    // 2. Filters
    filtered = applyFilters(filtered, filters)
    // 3. Sort
    filtered = sortRepositories(filtered, sortBy)

    return filtered
  }, [repositories, searchQuery, filters, sortBy])

  const stats = useMemo(() => {
    const calculated = calculateStats(repositories)
    // Enrich with active runs if needed, although calculateStats logic might use DB query results normally
    // Here we override activeRuns from the separate fetch
    return { ...calculated, activeRuns: activeRuns.length }
  }, [repositories, activeRuns])

  // -- Handlers --

  const handleRun = (repo: Repository) => {
    setRepoToRun(repo)
    setRunModalOpen(true)
  }

  // const handleEdit = (repo: Repository) => {
  //   navigate(`/app/repo/${repo.id}`)
  // }


  const handleDelete = async (repoId: string, title: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)
    if (!confirmDelete) return

    const previousRepos = [...repositories]
    setRepositories(repos => repos.filter(r => r.id !== repoId)) // Optimistic

    try {
      setDeletingId(repoId)
      await deleteRepository(repoId)
      success(`"${title}" deleted successfully`)
    } catch (err) {
      console.error('Error deleting repository:', err)
      setRepositories(previousRepos) // Rollback
      showError('Failed to delete checklist')
    } finally {
      setDeletingId(null)
    }
  }

  // NOTE: Rename is not on the card menu in the new design (Pencil goes to Edit), 
  // but if we need it, we can expose it. Keeping state for it just in case.

  const handleDuplicate = async (repo: Repository) => {
    if (!user) return
    try {
      setDuplicatingId(repo.id)
      await forkRepository({
        sourceRepoId: repo.id,
        newOwnerId: user.id,
        newTitle: `${repo.title} (Copy)`,
      })
      // Reload
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

  // Rename Logic (if needed later or re-added)
  const submitRename = async () => {
    if (!renamingRepo || !newName.trim()) return
    try {
      setIsRenaming(true)
      const updated = await updateRepository(renamingRepo.id, { title: newName })
      setRepositories(repos =>
        repos.map(r => r.id === renamingRepo.id ? { ...r, title: updated.title } : r)
      )
      setRenamingRepo(null)
      success('Renamed successfully')
    } catch (err) {
      console.error(err)
      setError('Failed to rename')
    } finally {
      setIsRenaming(false)
    }
  }

  return (
    <main role="main" aria-label="Dashboard" className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">

        {/* Header */}
        <DashboardHeader
          userEmail={user?.email}
          activeRunsCount={activeRuns.length}
          onSmartImport={() => setSmartImportOpen(true)}
        />

        {/* Hero Stats */}
        <DashboardStats loading={loading} stats={stats} filters={filters} onFiltersChange={setFilters} />

        {/* Main Content Areas */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main Column: Filters + List */}
          <div className="flex-1 min-w-0">

            {/* Search & Tool Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold tracking-tight">Your Checklists</h2>
              <div className="relative flex-1 sm:max-w-md">
                <SearchInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search checklists..."
                  resultCount={searchQuery.trim() ? filteredRepositories.length : undefined}
                />
              </div>
            </div>

            {/* Filters */}
            <DashboardFilters
              filters={filters}
              sortBy={sortBy}
              onFiltersChange={setFilters}
              onSortChange={setSortBy}
              loading={loading}
              hasRepositories={repositories.length > 0}
            />

            {/* Error Banner */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 text-sm text-destructive flex justify-between items-center">
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-auto p-0 text-destructive hover:bg-transparent hover:underline">Dismiss</Button>
              </div>
            )}

            {/* Content */}
            {!loading && filteredRepositories.length === 0 ? (
              <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
            ) : (
              <RepositoryList
                repositories={filteredRepositories}
                loading={loading}
                onRun={handleRun}
                onShare={setShareRepo}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            )}
          </div>

          {/* Sidebar Column: Activity Feed */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <ActivityFeed activities={activity} loading={loading} />

            {/* Future: Team activity or Pinned items could go here */}
          </div>

        </div>
      </div>

      {/* --- Modals --- */}

      {/* Run Modal */}
      <StartRunModal
        repository={repoToRun}
        isOpen={runModalOpen}
        onClose={() => {
          setRunModalOpen(false)
          setRepoToRun(null)
        }}
        onSuccess={() => {
          getMyActiveRuns(user!.id).then(setActiveRuns)
          setRunModalOpen(false)
          setRepoToRun(null)
        }}
      />

      {/* Share Modal */}
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
            // If deleting from share modal
            await deleteRepository(shareRepo.id)
            setRepositories(repos => repos.filter(r => r.id !== shareRepo.id))
            setShareRepo(null)
          }}
        />
      )}

      {/* Rename Modal (Hidden unless needed/triggered) */}
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
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRenamingRepo(null)}>Cancel</Button>
              <Button type="submit" disabled={isRenaming || !newName.trim()}>Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Smart Import Modal */}
      <SmartImportModal
        open={smartImportOpen}
        onClose={async () => {
          setSmartImportOpen(false);
          // Refresh repositories after import
          if (user) {
            const repos = await getUserRepositories(user.id);
            setRepositories(repos);
          }
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  )
}
