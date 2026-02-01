import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/SearchInput'
import {
  GitFork,
  TrendingUp,
  Clock,
  Eye,
  ListChecks,
  Plus,
  Tag as TagIcon,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  getPublicRepositoriesWithTags,
  searchPublicRepositoriesWithTags,
  getAllTags,
  forkRepository,
} from '@/services/repository'
import { formatRelativeTime } from '@/lib/date-utils'
import { useDebounce } from '@/hooks/useDebounce'
import { SEARCH, KEYBOARD_SHORTCUTS } from '@/lib/constants'
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
  const [forkingId, setForkingId] = useState<string | null>(null)

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

  // Get unique categories from tags
  const tagCategories = tags.reduce((acc, tag) => {
    const category = tag.category || 'other'
    if (!acc.includes(category)) acc.push(category)
    return acc
  }, [] as string[])

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

  // Handle fork
  const handleFork = async (repo: Repository, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      navigate('/', { state: { returnTo: '/explore' } })
      return
    }

    setForkingId(repo.id)
    try {
      const newRepoId = await forkRepository({
        sourceRepoId: repo.id,
        newOwnerId: user.id,
      })
      navigate(`/app/repo/${newRepoId}`)
    } catch (err) {
      console.error('Error forking repository:', err)
      setError('Failed to fork template')
    } finally {
      setForkingId(null)
    }
  }

  const sortOptions: { value: SortOption; label: string; icon: typeof TrendingUp }[] = [
    { value: 'fork_count', label: 'Most Forked', icon: TrendingUp },
    { value: 'created_at', label: 'Newest', icon: Clock },
    { value: 'updated_at', label: 'Recently Updated', icon: Clock },
  ]

  return (
    <div className="min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Explore Templates
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover proven checklists from the community. Fork, customize, and make them yours.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto">
              <SearchInput
                ref={searchInputRef}
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search templates..."
                loading={searchLoading}
                resultCount={searchQuery.trim() ? repositories.length : undefined}
                size="large"
                ariaLabel="Search templates"
              />
              <div className="text-center mt-4 text-xs text-muted-foreground">
                Press <kbd className="px-2 py-0.5 bg-muted rounded border text-foreground font-mono">{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K</kbd> to focus search
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{loading ? '—' : repositories.length}</p>
              <p className="text-xs text-muted-foreground">Templates</p>
            </div>
            <div className="text-center border-l border-r border-border px-8">
              <p className="text-2xl font-bold text-primary">{loading ? '—' : repositories.reduce((sum, r) => sum + r.fork_count, 0)}</p>
              <p className="text-xs text-muted-foreground">Total Forks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">Free</p>
              <p className="text-xs text-muted-foreground">Forever</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Filters */}
      {tags.length > 0 && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filter by category:</span>
              {selectedTag && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTagSelect(null)}
                  className="h-6 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear filter
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {tagCategories.map((category) => (
                <div key={category} className="flex flex-wrap gap-1.5">
                  {tags
                    .filter((t) => (t.category || 'other') === category)
                    .slice(0, 6) // Show first 6 tags per category
                    .map((tag) => (
                      <Button
                        key={tag.id}
                        variant={selectedTag === tag.slug ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTagSelect(selectedTag === tag.slug ? null : tag.slug)}
                        className="h-7 text-xs"
                      >
                        {tag.name}
                      </Button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">

        {/* Active filter indicator */}
        {selectedTag && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary" className="px-3 py-1">
              <TagIcon className="h-3 w-3 mr-1.5" />
              {tags.find(t => t.slug === selectedTag)?.name || selectedTag}
              <button
                onClick={() => handleTagSelect(null)}
                className="ml-2 hover:text-destructive"
                aria-label="Clear tag filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* Sort Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeSort === option.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSort(option.value)}
              className="gap-2"
            >
              <option.icon className="h-4 w-4" />
              {option.label}
            </Button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="text-center py-4 text-destructive mb-6 bg-destructive/10 border border-destructive/20 rounded-lg px-4">
            <p className="font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 underline text-sm hover:no-underline transition-all"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : repositories.length === 0 ? (
          <div className="text-center py-16">
            {searchQuery.trim() ? (
              <div className="max-w-md mx-auto">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ListChecks className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any templates matching <strong>"{searchQuery}"</strong>
                </p>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Try:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Using different keywords</li>
                    <li>• Checking for typos</li>
                    <li>• Using more general terms</li>
                  </ul>
                  <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4">
                    Clear search and browse all
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ListChecks className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  No public templates yet. Be the first to share!
                </p>
                {user && (
                  <Button asChild>
                    <Link to="/app/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create a Template
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          /* Template Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo, index) => {
              // Generate consistent color based on title - using pastel colors
              const colors = ['bg-primary/80', 'bg-emerald-300', 'bg-sky-300', 'bg-violet-300', 'bg-amber-300', 'bg-pink-300']
              const colorIndex = repo.title.length % colors.length
              const accentColor = colors[colorIndex]

              return (
                <Link key={repo.id} to={`/repo/${repo.id}`}>
                  <Card
                    hoverable
                    className="h-full animate-fade-in relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Colored accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />

                    <CardHeader className="pb-3 pt-5">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`h-10 w-10 rounded-lg ${accentColor}/10 flex items-center justify-center shrink-0`}>
                          <ListChecks className={`h-5 w-5 ${accentColor.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{repo.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1.5">
                            {repo.fork_count > 0 && (
                              <Badge variant="default" className="text-xs">
                                <GitFork className="h-3 w-3 mr-1" />
                                {repo.fork_count} forks
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              Template
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {repo.description && (
                        <CardDescription className="line-clamp-2 mt-3">
                          {repo.description}
                        </CardDescription>
                      )}
                      {/* Tags */}
                      {repo.tags && repo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {repo.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-primary/10"
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
                            <Badge variant="outline" className="text-xs">
                              +{repo.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatRelativeTime(repo.updated_at)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              navigate(`/repo/${repo.id}`)
                            }}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 shadow-sm"
                            onClick={(e) => handleFork(repo, e)}
                            disabled={forkingId === repo.id}
                            loading={forkingId === repo.id}
                          >
                            <GitFork className="mr-1 h-3.5 w-3.5" />
                            Fork
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
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
    </div>
  )
}
