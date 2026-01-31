import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  GitFork,
  Search,
  TrendingUp,
  Clock,
  Eye,
  ListChecks,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  getPublicRepositories,
  searchPublicRepositories,
  forkRepository,
} from '@/services/repository'
import { formatRelativeTime } from '@/lib/date-utils'
import type { Repository } from '@/types/database'

type SortOption = 'fork_count' | 'created_at' | 'updated_at'

export function Explore() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Data state
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSort, setActiveSort] = useState<SortOption>('fork_count')

  // Fork state
  const [forkingId, setForkingId] = useState<string | null>(null)

  // Load repositories
  const loadRepositories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let repos: Repository[]
      if (searchQuery.trim()) {
        repos = await searchPublicRepositories(searchQuery)
      } else {
        repos = await getPublicRepositories({
          limit: 30,
          orderBy: activeSort,
        })
      }

      setRepositories(repos)
    } catch (err) {
      console.error('Error loading repositories:', err)
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, activeSort])

  // Initial load
  useEffect(() => {
    loadRepositories()
  }, [activeSort])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        loadRepositories()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h1 className="text-2xl font-bold tracking-tight mb-3">Explore Templates</h1>
        <p className="text-muted-foreground mb-6">
          Discover proven checklists from the community. Fork, customize, and make them yours.
        </p>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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
        <div className="text-center py-4 text-destructive mb-6">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
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
          {searchQuery ? (
            <>
              <p className="text-muted-foreground mb-4">
                No templates found matching "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            </>
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
          {repositories.map((repo, index) => (
            <Link key={repo.id} to={`/repo/${repo.id}`}>
              <Card
                hoverable
                className="h-full animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{repo.title}</CardTitle>
                    </div>
                    {repo.fork_count > 0 && (
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        <GitFork className="h-3 w-3 mr-1" />
                        {repo.fork_count}
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <CardDescription className="line-clamp-2 mt-2">
                      {repo.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(repo.updated_at)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          navigate(`/repo/${repo.id}`)
                        }}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => handleFork(repo, e)}
                        disabled={forkingId === repo.id}
                        loading={forkingId === repo.id}
                      >
                        <GitFork className="mr-1 h-3 w-3" />
                        Fork
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Load more hint */}
      {repositories.length >= 30 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Showing first 30 results. Use search to find specific templates.
        </div>
      )}
    </div>
  )
}
