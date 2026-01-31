import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  GitFork,
  Search,
  TrendingUp,
  Clock,
  Loader2,
  Eye,
  ListChecks,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  getPublicRepositories,
  searchPublicRepositories,
  forkRepository,
} from '@/services/repository'
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
      // Redirect to home to sign in
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Explore Templates</h1>
        <p className="text-muted-foreground mb-6">
          Discover proven checklists from the community. Fork, customize, and make them yours.
        </p>

        {/* Search */}
        <div className="relative">
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
        <Button
          variant={activeSort === 'fork_count' ? 'default' : 'ghost'}
          onClick={() => setActiveSort('fork_count')}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Most Forked
        </Button>
        <Button
          variant={activeSort === 'created_at' ? 'default' : 'ghost'}
          onClick={() => setActiveSort('created_at')}
        >
          <Clock className="mr-2 h-4 w-4" />
          Newest
        </Button>
        <Button
          variant={activeSort === 'updated_at' ? 'default' : 'ghost'}
          onClick={() => setActiveSort('updated_at')}
        >
          <Clock className="mr-2 h-4 w-4" />
          Recently Updated
        </Button>
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
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : repositories.length === 0 ? (
        <div className="text-center py-12">
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
              <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No public templates yet. Be the first to share!
              </p>
              {user && (
                <Button asChild>
                  <Link to="/app/new">Create a Template</Link>
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        /* Template Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repositories.map((repo) => (
            <Link key={repo.id} to={`/repo/${repo.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{repo.title}</CardTitle>
                    </div>
                  </div>
                  {repo.description && (
                    <CardDescription className="line-clamp-2 mt-2">
                      {repo.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GitFork className="h-4 w-4" />
                        {repo.fork_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(repo.updated_at)}
                      </span>
                    </div>
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
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => handleFork(repo, e)}
                        disabled={forkingId === repo.id}
                      >
                        {forkingId === repo.id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <GitFork className="mr-1 h-4 w-4" />
                        )}
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

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

  return date.toLocaleDateString()
}
