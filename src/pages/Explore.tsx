import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/SearchInput'
import { ForkModal } from '@/components/ForkModal'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import {
  GitForkIcon,
  AnalyticsUpIcon,
  Clock01Icon,
  EyeIcon,
  CheckListIcon,
  PlusSignIcon,
  Tag01Icon,
  Cancel01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { useAuthStore } from '@/stores/auth-store'
import {
  getPublicRepositoriesWithTags,
  searchPublicRepositoriesWithTags,
  getAllTags,
} from '@/services/repository'
import { formatRelativeTime } from '@/lib/date-utils'
import { useDebounce } from '@/hooks/useDebounce'
import { SEARCH, KEYBOARD_SHORTCUTS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Tag, RepositoryWithTags, Repository } from '@/types/database'

type SortOption = 'fork_count' | 'created_at' | 'updated_at'

export function Explore() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()

  // Data state
  const [repositories, setRepositories] = useState<RepositoryWithTags[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSort, setActiveSort] = useState<SortOption>('fork_count')
  const [selectedTag, setSelectedTag] = useState<string | null>(searchParams.get('tag'))
  const [searchLoading, setSearchLoading] = useState(false)

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH.debounceMs)

  // Fork state
  const [forkModalOpen, setForkModalOpen] = useState(false)
  const [selectedRepoForFork, setSelectedRepoForFork] = useState<Repository | null>(null)

  // Toast notifications
  const { toasts, dismissToast, success } = useToast()

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load tags on mount
  useEffect(() => {
    async function loadTags() {
      try {
        const allTags = await getAllTags()
        setTags(allTags)
      } catch (err) {
        console.error('Error loading tags:', err)
      }
    }
    loadTags()
  }, [])

  // Load repositories
  const loadRepositories = useCallback(async (isSearch = false) => {
    try {
      if (isSearch) {
        setSearchLoading(true)
      } else {
        setLoading(true)
      }
      setError(null)

      let repos: RepositoryWithTags[]
      if (debouncedSearchQuery.trim()) {
        repos = await searchPublicRepositoriesWithTags(debouncedSearchQuery)
        // Client-side filter by tag if both search and tag are active
        if (selectedTag) {
          repos = repos.filter(r => r.tags?.some(t => t.slug === selectedTag))
        }
      } else {
        repos = await getPublicRepositoriesWithTags({
          limit: 50,
          orderBy: activeSort,
          tagSlug: selectedTag || undefined,
        })
      }

      setRepositories(repos)
    } catch (err) {
      console.error('Error loading repositories:', err)
      setError('Failed to load templates')
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }, [debouncedSearchQuery, activeSort, selectedTag])

  // Initial load and when filters change
  useEffect(() => {
    loadRepositories(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSort, selectedTag])

  // Handle tag selection
  const handleTagSelect = (tagSlug: string | null) => {
    setSelectedTag(tagSlug)
    if (tagSlug) {
      setSearchParams({ tag: tagSlug })
    } else {
      setSearchParams({})
    }
  }

  // Debounced search effect
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) return // Still typing
    if (searchQuery.trim()) {
      loadRepositories(true)
    } else if (debouncedSearchQuery === '' && searchQuery === '') {
      // Search was cleared, reload default view
      loadRepositories(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, searchQuery])

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

  // Handle fork button click
  const handleForkClick = (repo: Repository, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      navigate('/', { state: { returnTo: '/explore' } })
      return
    }

    setSelectedRepoForFork(repo)
    setForkModalOpen(true)
  }

  // Handle successful fork
  const handleForkSuccess = (_newRepoId: string, itemCount: number) => {
    success(`Successfully forked ${itemCount} items to your checklist!`, 5000)
  }

  const sortOptions: { value: SortOption; label: string; icon: typeof AnalyticsUpIcon }[] = [
    { value: 'fork_count', label: 'Most Forked', icon: AnalyticsUpIcon },
    { value: 'created_at', label: 'Newest', icon: Clock01Icon },
    { value: 'updated_at', label: 'Recently Updated', icon: Clock01Icon },
  ]

  // Color palette for cards
  const getAccentColor = (title: string) => {
    const colors = [
      { bg: 'bg-primary/10', text: 'text-primary', gradient: 'from-primary to-orange-400' },
      { bg: 'bg-emerald-500/10', text: 'text-emerald-500', gradient: 'from-emerald-500 to-teal-400' },
      { bg: 'bg-sky-500/10', text: 'text-sky-500', gradient: 'from-sky-500 to-cyan-400' },
      { bg: 'bg-violet-500/10', text: 'text-violet-500', gradient: 'from-violet-500 to-purple-400' },
      { bg: 'bg-amber-500/10', text: 'text-amber-500', gradient: 'from-amber-500 to-yellow-400' },
      { bg: 'bg-pink-500/10', text: 'text-pink-500', gradient: 'from-pink-500 to-rose-400' },
    ]
    return colors[title.length % colors.length]
  }

  return (
    <div className="min-h-screen">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-orange-500/5 border-b">
        {/* Mesh gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Floating template previews - decorative */}
        <motion.div
          initial={{ opacity: 0, x: -50, rotate: -15 }}
          animate={{ opacity: 0.25, x: 0, rotate: -12 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute top-20 left-[5%] w-48 h-32 bg-card/50 backdrop-blur-sm rounded-lg border shadow-lg hidden xl:block pointer-events-none"
        >
          <div className="p-3">
            <div className="h-3 w-24 bg-muted rounded mb-2" />
            <div className="h-2 w-full bg-muted/50 rounded mb-1" />
            <div className="h-2 w-3/4 bg-muted/50 rounded" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50, rotate: 15 }}
          animate={{ opacity: 0.25, x: 0, rotate: 8 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="absolute bottom-20 right-[5%] w-48 h-32 bg-card/50 backdrop-blur-sm rounded-lg border shadow-lg hidden xl:block pointer-events-none"
        >
          <div className="p-3">
            <div className="h-3 w-20 bg-muted rounded mb-2" />
            <div className="h-2 w-full bg-muted/50 rounded mb-1" />
            <div className="h-2 w-2/3 bg-muted/50 rounded" />
          </div>
        </motion.div>

        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-2xl mx-auto text-center">
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
            >
              <Icon icon={SparklesIcon} className="h-4 w-4" />
              Community Templates
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
            >
              Explore <span className="text-gradient-primary">Templates</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 leading-relaxed px-4"
            >
              Discover battle-tested checklists from the community. Fork, customize, and make them yours.
            </motion.p>

            {/* Premium search input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-lg mx-auto"
            >
              <SearchInput
                ref={searchInputRef}
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search templates..."
                loading={searchLoading}
                resultCount={searchQuery.trim() ? repositories.length : undefined}
                size="large"
                ariaLabel="Search templates"
                className="shadow-lg shadow-black/5"
              />
            </motion.div>
          </div>

          {/* Enhanced stats row */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 mt-8 sm:mt-12 px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-gradient-primary">
                {loading ? '—' : repositories.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Templates</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center sm:border-l sm:border-r border-border sm:px-8"
            >
              <p className="text-3xl font-bold text-gradient-primary">
                {loading ? '—' : repositories.reduce((sum, r) => sum + r.fork_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Forks</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-emerald-500">Free</p>
              <p className="text-sm text-muted-foreground mt-1">Forever</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sticky Tag Filter Bar with Glassmorphism */}
      {tags.length > 0 && (
        <div className="border-b sticky top-0 z-20 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <Icon icon={Tag01Icon} className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Filter:</span>
              </div>

              {/* Scrollable tag container */}
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-1">
                  {tags.map((tag) => (
                    <Button
                      key={tag.id}
                      variant={selectedTag === tag.slug ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTagSelect(selectedTag === tag.slug ? null : tag.slug)}
                      className={cn(
                        "h-8 text-xs shrink-0 transition-all",
                        selectedTag === tag.slug && "shadow-md shadow-primary/25"
                      )}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Clear filter button - animated appearance */}
              <AnimatePresence>
                {selectedTag && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTagSelect(null)}
                      className="h-8 px-3 text-xs shrink-0"
                    >
                      <Icon icon={Cancel01Icon} className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Sort Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeSort === option.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSort(option.value)}
              className={cn(
                "gap-2 transition-all",
                activeSort === option.value && "shadow-md shadow-primary/25"
              )}
            >
              <Icon icon={option.icon} className="h-4 w-4" />
              {option.label}
            </Button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4 text-destructive mb-6 bg-destructive/10 border border-destructive/20 rounded-lg px-4"
          >
            <p className="font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 underline text-sm hover:no-underline transition-all"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : repositories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            {searchQuery.trim() ? (
              <div className="max-w-md mx-auto">
                <div className="mx-auto w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
                  <Icon icon={CheckListIcon} className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any templates matching "<span className="font-medium text-foreground">{searchQuery}</span>"
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear search and browse all
                </Button>
              </div>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
                  <Icon icon={CheckListIcon} className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  No public templates yet. Be the first to share!
                </p>
                {user && (
                  <Button asChild>
                    <Link to="/app/new">
                      <Icon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                      Create a Template
                    </Link>
                  </Button>
                )}
              </>
            )}
          </motion.div>
        ) : (
          /* Premium Template Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo, index) => {
              const accent = getAccentColor(repo.title)

              return (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link to={`/repo/${repo.id}`}>
                    <Card
                      className={cn(
                        "group h-full relative overflow-hidden",
                        "transition-all duration-300",
                        "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
                      )}
                    >
                      {/* Gradient accent bar - animated on hover */}
                      <div className={cn(
                        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-300",
                        accent.gradient,
                        "group-hover:h-1.5"
                      )} />

                      {/* Background glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <CardHeader className="relative pb-3 pt-6">
                        <div className="flex items-start gap-4">
                          {/* Icon container with scale animation */}
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300",
                            accent.bg,
                            "group-hover:scale-110 group-hover:shadow-lg"
                          )}>
                            <Icon icon={CheckListIcon} className={cn("h-6 w-6", accent.text)} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                              {repo.title}
                            </CardTitle>

                            {/* Stats row */}
                            <div className="flex items-center gap-3 mt-2">
                              {repo.fork_count > 0 && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Icon icon={GitForkIcon} className="h-3.5 w-3.5 text-primary" />
                                  <span className="font-medium text-primary">{repo.fork_count}</span>
                                  <span className="text-muted-foreground">forks</span>
                                </div>
                              )}
                              <Badge variant="secondary" className="text-[10px]">Template</Badge>
                            </div>
                          </div>
                        </div>

                        {repo.description && (
                          <CardDescription className="mt-4 line-clamp-2 leading-relaxed">
                            {repo.description}
                          </CardDescription>
                        )}

                        {/* Tags */}
                        {repo.tags && repo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {repo.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="outline"
                                className="text-[10px] h-5 bg-background/50 hover:bg-primary/10 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleTagSelect(tag.slug)
                                }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {repo.tags.length > 3 && (
                              <Badge variant="outline" className="text-[10px] h-5">
                                +{repo.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Icon icon={Clock01Icon} className="h-3.5 w-3.5" />
                            {formatRelativeTime(repo.updated_at)}
                          </span>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                navigate(`/repo/${repo.id}`)
                              }}
                            >
                              <Icon icon={EyeIcon} className="mr-1.5 h-3.5 w-3.5" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 shadow-sm hover:shadow-md transition-shadow"
                              onClick={(e) => handleForkClick(repo, e)}
                            >
                              <Icon icon={GitForkIcon} className="mr-1.5 h-3.5 w-3.5" />
                              Fork
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Load more hint */}
        {repositories.length >= 30 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Showing first 30 results. Use search to find specific templates.
          </div>
        )}
      </div>

      {/* Fork Modal */}
      <ForkModal
        repository={selectedRepoForFork}
        isOpen={forkModalOpen}
        onClose={() => {
          setForkModalOpen(false)
          setSelectedRepoForFork(null)
        }}
        onSuccess={handleForkSuccess}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
